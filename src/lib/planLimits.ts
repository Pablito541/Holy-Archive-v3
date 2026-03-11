/**
 * Plan Limits Module
 * 
 * Checks usage against subscription plan limits.
 * Each function returns { allowed, current, max } to determine if
 * an action is permitted within the current plan.
 */

import { supabase } from './supabase';

interface LimitResult {
    allowed: boolean;
    current: number;
    max: number;
}

interface StorageLimitResult {
    allowed: boolean;
    currentMb: number;
    maxMb: number;
}

interface PlanInfo {
    name: string;
    max_items: number;
    max_members: number;
    max_storage_mb: number;
    price_eur_monthly: number;
    features: Record<string, boolean>;
}

/**
 * Fetches the current plan for an organization.
 * Falls back to free-tier defaults if no subscription exists.
 */
async function getCurrentPlan(orgId: string): Promise<PlanInfo> {
    if (!supabase) {
        return { name: 'free', max_items: 50, max_members: 2, max_storage_mb: 500, price_eur_monthly: 0, features: {} };
    }

    const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_id, plans(name, max_items, max_members, max_storage_mb, price_eur_monthly, features)')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .single();

    if (error || !data) {
        // No subscription → free tier defaults
        return { name: 'free', max_items: 50, max_members: 2, max_storage_mb: 500, price_eur_monthly: 0, features: {} };
    }

    const plan = (data as Record<string, unknown>).plans as PlanInfo | null;
    if (!plan) {
        return { name: 'free', max_items: 50, max_members: 2, max_storage_mb: 500, price_eur_monthly: 0, features: {} };
    }

    return plan;
}

/**
 * Check if the organization can add more items.
 */
export async function checkItemLimit(orgId: string): Promise<LimitResult> {
    const plan = await getCurrentPlan(orgId);
    const max = plan.max_items;

    // -1 means unlimited
    if (max === -1) {
        return { allowed: true, current: 0, max: -1 };
    }

    if (!supabase) {
        return { allowed: false, current: 0, max };
    }

    const { count, error } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'in_stock')
        .is('deleted_at', null);

    const current = error ? 0 : (count || 0);
    return { allowed: current < max, current, max };
}

/**
 * Check if the organization can add more team members.
 */
export async function checkMemberLimit(orgId: string): Promise<LimitResult> {
    const plan = await getCurrentPlan(orgId);
    const max = plan.max_members;

    if (max === -1) {
        return { allowed: true, current: 0, max: -1 };
    }

    if (!supabase) {
        return { allowed: false, current: 0, max };
    }

    const { count, error } = await supabase
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);

    const current = error ? 0 : (count || 0);
    return { allowed: current < max, current, max };
}

/**
 * Check if the organization can use more storage.
 */
export async function checkStorageLimit(orgId: string): Promise<StorageLimitResult> {
    const plan = await getCurrentPlan(orgId);
    const maxMb = plan.max_storage_mb;

    if (maxMb === -1) {
        return { allowed: true, currentMb: 0, maxMb: -1 };
    }

    // Approximate storage by counting images (average ~2MB each)
    if (!supabase) {
        return { allowed: false, currentMb: 0, maxMb };
    }

    const { data, error } = await supabase
        .storage
        .from('item-images')
        .list(orgId, { limit: 10000 });

    let currentMb = 0;
    if (!error && data) {
        currentMb = data.reduce((acc, file) => {
            const metadata = file.metadata as { size?: number } | undefined;
            return acc + (metadata?.size || 0);
        }, 0) / (1024 * 1024);
    }

    return { allowed: currentMb < maxMb, currentMb: Math.round(currentMb * 10) / 10, maxMb };
}

/**
 * Get the full plan info for display.
 */
export async function getOrganizationPlan(orgId: string): Promise<PlanInfo> {
    return getCurrentPlan(orgId);
}
