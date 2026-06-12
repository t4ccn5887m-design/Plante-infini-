import { supabaseAdmin, getSupabaseAdminDiagnostics, validateServiceRoleConfig } from "@/lib/supabaseAdmin";
import { FREE_SCAN_LIMIT } from "@/lib/scanQuotaServer";
import {
  ADMIN_STATS_RPC,
  SCAN_COUNTS_TABLE,
  SCAN_LOGS_TABLE,
  SCAN_QUOTA_RPC,
} from "@/lib/quotaTables";
import { fetchStripeMetrics } from "@/lib/stripeAdmin";

const SCAN_COUNTS_MIGRATION_HINT =
  `Table « ${SCAN_COUNTS_TABLE} » absente — exécutez supabase/migrations/20250605120000_scan_counts.sql dans Supabase.`;

function ok(data) {
  return { ok: true, data, error: null };
}

function fail(error, fallback = null) {
  return { ok: false, data: fallback, error: String(error?.message || error) };
}

function isTableNotFoundError(error) {
  const code = error?.code || "";
  const msg = String(error?.message || "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    (msg.includes("could not find") && msg.includes("table")) ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

function isMissingRpcError(error) {
  const msg = String(error?.message || "").toLowerCase();
  return (
    error?.code === "42883" ||
    error?.code === "PGRST202" ||
    msg.includes("could not find the function") ||
    (msg.includes("function") && msg.includes("does not exist"))
  );
}

function startOfDayUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function daysAgoUTC(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatDayKey(iso) {
  return String(iso).slice(0, 10);
}

function buildEmptyDailySeries(days) {
  const series = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    series.push({ date: formatDayKey(d.toISOString()), count: 0 });
  }
  return series;
}

async function probeScanCountsAvailable() {
  const { error } = await supabaseAdmin
    .from(SCAN_COUNTS_TABLE)
    .select("visitor_key", { head: true, count: "exact" });

  if (!error) return { available: true, via: "table" };

  if (isTableNotFoundError(error)) {
    const { error: rpcErr } = await supabaseAdmin.rpc(SCAN_QUOTA_RPC.getQuota, {
      p_visitor_key: "__admin_probe__",
      p_user_id: null,
      p_limit: FREE_SCAN_LIMIT,
    });
    if (!rpcErr || !isMissingRpcError(rpcErr)) {
      return {
        available: false,
        via: "rpc_only",
        error: `${SCAN_COUNTS_MIGRATION_HINT} (RPC quota présente, table illisible via API)`,
      };
    }
    return { available: false, via: null, error: SCAN_COUNTS_MIGRATION_HINT };
  }

  throw error;
}

async function fetchAllScanCountsRows() {
  const rows = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(SCAN_COUNTS_TABLE)
      .select("count, is_premium, visitor_key")
      .range(from, from + pageSize - 1);

    if (error) {
      if (isTableNotFoundError(error)) {
        throw new Error(SCAN_COUNTS_MIGRATION_HINT);
      }
      throw error;
    }

    const batch = data || [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function aggregateScanCountRows(rows) {
  let totalFromCounts = 0;
  let paywallHits = 0;
  let premiumConverted = 0;
  const fingerprints = new Set();

  for (const row of rows) {
    const count = Number(row.count) || 0;
    totalFromCounts += count;
    fingerprints.add(row.visitor_key);
    if (count >= FREE_SCAN_LIMIT) {
      paywallHits += 1;
      if (row.is_premium) premiumConverted += 1;
    }
  }

  return {
    totalFromCounts,
    paywallHits,
    premiumConverted,
    uniqueFingerprints: fingerprints.size,
  };
}

async function fetchScanCountsAggregate() {
  const config = validateServiceRoleConfig();
  const empty = {
    totalFromCounts: 0,
    paywallHits: 0,
    premiumConverted: 0,
    uniqueFingerprints: 0,
  };

  if (!config.ok) {
    return fail(config.error, empty);
  }

  try {
    const probe = await probeScanCountsAvailable();
    if (!probe.available) {
      return fail(probe.error, empty);
    }

    try {
      const rows = await fetchAllScanCountsRows();
      return ok(aggregateScanCountRows(rows));
    } catch (tableErr) {
      const { data, error } = await supabaseAdmin.rpc(ADMIN_STATS_RPC.scanCountsSummary);
      if (!error && data) {
        return ok({
          totalFromCounts: Number(data.total_scans) || 0,
          paywallHits: Number(data.paywall_hits) || 0,
          premiumConverted: Number(data.premium_converted) || 0,
          uniqueFingerprints: Number(data.unique_visitors) || 0,
        });
      }
      if (error && !isMissingRpcError(error)) throw error;
      throw tableErr;
    }
  } catch (e) {
    return fail(e, empty);
  }
}

async function countAuthUsersSince() {
  const config = validateServiceRoleConfig();
  if (!config.ok) {
    return fail(config.error, { total: 0, recent: 0 });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc(ADMIN_STATS_RPC.authAccountsSummary, {
      p_days: 7,
    });
    if (!error && data) {
      return ok({
        total: Number(data.total) || 0,
        recent: Number(data.last_n_days) || 0,
      });
    }

    if (error && !isMissingRpcError(error)) throw error;

    let total = 0;
    let recent = 0;
    let page = 1;
    const perPage = 1000;
    const sinceMs = new Date(daysAgoUTC(6)).getTime();

    while (true) {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listError) throw listError;

      const users = listData?.users || [];
      for (const u of users) {
        if (u.is_anonymous) continue;
        total += 1;
        if (u.created_at && new Date(u.created_at).getTime() >= sinceMs) {
          recent += 1;
        }
      }

      if (users.length < perPage) break;
      page += 1;
    }

    return ok({ total, recent });
  } catch (e) {
    return fail(e, { total: 0, recent: 0 });
  }
}

async function fetchScanLogsStats() {
  const config = validateServiceRoleConfig();
  const empty = {
    today: 0,
    last7: 0,
    last30: 0,
    logsTotal: 0,
    uniqueVisitors: 0,
    dailySeries: buildEmptyDailySeries(30),
    topSpecies: [],
    tableMissing: false,
  };

  if (!config.ok) {
    return fail(config.error, empty);
  }

  try {
    const { count: logsTotal, error: countErr } = await supabaseAdmin
      .from(SCAN_LOGS_TABLE)
      .select("*", { count: "exact", head: true });

    if (countErr) {
      if (isTableNotFoundError(countErr)) {
        return ok({ ...empty, tableMissing: true });
      }
      throw countErr;
    }

    const since30 = daysAgoUTC(29);
    const { data: logs, error: logsErr } = await supabaseAdmin
      .from(SCAN_LOGS_TABLE)
      .select("created_at, species_name, fingerprint")
      .gte("created_at", since30)
      .order("created_at", { ascending: true });

    if (logsErr) throw logsErr;

    const todayStart = new Date(startOfDayUTC()).getTime();
    const sevenStart = new Date(daysAgoUTC(6)).getTime();
    const thirtyStart = new Date(since30).getTime();

    let today = 0;
    let last7 = 0;
    let last30 = 0;
    let dailySeries = buildEmptyDailySeries(30);
    const speciesCounts = new Map();

    for (const log of logs || []) {
      const ts = new Date(log.created_at).getTime();
      if (ts >= todayStart) today += 1;
      if (ts >= sevenStart) last7 += 1;
      if (ts >= thirtyStart) last30 += 1;

      const key = formatDayKey(log.created_at);
      const bucket = dailySeries.find((b) => b.date === key);
      if (bucket) bucket.count += 1;

      const name = (log.species_name || "").trim();
      if (name) speciesCounts.set(name, (speciesCounts.get(name) || 0) + 1);
    }

    const { data: seriesRpc, error: seriesErr } = await supabaseAdmin.rpc(
      ADMIN_STATS_RPC.scanDailySeries,
      { p_days: 30 }
    );
    if (!seriesErr && Array.isArray(seriesRpc) && seriesRpc.length > 0) {
      dailySeries = seriesRpc.map((row) => ({
        date: formatDayKey(row.day),
        count: Number(row.scan_count) || 0,
      }));
    }

    let uniqueVisitors = 0;
    const { data: uniqueRpc, error: uniqueErr } = await supabaseAdmin.rpc(
      ADMIN_STATS_RPC.uniqueScanVisitors
    );
    if (!uniqueErr && uniqueRpc != null) {
      uniqueVisitors = Number(uniqueRpc) || 0;
    } else if (!uniqueErr) {
      const { data: fpRows, error: fpErr } = await supabaseAdmin
        .from(SCAN_LOGS_TABLE)
        .select("fingerprint");
      if (fpErr) throw fpErr;
      uniqueVisitors = new Set((fpRows || []).map((r) => r.fingerprint).filter(Boolean)).size;
    } else if (!isMissingRpcError(uniqueErr)) {
      throw uniqueErr;
    }

    let topSpecies = [...speciesCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const { data: topRpc, error: topErr } = await supabaseAdmin.rpc(
      ADMIN_STATS_RPC.topScannedSpecies,
      { p_limit: 10 }
    );
    if (!topErr && Array.isArray(topRpc)) {
      topSpecies = topRpc.map((row) => ({
        name: row.species_name,
        count: Number(row.scan_count) || 0,
      }));
    } else if (topErr && !isMissingRpcError(topErr)) {
      throw topErr;
    }

    return ok({
      today,
      last7,
      last30,
      logsTotal: logsTotal || 0,
      uniqueVisitors,
      dailySeries,
      topSpecies,
      tableMissing: false,
    });
  } catch (e) {
    if (isTableNotFoundError(e)) {
      return ok({ ...empty, tableMissing: true });
    }
    return fail(e, empty);
  }
}

async function fetchStripeSection() {
  try {
    const data = await fetchStripeMetrics();
    if (data.error) {
      return fail(data.error, data);
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return fail("STRIPE_SECRET_KEY manquante côté serveur", data);
    }
    return ok(data);
  } catch (e) {
    return fail(e, {
      available: false,
      activeTotal: 0,
      monthly: 0,
      yearly: 0,
      mrr: 0,
      totalRevenue: 0,
      currency: "eur",
    });
  }
}

export async function fetchAdminStats() {
  const [scanLogsR, scanCountsR, accountsR, stripeR] = await Promise.all([
    fetchScanLogsStats(),
    fetchScanCountsAggregate(),
    countAuthUsersSince(),
    fetchStripeSection(),
  ]);

  const scanLogs = scanLogsR.data;
  const scanCounts = scanCountsR.data;
  const accounts = accountsR.data;
  const stripe = stripeR.data;

  const conversionRate =
    scanCounts.paywallHits > 0
      ? Math.round((scanCounts.premiumConverted / scanCounts.paywallHits) * 1000) / 10
      : 0;

  const totalScans = Math.max(scanCounts.totalFromCounts, scanLogs.logsTotal);

  return {
    generatedAt: new Date().toISOString(),
    meta: {
      supabase: getSupabaseAdminDiagnostics(),
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      scanCountsTable: SCAN_COUNTS_TABLE,
      scanLogsTable: SCAN_LOGS_TABLE,
    },
    scans: {
      today: scanLogs.today,
      last7Days: scanLogs.last7,
      last30Days: scanLogs.last30,
      total: totalScans,
      dailySeries: scanLogs.dailySeries,
      logsTableMissing: Boolean(scanLogs.tableMissing),
      error: scanLogsR.error || scanCountsR.error,
      errors: {
        period: scanLogsR.error,
        total: scanCountsR.error,
      },
    },
    visitors: {
      unique: Math.max(scanLogs.uniqueVisitors, scanCounts.uniqueFingerprints),
      error: scanCountsR.error || scanLogsR.error,
    },
    accounts: {
      total: accounts.total,
      last7Days: accounts.recent,
      error: accountsR.error,
    },
    premium: {
      activeFromStripe: stripe.activeTotal,
      monthly: stripe.monthly,
      yearly: stripe.yearly,
      stripeAvailable: stripe.available,
      error: stripeR.error,
    },
    revenue: {
      total: stripe.totalRevenue,
      mrr: stripe.mrr,
      currency: stripe.currency,
      stripeAvailable: stripe.available,
      error: stripeR.error,
    },
    conversion: {
      paywallHits: scanCounts.paywallHits,
      premiumConverted: scanCounts.premiumConverted,
      ratePercent: conversionRate,
      error: scanCountsR.error,
    },
    topSpecies: {
      items: scanLogs.topSpecies,
      error: scanLogsR.error,
    },
  };
}
