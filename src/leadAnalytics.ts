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
  spreadsheetId: string;
  gid: string;
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

export const LEAD_ANALYTICS_SOURCES: LeadAnalyticsSource[] = [
  {
    id: 'aquaguard-leads-source-1',
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    title: 'Аквагард: заявки, выгрузка 1',
    channel: 'Заявки',
    periodLabel: 'Google Sheets',
    spreadsheetId: '1bZIzYEMFlAqQa42iFS9VMJPQrQ3BnkjbcP2sCY2kzzg',
    gid: '1914813722',
    url: 'https://docs.google.com/spreadsheets/d/1bZIzYEMFlAqQa42iFS9VMJPQrQ3BnkjbcP2sCY2kzzg/edit?gid=1914813722#gid=1914813722',
    note: 'Источник заявок Аквагарда из Google Sheets.',
  },
  {
    id: 'aquaguard-leads-source-2',
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    title: 'Аквагард: заявки, выгрузка 2',
    channel: 'Заявки',
    periodLabel: 'Google Sheets',
    spreadsheetId: '1wVx-svliWiFFIKnAl-MQx6pbCJUcmGET1qvvCR8jDIY',
    gid: '1032888152',
    url: 'https://docs.google.com/spreadsheets/d/1wVx-svliWiFFIKnAl-MQx6pbCJUcmGET1qvvCR8jDIY/edit?gid=1032888152#gid=1032888152',
    note: 'Источник заявок Аквагарда из Google Sheets.',
  },
  {
    id: 'aquaguard-leads-source-3',
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    title: 'Аквагард: заявки, выгрузка 3',
    channel: 'Заявки',
    periodLabel: 'Google Sheets',
    spreadsheetId: '1K0qVoWsLEOn-_yqRA4qKnGEX5891Kwv5DloZoTntcks',
    gid: '0',
    url: 'https://docs.google.com/spreadsheets/d/1K0qVoWsLEOn-_yqRA4qKnGEX5891Kwv5DloZoTntcks/edit?gid=0#gid=0',
    note: 'Источник заявок Аквагарда из Google Sheets.',
  },
  {
    id: 'aquaguard-leads-source-4',
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    title: 'Аквагард: заявки, выгрузка 4',
    channel: 'Заявки',
    periodLabel: 'Google Sheets',
    spreadsheetId: '1DcxdORWOCCIYPKpkTTPYpTkRB3O_oShk4QS5_hoodwg',
    gid: '1143285266',
    url: 'https://docs.google.com/spreadsheets/d/1DcxdORWOCCIYPKpkTTPYpTkRB3O_oShk4QS5_hoodwg/edit?gid=1143285266#gid=1143285266',
    note: 'Источник заявок Аквагарда из Google Sheets.',
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
    note: 'Сводка из локальных Excel-файлов без персональных данных: июль/август, почта и звонки.',
    sources: [
      {
        id: 'promteh-2026-08-mail',
        title: 'Промтех: почта',
        channel: 'Почта',
        periodLabel: 'август 2026',
        sourceType: 'local-snapshot',
        fileName: 'август почта.xlsx',
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
    LEAD_ANALYTICS_SOURCES.map(async (source) => summarizeLeadRows(parseLeadRows(await loadGvizJsonp(source), source), source)),
  );
  const summaries = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
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
  const [first] = items;
  const merged: LeadAnalyticsSummary = {
    projectName: first.projectName,
    clientName: first.clientName,
    periodLabel: mergePeriodLabels(items.map((item) => item.periodLabel)),
    total: sum(items, 'total'),
    quality: sum(items, 'quality'),
    inWork: sum(items, 'inWork'),
    rejected: sum(items, 'rejected'),
    unknown: sum(items, 'unknown'),
    budget: sum(items, 'budget'),
    sourceCount: items.reduce((count, item) => count + item.sourceCount, 0),
    sources: items.flatMap((item) => item.sources),
    byChannel: mergeBreakdowns(items.flatMap((item) => item.byChannel)),
    byStatus: mergeBreakdowns(items.flatMap((item) => item.byStatus)),
    byReason: mergeBreakdowns(items.flatMap((item) => item.byReason)),
    byVolume: mergeBreakdowns(items.flatMap((item) => item.byVolume)),
    byMaterial: mergeBreakdowns(items.flatMap((item) => item.byMaterial)),
    byClientType: mergeBreakdowns(items.flatMap((item) => item.byClientType)),
    daily: mergeTrendPoints(items.flatMap((item) => item.daily), 'daily'),
    weekly: mergeTrendPoints(items.flatMap((item) => item.weekly), 'weekly'),
    monthly: mergeTrendPoints(items.flatMap((item) => item.monthly), 'monthly'),
    note: items.map((item) => item.note).filter(Boolean).join(' '),
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
    script.src = `https://docs.google.com/spreadsheets/d/${source.spreadsheetId}/gviz/tq?gid=${encodeURIComponent(
      source.gid,
    )}&tq=${query}&tqx=out:json;responseHandler:${callbackName}&cacheBust=${Date.now()}`;
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

  const rawRows = table.rows.map((row) => (row.c ?? []).map(formatGvizCell)).filter((row) => row.some(Boolean));
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
      isoDate: parseLeadDate(createdAt),
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

  const isoMatch = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  return '';
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
