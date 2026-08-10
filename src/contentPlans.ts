export type ContentPlanSource = {
  id: string;
  projectName: string;
  clientName: string;
  title: string;
  sheetName: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  period: string;
  note: string;
};

export type ContentPlanTopic = {
  id: string;
  sourceId: string;
  projectName: string;
  clientName: string;
  sourceRow: number;
  date: string;
  isoDate: string;
  month: string;
  topic: string;
  block: string;
  materialType: string;
  intent: string;
  format: string;
  audience: string;
  service: string;
  internalUrl: string;
  priority: string;
  status: string;
};

export type ContentPlanSummary = {
  count: number;
  months: string[];
  highPriority: number;
  nextTopic?: ContentPlanTopic;
};

export const CONTENT_PLAN_SOURCES: ContentPlanSource[] = [
  {
    id: 'promteh-content-2026',
    projectName: 'Промтех',
    clientName: 'ПромТехМакулатура',
    title: 'Контент-план до конца года',
    sheetName: 'Контент-план',
    spreadsheetId: '13SainHNKIaES85E2y94MppHyMEgAWJ6vVhW7IaABHo4',
    spreadsheetUrl:
      'https://docs.google.com/spreadsheets/d/13SainHNKIaES85E2y94MppHyMEgAWJ6vVhW7IaABHo4/edit?usp=sharing',
    period: 'август-декабрь 2026',
    note: 'Ежедневные темы с 01.08.2026 по 31.12.2026: пластик, вторсырье, экология и B2B-сбор.',
  },
];

type GvizCell = { v?: string | number | boolean | null; f?: string | null } | null;

type GvizResponse = {
  status: 'ok' | 'error';
  errors?: Array<{ detailed_message?: string; message?: string; reason?: string }>;
  table?: {
    cols: Array<{ label?: string }>;
    rows: Array<{ c?: GvizCell[] }>;
  };
};

export async function fetchContentPlanTopics() {
  const topicGroups = await Promise.all(
    CONTENT_PLAN_SOURCES.map(async (source) => parseContentPlanTopics(await loadGvizJsonp(source), source)),
  );
  return topicGroups.flat();
}

export function summarizeContentPlanTopics(rows: ContentPlanTopic[]): ContentPlanSummary {
  const months = Array.from(new Set(rows.map((row) => row.month).filter(Boolean)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    count: rows.length,
    months,
    highPriority: rows.filter((row) => normalize(row.priority).includes('высок')).length,
    nextTopic:
      rows.find((row) => {
        const date = new Date(`${row.isoDate}T00:00:00`);
        return !Number.isNaN(date.getTime()) && date >= today;
      }) ?? rows[0],
  };
}

function loadGvizJsonp(source: ContentPlanSource) {
  return new Promise<GvizResponse>((resolve, reject) => {
    const callbackName = `__taskSeoContent_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

    const sheet = encodeURIComponent(source.sheetName);
    const query = encodeURIComponent('select *');
    script.src = `https://docs.google.com/spreadsheets/d/${source.spreadsheetId}/gviz/tq?sheet=${sheet}&tq=${query}&tqx=out:json;responseHandler:${callbackName}&cacheBust=${Date.now()}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('Не удалось загрузить Google Sheets'));
    };

    document.head.append(script);
  });
}

function parseContentPlanTopics(response: GvizResponse, source: ContentPlanSource): ContentPlanTopic[] {
  const table = response.table;
  if (!table) return [];

  return table.rows.flatMap((row, rowIndex) => {
    const cells = row.c ?? [];
    const date = cleanCell(formatGvizCell(cells[0]));
    const topic = cleanCell(formatGvizCell(cells[2]));

    if (!date || !topic) return [];

    return [
      {
        id: `${source.id}-${rowIndex + 2}-${normalize(topic).slice(0, 40)}`,
        sourceId: source.id,
        projectName: source.projectName,
        clientName: source.clientName,
        sourceRow: rowIndex + 2,
        date,
        isoDate: parseRuDateToIso(date),
        month: cleanCell(formatGvizCell(cells[1])),
        topic,
        block: cleanCell(formatGvizCell(cells[3])),
        materialType: cleanCell(formatGvizCell(cells[4])),
        intent: cleanCell(formatGvizCell(cells[5])),
        format: cleanCell(formatGvizCell(cells[6])),
        audience: cleanCell(formatGvizCell(cells[7])),
        service: cleanCell(formatGvizCell(cells[8])),
        internalUrl: cleanCell(formatGvizCell(cells[9])),
        priority: cleanCell(formatGvizCell(cells[10])),
        status: cleanCell(formatGvizCell(cells[11])) || 'Без статуса',
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

function parseRuDateToIso(value: string) {
  const [day, month, year] = value.split('.');
  if (!day || !month || !year) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function normalize(value: string) {
  return cleanCell(value).toLowerCase();
}

function cleanCell(value = '') {
  return value.replace(/\u00a0/g, ' ').trim();
}
