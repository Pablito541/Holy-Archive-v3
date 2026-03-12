import type { Item, ItemStatus, Expense, ItemCertificate } from '@/types';

// --- Payload types ---

export interface CreateItemPayload {
  brand: string;
  model: string;
  category?: string;
  condition?: string;
  purchase_price_eur?: number;
  purchase_date?: string;
  purchase_source?: string;
  image_urls?: string[];
  notes?: string;
  certificate?: {
    provider_id: string;
    cost_eur: number;
  };
}

export interface SellItemPayload {
  sale_price_eur: number;
  sale_channel: string;
  sale_date?: string;
  platform_fees_eur?: number;
  shipping_cost_eur?: number;
  buyer?: string;
  cert_sale_prices?: Record<string, number>;
}

export interface CreateExpensePayload {
  category_id: string;
  amount_eur: number;
  date: string;
  description?: string;
  is_recurring?: boolean;
  recurring_interval?: string;
  receipt_image_url?: string | null;
}

export interface CreateCertificatePayload {
  item_id: string;
  certificate_provider_id: string;
  cost_eur: number;
}

// --- DB row types (snake_case, as returned by API) ---

export interface DbItem {
  id: string;
  organization_id: string;
  user_id: string;
  brand: string;
  model: string;
  category: string;
  condition: string;
  status: string;
  purchase_price_eur: number;
  purchase_date: string;
  purchase_source: string;
  sale_price_eur: number | null;
  sale_date: string | null;
  sale_channel: string | null;
  platform_fees_eur: number | null;
  shipping_cost_eur: number | null;
  buyer: string | null;
  image_urls: string[];
  notes: string;
  created_at: string;
  item_certificates?: any[];
}

// --- Mapping helper ---

export function mapDbItemToItem(d: DbItem): Item {
  return {
    id: d.id,
    brand: d.brand,
    model: d.model,
    category: d.category as Item['category'],
    condition: d.condition as Item['condition'],
    status: d.status as Item['status'],
    purchasePriceEur: d.purchase_price_eur,
    purchaseDate: d.purchase_date,
    purchaseSource: d.purchase_source,
    salePriceEur: d.sale_price_eur ?? undefined,
    saleDate: d.sale_date ?? undefined,
    saleChannel: d.sale_channel ?? undefined,
    platformFeesEur: d.platform_fees_eur ?? undefined,
    shippingCostEur: d.shipping_cost_eur ?? undefined,
    buyer: d.buyer ?? undefined,
    certificates: d.item_certificates?.map((c: any) => ({
      id: c.id,
      organization_id: c.organization_id,
      item_id: c.item_id,
      certificate_provider_id: c.certificate_provider_id,
      cost_eur: c.cost_eur,
      sale_price_eur: c.sale_price_eur,
      created_at: c.created_at,
      provider: c.provider,
    })) || [],
    imageUrls: d.image_urls || [],
    notes: d.notes,
    createdAt: d.created_at,
  };
}

// --- API Client ---

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<{ data?: T; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        return { error: json.error || 'Ein Fehler ist aufgetreten' };
      }

      return { data: json.data };
    } catch {
      return { error: 'Netzwerkfehler. Bitte prüfe deine Verbindung.' };
    }
  }

  // --- Items ---

  async getItems(params: {
    status?: ItemStatus;
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const sp = new URLSearchParams();
    if (params.status) sp.set('status', params.status);
    if (params.page !== undefined) sp.set('page', String(params.page));
    if (params.limit !== undefined) sp.set('limit', String(params.limit));
    if (params.search) sp.set('search', params.search);
    const qs = sp.toString();
    return this.request<{ items: DbItem[]; total: number; page: number; limit: number; hasMore: boolean }>(
      `/items${qs ? `?${qs}` : ''}`
    );
  }

  async getItem(id: string) {
    return this.request<DbItem>(`/items/${id}`);
  }

  async createItem(body: CreateItemPayload) {
    return this.request<DbItem>('/items', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateItem(id: string, body: Record<string, unknown>) {
    return this.request<DbItem>(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteItem(id: string) {
    return this.request<{ deleted: boolean }>(`/items/${id}`, {
      method: 'DELETE',
    });
  }

  async sellItem(id: string, body: SellItemPayload) {
    return this.request<DbItem>(`/items/${id}/sell`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // --- Expenses ---

  async getExpenses(params: {
    page?: number;
    limit?: number;
    category_id?: string;
    is_recurring?: boolean;
    date_from?: string;
    date_to?: string;
  } = {}) {
    const sp = new URLSearchParams();
    if (params.page !== undefined) sp.set('page', String(params.page));
    if (params.limit !== undefined) sp.set('limit', String(params.limit));
    if (params.category_id) sp.set('category_id', params.category_id);
    if (params.is_recurring !== undefined) sp.set('is_recurring', String(params.is_recurring));
    if (params.date_from) sp.set('date_from', params.date_from);
    if (params.date_to) sp.set('date_to', params.date_to);
    const qs = sp.toString();
    return this.request<{ expenses: Expense[]; total: number; page: number; limit: number }>(
      `/expenses${qs ? `?${qs}` : ''}`
    );
  }

  async createExpense(body: CreateExpensePayload) {
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateExpense(id: string, body: Partial<CreateExpensePayload>) {
    return this.request<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteExpense(id: string) {
    return this.request<{ deleted: boolean }>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Dashboard ---

  async getDashboardStats(timeframe?: string, chartGrouping?: string) {
    const sp = new URLSearchParams();
    if (timeframe) sp.set('timeframe', timeframe);
    if (chartGrouping) sp.set('chart_grouping', chartGrouping);
    const qs = sp.toString();
    return this.request<any>(`/dashboard/stats${qs ? `?${qs}` : ''}`);
  }

  // --- Organization ---

  async getOrganization() {
    return this.request<any>('/organization');
  }

  async updateOrganization(body: { name?: string; logo_url?: string }) {
    return this.request<any>('/organization', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async getMembers() {
    return this.request<any[]>('/organization/members');
  }

  // --- Certificates ---

  async getCertificates() {
    return this.request<any[]>('/certificates');
  }

  async createCertificate(body: CreateCertificatePayload) {
    return this.request<any>('/certificates', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // --- Health ---

  async healthCheck() {
    return this.request<{ status: string; timestamp: string; supabase: string }>('/health');
  }
}

export const api = new ApiClient();
