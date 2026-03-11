import React, { useState } from 'react';
import { ShoppingBag, Loader2, Camera, X } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { useImageUpload } from '../../hooks/useImageUpload';

export const OnboardingView = ({
    user,
    onComplete
}: {
    user: any;
    onComplete: (orgId: string) => void;
}) => {
    const [orgName, setOrgName] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const {
        imageUrls,
        imagePreviews,
        uploading: uploadingImages,
        handleFileChange,
        handleRemoveExistingImage,
        handleRemovePendingImage,
        uploadAllImages,
    } = useImageUpload({
        initialImageUrls: [],
        isBulkMode: false,
    });

    const handleOnboarding = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orgName.trim()) {
            showToast('Bitte gib einen Firmennamen ein.', 'error');
            return;
        }

        setLoading(true);

        try {
            if (!supabase) throw new Error('Supabase client not initialized');

            // 1. Upload Logo if selected
            let logoUrl = null;
            if (imagePreviews.length > 0) {
                const uploadedUrls = await uploadAllImages();
                if (uploadedUrls.length > 0) {
                    logoUrl = uploadedUrls[0];
                }
            }

            // 2. Call RPC to create org
            const { data: orgId, error } = await supabase.rpc('create_organization_for_user', {
                p_org_name: orgName,
                p_user_id: user.id
            });

            if (error) throw error;
            if (!orgId) throw new Error('Keine Organization ID zurückgegeben');

            // 3. Update Logo URL if exists
            if (logoUrl) {
                const { error: logoError } = await supabase
                    .from('organizations')
                    .update({ logo_url: logoUrl })
                    .eq('id', orgId);

                if (logoError) console.error('Logo upload error:', logoError);
            }

            showToast('Willkommen bei Holy Archive!', 'success');
            onComplete(orgId);

        } catch (err: any) {
            console.error("OnboardingView: Error:", err);
            showToast(`Fehler beim Erstellen der Organisation: ${err.message}`, "error");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fafaf9] text-stone-900">
            <FadeIn className="w-full max-w-sm text-center">
                <div className="w-20 h-20 bg-stone-900 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-stone-900/20 rotate-3">
                    <ShoppingBag className="text-white w-9 h-9" />
                </div>
                <h1 className="text-3xl font-serif font-bold mb-3">Willkommen!</h1>
                <p className="text-stone-500 mb-10 text-lg font-light">Lass uns dein Unternehmen einrichten</p>

                <form onSubmit={handleOnboarding} className="space-y-6 text-left">
                    <Input
                        type="text"
                        label="Firmenname"
                        placeholder="Meine Vintage Boutique"
                        value={orgName}
                        onChange={(e: any) => setOrgName(e.target.value)}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-stone-900">Logo (optional)</label>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2 relative">
                                {imageUrls.map((url, i) => (
                                    <div key={`existing-${i}`} className="relative w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-800">
                                        <img src={url} alt="Logo" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => handleRemoveExistingImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                                {imagePreviews.map((preview, i) => (
                                    <div key={`preview-${i}`} className="relative w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-800">
                                        <img src={preview} alt="Vorschau" className="w-full h-full object-cover opacity-70" />
                                        <button type="button" onClick={() => handleRemovePendingImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}

                                {imageUrls.length + imagePreviews.length === 0 && (
                                    <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-zinc-700 rounded-2xl cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-900 transition-colors">
                                        <Camera className="w-5 h-5 text-stone-400" />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                )}
                            </div>
                            <div className="text-sm text-stone-400 flex-1">
                                Lade dein Firmenlogo hoch, um es auf Zertifikaten und Exporten anzuzeigen.
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-8" disabled={loading || uploadingImages}>
                        {loading || uploadingImages ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Organisation erstellen'}
                    </Button>
                </form>
            </FadeIn>
        </div>
    );
};
