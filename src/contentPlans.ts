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

export type ContentPlanSourceError = {
  sourceId: string;
  projectName: string;
  message: string;
};

export type ContentPlanFetchResult = {
  topics: ContentPlanTopic[];
  errors: ContentPlanSourceError[];
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
  {
    id: 'smartstroy-content-2026',
    projectName: 'Смартстрой',
    clientName: 'СмартСтрой',
    title: 'Контент-план на 5 месяцев',
    sheetName: 'Статьи',
    spreadsheetId: '1hhNc8EN3BlSWTaKQKTiwrpLQVyGoFmYAxeNe47Us40Q',
    spreadsheetUrl:
      'https://docs.google.com/spreadsheets/d/1hhNc8EN3BlSWTaKQKTiwrpLQVyGoFmYAxeNe47Us40Q/edit?usp=sharing',
    period: 'до 15.08.2026',
    note: 'Темы статей из вкладки "Статьи". В таблице нет календарных дат, поэтому темы показываются общим списком.',
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

export async function fetchContentPlanTopics(): Promise<ContentPlanFetchResult> {
  const topicGroups = await Promise.allSettled(
    CONTENT_PLAN_SOURCES.map(async (source) => ({
      source,
      topics: parseContentPlanTopics(await loadGvizJsonp(source), source),
    })),
  );
  const rows = topicGroups.flatMap((result) => (result.status === 'fulfilled' ? result.value.topics : []));
  const errors = topicGroups.flatMap((result, index) => {
    if (result.status === 'fulfilled') return [];
    const source = CONTENT_PLAN_SOURCES[index];
    return [
      {
        sourceId: source.id,
        projectName: source.projectName,
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      },
    ];
  });

  if (errors.length) {
    console.warn(
      'Часть контент-планов не загрузилась',
      errors.map((error) => `${error.projectName}: ${error.message}`),
    );
  }

  if (!rows.length && errors.length) {
    const message = errors.map((error) => `${error.projectName}: ${error.message}`).join('; ');
    throw new Error(message || 'Контент-планы не загрузились');
  }

  return { topics: rows, errors };
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
  const values = table.rows.map((row) => row.c ?? []);
  const headerIndex = values.findIndex((cells, index) => {
    if (index > 10) return false;
    const labels = cells.map((cell) => normalize(formatGvizCell(cell)));
    return labels.some((label) => label.includes('тема')) || labels.some((label) => label.includes('дата'));
  });
  const headers = headerIndex >= 0 ? values[headerIndex].map((cell) => normalize(formatGvizCell(cell))) : [];
  const dataRows = headerIndex >= 0 ? values.slice(headerIndex + 1) : values;
  const findHeader = (...needles: string[]) =>
    headers.findIndex((header) => needles.some((needle) => header.includes(needle)));
  const dateIndex = findHeader('дата', 'день');
  const monthIndex = findHeader('месяц');
  const topicIndex = findHeader('тема', 'статья', 'название');
  const blockIndex = findHeader('блок', 'раздел');
  const typeIndex = findHeader('тип', 'материал');
  const intentIndex = findHeader('интент', 'цель');
  const formatIndex = findHeader('формат');
  const audienceIndex = findHeader('аудитория');
  const serviceIndex = findHeader('услуга', 'направление');
  const urlIndex = findHeader('url', 'ссылка');
  const priorityIndex = findHeader('приоритет');
  const statusIndex = findHeader('статус', 'состояние');
  const fallbackTopicIndex = topicIndex >= 0 ? topicIndex : dateIndex === 0 ? 2 : 0;
  const fallbackDateIndex = dateIndex >= 0 ? dateIndex : topicIndex === 0 ? -1 : 0;

  return dataRows.flatMap((cells, rowIndex) => {
    const date = fallbackDateIndex >= 0 ? cleanCell(formatGvizCell(cells[fallbackDateIndex])) : '';
    const topic = cleanCell(formatGvizCell(cells[fallbackTopicIndex]));
    const month = monthIndex >= 0 ? cleanCell(formatGvizCell(cells[monthIndex])) : '';
    const isoDate = parseRuDateToIso(date);

    if (!topic) return [];

    return [
      {
        id: `${source.id}-${rowIndex + headerIndex + 2}-${normalize(topic).slice(0, 40)}`,
        sourceId: source.id,
        projectName: source.projectName,
        clientName: source.clientName,
        sourceRow: rowIndex + headerIndex + 2,
        date: date || source.period || 'без даты',
        isoDate,
        month: month || getMonthFromIso(isoDate) || source.period || 'Без месяца',
        topic,
        block: getCellByIndex(cells, blockIndex, 3),
        materialType: getCellByIndex(cells, typeIndex, 4),
        intent: getCellByIndex(cells, intentIndex, 5),
        format: getCellByIndex(cells, formatIndex, 6),
        audience: getCellByIndex(cells, audienceIndex, 7),
        service: getCellByIndex(cells, serviceIndex, 8),
        internalUrl: getCellByIndex(cells, urlIndex, 9),
        priority: getCellByIndex(cells, priorityIndex, 10),
        status: getCellByIndex(cells, statusIndex, 11) || 'Без статуса',
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
  if (!day || !month) return '';
  const resolvedYear = year || String(new Date().getFullYear());
  return `${resolvedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function getMonthFromIso(value: string) {
  if (!value) return '';
  const [year, month] = value.split('-');
  return month && year ? `${month}.${year}` : '';
}

function getCellByIndex(cells: GvizCell[], headerIndex: number, fallbackIndex: number) {
  const index = headerIndex >= 0 ? headerIndex : fallbackIndex;
  return cleanCell(formatGvizCell(cells[index]));
}

function normalize(value: string) {
  return cleanCell(value).toLowerCase();
}

function cleanCell(value = '') {
  return value.replace(/\u00a0/g, ' ').trim();
}
