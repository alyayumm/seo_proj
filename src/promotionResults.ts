export type PromotionGoalQueryStat = {
  query: string;
  visits: number;
  goals: number;
};

export type PromotionGoalTrendPoint = {
  month: string;
  visits: number;
  goals: number;
};

export type PromotionGoalAnalytics = {
  visits: number;
  uniqueQueries: number;
  goalRows: number;
  goalCount: number;
  topQueries: PromotionGoalQueryStat[];
  monthly: PromotionGoalTrendPoint[];
};

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
  goalAnalytics?: PromotionGoalAnalytics;
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
    goalAnalytics: {
      visits: 292,
      uniqueQueries: 252,
      goalRows: 8,
      goalCount: 18,
      topQueries: [
        { query: 'компании по реконструкции очистных сооружений', visits: 1, goals: 5 },
        { query: 'контейнер оборудование для водоподготовки и водоочистки для производства', visits: 1, goals: 4 },
        { query: 'мобильная установка водоподготовки для питьевого водоснабжения из реки', visits: 1, goals: 4 },
        { query: 'авангард насосные станции', visits: 1, goals: 1 },
        { query: 'автоматическая система пожаротушения аквагард купить москва', visits: 1, goals: 1 },
        { query: 'повысительные насосные станции водоснабжения для промышленного объекта', visits: 1, goals: 1 },
      ],
      monthly: [
        { month: 'апр', visits: 49, goals: 1 },
        { month: 'май', visits: 41, goals: 6 },
        { month: 'июн', visits: 69, goals: 6 },
        { month: 'июл', visits: 91, goals: 1 },
        { month: 'авг', visits: 42, goals: 4 },
      ],
    },
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
    goalAnalytics: {
      visits: 188,
      uniqueQueries: 179,
      goalRows: 2,
      goalCount: 4,
      topQueries: [
        { query: 'дом из газобетона в семейную ипотеку в спб', visits: 1, goals: 3 },
        { query: 'строительство домов под ключ в ленинградской области', visits: 1, goals: 1 },
        { query: 'вентиляция в каркасном доме как правильно сделать', visits: 3, goals: 0 },
        { query: 'Построй санкт петербург', visits: 3, goals: 0 },
        { query: 'варианты внутренней отделки каркасного дома фото', visits: 2, goals: 0 },
        { query: 'внутренняя отделка в каркасном доме', visits: 2, goals: 0 },
      ],
      monthly: [
        { month: 'май', visits: 10, goals: 0 },
        { month: 'июн', visits: 25, goals: 0 },
        { month: 'июл', visits: 46, goals: 0 },
        { month: 'авг', visits: 107, goals: 4 },
      ],
    },
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
    goalAnalytics: {
      visits: 609,
      uniqueQueries: 518,
      goalRows: 33,
      goalCount: 43,
      topQueries: [
        { query: 'прием макулатуры спб', visits: 7, goals: 7 },
        { query: 'вывоз документов и утилизация под ключ', visits: 1, goals: 4 },
        { query: 'вывоз макулатуры в спб', visits: 1, goals: 4 },
        { query: 'макулатура сдать спб', visits: 1, goals: 4 },
        { query: 'где принимают бу линолеум', visits: 2, goals: 2 },
        { query: 'вывоз макулатуры спб за деньги', visits: 2, goals: 1 },
        { query: 'приём пластика в спб цена за 1 кг', visits: 2, goals: 1 },
      ],
      monthly: [
        { month: 'апр', visits: 14, goals: 2 },
        { month: 'май', visits: 21, goals: 1 },
        { month: 'июн', visits: 120, goals: 13 },
        { month: 'июл', visits: 232, goals: 12 },
        { month: 'авг', visits: 222, goals: 15 },
      ],
    },
    note: 'Источник уже содержит примеры автоцелей по звонку и переходу в мессенджер.',
  },
];
