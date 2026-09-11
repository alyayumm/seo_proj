const API_BASE = 'https://api-metrika.yandex.net';
const ORGANIC_FILTER = "ym:s:trafficSource=='organic'";
const ATTRIBUTION = 'lastsign';
const SOURCE_TIMEZONE = '+03:00';
const GOAL_REACH_METRIC = 'ym:s:anyGoalReaches';
const QUERY_ROW_LIMIT = 20000;
const QUERY_PAGE_SIZE = 10000;
const ALLOWED_CALLBACK = /^[a-zA-Z_$][0-9a-zA-Z_$.]{0,90}$/;

const DEFAULT_PROJECTS = [
  { projectName: 'Часы', clientName: 'WatchStore', counterId: 95877415, siteUrl: 'https://watchstoree.ru' },
  { projectName: 'Свич', clientName: 'Свитч', counterId: 99951775, siteUrl: 'https://switch-eng.ru' },
  { projectName: 'Аквагард', clientName: 'Аквагард', counterId: 103419904, siteUrl: 'https://аквагард.рф' },
  { projectName: 'Промтех', clientName: 'Макулатура', counterId: 99590873, siteUrl: 'https://promtehmakulatura.ru' },
  { projectName: 'Смартстрой', clientName: 'СмартСтрой', counterId: 107615431, siteUrl: 'https://smart-spb.pro' },
  { projectName: 'Балт-паллет', clientName: 'Паллет', counterId: 99163159, siteUrl: 'https://balt-pallet.ru' },
  { projectName: 'Ломбард', clientName: 'ЛомбардБанка', counterId: 109615906, siteUrl: 'https://lombard-banka.ru' },
];

function doGet(event) {
  const callback = getSafeCallback(event);

  try {
    return outputJson(getLiveMetrikaStats(event), callback);
  } catch (error) {
    return outputJson(
      {
        status: 'error',
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        message: sanitizeError(error),
        projects: [],
      },
      callback,
    );
  }
}

function getLiveMetrikaStats(event) {
  const token = getSecret('YANDEX_OAUTH_TOKEN');
  const date1 = getRequestValue(event, 'date1') || getSecret('METRIKA_DATE1', false) || defaultDate1();
  const date2 = getRequestValue(event, 'date2') || getSecret('METRIKA_DATE2', false) || todayIso();
  const projects = getConfiguredProjects();
  const projectStats = [];

  projects.forEach((project) => {
    try {
      projectStats.push(fetchProjectStats(project, token, date1, date2));
    } catch (error) {
      projectStats.push({
        projectName: project.projectName,
        clientName: project.clientName,
        counterId: project.counterId,
        siteUrl: project.siteUrl,
        periodLabel: formatPeriodLabel(date1, date2),
        metricScope: 'organic_search',
        filter: ORGANIC_FILTER,
        attribution: ATTRIBUTION,
        timezone: SOURCE_TIMEZONE,
        dataStatus: 'error',
        fullCoverageDate: date2,
        visits: 0,
        users: 0,
        goalCount: 0,
        uniqueQueries: 0,
        goalRows: 0,
        sampleQueries: [],
        queries: [],
        topQueries: [],
        daily: [],
        weekly: [],
        monthly: [],
        error: sanitizeError(error),
      });
    }
  });

  return {
    status: 'ok',
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    date1,
    date2,
    periodLabel: formatPeriodLabel(date1, date2),
    projects: projectStats,
  };
}

function fetchProjectStats(project, token, date1, date2) {
  let summary;
  let table;
  let daily;
  let weekly;
  let monthly;

  try {
    summary = fetchSummaryStats(project.counterId, token, date1, date2, true);
    table = fetchTableStats(project.counterId, token, date1, date2, true);
    daily = fetchTimeStats(project.counterId, token, date1, date2, 'day', true);
    weekly = fetchTimeStats(project.counterId, token, date1, date2, 'week', true);
    monthly = fetchTimeStats(project.counterId, token, date1, date2, 'month', true);
  } catch (error) {
    if (String(error && error.message).indexOf(GOAL_REACH_METRIC) === -1) throw error;
    summary = fetchSummaryStats(project.counterId, token, date1, date2, false);
    table = fetchTableStats(project.counterId, token, date1, date2, false);
    daily = fetchTimeStats(project.counterId, token, date1, date2, 'day', false);
    weekly = fetchTimeStats(project.counterId, token, date1, date2, 'week', false);
    monthly = fetchTimeStats(project.counterId, token, date1, date2, 'month', false);
  }

  return {
    projectName: project.projectName,
    clientName: project.clientName,
    counterId: project.counterId,
    counterName: project.clientName,
    siteUrl: project.siteUrl,
    periodLabel: formatPeriodLabel(date1, date2),
    metricScope: 'organic_search',
    filter: ORGANIC_FILTER,
    attribution: ATTRIBUTION,
    timezone: SOURCE_TIMEZONE,
    dataStatus: 'ok',
    fullCoverageDate: date2,
    visits: summary.visits,
    users: summary.users,
    goalCount: summary.goalCount,
    queryVisits: table.visits,
    queryGoalCount: table.goalCount,
    uniqueQueries: table.uniqueQueries,
    goalRows: table.goalRows,
    sampleQueries: table.sampleQueries,
    queries: table.queries,
    topQueries: table.topQueries,
    daily,
    weekly,
    monthly,
  };
}

function fetchSummaryStats(counterId, token, date1, date2, includeGoals) {
  const metrics = includeGoals ? `ym:s:visits,ym:s:users,${GOAL_REACH_METRIC}` : 'ym:s:visits,ym:s:users';
  const result = apiGet(
    '/stat/v1/data',
    {
      ids: counterId,
      date1,
      date2,
      metrics,
      accuracy: 'full',
      lang: 'ru',
      filters: ORGANIC_FILTER,
      attribution: ATTRIBUTION,
    },
    token,
  );

  return {
    visits: numberValue(result.totals && result.totals[0]),
    users: numberValue(result.totals && result.totals[1]),
    goalCount: includeGoals ? numberValue(result.totals && result.totals[2]) : 0,
  };
}

function fetchTableStats(counterId, token, date1, date2, includeGoals) {
  const metrics = includeGoals ? `ym:s:visits,ym:s:users,${GOAL_REACH_METRIC}` : 'ym:s:visits,ym:s:users';
  const queryRowsByName = {};
  let totals = [];
  let totalRows = 0;

  for (let offset = 1; offset <= QUERY_ROW_LIMIT; offset += QUERY_PAGE_SIZE) {
    const result = apiGet(
      '/stat/v1/data',
      {
        ids: counterId,
        date1,
        date2,
        metrics,
        dimensions: 'ym:s:lastsignSearchPhrase',
        sort: '-ym:s:visits',
        limit: QUERY_PAGE_SIZE,
        offset,
        accuracy: 'full',
        lang: 'ru',
        filters: ORGANIC_FILTER,
        attribution: ATTRIBUTION,
      },
      token,
    );

    if (!totals.length) totals = Array.isArray(result.totals) ? result.totals : [];
    totalRows = numberValue(result.total_rows) || totalRows;

    const rows = Array.isArray(result.data) ? result.data : [];
    rows
      .map((row) => ({
        query: row.dimensions && row.dimensions[0] ? row.dimensions[0].name || '' : '',
        visits: numberValue(row.metrics && row.metrics[0]),
        goals: includeGoals ? numberValue(row.metrics && row.metrics[2]) : 0,
      }))
      .filter((row) => row.query && row.query !== 'undefined')
      .forEach((row) => {
        const current = queryRowsByName[row.query] || { query: row.query, visits: 0, goals: 0 };
        current.visits += row.visits;
        current.goals += row.goals;
        queryRowsByName[row.query] = current;
      });

    if (rows.length < QUERY_PAGE_SIZE || (totalRows && offset + rows.length > totalRows)) break;
  }

  const queryRows = Object.keys(queryRowsByName)
    .map((key) => queryRowsByName[key])
    .sort((left, right) => right.goals - left.goals || right.visits - left.visits || left.query.localeCompare(right.query, 'ru'));

  return {
    visits: numberValue(totals && totals[0]),
    users: numberValue(totals && totals[1]),
    goalCount: includeGoals ? numberValue(totals && totals[2]) : 0,
    uniqueQueries: totalRows || queryRows.length,
    goalRows: queryRows.filter((row) => row.goals > 0).length,
    sampleQueries: queryRows.slice(0, 3).map((row) => row.query),
    queries: queryRows,
    topQueries: queryRows.slice(0, 8),
  };
}

function fetchTimeStats(counterId, token, date1, date2, group, includeGoals) {
  const metrics = includeGoals ? `ym:s:visits,${GOAL_REACH_METRIC}` : 'ym:s:visits';
  const result = apiGet(
    '/stat/v1/data/bytime',
    {
      ids: counterId,
      date1,
      date2,
      metrics,
      group,
      accuracy: 'full',
      lang: 'ru',
      filters: ORGANIC_FILTER,
      attribution: ATTRIBUTION,
    },
    token,
  );
  const intervals = Array.isArray(result.time_intervals) ? result.time_intervals : [];
  const metricRows = result.data && result.data[0] && result.data[0].metrics ? result.data[0].metrics : result.totals || [];
  const visitsByPeriod = Array.isArray(metricRows[0]) ? metricRows[0] : [];
  const goalsByPeriod = includeGoals && Array.isArray(metricRows[1]) ? metricRows[1] : [];

  return intervals.map((interval, index) => ({
    month: formatTimeIntervalLabel(interval, group),
    date: interval[0],
    visits: numberValue(visitsByPeriod[index]),
    goals: numberValue(goalsByPeriod[index]),
  }));
}

function apiGet(path, params, token) {
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  const response = UrlFetchApp.fetch(`${API_BASE}${path}?${query}`, {
    method: 'get',
    headers: {
      Authorization: `OAuth ${token}`,
      'Content-Type': 'application/x-yametrika+json',
    },
    muteHttpExceptions: true,
  });
  const status = response.getResponseCode();
  const body = response.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error(`Метрика API ${status}: ${body.slice(0, 300)}`);
  }

  return JSON.parse(body || '{}');
}

function getConfiguredProjects() {
  const raw = getSecret('METRIKA_PROJECTS', false);
  if (!raw) return DEFAULT_PROJECTS;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PROJECTS;
    return parsed
      .map((project) => ({
        projectName: sanitizeText(project.projectName),
        clientName: sanitizeText(project.clientName || project.projectName),
        counterId: Number(project.counterId),
        siteUrl: sanitizeText(project.siteUrl || ''),
      }))
      .filter((project) => project.projectName && Number.isFinite(project.counterId));
  } catch (error) {
    return DEFAULT_PROJECTS;
  }
}

function getSecret(name, required) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value && required !== false) throw new Error(`${name} не задан в Script Properties.`);
  return value || '';
}

function getRequestValue(event, name) {
  return event && event.parameter && event.parameter[name] ? String(event.parameter[name]) : '';
}

function getSafeCallback(event) {
  const callback = getRequestValue(event, 'callback');
  return callback && ALLOWED_CALLBACK.test(callback) ? callback : '';
}

function outputJson(payload, callback) {
  const json = JSON.stringify(payload);
  const body = callback ? `${callback}(${json});` : json;
  return ContentService.createTextOutput(body).setMimeType(
    callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON,
  );
}

function todayIso() {
  return Utilities.formatDate(new Date(), 'Europe/Moscow', 'yyyy-MM-dd');
}

function defaultDate1() {
  const now = new Date();
  const month = Number(Utilities.formatDate(now, 'Europe/Moscow', 'M'));
  const year = Number(Utilities.formatDate(now, 'Europe/Moscow', 'yyyy'));
  return `${month >= 4 ? year : year - 1}-04-01`;
}

function formatPeriodLabel(date1, date2) {
  return `${formatRuDate(date1)} - ${formatRuDate(date2)}`;
}

function formatTimeIntervalLabel(interval, group) {
  const start = interval && interval[0] ? interval[0] : '';
  const end = interval && interval[1] ? interval[1] : start;
  if (group === 'month') return formatRuMonth(start);
  if (group === 'week') return `${formatRuDay(start)}-${formatRuDay(end)}`;
  return formatRuDay(start);
}

function formatRuMonth(value) {
  return Utilities.formatDate(new Date(`${value}T12:00:00`), 'Europe/Moscow', 'MMM').replace('.', '');
}

function formatRuDay(value) {
  return Utilities.formatDate(new Date(`${value}T12:00:00`), 'Europe/Moscow', 'dd.MM');
}

function formatRuDate(value) {
  return Utilities.formatDate(new Date(`${value}T12:00:00`), 'Europe/Moscow', 'dd.MM.yy');
}

function numberValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function sanitizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

function sanitizeError(error) {
  const message = error && error.message ? error.message : String(error || 'ошибка обновления Метрики');
  return sanitizeText(message).slice(0, 500);
}

function saveMetrikaSecret(name, value) {
  const allowed = ['YANDEX_OAUTH_TOKEN', 'METRIKA_DATE1', 'METRIKA_DATE2', 'METRIKA_PROJECTS'];
  if (allowed.indexOf(name) === -1) throw new Error('Нельзя сохранить это свойство.');
  PropertiesService.getScriptProperties().setProperty(name, String(value || ''));
  return `${name} сохранен`;
}
