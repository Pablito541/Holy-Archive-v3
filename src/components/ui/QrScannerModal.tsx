'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, ScanLine } from 'lucide-react';
// Remove static import to reduce bundle size
// import { Html5Qrcode } from 'html5-qrcode';
interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

export const QrScannerModal = ({ isOpen, onClose, onScan }: QrScannerModalProps) => {
    const scannerRef = useRef<any>(null);
    const isRunningRef = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const stopScanner = async () => {
        if (scannerRef.current && isRunningRef.current) {
            try {
                await scannerRef.current.stop();
            } catch { /* already stopped */ }
            isRunningRef.current = false;
        }
        scannerRef.current = null;
    };

    useEffect(() => {
        if (!isOpen || !isMounted) return;

        let mounted = true;
        setError(null);
        setIsStarting(true);

        const startScanner = async () => {
            try {
                // Load dynamically
                const { Html5Qrcode } = await import('html5-qrcode');
                const scanner = new Html5Qrcode('qr-scanner-region');
                scannerRef.current = scanner as any;

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        // Responsive qrbox to prevent overflowing intrinsic view width on varying mobile screens
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                            const qrboxSize = Math.floor(minEdgeSize * 0.75); // 75% of container size
                            return { width: qrboxSize, height: qrboxSize };
                        },
                        // Removing aspectRatio constraint since forcing 1:1 can cause issues/stretching on iOS Safari
                    },
                    (decodedText) => {
                        // Extract short ID from scanned value
                        let searchId = decodedText;
                        if (searchId.startsWith('HA-')) {
                            searchId = searchId.substring(3);
                        }
                        if (searchId.startsWith('#')) {
                            searchId = searchId.substring(1);
                        }

                        onScan(searchId);
                        handleClose();
                    },
                    () => { /* ignore scan failures */ }
                );

                isRunningRef.current = true;
                if (mounted) setIsStarting(false);
            } catch (err: any) {
                isRunningRef.current = false;
                if (mounted) {
                    setIsStarting(false);
                    if (err?.toString().includes('NotAllowedError')) {
                        setError('Kamerazugriff wurde verweigert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.');
                    } else {
                        setError('Kamera konnte nicht gestartet werden.');
                    }
                }
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(startScanner, 100);

        return () => {
            mounted = false;
            clearTimeout(timer);
            stopScanner();
        };
    }, [isOpen, isMounted]);

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    if (!isOpen || !isMounted) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

                {/* Modal */}
                <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-stone-500 dark:text-zinc-400" />
                            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">QR-Code scannen</h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scanner Area */}
                    <div className="p-6">
                        <div
                            ref={containerRef}
                            className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black"
                        >
                            <div id="qr-scanner-region" className="w-full h-full" />

                            {isStarting && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-3">
                                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="text-sm font-medium">Kamera wird gestartet…</span>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <p className="mt-4 text-center text-xs text-stone-400 dark:text-zinc-500">
                            Halte den QR-Code des Artikels vor die Kamera
                        </p>
                    </div>
                </div>
            </div>

            {/* Global override for html5-qrcode video element to prevent stretching on iOS */}
            <style jsx global>{`
                #qr-scanner-region {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                #qr-scanner-region video {
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                }
            `}</style>
        </>,
        document.body
    );
};
