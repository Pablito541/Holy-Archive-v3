'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Sparkles, Users, Check, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { FadeIn } from '../../components/ui/FadeIn';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useRouter } from 'next/navigation';
import type { Plan } from '../../types';

// --- Step 1: Organization Setup ---
function OrgStep({ orgName, setOrgName, slug, setSlug, slugError, logoFile, setLogoFile }: {
    orgName: string;
    setOrgName: (v: string) => void;
    slug: string;
    setSlug: (v: string) => void;
    slugError: string;
    logoFile: File | null;
    setLogoFile: (f: File | null) => void;
}) {
    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return (
        <FadeIn className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-stone-100 dark:bg-zinc-800 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <Building2 className="w-7 h-7 text-stone-600 dark:text-zinc-300" />
                </div>
                <h2 className="text-2xl font-serif font-bold">Organisation einrichten</h2>
                <p className="text-stone-500 dark:text-zinc-400 text-sm mt-1">Dein Workspace für Inventar & Finanzen</p>
            </div>

            <Input
                label="Firmenname"
                placeholder="z.B. Vintage Luxus Berlin"
                value={orgName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const name = e.target.value;
                    setOrgName(name);
                    setSlug(generateSlug(name));
                }}
                required
            />
            <Input
                label="Slug (URL-Name)"
                placeholder="vintage-luxus-berlin"
                value={slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                error={slugError}
            />

            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Logo (optional)
                </label>
                <label className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors">
                    <Upload className="w-4 h-4 text-stone-400" />
                    <span className="text-sm text-stone-500 dark:text-zinc-400">
                        {logoFile ? logoFile.name : 'Logo hochladen'}
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                </label>
            </div>
        </FadeIn>
    );
}

// --- Step 2: Plan Selection ---
function PlanStep({ plans, selectedPlanId, setSelectedPlanId }: {
    plans: Plan[];
    selectedPlanId: string;
    setSelectedPlanId: (id: string) => void;
}) {
    return (
        <FadeIn className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-2xl font-serif font-bold">Plan wählen</h2>
                <p className="text-stone-500 dark:text-zinc-400 text-sm mt-1">Wähle den passenden Plan für dein Business</p>
            </div>

            <div className="space-y-3">
                {plans.map((plan) => {
                    const isSelected = plan.id === selectedPlanId;
                    const isFree = plan.name === 'free';

                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                                isSelected
                                    ? 'border-stone-900 dark:border-zinc-100 bg-stone-50 dark:bg-zinc-800/50'
                                    : 'border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-stone-300 dark:hover:border-zinc-600'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-stone-900 dark:text-zinc-100">{plan.display_name}</h3>
                                        {!isFree && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                                                14 Tage gratis
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-lg font-bold mt-1 text-stone-900 dark:text-zinc-100">
                                        {isFree ? 'Kostenlos' : `€${plan.price_eur}/Monat`}
                                    </p>
                                    <div className="mt-2 text-xs text-stone-500 dark:text-zinc-400 space-y-1">
                                        <p>{plan.max_items ? `${plan.max_items} Items` : 'Unbegrenzt Items'} · {plan.max_users} User · {plan.max_storage_mb >= 1024 ? `${plan.max_storage_mb / 1024}GB` : `${plan.max_storage_mb}MB`} Storage</p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                                    isSelected
                                        ? 'border-stone-900 dark:border-zinc-100 bg-stone-900 dark:bg-zinc-100'
                                        : 'border-stone-300 dark:border-zinc-600'
                                }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white dark:text-zinc-900" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {plans.find(p => p.id === selectedPlanId)?.name !== 'free' && (
                <p className="text-center text-xs text-stone-400 dark:text-zinc-500">
                    14 Tage kostenlos testen. Keine Kreditkarte nötig.
                </p>
            )}
        </FadeIn>
    );
}

// --- Step 3: Team Invitations ---
function InviteStep({ invites, setInvites }: {
    invites: { email: string; role: string }[];
    setInvites: (v: { email: string; role: string }[]) => void;
}) {
    const addInvite = () => setInvites([...invites, { email: '', role: 'member' }]);
    const removeInvite = (index: number) => setInvites(invites.filter((_, i) => i !== index));
    const updateInvite = (index: number, field: 'email' | 'role', value: string) => {
        const updated = [...invites];
        updated[index] = { ...updated[index], [field]: value };
        setInvites(updated);
    };

    return (
        <FadeIn className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-serif font-bold">Team einladen</h2>
                <p className="text-stone-500 dark:text-zinc-400 text-sm mt-1">Möchtest du Teammitglieder einladen?</p>
            </div>

            <div className="space-y-3">
                {invites.map((invite, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <Input
                                type="email"
                                placeholder="email@beispiel.com"
                                value={invite.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    updateInvite(index, 'email', e.target.value)
                                }
                            />
                        </div>
                        <select
                            value={invite.role}
                            onChange={(e) => updateInvite(index, 'role', e.target.value)}
                            className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl text-sm text-stone-700 dark:text-zinc-300"
                        >
                            <option value="member">Mitglied</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => removeInvite(index)}
                            className="p-2.5 text-stone-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <Button
                variant="ghost"
                onClick={addInvite}
                fullWidth
                icon={<Plus className="w-4 h-4" />}
            >
                Email hinzufügen
            </Button>
        </FadeIn>
    );
}

// --- Main Onboarding Page ---
export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);

    // Step 1: Org
    const [orgName, setOrgName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugError, setSlugError] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Step 2: Plan
    const [selectedPlanId, setSelectedPlanId] = useState('');

    // Step 3: Invites
    const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);

    const { showToast } = useToast();
    const router = useRouter();

    // Load plans
    useEffect(() => {
        async function loadPlans() {
            if (!supabase) return;
            const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('price_eur');
            if (data) {
                setPlans(data);
                const freePlan = data.find((p: Plan) => p.name === 'free');
                if (freePlan) setSelectedPlanId(freePlan.id);
            }
        }
        loadPlans();
    }, []);

    // Validate slug uniqueness (debounced)
    const checkSlug = useCallback(async (s: string) => {
        if (!supabase || !s) { setSlugError(''); return; }
        const { data } = await supabase.from('organizations').select('id').eq('slug', s).maybeSingle();
        setSlugError(data ? 'Slug ist bereits vergeben' : '');
    }, []);

    useEffect(() => {
        if (!slug) return;
        const timer = setTimeout(() => checkSlug(slug), 500);
        return () => clearTimeout(timer);
    }, [slug, checkSlug]);

    const handleNext = async () => {
        if (step === 1) {
            if (!orgName.trim()) { showToast('Firmenname ist erforderlich', 'error'); return; }
            if (!slug.trim()) { showToast('Slug ist erforderlich', 'error'); return; }
            if (slugError) return;
            setStep(2);
        } else if (step === 2) {
            if (!selectedPlanId) { showToast('Bitte wähle einen Plan', 'error'); return; }
            setStep(3);
        } else if (step === 3) {
            await handleComplete();
        }
    };

    const handleComplete = async () => {
        if (!supabase) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { showToast('Nicht eingeloggt', 'error'); setLoading(false); return; }

            // 1. Upload logo if provided
            let logoUrl: string | null = null;
            if (logoFile) {
                const ext = logoFile.name.split('.').pop();
                const path = `org-logos/${slug}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('images').upload(path, logoFile, { upsert: true });
                if (!uploadError) {
                    const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
                    logoUrl = urlData.publicUrl;
                }
            }

            // 2. Create organization
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert({ name: orgName.trim(), slug: slug.trim(), logo_url: logoUrl })
                .select('id')
                .single();

            if (orgError) {
                if (orgError.message.includes('duplicate') || orgError.message.includes('unique')) {
                    setSlugError('Slug ist bereits vergeben');
                    setStep(1);
                } else {
                    showToast(`Fehler: ${orgError.message}`, 'error');
                }
                setLoading(false);
                return;
            }

            // 3. Add user as owner
            await supabase.from('organization_members').insert({
                organization_id: org.id,
                user_id: user.id,
                role: 'owner',
            });

            // 4. Create profile if not exists
            await supabase.from('profiles').upsert({
                id: user.id,
                username: user.email?.split('@')[0] || slug,
            }, { onConflict: 'id' });

            // 5. Create subscription
            const selectedPlan = plans.find(p => p.id === selectedPlanId);
            const isTrial = selectedPlan?.name !== 'free';
            await supabase.from('subscriptions').insert({
                organization_id: org.id,
                plan_id: selectedPlanId,
                status: isTrial ? 'trialing' : 'active',
                trial_ends_at: isTrial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
            });

            // 6. Save invitations (if any valid ones)
            const validInvites = invites.filter(inv => inv.email.trim());
            if (validInvites.length > 0) {
                const { error: invError } = await supabase.from('invitations').insert(
                    validInvites.map(inv => ({
                        organization_id: org.id,
                        email: inv.email.trim().toLowerCase(),
                        role: inv.role,
                        invited_by: user.id,
                    }))
                );
                if (invError) {
                    console.error('Invitation error:', invError);
                    showToast('Einladungen konnten nicht gespeichert werden', 'error');
                } else {
                    showToast('Einladungen gespeichert. Die Emails werden in Kürze versendet.', 'success');
                }
            }

            // 7. Redirect to dashboard with tour
            router.push('/dashboard?tour=true');
        } catch (err) {
            console.error('Onboarding error:', err);
            showToast('Ein unerwarteter Fehler ist aufgetreten.', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[#fafaf9] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100">
            <div className="w-full max-w-md">
                <div className="mb-8">
                    <StepIndicator
                        currentStep={step}
                        totalSteps={3}
                        labels={['Organisation', 'Plan', 'Team']}
                    />
                </div>

                {step === 1 && (
                    <OrgStep
                        orgName={orgName}
                        setOrgName={setOrgName}
                        slug={slug}
                        setSlug={setSlug}
                        slugError={slugError}
                        logoFile={logoFile}
                        setLogoFile={setLogoFile}
                    />
                )}
                {step === 2 && (
                    <PlanStep
                        plans={plans}
                        selectedPlanId={selectedPlanId}
                        setSelectedPlanId={setSelectedPlanId}
                    />
                )}
                {step === 3 && (
                    <InviteStep invites={invites} setInvites={setInvites} />
                )}

                <div className="mt-8 space-y-3">
                    <Button
                        onClick={handleNext}
                        loading={loading}
                        fullWidth
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {step === 3
                            ? (invites.some(inv => inv.email.trim()) ? 'Einladungen senden & starten' : 'Starten')
                            : 'Weiter'
                        }
                    </Button>

                    {step === 3 && invites.length > 0 && (
                        <button
                            type="button"
                            onClick={() => { setInvites([]); handleComplete(); }}
                            className="w-full text-center text-sm text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            Überspringen
                        </button>
                    )}

                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="w-full text-center text-sm text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            Zurück
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
