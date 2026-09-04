import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { domainToASCII, fileURLToPath } from 'node:url';

const API_BASE = 'https://api.webmaster.yandex.net/v4';
const OUTPUT_PATH = fileURLToPath(new URL('../public/data/webmaster-feeds.json', import.meta.url));
const PAGE_LIMIT = 100;
const MAX_PAGES = 50;
const REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_PROJECTS = [
  {
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    siteUrl: 'https://аквагард.рф',
    siteUrls: ['https://аквагард.рф', 'https://xn--80aaijvlh0acd.xn--p1ai'],
  },
];

const FEED_TYPE_LABELS = {
  REALTY: 'Недвижимость',
  VACANCY: 'Вакансии',
  DOCTORS: 'Врачи',
  CARS: 'Авто',
  SERVICES: 'Услуги',
  EDUCATION: 'Образование',
};

const FEED_STATUS_LABELS = {
  IN_PROGRESS: 'Проверяется',
  SUCCESS: 'Проверен',
  ERROR: 'Есть ошибки',
  MODERATION_FAILED: 'Не прошел проверку качества',
  MODERATION_BANNED: 'Критический отказ',
  SETS_CHECK_FAILED: 'Ошибка наборов',
  EMPTY_FEED: 'Пустой фид',
  DOWNLOAD_FAILED: 'Проблемы скачивания',
};

function parseJsonEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${name} должен быть валидным JSON. ${error.message}`);
  }
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function stringValue(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function compactText(value, limit = 500) {
  const text = stringValue(value)
    .replace(/[A-Za-z0-9_-]{28,}/g, '[скрыто]')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}…` : text;
}

function safeErrorLabel(method, error) {
  const message = error instanceof Error ? error.message : String(error);
  return compactText(`${method}: ${message}`, 700);
}

function safePublicUrl(value) {
  const raw = stringValue(value);
  if (!raw) return '';

  try {
    const url = new URL(raw);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return compactText(raw.replace(/[?#].*$/, ''), 500);
  }
}

function normalizeHost(value) {
  const raw = stringValue(value);
  if (!raw) return '';

  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    return domainToASCII(url.hostname.toLowerCase()).replace(/^www\./, '');
  } catch {
    return domainToASCII(raw.toLowerCase()).replace(/^www\./, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

function hostUrls(host) {
  const mirror = host?.main_mirror && typeof host.main_mirror === 'object' ? host.main_mirror : {};
  return [
    host?.ascii_host_url,
    host?.unicode_host_url,
    host?.host_display_name,
    mirror.ascii_host_url,
    mirror.unicode_host_url,
  ]
    .map(normalizeHost)
    .filter(Boolean);
}

function hostMatchesProject(host, project) {
  const projectHosts = (project.siteUrls ?? [project.siteUrl]).map(normalizeHost).filter(Boolean);
  const yandexHosts = hostUrls(host);
  return projectHosts.some((projectHost) =>
    yandexHosts.some((hostValue) => hostValue === projectHost || hostValue.endsWith(`.${projectHost}`)),
  );
}

function pathUrl(pathname, params = {}) {
  const url = new URL(`${API_BASE}${pathname}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url;
}

async function apiGet(pathname, params, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(pathUrl(pathname, params), {
      headers: {
        Accept: 'application/json',
        Authorization: `OAuth ${token}`,
      },
      signal: controller.signal,
    });
    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Yandex Webmaster API вернул не JSON, HTTP ${response.status}.`);
    }

    if (!response.ok) {
      const message = payload.error_message || payload.error_description || payload.message || text.slice(0, 500);
      throw new Error(`HTTP ${response.status}: ${message}`);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSummary(summary) {
  const byStatus = summary?.byStatus && typeof summary.byStatus === 'object' ? summary.byStatus : {};
  return {
    count: numberValue(summary?.count),
    byStatus: Object.fromEntries(Object.entries(byStatus).map(([key, value]) => [key, numberValue(value)])),
    feedErrorsCount: numberValue(summary?.feedErrorsCount),
    feedWarningsCount: numberValue(summary?.feedWarningsCount),
    hostErrorsCount: numberValue(summary?.hostErrorsCount),
    hostWarningsCount: numberValue(summary?.hostWarningsCount),
    moderationRejectedOffersCount: numberValue(summary?.moderationRejectedOffersCount),
  };
}

function normalizeFeed(feed) {
  const type = stringValue(feed?.type);
  const status = stringValue(feed?.status);
  const regionIds = Array.isArray(feed?.regionIds) ? feed.regionIds.map(numberValue).filter((id) => id > 0) : [];

  return {
    url: safePublicUrl(feed?.url),
    type,
    typeLabel: FEED_TYPE_LABELS[type] || type || 'Фид',
    regionIds,
    status,
    statusLabel: FEED_STATUS_LABELS[status] || status || 'Без статуса',
    addedTime: stringValue(feed?.addedTime),
    lastAccessTime: stringValue(feed?.lastAccessTime),
    errorsCount: numberValue(feed?.errorsCount),
    warningsCount: numberValue(feed?.warningsCount),
    moderationRejectedOffersCount: numberValue(feed?.moderationRejectedOffersCount),
  };
}

async function fetchUserId(token) {
  const payload = await apiGet('/user', {}, token);
  return stringValue(payload.user_id ?? payload['user-id']);
}

async function fetchHosts(userId, token) {
  const payload = await apiGet(`/user/${encodeURIComponent(userId)}/hosts`, {}, token);
  return Array.isArray(payload.hosts) ? payload.hosts : [];
}

async function fetchHostInfo(userId, hostId, token) {
  return apiGet(`/user/${encodeURIComponent(userId)}/hosts/${encodeURIComponent(hostId)}`, {}, token);
}

async function fetchFeedsSummary(userId, hostId, token) {
  const payload = await apiGet(`/user/${encodeURIComponent(userId)}/hosts/${encodeURIComponent(hostId)}/feeds/summary`, {}, token);
  return normalizeSummary(payload);
}

async function fetchFeedStatuses(userId, hostId, token) {
  const feeds = [];
  let total = 0;

  for (let offset = 0; offset < PAGE_LIMIT * MAX_PAGES; offset += PAGE_LIMIT) {
    const payload = await apiGet(
      `/user/${encodeURIComponent(userId)}/hosts/${encodeURIComponent(hostId)}/feeds/status/list`,
      {
        offset,
        limit: PAGE_LIMIT,
        orderBy: 'LAST_ACCESS_TIME',
        orderDirection: 'DESC',
      },
      token,
    );
    const rows = Array.isArray(payload.feeds) ? payload.feeds : [];
    total = numberValue(payload.count);
    feeds.push(...rows.map(normalizeFeed).filter((feed) => feed.url));
    if (!rows.length || feeds.length >= total) break;
  }

  return feeds;
}

async function readExistingPayload() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
  } catch {
    return {
      schemaVersion: 1,
      updatedAt: '',
      userId: '',
      projects: [],
      errors: [],
    };
  }
}

async function writePayload(payload) {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function emptyPayload(errors = []) {
  return {
    schemaVersion: 1,
    updatedAt: '',
    userId: '',
    projects: [],
    errors,
  };
}

async function main() {
  const token = process.env.WEBMASTER_OAUTH_TOKEN || process.env.YANDEX_OAUTH_TOKEN;
  if (!token) {
    await writePayload(
      emptyPayload([
        'WEBMASTER_OAUTH_TOKEN или YANDEX_OAUTH_TOKEN не задан в GitHub Secrets. В браузер токен не передается.',
      ]),
    );
    console.log('Yandex Webmaster token is not set. Empty snapshot with diagnostic was written.');
    return;
  }

  const projects = parseJsonEnv('WEBMASTER_PROJECTS', DEFAULT_PROJECTS);
  const previous = await readExistingPayload();
  const errors = [];
  let userId = '';

  try {
    userId = await fetchUserId(token);
  } catch (error) {
    await writePayload(emptyPayload([safeErrorLabel('GET /user', error)]));
    return;
  }

  let hosts = [];
  try {
    hosts = await fetchHosts(userId, token);
  } catch (error) {
    await writePayload(emptyPayload([safeErrorLabel('GET /hosts', error)]));
    return;
  }

  const projectFeeds = [];
  for (const project of projects) {
    const projectErrors = [];
    const host = hosts.find((item) => hostMatchesProject(item, project));

    if (!host) {
      projectErrors.push(`Сайт ${project.siteUrl || project.projectName} не найден в Яндекс.Вебмастере для этого токена.`);
      projectFeeds.push({
        projectName: project.projectName,
        clientName: project.clientName || project.projectName,
        siteUrl: project.siteUrl || project.siteUrls?.[0] || '',
        hostId: '',
        hostDisplayName: '',
        verified: false,
        hostDataStatus: '',
        summary: normalizeSummary({}),
        feeds: [],
        errors: projectErrors,
      });
      continue;
    }

    const hostId = stringValue(host.host_id);
    let hostInfo = host;
    let summary = normalizeSummary({});
    let feeds = [];

    try {
      hostInfo = await fetchHostInfo(userId, hostId, token);
    } catch (error) {
      projectErrors.push(safeErrorLabel('GET /hosts/{host-id}', error));
    }

    try {
      summary = await fetchFeedsSummary(userId, hostId, token);
    } catch (error) {
      projectErrors.push(safeErrorLabel('GET /feeds/summary', error));
    }

    try {
      feeds = await fetchFeedStatuses(userId, hostId, token);
    } catch (error) {
      projectErrors.push(safeErrorLabel('GET /feeds/status/list', error));
    }

    projectFeeds.push({
      projectName: project.projectName,
      clientName: project.clientName || project.projectName,
      siteUrl: project.siteUrl || project.siteUrls?.[0] || '',
      hostId,
      hostDisplayName: compactText(hostInfo.host_display_name || hostInfo.unicode_host_url || hostInfo.ascii_host_url || ''),
      verified: Boolean(hostInfo.verified),
      hostDataStatus: stringValue(hostInfo.host_data_status),
      summary,
      feeds,
      errors: projectErrors,
    });
  }

  await writePayload({
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    userId,
    projects: projectFeeds.length ? projectFeeds : previous.projects ?? [],
    errors,
  });
}

main().catch((error) => {
  console.error(safeErrorLabel('webmaster', error));
  process.exitCode = 1;
});
