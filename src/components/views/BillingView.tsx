'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Check, Zap, Users, Package, HardDrive, Loader2 } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { checkItemLimit, checkMemberLimit, checkStorageLimit } from '../../lib/planLimits';
import { captureException } from '../../lib/errorTracking';

interface Plan {
    id: string;
    name: string;
    max_items: number;
    max_members: number;
    max_storage_mb: number;
    price_eur_monthly: number;
    features: Record<string, boolean>;
}

interface Subscription {
    id: string;
    plan_id: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
}

interface UsageData {
    items: { current: number; max: number };
    members: { current: number; max: number };
    storage: { currentMb: number; maxMb: number };
}

const PLAN_DISPLAY: Record<string, { label: string; icon: React.ReactNode; color: string; gradient: string }> = {
    free: { label: 'Free', icon: <Package className="w-5 h-5" />, color: 'text-stone-600', gradient: 'from-stone-100 to-stone-200 dark:from-zinc-800 dark:to-zinc-900' },
    starter: { label: 'Starter', icon: <Zap className="w-5 h-5" />, color: 'text-blue-600', gradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20' },
    professional: { label: 'Professional', icon: <Crown className="w-5 h-5" />, color: 'text-amber-600', gradient: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20' },
};

interface BillingViewProps {
    currentOrgId: string | null;
    onBack: () => void;
}

export const BillingView = ({ currentOrgId, onBack }: BillingViewProps) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [currentPlanName, setCurrentPlanName] = useState('free');
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentOrgId || !supabase) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch all plans
                const { data: plansData } = await supabase!
                    .from('plans')
                    .select('*')
                    .order('price_eur_monthly', { ascending: true });
                if (plansData) setPlans(plansData as Plan[]);

                // Fetch current subscription
                const { data: subData } = await supabase!
                    .from('subscriptions')
                    .select('*')
                    .eq('organization_id', currentOrgId)
                    .eq('status', 'active')
                    .maybeSingle();
                if (subData) {
                    setSubscription(subData as Subscription);
                    const matchedPlan = plansData?.find((p: Plan) => p.id === (subData as Subscription).plan_id);
                    if (matchedPlan) setCurrentPlanName((matchedPlan as Plan).name);
                }

                // Fetch usage
                const [itemLimit, memberLimit, storageLimit] = await Promise.all([
                    checkItemLimit(currentOrgId),
                    checkMemberLimit(currentOrgId),
                    checkStorageLimit(currentOrgId),
                ]);
                setUsage({
                    items: { current: itemLimit.current, max: itemLimit.max },
                    members: { current: memberLimit.current, max: memberLimit.max },
                    storage: { currentMb: storageLimit.currentMb, maxMb: storageLimit.maxMb },
                });
            } catch (error) {
                captureException(error instanceof Error ? error : new Error(String(error)), { context: 'fetchBillingData' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentOrgId]);

    const formatLimit = (value: number) => value === -1 ? '∞' : value.toString();

    const usagePercent = (current: number, max: number) => {
        if (max === -1) return 0;
        return Math.min(100, Math.round((current / max) * 100));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    const display = PLAN_DISPLAY[currentPlanName] || PLAN_DISPLAY.free;

    return (
        <FadeIn className="min-h-screen bg-[#fafaf9] dark:bg-black pb-32">
            <header className="sticky top-0 z-50 bg-[#fafaf9]/80 dark:bg-black/80 backdrop-blur-xl border-b border-stone-200 dark:border-zinc-800">
                <div className="flex items-center justify-between p-4 max-w-3xl mx-auto">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">Billing & Plan</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 space-y-6">
                {/* Current Plan */}
                <Card className={`p-6 bg-gradient-to-br ${display.gradient} border-0`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`${display.color}`}>{display.icon}</div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-900 dark:text-zinc-50">{display.label}</h2>
                            <p className="text-xs text-stone-500 dark:text-zinc-400">
                                {subscription ? `Aktiv bis ${new Date(subscription.current_period_end).toLocaleDateString('de-DE')}` : 'Kostenloser Plan'}
                            </p>
                        </div>
                    </div>
                    {subscription?.cancel_at_period_end && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg mb-4">
                            Kündigung zum Periodenende aktiv
                        </div>
                    )}
                </Card>

                {/* Usage */}
                {usage && (
                    <section>
                        <h3 className="text-xs font-bold text-stone-400 dark:text-zinc-500 tracking-wider uppercase ml-1 mb-3">Verbrauch</h3>
                        <Card className="divide-y divide-stone-100 dark:divide-zinc-800">
                            {/* Items */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-stone-400" />
                                        <span className="text-sm font-bold text-stone-700 dark:text-zinc-300">Artikel</span>
                                    </div>
                                    <span className="text-sm text-stone-500 dark:text-zinc-400">{usage.items.current} / {formatLimit(usage.items.max)}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2">
                                    <div className={`h-2 rounded-full transition-all ${usagePercent(usage.items.current, usage.items.max) > 90 ? 'bg-red-500' : usagePercent(usage.items.current, usage.items.max) > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${usagePercent(usage.items.current, usage.items.max)}%` }} />
                                </div>
                            </div>

                            {/* Members */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-stone-400" />
                                        <span className="text-sm font-bold text-stone-700 dark:text-zinc-300">Mitglieder</span>
                                    </div>
                                    <span className="text-sm text-stone-500 dark:text-zinc-400">{usage.members.current} / {formatLimit(usage.members.max)}</span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2">
                                    <div className={`h-2 rounded-full transition-all ${usagePercent(usage.members.current, usage.members.max) > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${usagePercent(usage.members.current, usage.members.max)}%` }} />
                                </div>
                            </div>

                            {/* Storage */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="w-4 h-4 text-stone-400" />
                                        <span className="text-sm font-bold text-stone-700 dark:text-zinc-300">Speicher</span>
                                    </div>
                                    <span className="text-sm text-stone-500 dark:text-zinc-400">
                                        {usage.storage.currentMb} MB / {usage.storage.maxMb === -1 ? '∞' : `${(usage.storage.maxMb / 1024).toFixed(1)} GB`}
                                    </span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2">
                                    <div className={`h-2 rounded-full transition-all ${usagePercent(usage.storage.currentMb, usage.storage.maxMb) > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${usagePercent(usage.storage.currentMb, usage.storage.maxMb)}%` }} />
                                </div>
                            </div>
                        </Card>
                    </section>
                )}

                {/* Plan Comparison */}
                <section>
                    <h3 className="text-xs font-bold text-stone-400 dark:text-zinc-500 tracking-wider uppercase ml-1 mb-3">Verfügbare Pläne</h3>
                    <div className="space-y-3">
                        {plans.map((plan) => {
                            const pd = PLAN_DISPLAY[plan.name] || PLAN_DISPLAY.free;
                            const isCurrent = plan.name === currentPlanName;
                            return (
                                <Card key={plan.id} className={`p-5 ${isCurrent ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={pd.color}>{pd.icon}</div>
                                            <span className="font-bold text-stone-900 dark:text-zinc-50">{pd.label}</span>
                                            {isCurrent && (
                                                <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">Aktuell</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-bold text-stone-900 dark:text-zinc-50">€{plan.price_eur_monthly.toFixed(0)}</span>
                                            <span className="text-xs text-stone-400 dark:text-zinc-500">/Monat</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-xs text-stone-500 dark:text-zinc-400 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Package className="w-3 h-3" />
                                            <span>{plan.max_items === -1 ? 'Unbegrenzt' : plan.max_items} Artikel</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>{plan.max_members} Mitgl.</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <HardDrive className="w-3 h-3" />
                                            <span>{plan.max_storage_mb >= 1024 ? `${(plan.max_storage_mb / 1024).toFixed(0)} GB` : `${plan.max_storage_mb} MB`}</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(plan.features).map(([key, enabled]) => (
                                            <span key={key} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-stone-100 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500 line-through'}`}>
                                                <Check className="w-2.5 h-2.5 inline mr-0.5" />
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>

                                    {!isCurrent && plan.price_eur_monthly > 0 && (
                                        <button className="w-full mt-4 bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold text-sm py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all">
                                            Upgrade auf {pd.label}
                                        </button>
                                    )}
                                    {!isCurrent && plan.price_eur_monthly === 0 && currentPlanName !== 'free' && (
                                        <p className="mt-3 text-xs text-center text-stone-400">Kostenloser Basis-Plan</p>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </section>

                <p className="text-xs text-center text-stone-400 dark:text-zinc-500 px-4">
                    Die Stripe-Zahlungsintegration wird in Kürze verfügbar sein. Kontaktiere uns für Enterprise-Pläne.
                </p>
            </main>
        </FadeIn>
    );
};
