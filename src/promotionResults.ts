export type PromotionResultSource = {
  id: string;
  projectName: string;
  clientName: string;
  spreadsheetTitle: string;
  sheetName: string;
  url: string;
  recordsLabel: string;
  periodLabel: string;
  fields: string[];
  sampleQueries: string[];
  goalExamples: string[];
  note: string;
};

const metricFields = ['Дата и время', 'Источник', 'Ключевой запрос', 'Достижение цели', 'Обратная связь'];

export const PROMOTION_RESULT_SOURCES: PromotionResultSource[] = [
  {
    id: 'results-aquaguard-metrika',
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    spreadsheetTitle: 'Аквагард ключевые запросы в метрике',
    sheetName: 'Лист1',
    url: 'https://docs.google.com/spreadsheets/d/1xlq_wATsxCLQoS7DDEidfkyg4ay8zJaquob-TJUnfPE/edit?gid=0#gid=0',
    recordsLabel: 'до 998 строк',
    periodLabel: 'с 14.04',
    fields: metricFields,
    sampleQueries: [
      'системы для очистки стоков предприятия Москва',
      'очистные сооружения под ключ для предприятий',
      'лос проектирование',
    ],
    goalExamples: [],
    note: 'Источник хранит ключевые запросы из Метрики и колонку достижений целей.',
  },
  {
    id: 'results-smartstroy-metrika',
    projectName: 'Смартстрой',
    clientName: 'СмартСтрой',
    spreadsheetTitle: 'Смартстрой ключевые запросы в метрике',
    sheetName: 'Лист1',
    url: 'https://docs.google.com/spreadsheets/d/1WGH04-LSPx-nMvJqyY3JOHdlgm7CqYskXxaXgXxOuCs/edit?gid=0#gid=0',
    recordsLabel: 'до 1007 строк',
    periodLabel: 'с 07.05.2026',
    fields: metricFields,
    sampleQueries: [
      'строительство дома санкт петербург',
      'дом газобетон под ключ',
      'строительство коттеджей спб и ленинградской области',
    ],
    goalExamples: [],
    note: 'Источник хранит запросы, источники переходов и колонку целей для отчета.',
  },
  {
    id: 'results-promteh-metrika',
    projectName: 'Промтех',
    clientName: 'ПромТехМакулатура',
    spreadsheetTitle: 'Промтехмакулатура ключевые запросы в метрике',
    sheetName: 'Лист1',
    url: 'https://docs.google.com/spreadsheets/d/1h6dNgKylmGd3074sm_rFtasb6LmUlwdQ7fyArmt10Cs/edit?gid=0#gid=0',
    recordsLabel: 'до 998 строк',
    periodLabel: 'с 09.04',
    fields: metricFields,
    sampleQueries: [
      'сдать картон в спб цены за кг',
      'прием макулатуры спб',
      'сдать макулатуру в спб за деньги от 100 кг',
    ],
    goalExamples: ['Автоцель: клик по номеру телефона', 'Автоцель: переход в мессенджер'],
    note: 'Источник уже содержит примеры автоцелей по звонку и переходу в мессенджер.',
  },
];
