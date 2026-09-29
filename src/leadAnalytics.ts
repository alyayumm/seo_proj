export type LeadAssessment = 'quality' | 'inWork' | 'rejected' | 'unknown';

export type LeadTrendPoint = {
  period: string;
  label: string;
  leads: number;
  quality: number;
  inWork: number;
  rejected: number;
  unknown: number;
};

export type LeadBreakdownItem = {
  label: string;
  count: number;
};

export type LeadSourceSummary = {
  id: string;
  title: string;
  channel: string;
  periodLabel: string;
  sourceType: 'google-sheet' | 'local-snapshot';
  url?: string;
  fileName?: string;
  total: number;
  quality: number;
  inWork: number;
  rejected: number;
  unknown: number;
};

export type LeadAnalyticsSummary = {
  projectName: string;
  clientName: string;
  periodLabel: string;
  total: number;
  quality: number;
  inWork: number;
  rejected: number;
  unknown: number;
  budget: number;
  sourceCount: number;
  sources: LeadSourceSummary[];
  byChannel: LeadBreakdownItem[];
  byStatus: LeadBreakdownItem[];
  byReason: LeadBreakdownItem[];
  byVolume: LeadBreakdownItem[];
  byMaterial: LeadBreakdownItem[];
  byClientType: LeadBreakdownItem[];
  daily: LeadTrendPoint[];
  weekly: LeadTrendPoint[];
  monthly: LeadTrendPoint[];
  note: string;
};

export type LeadAnalyticsSource = {
  id: string;
  projectName: string;
  clientName: string;
  title: string;
  channel: string;
  periodLabel: string;
  sheetName?: string;
  format?: 'raw-leads' | 'period-summary' | 'smartstroy-matrix';
  range?: string;
  spreadsheetId: string;
  gid?: string;
  url: string;
  note: string;
};

export type LeadAnalyticsSourceError = {
  sourceId: string;
  projectName: string;
  title: string;
  message: string;
};

export type LeadAnalyticsFetchResult = {
  summaries: LeadAnalyticsSummary[];
  errors: LeadAnalyticsSourceError[];
};

type LeadRow = {
  sourceId: string;
  sourceTitle: string;
  sourceUrl?: string;
  projectName: string;
  clientName: string;
  channel: string;
  periodLabel: string;
  isoDate: string;
  status: string;
  reason: string;
  quality: string;
  budget: number;
  volume: string;
  material: string;
  clientType: string;
  assessment: LeadAssessment;
};

type GvizCell = { v?: string | number | boolean | null; f?: string | null } | null;

type GvizResponse = {
  status: 'ok' | 'error';
  errors?: Array<{ detailed_message?: string; message?: string; reason?: string }>;
  table?: {
    cols: Array<{ label?: string }>;
    rows: Array<{ c?: GvizCell[] }>;
  };
};

const LEAD_MASTER_SPREADSHEET_ID = '1tM8lK4524ujLJqEu0VTEikJdpPE5O65_u-VRGnLduzQ';
const LEAD_MASTER_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1tM8lK4524ujLJqEu0VTEikJdpPE5O65_u-VRGnLduzQ/edit';
const LEAD_MASTER_PUBLIC_URL =
  'https://docs.google.com/spreadsheets/d/1tM8lK4524ujLJqEu0VTEikJdpPE5O65_u-VRGnLduzQ/edit?usp=sharing';

export const LEAD_ANALYTICS_SOURCES: LeadAnalyticsSource[] = [
  {
    id: 'aquaguard-leads-master-2026',
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    title: 'Аквагард: аналитика лидов',
    channel: 'Заявки',
    periodLabel: 'апрель-июнь 2026',
    format: 'period-summary',
    range: 'A1:Z100',
    sheetName: 'аква',
    spreadsheetId: LEAD_MASTER_SPREADSHEET_ID,
    url: LEAD_MASTER_PUBLIC_URL,
    note: 'Сводная таблица лидов: звонки, почта, сайт, другое и недельная динамика.',
  },
  {
    id: 'promteh-leads-master-2026',
    projectName: 'Промтех',
    clientName: 'ПромТехМакулатура',
    title: 'Промтех: аналитика лидов',
    channel: 'Заявки',
    periodLabel: 'июль-август 2026',
    format: 'period-summary',
    range: 'A1:Z160',
    sheetName: 'промтех',
    spreadsheetId: LEAD_MASTER_SPREADSHEET_ID,
    url: LEAD_MASTER_PUBLIC_URL,
    note: 'Сводная таблица лидов из листа “промтех”.',
  },
  {
    id: 'smartstroy-leads-master-2026',
    projectName: 'Смартстрой',
    clientName: 'Смартстрой',
    title: 'Смартстрой: аналитика лидов',
    channel: 'Заявки',
    periodLabel: 'июнь-сентябрь 2026',
    format: 'smartstroy-matrix',
    range: 'A1:T20',
    sheetName: 'смарт',
    spreadsheetId: LEAD_MASTER_SPREADSHEET_ID,
    url: LEAD_MASTER_PUBLIC_URL,
    note: 'Сводная таблица лидов: лиды, квалы, продажи и выручка по месяцам.',
  },
  {
    id: 'balt-pallet-leads-master-2026',
    projectName: 'Балт-паллет',
    clientName: 'Балт Паллет',
    title: 'Балт Паллет: аналитика лидов',
    channel: 'Заявки',
    periodLabel: 'Google Sheets',
    format: 'period-summary',
    range: 'A1:Z120',
    sheetName: 'балт',
    spreadsheetId: LEAD_MASTER_SPREADSHEET_ID,
    url: LEAD_MASTER_PUBLIC_URL,
    note: 'Сводная таблица лидов. Сейчас используется ручной fallback, пока вкладка не заполнена.',
  },
  {
    id: 'watch-leads-master-2026',
    projectName: 'Часы',
    clientName: 'WatchStore',
    title: 'WatchStore: аналитика лидов',
    channel: 'Заявки',
    periodLabel: 'Google Sheets',
    format: 'period-summary',
    range: 'A1:Z120',
    sheetName: 'часы',
    spreadsheetId: LEAD_MASTER_SPREADSHEET_ID,
    url: LEAD_MASTER_PUBLIC_URL,
    note: 'Сводная таблица лидов. Данные появятся после заполнения вкладки.',
  },
  {
    id: 'lombard-leads-master-2026',
    projectName: 'Ломбард',
    clientName: 'ЛомбардБанка',
    title: 'Ломбард: аналитика лидов',
    channel: 'Заявки',
    periodLabel: 'Google Sheets',
    format: 'period-summary',
    range: 'A1:Z120',
    sheetName: 'ломбард',
    spreadsheetId: LEAD_MASTER_SPREADSHEET_ID,
    url: LEAD_MASTER_PUBLIC_URL,
    note: 'Сводная таблица лидов из листа “ломбард”.',
  },
  {
    id: 'switch-leads-master-2026',
    projectName: 'Свич',
    clientName: 'Свитч',
    title: 'Свич: аналитика лидов',
    channel: 'Заявки',
    periodLabel: 'Google Sheets',
    format: 'period-summary',
    range: 'A1:Z120',
    sheetName: 'свитч',
    spreadsheetId: LEAD_MASTER_SPREADSHEET_ID,
    url: LEAD_MASTER_PUBLIC_URL,
    note: 'Сводная таблица лидов из листа “свитч”.',
  },
  {
    id: 'rectop-leads-master-2026',
    projectName: 'Ректоп',
    clientName: 'Ректоп',
    title: 'Ректоп: аналитика лидов',
    channel: 'Заявки',
    periodLabel: 'Google Sheets',
    format: 'period-summary',
    range: 'A1:Z120',
    sheetName: 'ректоп',
    spreadsheetId: LEAD_MASTER_SPREADSHEET_ID,
    url: LEAD_MASTER_PUBLIC_URL,
    note: 'Сводная таблица лидов из листа “ректоп”.',
  },
];

export const STATIC_LEAD_ANALYTICS_SUMMARIES: LeadAnalyticsSummary[] = [
  {
    projectName: 'Промтех',
    clientName: 'ПромТехМакулатура',
    periodLabel: 'июль-август 2026',
    total: 60,
    quality: 5,
    inWork: 19,
    rejected: 36,
    unknown: 0,
    budget: 75119,
    sourceCount: 4,
    note: 'Сводка из локальных Excel-файлов без персональных данных: июль/август, почта и звонки. Общая таблица лидов подключена как проверочный источник.',
    sources: [
      {
        id: 'promteh-2026-08-mail',
        title: 'Промтех: почта',
        channel: 'Почта',
        periodLabel: 'август 2026',
        sourceType: 'local-snapshot',
        fileName: 'август почта.xlsx',
        url: `${LEAD_MASTER_SPREADSHEET_URL}?gid=681182108#gid=681182108`,
        total: 19,
        quality: 0,
        inWork: 8,
        rejected: 11,
        unknown: 0,
      },
      {
        id: 'promteh-2026-07-calls',
        title: 'Промтех: звонки',
        channel: 'Звонки',
        periodLabel: 'июль 2026',
        sourceType: 'local-snapshot',
        fileName: 'июль звонки.xlsx',
        url: `${LEAD_MASTER_SPREADSHEET_URL}?gid=681182108#gid=681182108`,
        total: 10,
        quality: 0,
        inWork: 2,
        rejected: 8,
        unknown: 0,
      },
      {
        id: 'promteh-2026-07-mail',
        title: 'Промтех: почта',
        channel: 'Почта',
        periodLabel: 'июль 2026',
        sourceType: 'local-snapshot',
        fileName: 'июль почта.xlsx',
        url: `${LEAD_MASTER_SPREADSHEET_URL}?gid=681182108#gid=681182108`,
        total: 15,
        quality: 2,
        inWork: 5,
        rejected: 8,
        unknown: 0,
      },
      {
        id: 'promteh-2026-08-calls',
        title: 'Промтех: звонки',
        channel: 'Звонки',
        periodLabel: 'август 2026',
        sourceType: 'local-snapshot',
        fileName: 'август звонки.xlsx',
        url: `${LEAD_MASTER_SPREADSHEET_URL}?gid=681182108#gid=681182108`,
        total: 16,
        quality: 3,
        inWork: 4,
        rejected: 9,
        unknown: 0,
      },
    ],
    byChannel: [
      { label: 'Почта', count: 34 },
      { label: 'Звонки', count: 26 },
    ],
    byStatus: [
      { label: 'Закрыто и не реализовано', count: 36 },
      { label: 'Взят в работу', count: 13 },
      { label: 'Квалифицирован', count: 5 },
      { label: 'Успешно реализовано', count: 4 },
      { label: 'Заказ согласован', count: 1 },
      { label: 'Фото получено', count: 1 },
    ],
    byReason: [
      { label: 'Дубль', count: 11 },
      { label: 'Маленький объем', count: 8 },
      { label: 'Спам', count: 7 },
      { label: 'Неликвидный товар', count: 5 },
      { label: 'Нет контакта', count: 4 },
      { label: 'Логистика', count: 2 },
      { label: 'Цена', count: 1 },
    ],
    byVolume: [
      { label: '0-500 кг', count: 22 },
      { label: '500-1000 кг', count: 8 },
      { label: 'Более 1000 кг', count: 7 },
    ],
    byMaterial: [
      { label: 'Макулатура', count: 5 },
      { label: 'Пленка', count: 3 },
      { label: 'Пластик', count: 2 },
      { label: 'Макулатура, пластик, пленка', count: 1 },
      { label: 'Макулатура, другое', count: 1 },
      { label: 'Другое', count: 1 },
    ],
    byClientType: [
      { label: 'Постоянный', count: 12 },
      { label: 'Разовый', count: 2 },
    ],
    monthly: [
      { period: '2026-07', label: 'июль', leads: 25, quality: 2, inWork: 7, rejected: 16, unknown: 0 },
      { period: '2026-08', label: 'август', leads: 35, quality: 3, inWork: 12, rejected: 20, unknown: 0 },
    ],
    weekly: [
      { period: '2026-07-06', label: '06.07', leads: 5, quality: 0, inWork: 0, rejected: 5, unknown: 0 },
      { period: '2026-07-13', label: '13.07', leads: 9, quality: 1, inWork: 3, rejected: 5, unknown: 0 },
      { period: '2026-07-20', label: '20.07', leads: 7, quality: 0, inWork: 2, rejected: 5, unknown: 0 },
      { period: '2026-07-27', label: '27.07', leads: 4, quality: 1, inWork: 2, rejected: 1, unknown: 0 },
      { period: '2026-08-03', label: '03.08', leads: 14, quality: 3, inWork: 4, rejected: 7, unknown: 0 },
      { period: '2026-08-10', label: '10.08', leads: 6, quality: 0, inWork: 3, rejected: 3, unknown: 0 },
      { period: '2026-08-17', label: '17.08', leads: 7, quality: 0, inWork: 2, rejected: 5, unknown: 0 },
      { period: '2026-08-24', label: '24.08', leads: 8, quality: 0, inWork: 3, rejected: 5, unknown: 0 },
    ],
    daily: [
      { period: '2026-07-08', label: '08.07', leads: 2, quality: 0, inWork: 0, rejected: 2, unknown: 0 },
      { period: '2026-07-09', label: '09.07', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
      { period: '2026-07-10', label: '10.07', leads: 2, quality: 0, inWork: 0, rejected: 2, unknown: 0 },
      { period: '2026-07-13', label: '13.07', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
      { period: '2026-07-14', label: '14.07', leads: 3, quality: 0, inWork: 1, rejected: 2, unknown: 0 },
      { period: '2026-07-15', label: '15.07', leads: 2, quality: 0, inWork: 1, rejected: 1, unknown: 0 },
      { period: '2026-07-17', label: '17.07', leads: 3, quality: 1, inWork: 1, rejected: 1, unknown: 0 },
      { period: '2026-07-20', label: '20.07', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
      { period: '2026-07-21', label: '21.07', leads: 2, quality: 0, inWork: 0, rejected: 2, unknown: 0 },
      { period: '2026-07-22', label: '22.07', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-07-23', label: '23.07', leads: 2, quality: 0, inWork: 1, rejected: 1, unknown: 0 },
      { period: '2026-07-26', label: '26.07', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
      { period: '2026-07-27', label: '27.07', leads: 1, quality: 1, inWork: 0, rejected: 0, unknown: 0 },
      { period: '2026-07-28', label: '28.07', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-07-30', label: '30.07', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
      { period: '2026-07-31', label: '31.07', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-08-03', label: '03.08', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-08-04', label: '04.08', leads: 4, quality: 1, inWork: 0, rejected: 3, unknown: 0 },
      { period: '2026-08-05', label: '05.08', leads: 4, quality: 0, inWork: 1, rejected: 3, unknown: 0 },
      { period: '2026-08-06', label: '06.08', leads: 3, quality: 1, inWork: 2, rejected: 0, unknown: 0 },
      { period: '2026-08-08', label: '08.08', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
      { period: '2026-08-09', label: '09.08', leads: 1, quality: 1, inWork: 0, rejected: 0, unknown: 0 },
      { period: '2026-08-10', label: '10.08', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-08-11', label: '11.08', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-08-12', label: '12.08', leads: 2, quality: 0, inWork: 1, rejected: 1, unknown: 0 },
      { period: '2026-08-14', label: '14.08', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
      { period: '2026-08-15', label: '15.08', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
      { period: '2026-08-17', label: '17.08', leads: 3, quality: 0, inWork: 0, rejected: 3, unknown: 0 },
      { period: '2026-08-19', label: '19.08', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-08-20', label: '20.08', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-08-21', label: '21.08', leads: 2, quality: 0, inWork: 0, rejected: 2, unknown: 0 },
      { period: '2026-08-24', label: '24.08', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
      { period: '2026-08-25', label: '25.08', leads: 3, quality: 0, inWork: 2, rejected: 1, unknown: 0 },
      { period: '2026-08-26', label: '26.08', leads: 3, quality: 0, inWork: 1, rejected: 2, unknown: 0 },
      { period: '2026-08-28', label: '28.08', leads: 1, quality: 0, inWork: 0, rejected: 1, unknown: 0 },
    ],
  },
  {
    projectName: 'Балт-паллет',
    clientName: 'Балт Паллет',
    periodLabel: '21.08-10.09.2026',
    total: 4,
    quality: 0,
    inWork: 4,
    rejected: 0,
    unknown: 0,
    budget: 0,
    sourceCount: 1,
    note: 'Ручная отметка: по 1 заявке 21.08, 07.09, 09.09 и 10.09. Оценка качества пока не внесена.',
    sources: [
      {
        id: 'balt-pallet-leads-manual-2026-09-10',
        title: 'Балт-паллет: ручные заявки',
        channel: 'Заявки',
        periodLabel: '21.08-10.09.2026',
        sourceType: 'local-snapshot',
        total: 4,
        quality: 0,
        inWork: 4,
        rejected: 0,
        unknown: 0,
      },
    ],
    byChannel: [{ label: 'Заявки', count: 4 }],
    byStatus: [{ label: 'В работе / без оценки качества', count: 4 }],
    byReason: [],
    byVolume: [],
    byMaterial: [],
    byClientType: [],
    monthly: [
      { period: '2026-08', label: 'август', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-09', label: 'сентябрь', leads: 3, quality: 0, inWork: 3, rejected: 0, unknown: 0 },
    ],
    weekly: [
      { period: '2026-08-17', label: '17.08', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-09-07', label: '07.09', leads: 3, quality: 0, inWork: 3, rejected: 0, unknown: 0 },
    ],
    daily: [
      { period: '2026-08-21', label: '21.08', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-09-07', label: '07.09', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-09-09', label: '09.09', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
      { period: '2026-09-10', label: '10.09', leads: 1, quality: 0, inWork: 1, rejected: 0, unknown: 0 },
    ],
  },
];

export async function fetchLeadAnalyticsSummaries(): Promise<LeadAnalyticsFetchResult> {
  const results = await Promise.allSettled(
    LEAD_ANALYTICS_SOURCES.map(async (source) => summarizeLeadSource(await loadGvizJsonp(source), source)),
  );
  const summaries = results.flatMap((result) =>
    result.status === 'fulfilled' && hasLeadSummaryData(result.value) ? [result.value] : [],
  );
  const errors = results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return [];
    const source = LEAD_ANALYTICS_SOURCES[index];
    return [
      {
        sourceId: source.id,
        projectName: source.projectName,
        title: source.title,
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      },
    ];
  });

  if (!summaries.length && errors.length) {
    const message = errors.map((error) => `${error.title}: ${error.message}`).join('; ');
    throw new Error(message || 'Не удалось загрузить заявки');
  }

  if (errors.length) {
    console.warn(
      'Часть источников заявок не загрузилась',
      errors.map((error) => `${error.title}: ${error.message}`),
    );
  }

  return { summaries, errors };
}

function summarizeLeadSource(response: GvizResponse, source: LeadAnalyticsSource) {
  if (source.format === 'period-summary') return summarizePeriodSummary(response, source);
  if (source.format === 'smartstroy-matrix') return summarizeSmartstroyMatrix(response, source);
  return summarizeLeadRows(parseLeadRows(response, source), source);
}

function hasLeadSummaryData(summary: LeadAnalyticsSummary) {
  return summary.total > 0 || summary.daily.length > 0 || summary.weekly.length > 0 || summary.monthly.length > 0;
}

export function combineLeadAnalyticsSummaries(summaries: LeadAnalyticsSummary[]): LeadAnalyticsSummary[] {
  const grouped = new Map<string, LeadAnalyticsSummary[]>();
  summaries.forEach((summary) => {
    const key = normalizeProjectName(summary.projectName);
    const current = grouped.get(key) ?? [];
    current.push(summary);
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((items) => mergeProjectSummaries(items));
}

function mergeProjectSummaries(items: LeadAnalyticsSummary[]): LeadAnalyticsSummary {
  const googleSheetItems = items.filter((item) => item.sources.some((source) => source.sourceType === 'google-sheet'));
  const sourceItems = googleSheetItems.length ? googleSheetItems : items;
  const [first] = sourceItems;
  const merged: LeadAnalyticsSummary = {
    projectName: first.projectName,
    clientName: first.clientName,
    periodLabel: mergePeriodLabels(sourceItems.map((item) => item.periodLabel)),
    total: sum(sourceItems, 'total'),
    quality: sum(sourceItems, 'quality'),
    inWork: sum(sourceItems, 'inWork'),
    rejected: sum(sourceItems, 'rejected'),
    unknown: sum(sourceItems, 'unknown'),
    budget: sum(sourceItems, 'budget'),
    sourceCount: sourceItems.reduce((count, item) => count + item.sourceCount, 0),
    sources: sourceItems.flatMap((item) => item.sources),
    byChannel: mergeBreakdowns(sourceItems.flatMap((item) => item.byChannel)),
    byStatus: mergeBreakdowns(sourceItems.flatMap((item) => item.byStatus)),
    byReason: mergeBreakdowns(sourceItems.flatMap((item) => item.byReason)),
    byVolume: mergeBreakdowns(sourceItems.flatMap((item) => item.byVolume)),
    byMaterial: mergeBreakdowns(sourceItems.flatMap((item) => item.byMaterial)),
    byClientType: mergeBreakdowns(sourceItems.flatMap((item) => item.byClientType)),
    daily: mergeTrendPoints(sourceItems.flatMap((item) => item.daily), 'daily'),
    weekly: mergeTrendPoints(sourceItems.flatMap((item) => item.weekly), 'weekly'),
    monthly: mergeTrendPoints(sourceItems.flatMap((item) => item.monthly), 'monthly'),
    note: sourceItems.map((item) => item.note).filter(Boolean).join(' '),
  };

  return merged;
}

function summarizeLeadRows(rows: LeadRow[], source: LeadAnalyticsSource): LeadAnalyticsSummary {
  return {
    projectName: source.projectName,
    clientName: source.clientName,
    periodLabel: source.periodLabel,
    total: rows.length,
    quality: rows.filter((row) => row.assessment === 'quality').length,
    inWork: rows.filter((row) => row.assessment === 'inWork').length,
    rejected: rows.filter((row) => row.assessment === 'rejected').length,
    unknown: rows.filter((row) => row.assessment === 'unknown').length,
    budget: rows.reduce((total, row) => total + row.budget, 0),
    sourceCount: 1,
    sources: [
      {
        id: source.id,
        title: source.title,
        channel: source.channel,
        periodLabel: source.periodLabel,
        sourceType: 'google-sheet',
        url: source.url,
        total: rows.length,
        quality: rows.filter((row) => row.assessment === 'quality').length,
        inWork: rows.filter((row) => row.assessment === 'inWork').length,
        rejected: rows.filter((row) => row.assessment === 'rejected').length,
        unknown: rows.filter((row) => row.assessment === 'unknown').length,
      },
    ],
    byChannel: countBreakdown(rows.map((row) => row.channel)),
    byStatus: countBreakdown(rows.map((row) => row.status)),
    byReason: countBreakdown(rows.map((row) => row.reason)),
    byVolume: countBreakdown(rows.map((row) => row.volume)),
    byMaterial: countBreakdown(rows.map((row) => row.material)),
    byClientType: countBreakdown(rows.map((row) => row.clientType)),
    daily: buildTrend(rows, 'daily'),
    weekly: buildTrend(rows, 'weekly'),
    monthly: buildTrend(rows, 'monthly'),
    note: source.note,
  };
}

function summarizePeriodSummary(response: GvizResponse, source: LeadAnalyticsSource): LeadAnalyticsSummary {
  const rawRows = getGvizRows(response);
  const columnLabels = response.table?.cols.map((column) => column.label ?? '') ?? [];
  const normalizedColumnLabels = columnLabels.map(normalizeHeader);
  const columnLabelsLookLikeHeader =
    normalizedColumnLabels.some((cell) => cell.includes('месяц') || cell.includes('неделя')) &&
    normalizedColumnLabels.some((cell, index) => index > 0 && cell.includes('всего') && cell.includes('лид'));
  const headerIndex = columnLabelsLookLikeHeader
    ? -1
    : rawRows.findIndex((row) => {
        const normalized = row.map(normalizeHeader);
        return normalized.some((cell) => cell.includes('месяц') || cell.includes('неделя')) &&
          normalized.some((cell, index) => index > 0 && cell.includes('всего') && cell.includes('лид'));
      });

  if (!columnLabelsLookLikeHeader && headerIndex < 0) {
    return emptyLeadSummary(source, 'Вкладка подключена, но строки лидов пока не заполнены.');
  }

  const header = columnLabelsLookLikeHeader ? normalizedColumnLabels : rawRows[headerIndex].map(normalizeHeader);
  const dataRows = columnLabelsLookLikeHeader ? rawRows : rawRows.slice(headerIndex + 1);
  const findHeader = (...needles: string[]) => header.findIndex((cell) => needles.some((needle) => cell.includes(needle)));
  const labelIndex = header.findIndex((cell) => cell.includes('месяц') || cell.includes('неделя'));
  const startIndex = findHeader('начало');
  const endIndex = findHeader('конец');
  const totalIndex = header.findIndex(
    (cell, index) =>
      index !== labelIndex &&
      cell.includes('всего') &&
      (cell.includes('лид') || cell.includes('обращ')),
  );
  const channelIndexes = [
    { index: findHeader('звон'), label: 'Звонки' },
    { index: findHeader('почт'), label: 'Почта' },
    { index: findHeader('сайт'), label: 'Сайт' },
    { index: findHeader('другое'), label: 'Другое' },
  ].filter((item) => item.index >= 0);

  const records = dataRows
    .map((row) => {
      const label = getCell(row, labelIndex);
      const start = parseLeadDate(getCell(row, startIndex));
      const end = parseLeadDate(getCell(row, endIndex));
      const total = parseCount(getCell(row, totalIndex));
      const normalizedLabel = normalize(label);
      const type = normalizedLabel.includes('всего')
        ? 'total'
        : isMonthlySummaryRow(label, start, end)
          ? 'monthly'
          : start
            ? 'period'
            : 'undated';

      return {
        label,
        start,
        end,
        total,
        type,
        channels: channelIndexes
          .map((channel) => ({ label: channel.label, count: parseCount(getCell(row, channel.index)) }))
          .filter((channel) => channel.count > 0),
      };
    })
    .filter((record) => record.label && (record.total > 0 || record.type === 'total'));

  const totalRecord = records.find((record) => record.type === 'total');
  const monthlyRecords = records.filter((record) => record.type === 'monthly');
  const periodRecords = records.filter((record) => record.type === 'period');
  const total = totalRecord?.total ?? sumLeadRecords(monthlyRecords.length ? monthlyRecords : periodRecords);
  const byChannel = mergeBreakdowns((totalRecord ? [totalRecord] : monthlyRecords).flatMap((record) => record.channels));
  const daily = periodRecords
    .filter((record) => record.start && record.total > 0)
    .map((record) => makeLeadTrendPoint(record.start, record.total, 0, record.total));
  const weekly = daily.map((point) => ({
    ...point,
    period: getTrendPeriod(point.period, 'weekly') || point.period,
    label: getTrendLabel(getTrendPeriod(point.period, 'weekly') || point.period, 'weekly'),
  }));
  const monthly = monthlyRecords
    .filter((record) => record.start && record.total > 0)
    .map((record) => makeLeadTrendPoint(record.start.slice(0, 7), record.total, 0, record.total, 'monthly'));

  return {
    projectName: source.projectName,
    clientName: source.clientName,
    periodLabel: source.periodLabel,
    total,
    quality: 0,
    inWork: 0,
    rejected: 0,
    unknown: total,
    budget: 0,
    sourceCount: 1,
    sources: [
      {
        id: source.id,
        title: source.title,
        channel: source.channel,
        periodLabel: source.periodLabel,
        sourceType: 'google-sheet',
        url: source.url,
        total,
        quality: 0,
        inWork: 0,
        rejected: 0,
        unknown: total,
      },
    ],
    byChannel,
    byStatus: total > 0 ? [{ label: 'Без оценки качества', count: total }] : [],
    byReason: [],
    byVolume: [],
    byMaterial: [],
    byClientType: [],
    daily,
    weekly: mergeTrendPoints(weekly, 'weekly'),
    monthly,
    note: `${source.note} Качество лидов в этой вкладке не размечено, поэтому заявки показаны как “без оценки”.`,
  };
}

function summarizeSmartstroyMatrix(response: GvizResponse, source: LeadAnalyticsSource): LeadAnalyticsSummary {
  const rawRows = getGvizRows(response);
  const monthRow = rawRows.find((row) => row.some((cell) => normalize(cell) === 'месяц')) ?? [];
  const periodRowIndex = rawRows.findIndex((row) => row.some((cell) => normalize(cell) === 'неделя'));
  const periodRow = periodRowIndex >= 0 ? rawRows[periodRowIndex] : [];
  const leadsRow = findMatrixMetricRow(rawRows, 'лид');
  const qualityRow = findMatrixMetricRow(rawRows, 'квал');
  const salesRow = findMatrixMetricRow(rawRows, 'продажа');
  const revenueRow = findMatrixMetricRow(rawRows, 'выручка');

  if (!monthRow.length || !leadsRow.length) return emptyLeadSummary(source, 'Вкладка подключена, но матрица лидов пока не заполнена.');

  const monthGroups = monthRow
    .map((value, index) => ({ value: cleanCell(value), index }))
    .filter((item) => parseMatrixMonth(item.value))
    .map((item, itemIndex, items) => ({
      ...item,
      month: parseMatrixMonth(item.value)!,
      endIndex: items[itemIndex + 1]?.index ?? monthRow.length,
    }));

  const daily: LeadTrendPoint[] = [];
  const monthly: LeadTrendPoint[] = [];
  let total = 0;
  let quality = 0;
  let sales = 0;
  let revenue = 0;

  monthGroups.forEach((group) => {
    let monthLeads = 0;
    let monthQuality = 0;
    let monthSales = 0;
    let monthRevenue = 0;
    let hasTotalColumn = false;

    for (let column = group.index; column < group.endIndex; column += 1) {
      const periodLabel = normalize(getCell(periodRow, column));
      const leads = parseCount(getCell(leadsRow, column));
      const qualified = parseCount(getCell(qualityRow, column));
      const sold = parseCount(getCell(salesRow, column));
      const income = parseMoney(getCell(revenueRow, column));
      if (periodLabel.includes('итого')) {
        hasTotalColumn = true;
        monthLeads = leads;
        monthQuality = qualified;
        monthSales = sold;
        monthRevenue = income;
        continue;
      }

      if (leads > 0 || qualified > 0) {
        const day = periodLabel.includes('16') ? 16 : 1;
        const date = `${group.month.year}-${String(group.month.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        daily.push(makeLeadTrendPoint(date, leads, qualified, Math.max(leads - qualified, 0)));
      }

      if (!hasTotalColumn) {
        monthLeads += leads;
        monthQuality += qualified;
        monthSales += sold;
        monthRevenue += income;
      }
    }

    if (monthLeads > 0 || monthQuality > 0) {
      const period = `${group.month.year}-${String(group.month.month).padStart(2, '0')}`;
      monthly.push(makeLeadTrendPoint(period, monthLeads, monthQuality, Math.max(monthLeads - monthQuality, 0), 'monthly'));
    }

    total += monthLeads;
    quality += monthQuality;
    sales += monthSales;
    revenue += monthRevenue;
  });

  const unknown = Math.max(total - quality, 0);

  return {
    projectName: source.projectName,
    clientName: source.clientName,
    periodLabel: source.periodLabel,
    total,
    quality,
    inWork: 0,
    rejected: 0,
    unknown,
    budget: revenue,
    sourceCount: 1,
    sources: [
      {
        id: source.id,
        title: source.title,
        channel: source.channel,
        periodLabel: source.periodLabel,
        sourceType: 'google-sheet',
        url: source.url,
        total,
        quality,
        inWork: 0,
        rejected: 0,
        unknown,
      },
    ],
    byChannel: total > 0 ? [{ label: 'Заявки', count: total }] : [],
    byStatus: [
      quality > 0 ? { label: 'Квал', count: quality } : null,
      unknown > 0 ? { label: 'Без квалификации', count: unknown } : null,
      sales > 0 ? { label: 'Продажи', count: sales } : null,
    ].filter((item): item is LeadBreakdownItem => Boolean(item)),
    byReason: [],
    byVolume: [],
    byMaterial: [],
    byClientType: [],
    daily,
    weekly: mergeTrendPoints(
      daily.map((point) => ({
        ...point,
        period: getTrendPeriod(point.period, 'weekly') || point.period,
        label: getTrendLabel(getTrendPeriod(point.period, 'weekly') || point.period, 'weekly'),
      })),
      'weekly',
    ),
    monthly,
    note: source.note,
  };
}

function emptyLeadSummary(source: LeadAnalyticsSource, note: string): LeadAnalyticsSummary {
  return {
    projectName: source.projectName,
    clientName: source.clientName,
    periodLabel: source.periodLabel,
    total: 0,
    quality: 0,
    inWork: 0,
    rejected: 0,
    unknown: 0,
    budget: 0,
    sourceCount: 1,
    sources: [
      {
        id: source.id,
        title: source.title,
        channel: source.channel,
        periodLabel: source.periodLabel,
        sourceType: 'google-sheet',
        url: source.url,
        total: 0,
        quality: 0,
        inWork: 0,
        rejected: 0,
        unknown: 0,
      },
    ],
    byChannel: [],
    byStatus: [],
    byReason: [],
    byVolume: [],
    byMaterial: [],
    byClientType: [],
    daily: [],
    weekly: [],
    monthly: [],
    note,
  };
}

function getGvizRows(response: GvizResponse) {
  return (
    response.table?.rows
      .map((row) => (row.c ?? []).map(formatGvizCell))
      .filter((row) => row.some(Boolean)) ?? []
  );
}

function isMonthlySummaryRow(label: string, start: string, end: string) {
  const normalized = normalize(label);
  if (ruMonthNames.some((month) => normalized.includes(month))) return true;
  if (!start || !end) return false;
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return false;
  return startDate.getDate() === 1 && startDate.getMonth() === endDate.getMonth() && endDate.getDate() >= 28;
}

function sumLeadRecords(records: Array<{ total: number }>) {
  return records.reduce((total, record) => total + record.total, 0);
}

function makeLeadTrendPoint(period: string, leads: number, quality = 0, unknown = 0, mode: 'daily' | 'monthly' = 'daily') {
  return {
    period,
    label: getTrendLabel(period, mode),
    leads,
    quality,
    inWork: 0,
    rejected: 0,
    unknown,
  } satisfies LeadTrendPoint;
}

function findMatrixMetricRow(rows: string[][], metric: string) {
  return rows.find((row) => row.some((cell) => normalize(cell) === metric)) ?? [];
}

function parseMatrixMonth(value: string) {
  const normalized = normalize(value);
  const month = ruMonthNames.findIndex((item) => normalized.includes(item.slice(0, 3)));
  if (month < 0) return null;
  const yearMatch = normalized.match(/(\d{2,4})/);
  const yearPart = yearMatch ? Number(yearMatch[1]) : getCurrentYear();
  const year = yearPart < 100 ? 2000 + yearPart : yearPart;
  return { month: month + 1, year };
}

function loadGvizJsonp(source: LeadAnalyticsSource) {
  return new Promise<GvizResponse>((resolve, reject) => {
    const callbackName = `__taskSeoLeads_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const callbackHost = window as unknown as Window &
      Record<string, ((response: GvizResponse) => void) | undefined>;
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Google Sheets не ответил за 20 секунд'));
    }, 20_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      delete callbackHost[callbackName];
      script.remove();
    };

    callbackHost[callbackName] = (response) => {
      cleanup();
      if (response.status !== 'ok') {
        const message =
          response.errors?.[0]?.detailed_message ??
          response.errors?.[0]?.message ??
          response.errors?.[0]?.reason ??
          'Google Sheets вернул ошибку';
        reject(new Error(message));
        return;
      }
      resolve(response);
    };

    const query = encodeURIComponent('select *');
    const sheetOrGid = source.sheetName
      ? `sheet=${encodeURIComponent(source.sheetName)}`
      : `gid=${encodeURIComponent(source.gid ?? '')}`;
    const range = source.range ? `&range=${encodeURIComponent(source.range)}` : '';
    script.src = `https://docs.google.com/spreadsheets/d/${source.spreadsheetId}/gviz/tq?${sheetOrGid}${range}&tq=${query}&tqx=out:json;responseHandler:${callbackName}&cacheBust=${Date.now()}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('Не удалось загрузить Google Sheets'));
    };

    document.head.append(script);
  });
}

function parseLeadRows(response: GvizResponse, source: LeadAnalyticsSource): LeadRow[] {
  const table = response.table;
  if (!table) return [];

  const rawRows = getGvizRows(response);
  const columnLabels = table.cols.map((column) => column.label ?? '');
  const hasColumnLabels = columnLabels.some((label) => label.trim());
  const fallbackHeaderIndex = rawRows.findIndex((row, index) => index < 10 && row.some((cell) => looksLikeLeadHeader(cell)));
  const headerRow = hasColumnLabels ? columnLabels : fallbackHeaderIndex >= 0 ? rawRows[fallbackHeaderIndex] : columnLabels;
  const dataRows = hasColumnLabels ? rawRows : fallbackHeaderIndex >= 0 ? rawRows.slice(fallbackHeaderIndex + 1) : rawRows;
  const headers = headerRow.map(normalizeHeader);
  const findHeader = (...needles: string[]) => headers.findIndex((header) => needles.some((needle) => header.includes(needle)));
  const indexByHeader = {
    id: findHeader('id'),
    date: findHeader('дата создания', 'создан', 'дата'),
    status: findHeader('этап сделки', 'статус', 'стадия'),
    reason: findHeader('причина отказа', 'отказ'),
    qualitySupplier: findHeader('качество поставщика'),
    qualityRaw: findHeader('качество сырья'),
    qualityAny: findHeader('качество', 'оценка', 'квал'),
    budget: findHeader('бюджет', 'сумма', 'доход'),
    volume: findHeader('объем', 'объём'),
    material: findHeader('вид сырья', 'сырье', 'сырьё'),
    clientType: findHeader('тип клиента'),
  };

  return dataRows.flatMap((row, rowIndex) => {
    const status = getCell(row, indexByHeader.status);
    const reason = getCell(row, indexByHeader.reason);
    const createdAt = getCell(row, indexByHeader.date);
    const id = getCell(row, indexByHeader.id);
    const hasUsefulData = Boolean(status || reason || createdAt || id || row.some((cell) => cleanCell(cell)));
    if (!hasUsefulData) return [];

    const qualityParts = [
      getCell(row, indexByHeader.qualitySupplier),
      getCell(row, indexByHeader.qualityRaw),
      getCell(row, indexByHeader.qualityAny),
    ].filter(Boolean);
    const quality = Array.from(new Set(qualityParts)).join(', ');
    const lead: LeadRow = {
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      projectName: source.projectName,
      clientName: source.clientName,
      channel: getCell(row, findHeader('источник по телефонии', 'канал')) || source.channel,
      periodLabel: source.periodLabel,
      isoDate: parseLeadDate(createdAt) || parseLeadDate(source.sheetName ?? source.periodLabel),
      status,
      reason,
      quality,
      budget: parseMoney(getCell(row, indexByHeader.budget)),
      volume: getCell(row, indexByHeader.volume),
      material: getCell(row, indexByHeader.material),
      clientType: getCell(row, indexByHeader.clientType),
      assessment: 'unknown',
    };

    lead.assessment = assessLead(lead);

    return [
      {
        ...lead,
        sourceId: `${source.id}-${rowIndex + 1}`,
      },
    ];
  });
}

function assessLead(row: Pick<LeadRow, 'status' | 'reason' | 'quality'>): LeadAssessment {
  const text = normalize(`${row.status} ${row.reason} ${row.quality}`);
  if (
    includesAny(text, [
      'успешно реализовано',
      'заказ согласован',
      'положительное',
      'продажа',
      'оплачен',
      'оплачено',
    ])
  ) {
    return 'quality';
  }
  if (includesAny(text, ['квалифицирован', 'взят в работу', 'фото получено', 'в работе', 'переговор'])) {
    return 'inWork';
  }
  if (
    includesAny(text, [
      'закрыто и не реализовано',
      'спам',
      'дубль',
      'маленьк',
      'неликвид',
      'нет контакта',
      'логистик',
      'цена',
      'отказ',
    ])
  ) {
    return 'rejected';
  }

  return 'unknown';
}

function buildTrend(rows: LeadRow[], mode: 'daily' | 'weekly' | 'monthly') {
  const map = new Map<string, LeadTrendPoint>();
  rows.forEach((row) => {
    const period = getTrendPeriod(row.isoDate, mode);
    if (!period) return;
    const current =
      map.get(period) ??
      ({
        period,
        label: getTrendLabel(period, mode),
        leads: 0,
        quality: 0,
        inWork: 0,
        rejected: 0,
        unknown: 0,
      } satisfies LeadTrendPoint);
    current.leads += 1;
    current[row.assessment] += 1;
    map.set(period, current);
  });

  return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
}

function mergeTrendPoints(points: LeadTrendPoint[], mode: 'daily' | 'weekly' | 'monthly') {
  const map = new Map<string, LeadTrendPoint>();
  points.forEach((point) => {
    const current =
      map.get(point.period) ??
      ({
        period: point.period,
        label: point.label || getTrendLabel(point.period, mode),
        leads: 0,
        quality: 0,
        inWork: 0,
        rejected: 0,
        unknown: 0,
      } satisfies LeadTrendPoint);
    current.leads += point.leads;
    current.quality += point.quality;
    current.inWork += point.inWork;
    current.rejected += point.rejected;
    current.unknown += point.unknown;
    map.set(point.period, current);
  });

  return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
}

function getTrendPeriod(isoDate: string, mode: 'daily' | 'weekly' | 'monthly') {
  if (!isoDate) return '';
  if (mode === 'daily') return isoDate;
  if (mode === 'monthly') return isoDate.slice(0, 7);
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  return toLocalIso(date);
}

function getTrendLabel(period: string, mode: 'daily' | 'weekly' | 'monthly') {
  if (mode === 'monthly') {
    const month = Number(period.slice(5, 7));
    return month ? ruMonthNames[month - 1] ?? period : period;
  }

  const [, month, day] = period.split('-');
  return day && month ? `${day}.${month}` : period;
}

function parseLeadDate(value: string) {
  const clean = cleanCell(value);
  if (!clean) return '';

  const gvizMatch = clean.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})/);
  if (gvizMatch) {
    const year = Number(gvizMatch[1]);
    const month = Number(gvizMatch[2]) + 1;
    const day = Number(gvizMatch[3]);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const ruMatch = clean.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (ruMatch) {
    const day = Number(ruMatch[1]);
    const month = Number(ruMatch[2]);
    const yearPart = Number(ruMatch[3]);
    const year = yearPart < 100 ? 2000 + yearPart : yearPart;
    if (day && month && year) return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const shortRuMatch = clean.match(/(^|\D)(\d{1,2})[.\-/](\d{1,2})(?=\D|$)/);
  if (shortRuMatch) {
    const day = Number(shortRuMatch[2]);
    const month = Number(shortRuMatch[3]);
    const year = getCurrentYear();
    if (day && month && year) return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const isoMatch = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  return '';
}

function getCurrentYear() {
  const year = new Date().getFullYear();
  return Number.isFinite(year) ? year : 2026;
}

function formatGvizCell(cell: GvizCell) {
  if (!cell) return '';
  if (cell.f !== undefined && cell.f !== null) return String(cell.f);
  if (cell.v !== undefined && cell.v !== null) return String(cell.v);
  return '';
}

function looksLikeLeadHeader(value: string) {
  const normalized = normalize(value);
  return includesAny(normalized, ['дата создания', 'этап сделки', 'статус', 'причина отказа', 'качество']);
}

function countBreakdown(values: string[]) {
  const counter = new Map<string, number>();
  values
    .map(cleanCell)
    .filter(Boolean)
    .forEach((value) => counter.set(value, (counter.get(value) ?? 0) + 1));
  return Array.from(counter.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 12);
}

function mergeBreakdowns(items: LeadBreakdownItem[]) {
  const counter = new Map<string, number>();
  items.forEach((item) => counter.set(item.label, (counter.get(item.label) ?? 0) + item.count));
  return Array.from(counter.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 12);
}

function mergePeriodLabels(labels: string[]) {
  const unique = Array.from(new Set(labels.filter(Boolean)));
  if (unique.length <= 2) return unique.join(', ');
  return `${unique[0]} + ${unique.length - 1} источника`;
}

function getCell(row: string[], index: number) {
  return index >= 0 ? cleanCell(row[index]) : '';
}

function parseMoney(value: string) {
  const normalized = cleanCell(value).replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCount(value: string) {
  const parsed = parseMoney(value);
  return Number.isFinite(parsed) ? Math.max(Math.round(parsed), 0) : 0;
}

function sum(items: LeadAnalyticsSummary[], key: 'total' | 'quality' | 'inWork' | 'rejected' | 'unknown' | 'budget') {
  return items.reduce((total, item) => total + item[key], 0);
}

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function normalizeHeader(value: string) {
  return normalize(value).replace(/\s+/g, ' ');
}

function normalizeProjectName(value: string) {
  return normalize(value).replace(/[«»"']/g, '').replace(/\s+/g, ' ');
}

function normalize(value: string) {
  return cleanCell(value).toLowerCase().replace(/ё/g, 'е');
}

function cleanCell(value = '') {
  return value.replace(/\u00a0/g, ' ').trim();
}

function toLocalIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ruMonthNames = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];
