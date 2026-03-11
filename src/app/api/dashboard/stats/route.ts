import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-api';
import { getAuthenticatedUser, getUserOrgId, unauthorizedResponse, forbiddenResponse } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { checkRateLimit } from '@/lib/api/rateLimit';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  const { allowed } = checkRateLimit(`stats:${user.id}`, 30, 60_000);
  if (!allowed) return errorResponse('Rate limit überschritten', 429);

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'month';
  const chartGrouping = searchParams.get('chart_grouping') || 'day';

  const validTimeframes = ['month', 'last_month', '3months', 'year', 'all'];
  if (!validTimeframes.includes(timeframe)) {
    return errorResponse(`timeframe muss einer der folgenden Werte sein: ${validTimeframes.join(', ')}`);
  }

  const validGroupings = ['day', 'week', 'month'];
  if (!validGroupings.includes(chartGrouping)) {
    return errorResponse(`chart_grouping muss einer der folgenden Werte sein: ${validGroupings.join(', ')}`);
  }

  try {
    const supabase = await createAuthenticatedClient();
    const { data, error } = await supabase.rpc('get_detailed_dashboard_stats', {
      org_id: orgId,
      filter_timeframe: timeframe,
      chart_grouping: chartGrouping,
    });

    if (error) return errorResponse(error.message, 500);

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}
