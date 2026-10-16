export interface DerivSession {
  token: string;
  appId: string;
  id: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface PartnerOverview {
  period: { start_date: string; end_date: string };
  currency: 'USD';
  has_lifetime_referred_client: boolean;
  signups: {
    total: number;
    real_accounts: number;
    first_time_depositors: number;
    first_time_traders: number;
  };
  master_partner: {
    earnings_occurred: number;
    active_subpartners: number;
  };
  activity: {
    paid: number;
    pending: number;
    active_traders: number;
  };
}

export interface AppMarkup {
  app_id: string;
  app_name?: string;
  app_markup_usd: number;
  volume_usd: number;
  payout_usd: number;
  contract_count: number;
  client_count: number;
}

export interface MarkupStatistics {
  total_app_markup_usd: number;
  total_volume_usd: number;
  total_payout_usd: number;
  total_contract_count: number;
  total_client_count: number;
  breakdown: AppMarkup[];
}

export class DerivApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'DerivApiError';
  }
}

export function getMonthDateRange(
  month: number,
  year = new Date().getUTCFullYear(),
): DateRange {
  const start = new Date(Date.UTC(year, month, 1));
  const now = new Date();
  const isCurrentMonth =
    year === now.getUTCFullYear() && month === now.getUTCMonth();
  const end = isCurrentMonth
    ? new Date(Date.UTC(year, month, now.getUTCDate()))
    : new Date(Date.UTC(year, month + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function getCurrentMonthDateRange(): DateRange {
  const now = new Date();
  return getMonthDateRange(now.getUTCMonth(), now.getUTCFullYear());
}

export function getTodayDateRange(): DateRange {
  const today = new Date().toISOString().slice(0, 10);
  return { start: today, end: today };
}

async function getJson<T>(
  path: string,
  session: DerivSession,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${session.token}`,
  };
  headers['Deriv-App-ID'] = session.appId;

  let response: Response;
  try {
    response = await fetch(`https://api.derivws.com${path}`, { headers });
  } catch {
    throw new Error('Unable to reach Deriv. Check your connection and try again.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const record = isRecord(body) ? body : {};
    const errors = Array.isArray(record.errors) ? record.errors : [];
    const firstError = isRecord(errors[0]) ? errors[0] : {};
    const message =
      typeof firstError.message === 'string'
        ? firstError.message
        : `Deriv returned an error (${response.status}).`;
    throw new DerivApiError(message, response.status);
  }

  return body as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function fetchPartnerOverview(
  session: DerivSession,
  range: DateRange,
): Promise<PartnerOverview> {
  const query = new URLSearchParams({
    start_date: range.start,
    end_date: range.end,
  });
  const result = await getJson<PartnerOverview | { data: PartnerOverview }>(
    `/partners/analytics/v1/overview?${query.toString()}`,
    session,
  );
  return 'data' in result ? result.data : result;
}

export async function fetchMarkupStatistics(
  session: DerivSession,
  range: DateRange,
): Promise<MarkupStatistics> {
  const query = new URLSearchParams({
    date_from: range.start,
    date_to: range.end,
  });
  const result = await getJson<
    { data: MarkupStatistics } | MarkupStatistics
  >(`/applications/v1/markup-statistics?${query.toString()}`, session);
  return 'data' in result ? result.data : result;
}

export function friendlyApiError(error: unknown): string {
  if (error instanceof DerivApiError) {
    if (error.status === 401) {
      return 'This token is invalid or has expired. Reconnect your Deriv account.';
    }
    if (error.status === 403) {
      return 'Deriv denied access. The token needs the application_read permission.';
    }
    if (error.status === 404) {
      return 'No Deriv partner profile was found for this account.';
    }
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

export function formatUsd(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD',
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
