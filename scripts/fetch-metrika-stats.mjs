import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { domainToASCII, fileURLToPath } from 'node:url';

const API_BASE = 'https://api-metrika.yandex.net';
const OUTPUT_PATH = fileURLToPath(new URL('../public/data/metrika-stats.json', import.meta.url));
const DATE_1 = process.env.METRIKA_DATE1 || defaultDate1();
const DATE_2 = process.env.METRIKA_DATE2 || todayIso();

const DEFAULT_PROJECTS = [
  { projectName: 'Часы', clientName: 'WatchStore', siteUrls: ['https://watchstoree.ru'] },
  { projectName: 'Свич', clientName: 'Свитч', siteUrls: ['https://switch-eng.ru'] },
  { projectName: 'Аквагард', clientName: 'Аквагард', siteUrls: ['https://аквагард.рф'] },
  { projectName: 'Промтех', clientName: 'Макулатура', siteUrls: ['https://promtehmakulatura.ru'] },
  { projectName: 'Смартстрой', clientName: 'СмартСтрой', siteUrls: ['https://smart-spb.pro'] },
  { projectName: 'Балт-паллет', clientName: 'Паллет', siteUrls: ['https://balt-pallet.ru'] },
  { projectName: 'Ломбард', clientName: 'ЛомбардБанка', siteUrls: ['https://lombard-banka.ru'] },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function defaultDate1() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-04-01`;
}

function normalizeProjectName(value) {
  return value.trim().toLowerCase();
}

function numberValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatRuMonth(value) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'short' })
    .format(new Date(`${value}T12:00:00`))
    .replace('.', '');
}

function formatRuDate(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(`${value}T12:00:00`));
}

function parseJsonEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${name} должен быть валидным JSON. ${error.message}`);
  }
}

function parseCounterMap() {
  const raw = process.env.METRIKA_COUNTER_MAP;
  if (!raw) return new Map();

  try {
    const parsed = JSON.parse(raw);
    return new Map(Object.entries(parsed).map(([project, id]) => [normalizeProjectName(project), Number(id)]));
  } catch {
    return new Map(
      raw
        .split(',')
        .map((pair) => pair.split('='))
        .filter(([project, id]) => project && id)
        .map(([project, id]) => [normalizeProjectName(project), Number(id)]),
    );
  }
}

function normalizeHost(value) {
  if (!value) return '';
  const raw = String(value).trim();
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    return domainToASCII(url.hostname.toLowerCase()).replace(/^www\./, '');
  } catch {
    return domainToASCII(raw.toLowerCase()).replace(/^www\./, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

function getCounterHosts(counter) {
  const mirrors = Array.isArray(counter.mirrors)
    ? counter.mirrors.map((mirror) => (typeof mirror === 'string' ? mirror : mirror?.site || mirror?.url))
    : [];
  return [counter.site, counter.domain, ...mirrors].map(normalizeHost).filter(Boolean);
}

function counterMatchesProject(counter, project) {
  const projectHosts = project.siteUrls.map(normalizeHost).filter(Boolean);
  const counterHosts = getCounterHosts(counter);
  return projectHosts.some((projectHost) =>
    counterHosts.some((counterHost) => counterHost === projectHost || counterHost.endsWith(`.${projectHost}`)),
  );
}

async function apiGet(path, params, token) {
  const url = new URL(path, API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `OAuth ${token}`,
      'Content-Type': 'application/x-yametrika+json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Метрика API ${response.status}: ${body.slice(0, 500)}`);
  }

  return response.json();
}

async function fetchCounters(token) {
  const result = await apiGet('/management/v1/counters', { per_page: 10000 }, token);
  return Array.isArray(result.counters) ? result.counters : [];
}

async function fetchTableStats(counterId, token, includeGoals = true) {
  const metrics = includeGoals ? 'ym:s:visits,ym:s:users,ym:s:goalReachesAny' : 'ym:s:visits,ym:s:users';
  const result = await apiGet(
    '/stat/v1/data',
    {
      ids: counterId,
      date1: DATE_1,
      date2: DATE_2,
      metrics,
      dimensions: 'ym:s:lastsignSearchPhrase',
      sort: '-ym:s:visits',
      limit: 100,
      accuracy: 'full',
      lang: 'ru',
    },
    token,
  );

  const rows = Array.isArray(result.data) ? result.data : [];
  const queryRows = rows
    .map((row) => {
      const query = row.dimensions?.[0]?.name || '';
      const visits = numberValue(row.metrics?.[0]);
      const goals = includeGoals ? numberValue(row.metrics?.[2]) : 0;
      return { query, visits, goals };
    })
    .filter((row) => row.query && row.query !== 'undefined');

  const topQueries = [...queryRows]
    .sort((left, right) => right.goals - left.goals || right.visits - left.visits)
    .slice(0, 8);

  return {
    visits: numberValue(result.totals?.[0]),
    users: numberValue(result.totals?.[1]),
    goalCount: includeGoals ? numberValue(result.totals?.[2]) : 0,
    uniqueQueries: numberValue(result.total_rows) || queryRows.length,
    goalRows: queryRows.filter((row) => row.goals > 0).length,
    sampleQueries: queryRows.slice(0, 3).map((row) => row.query),
    topQueries,
  };
}

async function fetchMonthlyStats(counterId, token, includeGoals = true) {
  const metrics = includeGoals ? 'ym:s:visits,ym:s:goalReachesAny' : 'ym:s:visits';
  const result = await apiGet(
    '/stat/v1/data/bytime',
    {
      ids: counterId,
      date1: DATE_1,
      date2: DATE_2,
      metrics,
      group: 'month',
      accuracy: 'full',
      lang: 'ru',
    },
    token,
  );
  const intervals = Array.isArray(result.time_intervals) ? result.time_intervals : [];
  const metricRows = result.data?.[0]?.metrics ?? result.totals ?? [];
  const visitsByMonth = Array.isArray(metricRows[0]) ? metricRows[0] : [];
  const goalsByMonth = includeGoals && Array.isArray(metricRows[1]) ? metricRows[1] : [];

  return intervals.map((interval, index) => ({
    month: formatRuMonth(interval[0]),
    visits: numberValue(visitsByMonth[index]),
    goals: numberValue(goalsByMonth[index]),
  }));
}

async function fetchProjectStats(project, counter, token) {
  let table;
  let monthly;

  try {
    table = await fetchTableStats(counter.id, token, true);
    monthly = await fetchMonthlyStats(counter.id, token, true);
  } catch (error) {
    if (!String(error.message).includes('goalReachesAny')) throw error;
    table = await fetchTableStats(counter.id, token, false);
    monthly = await fetchMonthlyStats(counter.id, token, false);
  }

  return {
    projectName: project.projectName,
    clientName: project.clientName,
    counterId: counter.id,
    counterName: counter.name || counter.site || '',
    siteUrl: project.siteUrls[0],
    periodLabel: `${formatRuDate(DATE_1)} - ${formatRuDate(DATE_2)}`,
    visits: table.visits,
    users: table.users,
    goalCount: table.goalCount,
    uniqueQueries: table.uniqueQueries,
    goalRows: table.goalRows,
    sampleQueries: table.sampleQueries,
    topQueries: table.topQueries,
    monthly,
  };
}

async function readExistingPayload() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
  } catch {
    return {
      schemaVersion: 1,
      updatedAt: '',
      date1: '',
      date2: '',
      periodLabel: '',
      projects: [],
    };
  }
}

async function writePayload(payload) {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function main() {
  const token = process.env.YANDEX_OAUTH_TOKEN;
  if (!token) {
    console.log('YANDEX_OAUTH_TOKEN не задан. Файл статистики оставлен без изменений.');
    return;
  }

  const projects = parseJsonEnv('METRIKA_PROJECTS', DEFAULT_PROJECTS);
  const counterMap = parseCounterMap();
  const counters = await fetchCounters(token);
  const projectStats = [];

  for (const project of projects) {
    const overrideId = counterMap.get(normalizeProjectName(project.projectName));
    const counter = overrideId
      ? counters.find((item) => Number(item.id) === overrideId) || { id: overrideId, name: project.projectName }
      : counters.find((item) => counterMatchesProject(item, project));

    if (!counter) {
      console.log(`Счетчик не найден: ${project.projectName}`);
      continue;
    }

    try {
      const stats = await fetchProjectStats(project, counter, token);
      projectStats.push(stats);
      console.log(`Обновлено: ${project.projectName}`);
    } catch (error) {
      console.log(`Не удалось обновить ${project.projectName}: ${error.message}`);
    }
  }

  const previous = await readExistingPayload();
  const payload = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    date1: DATE_1,
    date2: DATE_2,
    periodLabel: `${formatRuDate(DATE_1)} - ${formatRuDate(DATE_2)}`,
    projects: projectStats.length ? projectStats : previous.projects ?? [],
  };

  await writePayload(payload);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
