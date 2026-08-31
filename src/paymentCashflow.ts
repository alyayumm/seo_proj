export type PaymentCashflowRow = {
  id: string;
  sourceRow: number;
  client: string;
  legalEntity: string;
  projectName: string;
  monthNo: number;
  monthName: string;
  periodLabel: string;
  incomeAmount: number;
  seoExpenseAmount: number;
  developerExpenseAmount: number;
  otherExpenseAmount: number;
  totalExpenseAmount: number;
  netAmount: number;
};

export type PaymentCashflowSummary = {
  count: number;
  incomeAmount: number;
  seoExpenseAmount: number;
  developerExpenseAmount: number;
  otherExpenseAmount: number;
  totalExpenseAmount: number;
  netAmount: number;
};

export const PAYMENT_CASHFLOW_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1JvX_gLowFRIFs4qLvdWvne2u0M704Snzj8oa4bRvs3U/edit?gid=1593874802#gid=1593874802';

const PAYMENT_CASHFLOW_SPREADSHEET_ID = '1JvX_gLowFRIFs4qLvdWvne2u0M704Snzj8oa4bRvs3U';
const PAYMENT_CASHFLOW_SHEET_GID = '1593874802';
const PAYMENT_CASHFLOW_SHEET_NAME = 'SEo сайта';

const MONTHS = [
  { no: 1, name: 'январь' },
  { no: 2, name: 'февраль' },
  { no: 3, name: 'март' },
  { no: 4, name: 'апрель' },
  { no: 5, name: 'май' },
  { no: 6, name: 'июнь' },
  { no: 7, name: 'июль' },
  { no: 8, name: 'август' },
  { no: 9, name: 'сентябрь' },
  { no: 10, name: 'октябрь' },
  { no: 11, name: 'ноябрь' },
  { no: 12, name: 'декабрь' },
];

const CLIENT_TO_PROJECT: Record<string, string> = {
  аквагард: 'Аквагард',
  промтехмакулатура: 'Промтех',
  промтех: 'Промтех',
  макулатура: 'Промтех',
  смартстрой: 'Смартстрой',
  smartstroy: 'Смартстрой',
  'smart stroy': 'Смартстрой',
  балтпаллет: 'Балт-паллет',
  'балт паллет': 'Балт-паллет',
  'балт-паллет': 'Балт-паллет',
  watchstore: 'Часы',
  watchstoree: 'Часы',
  часы: 'Часы',
  ректоп: 'Ректоп',
  rectop: 'Ректоп',
  switch: 'Свич',
  свитч: 'Свич',
  свич: 'Свич',
  ломбард: 'Ломбард',
  ломбардбанка: 'Ломбард',
};

export async function fetchPaymentCashflowRows() {
  const response = await loadGvizJsonp();
  return parsePaymentCashflow(response);
}

export function summarizePaymentCashflowRows(rows: PaymentCashflowRow[]): PaymentCashflowSummary {
  return rows.reduce<PaymentCashflowSummary>(
    (summary, row) => ({
      count: summary.count + 1,
      incomeAmount: summary.incomeAmount + row.incomeAmount,
      seoExpenseAmount: summary.seoExpenseAmount + row.seoExpenseAmount,
      developerExpenseAmount: summary.developerExpenseAmount + row.developerExpenseAmount,
      otherExpenseAmount: summary.otherExpenseAmount + row.otherExpenseAmount,
      totalExpenseAmount: summary.totalExpenseAmount + row.totalExpenseAmount,
      netAmount: summary.netAmount + row.netAmount,
    }),
    {
      count: 0,
      incomeAmount: 0,
      seoExpenseAmount: 0,
      developerExpenseAmount: 0,
      otherExpenseAmount: 0,
      totalExpenseAmount: 0,
      netAmount: 0,
    },
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
    const callbackName = `__taskSeoPayments_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

    const sourceUrl = new URL(
      `https://docs.google.com/spreadsheets/d/${PAYMENT_CASHFLOW_SPREADSHEET_ID}/gviz/tq`,
    );
    sourceUrl.searchParams.set('gid', PAYMENT_CASHFLOW_SHEET_GID);
    sourceUrl.searchParams.set('tq', 'select *');
    sourceUrl.searchParams.set('tqx', `out:json;responseHandler:${callbackName}`);
    sourceUrl.searchParams.set('cacheBust', String(Date.now()));

    script.src = sourceUrl.toString();
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error(`Не удалось загрузить вкладку ${PAYMENT_CASHFLOW_SHEET_NAME}`));
    };

    document.head.append(script);
  });
}

function parsePaymentCashflow(response: GvizResponse): PaymentCashflowRow[] {
  const table = response.table;
  if (!table) return [];

  const headers = table.cols.map((column) => column.label ?? '');
  const monthStarts = headers
    .map((header, index) => ({ index, month: parseIncomeMonth(header) }))
    .filter((item): item is { index: number; month: { no: number; name: string } } => Boolean(item.month));

  return table.rows.flatMap((row, rowIndex) => {
    const cells = row.c ?? [];
    const client = cleanCell(formatGvizCell(cells[0]));
    const legalEntity = cleanCell(formatGvizCell(cells[1]));
    const projectName = getProjectName(client);
    const sourceRow = rowIndex + 2;

    if (!client || normalize(client) === 'итого') return [];

    return monthStarts.flatMap((start, startIndex) => {
      const nextStartIndex = monthStarts[startIndex + 1]?.index ?? headers.length;
      const rowValues = cells.slice(start.index, nextStartIndex).map(formatGvizCell);
      const groupHeaders = headers.slice(start.index, nextStartIndex);
      const incomeAmount = parseMoney(rowValues[0]);
      const seoExpenseAmount = readExpense(rowValues, groupHeaders, 'seo');
      const developerExpenseAmount = readExpense(rowValues, groupHeaders, 'developer');
      const otherExpenseAmount = readExpense(rowValues, groupHeaders, 'other');
      const totalExpenseAmount = seoExpenseAmount + developerExpenseAmount + otherExpenseAmount;

      if (incomeAmount === 0 && totalExpenseAmount === 0) return [];

      return [
        {
          id: `${normalize(projectName)}-${start.month.no}-${sourceRow}`,
          sourceRow,
          client,
          legalEntity,
          projectName,
          monthNo: start.month.no,
          monthName: start.month.name,
          periodLabel: `${capitalize(start.month.name)} ${new Date().getFullYear()}`,
          incomeAmount,
          seoExpenseAmount,
          developerExpenseAmount,
          otherExpenseAmount,
          totalExpenseAmount,
          netAmount: incomeAmount - totalExpenseAmount,
        },
      ];
    });
  });
}

function parseIncomeMonth(header: string) {
  const normalized = normalizeHeader(header);
  if (!normalized.includes('приход')) return null;
  return MONTHS.find((month) => normalized.includes(month.name)) ?? null;
}

function readExpense(values: string[], headers: string[], type: 'seo' | 'developer' | 'other') {
  const index = headers.findIndex((header) => {
    const normalized = normalizeHeader(header);
    if (!normalized.includes('расход')) return false;
    if (type === 'seo') return normalized.includes('сео') || normalized.includes('seo');
    if (type === 'developer') return normalized.includes('разработ');
    return normalized.includes('друг');
  });

  return index >= 0 ? parseMoney(values[index]) : 0;
}

function getProjectName(client: string) {
  const normalized = normalize(client);
  return CLIENT_TO_PROJECT[normalized] ?? client;
}

function formatGvizCell(cell: GvizCell) {
  if (!cell) return '';
  if (cell.f !== undefined && cell.f !== null) return String(cell.f);
  if (cell.v === undefined || cell.v === null) return '';
  return String(cell.v);
}

function parseMoney(value: string) {
  const normalized = value
    .replace(/\u00a0/g, ' ')
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanCell(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeHeader(value: string) {
  return normalize(value).replace(/ё/g, 'е');
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

function capitalize(value: string) {
  return value ? `${value.slice(0, 1).toUpperCase()}${value.slice(1)}` : value;
}
