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

    // Virtual fields for certificate display
    isCertificate?: boolean;
    parentId?: string;
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

export interface CertificateSale {
    id: string;
    organization_id: string;
    provider_id: string | null;
    provider_name: string | null;
    customer_name: string | null;
    sale_price_eur: number;
    cost_eur: number;
    sale_date: string;
    sale_channel: string | null;
    notes: string | null;
    created_at: string;
}

export interface ChannelData {
    channel: string;
    count: number;
    revenue: number;
    profit: number;
}

export interface BrandStats {
    brand: string;
    revenue: number;
    profit: number;
    sales: number;
}

export interface MonthlyData {
    period: string;
    revenue: number;
    profit: number;
    expenses: number;
}

export interface DashboardStats {
    totalProfit: number;
    totalRevenue: number;
    totalSales: number;
    totalExpenses: number;
    averageMargin: number;
    inventoryValue: number;
    stockCount: number;
    totalBrands: number;
    totalChannels: number;
    channels: ChannelData[];
    topBrands: BrandStats[];
    bestMarginBrand: BrandStats | null;
    highestProfitBrand: BrandStats | null;
    monthlyData: MonthlyData[];
}
