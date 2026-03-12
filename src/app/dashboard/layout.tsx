import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase-server';
import { AuthProvider } from '../../providers/AuthProvider';
import { InventoryProvider } from '../../providers/InventoryProvider';
import { FinanceProvider } from '../../providers/FinanceProvider';
import { UIProvider } from '../../providers/UIProvider';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { Item } from '../../types';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect('/');
    }

    const user = session.user;

    // Fetch Organization membership
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    const initialOrgId = member?.organization_id ?? null;
    let initialItems: Item[] = [];

    if (initialOrgId) {
        const { data } = await supabase
            .from('items')
            .select('*')
            .eq('organization_id', initialOrgId)
            .order('created_at', { ascending: false })
            .range(0, 49); // PAGE_SIZE - 1

        if (data) {
            initialItems = data.map((d: any) => ({
                id: d.id,
                brand: d.brand,
                model: d.model,
                category: d.category,
                condition: d.condition,
                status: d.status,
                purchasePriceEur: d.purchase_price_eur,
                purchaseDate: d.purchase_date,
                purchaseSource: d.purchase_source,
                salePriceEur: d.sale_price_eur,
                saleDate: d.sale_date,
                saleChannel: d.sale_channel,
                platformFeesEur: d.platform_fees_eur,
                shippingCostEur: d.shipping_cost_eur,
                imageUrls: d.image_urls || [],
                notes: d.notes,
                createdAt: d.created_at,
            }));
        }
    }

    return (
        <Suspense>
            <ErrorBoundary>
                <AuthProvider initialUser={user} initialOrgId={initialOrgId}>
                    <InventoryProvider initialItems={initialItems}>
                        <FinanceProvider>
                            <UIProvider>
                                <DashboardShell>
                                    {children}
                                </DashboardShell>
                            </UIProvider>
                        </FinanceProvider>
                    </InventoryProvider>
                </AuthProvider>
            </ErrorBoundary>
        </Suspense>
    );
}
