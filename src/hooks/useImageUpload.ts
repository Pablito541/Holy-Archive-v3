import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseImageUploadProps {
    initialImageUrls?: string[];
    isBulkMode?: boolean;
    bulkQuantity?: number;
}

export const useImageUpload = ({
    initialImageUrls = [],
    isBulkMode = false,
    bulkQuantity = 1,
    orgId
}: UseImageUploadProps & { orgId?: string | null } = {}) => {
    const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const maxImages = isBulkMode ? bulkQuantity : 5;
        const totalImages = imageUrls.length + imagePreviews.length + files.length;
        if (totalImages > maxImages) {
            setError(`Maximal ${maxImages} Bilder erlaubt`);
            return;
        }
        
        setError(null);
        setSuccess(false);

        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        for (let i = 0; i < files.length && i < (maxImages - imageUrls.length - imagePreviews.length); i++) {
            const file = files[i];

            if (file.size > 10 * 1024 * 1024) {
                setError(`Die Datei "${file.name}" ist zu groß (Maximal 10MB).`);
                continue;
            }

            if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
                setError(`Dateityp von "${file.name}" nicht erlaubt. Nur JPEG, PNG, WebP und PDF erlaubt.`);
                continue;
            }

            newFiles.push(file);

            if (file.type === 'application/pdf') {
                newPreviews.push('pdf-document');
                if (newPreviews.length === newFiles.length) {
                    setImagePreviews(prev => [...prev, ...newPreviews]);
                }
            } else {
                // Create preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPreviews.push(reader.result as string);
                    if (newPreviews.length === newFiles.length) {
                        setImagePreviews(prev => [...prev, ...newPreviews]);
                    }
                };
                reader.readAsDataURL(file);
            }
        }

        setPendingFiles(prev => [...prev, ...newFiles]);
        e.target.value = ''; // Reset input
    };

    const handleRemoveExistingImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemovePendingImage = (index: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadAllImages = async (): Promise<string[]> => {
        if (pendingFiles.length === 0) return imageUrls;

        if (!supabase) {
            console.warn('Supabase not initialized');
            return imageUrls;
        }

        setUploading(true);
        setProgress(0);
        setError(null);
        setSuccess(false);
        const uploadedUrls: string[] = [];
        let hadError = false;

        try {
            for (const file of pendingFiles) {
                let fileToUpload = file;
                let fileExt = file.name.split('.').pop() || 'tmp';
                let contentType = file.type;

                // Compress image & convert to WebP only if it's an image
                if (file.type.startsWith('image/')) {
                    const options = {
                        maxSizeMB: 0.2, // Aggressive compression target (was 0.3)
                        maxWidthOrHeight: 1280, // HD Ready is enough for mobile (was 1920)
                        useWebWorker: true,
                        fileType: 'image/webp' // Modern efficient format
                    };

                    try {
                        const imageCompression = (await import('browser-image-compression')).default;
                        const compressedFile = await imageCompression(file, options);
                        fileToUpload = compressedFile;
                    } catch (error) {
                        console.error('Compression failed:', error);
                    }

                    fileExt = 'webp';
                    contentType = 'image/webp';
                }

                const basePath = orgId ? `${orgId}/` : '';
                const fileName = `${basePath}${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(fileName, fileToUpload, { contentType });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
                
                // Simulate progress updates for each file
                setProgress(Math.min(((uploadedUrls.length) / pendingFiles.length) * 100, 100));
            }

            setSuccess(true);
            setPendingFiles([]);
            setImagePreviews([]);
            
            // Return combined list of existing and new URLs
            return [...imageUrls, ...uploadedUrls];
        } catch (err: any) {
            console.error('Error uploading images:', err);
            setError(err.message || 'Upload fehlgeschlagen. Bitte prüfe deine Internetverbindung oder versuche es später.');
            hadError = true;
            throw err;
        } finally {
            setUploading(false);
            // Reset progress after a delay if success
            if (!hadError) {
                setTimeout(() => {
                    setProgress(0);
                }, 2000);
            }
        }
    };

    const clearError = () => setError(null);

    const reset = () => {
        setPendingFiles([]);
        setImagePreviews([]);
        setImageUrls(initialImageUrls);
        setUploading(false);
        setProgress(0);
        setError(null);
        setSuccess(false);
    }

    return {
        imageUrls,
        setImageUrls,
        pendingFiles,
        imagePreviews,
        uploading,
        progress,
        error,
        success,
        clearError,
        handleFileChange,
        handleRemoveExistingImage,
        handleRemovePendingImage,
        uploadAllImages,
        reset
    };
};
