export type WebmasterFeedSummary = {
  count: number;
  byStatus: Record<string, number>;
  feedErrorsCount: number;
  feedWarningsCount: number;
  hostErrorsCount: number;
  hostWarningsCount: number;
  moderationRejectedOffersCount: number;
};

export type WebmasterFeed = {
  url: string;
  type: string;
  typeLabel: string;
  regionIds: number[];
  status: string;
  statusLabel: string;
  addedTime: string;
  lastAccessTime: string;
  errorsCount: number;
  warningsCount: number;
  moderationRejectedOffersCount: number;
};

export type WebmasterProjectFeeds = {
  projectName: string;
  clientName: string;
  siteUrl: string;
  hostId: string;
  hostDisplayName: string;
  verified: boolean;
  hostDataStatus: string;
  summary: WebmasterFeedSummary;
  feeds: WebmasterFeed[];
  errors: string[];
};

export type WebmasterFeedsPayload = {
  schemaVersion: number;
  updatedAt: string;
  userId: string;
  projects: WebmasterProjectFeeds[];
  errors: string[];
};

export const EMPTY_WEBMASTER_FEEDS: WebmasterFeedsPayload = {
  schemaVersion: 1,
  updatedAt: '',
  userId: '',
  projects: [],
  errors: [],
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toStringValue(value: unknown) {
  return value === undefined || value === null ? '' : String(value);
}

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  const normalized = toStringValue(value).toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'y';
}

function toNumberArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toNumber(item)).filter((item) => item > 0);
}

function normalizeSummary(value: unknown): WebmasterFeedSummary {
  const source = toRecord(value);
  const byStatus = toRecord(source.byStatus);

  return {
    count: toNumber(source.count),
    byStatus: Object.fromEntries(Object.entries(byStatus).map(([key, count]) => [key, toNumber(count)])),
    feedErrorsCount: toNumber(source.feedErrorsCount),
    feedWarningsCount: toNumber(source.feedWarningsCount),
    hostErrorsCount: toNumber(source.hostErrorsCount),
    hostWarningsCount: toNumber(source.hostWarningsCount),
    moderationRejectedOffersCount: toNumber(source.moderationRejectedOffersCount),
  };
}

function normalizeFeed(value: unknown): WebmasterFeed | null {
  const source = toRecord(value);
  const url = toStringValue(source.url);
  if (!url) return null;

  return {
    url,
    type: toStringValue(source.type),
    typeLabel: toStringValue(source.typeLabel) || toStringValue(source.type) || 'Фид',
    regionIds: toNumberArray(source.regionIds),
    status: toStringValue(source.status),
    statusLabel: toStringValue(source.statusLabel) || toStringValue(source.status) || 'Без статуса',
    addedTime: toStringValue(source.addedTime),
    lastAccessTime: toStringValue(source.lastAccessTime),
    errorsCount: toNumber(source.errorsCount),
    warningsCount: toNumber(source.warningsCount),
    moderationRejectedOffersCount: toNumber(source.moderationRejectedOffersCount),
  };
}

function normalizeProject(value: unknown): WebmasterProjectFeeds | null {
  const source = toRecord(value);
  const projectName = toStringValue(source.projectName);
  if (!projectName) return null;

  const feeds = Array.isArray(source.feeds)
    ? source.feeds.map((feed) => normalizeFeed(feed)).filter((feed): feed is WebmasterFeed => Boolean(feed))
    : [];

  return {
    projectName,
    clientName: toStringValue(source.clientName) || projectName,
    siteUrl: toStringValue(source.siteUrl),
    hostId: toStringValue(source.hostId),
    hostDisplayName: toStringValue(source.hostDisplayName),
    verified: toBoolean(source.verified),
    hostDataStatus: toStringValue(source.hostDataStatus),
    summary: normalizeSummary(source.summary),
    feeds,
    errors: Array.isArray(source.errors) ? source.errors.map(String).filter(Boolean) : [],
  };
}

export function normalizeWebmasterFeedsPayload(value: unknown): WebmasterFeedsPayload {
  if (!value || typeof value !== 'object') return EMPTY_WEBMASTER_FEEDS;
  const source = value as Partial<WebmasterFeedsPayload>;

  return {
    schemaVersion: Number(source.schemaVersion) || 1,
    updatedAt: toStringValue(source.updatedAt),
    userId: toStringValue(source.userId),
    projects: Array.isArray(source.projects)
      ? source.projects
          .map((project) => normalizeProject(project))
          .filter((project): project is WebmasterProjectFeeds => Boolean(project))
      : [],
    errors: Array.isArray(source.errors) ? source.errors.map(String).filter(Boolean) : [],
  };
}
