import type { PromotionGoalAnalytics, PromotionResultSource } from './promotionResults';

export type MetrikaProjectStats = {
  projectName: string;
  clientName?: string;
  counterId?: number;
  counterName?: string;
  siteUrl?: string;
  periodLabel: string;
  visits: number;
  users: number;
  goalCount: number;
  uniqueQueries: number;
  goalRows: number;
  sampleQueries: string[];
  topQueries: Array<{
    query: string;
    visits: number;
    goals: number;
  }>;
  monthly: Array<{
    month: string;
    visits: number;
    goals: number;
  }>;
};

export type MetrikaStatsPayload = {
  schemaVersion: number;
  updatedAt: string;
  date1: string;
  date2: string;
  periodLabel: string;
  projects: MetrikaProjectStats[];
};

export const EMPTY_METRIKA_STATS: MetrikaStatsPayload = {
  schemaVersion: 1,
  updatedAt: '',
  date1: '',
  date2: '',
  periodLabel: '',
  projects: [],
};

const metrikaFields = ['Дата', 'Поисковая фраза', 'Визиты', 'Пользователи', 'Достижение цели'];

function normalizeProjectName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeMetrikaProjectStats(value: unknown): MetrikaProjectStats | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Partial<MetrikaProjectStats>;
  if (!source.projectName) return null;

  return {
    projectName: String(source.projectName),
    clientName: source.clientName ? String(source.clientName) : undefined,
    counterId: source.counterId ? Number(source.counterId) : undefined,
    counterName: source.counterName ? String(source.counterName) : undefined,
    siteUrl: source.siteUrl ? String(source.siteUrl) : undefined,
    periodLabel: source.periodLabel ? String(source.periodLabel) : 'период Метрики',
    visits: normalizeNumber(source.visits),
    users: normalizeNumber(source.users),
    goalCount: normalizeNumber(source.goalCount),
    uniqueQueries: normalizeNumber(source.uniqueQueries),
    goalRows: normalizeNumber(source.goalRows),
    sampleQueries: Array.isArray(source.sampleQueries) ? source.sampleQueries.map(String).filter(Boolean) : [],
    topQueries: Array.isArray(source.topQueries)
      ? source.topQueries
          .map((item) => ({
            query: String(item?.query ?? ''),
            visits: normalizeNumber(item?.visits),
            goals: normalizeNumber(item?.goals),
          }))
          .filter((item) => item.query)
      : [],
    monthly: Array.isArray(source.monthly)
      ? source.monthly
          .map((item) => ({
            month: String(item?.month ?? ''),
            visits: normalizeNumber(item?.visits),
            goals: normalizeNumber(item?.goals),
          }))
          .filter((item) => item.month)
      : [],
  };
}

export function normalizeMetrikaStatsPayload(value: unknown): MetrikaStatsPayload {
  if (!value || typeof value !== 'object') return EMPTY_METRIKA_STATS;
  const source = value as Partial<MetrikaStatsPayload>;
  const projects = Array.isArray(source.projects)
    ? source.projects
        .map((project) => normalizeMetrikaProjectStats(project))
        .filter((project): project is MetrikaProjectStats => Boolean(project))
    : [];

  return {
    schemaVersion: Number(source.schemaVersion) || 1,
    updatedAt: source.updatedAt ? String(source.updatedAt) : '',
    date1: source.date1 ? String(source.date1) : '',
    date2: source.date2 ? String(source.date2) : '',
    periodLabel: source.periodLabel ? String(source.periodLabel) : '',
    projects,
  };
}

function buildGoalAnalytics(stats: MetrikaProjectStats): PromotionGoalAnalytics {
  return {
    visits: stats.visits,
    uniqueQueries: stats.uniqueQueries,
    goalRows: stats.goalRows,
    goalCount: stats.goalCount,
    topQueries: stats.topQueries,
    monthly: stats.monthly,
  };
}

function buildMetrikaSource(stats: MetrikaProjectStats, baseSource?: PromotionResultSource): PromotionResultSource {
  const sourceUrl =
    baseSource?.url ||
    (stats.counterId ? `https://metrika.yandex.ru/stat/dashboard?id=${stats.counterId}` : stats.siteUrl || '#');
  const updatedLabel = stats.counterId ? `Метрика API · счетчик ${stats.counterId}` : 'Метрика API';

  return {
    id: baseSource?.id ?? `metrika-${normalizeProjectName(stats.projectName).replace(/\s+/g, '-')}`,
    projectName: baseSource?.projectName ?? stats.projectName,
    clientName: baseSource?.clientName ?? stats.clientName ?? stats.projectName,
    spreadsheetTitle: baseSource?.spreadsheetTitle ?? 'Яндекс Метрика',
    sheetName: baseSource?.sheetName ?? 'API',
    url: sourceUrl,
    recordsLabel: `${stats.visits} переходов`,
    periodLabel: stats.periodLabel,
    fields: baseSource?.fields?.length ? baseSource.fields : metrikaFields,
    sampleQueries: stats.sampleQueries.length ? stats.sampleQueries : (baseSource?.sampleQueries ?? []),
    goalExamples: baseSource?.goalExamples?.length ? baseSource.goalExamples : ['Все достижения целей из Метрики'],
    goalAnalytics: buildGoalAnalytics(stats),
    note: `${updatedLabel}${stats.counterName ? ` · ${stats.counterName}` : ''}`,
  };
}

export function mergePromotionSourcesWithMetrika(
  sources: PromotionResultSource[],
  payload: MetrikaStatsPayload,
): PromotionResultSource[] {
  if (!payload.projects.length) return sources;

  const statsByProject = new Map(
    payload.projects.map((project) => [normalizeProjectName(project.projectName), project] as const),
  );
  const mergedKeys = new Set<string>();
  const mergedSources = sources.map((source) => {
    const key = normalizeProjectName(source.projectName);
    const stats = statsByProject.get(key);
    if (!stats) return source;
    mergedKeys.add(key);
    return buildMetrikaSource(stats, source);
  });

  payload.projects.forEach((stats) => {
    const key = normalizeProjectName(stats.projectName);
    if (!mergedKeys.has(key)) mergedSources.push(buildMetrikaSource(stats));
  });

  return mergedSources;
}
