export type ItemStatus = 'in_stock' | 'sold';
export type Condition = 'mint' | 'very_good' | 'good' | 'fair' | 'poor';
export type Category = 'bag' | 'wallet' | 'accessory' | 'lock' | 'other';

export interface Item {
    id: string;
    brand: string;
    model: string;
    category: Category;
    condition: Condition;
    status: ItemStatus;

    purchasePriceEur: number;
    purchaseDate: string;
    purchaseSource: string;

    salePriceEur?: number;
    saleDate?: string;
    saleChannel?: string;
    platformFeesEur?: number;
    shippingCostEur?: number;
    buyer?: string;

    certificates?: ItemCertificate[];

    imageUrls: string[];
    notes: string;
    createdAt: string;
}

export interface CertificateProvider {
    id: string;
    organization_id: string;
    name: string;
    unit_cost_eur: number;
    image_url?: string | null;
    created_at: string;
}

export interface ExpenseCategory {
    id: string;
    organization_id: string;
    name: string;
    created_at: string;
}

export interface Expense {
    id: string;
    organization_id: string;
    category_id: string;
    amount_eur: number;
    date: string;
    description: string | null;
    is_recurring: boolean;
    recurring_interval: string | null;
    receipt_image_url: string | null;
    created_at: string;
}

export interface ItemCertificate {
    id: string;
    organization_id: string;
    item_id: string;
    certificate_provider_id: string;
    cost_eur: number;
    sale_price_eur: number | null;
    created_at: string;

    // Optional relation payload when joining
    provider?: CertificateProvider;
}

export interface Plan {
    id: string;
    name: string;
    display_name: string;
    price_eur: number;
    interval: string;
    max_items: number | null;
    max_users: number;
    max_storage_mb: number;
    features: string[];
    is_active: boolean;
    created_at: string;
}

export interface Subscription {
    id: string;
    organization_id: string;
    plan_id: string;
    status: 'active' | 'trialing' | 'canceled' | 'past_due';
    trial_ends_at: string | null;
    current_period_start: string;
    current_period_end: string | null;
    created_at: string;
    updated_at: string;
}

export interface Invitation {
    id: string;
    organization_id: string;
    email: string;
    role: string;
    invited_by: string;
    token: string;
    status: 'pending' | 'accepted' | 'expired';
    expires_at: string;
    created_at: string;
}
