-- Update get_detailed_dashboard_stats to include monthlyData and expenses

CREATE OR REPLACE FUNCTION get_detailed_dashboard_stats(org_id UUID, filter_timeframe TEXT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  start_date TIMESTAMP;
  result JSON;
BEGIN
  -- Determine start date for aggregations
  IF filter_timeframe = 'month' THEN
    start_date := date_trunc('month', now());
  ELSIF filter_timeframe = '3months' THEN
    start_date := date_trunc('month', now()) - interval '2 months'; -- Current month + 2 previous
  ELSE
    start_date := NULL; -- All time
  END IF;

  WITH 
  sold_items AS (
    SELECT 
      sale_price_eur,
      purchase_price_eur,
      COALESCE(platform_fees_eur, 0) as fees,
      COALESCE(shipping_cost_eur, 0) as shipping,
      sale_channel,
      brand,
      sale_date
    FROM items
    WHERE organization_id = org_id
      AND status = 'sold'
      
    UNION ALL
    
    SELECT
      ic.sale_price_eur,
      ic.cost_eur as purchase_price_eur,
      0 as fees,
      0 as shipping,
      i.sale_channel,
      'Zertifikat' as brand,
      i.sale_date
    FROM item_certificates ic
    JOIN items i ON ic.item_id = i.id
    WHERE ic.organization_id = org_id
      AND i.status = 'sold'
      AND ic.sale_price_eur IS NOT NULL
  ),
  
  filtered_sold_items AS (
    SELECT * FROM sold_items
    WHERE (start_date IS NULL OR (sale_date IS NOT NULL AND sale_date::date >= start_date::date))
  ),

  stock_items AS (
    SELECT purchase_price_eur FROM items
    WHERE organization_id = org_id AND (status = 'in_stock' OR status = 'reserved')
    UNION ALL
    SELECT ic.cost_eur as purchase_price_eur FROM item_certificates ic
    JOIN items i ON ic.item_id = i.id
    WHERE ic.organization_id = org_id AND (i.status = 'in_stock' OR i.status = 'reserved')
  ),

  general_stats AS (
    SELECT
      count(*) as sold_count,
      COALESCE(SUM(sale_price_eur), 0) as total_revenue,
      COALESCE(SUM(sale_price_eur - purchase_price_eur - fees - shipping), 0) as total_profit
    FROM filtered_sold_items
  ),

  inv_stats AS (
    SELECT
      count(*) as stock_count,
      COALESCE(SUM(purchase_price_eur), 0) as inventory_value
    FROM stock_items
  ),

  brand_stats AS (
    SELECT
      brand, count(*) as count,
      COALESCE(SUM(sale_price_eur), 0) as revenue,
      COALESCE(SUM(sale_price_eur - purchase_price_eur - fees - shipping), 0) as profit
    FROM filtered_sold_items
    GROUP BY brand
  ),
  
  top_brands_list AS (
    SELECT brand, revenue, profit, count FROM brand_stats ORDER BY profit DESC LIMIT 10
  ),

  best_margin_brand AS (
    SELECT brand, revenue, profit FROM brand_stats WHERE revenue > 0 ORDER BY (profit / revenue) DESC LIMIT 1
  ),

  highest_profit_brand AS (
    SELECT brand, revenue, profit FROM brand_stats ORDER BY profit DESC LIMIT 1
  ),

  channel_stats_list AS (
    SELECT
      sale_channel as channel, count(*) as count,
      COALESCE(SUM(sale_price_eur), 0) as revenue,
      COALESCE(SUM(sale_price_eur - purchase_price_eur - fees - shipping), 0) as profit
    FROM filtered_sold_items
    GROUP BY sale_channel ORDER BY profit DESC
  ),
  
  -- Create 12 months data
  months AS (
    SELECT generate_series(
      date_trunc('month', now() - interval '11 months'),
      date_trunc('month', now()),
      '1 month'::interval
    ) as month_start
  ),
  
  monthly_revenue_profit AS (
    SELECT 
      date_trunc('month', sale_date) as month_start,
      SUM(sale_price_eur) as revenue,
      SUM(sale_price_eur - purchase_price_eur - fees - shipping) as profit
    FROM sold_items
    WHERE sale_date >= date_trunc('month', now() - interval '11 months')
    GROUP BY 1
  ),
  
  one_time_expenses AS (
    SELECT
      date_trunc('month', date) as month_start,
      SUM(amount_eur) as amount
    FROM expenses
    WHERE organization_id = org_id AND is_recurring = false
    GROUP BY 1
  ),
  
  recurring_expenses AS (
    SELECT amount_eur, date as start_date, recurring_interval
    FROM expenses
    WHERE organization_id = org_id AND is_recurring = true
  ),
  
  monthly_recurring AS (
    SELECT 
      m.month_start,
      SUM(
        CASE 
          WHEN r.start_date <= (m.month_start + interval '1 month' - interval '1 day') THEN
            CASE
              WHEN r.recurring_interval = 'yearly' AND EXTRACT(MONTH FROM r.start_date) = EXTRACT(MONTH FROM m.month_start) THEN r.amount_eur
              WHEN r.recurring_interval = 'semi_annually' AND MOD((CAST(EXTRACT(YEAR FROM m.month_start) - EXTRACT(YEAR FROM r.start_date) AS INTEGER) * 12 + CAST(EXTRACT(MONTH FROM m.month_start) - EXTRACT(MONTH FROM r.start_date) AS INTEGER)), 6) = 0 THEN r.amount_eur
              WHEN r.recurring_interval = 'quarterly' AND MOD((CAST(EXTRACT(YEAR FROM m.month_start) - EXTRACT(YEAR FROM r.start_date) AS INTEGER) * 12 + CAST(EXTRACT(MONTH FROM m.month_start) - EXTRACT(MONTH FROM r.start_date) AS INTEGER)), 3) = 0 THEN r.amount_eur
              WHEN r.recurring_interval = 'monthly' THEN r.amount_eur
              ELSE 0
            END
          ELSE 0
        END
      ) as amount
    FROM months m
    CROSS JOIN recurring_expenses r
    GROUP BY m.month_start
  ),
  
  monthly_combined AS (
    SELECT 
      m.month_start,
      to_char(m.month_start, 'Mon') as label,
      COALESCE(rp.revenue, 0) as revenue,
      COALESCE(rp.profit, 0) as profit,
      COALESCE(ote.amount, 0) + COALESCE(mr.amount, 0) as expenses,
      COALESCE(rp.profit, 0) - (COALESCE(ote.amount, 0) + COALESCE(mr.amount, 0)) as net_profit
    FROM months m
    LEFT JOIN monthly_revenue_profit rp ON m.month_start = rp.month_start
    LEFT JOIN one_time_expenses ote ON m.month_start = ote.month_start
    LEFT JOIN monthly_recurring mr ON m.month_start = mr.month_start
    ORDER BY m.month_start ASC
  ),
  
  timeframe_expenses AS (
    SELECT SUM(expenses) as total_expenses FROM monthly_combined
    WHERE (start_date IS NULL OR month_start >= start_date)
  )

  SELECT json_build_object(
    'totalProfit', (SELECT total_profit FROM general_stats),
    'totalRevenue', (SELECT total_revenue FROM general_stats),
    'totalSales', (SELECT sold_count FROM general_stats),
    'totalExpenses', (SELECT COALESCE(total_expenses, 0) FROM timeframe_expenses),
    'averageMargin', (SELECT CASE WHEN total_revenue > 0 THEN (total_profit / total_revenue) * 100 ELSE 0 END FROM general_stats),
    'inventoryValue', (SELECT inventory_value FROM inv_stats),
    'stockCount', (SELECT stock_count FROM inv_stats),
    'channels', (SELECT COALESCE(json_agg(channel_stats_list), '[]'::json) FROM channel_stats_list),
    'topBrands', (SELECT COALESCE(json_agg(top_brands_list), '[]'::json) FROM top_brands_list),
    'bestMarginBrand', (SELECT row_to_json(best_margin_brand) FROM best_margin_brand),
    'highestProfitBrand', (SELECT row_to_json(highest_profit_brand) FROM highest_profit_brand),
    'monthlyData', (SELECT COALESCE(json_agg(monthly_combined), '[]'::json) FROM monthly_combined)
  ) INTO result;

  RETURN result;
END;
$$;
