export type LinkPurchase = {
  id: string;
  sourceRow: number;
  deadline: string;
  monthNo: number;
  month: string;
  client: string;
  projectName: string;
  donor: string;
  url: string;
  anchor: string;
  targetPage: string;
  planCost: number;
  factCost: number;
  status: string;
  purchaseDate: string;
  comment: string;
  urgency: string;
  order: string;
};

export type LinkPurchaseSummary = {
  count: number;
  planCost: number;
  factCost: number;
  placed: number;
  needToBuy: number;
  inProgress: number;
};

export const LINK_SOURCE_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1o63TLAcnvG6KiYL2V4MOaNNibX52YrLJV0Iukj7AgeA/edit?gid=1201216872#gid=1201216872';

const LINK_SOURCE_SPREADSHEET_ID = '1o63TLAcnvG6KiYL2V4MOaNNibX52YrLJV0Iukj7AgeA';
const LINK_SOURCE_SHEET_NAME = 'План';

export const LINK_SOURCE_CSV_URL = `https://docs.google.com/spreadsheets/d/${LINK_SOURCE_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
  LINK_SOURCE_SHEET_NAME,
)}`;

const LINK_SOURCE_JSONP_BASE_URL = `https://docs.google.com/spreadsheets/d/${LINK_SOURCE_SPREADSHEET_ID}/gviz/tq?sheet=${encodeURIComponent(
  LINK_SOURCE_SHEET_NAME,
)}&tq=${encodeURIComponent('select *')}`;

export const REQUIRED_LINK_PROJECTS = [
  { id: 'project-rectop', name: 'Ректоп', color: '#6D72FF' },
  { id: 'project-aquaguard', name: 'Аквагард', color: '#4DB8FF' },
  { id: 'project-promteh', name: 'Промтех', color: '#8B5CF6' },
  { id: 'project-switch', name: 'Свич', color: '#14B8A6' },
  { id: 'project-proskills', name: 'Профскиллс', color: '#0EA5E9' },
  { id: 'project-balt-pallet', name: 'Балт-паллет', color: '#22C55E' },
  { id: 'project-smart-link', name: 'Смартстрой', color: '#14B8A6' },
  { id: 'project-watch-link', name: 'Часы', color: '#8B5CF6' },
  { id: 'project-lombard-link', name: 'Ломбард', color: '#4DB8FF' },
];

const CLIENT_TO_PROJECT: Record<string, string> = {
  агентство: 'Ректоп',
  очистные: 'Аквагард',
  макулатура: 'Промтех',
  'строительство домов': 'Смартстрой',
  'часы е-ком': 'Часы',
  'англ. онлайн': 'Свич',
  'автосити спб': 'АШ',
  'автоправо мск': 'АШ',
  'курсы онлайн': 'Профскиллс',
  ломбард: 'Ломбард',
  'балт-паллет': 'Балт-паллет',
};

export async function fetchLinkPurchases() {
  const response = await loadGvizJsonp();
  return parseLinkPurchases(response);
}

export function summarizeLinkPurchases(rows: LinkPurchase[]): LinkPurchaseSummary {
  return rows.reduce<LinkPurchaseSummary>(
    (summary, row) => {
      const status = normalize(row.status);
      const urgency = normalize(row.urgency);
      const placed = status.includes('размещ') || urgency.includes('куплено');
      const needToBuy = status.includes('нужно купить');
      const inProgress = status.includes('закупил') || status.includes('работ');

      return {
        count: summary.count + 1,
        planCost: summary.planCost + row.planCost,
        factCost: summary.factCost + row.factCost,
        placed: summary.placed + (placed ? 1 : 0),
        needToBuy: summary.needToBuy + (needToBuy ? 1 : 0),
        inProgress: summary.inProgress + (inProgress ? 1 : 0),
      };
    },
    { count: 0, planCost: 0, factCost: 0, placed: 0, needToBuy: 0, inProgress: 0 },
  );
}

type GvizCell = { v?: string | number | boolean | null; f?: string | null } | null;

type GvizResponse = {
  status: 'ok' | 'error';
  errors?: Array<{ detailed_message?: string; message?: string; reason?: string }>;
  table?: {
    cols: Array<{ label?: string }>;
    rows: Array<{ c?: GvizCell[] }>;
  };
};

function loadGvizJsonp() {
  return new Promise<GvizResponse>((resolve, reject) => {
    const callbackName = `__taskSeoLinks_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

    script.src = `${LINK_SOURCE_JSONP_BASE_URL}&tqx=out:json;responseHandler:${callbackName}&cacheBust=${Date.now()}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('Не удалось загрузить Google Sheets'));
    };

    document.head.append(script);
  });
}

function parseLinkPurchases(response: GvizResponse): LinkPurchase[] {
  const table = response.table;
  if (!table) return [];

  const rows = [
    table.cols.map((column) => column.label ?? ''),
    ...table.rows.map((row) => (row.c ?? []).map(formatGvizCell)),
  ].filter((row) => row.some((cell) => cell.trim()));

  const headers = rows[0]?.map((header) => normalizeHeader(header)) ?? [];
  const column = (name: string) => headers.indexOf(normalizeHeader(name));
  const read = (row: string[], name: string) => {
    const index = column(name);
    return index >= 0 ? cleanCell(row[index]) : '';
  };

  return rows.slice(1).flatMap((row, rowIndex) => {
    const client = read(row, 'Клиент');
    const donor = read(row, 'Донор / сайт');
    const url = read(row, 'URL купленной ссылки');

    if (!client || (!donor && !url)) return [];

    return [
      {
        id: `${normalize(client)}-${rowIndex + 2}-${normalize(donor || url)}`,
        sourceRow: rowIndex + 2,
        deadline: read(row, 'Дедлайн'),
        monthNo: Number.parseInt(read(row, 'Месяц №'), 10) || 0,
        month: read(row, 'Месяц'),
        client,
        projectName: CLIENT_TO_PROJECT[normalize(client)] ?? client,
        donor,
        url,
        anchor: read(row, 'Анкор'),
        targetPage: read(row, 'Целевая страница'),
        planCost: parseMoney(read(row, 'План стоимость')),
        factCost: parseMoney(read(row, 'Факт стоимость')),
        status: read(row, 'Статус') || 'Без статуса',
        purchaseDate: read(row, 'Дата закупки'),
        comment: read(row, 'Комментарий'),
        urgency: read(row, 'Срочность'),
        order: read(row, 'Порядок'),
      },
    ];
  });
}

function formatGvizCell(cell: GvizCell) {
  if (!cell) return '';
  if (cell.f !== undefined && cell.f !== null) return String(cell.f);
  if (cell.v !== undefined && cell.v !== null) return String(cell.v);
  return '';
}

function normalizeHeader(value: string) {
  return cleanCell(value).toLowerCase();
}

function normalize(value: string) {
  return cleanCell(value).toLowerCase();
}

function cleanCell(value = '') {
  return value.replace(/\u00a0/g, ' ').trim();
}

function parseMoney(value: string) {
  const normalized = cleanCell(value).replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
