import Image from 'next/image';
import React, { useState } from 'react';
import { Building2, Loader2, Camera, X, ArrowRight, Sparkles } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { useImageUpload } from '../../hooks/useImageUpload';

interface OnboardingViewProps {
    user: any;
    onComplete: (orgId: string) => void;
}

export const OnboardingView = ({
    user,
    onComplete
}: OnboardingViewProps) => {
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
                p_user_id: user?.id
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

        } catch (err: unknown) {
            console.error("OnboardingView: Error:", err);
            showToast(`Fehler beim Erstellen der Organisation: ${(err as any).message}`, "error");
            setLoading(false);
        }
    };

    const hasLogo = imageUrls.length + imagePreviews.length > 0;

    return (
        <div className="min-h-screen -mb-20 flex items-center justify-center bg-[#fafaf9] dark:bg-zinc-950 py-6 sm:py-10 px-0 relative">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: '32px 32px'
            }} />

            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stone-200/30 dark:bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />

            <FadeIn className="relative w-full max-w-md mx-6">
                {/* Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl shadow-stone-900/[0.08] dark:shadow-black/40 border border-stone-100 dark:border-zinc-800/50 overflow-hidden">

                    {/* Header area */}
                    <div className="pt-10 pb-6 px-8 sm:px-10 text-center">
                        {/* Icon */}
                        <div className="relative mx-auto mb-6">
                            <div className="w-[72px] h-[72px] bg-stone-900 dark:bg-white rounded-[1.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-stone-900/25 dark:shadow-black/50 rotate-3 transition-transform hover:rotate-0 duration-500">
                                <Building2 className="text-white dark:text-stone-900 w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30 left-1/2 translate-x-4">
                                <Sparkles className="w-3 h-3 text-white" strokeWidth={2.5} />
                            </div>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-zinc-50 mb-1.5 tracking-tight">
                            Willkommen!
                        </h1>
                        <p className="text-stone-400 dark:text-zinc-500 text-sm sm:text-[15px] font-light leading-relaxed">
                            Erstelle dein Unternehmen und starte<br className="hidden sm:block" /> mit Holy Archive durch.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="mx-8 sm:mx-10 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-zinc-800 to-transparent" />

                    {/* Form area */}
                    <form onSubmit={handleOnboarding} className="p-8 sm:p-10 pt-6 sm:pt-8 space-y-6">
                        <Input
                            type="text"
                            label="Firmenname"
                            placeholder="Meine Vintage Boutique"
                            value={orgName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgName(e.target.value)}
                            required
                        />

                        {/* Logo Upload */}
                        <div className="space-y-3">
                            <label className="block text-[11px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-[0.15em]">
                                Logo <span className="font-normal text-stone-300 dark:text-zinc-600 normal-case tracking-normal">(optional)</span>
                            </label>

                            <div className="flex items-center gap-5">
                                <div className="flex gap-2.5 relative">
                                    {imageUrls.map((url, i) => (
                                        <div key={`existing-${i}`} className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-800 ring-1 ring-stone-200/50 dark:ring-zinc-700/50">
                                            <Image src={url} alt="Logo" fill sizes="72px" className="object-cover" />
                                            <button type="button" onClick={() => handleRemoveExistingImage(i)} className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {imagePreviews.map((preview, i) => (
                                        <div key={`preview-${i}`} className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-800 ring-1 ring-stone-200/50 dark:ring-zinc-700/50">
                                            <Image src={preview} alt="Vorschau" fill sizes="72px" unoptimized className="object-cover" />
                                            <div className="absolute inset-0 bg-white/10 dark:bg-black/10" />
                                            <button type="button" onClick={() => handleRemovePendingImage(i)} className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {!hasLogo && (
                                        <label className="w-[72px] h-[72px] flex flex-col items-center justify-center border-2 border-dashed border-stone-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-stone-400 dark:hover:border-zinc-500 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-all duration-300 group">
                                            <Camera className="w-5 h-5 text-stone-300 dark:text-zinc-600 group-hover:text-stone-500 dark:group-hover:text-zinc-400 transition-colors" strokeWidth={1.5} />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </label>
                                    )}
                                </div>
                                <p className="text-[13px] text-stone-400 dark:text-zinc-500 leading-relaxed flex-1">
                                    Wird auf Zertifikaten und Exporten angezeigt.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || uploadingImages || !orgName.trim()}
                            className="w-full mt-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-4 rounded-2xl font-semibold text-[15px] tracking-wide shadow-xl shadow-stone-900/20 dark:shadow-black/30 hover:bg-black dark:hover:bg-stone-100 hover:shadow-2xl active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center gap-2.5"
                        >
                            {loading || uploadingImages ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Loslegen
                                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer text */}
                <p className="text-center mt-6 text-[12px] text-stone-300 dark:text-zinc-700 tracking-wide">
                    HOLY ARCHIVE
                </p>
            </FadeIn>
        </div>
    );
};
