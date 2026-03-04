'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Copy, Check } from 'lucide-react';

interface QrCodeSectionProps {
    itemId: string;
    brand: string;
    model: string;
}

export const QrCodeSection = ({ itemId, brand, model }: QrCodeSectionProps) => {
    const [copied, setCopied] = React.useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const shortId = itemId.substring(0, 8).toUpperCase();
    const qrValue = `HA-${shortId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(`#${shortId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Label – ${brand} ${model}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    /* Remove margin fully from page to hide browser default header/footer */
                    @page { 
                        size: 62mm 62mm;
                        margin: 0; 
                    }
                    html, body {
                        width: 100%;
                        height: 100%;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white;
                        padding: 10mm;
                    }
                    .label {
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        height: 100%;
                    }
                    .label svg { margin: 0 auto 10px; }
                    .id {
                        font-family: 'SF Mono', 'Fira Code', monospace;
                        font-size: 16px;
                        font-weight: 700;
                        letter-spacing: 1px;
                        margin-bottom: 2px;
                        color: #000;
                    }
                    .brand { font-size: 14px; font-weight: 600; color: #000; }
                    .model { font-size: 12px; color: #555; }
                    
                    @media print {
                        html, body {
                            width: 62mm;
                            height: 62mm;
                            overflow: hidden;
                        }
                        body { 
                            align-items: center; 
                            justify-content: center;
                            padding: 2mm;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="label">
                    <div id="qr-placeholder"></div>
                    <div class="id">#${shortId}</div>
                    <div class="brand">${brand}</div>
                    <div class="model">${model || ''}</div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 300);
                    };
                </script>
            </body>
            </html>
        `);

        // Render QR code into the print window
        const qrContainer = printWindow.document.getElementById('qr-placeholder');
        if (qrContainer && printRef.current) {
            const svgElement = printRef.current.querySelector('svg');
            if (svgElement) {
                const clonedSvg = svgElement.cloneNode(true) as SVGElement;
                clonedSvg.setAttribute('width', '140');
                clonedSvg.setAttribute('height', '140');
                qrContainer.appendChild(printWindow.document.adoptNode(clonedSvg));
            }
        }

        printWindow.document.close();
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-stone-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-5">QR-Code & Artikel-ID</h3>

            <div className="flex items-center gap-6">
                {/* QR Code */}
                <div ref={printRef} className="flex-shrink-0 bg-white p-3 rounded-2xl border border-stone-100 dark:border-zinc-700">
                    <QRCodeSVG
                        value={qrValue}
                        size={100}
                        level="M"
                        bgColor="white"
                        fgColor="black"
                    />
                </div>

                {/* ID & Actions */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div>
                        <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Artikel-ID</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-lg font-bold text-stone-900 dark:text-white tracking-wider">#{shortId}</span>
                            <button
                                onClick={handleCopy}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                                title="ID kopieren"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-bold transition-colors"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Label drucken
                    </button>
                </div>
            </div>
        </div>
    );
};
