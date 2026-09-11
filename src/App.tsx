import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  History,
  LayoutList,
  Layers3,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Sun,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  CLIENT_AUDIT_SOURCES,
  SEO_AUDIT_CHECKLIST,
  type ClientAuditSource,
} from './auditSources';
import { CLIENT_QUICK_LINKS, type ClientQuickLinks } from './clientLinks';
import {
  CONTENT_PLAN_SOURCES,
  fetchContentPlanTopics,
  summarizeContentPlanTopics,
  type ContentPlanSource,
  type ContentPlanSourceError,
  type ContentPlanSummary,
  type ContentPlanTopic,
} from './contentPlans';
import {
  fetchLinkPurchases,
  LINK_SOURCE_SPREADSHEET_URL,
  REQUIRED_LINK_PROJECTS,
  summarizeLinkPurchases,
  type LinkPurchase,
  type LinkPurchaseSummary,
} from './linkPurchases';
import {
  combineLeadAnalyticsSummaries,
  fetchLeadAnalyticsSummaries,
  LEAD_ANALYTICS_SOURCES,
  STATIC_LEAD_ANALYTICS_SUMMARIES,
  type LeadAnalyticsSourceError,
  type LeadAnalyticsSummary,
  type LeadTrendPoint,
} from './leadAnalytics';
import {
  fetchPaymentCashflowRows,
  PAYMENT_CASHFLOW_SPREADSHEET_URL,
  summarizePaymentCashflowRows,
  type PaymentCashflowRow,
} from './paymentCashflow';
import {
  EMPTY_METRIKA_STATS,
  mergePromotionSourcesWithMetrika,
  normalizeMetrikaStatsPayload,
  type MetrikaStatsPayload,
} from './metrikaStats';
import {
  EXTERNAL_PROJECTS_SOURCE,
  type ExternalBudgetLine,
  type ExternalProjectAsset,
  type ExternalProjectSection,
  type ExternalProjectsSource,
  type ExternalTimelineItem,
  type ExternalWeeklyUpdate,
} from './externalProjects';
import {
  PROMOTION_RESULT_SOURCES,
  type PromotionGoalAnalytics,
  type PromotionGoalQueryStat,
  type PromotionGoalTrendPoint,
  type PromotionResultSource,
} from './promotionResults';
import { WORK_PLAN_SOURCES, type WorkPlanSource } from './workPlans';
import {
  EMPTY_BITRIX24_SNAPSHOT,
  normalizeBitrix24Snapshot,
  type Bitrix24Snapshot,
} from './bitrix24';

type View = 'tasks' | 'admin' | 'dashboard' | 'seo' | 'payments' | 'report' | 'external';
type Status = 'planned' | 'active' | 'done' | 'risk';
type CalendarMode = 'plan' | 'fact';
type ThemeMode = 'dark' | 'light';
type AdminTab = 'projects' | 'people' | 'tasks' | 'sources' | 'payments';
type ProjectTab = 'tasks' | 'links' | 'plans' | 'content' | 'results' | 'audit';
type SeoProjectTab = 'analytics' | 'queries' | 'tasks' | 'links' | 'content' | 'plans' | 'audit' | 'reports' | 'payments';
type SeoTrendMode = 'daily' | 'weekly' | 'monthly';
type SeoPeriodPreset = '30d' | '3m' | '6m' | 'custom';
type SeoCompareMode = 'previous' | 'lastYear' | 'custom' | 'none';
type SeoTrafficSystem = 'all' | 'yandex' | 'google' | 'other';
type SeoLeadMetricMode = 'all' | 'target';
type SeoImpactTab = 'pages' | 'queries';
type SeoImpactDirection = 'growth' | 'drop';
type SeoQuerySort = 'goals' | 'visits' | 'query';
type MetrikaQueryExportStatus = 'idle' | 'ready' | 'fallback' | 'error';
type ReportMode = 'tasks' | 'logic' | 'metrics';
type TaskReportFilter =
  | 'all'
  | 'done'
  | 'open'
  | 'planned'
  | 'active'
  | 'risk'
  | 'overdue'
  | 'lateDone'
  | 'withoutDeadline';
type SeoProjectTaskMode = 'open' | 'done';
type TaskLogicCategory = 'carried' | 'added' | 'done' | 'lateDone' | 'deadlineMoved' | 'stuck';
type TaskScoreMetric = 'done' | 'overdue' | 'lateDone' | 'carried' | 'risk' | 'withoutDeadline';
type LinkLoadStatus = 'idle' | 'loading' | 'ready' | 'error';
type PaymentStatus = 'planned' | 'issued' | 'paid' | 'overdue';
type PaymentKind = 'service' | 'outsource';

type Project = {
  id: string;
  name: string;
  color: string;
};

type Person = {
  id: string;
  name: string;
  role: string;
};

type TimelineItem = {
  id: string;
  title: string;
  ownerId: string;
  status: Status;
  dueDate: string;
  completedAt?: string;
};

type TaskHistoryChange = {
  field: string;
  before: string;
  after: string;
};

type TaskHistoryEntry = {
  id: string;
  changedAt: string;
  action: string;
  summary: string;
  changes: TaskHistoryChange[];
};

type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  sourceLabel?: string;
  sourceUrl?: string;
  status: Status;
  ownerIds: string[];
  createdAt: string;
  deadline: string;
  completedAt?: string;
  timelineEnabled: boolean;
  timeline: TimelineItem[];
  history?: TaskHistoryEntry[];
};

type PaymentRow = {
  id: string;
  projectId: string;
  periodLabel: string;
  dueDate: string;
  status: PaymentStatus;
  kind: PaymentKind;
  clientAmount: number;
  outsourceAmount: number;
  linkBudgetLimit: number;
  note: string;
};

type PaymentDraft = {
  projectId: string;
  periodLabel: string;
  dueDate: string;
  kind: PaymentKind;
  clientAmount: string;
};

type PaymentMonthlySummary = {
  key: string;
  label: string;
  planIncome: number;
  factIncome: number;
  serviceExpenseAmount: number;
  linkExpenseAmount: number;
  totalExpenseAmount: number;
  netAmount: number;
  paymentCount: number;
  factRowCount: number;
  linkCount: number;
  projectNames: Set<string>;
};

type ManagedResourceTab = 'site' | 'report' | 'links' | 'plans' | 'content' | 'results' | 'audit';

type ManagedResource = {
  id: string;
  projectId: string;
  tab: ManagedResourceTab;
  title: string;
  url: string;
  dateLabel: string;
  note: string;
};

type ManagedResourceDraft = {
  projectId: string;
  tab: ManagedResourceTab;
  title: string;
  url: string;
  dateLabel: string;
  note: string;
};

const statusLabels: Record<Status, string> = {
  planned: 'План',
  active: 'В работе',
  done: 'Готово',
  risk: 'Риск',
};

const statusOrder: Status[] = ['planned', 'active', 'risk', 'done'];

const paymentStatusLabels: Record<PaymentStatus, string> = {
  planned: 'План',
  issued: 'Счет выставлен',
  paid: 'Оплачено',
  overdue: 'Просрочено',
};

const paymentStatusOrder: PaymentStatus[] = ['planned', 'issued', 'paid', 'overdue'];

const paymentKindLabels: Record<PaymentKind, string> = {
  service: 'Наши услуги',
  outsource: 'Услуги аутсорс',
};

const seoTrendModeLabels: Record<SeoTrendMode, string> = {
  daily: 'По дням',
  weekly: 'По неделям',
  monthly: 'Помесячно',
};

const seoTrendModeShortLabels: Record<SeoTrendMode, string> = {
  daily: 'дни',
  weekly: 'недели',
  monthly: 'месяцы',
};

const seoPeriodPresetLabels: Record<SeoPeriodPreset, string> = {
  '30d': '30 дней',
  '3m': '3 месяца',
  '6m': '6 месяцев',
  custom: 'Свой период',
};

const seoCompareModeLabels: Record<SeoCompareMode, string> = {
  previous: 'предыдущий период',
  lastYear: 'год к году',
  custom: 'свой период',
  none: 'без сравнения',
};

const seoTrafficSystemLabels: Record<SeoTrafficSystem, string> = {
  all: 'Все системы',
  yandex: 'Яндекс',
  google: 'Google',
  other: 'Другие',
};

const seoImpactTabLabels: Record<SeoImpactTab, string> = {
  pages: 'Страницы входа',
  queries: 'Поисковые запросы',
};

const reportModeLabels: Record<ReportMode, string> = {
  tasks: 'Динамика задач',
  logic: 'Динамика выполнения',
  metrics: 'Динамика показателей',
};

const taskReportFilterLabels: Record<TaskReportFilter, string> = {
  all: 'Всего задач',
  done: 'Выполнено',
  open: 'Не выполнено',
  planned: 'Не начато',
  active: 'В работе',
  risk: 'Риск',
  overdue: 'Просрочено',
  lateDone: 'Закрыто с опозданием',
  withoutDeadline: 'Без дедлайна',
};

const taskLogicCategoryLabels: Record<TaskLogicCategory, string> = {
  carried: 'Тянется из прошлого отчета',
  added: 'Добавилось за неделю',
  done: 'Сделано за неделю',
  lateDone: 'Закрыто с опозданием',
  deadlineMoved: 'Перенесен дедлайн',
  stuck: 'Не закрывается 2+ отчета',
};

const taskScoreMetricLabels: Record<TaskScoreMetric, string> = {
  done: 'Процент выполнения',
  overdue: 'Процент текущих просрочек',
  lateDone: 'Закрыто с опозданием',
  carried: 'Тянется от отчета к отчету',
  risk: 'В статусе риск',
  withoutDeadline: 'Задачи без дедлайна',
};

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

const managedResourceTabLabels: Record<ManagedResourceTab, string> = {
  site: 'Сайт',
  report: 'Отчет клиенту',
  links: 'Закуп ссылок',
  plans: 'План работ',
  content: 'Контент-план',
  results: 'Результаты',
  audit: 'Аудит',
};

const SEO_PLANNING_CHECKLIST_URL =
  'https://docs.google.com/document/d/1waAgTlkXKntLTkYruIVXEtprteaJhcq4ZiOe1XPqio8/edit?tab=t.emcoqoq3hai5#heading=h.9ocmnxqz6u8e';
const PROMTEH_FORECAST_REPORT_URL =
  'https://docs.google.com/document/d/1UTVNP4WnpKGrwbBAylhyxPbOSvlyyRBxw_SQVrKMK1E/edit?usp=sharing';
const RECTOP_CORRECTIONS_BRIEF_URL =
  'https://docs.google.com/document/d/1H9039MtjWEtQjWv4R_iosviGo0gTeNlxlQr0cWExSmM/edit?usp=sharing';
const RECTOP_FAQ_URL =
  'https://docs.google.com/document/d/1pytSVh4lxSb5BDV9C9CM9gOgwxdm8Wnb2gR2mgrRpWg/edit?tab=t.0#heading=h.mlgh27lmuw4v';

const initialProjects: Project[] = [
  { id: 'project-ash', name: 'АШ', color: '#6D72FF' },
  { id: 'project-lombard', name: 'Ломбард', color: '#4DB8FF' },
  { id: 'project-watch', name: 'Часы', color: '#8B5CF6' },
  { id: 'project-smart', name: 'Смартстрой', color: '#14B8A6' },
  ...REQUIRED_LINK_PROJECTS.filter(
    (project) => !['Ломбард', 'Часы', 'Смартстрой'].includes(project.name),
  ),
];

const requiredPeople: Person[] = [
  { id: 'person-alina', name: 'Алина', role: 'ДОМ' },
  { id: 'person-kristina', name: 'Кристина', role: 'Аккаунт менеджер' },
  { id: 'person-aleksey', name: 'Алексей', role: 'РОС' },
  { id: 'person-alena', name: 'Алена', role: 'РОМ' },
  { id: 'person-nikolay', name: 'Николай', role: 'Сео-специалист' },
  { id: 'person-anton', name: 'Антон', role: 'учредитель' },
  { id: 'person-outsource', name: 'Аутсорс', role: 'подрядчик' },
  { id: 'person-marketing', name: 'Отдел маркетинга', role: 'команда' },
  { id: 'person-kirill', name: 'Кирилл', role: 'ответственный' },
  { id: 'person-olga', name: 'Ольга', role: 'каталог и карточки' },
  { id: 'person-vlad-it', name: 'Влад', role: 'IT' },
];

const initialPeople: Person[] = requiredPeople;

const initialPaymentRows: PaymentRow[] = [
  {
    id: 'payment-promteh-2026-08',
    projectId: 'project-promteh',
    periodLabel: 'Август 2026',
    dueDate: '2026-08-25',
    status: 'planned',
    kind: 'service',
    clientAmount: 0,
    outsourceAmount: 0,
    linkBudgetLimit: 0,
    note: 'Дедлайн по отчету и оплатам - 25 число.',
  },
  {
    id: 'payment-aquaguard-2026-08',
    projectId: 'project-aquaguard',
    periodLabel: 'Август 2026',
    dueDate: '2026-08-25',
    status: 'planned',
    kind: 'service',
    clientAmount: 0,
    outsourceAmount: 0,
    linkBudgetLimit: 0,
    note: 'Суммы можно внести через админку или вкладку оплат.',
  },
  {
    id: 'payment-smartstroy-2026-08',
    projectId: 'project-smart',
    periodLabel: 'Август 2026',
    dueDate: '2026-08-25',
    status: 'planned',
    kind: 'service',
    clientAmount: 0,
    outsourceAmount: 0,
    linkBudgetLimit: 0,
    note: 'Отдельно учитывается фактическая закупка ссылок.',
  },
];

const requiredManagedResourceSeeds: ManagedResource[] = [
  {
    id: 'resource-report-promteh-forecast-2026-08-31',
    projectId: 'project-promteh',
    tab: 'report',
    title: 'Прогноз по Промтеху в отчете',
    url: PROMTEH_FORECAST_REPORT_URL,
    dateLabel: '31.08',
    note: 'Прогноз роста до трех заявок в день в течение трех месяцев.',
  },
  {
    id: 'resource-plan-rectop-corrections-2026-09-07',
    projectId: 'project-rectop',
    tab: 'plans',
    title: 'ТЗ правки Ректоп',
    url: RECTOP_CORRECTIONS_BRIEF_URL,
    dateLabel: '07.09',
    note: 'ТЗ по правкам сайта Ректоп.',
  },
  {
    id: 'resource-content-rectop-faq-2026-09-07',
    projectId: 'project-rectop',
    tab: 'content',
    title: 'FAQ Ректоп',
    url: RECTOP_FAQ_URL,
    dateLabel: '07.09',
    note: 'FAQ к правкам сайта Ректоп.',
  },
  ...LEAD_ANALYTICS_SOURCES.flatMap((source) => {
    const projectId = findInitialProjectId(source.projectName);
    if (!projectId) return [];
    return [
      {
        id: `resource-results-${source.id}`,
        projectId,
        tab: 'results' as const,
        title: source.title,
        url: source.url,
        dateLabel: source.periodLabel,
        note: source.note,
      },
    ];
  }),
];

function findInitialProjectId(projectName: string) {
  return initialProjects.find((project) => normalizeProjectName(project.name) === normalizeProjectName(projectName))?.id;
}

function buildInitialManagedResources(): ManagedResource[] {
  const resources: ManagedResource[] = [];
  const addResource = (
    projectName: string,
    tab: ManagedResourceTab,
    title: string,
    url: string,
    dateLabel = '',
    note = '',
  ) => {
    const projectId = findInitialProjectId(projectName);
    if (!projectId || !url) return;
    resources.push({
      id: `resource-${tab}-${projectId}-${resources.length + 1}`,
      projectId,
      tab,
      title,
      url,
      dateLabel,
      note,
    });
  };

  CLIENT_QUICK_LINKS.forEach((links) => {
    addResource(links.projectName, 'site', `${links.clientName}: сайт`, links.siteUrl);
    links.reports.forEach((report) => {
      addResource(links.projectName, 'report', report.title, report.url, report.reportDate, report.label);
    });
  });

  REQUIRED_LINK_PROJECTS.forEach((project) => {
    addResource(project.name, 'links', 'Таблица закупа ссылок', LINK_SOURCE_SPREADSHEET_URL, '', 'Общий источник по закупу ссылок');
  });

  CONTENT_PLAN_SOURCES.forEach((source) => {
    addResource(source.projectName, 'content', source.title, source.spreadsheetUrl, source.period, source.note);
  });

  WORK_PLAN_SOURCES.forEach((source) => {
    addResource(source.projectName, 'plans', source.title, source.url, source.period, source.documentTitle);
  });

  CLIENT_AUDIT_SOURCES.forEach((source) => {
    addResource(source.projectName, 'audit', `Аудит: ${source.clientName}`, source.url, source.sheetName, 'Сбор вводных от клиента');
  });

  PROMOTION_RESULT_SOURCES.forEach((source) => {
    addResource(source.projectName, 'results', source.spreadsheetTitle, source.url, source.periodLabel, source.note);
  });

  return resources;
}

const initialManagedResources = [...buildInitialManagedResources(), ...requiredManagedResourceSeeds];
const requiredManagedResourceSeedsById = new Map(requiredManagedResourceSeeds.map((resource) => [resource.id, resource]));
const managedResourceSeedVersion = 'managed-resources-2026-09-10-leads-v1';

const legacyPersonIdMap: Record<string, string> = {
  'person-vlad': 'person-aleksey',
  'person-maria': 'person-nikolay',
  'person-sergey': 'person-kristina',
};

const legacyProjectIdMap: Record<string, string> = {
  'project-ash-spb': 'project-ash',
  'project-ash-msk': 'project-ash',
};

const legacyProjectNamesToRemove = new Set(['аш спб', 'аш мск']);

const taskSeedVersion = 'task-updates-2026-09-07-v6';
const taskDefaultDeadlineVersion = 'default-deadlines-2026-09-03-v1';
const legacyDemoTaskIds = new Set([
  'task-1',
  'task-2',
  'task-3',
  'task-4',
  'current-ash-new-quarter-plan',
  'current-rectop-new-quarter-plan',
]);

const requiredTaskSeeds: Task[] = [
  {
    id: 'current-ash-avtopravo-redesign',
    projectId: 'project-ash',
    title: 'Редизайн сайта Автоправо',
    description:
      'Изменили ТЗ и брендбук, ориентир - сайты Симакина. На 07.09 сдан макет блога, остались небольшие блоки типа FAQ. План - передать айтишникам на этой неделе.',
    sourceLabel: 'редизайн в Figma',
    sourceUrl:
      'https://www.figma.com/design/BrReyqlaV4p15QX0bekG2X/%D0%90%D0%B2%D1%82%D0%BE%D0%BF%D1%80%D0%B0%D0%B2%D0%BE?node-id=519-8247&t=RXaNEtFVQQizrAjv-1',
    status: 'active',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-10',
    deadline: '2026-09-13',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-ash-avtopravo-blog-layout',
        title: 'Сдать макет блога',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-06',
        completedAt: '2026-09-06',
      },
      {
        id: 'timeline-ash-avtopravo-faq-blocks',
        title: 'Доделать небольшие блоки типа FAQ',
        ownerId: 'person-outsource',
        status: 'active',
        dueDate: '2026-09-13',
      },
      {
        id: 'timeline-ash-avtopravo-transfer-to-it',
        title: 'Передать макет айтишникам',
        ownerId: 'person-vlad-it',
        status: 'planned',
        dueDate: '2026-09-13',
      },
    ],
  },
  {
    id: 'current-ash-template-sites',
    projectId: 'project-ash',
    title: 'Создание сайтов по шаблону',
    description: 'Следующий шаг после редизайна и согласования шаблонной логики по автошколам.',
    status: 'planned',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-ash-parameters-matrix-rollout',
    projectId: 'project-ash',
    title: 'Матрица параметров: передача в IT и решение по раскатке',
    description: 'На 17.08: SEO-логика отдана разработчикам. Матрица параметров и логика переданы в IT.',
    status: 'done',
    ownerIds: ['person-vlad-it', 'person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '2026-08-11',
    completedAt: '2026-08-17',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-ash-matrix-call',
        title: 'Созвон Влад и Леша по матрице параметров',
        ownerId: 'person-vlad-it',
        status: 'done',
        dueDate: '2026-08-11',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-ash-matrix-it-transfer',
        title: 'Передать IT матрицу и SEO-логику на реализацию',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-11',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-ash-matrix-rollout-decision',
        title: 'Решить: сразу Автосити/Автоправо или тест на околонулевом сайте',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-11',
        completedAt: '2026-08-17',
      },
    ],
  },
  {
    id: 'current-proskills-rustore-reviews',
    projectId: 'project-proskills',
    title: 'RuStore: положительные отзывы и ответы на негативные',
    description: 'На 24.08: по Профскиллс все сделано.',
    status: 'done',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-14',
    completedAt: '2026-08-24',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-proskills-rustore-positive-reviews',
        title: 'Собрать положительные отзывы с ОП',
        ownerId: 'person-kristina',
        status: 'done',
        dueDate: '2026-08-14',
        completedAt: '2026-08-24',
      },
      {
        id: 'timeline-proskills-rustore-access',
        title: 'Получить доступ к кабинету RuStore',
        ownerId: 'person-kristina',
        status: 'done',
        dueDate: '2026-08-14',
        completedAt: '2026-08-24',
      },
      {
        id: 'timeline-proskills-rustore-negative-replies',
        title: 'Ответить на имеющиеся негативные отзывы',
        ownerId: 'person-kristina',
        status: 'done',
        dueDate: '2026-08-14',
        completedAt: '2026-08-24',
      },
    ],
  },
  {
    id: 'current-promteh-site-transfer',
    projectId: 'project-promteh',
    title: 'Перенос сайта',
    description: 'На 17.08: сайт перенесен, раздел пластика на проде, публикация статей настроена.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    completedAt: '2026-08-17',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-promteh-site-transfer',
        title: 'Перенести сайт',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-promteh-plastic-prod',
        title: 'Вывести раздел пластика на прод',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-promteh-articles-publishing',
        title: 'Настроить публикацию статей',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-17',
      },
    ],
  },
  {
    id: 'current-promteh-forecast-ahrefs',
    projectId: 'project-promteh',
    title: 'Прогноз по Промтеху для отчета',
    description: 'По планерке 25.08: прогноз сделан и добавлен в отчет.',
    sourceLabel: 'отчет с прогнозом',
    sourceUrl: PROMTEH_FORECAST_REPORT_URL,
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-17',
    deadline: '2026-08-25',
    completedAt: '2026-08-31',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-promteh-ahrefs-paid',
        title: 'Оплатить Ahrefs для прогноза',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-17',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-promteh-ahrefs-data',
        title: 'Собрать данные в Ahrefs',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-20',
        completedAt: '2026-08-24',
      },
      {
        id: 'timeline-promteh-forecast-ready',
        title: 'Добавить прогноз по Промтеху в отчет',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-25',
        completedAt: '2026-08-31',
      },
    ],
  },
  {
    id: 'current-promteh-site-usability-indexing',
    projectId: 'project-promteh',
    title: 'Точечные правки сайта, верстка, юзабилити и индексация',
    description: 'На 31.08: сделаны небольшие доработки по верстке, перелинковке и пожеланиям клиента.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '',
    completedAt: '2026-08-31',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-promteh-new-quarter-plan',
    projectId: 'project-promteh',
    title: 'Новый план работ на 3 месяца',
    description: 'План на неделю 07.09-13.09: подготовить новый план работ на 3 месяца по проекту.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-smartstroy-sya-projects',
    projectId: 'project-smart',
    title: 'Расширение СЯ по проектам',
    description: 'На 17.08: этап передан дальше в работу над новыми страницами по проектам.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    completedAt: '2026-08-17',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-smartstroy-eeat-pages',
    projectId: 'project-smart',
    title: 'Актуализация проектов',
    description: 'На 04.09: проекты вышлют, планировки долили; актуализация новых страниц по проектам остается в работе.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-smartstroy-layouts-added-04-09',
        title: 'Долить планировки',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-smartstroy-client-projects-waiting-04-09',
        title: 'Дождаться проектов от клиента',
        ownerId: 'person-aleksey',
        status: 'active',
        dueDate: '2026-09-15',
      },
      {
        id: 'timeline-smartstroy-project-pages-update-04-09',
        title: 'Актуализировать новые страницы по проектам',
        ownerId: 'person-aleksey',
        status: 'active',
        dueDate: '2026-09-15',
      },
    ],
  },
  {
    id: 'current-smartstroy-new-quarter-plan',
    projectId: 'project-smart',
    title: 'Новый план работ на 3 месяца',
    description: 'План на неделю 07.09-13.09: подготовить новый план работ на 3 месяца по проекту.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'planning-smartstroy-client-call-2026-08-25',
    projectId: 'project-smart',
    title: 'Созвон с клиентом по проектам, калькулятору и заявкам',
    description: 'На 04.09: калькулятор пока застопили, доступ к Битриксу выдали; по проектам ждем материалы от клиента.',
    sourceLabel: 'чек-лист 25.08',
    sourceUrl: SEO_PLANNING_CHECKLIST_URL,
    status: 'active',
    ownerIds: ['person-alina'],
    createdAt: '2026-08-31',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-smartstroy-client-call-feedback',
        title: 'Получить обратную связь в чате',
        ownerId: 'person-alina',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-smartstroy-calculator-paused-04-09',
        title: 'Поставить калькулятор и квиз на стоп',
        ownerId: 'person-alina',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-smartstroy-bitrix-access-04-09',
        title: 'Получить доступ к Битриксу',
        ownerId: 'person-alina',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-smartstroy-requests-analytics',
        title: 'После доступа к Битриксу подготовить срез по заявкам',
        ownerId: 'person-alina',
        status: 'active',
        dueDate: '2026-09-15',
      },
    ],
  },
  {
    id: 'planning-smartstroy-cottage-locations-2026-08-25',
    projectId: 'project-smart',
    title: 'Расширение по топонимам',
    description: 'План на неделю 07.09-13.09: расширить SEO-структуру по топонимам. На 04.09 топонимы собраны и отданы SEO.',
    sourceLabel: 'чек-лист 25.08',
    sourceUrl: SEO_PLANNING_CHECKLIST_URL,
    status: 'active',
    ownerIds: ['person-marketing', 'person-aleksey'],
    createdAt: '2026-08-31',
    deadline: '2026-09-13',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-smartstroy-locations-yandex-maps',
        title: 'Собрать поселки и локации через Яндекс Карты',
        ownerId: 'person-marketing',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-smartstroy-locations-competitors',
        title: 'Собрать локации через статьи, подборки и сайты конкурентов',
        ownerId: 'person-marketing',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-smartstroy-locations-bitrix',
        title: 'Проверить возможность парсинга в Битриксе',
        ownerId: 'person-marketing',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-smartstroy-locations-seo-transfer-04-09',
        title: 'Передать собранные топонимы SEO на исполнение',
        ownerId: 'person-marketing',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-smartstroy-locations-seo-implementation-04-09',
        title: 'Расширить SEO-структуру страниц по топонимам',
        ownerId: 'person-aleksey',
        status: 'active',
        dueDate: '2026-09-13',
      },
    ],
  },
  {
    id: 'current-aquaguard-service-content-plan',
    projectId: 'project-aquaguard',
    title: 'Контент план по разделу услуг',
    description: 'На 17.08: листы по проекту готовы, следующий контроль - публикация и индексация.',
    status: 'done',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-10',
    deadline: '',
    completedAt: '2026-08-17',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-aquaguard-catalog-products',
    projectId: 'project-aquaguard',
    title: 'Заполнение и мелкие правки по товарке',
    description: 'На 31.08: исправлены косяки после Ольги по карточкам и каталогу.',
    status: 'done',
    ownerIds: ['person-olga'],
    createdAt: '2026-08-10',
    deadline: '',
    completedAt: '2026-08-31',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-aquaguard-catalog-filling-2026-09-07',
    projectId: 'project-aquaguard',
    title: 'Наполнение каталога',
    description: 'План на неделю 07.09-13.09: продолжить наполнение каталога после правок по карточкам и товарке.',
    status: 'active',
    ownerIds: ['person-olga'],
    createdAt: '2026-09-07',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-aquaguard-new-quarter-plan',
    projectId: 'project-aquaguard',
    title: 'Новый план работ на 3 месяца',
    description: 'План на неделю 07.09-13.09: подготовить новый план работ на 3 месяца по проекту.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-aquaguard-feeds-yandex-support',
    projectId: 'project-aquaguard',
    title: 'Листы, фиды и индексация товаров',
    description: 'На 04.09: в выдаче отражается 7 фидов из 10; товары и оставшиеся фиды контролируем до подтверждения.',
    sourceLabel: 'чек-лист 25.08',
    sourceUrl: SEO_PLANNING_CHECKLIST_URL,
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-aquaguard-sheets-ready',
        title: 'Подготовить листы',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-aquaguard-feeds-ready',
        title: 'Подготовить фиды',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-aquaguard-products-indexing',
        title: 'Дождаться индексации товаров',
        ownerId: 'person-aleksey',
        status: 'active',
        dueDate: '',
      },
      {
        id: 'timeline-aquaguard-feeds-visible-04-09',
        title: 'Зафиксировать 7 из 10 фидов в выдаче',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-aquaguard-feeds-moderation',
        title: 'Довести оставшиеся 3 фида до отражения в выдаче',
        ownerId: 'person-aleksey',
        status: 'active',
        dueDate: '2026-09-15',
      },
    ],
  },
  {
    id: 'current-aquaguard-eeat-pages',
    projectId: 'project-aquaguard',
    title: 'ТЗ на создание ЕЕАТ страниц',
    description: 'Актуальная задача по Аквагард.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-gallery',
    projectId: 'project-balt-pallet',
    title: 'Реализация галереи фото товара',
    description: 'На 17.08: галерея к товарам добавлена.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    completedAt: '2026-08-17',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-images',
    projectId: 'project-balt-pallet',
    title: 'Актуализация изображений',
    description: 'На 17.08: изображения заменены.',
    status: 'done',
    ownerIds: ['person-marketing', 'person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    completedAt: '2026-08-17',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-balt-images-marketing',
        title: 'Подготовка и подбор изображений',
        ownerId: 'person-marketing',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-balt-images-aleksey',
        title: 'Внедрение изображений на сайте',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-17',
      },
    ],
  },
  {
    id: 'current-balt-spam-protection',
    projectId: 'project-balt-pallet',
    title: 'Исправление защиты от спама',
    description: 'На 17.08: защита от спама исправлена.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-17',
    deadline: '',
    completedAt: '2026-08-17',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-content-feeds',
    projectId: 'project-balt-pallet',
    title: 'Контент план по товарам и фиды',
    description: 'По планерке 25.08: основные задачи сделали, сейчас все на подтверждении.',
    sourceLabel: 'чек-лист 25.08',
    sourceUrl: SEO_PLANNING_CHECKLIST_URL,
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-balt-content-feeds-work-done',
        title: 'Закрыть работы по контенту, товарным страницам и фидам',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-30',
      },
      {
        id: 'timeline-balt-content-feeds-confirmation',
        title: 'Дождаться подтверждения по выполненным работам',
        ownerId: 'person-kristina',
        status: 'active',
        dueDate: '',
      },
    ],
  },
  {
    id: 'current-balt-new-quarter-plan',
    projectId: 'project-balt-pallet',
    title: 'Новый план работ на 3 месяца',
    description: 'План на неделю 07.09-13.09: подготовить новый план работ на 3 месяца по проекту.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-09-07',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-blog-implementation',
    projectId: 'project-balt-pallet',
    title: 'Реализация блога',
    description: 'План на неделю 07.09-13.09: реализовать блог на сайте Балт Паллет.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-09-07',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-article-content-plan',
    projectId: 'project-balt-pallet',
    title: 'Контент план по статьям',
    description: 'План на неделю 07.09-13.09: подготовить контент-план по статьям для блога.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-09-07',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-site-usability-fixes',
    projectId: 'project-balt-pallet',
    title: 'Правки по сайту, верстке и юзабилити',
    description: 'На 31.08: добавлены усиления валидации от спама и убран Instagram с сайта.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '',
    completedAt: '2026-08-31',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-semantics-source',
    projectId: 'project-balt-pallet',
    title: 'Семантика Балт Паллет',
    description: 'Семантика Балт Паллет сделана 17.08. Источник: файл balt-pallet.ru - ся, вкладка balt-pallet_stranicy_zaprosy.',
    sourceLabel: 'Семантика',
    sourceUrl:
      'https://docs.google.com/spreadsheets/d/14iLj1IePYPPhC_GKvcQgaJXV8wTCX0OqxliMBCfJHyQ/edit?gid=1142275802#gid=1142275802',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-17',
    completedAt: '2026-08-17',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-domain',
    projectId: 'project-balt-pallet',
    title: 'Подтверждение домена',
    description: 'На 04.09: домен отклонили, ждем повторное подтверждение.',
    sourceLabel: 'чек-лист 25.08',
    sourceUrl: SEO_PLANNING_CHECKLIST_URL,
    status: 'active',
    ownerIds: ['person-alina'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-balt-domain-submitted',
        title: 'Передать домен на подтверждение вместе с клиентом',
        ownerId: 'person-alina',
        status: 'done',
        dueDate: '2026-08-27',
        completedAt: '2026-08-30',
      },
      {
        id: 'timeline-balt-domain-rejected-04-09',
        title: 'Зафиксировать отклонение подтверждения домена',
        ownerId: 'person-alina',
        status: 'done',
        dueDate: '2026-09-04',
        completedAt: '2026-09-04',
      },
      {
        id: 'timeline-balt-domain-repeat-confirmation-04-09',
        title: 'Повторно подтвердить домен',
        ownerId: 'person-alina',
        status: 'active',
        dueDate: '2026-09-15',
      },
    ],
  },
  {
    id: 'current-watch-tag-pages-feeds-schema',
    projectId: 'project-watch',
    title: 'Фильтр и теговые страницы',
    description: 'План на неделю 07.09-13.09: реализовать фильтр и теговые страницы; ЧПУ, фиды, разметка и юзабилити остаются в связке.',
    status: 'active',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-10',
    deadline: '2026-09-13',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-watch-filter-implementation-07-09',
        title: 'Реализовать фильтр',
        ownerId: 'person-outsource',
        status: 'active',
        dueDate: '2026-09-13',
      },
      {
        id: 'timeline-watch-tag-pages-implementation-07-09',
        title: 'Реализовать теговые страницы',
        ownerId: 'person-outsource',
        status: 'active',
        dueDate: '2026-09-13',
      },
    ],
  },
  {
    id: 'current-watch-new-quarter-plan',
    projectId: 'project-watch',
    title: 'Новый план работ на 3 месяца',
    description: 'План на неделю 07.09-13.09: подготовить новый план работ на 3 месяца по проекту.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-09-07',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-watch-blog-implementation',
    projectId: 'project-watch',
    title: 'Реализация блога',
    description: 'План на неделю 07.09-13.09: реализовать блог на сайте WatchStore.',
    status: 'active',
    ownerIds: ['person-outsource'],
    createdAt: '2026-09-07',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-watch-article-content-plan',
    projectId: 'project-watch',
    title: 'Контент план по статьям',
    description: 'План на неделю 07.09-13.09: подготовить контент-план по статьям для блога.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-09-07',
    deadline: '2026-09-13',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'planning-watch-domain-access-payments-2026-08-25',
    projectId: 'project-watch',
    title: 'Часы: домен и доступы',
    description: 'На 07.09 организовано подтверждение домена; доступ к почте остается в плане.',
    sourceLabel: 'чек-лист 25.08',
    sourceUrl: SEO_PLANNING_CHECKLIST_URL,
    status: 'active',
    ownerIds: ['person-alina'],
    createdAt: '2026-08-31',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-watch-domain-confirmation',
        title: 'Организовать подтверждение домена',
        ownerId: 'person-alina',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-watch-mail-access',
        title: 'Выдать доступ к почте, на которую поступают заявки',
        ownerId: 'person-alina',
        status: 'planned',
        dueDate: '',
      },
    ],
  },
  {
    id: 'planning-lombard-expenses-minimal-mode-2026-08-25',
    projectId: 'project-lombard',
    title: 'Ломбард: расходы и минимальный режим работ',
    description: 'Из чек-листа планерки 25.08. Без комментариев по прогрессу - не начинали.',
    sourceLabel: 'чек-лист 25.08',
    sourceUrl: SEO_PLANNING_CHECKLIST_URL,
    status: 'planned',
    ownerIds: ['person-alina'],
    createdAt: '2026-08-31',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-lombard-expenses-count',
        title: 'Подсчитать уже понесенные расходы по проекту',
        ownerId: 'person-alina',
        status: 'planned',
        dueDate: '',
      },
      {
        id: 'timeline-lombard-minimal-mode',
        title: 'Вести проект в минимальном режиме без дополнительного бюджета',
        ownerId: 'person-alina',
        status: 'planned',
        dueDate: '',
      },
    ],
  },
  {
    id: 'planning-dashboard-payment-cycle-2026-08-25',
    projectId: 'project-ash',
    title: 'Дашборд: цикл оплат и учет разработки',
    description: 'Из чек-листа планерки 25.08. Без комментариев по прогрессу - не начинали.',
    sourceLabel: 'чек-лист 25.08',
    sourceUrl: SEO_PLANNING_CHECKLIST_URL,
    status: 'planned',
    ownerIds: ['person-alina'],
    createdAt: '2026-08-31',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-dashboard-payment-cycle',
        title: 'Зафиксировать цикл оплаты: отчет 25-го, контроль поступления с 25-го по 30-е',
        ownerId: 'person-alina',
        status: 'planned',
        dueDate: '',
      },
      {
        id: 'timeline-dashboard-dev-accounting',
        title: 'Сделать отдельный учет разработки, если она оплачивается вне SEO-услуги',
        ownerId: 'person-alina',
        status: 'planned',
        dueDate: '',
      },
    ],
  },
  {
    id: 'planning-seo-stage-transition-2026-08-25',
    projectId: 'project-ash',
    title: 'Зафиксировать переход от базового SEO к точечной работе',
    description: 'Из чек-листа планерки 25.08. Без комментариев по прогрессу - не начинали.',
    sourceLabel: 'чек-лист 25.08',
    sourceUrl: SEO_PLANNING_CHECKLIST_URL,
    status: 'planned',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-31',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-rectop-layout-templates',
    projectId: 'project-rectop',
    title: 'Ректоп: правки по ТЗ и первый блок главной',
    description:
      'Отчет 07.09: сайт перенесен на домен до 06.09; дальше в работе внесение правок согласно ТЗ и первый блок главной.',
    sourceLabel: 'ТЗ правки',
    sourceUrl: RECTOP_CORRECTIONS_BRIEF_URL,
    status: 'active',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-10',
    deadline: '2026-09-13',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-rectop-wp-layout',
        title: 'Сайт сверстан на WP',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-rectop-corrections-brief-07-09',
        title: 'Составить ТЗ по правкам',
        ownerId: 'person-marketing',
        status: 'done',
        dueDate: '2026-09-06',
        completedAt: '2026-09-06',
      },
      {
        id: 'timeline-rectop-domain-transfer',
        title: 'Перенести сайт на домен',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-06',
        completedAt: '2026-09-06',
      },
      {
        id: 'timeline-rectop-first-block-home',
        title: 'Переверстать первый блок на главной',
        ownerId: 'person-outsource',
        status: 'active',
        dueDate: '2026-09-13',
      },
      {
        id: 'timeline-rectop-dev-finish-week',
        title: 'Внесение правок согласно ТЗ',
        ownerId: 'person-outsource',
        status: 'active',
        dueDate: '2026-09-13',
      },
    ],
  },
  {
    id: 'weekly-promteh-report-2026-08-31',
    projectId: 'project-promteh',
    title: 'Отчет на 31.08: Промтех',
    description: 'Сделано за отчетную неделю по Промтеху.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-31',
    deadline: '2026-08-31',
    completedAt: '2026-08-31',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-promteh-layout-linking-client-notes-31-08',
        title: 'Небольшие доработки по верстке, перелинковке и пожеланиям клиента',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-promteh-metrika-automation-31-08',
        title: 'Частично настроить автоматизацию выгрузки метрик для отчетов',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-promteh-new-report-format-31-08',
        title: 'Создать новый формат отчета',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-promteh-forecast-report-31-08',
        title: 'Оформить прогноз роста и приложить его к клиентскому отчету',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
    ],
  },
  {
    id: 'weekly-smartstroy-report-2026-08-31',
    projectId: 'project-smart',
    title: 'Отчет на 31.08: Смартстрой',
    description: 'Сделано за отчетную неделю по Смартстрою.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-31',
    deadline: '2026-08-31',
    completedAt: '2026-08-31',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-smartstroy-metrika-automation-31-08',
        title: 'Частично настроить автоматизацию выгрузки метрик для отчетов',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-smartstroy-new-report-format-31-08',
        title: 'Создать новый формат отчета',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
    ],
  },
  {
    id: 'weekly-aquaguard-report-2026-08-31',
    projectId: 'project-aquaguard',
    title: 'Отчет на 31.08: Аквагард',
    description: 'Сделано за отчетную неделю по Аквагарду.',
    status: 'done',
    ownerIds: ['person-aleksey', 'person-olga'],
    createdAt: '2026-08-31',
    deadline: '2026-08-31',
    completedAt: '2026-08-31',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-aquaguard-catalog-card-fixes-31-08',
        title: 'Исправить косяки после Ольги по карточкам и каталогу',
        ownerId: 'person-olga',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-aquaguard-mobile-layout-31-08',
        title: 'Исправить мобильную верстку',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-aquaguard-microdata-31-08',
        title: 'Исправить микроразметку',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-aquaguard-feed-auto-file-31-08',
        title: 'Настроить автоматическое формирование файла фида при обновлении товаров',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-aquaguard-metrika-automation-31-08',
        title: 'Частично настроить автоматизацию выгрузки метрик для отчетов',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-aquaguard-new-report-format-31-08',
        title: 'Создать новый формат отчета',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
    ],
  },
  {
    id: 'weekly-balt-pallet-report-2026-08-31',
    projectId: 'project-balt-pallet',
    title: 'Отчет на 31.08: Балт Паллет',
    description: 'Сделано за отчетную неделю по Балт Паллет.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-31',
    deadline: '2026-08-31',
    completedAt: '2026-08-31',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-balt-spam-validation-31-08',
        title: 'Добавить усиления валидации от спама',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-balt-remove-instagram-31-08',
        title: 'Убрать Instagram с сайта',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-balt-metrika-automation-31-08',
        title: 'Частично настроить автоматизацию выгрузки метрик для отчетов',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-balt-new-report-format-31-08',
        title: 'Создать новый формат отчета',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
    ],
  },
  {
    id: 'weekly-watch-report-2026-08-31',
    projectId: 'project-watch',
    title: 'Отчет на 31.08: Часы',
    description: 'Сделано за отчетную неделю по Часам.',
    status: 'done',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-31',
    deadline: '2026-08-31',
    completedAt: '2026-08-31',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-watch-cart-31-08',
        title: 'Реализовать функционал корзины',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
      {
        id: 'timeline-watch-feed-moderation-31-08',
        title: 'Внести правки для прохождения модерации товарного фида',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-08-31',
        completedAt: '2026-08-31',
      },
    ],
  },
  {
    id: 'weekly-balt-pallet-report-2026-09-07',
    projectId: 'project-balt-pallet',
    title: 'Отчет на 07.09: Балт Паллет',
    description: 'Сделано за отчетную неделю 31.08-06.09 по Балт Паллет.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-09-07',
    deadline: '2026-09-07',
    completedAt: '2026-09-07',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-balt-contacts-fixed-07-09',
        title: 'Исправить контакты',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-balt-blog-page-templates-07-09',
        title: 'Подготовить шаблоны страниц для блога',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
    ],
  },
  {
    id: 'weekly-watch-report-2026-09-07',
    projectId: 'project-watch',
    title: 'Отчет на 07.09: Часы',
    description: 'Сделано за отчетную неделю 31.08-06.09 по WatchStore.',
    status: 'done',
    ownerIds: ['person-outsource'],
    createdAt: '2026-09-07',
    deadline: '2026-09-07',
    completedAt: '2026-09-07',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-watch-product-params-matrix-07-09',
        title: 'Подготовить матрицу параметров для товаров',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-watch-header-menu-template-07-09',
        title: 'Подготовить правки по хедеру и меню',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-watch-footer-template-07-09',
        title: 'Подготовить правки по футеру',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-watch-breadcrumbs-template-07-09',
        title: 'Подготовить правки по хлебным крошкам',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-watch-product-cards-template-07-09',
        title: 'Подготовить правки по карточкам товаров',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-watch-404-template-07-09',
        title: 'Подготовить правки по 404 странице',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-watch-contacts-template-07-09',
        title: 'Подготовить правки по контактам',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-watch-internal-linking-blocks-07-09',
        title: 'Подготовить правки по блокам перелинковки',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
    ],
  },
  {
    id: 'weekly-smartstroy-report-2026-09-07',
    projectId: 'project-smart',
    title: 'Отчет на 07.09: Смартстрой',
    description: 'Сделано за отчетную неделю 31.08-06.09 по Смартстрою.',
    status: 'done',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-09-07',
    deadline: '2026-09-07',
    completedAt: '2026-09-07',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-smartstroy-missing-project-prices-07-09',
        title: 'Добавить цены недостающим проектам',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-smartstroy-missing-project-layouts-07-09',
        title: 'Добавить планировки недостающим проектам',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
    ],
  },
  {
    id: 'weekly-aquaguard-report-2026-09-07',
    projectId: 'project-aquaguard',
    title: 'Отчет на 07.09: Аквагард',
    description: 'Сделано за отчетную неделю 31.08-06.09 по Аквагарду.',
    status: 'done',
    ownerIds: ['person-aleksey', 'person-olga'],
    createdAt: '2026-09-07',
    deadline: '2026-09-07',
    completedAt: '2026-09-07',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-aquaguard-yandex-products-moderation-07-09',
        title: 'Провести модерацию на Яндекс Товарах',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-aquaguard-product-feed-validation-07-09',
        title: 'Проверить валидацию товарного фида',
        ownerId: 'person-aleksey',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-aquaguard-product-card-fixes-07-09',
        title: 'Внести правки по карточкам',
        ownerId: 'person-olga',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
      {
        id: 'timeline-aquaguard-catalog-fixes-07-09',
        title: 'Внести правки по каталогу',
        ownerId: 'person-olga',
        status: 'done',
        dueDate: '2026-09-07',
        completedAt: '2026-09-07',
      },
    ],
  },
  {
    id: 'report-watchstore-2026-08',
    projectId: 'project-watch',
    title: 'Сбор отчета за август: WatchStore',
    description: 'Отчет за август закрыт в недельном отчете на 31.08.',
    status: 'done',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    completedAt: '2026-08-31',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-aquaguard-2026-08',
    projectId: 'project-aquaguard',
    title: 'Сбор отчета за август: Аквагард',
    description: 'Отчет за август закрыт в недельном отчете на 31.08.',
    status: 'done',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    completedAt: '2026-08-31',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-promteh-2026-08',
    projectId: 'project-promteh',
    title: 'Сбор отчета за август: Макулатура + прогноз',
    description: 'Отчет за август и новый формат отчета закрыты в недельном отчете на 31.08.',
    status: 'done',
    ownerIds: ['person-kristina', 'person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    completedAt: '2026-08-31',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-smartstroy-2026-08',
    projectId: 'project-smart',
    title: 'Сбор отчета за август: СмартСтрой',
    description: 'Отчет за август закрыт в недельном отчете на 31.08.',
    status: 'done',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    completedAt: '2026-08-31',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-balt-pallet-2026-08',
    projectId: 'project-balt-pallet',
    title: 'Сбор отчета за август: Паллет',
    description: 'Отчет за август закрыт в недельном отчете на 31.08.',
    status: 'done',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    completedAt: '2026-08-31',
    timelineEnabled: false,
    timeline: [],
  },
];

const requiredTaskSeedById = new Map(requiredTaskSeeds.map((task) => [task.id, task]));

const initialTasks: Task[] = requiredTaskSeeds.map((task) => ensureTaskDefaults(task));

const navItems = [
  { id: 'admin' as const, label: 'Админка', icon: SlidersHorizontal },
  { id: 'seo' as const, label: 'SEO-проекты', icon: Target },
  { id: 'payments' as const, label: 'Оплаты', icon: CreditCard },
  { id: 'report' as const, label: 'Отчет', icon: FileSpreadsheet },
  { id: 'external' as const, label: 'Сторонние проекты', icon: FileText },
];

const externalStatusLabels: Record<ExternalProjectSection['status'], string> = {
  active: 'в работе',
  done: 'готово',
  waiting: 'ожидание',
  next: 'следующий шаг',
};

const externalFolderArtByStatus: Record<ExternalProjectSection['status'], string> = {
  active: './folders/folder-teal.png',
  done: './folders/folder-teal.png',
  waiting: './folders/folder-peach.png',
  next: './folders/folder-peach.png',
};

const externalTimelineStatusLabels: Record<ExternalTimelineItem['status'], string> = {
  active: 'в работе',
  done: 'готово',
  planned: 'план',
  waiting: 'ожидание',
};

const externalAssetKindLabels: Record<ExternalProjectAsset['kind'], string> = {
  file: 'файл',
  link: 'ссылка',
  photo: 'фото',
};

type ExternalProjectAdditions = Record<
  string,
  {
    budgetLines: ExternalBudgetLine[];
    assets: ExternalProjectAsset[];
    weeklyUpdates: ExternalWeeklyUpdate[];
  }
>;

type ExternalBudgetDraft = {
  label: string;
  amountLabel: string;
};

type ExternalAssetDraft = {
  title: string;
  url: string;
  kind: ExternalProjectAsset['kind'];
};

type ExternalWeeklyDraft = {
  weekLabel: string;
  title: string;
  status: ExternalTimelineItem['status'];
};

type WeekWindow = {
  start: string;
  end: string;
};

type TaskTimingInfo = {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
  lateDays: number;
};

type TaskLogicTrailStep = {
  id: string;
  date: string;
  title: string;
  meta: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
};

type WeeklyReportItem = {
  id: string;
  taskId?: string;
  title: string;
  meta: string;
  projectName?: string;
  ownerLabel?: string;
  description?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  createdAt?: string;
  deadline?: string;
  completedAt?: string;
  deadlineNote?: string;
  timingLabel?: string;
  lateDays?: number;
  timelineProgress?: string;
  timelineItems?: TimelineItem[];
  logicTrail?: TaskLogicTrailStep[];
  date?: string;
  statusLabel?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
};

type ReportDrilldownState = {
  projectId: string;
  filter: TaskReportFilter;
  title?: string;
  items?: WeeklyReportItem[];
};

type TaskReportSnapshotItem = {
  taskId: string;
  projectId: string;
  title: string;
  status: Status;
  ownerIds: string[];
  deadline: string;
  completedAt?: string;
  createdAt: string;
  open: boolean;
  timelineDone: number;
  timelineTotal: number;
};

type TaskReportSnapshot = {
  id: string;
  reportDate: string;
  capturedAt: string;
  source: 'dashboard' | 'inferred';
  taskCount: number;
  bitrixTaskCount: number;
  tasks: TaskReportSnapshotItem[];
};

type WeeklyProjectTaskSummary = {
  total: number;
  done: number;
  open: number;
  planned: number;
  active: number;
  risk: number;
  overdue: number;
  lateDone: number;
  withoutDeadline: number;
  completionPercent: number;
  itemsByFilter: Record<TaskReportFilter, WeeklyReportItem[]>;
};

type WeeklyTaskTrendPoint = {
  start: string;
  label: string;
  created: number;
  completed: number;
  deadline: number;
  closedByWeekEnd: number;
  onTime: number;
  notClosed: number;
  completionPercent: number;
};

type WeeklyProjectReport = {
  id: string;
  title: string;
  color: string;
  done: WeeklyReportItem[];
  late: WeeklyReportItem[];
  planned: WeeklyReportItem[];
  summary?: WeeklyProjectTaskSummary;
  trend?: WeeklyTaskTrendPoint[];
};

type ProjectTaskScore = {
  score: number;
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
  total: number;
  completionPercent: number;
  currentOverduePercent: number;
  lateDonePercent: number;
  carriedPercent: number;
  riskPercent: number;
  deadlineFilledPercent: number;
  done: number;
  overdue: number;
  lateDone: number;
  carried: number;
  stuck: number;
  risk: number;
  withoutDeadline: number;
  signals: string[];
  itemsByMetric: Record<TaskScoreMetric, WeeklyReportItem[]>;
};

type TaskLogicReport = {
  id: string;
  title: string;
  color: string;
  score: ProjectTaskScore;
  hasSavedHistory: boolean;
  currentSnapshotDate: string;
  previousSnapshotDate: string;
  itemsByCategory: Record<TaskLogicCategory, WeeklyReportItem[]>;
};

type WeeklyReportArchiveFolder = {
  start: string;
  title: string;
  rangeLabel: string;
  seoDone: number;
  seoLate: number;
  seoPlanned: number;
  externalDone: number;
  externalLate: number;
  externalPlanned: number;
};

type AnalyticsDateRange = {
  start: string;
  end: string;
};

type AnalyticsSeriesPoint = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  value: number;
  secondary?: number;
};

type AnalyticsMarker = {
  date: string;
  title: string;
  kind: string;
  sourceUrl?: string;
};

type SeoKpiCardModel = {
  title: string;
  value: string;
  meta: string;
  deltaLabel: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning';
  statusLabel: string;
  icon: 'leaf' | 'users' | 'target' | 'funnel';
};

type SeoImpactRow = {
  id: string;
  label: string;
  visits: number | null;
  previousVisits: number | null;
  change: number | null;
  conversionVisits: number | null;
  cr: number | null;
  note: string;
};

const METRIKA_QUERY_EXPORT_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzDWHp58G5bsDAKmGFgKd3YKeUiH98fIlLUTULMaWWxangIq8dx8DctYydQ9aVDn2wnoA/exec';
const METRIKA_QUERY_EXPORT_ROW_LIMIT = 20000;
const METRIKA_LIVE_STATS_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzJ7wCwKnKM9jRrsGEaQaiZBRhTucqyrqqVSP-k-04yt2P1mqA434a_sEKMmNTDMnV3Xw/exec';
const METRIKA_SAVED_STATS_URL = './data/metrika-stats.json';

type MetrikaStatsLoadMode = 'live' | 'saved';
type JsonpCallbackWindow = Window &
  typeof globalThis &
  Record<string, ((payload: unknown) => void) | undefined>;

type Bitrix24ProjectTask = Bitrix24Snapshot['tasks'][number];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function fetchSavedMetrikaStats() {
  const response = await fetch(`${METRIKA_SAVED_STATS_URL}?cacheBust=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('сохраненные данные Метрики не загрузились');
  return response.json();
}

function fetchMetrikaLiveStats() {
  if (!METRIKA_LIVE_STATS_ENDPOINT) return Promise.resolve(null);

  return new Promise<unknown>((resolve, reject) => {
    const callbackName = `__taskSeoMetrikaLive_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const callbackWindow = window as JsonpCallbackWindow;
    const script = document.createElement('script');
    const separator = METRIKA_LIVE_STATS_ENDPOINT.includes('?') ? '&' : '?';
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Метрика не ответила вовремя'));
    }, 30000);

    function cleanup() {
      window.clearTimeout(timeout);
      script.remove();
      delete callbackWindow[callbackName];
    }

    callbackWindow[callbackName] = (payload: unknown) => {
      cleanup();
      resolve(payload);
    };

    script.src = `${METRIKA_LIVE_STATS_ENDPOINT}${separator}callback=${encodeURIComponent(
      callbackName,
    )}&cacheBust=${Date.now()}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('не удалось обратиться к live-прокси Метрики'));
    };
    document.head.append(script);
  });
}

function todayIso() {
  return toLocalIso(new Date());
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value: string) {
  if (!value) return 'без даты';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value: string) {
  if (!value) return 'без даты';
  const normalized = value.includes('T') ? value : `${value}T12:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return 'без даты';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function daysBetweenIso(start: string, end: string) {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
}

function getTimingInfo(status: Status, deadline: string, completedAt?: string, today = todayIso()): TaskTimingInfo {
  if (!deadline) {
    return {
      label: status === 'done' ? 'Выполнено · дата дедлайна не указана' : 'Без дедлайна',
      tone: status === 'done' ? 'success' : 'warning',
      lateDays: 0,
    };
  }

  if (status === 'done') {
    if (!completedAt) {
      return {
        label: 'Выполнено · дата факта не указана',
        tone: 'warning',
        lateDays: 0,
      };
    }

    if (completedAt <= deadline) {
      return {
        label: 'Выполнено в срок',
        tone: 'success',
        lateDays: 0,
      };
    }

    const lateDays = daysBetweenIso(deadline, completedAt);
    return {
      label: `Выполнено позже на ${lateDays} дн.`,
      tone: 'danger',
      lateDays,
    };
  }

  if (deadline < today) {
    const lateDays = daysBetweenIso(deadline, today);
    return {
      label: `Просрочено на ${lateDays} дн.`,
      tone: 'danger',
      lateDays,
    };
  }

  if (deadline === today) {
    return {
      label: 'Срок сегодня',
      tone: 'warning',
      lateDays: 0,
    };
  }

  return {
    label: 'Срок не наступил',
    tone: status === 'risk' ? 'warning' : 'info',
    lateDays: 0,
  };
}

function getTaskTimelineProgress(task: Task) {
  if (!task.timelineEnabled || task.timeline.length === 0) return 'нет подзадач';
  const done = task.timeline.filter((item) => item.status === 'done').length;
  return `${done}/${task.timeline.length} этапов`;
}

function getTaskDeadlineNote(task: Task) {
  return getTaskHistory(task).some((entry) => entry.action === 'Автодедлайн')
    ? 'автодедлайн: 7 рабочих дней после постановки'
    : undefined;
}

function isCountableTask(task: Task) {
  return !isWeeklyReportTask(task);
}

function normalizeProjectName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactExternalText(value: string, limit = 220) {
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

function getProjectSearchAliases(projectName: string) {
  const normalized = normalizeSearchText(projectName);
  const aliases = new Set([normalized]);

  if (normalized.includes('аквагард')) aliases.add('aquaguard');
  if (normalized.includes('промтех')) {
    aliases.add('промтехмакулатура');
    aliases.add('макулатура');
  }
  if (normalized.includes('смартстрой')) {
    aliases.add('смартстрой');
    aliases.add('smartstroy');
    aliases.add('smart build');
    aliases.add('смартбилд');
  }
  if (normalized.includes('балт') || normalized.includes('pallet')) {
    aliases.add('балт паллет');
    aliases.add('balt pallet');
    aliases.add('balt-pallet');
    aliases.add('паллет');
  }
  if (normalized.includes('часы')) {
    aliases.add('watchstore');
    aliases.add('watchstoree');
  }
  if (normalized.includes('аш')) {
    aliases.add('автошколы');
    aliases.add('автоправо');
    aliases.add('автосити');
  }
  if (normalized.includes('ректоп')) aliases.add('rectop');
  if (normalized.includes('ломбард')) aliases.add('ломбард банка');
  if (normalized.includes('профскиллс')) aliases.add('profskills');
  if (normalized.includes('свич')) aliases.add('switch');

  return [...aliases].filter(Boolean);
}

function isBitrix24TaskDone(task: Bitrix24ProjectTask) {
  const statusLabel = normalizeSearchText(task.statusLabel);
  return task.status === '5' || statusLabel === 'готово' || statusLabel.includes('заверш');
}

function getBitrixTaskIso(value: string) {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value.slice(0, 10);
}

function isBitrix24TaskOverdue(task: Bitrix24ProjectTask, today = todayIso()) {
  const deadline = getBitrixTaskIso(task.deadline);
  return !isBitrix24TaskDone(task) && Boolean(deadline) && deadline < today;
}

function isBitrix24TaskLateDone(task: Bitrix24ProjectTask) {
  const deadline = getBitrixTaskIso(task.deadline);
  const closedDate = getBitrixTaskIso(task.closedDate);
  return isBitrix24TaskDone(task) && Boolean(deadline) && Boolean(closedDate) && closedDate > deadline;
}

function bitrixTaskMatchesProject(task: Bitrix24ProjectTask, project: Project) {
  const haystack = normalizeSearchText(
    [task.title, task.description, task.groupName, task.responsibleName, task.creatorName].filter(Boolean).join(' '),
  );
  if (!haystack) return false;
  return getProjectSearchAliases(project.name).some((alias) => alias && haystack.includes(normalizeSearchText(alias)));
}

function bitrixTaskMatchesFilter(task: Bitrix24ProjectTask, filter: TaskReportFilter, today = todayIso()) {
  const done = isBitrix24TaskDone(task);
  const statusLabel = normalizeSearchText(task.statusLabel);
  const deadline = getBitrixTaskIso(task.deadline);

  if (filter === 'done') return done;
  if (filter === 'lateDone') return isBitrix24TaskLateDone(task);
  if (filter === 'open') return !done;
  if (filter === 'overdue') return isBitrix24TaskOverdue(task, today);
  if (filter === 'withoutDeadline') return !done && !deadline;
  if (filter === 'active') return !done && (task.status === '3' || statusLabel.includes('работ'));
  if (filter === 'planned') return !done && (task.status === '1' || task.status === '2' || statusLabel.includes('план'));
  if (filter === 'risk') return !done && statusLabel.includes('риск');
  return true;
}

function getDays(count = 14) {
  return Array.from({ length: count }, (_, index) => addDaysIso(index));
}

function toLocalIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekWindow(offset = 0): WeekWindow {
  const now = new Date();
  const weekday = now.getDay() || 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekday + 1 + offset * 7);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return {
    start: toLocalIso(start),
    end: toLocalIso(end),
  };
}

function addDaysToIso(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalIso(date);
}

function addBusinessDaysToIso(value: string, businessDays: number) {
  const date = new Date(`${value || todayIso()}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  let added = 0;

  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) added += 1;
  }

  return toLocalIso(date);
}

function getDefaultTaskDeadline(createdAt: string) {
  return addBusinessDaysToIso(createdAt || todayIso(), 7);
}

function getWeekWindowFromIso(startIso: string): WeekWindow {
  return {
    start: startIso,
    end: addDaysToIso(startIso, 6),
  };
}

function getWeekStartIso(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  return toLocalIso(date);
}

function isIsoInWindow(value: string | undefined, window: WeekWindow) {
  if (!value) return false;
  return value >= window.start && value <= window.end;
}

function formatWeekWindow(window: WeekWindow) {
  return `${formatDate(window.start)} - ${formatDate(window.end)}`;
}

function formatNumericDate(value: string) {
  if (!value) return 'без даты';
  const [, month, day] = value.split('-');
  return `${day}.${month}`;
}

function formatReportArchiveTitle(window: WeekWindow) {
  return `Отчет за ${formatNumericDate(window.start)}-${formatNumericDate(window.end)}`;
}

function getGoalQueryRows(goalAnalytics: PromotionGoalAnalytics | undefined): PromotionGoalQueryStat[] {
  if (!goalAnalytics) return [];
  return goalAnalytics.queries?.length ? goalAnalytics.queries : goalAnalytics.topQueries;
}

function mergePromotionQueryRows(sources: PromotionResultSource[]) {
  const rowsByQuery = new Map<string, PromotionGoalQueryStat>();

  sources.forEach((source) => {
    getGoalQueryRows(source.goalAnalytics).forEach((row) => {
      const query = row.query.trim();
      const key = normalizeSearchText(query);
      if (!query || !key) return;
      const current = rowsByQuery.get(key) ?? { query, visits: 0, goals: 0 };
      current.visits += row.visits;
      current.goals += row.goals;
      rowsByQuery.set(key, current);
    });
  });

  return [...rowsByQuery.values()];
}

function getQueryGoalRate(query: PromotionGoalQueryStat) {
  return query.visits > 0 ? (query.goals / query.visits) * 100 : null;
}

function isValidIsoDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
}

function formatPercentValue(value: number, digits = 0) {
  return `${new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)}%`;
}

function formatConversionRate(value: number | null) {
  if (value === null) return '—';
  return `${new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)}%`;
}

function formatInputRange(range: AnalyticsDateRange) {
  return `${formatNumericDate(range.start)}-${formatNumericDate(range.end)}`;
}

function addMonthsToIso(value: string, months: number) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setMonth(date.getMonth() + months);
  return toLocalIso(date);
}

function addYearsToIso(value: string, years: number) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setFullYear(date.getFullYear() + years);
  return toLocalIso(date);
}

function sortGoalPoints(points: PromotionGoalTrendPoint[]) {
  return points
    .filter((point) => isValidIsoDate(point.date))
    .sort((left, right) => String(left.date).localeCompare(String(right.date)));
}

function getLatestAnalyticsDate(goalAnalytics?: PromotionGoalAnalytics, leadAnalytics?: LeadAnalyticsSummary) {
  const dates = [
    ...(goalAnalytics?.daily ?? []).map((point) => point.date ?? ''),
    ...(leadAnalytics?.daily ?? []).map((point) => point.period),
  ].filter(isValidIsoDate);
  return dates.sort().at(-1) ?? todayIso();
}

function resolveSeoDateRange(preset: SeoPeriodPreset, customRange: AnalyticsDateRange, sourceEndDate: string) {
  if (preset === 'custom' && isValidIsoDate(customRange.start) && isValidIsoDate(customRange.end)) {
    return customRange.start <= customRange.end
      ? customRange
      : { start: customRange.end, end: customRange.start };
  }

  const end = isValidIsoDate(sourceEndDate) ? sourceEndDate : todayIso();
  if (preset === '3m') return { start: addDaysToIso(addMonthsToIso(end, -3), 1), end };
  if (preset === '6m') return { start: addDaysToIso(addMonthsToIso(end, -6), 1), end };
  return { start: addDaysToIso(end, -29), end };
}

function resolveSeoCompareRange(mode: SeoCompareMode, range: AnalyticsDateRange, customRange: AnalyticsDateRange) {
  if (mode === 'none') return undefined;
  if (mode === 'custom' && isValidIsoDate(customRange.start) && isValidIsoDate(customRange.end)) {
    return customRange.start <= customRange.end
      ? customRange
      : { start: customRange.end, end: customRange.start };
  }
  if (mode === 'lastYear') {
    return {
      start: addYearsToIso(range.start, -1),
      end: addYearsToIso(range.end, -1),
    };
  }

  const periodDays = daysBetweenIso(range.start, range.end) + 1;
  const end = addDaysToIso(range.start, -1);
  return {
    start: addDaysToIso(end, -periodDays + 1),
    end,
  };
}

function filterGoalDailyPoints(goalAnalytics: PromotionGoalAnalytics | undefined, range: AnalyticsDateRange) {
  return sortGoalPoints(goalAnalytics?.daily ?? []).filter(
    (point) => point.date && point.date >= range.start && point.date <= range.end,
  );
}

function getSeriesKey(dateIso: string, mode: SeoTrendMode) {
  if (mode === 'daily') return dateIso;
  if (mode === 'monthly') return dateIso.slice(0, 7);
  return getWeekStartIso(dateIso);
}

function getSeriesLabel(key: string, mode: SeoTrendMode) {
  if (mode === 'daily') return formatNumericDate(key);
  if (mode === 'monthly') {
    const month = Number(key.slice(5, 7));
    return month ? ruMonthNames[month - 1] ?? key : key;
  }
  return formatNumericDate(key);
}

function buildGoalSeries(points: PromotionGoalTrendPoint[], mode: SeoTrendMode, metric: 'visits' | 'goals') {
  const map = new Map<string, AnalyticsSeriesPoint>();
  points.forEach((point) => {
    const date = point.date ?? '';
    if (!isValidIsoDate(date)) return;
    const key = getSeriesKey(date, mode);
    const current =
      map.get(key) ??
      ({
        key,
        label: getSeriesLabel(key, mode),
        startDate: date,
        endDate: date,
        value: 0,
        secondary: 0,
      } satisfies AnalyticsSeriesPoint);
    current.startDate = current.startDate < date ? current.startDate : date;
    current.endDate = current.endDate > date ? current.endDate : date;
    current.value += point[metric];
    current.secondary = (current.secondary ?? 0) + (metric === 'goals' ? point.visits : point.goals);
    map.set(key, current);
  });

  return Array.from(map.values())
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .map((point) => ({
      ...point,
      label: mode === 'weekly' ? `${formatNumericDate(point.startDate)}-${formatNumericDate(point.endDate)}` : point.label,
    }));
}

function filterLeadDailyPoints(leadAnalytics: LeadAnalyticsSummary | undefined, range: AnalyticsDateRange) {
  return (leadAnalytics?.daily ?? [])
    .filter((point) => isValidIsoDate(point.period) && point.period >= range.start && point.period <= range.end)
    .sort((left, right) => left.period.localeCompare(right.period));
}

function buildLeadSeries(points: LeadTrendPoint[], mode: SeoTrendMode, metric: SeoLeadMetricMode) {
  const map = new Map<string, AnalyticsSeriesPoint>();
  points.forEach((point) => {
    const date = point.period;
    if (!isValidIsoDate(date)) return;
    const key = getSeriesKey(date, mode);
    const current =
      map.get(key) ??
      ({
        key,
        label: getSeriesLabel(key, mode),
        startDate: date,
        endDate: date,
        value: 0,
        secondary: 0,
      } satisfies AnalyticsSeriesPoint);
    current.startDate = current.startDate < date ? current.startDate : date;
    current.endDate = current.endDate > date ? current.endDate : date;
    current.value += metric === 'target' ? point.quality : point.leads;
    current.secondary = (current.secondary ?? 0) + point.quality;
    map.set(key, current);
  });

  return Array.from(map.values())
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .map((point) => ({
      ...point,
      label: mode === 'weekly' ? `${formatNumericDate(point.startDate)}-${formatNumericDate(point.endDate)}` : point.label,
    }));
}

function buildConversionSeries(visitSeries: AnalyticsSeriesPoint[], leadSeries: AnalyticsSeriesPoint[]) {
  const leadsByKey = new Map(leadSeries.map((point) => [point.key, point.value]));
  return visitSeries.map((point) => {
    const leads = leadsByKey.get(point.key) ?? 0;
    const rate = point.value > 0 ? (leads / point.value) * 100 : 0;
    return {
      ...point,
      value: rate,
      secondary: point.value,
    };
  });
}

function sumSeries(points: AnalyticsSeriesPoint[]) {
  return points.reduce((total, point) => total + point.value, 0);
}

function getSeriesRate(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

function getDeltaLabel(current: number | null, previous: number | null, options: { percentPoint?: boolean } = {}) {
  if (current === null) return { label: 'нет данных', tone: 'neutral' as const };
  if (previous === null) return { label: 'нет базы сравнения', tone: 'neutral' as const };
  const diff = current - previous;
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  const absolute = Math.abs(diff);
  const formattedAbsolute = options.percentPoint
    ? `${sign}${absolute.toFixed(2).replace('.', ',')} п. п.`
    : `${sign}${formatInteger(Math.round(absolute))}`;
  if (previous === 0) {
    return {
      label: `${formattedAbsolute} · нет базы для %`,
      tone: diff >= 0 ? ('positive' as const) : ('negative' as const),
    };
  }
  const percent = Math.abs((diff / previous) * 100);
  return {
    label: `${formattedAbsolute} · ${sign}${formatPercentValue(percent, 0)}`,
    tone: diff > 0 ? ('positive' as const) : diff < 0 ? ('negative' as const) : ('neutral' as const),
  };
}

function getAnalyticsMarkers(tasks: Task[], range: AnalyticsDateRange) {
  const markers: AnalyticsMarker[] = [];
  tasks.forEach((task) => {
    if (task.completedAt && task.completedAt >= range.start && task.completedAt <= range.end) {
      markers.push({
        date: task.completedAt,
        title: task.title,
        kind: task.sourceLabel || 'задача',
        sourceUrl: task.sourceUrl,
      });
    }
    task.timeline.forEach((item) => {
      if (item.completedAt && item.completedAt >= range.start && item.completedAt <= range.end) {
        markers.push({
          date: item.completedAt,
          title: item.title,
          kind: 'этап',
          sourceUrl: task.sourceUrl,
        });
      }
    });
  });

  return markers
    .sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title))
    .slice(0, 12);
}

function getLeadDataIssue(leadAnalytics: LeadAnalyticsSummary | undefined, leadPoints: LeadTrendPoint[]) {
  if (!leadAnalytics) return 'данные по заявкам не загружены';
  if (leadAnalytics.total > 0 && leadPoints.length === 0) {
    return `нельзя построить динамику: у ${leadAnalytics.total} обращений не распознана дата`;
  }
  if (leadAnalytics.unknown > 0) return `${leadAnalytics.unknown} обращений без понятного статуса качества`;
  return '';
}

function downloadCsv(filename: string, rows: SeoImpactRow[]) {
  const headers = ['Показатель', 'Визиты', 'Ранее', 'Изменение', 'Конв. визиты', 'CR', 'Ограничение'];
  const escapeCell = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escapeCell).join(';'),
    ...rows.map((row) =>
      [
        row.label,
        row.visits,
        row.previousVisits,
        row.change,
        row.conversionVisits,
        row.cr === null ? '' : `${row.cr.toFixed(2)}%`,
        row.note,
      ]
        .map(escapeCell)
        .join(';'),
    ),
  ].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sanitizeExportText(value: string | number | null | undefined) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function slugifyFilePart(value: string) {
  return normalizeSearchText(value).replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'seo-project';
}

function downloadMetrikaQueriesCsv(project: Project, rows: PromotionGoalQueryStat[], source?: PromotionResultSource) {
  const headers = ['Проект', 'Источник', 'Период', 'Запрос', 'Переходы', 'Достижения целей', 'CR'];
  const escapeCell = (value: string | number | null) => `"${sanitizeExportText(value).replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escapeCell).join(';'),
    ...rows.map((row) =>
      [
        project.name,
        source?.spreadsheetTitle ?? 'Яндекс Метрика',
        source?.periodLabel ?? '',
        row.query,
        row.visits,
        row.goals,
        getQueryGoalRate(row) === null ? '' : `${(getQueryGoalRate(row) ?? 0).toFixed(2)}%`,
      ]
        .map(escapeCell)
        .join(';'),
    ),
  ].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `metrika-queries-${slugifyFilePart(project.name)}-${todayIso()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function submitMetrikaQueriesExport(project: Project, rows: PromotionGoalQueryStat[], source?: PromotionResultSource) {
  const preparedRows = rows.slice(0, METRIKA_QUERY_EXPORT_ROW_LIMIT).map((row) => ({
    query: row.query,
    visits: row.visits,
    goals: row.goals,
    cr: getQueryGoalRate(row) === null ? 0 : (getQueryGoalRate(row) ?? 0) / 100,
  }));

  if (!METRIKA_QUERY_EXPORT_ENDPOINT) {
    downloadMetrikaQueriesCsv(project, preparedRows, source);
    return 'fallback' as const;
  }

  const form = document.createElement('form');
  const payload = document.createElement('input');
  payload.type = 'hidden';
  payload.name = 'payload';
  payload.value = JSON.stringify({
    projectName: project.name,
    sourceTitle: source?.spreadsheetTitle ?? 'Яндекс Метрика',
    periodLabel: source?.periodLabel ?? '',
    generatedAt: new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }),
    rows: preparedRows,
  });
  form.method = 'POST';
  form.action = METRIKA_QUERY_EXPORT_ENDPOINT;
  form.target = '_blank';
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';
  form.append(payload);
  document.body.append(form);
  form.submit();
  form.remove();
  return 'ready' as const;
}

function isWeeklyReportTask(task: Task) {
  const title = task.title.trim().toLowerCase();
  return task.id.startsWith('weekly-') || title.startsWith('отчет на');
}

function parseShortRuDateLabel(value: string) {
  const match = value.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/);
  if (!match) return '';
  const currentYear = new Date().getFullYear();
  const yearPart = match[3] ? Number(match[3]) : currentYear;
  const year = yearPart < 100 ? 2000 + yearPart : yearPart;
  const month = Number(match[2]);
  const day = Number(match[1]);
  if (!day || !month || month > 12) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getMonthKeyFromParts(year: number, monthNo: number) {
  if (!year || !monthNo || monthNo < 1 || monthNo > 12) return '';
  return `${year}-${String(monthNo).padStart(2, '0')}`;
}

function getRelativeMonthKey(offset = 0) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return getMonthKeyFromParts(date.getFullYear(), date.getMonth() + 1);
}

function getMonthLabelFromKey(key: string) {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return 'без месяца';
  return `${ruMonthNames[month - 1] ?? 'месяц'} ${year}`.replace(/^./, (letter) => letter.toUpperCase());
}

function parseMonthKeyFromLabel(value: string) {
  const normalized = value.trim().toLowerCase().replace(/ё/g, 'е');
  if (!normalized) return '';

  const isoMatch = normalized.match(/(20\d{2})-(\d{1,2})/);
  if (isoMatch) return getMonthKeyFromParts(Number(isoMatch[1]), Number(isoMatch[2]));

  const shortDate = parseShortRuDateLabel(normalized);
  if (shortDate) return shortDate.slice(0, 7);

  const yearMatch = normalized.match(/(20\d{2})/);
  const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
  const monthIndex = ruMonthNames.findIndex((month) => normalized.includes(month.replace(/ё/g, 'е')));
  return monthIndex >= 0 ? getMonthKeyFromParts(year, monthIndex + 1) : '';
}

function getPaymentRowMonthKey(row: PaymentRow) {
  if (row.dueDate) return row.dueDate.slice(0, 7);
  return parseMonthKeyFromLabel(row.periodLabel);
}

function getPaymentCashflowMonthKey(row: PaymentCashflowRow) {
  return parseMonthKeyFromLabel(row.periodLabel) || getMonthKeyFromParts(new Date().getFullYear(), row.monthNo);
}

function getLinkPurchaseMonthKey(row: LinkPurchase) {
  const purchaseDate = parseShortRuDateLabel(row.purchaseDate);
  if (purchaseDate) return purchaseDate.slice(0, 7);
  const deadline = parseShortRuDateLabel(row.deadline);
  if (deadline) return deadline.slice(0, 7);
  return getMonthKeyFromParts(new Date().getFullYear(), row.monthNo) || parseMonthKeyFromLabel(row.month);
}

function createPaymentMonthlySummary(key: string): PaymentMonthlySummary {
  return {
    key,
    label: getMonthLabelFromKey(key),
    planIncome: 0,
    factIncome: 0,
    serviceExpenseAmount: 0,
    linkExpenseAmount: 0,
    totalExpenseAmount: 0,
    netAmount: 0,
    paymentCount: 0,
    factRowCount: 0,
    linkCount: 0,
    projectNames: new Set(),
  };
}

function getPaymentMonthlyEntry(map: Map<string, PaymentMonthlySummary>, key: string) {
  if (!map.has(key)) map.set(key, createPaymentMonthlySummary(key));
  return map.get(key);
}

function buildPaymentMonthlySummaries(
  paymentRows: PaymentRow[],
  cashflowRows: PaymentCashflowRow[],
  linkRows: LinkPurchase[],
  projects: Project[],
) {
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
  const map = new Map<string, PaymentMonthlySummary>();
  const cashflowProjectMonths = new Set<string>();

  cashflowRows.forEach((row) => {
    const key = getPaymentCashflowMonthKey(row);
    if (!key) return;
    const entry = getPaymentMonthlyEntry(map, key);
    if (!entry) return;
    const projectName = row.projectName || row.client;
    cashflowProjectMonths.add(`${key}:${normalizeProjectName(projectName)}`);
    entry.factIncome += row.incomeAmount;
    entry.serviceExpenseAmount += row.totalExpenseAmount;
    entry.factRowCount += 1;
    entry.projectNames.add(projectName);
  });

  paymentRows.forEach((row) => {
    const key = getPaymentRowMonthKey(row);
    if (!key) return;
    const entry = getPaymentMonthlyEntry(map, key);
    if (!entry) return;
    const projectName = projectNameById.get(row.projectId) ?? row.projectId;
    const hasCashflowFact = cashflowProjectMonths.has(`${key}:${normalizeProjectName(projectName)}`);
    entry.planIncome += row.clientAmount;
    entry.paymentCount += 1;
    entry.projectNames.add(projectName);

    if (row.status === 'paid' && !hasCashflowFact) {
      entry.factIncome += row.clientAmount;
    }

    if (row.kind === 'outsource' && !hasCashflowFact) {
      entry.serviceExpenseAmount += row.outsourceAmount;
    }
  });

  linkRows.forEach((row) => {
    const key = getLinkPurchaseMonthKey(row);
    if (!key || row.factCost === 0) return;
    const entry = getPaymentMonthlyEntry(map, key);
    if (!entry) return;
    entry.linkExpenseAmount += row.factCost;
    entry.linkCount += 1;
    entry.projectNames.add(row.projectName);
  });

  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      totalExpenseAmount: entry.serviceExpenseAmount + entry.linkExpenseAmount,
      netAmount: entry.factIncome - entry.serviceExpenseAmount - entry.linkExpenseAmount,
    }))
    .sort((left, right) => right.key.localeCompare(left.key));
}

function ensureMonthSummary(months: PaymentMonthlySummary[], key: string) {
  return months.find((month) => month.key === key) ?? createPaymentMonthlySummary(key);
}

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function buildTimeline(taskTitle: string, ownerIds: string[], deadline: string): TimelineItem[] {
  return ownerIds.map((ownerId, index) => ({
    id: uid('timeline'),
    title: ownerIds.length > 1 ? `${taskTitle}: часть ${index + 1}` : `Контроль выполнения: ${taskTitle}`,
    ownerId,
    status: index === 0 ? 'active' : 'planned',
    dueDate: deadline,
  }));
}

function makeTaskHistoryEntry(action: string, summary: string, changes: TaskHistoryChange[] = []): TaskHistoryEntry {
  return {
    id: uid('history'),
    changedAt: new Date().toISOString(),
    action,
    summary,
    changes,
  };
}

function getTaskHistory(task: Task): TaskHistoryEntry[] {
  return Array.isArray(task.history) ? task.history : [];
}

function addTaskHistory(task: Task, action: string, summary: string, changes: TaskHistoryChange[]) {
  if (changes.length === 0) return task;
  return {
    ...task,
    history: [makeTaskHistoryEntry(action, summary, changes), ...getTaskHistory(task)].slice(0, 80),
  };
}

function ensureTaskDefaults(task: Task): Task {
  const autoDeadline = task.deadline || getDefaultTaskDeadline(task.createdAt);
  const changes: TaskHistoryChange[] = [];

  if (!task.deadline && autoDeadline) {
    changes.push({
      field: 'Дедлайн',
      before: 'без даты',
      after: formatDate(autoDeadline),
    });
  }

  const timeline = task.timeline.map((item, index) => {
    if (item.dueDate || !autoDeadline) return item;
    changes.push({
      field: `Хронология: ${item.title || `этап ${index + 1}`}`,
      before: 'без даты',
      after: formatDate(autoDeadline),
    });
    return { ...item, dueDate: autoDeadline };
  });

  const normalized: Task = {
    ...task,
    deadline: autoDeadline,
    timeline,
    history: getTaskHistory(task),
  };

  return changes.length
    ? addTaskHistory(normalized, 'Автодедлайн', 'Поставлен дедлайн через 7 рабочих дней после даты постановки.', changes)
    : normalized;
}

function formatHistoryValue(value: string | undefined, fallback = 'пусто') {
  return value ? value : fallback;
}

function ownerNames(ownerIds: string[], peopleById: Map<string, Person>) {
  return ownerIds.map((ownerId) => peopleById.get(ownerId)?.name ?? ownerId).join(', ') || 'без ответственного';
}

function timelineSummary(timeline: TimelineItem[], peopleById: Map<string, Person>) {
  if (timeline.length === 0) return 'нет этапов';
  return timeline
    .map((item) => {
      const owner = peopleById.get(item.ownerId)?.name ?? item.ownerId;
      return `${item.title} / ${statusLabels[item.status]} / ${owner} / ${formatDate(item.dueDate)}`;
    })
    .join('; ');
}

function compactHistoryText(value: string) {
  return value.length > 220 ? `${value.slice(0, 219).trim()}...` : value;
}

function describeTaskChanges(
  before: Task,
  after: Task,
  projectsById: Map<string, Project>,
  peopleById: Map<string, Person>,
) {
  const changes: TaskHistoryChange[] = [];
  const addChange = (field: string, beforeValue: string, afterValue: string) => {
    if (beforeValue !== afterValue) {
      changes.push({
        field,
        before: compactHistoryText(beforeValue),
        after: compactHistoryText(afterValue),
      });
    }
  };

  addChange('Название', before.title, after.title);
  addChange('Описание', formatHistoryValue(before.description), formatHistoryValue(after.description));
  addChange('Проект', projectsById.get(before.projectId)?.name ?? before.projectId, projectsById.get(after.projectId)?.name ?? after.projectId);
  addChange('Статус', statusLabels[before.status], statusLabels[after.status]);
  addChange('Ответственные', ownerNames(before.ownerIds, peopleById), ownerNames(after.ownerIds, peopleById));
  addChange('Дата постановки', formatDate(before.createdAt), formatDate(after.createdAt));
  addChange('Дедлайн', formatDate(before.deadline), formatDate(after.deadline));
  addChange('Дата закрытия', formatDate(before.completedAt ?? ''), formatDate(after.completedAt ?? ''));
  addChange('Кнопка источника', formatHistoryValue(before.sourceLabel), formatHistoryValue(after.sourceLabel));
  addChange('Ссылка источника', formatHistoryValue(before.sourceUrl), formatHistoryValue(after.sourceUrl));
  addChange('Хронология включена', before.timelineEnabled ? 'да' : 'нет', after.timelineEnabled ? 'да' : 'нет');
  addChange('Этапы хронологии', timelineSummary(before.timeline, peopleById), timelineSummary(after.timeline, peopleById));

  return changes;
}

function taskChangeSummary(changes: TaskHistoryChange[]) {
  return `Изменено: ${changes.map((change) => change.field.toLowerCase()).join(', ')}.`;
}

function App() {
  const [projects, setProjects] = useStoredState<Project[]>('task-seo-projects', initialProjects);
  const [people, setPeople] = useStoredState<Person[]>('task-seo-people', initialPeople);
  const [tasks, setTasks] = useStoredState<Task[]>('task-seo-tasks', initialTasks);
  const [reportSnapshots, setReportSnapshots] = useStoredState<TaskReportSnapshot[]>('task-seo-report-snapshots', []);
  const [paymentRows, setPaymentRows] = useStoredState<PaymentRow[]>('task-seo-payments', initialPaymentRows);
  const [managedResources, setManagedResources] = useStoredState<ManagedResource[]>(
    'task-seo-managed-resources',
    initialManagedResources,
  );
  const [externalProjectAdditions, setExternalProjectAdditions] = useStoredState<ExternalProjectAdditions>(
    'task-seo-external-project-additions',
    {},
  );
  const [activeView, setActiveView] = useState<View>('seo');
  const [seoProjectId, setSeoProjectId] = useStoredState<string>('task-seo-selected-project-analytics', initialProjects[0].id);
  const [themeMode, setThemeMode] = useStoredState<ThemeMode>('task-seo-theme-mode', 'dark');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('plan');
  const [adminTab, setAdminTab] = useState<AdminTab>('projects');
  const [projectTabs, setProjectTabs] = useState<Record<string, ProjectTab>>({});
  const [collapsedProjects, setCollapsedProjects] = useStoredState<string[]>('task-seo-collapsed-projects', []);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['task-1']));
  const [linkRows, setLinkRows] = useState<LinkPurchase[]>([]);
  const [linkLoadStatus, setLinkLoadStatus] = useState<LinkLoadStatus>('idle');
  const [linkError, setLinkError] = useState('');
  const [linkUpdatedAt, setLinkUpdatedAt] = useState('');
  const [contentTopics, setContentTopics] = useState<ContentPlanTopic[]>([]);
  const [contentLoadStatus, setContentLoadStatus] = useState<LinkLoadStatus>('idle');
  const [contentError, setContentError] = useState('');
  const [contentUpdatedAt, setContentUpdatedAt] = useState('');
  const [contentSourceErrors, setContentSourceErrors] = useState<ContentPlanSourceError[]>([]);
  const [dynamicLeadAnalytics, setDynamicLeadAnalytics] = useState<LeadAnalyticsSummary[]>([]);
  const [leadAnalyticsLoadStatus, setLeadAnalyticsLoadStatus] = useState<LinkLoadStatus>('idle');
  const [leadAnalyticsError, setLeadAnalyticsError] = useState('');
  const [leadAnalyticsUpdatedAt, setLeadAnalyticsUpdatedAt] = useState('');
  const [leadAnalyticsSourceErrors, setLeadAnalyticsSourceErrors] = useState<LeadAnalyticsSourceError[]>([]);
  const [paymentCashflowRows, setPaymentCashflowRows] = useState<PaymentCashflowRow[]>([]);
  const [paymentCashflowLoadStatus, setPaymentCashflowLoadStatus] = useState<LinkLoadStatus>('idle');
  const [paymentCashflowError, setPaymentCashflowError] = useState('');
  const [paymentCashflowUpdatedAt, setPaymentCashflowUpdatedAt] = useState('');

  const [taskDraft, setTaskDraft] = useState({
    title: '',
    description: '',
    projectId: initialProjects[0].id,
    deadline: getDefaultTaskDeadline(todayIso()),
    ownerIds: [initialPeople[0].id],
    multi: false,
  });
  const [projectDraft, setProjectDraft] = useState('');
  const [personDraft, setPersonDraft] = useState({ name: '', role: '' });
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({
    projectId: initialProjects[0].id,
    periodLabel: 'Август 2026',
    dueDate: '2026-08-25',
    kind: 'service',
    clientAmount: '',
  });
  const [resourceDraft, setResourceDraft] = useState<ManagedResourceDraft>({
    projectId: initialProjects[0].id,
    tab: 'report',
    title: '',
    url: '',
    dateLabel: '',
    note: '',
  });

  const peopleById = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);
  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const days = useMemo(() => getDays(14), []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    setProjects((current) => {
      const withoutLegacy = current.filter((project) => !legacyProjectNamesToRemove.has(normalizeProjectName(project.name)));
      return withoutLegacy.length !== current.length ? withoutLegacy : current;
    });
  }, [setProjects]);

  useEffect(() => {
    setPeople((current) => {
      const legacyIds = new Set(Object.keys(legacyPersonIdMap));
      const withoutLegacy = current.filter((person) => !legacyIds.has(person.id));
      let changed = withoutLegacy.length !== current.length;

      const next = withoutLegacy.map((person) => {
        const required =
          requiredPeople.find((item) => item.id === person.id) ??
          requiredPeople.find(
            (item) => normalizeProjectName(item.name) === normalizeProjectName(person.name),
          );
        if (!required || (person.name === required.name && person.role === required.role)) return person;
        changed = true;
        return { ...person, name: required.name, role: required.role };
      });

      return changed ? next : current;
    });
  }, [setPeople]);

  useEffect(() => {
    setTasks((current) => {
      let changed = false;
      const migrateOwnerId = (ownerId: string) => legacyPersonIdMap[ownerId] ?? ownerId;

      const next = current.map((task) => {
        const ownerIds = task.ownerIds.map(migrateOwnerId);
        const timeline = task.timeline.map((item) => ({
          ...item,
          ownerId: migrateOwnerId(item.ownerId),
        }));
        const projectId = legacyProjectIdMap[task.projectId] ?? task.projectId;
        const taskChanged =
          projectId !== task.projectId ||
          ownerIds.some((ownerId, index) => ownerId !== task.ownerIds[index]) ||
          new Set(ownerIds).size !== ownerIds.length ||
          timeline.some((item, index) => item.ownerId !== task.timeline[index]?.ownerId);

        if (!taskChanged) return task;
        changed = true;
        return { ...task, projectId, ownerIds: Array.from(new Set(ownerIds)), timeline };
      });

      return changed ? next : current;
    });
  }, [setTasks]);

  useEffect(() => {
    if (localStorage.getItem('task-seo-task-seed-version') === taskSeedVersion) return;

    setTasks((current) => {
      const withoutDemo = current.filter((task) => !legacyDemoTaskIds.has(task.id));
      let changed = withoutDemo.length !== current.length;
      const next = withoutDemo.map((task) => {
        const required = requiredTaskSeedById.get(task.id);
        if (!required) return ensureTaskDefaults(task);
        changed = true;
        return ensureTaskDefaults(required);
      });
      const taskIds = new Set(next.map((task) => task.id));

      requiredTaskSeeds.forEach((task) => {
        if (!taskIds.has(task.id)) {
          next.push(ensureTaskDefaults(task));
          taskIds.add(task.id);
          changed = true;
        }
      });

      return changed ? next : current;
    });

    localStorage.setItem('task-seo-task-seed-version', taskSeedVersion);
  }, [setTasks]);

  useEffect(() => {
    if (localStorage.getItem('task-seo-default-deadline-version') === taskDefaultDeadlineVersion) return;

    setTasks((current) => {
      let changed = false;
      const next = current.map((task) => {
        const normalized = ensureTaskDefaults(task);
        if (
          normalized.deadline !== task.deadline ||
          normalized.timeline.some((item, index) => item.dueDate !== task.timeline[index]?.dueDate) ||
          getTaskHistory(normalized).length !== getTaskHistory(task).length
        ) {
          changed = true;
        }
        return normalized;
      });

      return changed ? next : current;
    });

    localStorage.setItem('task-seo-default-deadline-version', taskDefaultDeadlineVersion);
  }, [setTasks]);

  useEffect(() => {
    if (localStorage.getItem('task-seo-managed-resource-seed-version') === managedResourceSeedVersion) return;

    setManagedResources((current) => {
      let changed = false;
      const next = current.map((resource) => {
        const required = requiredManagedResourceSeedsById.get(resource.id);
        if (!required) return resource;
        changed = true;
        return required;
      });
      const resourceIds = new Set(next.map((resource) => resource.id));

      requiredManagedResourceSeeds.forEach((resource) => {
        if (!resourceIds.has(resource.id)) {
          next.push(resource);
          resourceIds.add(resource.id);
          changed = true;
        }
      });

      return changed ? next : current;
    });

    localStorage.setItem('task-seo-managed-resource-seed-version', managedResourceSeedVersion);
  }, [setManagedResources]);

  const loadLinkRows = useCallback(async () => {
    setLinkLoadStatus('loading');
    setLinkError('');

    try {
      const rows = await fetchLinkPurchases();
      setLinkRows(rows);
      setLinkUpdatedAt(new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }));
      setLinkLoadStatus('ready');
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : 'Не удалось загрузить Google Sheets');
      setLinkLoadStatus('error');
    }
  }, []);

  const loadContentTopics = useCallback(async () => {
    setContentLoadStatus('loading');
    setContentError('');
    setContentSourceErrors([]);

    try {
      const result = await fetchContentPlanTopics();
      setContentTopics(result.topics);
      setContentSourceErrors(result.errors);
      setContentUpdatedAt(new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }));
      setContentLoadStatus('ready');
    } catch (error) {
      setContentError(error instanceof Error ? error.message : 'Не удалось загрузить контент-план');
      setContentLoadStatus('error');
    }
  }, []);

  const loadLeadAnalytics = useCallback(async () => {
    setLeadAnalyticsLoadStatus('loading');
    setLeadAnalyticsError('');
    setLeadAnalyticsSourceErrors([]);

    try {
      const result = await fetchLeadAnalyticsSummaries();
      setDynamicLeadAnalytics(result.summaries);
      setLeadAnalyticsSourceErrors(result.errors);
      setLeadAnalyticsUpdatedAt(new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }));
      setLeadAnalyticsLoadStatus('ready');
    } catch (error) {
      setLeadAnalyticsError(error instanceof Error ? error.message : 'Не удалось загрузить заявки');
      setLeadAnalyticsLoadStatus('error');
    }
  }, []);

  const loadPaymentCashflowRows = useCallback(async () => {
    setPaymentCashflowLoadStatus('loading');
    setPaymentCashflowError('');

    try {
      const rows = await fetchPaymentCashflowRows();
      setPaymentCashflowRows(rows);
      setPaymentCashflowUpdatedAt(new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }));
      setPaymentCashflowLoadStatus('ready');
    } catch (error) {
      setPaymentCashflowError(error instanceof Error ? error.message : 'Не удалось загрузить приход/расход');
      setPaymentCashflowLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadLinkRows();
  }, [loadLinkRows]);

  useEffect(() => {
    void loadContentTopics();
  }, [loadContentTopics]);

  useEffect(() => {
    void loadLeadAnalytics();
  }, [loadLeadAnalytics]);

  useEffect(() => {
    void loadPaymentCashflowRows();
  }, [loadPaymentCashflowRows]);

  const groupedTasks = useMemo(
    () =>
      projects.map((project) => ({
        project,
        tasks: tasks.filter((task) => task.projectId === project.id),
      })),
    [projects, tasks],
  );

  const linkRowsByProject = useMemo(() => {
    const map = new Map<string, LinkPurchase[]>();
    linkRows.forEach((row) => {
      const key = normalizeProjectName(row.projectName);
      const current = map.get(key) ?? [];
      current.push(row);
      map.set(key, current);
    });
    return map;
  }, [linkRows]);

  const linkSummaries = useMemo(() => {
    const map = new Map<string, LinkPurchaseSummary>();
    linkRowsByProject.forEach((rows, projectName) => {
      map.set(projectName, summarizeLinkPurchases(rows));
    });
    return map;
  }, [linkRowsByProject]);

  const contentTopicsByProject = useMemo(() => {
    const map = new Map<string, ContentPlanTopic[]>();
    contentTopics.forEach((topic) => {
      const key = normalizeProjectName(topic.projectName);
      const current = map.get(key) ?? [];
      current.push(topic);
      map.set(key, current);
    });
    return map;
  }, [contentTopics]);

  const contentSummaries = useMemo(() => {
    const map = new Map<string, ContentPlanSummary>();
    contentTopicsByProject.forEach((rows, projectName) => {
      map.set(projectName, summarizeContentPlanTopics(rows));
    });
    return map;
  }, [contentTopicsByProject]);

  const contentSourcesByProject = useMemo(() => {
    const map = new Map<string, ContentPlanSource>();
    CONTENT_PLAN_SOURCES.forEach((source) => {
      map.set(normalizeProjectName(source.projectName), source);
    });
    return map;
  }, []);

  const contentErrorsByProject = useMemo(() => {
    const map = new Map<string, string>();
    contentSourceErrors.forEach((error) => {
      map.set(normalizeProjectName(error.projectName), error.message);
    });
    return map;
  }, [contentSourceErrors]);

  const [metrikaStats, setMetrikaStats] = useState<MetrikaStatsPayload>(EMPTY_METRIKA_STATS);
  const [metrikaLoadStatus, setMetrikaLoadStatus] = useState<LinkLoadStatus>('idle');
  const [metrikaError, setMetrikaError] = useState('');
  const [metrikaUpdatedAt, setMetrikaUpdatedAt] = useState('');
  const loadMetrikaStats = useCallback(async (mode: MetrikaStatsLoadMode = 'live') => {
    setMetrikaLoadStatus('loading');
    setMetrikaError('');

    try {
      let payload: unknown = null;

      if (mode === 'live' && METRIKA_LIVE_STATS_ENDPOINT) {
        const livePayload = await fetchMetrikaLiveStats();
        const liveStatus = livePayload && typeof livePayload === 'object' ? (livePayload as { status?: string }) : {};
        if (liveStatus.status === 'error') {
          const message =
            livePayload && typeof livePayload === 'object' && 'message' in livePayload
              ? String((livePayload as { message?: unknown }).message)
              : 'live-обновление Метрики вернуло ошибку';
          throw new Error(message);
        }
        payload = livePayload;
      }

      if (!payload) payload = await fetchSavedMetrikaStats();
      const normalized = normalizeMetrikaStatsPayload(payload);
      if (!normalized.projects.length) throw new Error('Метрика вернула пустой ответ');

      setMetrikaStats(normalized);
      setMetrikaUpdatedAt(normalized.updatedAt ? formatDateTime(normalized.updatedAt) : new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }));
      setMetrikaLoadStatus('ready');
    } catch (error) {
      const liveMessage = getErrorMessage(error, 'не удалось обновить Метрику');

      if (mode === 'live') {
        try {
          const fallbackPayload = await fetchSavedMetrikaStats();
          const normalized = normalizeMetrikaStatsPayload(fallbackPayload);
          if (!normalized.projects.length) throw new Error('сохраненные данные Метрики пустые');
          setMetrikaStats(normalized);
          setMetrikaUpdatedAt(normalized.updatedAt ? formatDateTime(normalized.updatedAt) : '');
          setMetrikaError(`${liveMessage}. Показаны последние сохраненные данные.`);
          setMetrikaLoadStatus('ready');
          return;
        } catch (fallbackError) {
          setMetrikaStats(EMPTY_METRIKA_STATS);
          setMetrikaError(getErrorMessage(fallbackError, liveMessage));
          setMetrikaLoadStatus('error');
          return;
        }
      }

      setMetrikaStats(EMPTY_METRIKA_STATS);
      setMetrikaError(liveMessage);
      setMetrikaLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void loadMetrikaStats('saved').then(() => {
      if (isMounted && METRIKA_LIVE_STATS_ENDPOINT) void loadMetrikaStats('live');
    });

    return () => {
      isMounted = false;
    };
  }, [loadMetrikaStats]);

  const promotionSources = useMemo(
    () => mergePromotionSourcesWithMetrika(PROMOTION_RESULT_SOURCES, metrikaStats),
    [metrikaStats],
  );

  const [bitrix24Snapshot, setBitrix24Snapshot] = useState<Bitrix24Snapshot>(EMPTY_BITRIX24_SNAPSHOT);
  useEffect(() => {
    let isMounted = true;
    void fetch('./data/bitrix24-snapshot.json', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (isMounted && payload) setBitrix24Snapshot(normalizeBitrix24Snapshot(payload));
      })
      .catch(() => {
        if (isMounted) setBitrix24Snapshot(EMPTY_BITRIX24_SNAPSHOT);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const currentReportDate = getWeekWindow(0).start;
    setReportSnapshots((current) => {
      if (current.some((snapshot) => snapshot.reportDate === currentReportDate)) return current;
      return upsertTaskReportSnapshot(
        current,
        makeTaskReportSnapshot(tasks, currentReportDate, bitrix24Snapshot, 'dashboard'),
      );
    });
  }, [bitrix24Snapshot, setReportSnapshots, tasks]);

  const workPlansByProject = useMemo(() => {
    const map = new Map<string, WorkPlanSource[]>();
    WORK_PLAN_SOURCES.forEach((source) => {
      const key = normalizeProjectName(source.projectName);
      const current = map.get(key) ?? [];
      current.push(source);
      map.set(key, current);
    });
    return map;
  }, []);

  const auditSourcesByProject = useMemo(() => {
    const map = new Map<string, ClientAuditSource[]>();
    CLIENT_AUDIT_SOURCES.forEach((source) => {
      const key = normalizeProjectName(source.projectName);
      const current = map.get(key) ?? [];
      current.push(source);
      map.set(key, current);
    });
    return map;
  }, []);

  const promotionResultsByProject = useMemo(() => {
    const map = new Map<string, PromotionResultSource[]>();
    promotionSources.forEach((source) => {
      const key = normalizeProjectName(source.projectName);
      const current = map.get(key) ?? [];
      current.push(source);
      map.set(key, current);
    });
    return map;
  }, [promotionSources]);

  const leadAnalyticsSummaries = useMemo(
    () => combineLeadAnalyticsSummaries([...STATIC_LEAD_ANALYTICS_SUMMARIES, ...dynamicLeadAnalytics]),
    [dynamicLeadAnalytics],
  );

  const leadAnalyticsByProject = useMemo(() => {
    const map = new Map<string, LeadAnalyticsSummary>();
    leadAnalyticsSummaries.forEach((summary) => {
      map.set(normalizeProjectName(summary.projectName), summary);
    });
    return map;
  }, [leadAnalyticsSummaries]);

  const leadErrorsByProject = useMemo(() => {
    const map = new Map<string, string>();
    leadAnalyticsSourceErrors.forEach((error) => {
      const key = normalizeProjectName(error.projectName);
      const current = map.get(key);
      map.set(key, current ? `${current}; ${error.title}: ${error.message}` : `${error.title}: ${error.message}`);
    });
    return map;
  }, [leadAnalyticsSourceErrors]);

  const clientLinksByProject = useMemo(() => {
    const map = new Map<string, ClientQuickLinks>();
    projects.forEach((project) => {
      const resources = managedResources.filter((resource) => resource.projectId === project.id);
      const site = resources.find((resource) => resource.tab === 'site');
      const reports = resources
        .filter((resource) => resource.tab === 'report')
        .map((resource) => ({
          id: resource.id,
          label: resource.note || 'Отчет клиенту',
          reportDate: resource.dateLabel || 'без даты',
          title: resource.title,
          url: resource.url,
        }));

      if (!site && reports.length === 0) return;
      map.set(normalizeProjectName(project.name), {
        projectName: project.name,
        clientName: project.name,
        siteUrl: site?.url ?? '#',
        reports,
      });
    });
    return map;
  }, [managedResources, projects]);

  const managedResourcesByProject = useMemo(() => {
    const map = new Map<string, ManagedResource[]>();
    managedResources.forEach((resource) => {
      const current = map.get(resource.projectId) ?? [];
      current.push(resource);
      map.set(resource.projectId, current);
    });
    return map;
  }, [managedResources]);

  const collapsedProjectIds = useMemo(() => new Set(collapsedProjects), [collapsedProjects]);

  useEffect(() => {
    if (projects.some((project) => project.id === seoProjectId)) return;
    setSeoProjectId(projects[0]?.id ?? '');
  }, [projects, seoProjectId, setSeoProjectId]);

  const completion = useMemo(() => {
    const countableTasks = tasks.filter(isCountableTask);
    const total = countableTasks.length || 1;
    const done = countableTasks.filter((task) => task.status === 'done').length;
    return Math.round((done / total) * 100);
  }, [tasks]);

  const collisions = useMemo(() => {
    const activeTasks = tasks.filter((task) => isCountableTask(task) && task.status !== 'done' && task.deadline);
    return activeTasks.flatMap((task) =>
      task.ownerIds.flatMap((ownerId) => {
        const overlaps = activeTasks.filter(
          (other) =>
            other.id !== task.id &&
            other.ownerIds.includes(ownerId) &&
            Math.abs(
              new Date(`${other.deadline}T12:00:00`).getTime() -
                new Date(`${task.deadline}T12:00:00`).getTime(),
            ) <= 1000 * 60 * 60 * 24,
        );

        return overlaps.length
          ? [
              {
                id: `${task.id}-${ownerId}`,
                task,
                owner: peopleById.get(ownerId),
                count: overlaps.length + 1,
              },
            ]
          : [];
      }),
    );
  }, [peopleById, tasks]);

  const overdueCount = useMemo(
    () => tasks.filter((task) => isCountableTask(task) && task.status !== 'done' && task.deadline && task.deadline < todayIso()).length,
    [tasks],
  );

  const updateTask = (taskId: string, updater: (task: Task) => Task, action = 'Редактирование задачи') => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        const before = ensureTaskDefaults(task);
        const after = ensureTaskDefaults(updater(before));
        const changes = describeTaskChanges(before, after, projectsById, peopleById);
        return changes.length ? addTaskHistory(after, action, taskChangeSummary(changes), changes) : before;
      }),
    );
  };

  const setTaskStatus = (taskId: string, status: Status) => {
    updateTask(
      taskId,
      (task) => ({
        ...task,
        status,
        completedAt: status === 'done' ? task.completedAt ?? todayIso() : undefined,
      }),
      'Изменение статуса',
    );
  };

  const toggleTimeline = (taskId: string, checked: boolean) => {
    updateTask(
      taskId,
      (task) => ({
        ...task,
        timelineEnabled: checked,
        timeline:
          checked && task.timeline.length === 0
            ? buildTimeline(task.title, task.ownerIds, task.deadline || getDefaultTaskDeadline(task.createdAt))
            : task.timeline,
      }),
      checked ? 'Хронология включена' : 'Хронология выключена',
    );

    setExpanded((current) => {
      const next = new Set(current);
      if (checked) next.add(taskId);
      if (!checked) next.delete(taskId);
      return next;
    });
  };

  const toggleExpanded = (taskId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleProjectCollapsed = (projectId: string) => {
    setCollapsedProjects((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId],
    );
  };

  const setTimelineStatus = (taskId: string, itemId: string, status: Status) => {
    updateTask(
      taskId,
      (task) => ({
        ...task,
        timeline: task.timeline.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status,
                completedAt: status === 'done' ? item.completedAt ?? todayIso() : undefined,
              }
            : item,
        ),
      }),
      'Изменение этапа хронологии',
    );
  };

  const createTask = () => {
    const title = taskDraft.title.trim();
    if (!title || taskDraft.ownerIds.length === 0) return;

    const createdAt = todayIso();
    const deadline = taskDraft.deadline || getDefaultTaskDeadline(createdAt);
    const timelineEnabled = taskDraft.ownerIds.length > 1;
    const nextTask: Task = {
      id: uid('task'),
      projectId: taskDraft.projectId,
      title,
      description: taskDraft.description.trim(),
      status: 'planned',
      ownerIds: taskDraft.ownerIds,
      createdAt,
      deadline,
      timelineEnabled,
      timeline: timelineEnabled ? buildTimeline(title, taskDraft.ownerIds, deadline) : [],
      history: [
        makeTaskHistoryEntry('Создание задачи', `Задача создана с дедлайном ${formatDate(deadline)}.`, [
          { field: 'Название', before: 'не было', after: title },
          { field: 'Дедлайн', before: 'не было', after: formatDate(deadline) },
        ]),
      ],
    };

    setTasks((current) => [ensureTaskDefaults(nextTask), ...current]);
    setExpanded((current) => {
      const next = new Set(current);
      if (timelineEnabled) next.add(nextTask.id);
      return next;
    });
    setTaskDraft({
      title: '',
      description: '',
      projectId: projects[0]?.id ?? '',
      deadline: getDefaultTaskDeadline(todayIso()),
      ownerIds: people[0] ? [people[0].id] : [],
      multi: false,
    });
  };

  const addProject = () => {
    const name = projectDraft.trim();
    if (!name) return;
    const colors = ['#6D72FF', '#4DB8FF', '#8B5CF6', '#14B8A6', '#F97316', '#EC4899'];
    setProjects((current) => [
      ...current,
      { id: uid('project'), name, color: colors[current.length % colors.length] },
    ]);
    setProjectDraft('');
  };

  const deleteProject = (projectId: string) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
    setTasks((current) => current.filter((task) => task.projectId !== projectId));
    setPaymentRows((current) => current.filter((row) => row.projectId !== projectId));
    setManagedResources((current) => current.filter((resource) => resource.projectId !== projectId));
    setCollapsedProjects((current) => current.filter((id) => id !== projectId));
  };

  const addPerson = () => {
    const name = personDraft.name.trim();
    if (!name) return;
    setPeople((current) => [
      ...current,
      { id: uid('person'), name, role: personDraft.role.trim() || 'ответственный' },
    ]);
    setPersonDraft({ name: '', role: '' });
  };

  const deletePerson = (personId: string) => {
    setPeople((current) => current.filter((person) => person.id !== personId));
    setTasks((current) =>
      current.map((task) => ({
        ...task,
        ownerIds: task.ownerIds.filter((ownerId) => ownerId !== personId),
        timeline: task.timeline.filter((item) => item.ownerId !== personId),
      })),
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    setExpanded((current) => {
      const next = new Set(current);
      next.delete(taskId);
      return next;
    });
  };

  const addPaymentRow = (projectIdOverride?: string) => {
    const projectId = projectIdOverride ?? paymentDraft.projectId;
    if (!projectId || !paymentDraft.periodLabel.trim()) return;
    const nextRow: PaymentRow = {
      id: uid('payment'),
      projectId,
      periodLabel: paymentDraft.periodLabel.trim(),
      dueDate: paymentDraft.dueDate,
      status: 'planned',
      kind: paymentDraft.kind,
      clientAmount: parseMoneyInput(paymentDraft.clientAmount),
      outsourceAmount: 0,
      linkBudgetLimit: 0,
      note: '',
    };
    setPaymentRows((current) => [nextRow, ...current]);
    setPaymentDraft((current) => ({ ...current, clientAmount: '' }));
  };

  const updatePaymentRow = (rowId: string, patch: Partial<PaymentRow>) => {
    setPaymentRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const deletePaymentRow = (rowId: string) => {
    setPaymentRows((current) => current.filter((row) => row.id !== rowId));
  };

  const addManagedResource = () => {
    const title = resourceDraft.title.trim();
    const url = resourceDraft.url.trim();
    if (!resourceDraft.projectId || !title || !url) return;
    const nextResource: ManagedResource = {
      id: uid('resource'),
      projectId: resourceDraft.projectId,
      tab: resourceDraft.tab,
      title,
      url,
      dateLabel: resourceDraft.dateLabel.trim(),
      note: resourceDraft.note.trim(),
    };
    setManagedResources((current) => [nextResource, ...current]);
    setResourceDraft((current) => ({ ...current, title: '', url: '', dateLabel: '', note: '' }));
  };

  const deleteManagedResource = (resourceId: string) => {
    setManagedResources((current) => current.filter((resource) => resource.id !== resourceId));
  };

  const toggleOwnerDraft = (ownerId: string) => {
    setTaskDraft((current) => {
      if (!current.multi) return { ...current, ownerIds: [ownerId] };
      const exists = current.ownerIds.includes(ownerId);
      const ownerIds = exists
        ? current.ownerIds.filter((id) => id !== ownerId)
        : [...current.ownerIds, ownerId];
      return { ...current, ownerIds };
    });
  };

  return (
    <div className="app-shell">
      <main className="workspace">
        <header className="topline glass">
          <div>
            <span className="mark">t</span>
            <h1>task-SEO</h1>
            <p>Проекты, ответственные, хронология и календарь в одном поле контроля.</p>
          </div>
          <div className="status-strip" aria-label="Сводка">
            <Metric compact label="выполнение" value={`${completion}%`} />
            <Metric compact label="в риске" value={`${overdueCount}`} tone={overdueCount ? 'danger' : 'success'} />
            <Metric compact label="наложения" value={`${collisions.length}`} />
            <Metric compact label="ссылок" value={`${linkRows.length}`} />
            <Metric compact label="контент" value={`${contentTopics.length}`} />
            <Metric compact label="планов" value={`${WORK_PLAN_SOURCES.length}`} />
            <Metric compact label="аудитов" value={`${CLIENT_AUDIT_SOURCES.length}`} />
            <Metric compact label="оплат" value={`${paymentRows.length + paymentCashflowRows.length}`} />
          </div>
        </header>

        {activeView === 'tasks' && (
          <div className="content-grid">
            <section className="primary-column">
              <TaskComposer
                draft={taskDraft}
                projects={projects}
                people={people}
                onDraftChange={setTaskDraft}
                onOwnerToggle={toggleOwnerDraft}
                onCreate={createTask}
              />

              <section className="panel task-panel">
                <div className="section-heading">
                  <div>
                    <h2>Рабочие задачи</h2>
                    <p>Задачи сгруппированы по проектам. Хронология раскрывается только там, где нужна детализация.</p>
                  </div>
                  <span className="soft-count">{tasks.length} задач</span>
                </div>

                <div className="project-stack">
                  {groupedTasks.map(({ project, tasks: projectTasks }) => (
                    <ProjectGroup
                      key={project.id}
                      project={project}
                      projects={projects}
                      tasks={projectTasks}
                      linkRows={linkRowsByProject.get(normalizeProjectName(project.name)) ?? []}
                      linkSummary={linkSummaries.get(normalizeProjectName(project.name))}
                      contentTopics={contentTopicsByProject.get(normalizeProjectName(project.name)) ?? []}
                      contentSummary={contentSummaries.get(normalizeProjectName(project.name))}
                      contentSource={contentSourcesByProject.get(normalizeProjectName(project.name))}
                      workPlans={workPlansByProject.get(normalizeProjectName(project.name)) ?? []}
                      auditSources={auditSourcesByProject.get(normalizeProjectName(project.name)) ?? []}
                      promotionResults={promotionResultsByProject.get(normalizeProjectName(project.name)) ?? []}
                      leadAnalytics={leadAnalyticsByProject.get(normalizeProjectName(project.name))}
                      clientLinks={clientLinksByProject.get(normalizeProjectName(project.name))}
                      linkLoadStatus={linkLoadStatus}
                      linkError={linkError}
                      linkUpdatedAt={linkUpdatedAt}
                      contentLoadStatus={contentLoadStatus}
                      contentError={contentErrorsByProject.get(normalizeProjectName(project.name)) ?? contentError}
                      contentUpdatedAt={contentUpdatedAt}
                      leadLoadStatus={leadAnalyticsLoadStatus}
                      leadError={leadErrorsByProject.get(normalizeProjectName(project.name)) ?? leadAnalyticsError}
                      leadUpdatedAt={leadAnalyticsUpdatedAt}
                      activeTab={projectTabs[project.id] ?? 'tasks'}
                      collapsed={collapsedProjectIds.has(project.id)}
                      people={people}
                      peopleById={peopleById}
                      expanded={expanded}
                      onTabChange={(tab) => setProjectTabs((current) => ({ ...current, [project.id]: tab }))}
                      onReloadLinks={loadLinkRows}
                      onReloadContent={loadContentTopics}
                      onReloadLeads={loadLeadAnalytics}
                      onToggleCollapsed={() => toggleProjectCollapsed(project.id)}
                      onToggleExpanded={toggleExpanded}
                      onToggleTimeline={toggleTimeline}
                      onStatusChange={setTaskStatus}
                      onTimelineStatusChange={setTimelineStatus}
                      onTaskUpdate={updateTask}
                    />
                  ))}
                </div>
              </section>
            </section>

            <aside className="insight-column">
              <DashboardCard completion={completion} overdueCount={overdueCount} collisions={collisions} />
              <ProjectPulse projects={projects} tasks={tasks} />
            </aside>

            <section className="calendar-wrap panel">
              <CalendarHeader mode={calendarMode} onModeChange={setCalendarMode} />
              <ProjectCalendar
                mode={calendarMode}
                days={days}
                projects={projects}
                tasks={tasks}
                peopleById={peopleById}
              />
            </section>
          </div>
        )}

        {activeView === 'admin' && (
          <AdminView
            tab={adminTab}
            onTabChange={setAdminTab}
            projects={projects}
            people={people}
            tasks={tasks}
            paymentRows={paymentRows}
            linkRows={linkRows}
            managedResources={managedResources}
            projectDraft={projectDraft}
            personDraft={personDraft}
            paymentDraft={paymentDraft}
            resourceDraft={resourceDraft}
            onProjectDraftChange={setProjectDraft}
            onPersonDraftChange={setPersonDraft}
            onPaymentDraftChange={setPaymentDraft}
            onResourceDraftChange={setResourceDraft}
            onProjectAdd={addProject}
            onPersonAdd={addPerson}
            onPaymentAdd={addPaymentRow}
            onResourceAdd={addManagedResource}
            onProjectDelete={deleteProject}
            onPersonDelete={deletePerson}
            onTaskDelete={deleteTask}
            onPaymentUpdate={updatePaymentRow}
            onPaymentDelete={deletePaymentRow}
            onResourceDelete={deleteManagedResource}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            projects={projects}
            tasks={tasks}
            peopleById={peopleById}
            completion={completion}
            overdueCount={overdueCount}
            collisions={collisions}
            bitrix24Snapshot={bitrix24Snapshot}
          />
        )}

        {activeView === 'seo' && (
          <SeoProjectsView
            projects={projects}
            tasks={tasks}
            people={people}
            peopleById={peopleById}
            linkRows={linkRows}
            linkSummaries={linkSummaries}
            contentTopicsByProject={contentTopicsByProject}
            contentSummaries={contentSummaries}
            contentSourcesByProject={contentSourcesByProject}
            contentErrorsByProject={contentErrorsByProject}
            workPlansByProject={workPlansByProject}
            auditSourcesByProject={auditSourcesByProject}
            managedResourcesByProject={managedResourcesByProject}
            paymentRows={paymentRows}
            paymentCashflowRows={paymentCashflowRows}
            paymentDraft={paymentDraft}
            promotionSources={promotionSources}
            leadAnalyticsByProject={leadAnalyticsByProject}
            leadErrorsByProject={leadErrorsByProject}
            selectedProjectId={seoProjectId}
            expanded={expanded}
            reportSnapshots={reportSnapshots}
            bitrix24Snapshot={bitrix24Snapshot}
            onReportSnapshotsChange={setReportSnapshots}
            onProjectChange={setSeoProjectId}
            linkLoadStatus={linkLoadStatus}
            linkError={linkError}
            linkUpdatedAt={linkUpdatedAt}
            contentLoadStatus={contentLoadStatus}
            contentError={contentError}
            contentUpdatedAt={contentUpdatedAt}
            leadLoadStatus={leadAnalyticsLoadStatus}
            leadError={leadAnalyticsError}
            leadUpdatedAt={leadAnalyticsUpdatedAt}
            metrikaLoadStatus={metrikaLoadStatus}
            metrikaError={metrikaError}
            metrikaUpdatedAt={metrikaUpdatedAt}
            paymentCashflowLoadStatus={paymentCashflowLoadStatus}
            paymentCashflowError={paymentCashflowError}
            paymentCashflowUpdatedAt={paymentCashflowUpdatedAt}
            onReloadLinks={loadLinkRows}
            onReloadContent={loadContentTopics}
            onReloadLeads={loadLeadAnalytics}
            onReloadMetrika={loadMetrikaStats}
            onReloadPaymentCashflow={loadPaymentCashflowRows}
            onPaymentDraftChange={setPaymentDraft}
            onPaymentAdd={addPaymentRow}
            onPaymentUpdate={updatePaymentRow}
            onPaymentDelete={deletePaymentRow}
            onToggleExpanded={toggleExpanded}
            onToggleTimeline={toggleTimeline}
            onStatusChange={setTaskStatus}
            onTimelineStatusChange={setTimelineStatus}
            onTaskUpdate={updateTask}
          />
        )}

        {activeView === 'payments' && (
          <PaymentsView
            projects={projects}
            paymentRows={paymentRows}
            paymentCashflowRows={paymentCashflowRows}
            paymentDraft={paymentDraft}
            linkRows={linkRows}
            paymentCashflowLoadStatus={paymentCashflowLoadStatus}
            paymentCashflowError={paymentCashflowError}
            paymentCashflowUpdatedAt={paymentCashflowUpdatedAt}
            onReloadPaymentCashflow={loadPaymentCashflowRows}
            onPaymentDraftChange={setPaymentDraft}
            onPaymentAdd={addPaymentRow}
            onPaymentUpdate={updatePaymentRow}
            onPaymentDelete={deletePaymentRow}
          />
        )}

        {activeView === 'report' && (
          <WeeklyReportView
            projects={projects}
            tasks={tasks}
            peopleById={peopleById}
            reportSnapshots={reportSnapshots}
            bitrix24Snapshot={bitrix24Snapshot}
            linkRows={linkRows}
            promotionSources={promotionSources}
            leadAnalyticsByProject={leadAnalyticsByProject}
            leadErrorsByProject={leadErrorsByProject}
            leadLoadStatus={leadAnalyticsLoadStatus}
            leadError={leadAnalyticsError}
            leadUpdatedAt={leadAnalyticsUpdatedAt}
            metrikaLoadStatus={metrikaLoadStatus}
            metrikaError={metrikaError}
            metrikaUpdatedAt={metrikaUpdatedAt}
            externalSource={EXTERNAL_PROJECTS_SOURCE}
            externalAdditions={externalProjectAdditions}
            onReloadLeads={loadLeadAnalytics}
            onReloadMetrika={loadMetrikaStats}
            onReportSnapshotsChange={setReportSnapshots}
          />
        )}

        {activeView === 'external' && (
          <ExternalProjectsView
            source={EXTERNAL_PROJECTS_SOURCE}
            projectAdditions={externalProjectAdditions}
            onProjectAdditionsChange={setExternalProjectAdditions}
          />
        )}
      </main>

      <nav className="side-nav glass" aria-label="Основное меню">
        <div className="nav-brand">
          <span className="brand-dot" />
          <span>task</span>
        </div>
        <div className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'is-active' : ''}`}
                type="button"
                onClick={() => setActiveView(item.id)}
                title={item.label}
                aria-label={item.label}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))}
          aria-label={themeMode === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
          title={themeMode === 'dark' ? 'Светлая тема' : 'Темная тема'}
        >
          {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{themeMode === 'dark' ? 'Светлая' : 'Темная'}</span>
        </button>
      </nav>
    </div>
  );
}

function ExternalProjectsView({
  source,
  projectAdditions,
  onProjectAdditionsChange,
}: {
  source: ExternalProjectsSource;
  projectAdditions: ExternalProjectAdditions;
  onProjectAdditionsChange: Dispatch<SetStateAction<ExternalProjectAdditions>>;
}) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState<ExternalBudgetDraft>({ label: '', amountLabel: '' });
  const [assetDraft, setAssetDraft] = useState<ExternalAssetDraft>({ title: '', url: '', kind: 'link' });
  const [weeklyDraft, setWeeklyDraft] = useState<ExternalWeeklyDraft>({
    weekLabel: source.tabTitle,
    title: '',
    status: 'active',
  });
  const activeCount = source.sections.filter((section) => section.status === 'active').length;
  const waitingCount = source.sections.filter((section) => section.status === 'waiting').length;
  const nextCount = source.sections.filter((section) => section.status === 'next').length;
  const selectedSection = source.sections.find((section) => section.id === selectedSectionId);

  const updateProjectAdditions = (
    sectionId: string,
    updater: (current: ExternalProjectAdditions[string]) => ExternalProjectAdditions[string],
  ) => {
    onProjectAdditionsChange((current) => ({
      ...current,
      [sectionId]: updater(getExternalAdditions(current, sectionId)),
    }));
  };

  const handleAddBudgetLine = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSection || !budgetDraft.label.trim()) return;

    const nextLine: ExternalBudgetLine = {
      id: uid('external-budget'),
      label: budgetDraft.label.trim(),
      amountLabel: budgetDraft.amountLabel.trim() || 'сумма не задана',
    };

    updateProjectAdditions(selectedSection.id, (current) => ({
      ...current,
      budgetLines: [...current.budgetLines, nextLine],
    }));
    setBudgetDraft({ label: '', amountLabel: '' });
  };

  const handleAddAsset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSection || !assetDraft.title.trim() || !assetDraft.url.trim()) return;

    const nextAsset: ExternalProjectAsset = {
      id: uid('external-asset'),
      title: assetDraft.title.trim(),
      url: assetDraft.url.trim(),
      kind: assetDraft.kind,
    };

    updateProjectAdditions(selectedSection.id, (current) => ({
      ...current,
      assets: [...current.assets, nextAsset],
    }));
    setAssetDraft({ title: '', url: '', kind: 'link' });
  };

  const handleAddWeeklyUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSection || !weeklyDraft.weekLabel.trim() || !weeklyDraft.title.trim()) return;

    const nextUpdate: ExternalWeeklyUpdate = {
      id: uid('external-week'),
      weekLabel: weeklyDraft.weekLabel.trim(),
      dateLabel: 'понедельник',
      items: [
        {
          id: uid('external-week-item'),
          title: weeklyDraft.title.trim(),
          status: weeklyDraft.status,
        },
      ],
    };

    updateProjectAdditions(selectedSection.id, (current) => ({
      ...current,
      weeklyUpdates: [nextUpdate, ...current.weeklyUpdates],
    }));
    setWeeklyDraft((current) => ({ ...current, title: '' }));
  };

  if (selectedSection) {
    const additions = getExternalAdditions(projectAdditions, selectedSection.id);
    const people = getExternalPeople(selectedSection, source.collaborator);
    const budgetLines = getExternalBudgetLines(selectedSection, additions);
    const assets = getExternalAssets(selectedSection, additions, source.url);
    const weeklyUpdates = getExternalWeeklyUpdates(selectedSection, additions, source);
    const timeline = weeklyUpdates.flatMap((week) => week.items);
    const photos = assets.filter((asset) => asset.kind === 'photo');

    return (
      <section className="external-view external-detail-view">
        <button className="ghost-button external-back-button" type="button" onClick={() => setSelectedSectionId(null)}>
          <ChevronRight size={16} />
          К папкам
        </button>

        <div className="dashboard-hero panel external-detail-hero">
          <div>
            <span className={`external-status ${selectedSection.status}`}>
              {externalStatusLabels[selectedSection.status]}
            </span>
            <h2>{selectedSection.title}</h2>
            <p>{selectedSection.goal ?? selectedSection.items[0] ?? 'Конечная цель пока не задана.'}</p>
          </div>
          <div className="hero-metrics">
            <Metric label="Бюджет" value={selectedSection.budgetLabel ?? 'не задан'} />
            <Metric label="Люди" value={String(people.length)} />
            <Metric label="Материалы" value={String(assets.length)} />
            <Metric label="Хронология" value={String(timeline.length)} />
          </div>
        </div>

        <div className="external-detail-layout">
          <div className="external-detail-main">
            <section className="external-detail-card external-goal-card">
              <div className="tile-heading">
                <Target size={18} />
                <h3>Конечная цель</h3>
              </div>
              <p>{selectedSection.goal ?? selectedSection.items[0] ?? 'Цель пока не внесена.'}</p>
              {selectedSection.note && <span>{selectedSection.note}</span>}
            </section>

            <section className="external-detail-card">
              <div className="tile-heading">
                <BarChart3 size={18} />
                <h3>Бюджет</h3>
              </div>
              <strong className="external-budget-total">{selectedSection.budgetLabel ?? 'не задан'}</strong>
              <div className="external-budget-list">
                {budgetLines.length ? (
                  budgetLines.map((line) => (
                    <div className="external-budget-row" key={line.id}>
                      <span>{line.label}</span>
                      <strong>{line.amountLabel}</strong>
                    </div>
                  ))
                ) : (
                  <p className="empty-note">Строки трат пока не внесены.</p>
                )}
              </div>
              <form className="external-add-form" onSubmit={handleAddBudgetLine}>
                <input
                  value={budgetDraft.label}
                  onChange={(event) => setBudgetDraft((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Статья расхода"
                />
                <input
                  value={budgetDraft.amountLabel}
                  onChange={(event) => setBudgetDraft((current) => ({ ...current, amountLabel: event.target.value }))}
                  placeholder="Сумма"
                />
                <button type="submit" aria-label="Добавить строку бюджета">
                  <Plus size={16} />
                </button>
              </form>
            </section>

            <section className="external-detail-card external-wide-card">
              <div className="tile-heading">
                <FileText size={18} />
                <h3>Файлы и ссылки</h3>
              </div>
              <div className="external-asset-grid">
                {assets.map((asset) => (
                  <a className={`external-asset-card ${asset.kind}`} key={asset.id} href={asset.url} target="_blank" rel="noreferrer">
                    <span>{externalAssetKindLabels[asset.kind]}</span>
                    <strong>{asset.title}</strong>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
              <form className="external-add-form external-asset-form" onSubmit={handleAddAsset}>
                <input
                  value={assetDraft.title}
                  onChange={(event) => setAssetDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Название"
                />
                <input
                  value={assetDraft.url}
                  onChange={(event) => setAssetDraft((current) => ({ ...current, url: event.target.value }))}
                  placeholder="Ссылка"
                />
                <select
                  value={assetDraft.kind}
                  onChange={(event) =>
                    setAssetDraft((current) => ({ ...current, kind: event.target.value as ExternalProjectAsset['kind'] }))
                  }
                >
                  <option value="link">Ссылка</option>
                  <option value="file">Файл</option>
                  <option value="photo">Фото</option>
                </select>
                <button type="submit" aria-label="Добавить материал">
                  <Plus size={16} />
                </button>
              </form>
            </section>
          </div>

          <aside className="external-detail-side">
            <section className="external-detail-card">
              <div className="tile-heading">
                <Users size={18} />
                <h3>Задействованные лица</h3>
              </div>
              <div className="external-people-list">
                {people.map((person) => (
                  <span key={person}>
                    <i>{person.slice(0, 1)}</i>
                    {person}
                  </span>
                ))}
              </div>
            </section>

            <section className="external-detail-card">
              <div className="tile-heading">
                <Clock3 size={18} />
                <h3>Недельная хронология</h3>
              </div>
              <div className="external-week-list">
                {weeklyUpdates.map((week) => (
                  <div className="external-week-group" key={week.id}>
                    <header>
                      <strong>{week.weekLabel}</strong>
                      <span>{week.dateLabel}</span>
                    </header>
                    <div className="external-timeline-list">
                      {week.items.map((item) => (
                        <div className={`external-timeline-row ${item.status}`} key={item.id}>
                          <span className="mini-dot" />
                          <div>
                            <strong>{item.title}</strong>
                            <p>
                              {item.displayStatusLabel ?? externalTimelineStatusLabels[item.status]}
                              {item.dateLabel ? ` · ${item.dateLabel}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <form className="external-add-form external-week-form" onSubmit={handleAddWeeklyUpdate}>
                <input
                  value={weeklyDraft.weekLabel}
                  onChange={(event) => setWeeklyDraft((current) => ({ ...current, weekLabel: event.target.value }))}
                  placeholder="Лист / понедельник"
                />
                <select
                  value={weeklyDraft.status}
                  onChange={(event) =>
                    setWeeklyDraft((current) => ({
                      ...current,
                      status: event.target.value as ExternalTimelineItem['status'],
                    }))
                  }
                >
                  <option value="active">В работе</option>
                  <option value="planned">План</option>
                  <option value="waiting">Ожидание</option>
                  <option value="done">Готово</option>
                </select>
                <input
                  value={weeklyDraft.title}
                  onChange={(event) => setWeeklyDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Что изменилось"
                />
                <button type="submit" aria-label="Добавить обновление">
                  <Plus size={16} />
                </button>
              </form>
            </section>

            <section className="external-detail-card">
              <div className="tile-heading">
                <FileSpreadsheet size={18} />
                <h3>Фото</h3>
              </div>
              {photos.length ? (
                <div className="external-photo-list">
                  {photos.map((photo) => (
                    <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
                      {photo.title}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="empty-note">Фотографии пока не добавлены.</p>
              )}
            </section>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="external-view">
      <div className="dashboard-hero panel external-hero">
        <div>
          <h2>{source.title}</h2>
          <p>
            Отдельная зона для задач, которые идут не внутри клиентского SEO-списка, а в рабочем документе по
            отдельным направлениям.
          </p>
        </div>
        <div className="hero-metrics">
          <Metric label="Направления" value={String(source.sections.length)} />
          <Metric label="В работе" value={String(activeCount)} />
          <Metric label="Ожидание" value={String(waitingCount)} tone={waitingCount ? 'warning' : 'success'} />
          <Metric label="Следующие" value={String(nextCount)} />
        </div>
      </div>

      <section className="panel external-source-panel">
        <div className="section-heading compact-heading">
          <div>
            <h2>{source.documentTitle}</h2>
            <p>
              Вкладка {source.tabTitle} · {source.updatedLabel}
            </p>
          </div>
          <div className="link-actions">
            <a href={source.url} target="_blank" rel="noreferrer">
              <FileText size={15} />
              Открыть документ
            </a>
          </div>
        </div>
        <div className="external-folder-grid">
          {source.sections.map((section) => (
            <button
              className={`external-folder-card ${section.status}`}
              key={section.id}
              type="button"
              onClick={() => setSelectedSectionId(section.id)}
            >
              <div className="folder-visual" aria-hidden="true">
                <img src={externalFolderArtByStatus[section.status]} alt="" loading="lazy" />
              </div>
              <div className="external-card-head">
                <span className={`external-status ${section.status}`}>{externalStatusLabels[section.status]}</span>
                <ChevronRight size={16} />
              </div>
              <h3>{section.title}</h3>
              {section.note && <p>{section.note}</p>}
              <div className="external-folder-footer">
                <div className="avatar-stack" aria-hidden="true">
                  {getExternalPeople(section, source.collaborator)
                    .slice(0, 3)
                    .map((person) => (
                      <span key={person}>{person.slice(0, 1)}</span>
                    ))}
                </div>
                <strong>{section.items.length} задач</strong>
              </div>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function getExternalAdditions(additions: ExternalProjectAdditions, sectionId: string) {
  return {
    budgetLines: additions[sectionId]?.budgetLines ?? [],
    assets: additions[sectionId]?.assets ?? [],
    weeklyUpdates: additions[sectionId]?.weeklyUpdates ?? [],
  };
}

function getExternalPeople(section: ExternalProjectSection, fallback: string) {
  return section.people?.length ? section.people : [fallback];
}

function getExternalBudgetLines(
  section: ExternalProjectSection,
  additions: ExternalProjectAdditions[string],
) {
  return [...(section.budgetLines ?? []), ...additions.budgetLines];
}

function getExternalAssets(
  section: ExternalProjectSection,
  additions: ExternalProjectAdditions[string],
  sourceUrl: string,
) {
  const baseAssets: ExternalProjectAsset[] = [
    {
      id: `${section.id}-source-doc`,
      title: 'Документ-источник',
      url: sourceUrl,
      kind: 'file',
    },
    ...(section.assets ?? []),
  ];

  if (section.link && !baseAssets.some((asset) => asset.url === section.link)) {
    baseAssets.unshift({
      id: `${section.id}-main-link`,
      title: 'Рабочая ссылка',
      url: section.link,
      kind: 'link',
    });
  }

  return [...baseAssets, ...additions.assets];
}

function getExternalWeeklyUpdates(
  section: ExternalProjectSection,
  additions: ExternalProjectAdditions[string],
  source: ExternalProjectsSource,
) {
  const sourceWeek: ExternalWeeklyUpdate = {
    id: `${section.id}-week-${source.tabTitle}`,
    weekLabel: source.tabTitle,
    dateLabel: source.documentTitle,
    items: getExternalTimeline(section),
  };

  return [...additions.weeklyUpdates, ...(section.weeklyUpdates ?? []), sourceWeek];
}

function getExternalTimeline(section: ExternalProjectSection): ExternalTimelineItem[] {
  if (section.timeline?.length) return section.timeline;

  return section.items.map((item, index) => ({
    id: `${section.id}-timeline-${index}`,
    title: item,
    status: index === 0 && section.status === 'done' ? 'done' : index === 0 ? 'active' : 'planned',
  })) satisfies ExternalTimelineItem[];
}

type TaskComposerProps = {
  draft: {
    title: string;
    description: string;
    projectId: string;
    deadline: string;
    ownerIds: string[];
    multi: boolean;
  };
  projects: Project[];
  people: Person[];
  onDraftChange: Dispatch<SetStateAction<TaskComposerProps['draft']>>;
  onOwnerToggle: (ownerId: string) => void;
  onCreate: () => void;
};

function TaskComposer({
  draft,
  projects,
  people,
  onDraftChange,
  onOwnerToggle,
  onCreate,
}: TaskComposerProps) {
  return (
    <section className="panel composer">
      <div className="composer-title">
        <div>
          <h2>Новая задача</h2>
          <p>Дата постановки появится автоматически, а пустой дедлайн станет +7 рабочих дней.</p>
        </div>
        <button className="primary-button" type="button" onClick={onCreate}>
          <Plus size={17} />
          Добавить
        </button>
      </div>

      <div className="form-grid">
        <label className="field wide">
          <span>Задача</span>
          <input
            value={draft.title}
            onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))}
            placeholder="Например: подготовить SEO-отчет"
          />
        </label>
        <label className="field">
          <span>Проект</span>
          <select
            value={draft.projectId}
            onChange={(event) => onDraftChange((current) => ({ ...current, projectId: event.target.value }))}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Дедлайн</span>
          <input
            type="date"
            value={draft.deadline}
            onChange={(event) => onDraftChange((current) => ({ ...current, deadline: event.target.value }))}
          />
        </label>
        <label className="field wide">
          <span>Описание</span>
          <input
            value={draft.description}
            onChange={(event) => onDraftChange((current) => ({ ...current, description: event.target.value }))}
            placeholder="Короткий контекст, чтобы не искать вводные в переписке"
          />
        </label>
      </div>

      <div className="owner-picker">
        <label className="toggle-line">
          <input
            type="checkbox"
            checked={draft.multi}
            onChange={(event) =>
              onDraftChange((current) => ({
                ...current,
                multi: event.target.checked,
                ownerIds: event.target.checked ? current.ownerIds : current.ownerIds.slice(0, 1),
              }))
            }
          />
          <span>Несколько ответственных</span>
        </label>
        <div className="chip-row" role="group" aria-label="Ответственные">
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              className={`person-chip ${draft.ownerIds.includes(person.id) ? 'is-picked' : ''}`}
              onClick={() => onOwnerToggle(person.id)}
            >
              <span>{person.name.slice(0, 1)}</span>
              {person.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

type ProjectGroupProps = {
  project: Project;
  projects: Project[];
  tasks: Task[];
  linkRows: LinkPurchase[];
  linkSummary?: LinkPurchaseSummary;
  contentTopics: ContentPlanTopic[];
  contentSummary?: ContentPlanSummary;
  contentSource?: ContentPlanSource;
  workPlans: WorkPlanSource[];
  auditSources: ClientAuditSource[];
  promotionResults: PromotionResultSource[];
  leadAnalytics?: LeadAnalyticsSummary;
  clientLinks?: ClientQuickLinks;
  linkLoadStatus: LinkLoadStatus;
  linkError: string;
  linkUpdatedAt: string;
  contentLoadStatus: LinkLoadStatus;
  contentError: string;
  contentUpdatedAt: string;
  leadLoadStatus: LinkLoadStatus;
  leadError: string;
  leadUpdatedAt: string;
  activeTab: ProjectTab;
  collapsed: boolean;
  people: Person[];
  peopleById: Map<string, Person>;
  expanded: Set<string>;
  onTabChange: (tab: ProjectTab) => void;
  onReloadLinks: () => void;
  onReloadContent: () => void;
  onReloadLeads: () => void;
  onToggleCollapsed: () => void;
  onToggleExpanded: (taskId: string) => void;
  onToggleTimeline: (taskId: string, checked: boolean) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onTimelineStatusChange: (taskId: string, itemId: string, status: Status) => void;
  onTaskUpdate: (taskId: string, updater: (task: Task) => Task, action?: string) => void;
};

function ProjectGroup({
  project,
  projects,
  tasks,
  linkRows,
  linkSummary,
  contentTopics,
  contentSummary,
  contentSource,
  workPlans,
  auditSources,
  promotionResults,
  leadAnalytics,
  clientLinks,
  linkLoadStatus,
  linkError,
  linkUpdatedAt,
  contentLoadStatus,
  contentError,
  contentUpdatedAt,
  leadLoadStatus,
  leadError,
  leadUpdatedAt,
  activeTab,
  collapsed,
  people,
  peopleById,
  expanded,
  onTabChange,
  onReloadLinks,
  onReloadContent,
  onReloadLeads,
  onToggleCollapsed,
  onToggleExpanded,
  onToggleTimeline,
  onStatusChange,
  onTimelineStatusChange,
  onTaskUpdate,
}: ProjectGroupProps) {
  const panelId = `project-panel-${project.id}`;
  const taskSummary = buildProjectTaskSummary(project, tasks, peopleById);
  const projectSummary = [
    `${taskSummary.done}/${taskSummary.total} выполнено`,
    `${taskSummary.open} не выполнено`,
    `${taskSummary.overdue} просрочено`,
    `${linkRows.length} ссылок`,
    `${workPlans.length} планов`,
    `${contentTopics.length} тем`,
    `${promotionResults.length + (leadAnalytics?.sourceCount ?? 0)} результатов`,
    `${auditSources.length + 1} аудитов`,
  ].join(' · ');

  return (
    <article
      className={`project-group ${collapsed ? 'is-collapsed' : ''}`}
      style={{ '--project-color': project.color } as CSSProperties}
    >
      <div className="project-heading">
        <div className="project-title-block">
          <span className="project-dot" />
          <h3>{project.name}</h3>
        </div>
        <div className="project-heading-actions">
          <button
            className="project-collapse-button"
            type="button"
            aria-expanded={!collapsed}
            aria-controls={panelId}
            onClick={onToggleCollapsed}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            <span>{collapsed ? 'Развернуть' : 'Свернуть'}</span>
          </button>
          <div className="project-tabs" role="group" aria-label={`Разделы проекта ${project.name}`}>
            <button
              className={activeTab === 'tasks' ? 'is-active' : ''}
              type="button"
              onClick={() => onTabChange('tasks')}
            >
              Задачи <em>{tasks.length}</em>
            </button>
            <button
              className={activeTab === 'links' ? 'is-active' : ''}
              type="button"
              onClick={() => onTabChange('links')}
            >
              Закуп ссылок <em>{linkRows.length}</em>
            </button>
            <button
              className={activeTab === 'plans' ? 'is-active' : ''}
              type="button"
              onClick={() => onTabChange('plans')}
            >
              План работ <em>{workPlans.length}</em>
            </button>
            <button
              className={activeTab === 'content' ? 'is-active' : ''}
              type="button"
              onClick={() => onTabChange('content')}
            >
              Контент <em>{contentTopics.length}</em>
            </button>
            <button
              className={activeTab === 'results' ? 'is-active' : ''}
              type="button"
              onClick={() => onTabChange('results')}
            >
              Результаты <em>{promotionResults.length + (leadAnalytics?.sourceCount ?? 0)}</em>
            </button>
            <button
              className={activeTab === 'audit' ? 'is-active' : ''}
              type="button"
              onClick={() => onTabChange('audit')}
            >
              Аудит <em>{auditSources.length + 1}</em>
            </button>
          </div>
        </div>
      </div>

      {collapsed ? (
        <div className="project-collapsed-summary" id={panelId}>
          <span>Свернуто</span>
          <strong>{projectSummary}</strong>
        </div>
      ) : (
        <div className="project-body" id={panelId}>
          {clientLinks && <ClientQuickLinksBar links={clientLinks} />}

          {activeTab === 'tasks' &&
            (tasks.length === 0 ? (
              <div className="empty-row">Пока нет задач по этому проекту.</div>
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    project={project}
                    projects={projects}
                    people={people}
                    peopleById={peopleById}
                    expanded={expanded.has(task.id)}
                    onToggleExpanded={onToggleExpanded}
                    onToggleTimeline={onToggleTimeline}
                    onStatusChange={onStatusChange}
                    onTimelineStatusChange={onTimelineStatusChange}
                    onTaskUpdate={onTaskUpdate}
                  />
                ))}
              </div>
            ))}

          {activeTab === 'links' && (
            <LinkPurchasePanel
              project={project}
              rows={linkRows}
              summary={linkSummary}
              loadStatus={linkLoadStatus}
              error={linkError}
              updatedAt={linkUpdatedAt}
              onReload={onReloadLinks}
            />
          )}

          {activeTab === 'plans' && <WorkPlanPanel project={project} plans={workPlans} />}

          {activeTab === 'content' && (
            <ContentPlanPanel
              project={project}
              source={contentSource}
              topics={contentTopics}
              summary={contentSummary}
              loadStatus={contentLoadStatus}
              error={contentError}
              updatedAt={contentUpdatedAt}
              onReload={onReloadContent}
            />
          )}

          {activeTab === 'results' && (
            <PromotionResultsPanel
              project={project}
              sources={promotionResults}
              leadAnalytics={leadAnalytics}
              leadLoadStatus={leadLoadStatus}
              leadError={leadError}
              leadUpdatedAt={leadUpdatedAt}
              onReloadLeads={onReloadLeads}
            />
          )}

          {activeTab === 'audit' && <AuditPanel project={project} sources={auditSources} />}
        </div>
      )}
    </article>
  );
}

function ClientQuickLinksBar({ links }: { links: ClientQuickLinks }) {
  return (
    <div className="client-quick-links" aria-label={`Быстрые ссылки клиента ${links.clientName}`}>
      <span>{links.clientName}</span>
      {links.siteUrl !== '#' && (
        <a href={links.siteUrl} target="_blank" rel="noreferrer" title={links.siteUrl}>
          <ExternalLink size={14} />
          Сайт
        </a>
      )}
      {links.reports.map((report) => (
        <a href={report.url} target="_blank" rel="noreferrer" title={report.title} key={report.id}>
          <FileText size={14} />
          {report.label} · {report.reportDate}
        </a>
      ))}
    </div>
  );
}

function LinkPurchasePanel({
  project,
  rows,
  summary,
  loadStatus,
  error,
  updatedAt,
  onReload,
}: {
  project: Project;
  rows: LinkPurchase[];
  summary?: LinkPurchaseSummary;
  loadStatus: LinkLoadStatus;
  error: string;
  updatedAt: string;
  onReload: () => void;
}) {
  const visibleRows = rows.slice(0, 12);
  const safeSummary = summary ?? summarizeLinkPurchases(rows);

  return (
    <div className="link-panel">
      <div className="link-panel-head">
        <div>
          <strong>Закуп ссылок: {project.name}</strong>
          <p>
            Источник: вкладка `План` в Google Sheets
            {updatedAt ? ` · обновлено ${updatedAt}` : ''}
          </p>
        </div>
        <div className="link-actions">
          <a href={LINK_SOURCE_SPREADSHEET_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={15} />
            Таблица
          </a>
          <button type="button" onClick={onReload} disabled={loadStatus === 'loading'}>
            <RefreshCw size={15} />
            {loadStatus === 'loading' ? 'Обновляю' : 'Обновить'}
          </button>
        </div>
      </div>

      {loadStatus === 'error' && (
        <div className="sync-state is-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loadStatus === 'loading' && rows.length === 0 && (
        <div className="sync-state">
          <RefreshCw size={16} />
          <span>Тяну данные из Google Sheets...</span>
        </div>
      )}

      {rows.length === 0 && loadStatus !== 'loading' ? (
        <div className="empty-row">
          В таблице пока нет строк, которые склеиваются с проектом {project.name}.
        </div>
      ) : (
        <>
          <div className="link-summary-grid">
            <LinkStat label="строк" value={String(safeSummary.count)} />
            <LinkStat label="план" value={formatMoney(safeSummary.planCost)} />
            <LinkStat label="факт" value={formatMoney(safeSummary.factCost)} />
            <LinkStat label="размещено" value={String(safeSummary.placed)} tone="success" />
            <LinkStat label="купить" value={String(safeSummary.needToBuy)} tone="warning" />
          </div>

          <div className="link-table" role="table" aria-label={`Закуп ссылок ${project.name}`}>
            <div className="link-table-row link-table-head" role="row">
              <span>Месяц</span>
              <span>Донор / URL</span>
              <span>Статус</span>
              <span>План</span>
              <span>Факт</span>
            </div>
            {visibleRows.map((row) => (
              <div className="link-table-row" role="row" key={row.id}>
                <span>
                  {row.month || '—'}
                  {row.order ? <em>#{row.order}</em> : null}
                </span>
                <span className="link-donor">
                  <strong>{row.donor || 'Без донора'}</strong>
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noreferrer">
                      {row.url}
                    </a>
                  ) : (
                    <small>URL пока не внесен</small>
                  )}
                </span>
                <span>
                  <StatusBadge status={row.status} urgency={row.urgency} />
                </span>
                <span>{formatMoney(row.planCost)}</span>
                <span>{formatMoney(row.factCost)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WorkPlanPanel({ project, plans }: { project: Project; plans: WorkPlanSource[] }) {
  return (
    <div className="work-plan-panel">
      <div className="link-panel-head">
        <div>
          <strong>План работ: {project.name}</strong>
          <p>Планы по клиентам, Google Docs и контент-таблицы, привязанные к проекту.</p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="empty-row">Для этого проекта пока не добавлены источники планов работ.</div>
      ) : (
        <div className="work-plan-grid">
          {plans.map((plan) => (
            <article className="work-plan-card" key={plan.id}>
              <div className="work-plan-kind">
                {plan.kind === 'doc' ? <FileText size={15} /> : <FileSpreadsheet size={15} />}
                <span>{plan.kind === 'doc' ? 'Google Docs' : 'Google Sheets'}</span>
              </div>
              <h4>{plan.title}</h4>
              <p>{plan.documentTitle}</p>
              <div className="work-plan-meta">
                <span>{plan.clientName}</span>
                <span>{plan.period}</span>
                <span>{countWorkPlanItems(plan)} пунктов</span>
              </div>
              {plan.note && <small>{plan.note}</small>}
              {plan.sections && plan.sections.length > 0 && (
                <div className="work-plan-sections">
                  {plan.sections.map((section, index) => (
                    <details key={section.label} open={index === 0}>
                      <summary>
                        <span>{section.label}</span>
                        <em>{section.items.length}</em>
                      </summary>
                      <ul>
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
              <div className="link-actions">
                <a href={plan.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} />
                  Открыть
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentPlanPanel({
  project,
  source,
  topics,
  summary,
  loadStatus,
  error,
  updatedAt,
  onReload,
}: {
  project: Project;
  source?: ContentPlanSource;
  topics: ContentPlanTopic[];
  summary?: ContentPlanSummary;
  loadStatus: LinkLoadStatus;
  error: string;
  updatedAt: string;
  onReload: () => void;
}) {
  const groupedTopics = useMemo(() => groupContentTopicsByMonth(topics), [topics]);
  const openMonth = summary?.nextTopic?.month ?? groupedTopics[0]?.month;
  const sourceErrorText = source && error ? `Не удалось загрузить этот контент-план: ${error}` : '';
  const statusText =
    loadStatus === 'loading'
      ? 'Загружаю темы из Google Sheets...'
      : sourceErrorText
        ? sourceErrorText
        : loadStatus === 'error'
        ? error
        : updatedAt
          ? `Обновлено ${updatedAt}`
          : 'Контент-план будет загружен автоматически.';

  return (
    <div className="content-plan-panel">
      <div className="link-panel-head">
        <div>
          <strong>Контент-план: {project.name}</strong>
          <p>Ежедневные темы по клиенту, автоматически собранные из Google Sheets.</p>
        </div>
        <div className="link-actions">
          <button type="button" onClick={onReload} disabled={loadStatus === 'loading'}>
            <RefreshCw size={15} />
            Обновить
          </button>
          {source && (
            <a href={source.spreadsheetUrl} target="_blank" rel="noreferrer">
              <FileSpreadsheet size={15} />
              Таблица
            </a>
          )}
        </div>
      </div>

      <div className={`sync-state ${loadStatus === 'error' || sourceErrorText ? 'is-error' : ''}`}>
        {loadStatus === 'loading' ? <RefreshCw size={15} className="spin" /> : <FileSpreadsheet size={15} />}
        <span>{statusText}</span>
      </div>

      {!source ? (
        <div className="empty-row">Для этого проекта пока не добавлен контент-план.</div>
      ) : (
        <>
          <div className="content-plan-stats">
            <div>
              <span>Темы</span>
              <strong>{summary?.count ?? topics.length}</strong>
            </div>
            <div>
              <span>Период</span>
              <strong>{source.period}</strong>
            </div>
            <div>
              <span>Месяцы</span>
              <strong>{summary?.months.join(', ') || 'пока нет данных'}</strong>
            </div>
            <div>
              <span>Высокий приоритет</span>
              <strong>{summary?.highPriority ?? 0}</strong>
            </div>
          </div>

          <article className="content-plan-feature">
            <span>{source.clientName}</span>
            <h4>{summary?.nextTopic?.topic ?? source.title}</h4>
            <p>
              {summary?.nextTopic
                ? formatContentTopicMeta(summary.nextTopic, true)
                : source.note}
            </p>
          </article>

          {groupedTopics.length === 0 ? (
            <div className="empty-row">
              {sourceErrorText ? 'Проверь доступ к таблице или актуальность ссылки.' : 'Темы еще загружаются или таблица пока не вернула строки.'}
            </div>
          ) : (
            <div className="content-months">
              {groupedTopics.map((group) => (
                <details key={group.month} open={group.month === openMonth}>
                  <summary>
                    <span>{group.month}</span>
                    <em>{group.items.length}</em>
                  </summary>
                  <div className="content-topic-list">
                    {group.items.map((topic) => (
                      <article className="content-topic-row" key={topic.id}>
                        <time dateTime={topic.isoDate}>{topic.date}</time>
                        <div>
                          <strong>{topic.topic}</strong>
                          <p>{formatContentTopicMeta(topic)}</p>
                          {topic.internalUrl && (
                            <a href={topic.internalUrl} target="_blank" rel="noreferrer">
                              Открыть URL
                            </a>
                          )}
                        </div>
                        {topic.priority && <span>{topic.priority}</span>}
                      </article>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatContentTopicMeta(topic: ContentPlanTopic, includeDate = false) {
  const parts = [
    includeDate ? topic.date : '',
    topic.service,
    topic.format,
    topic.block,
    topic.intent,
    topic.materialType,
    topic.audience,
    topic.status && topic.status !== 'Без статуса' ? topic.status : '',
  ].filter(Boolean);

  if (parts.length) return parts.join(' · ');
  if (topic.internalUrl) return 'URL указан в таблице';
  return 'Дополнительные поля не заполнены';
}

function countWorkPlanItems(plan: WorkPlanSource) {
  return plan.sections?.reduce((sum, section) => sum + section.items.length, 0) ?? 0;
}

function groupContentTopicsByMonth(topics: ContentPlanTopic[]) {
  const map = new Map<string, ContentPlanTopic[]>();
  topics.forEach((topic) => {
    const key = topic.month || 'Без месяца';
    const current = map.get(key) ?? [];
    current.push(topic);
    map.set(key, current);
  });
  return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
}

function PromotionResultsPanel({
  project,
  sources,
  leadAnalytics,
  leadLoadStatus,
  leadError,
  leadUpdatedAt,
  onReloadLeads,
}: {
  project: Project;
  sources: PromotionResultSource[];
  leadAnalytics?: LeadAnalyticsSummary;
  leadLoadStatus: LinkLoadStatus;
  leadError: string;
  leadUpdatedAt: string;
  onReloadLeads: () => void;
}) {
  const source = sources[0];
  const leadQualityRate = leadAnalytics?.total ? Math.round((leadAnalytics.quality / leadAnalytics.total) * 100) : 0;
  const leadWorkable = (leadAnalytics?.quality ?? 0) + (leadAnalytics?.inWork ?? 0);
  const leadWorkableRate = leadAnalytics?.total ? Math.round((leadWorkable / leadAnalytics.total) * 100) : 0;

  return (
    <div className="promotion-panel">
      <div className="link-panel-head">
        <div>
          <strong>Результаты продвижения: {project.name}</strong>
          <p>Отдельная вкладка отчета под заявки, позиции / ключевые запросы и достижения целей на сайте.</p>
        </div>
        {source && (
          <div className="link-actions">
            <a href={source.url} target="_blank" rel="noreferrer">
              <FileSpreadsheet size={15} />
              Таблица Метрики
            </a>
          </div>
        )}
      </div>

      <div className="promotion-result-grid">
        <article className={leadAnalytics ? 'promotion-result-card' : 'promotion-result-card is-muted'}>
          <span>Заявки</span>
          {leadAnalytics ? (
            <>
              <strong>{leadAnalytics.total} лидов</strong>
              <p>
                Качественные: {leadAnalytics.quality} ({leadQualityRate}%). Качественные + в работе:{' '}
                {leadWorkable} ({leadWorkableRate}%).
              </p>
              <div className="lead-summary-mini">
                <em>{leadAnalytics.inWork} в работе</em>
                <em>{leadAnalytics.rejected} отказ / нецелевые</em>
                {leadAnalytics.unknown > 0 && <em>{leadAnalytics.unknown} без оценки</em>}
              </div>
            </>
          ) : (
            <>
              <strong>{leadLoadStatus === 'loading' ? 'Загрузка' : 'Данных пока нет'}</strong>
              <p>
                {leadError
                  ? `Источник заявок не загрузился: ${leadError}`
                  : 'Когда появится источник по заявкам, сюда попадут количество и оценка качества лидов.'}
              </p>
              <div className="link-actions">
                <button type="button" onClick={onReloadLeads}>
                  <RefreshCw size={15} />
                  Проверить заявки
                </button>
              </div>
            </>
          )}
        </article>

        <article className="promotion-result-card">
          <span>Позиции / запросы</span>
          {source ? (
            <>
              <strong>{source.recordsLabel}</strong>
              <p>
                {source.spreadsheetTitle} · {source.periodLabel}
              </p>
              <div className="promotion-query-list">
                {source.sampleQueries.map((query) => (
                  <em key={query}>{query}</em>
                ))}
              </div>
            </>
          ) : (
            <>
              <strong>Источник не подключен</strong>
              <p>Для этого проекта пока нет таблицы с ключевыми запросами или позициями.</p>
            </>
          )}
        </article>

        <article className="promotion-result-card">
          <span>Цели на сайте</span>
          {source ? (
            <>
              <strong>{source.goalExamples.length ? `${source.goalExamples.length} примера` : 'Колонка готова'}</strong>
              <p>В источнике есть поле “Достижение цели”, его можно использовать для итогового отчета.</p>
              <div className="promotion-goals">
                {(source.goalExamples.length ? source.goalExamples : ['Достижения целей будут подтягиваться из таблицы']).map(
                  (goal) => (
                    <em key={goal}>{goal}</em>
                  ),
                )}
              </div>
            </>
          ) : (
            <>
              <strong>Источник не подключен</strong>
              <p>Когда появится таблица целей, она попадет в эту часть отчета.</p>
            </>
          )}
        </article>
      </div>

      {leadAnalytics && (
        <article className="promotion-source-card lead-source-card">
          <div>
            <span>{leadAnalytics.clientName}</span>
            <strong>Источники заявок: {leadAnalytics.sourceCount}</strong>
            <p>
              {leadAnalytics.note} {leadUpdatedAt && `Обновлено: ${leadUpdatedAt}.`}
            </p>
          </div>
          <div className="lead-source-grid">
            {leadAnalytics.sources.map((leadSource) => (
              <div key={leadSource.id}>
                <strong>{leadSource.title}</strong>
                <span>{leadSource.periodLabel}</span>
                <em>
                  {leadSource.total} лидов · {leadSource.quality} кач. · {leadSource.inWork} в работе
                </em>
                {leadSource.url && (
                  <a href={leadSource.url} target="_blank" rel="noreferrer">
                    Открыть таблицу
                  </a>
                )}
                {leadSource.fileName && <small>{leadSource.fileName}</small>}
              </div>
            ))}
          </div>
        </article>
      )}

      {source && (
        <article className="promotion-source-card">
          <div>
            <span>{source.clientName}</span>
            <strong>{source.note}</strong>
          </div>
          <div className="promotion-field-list">
            {source.fields.map((field) => (
              <em key={field}>{field}</em>
            ))}
          </div>
        </article>
      )}

      {!source && !leadAnalytics && (
        <div className="empty-row">Для проекта {project.name} пока нет отдельного источника по результатам продвижения.</div>
      )}
    </div>
  );
}

function AuditPanel({ project, sources }: { project: Project; sources: ClientAuditSource[] }) {
  const intake = sources[0];

  return (
    <div className="audit-panel">
      <div className="link-panel-head">
        <div>
          <strong>Изначальный аудит: {project.name}</strong>
          <p>Сначала аккаунт собирает вводные по клиенту, затем SEO-специалист проходит стартовый чек-лист.</p>
        </div>
      </div>

      <div className="audit-flow">
        <article className="audit-card">
          <div className="audit-step">
            <span>1</span>
            Сбор инфо с клиента
          </div>
          <h4>{intake ? intake.clientName : 'Вкладка клиента не добавлена'}</h4>
          <p>
            Ответственный этапа: <strong>Кристина</strong>, аккаунт менеджер. Данные передаются SEO-специалисту
            после заполнения.
          </p>
          {intake ? (
            <>
              <div className="audit-fields">
                {intake.fields.map((field) => (
                  <span key={field}>{field}</span>
                ))}
              </div>
              <div className="link-actions">
                <a href={intake.url} target="_blank" rel="noreferrer">
                  <FileSpreadsheet size={15} />
                  Анкета
                </a>
              </div>
            </>
          ) : (
            <div className="empty-row">В общей таблице пока нет вкладки для этого проекта.</div>
          )}
        </article>

        <article className="audit-card">
          <div className="audit-step">
            <span>2</span>
            SEO-аудит нового клиента
          </div>
          <h4>{SEO_AUDIT_CHECKLIST.title}</h4>
          <p>
            Ответственный этапа: <strong>Николай</strong>, SEO-специалист. В шаблоне {SEO_AUDIT_CHECKLIST.totalChecks}{' '}
            проверок от доступов до итогового плана работ.
          </p>
          <div className="audit-fields audit-fields-wide">
            {SEO_AUDIT_CHECKLIST.sections.map((section) => (
              <span key={section}>{section}</span>
            ))}
          </div>
          <div className="link-actions">
            <a href={SEO_AUDIT_CHECKLIST.url} target="_blank" rel="noreferrer">
              <FileSpreadsheet size={15} />
              Чек-лист
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}

type TaskRowProps = {
  task: Task;
  project: Project;
  projects: Project[];
  people: Person[];
  peopleById: Map<string, Person>;
  expanded: boolean;
  onToggleExpanded: (taskId: string) => void;
  onToggleTimeline: (taskId: string, checked: boolean) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onTimelineStatusChange: (taskId: string, itemId: string, status: Status) => void;
  onTaskUpdate: (taskId: string, updater: (task: Task) => Task, action?: string) => void;
};

type TaskEditDraft = {
  projectId: string;
  title: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  status: Status;
  ownerIds: string[];
  createdAt: string;
  deadline: string;
  timelineEnabled: boolean;
  timeline: TimelineItem[];
};

function makeTaskEditDraft(task: Task): TaskEditDraft {
  return {
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    sourceLabel: task.sourceLabel ?? '',
    sourceUrl: task.sourceUrl ?? '',
    status: task.status,
    ownerIds: task.ownerIds,
    createdAt: task.createdAt,
    deadline: task.deadline,
    timelineEnabled: task.timelineEnabled,
    timeline: task.timeline,
  };
}

function TaskRow({
  task,
  project,
  projects,
  people,
  peopleById,
  expanded,
  onToggleExpanded,
  onToggleTimeline,
  onStatusChange,
  onTaskUpdate,
}: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [draft, setDraft] = useState<TaskEditDraft>(() => makeTaskEditDraft(task));
  const [timelineDraft, setTimelineDraft] = useState<TimelineItem[]>(() => task.timeline);
  const [timelineDraftDirty, setTimelineDraftDirty] = useState(false);
  const owners = task.ownerIds.map((id) => peopleById.get(id)).filter(Boolean) as Person[];
  const isOverdue = task.status !== 'done' && Boolean(task.deadline) && task.deadline < todayIso();

  useEffect(() => {
    if (!isEditing) setDraft(makeTaskEditDraft(task));
  }, [isEditing, task]);

  useEffect(() => {
    if (!timelineDraftDirty) setTimelineDraft(task.timeline);
  }, [task.timeline, timelineDraftDirty]);

  const saveTaskEdit = () => {
    const title = draft.title.trim();
    if (!title) return;

    const createdAt = draft.createdAt || task.createdAt || todayIso();
    const deadline = draft.deadline || getDefaultTaskDeadline(createdAt);
    const ownerIds = draft.ownerIds.length ? draft.ownerIds : task.ownerIds;
    const fallbackOwnerId = ownerIds[0] ?? people[0]?.id ?? '';
    const timeline = draft.timelineEnabled
      ? draft.timeline.map((item, index) => ({
          ...item,
          id: item.id || uid('timeline'),
          title: item.title.trim() || `Этап ${index + 1}`,
          ownerId: item.ownerId || fallbackOwnerId,
          dueDate: item.dueDate || deadline,
          completedAt: item.status === 'done' ? item.completedAt ?? todayIso() : undefined,
        }))
      : [];

    onTaskUpdate(
      task.id,
      (current) => ({
        ...current,
        projectId: draft.projectId || current.projectId,
        title,
        description: draft.description.trim(),
        sourceLabel: draft.sourceLabel.trim() || undefined,
        sourceUrl: draft.sourceUrl.trim() || undefined,
        status: draft.status,
        ownerIds,
        createdAt,
        deadline,
        completedAt: draft.status === 'done' ? current.completedAt ?? todayIso() : undefined,
        timelineEnabled: draft.timelineEnabled,
        timeline,
      }),
      'Редактирование задачи',
    );
    setTimelineDraft(timeline);
    setTimelineDraftDirty(false);
    setIsEditing(false);
  };

  const updateTimelineDraft = (updater: (current: TimelineItem[]) => TimelineItem[]) => {
    setTimelineDraft((current) => updater(current));
    setTimelineDraftDirty(true);
  };

  const updateTimelineDraftItem = (itemId: string, updater: (item: TimelineItem) => TimelineItem) => {
    updateTimelineDraft((current) => current.map((item) => (item.id === itemId ? updater(item) : item)));
  };

  const addTimelineDraftItem = () => {
    const ownerId = task.ownerIds[0] ?? people[0]?.id ?? '';
    const dueDate = task.deadline || getDefaultTaskDeadline(task.createdAt || todayIso());
    updateTimelineDraft((current) => [
      ...current,
      {
        id: uid('timeline'),
        title: `Новый пункт ${current.length + 1}`,
        ownerId,
        status: 'planned',
        dueDate,
      },
    ]);
  };

  const removeTimelineDraftItem = (itemId: string) => {
    updateTimelineDraft((current) => current.filter((item) => item.id !== itemId));
  };

  const resetTimelineDraft = () => {
    setTimelineDraft(task.timeline);
    setTimelineDraftDirty(false);
  };

  const saveTimelineDraft = () => {
    const createdAt = task.createdAt || todayIso();
    const deadline = task.deadline || getDefaultTaskDeadline(createdAt);
    const fallbackOwnerId = task.ownerIds[0] ?? people[0]?.id ?? '';
    const timeline = timelineDraft.map((item, index) => ({
      ...item,
      id: item.id || uid('timeline'),
      title: item.title.trim() || `Пункт ${index + 1}`,
      ownerId: item.ownerId || fallbackOwnerId,
      dueDate: item.dueDate || deadline,
      completedAt: item.status === 'done' ? item.completedAt ?? todayIso() : undefined,
    }));

    onTaskUpdate(
      task.id,
      (current) => ({
        ...current,
        timelineEnabled: true,
        timeline,
      }),
      'Редактирование хронологии',
    );
    setTimelineDraft(timeline);
    setTimelineDraftDirty(false);
  };

  return (
    <div className={`task-row ${task.status}`}>
      <div className="task-main">
        <button
          className="expand-button"
          type="button"
          onClick={() => onToggleExpanded(task.id)}
          disabled={!task.timelineEnabled}
          aria-label={expanded ? 'Свернуть хронологию' : 'Развернуть хронологию'}
        >
          {expanded && task.timelineEnabled ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
        </button>

        <div className="task-copy">
          <div className="task-title-line">
            <span className="mini-dot" style={{ background: project.color }} />
            <strong>{task.title}</strong>
            {isOverdue && (
              <span className="risk-note">
                <AlertTriangle size={14} />
                просрочено
              </span>
            )}
          </div>
          {task.description && <p>{task.description}</p>}
          <div className="owner-line">
            {owners.map((person) => (
              <span key={person.id} className="avatar-chip">
                <span>{person.name.slice(0, 1)}</span>
                {person.name}
              </span>
            ))}
            {task.sourceUrl && (
              <a
                className="task-source-link"
                href={task.sourceUrl}
                target="_blank"
                rel="noreferrer"
                title={task.sourceUrl}
              >
                <ExternalLink size={14} />
                Открыть {task.sourceLabel ?? 'источник'}
              </a>
            )}
          </div>
        </div>

        <div className="task-meta">
          <label>
            <span>Статус</span>
            <select value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value as Status)}>
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span>Поставлена</span>
            <strong>{formatDate(task.createdAt)}</strong>
          </div>
          <div>
            <span>Дедлайн</span>
            <strong>{formatDate(task.deadline)}</strong>
          </div>
        </div>

        <div className="task-controls">
          <label className="timeline-toggle">
            <input
              type="checkbox"
              checked={task.timelineEnabled}
              onChange={(event) => onToggleTimeline(task.id, event.target.checked)}
            />
            <span>Хронология</span>
          </label>
          <button className="task-action-button" type="button" onClick={() => setIsEditing((value) => !value)}>
            <Pencil size={14} />
            {isEditing ? 'Закрыть' : 'Редактировать'}
          </button>
          <button
            className={`task-action-button ${showHistory ? 'is-active' : ''}`}
            type="button"
            onClick={() => setShowHistory((value) => !value)}
          >
            <History size={14} />
            История
          </button>
        </div>
      </div>

      {isEditing && (
        <TaskEditPanel
          draft={draft}
          projects={projects}
          people={people}
          onDraftChange={setDraft}
          onSave={saveTaskEdit}
          onCancel={() => {
            setDraft(makeTaskEditDraft(task));
            setIsEditing(false);
          }}
        />
      )}

      {showHistory && <TaskHistoryPanel task={task} />}

      {task.timelineEnabled && expanded && (
        <div className="timeline-list">
          <div className="timeline-toolbar">
            <div>
              <strong>Пункты хронологии</strong>
              <span>{timelineDraft.length}</span>
            </div>
            <div className="timeline-toolbar-actions">
              <button className="task-action-button" type="button" onClick={addTimelineDraftItem}>
                <Plus size={14} />
                Добавить пункт
              </button>
              <button
                className="task-action-button"
                type="button"
                onClick={saveTimelineDraft}
                disabled={!timelineDraftDirty}
              >
                <Save size={14} />
                Сохранить
              </button>
              <button
                className="task-action-button"
                type="button"
                onClick={resetTimelineDraft}
                disabled={!timelineDraftDirty}
              >
                <X size={14} />
                Отмена
              </button>
            </div>
          </div>
          {timelineDraft.length === 0 && <div className="empty-row">Пунктов пока нет.</div>}
          {timelineDraft.map((item, index) => {
            const owner = peopleById.get(item.ownerId);
            return (
              <div key={item.id} className="timeline-item editable">
                <span className="timeline-rail" />
                <label className="timeline-inline-field timeline-title-field">
                  <span>Пункт</span>
                  <input
                    value={item.title}
                    onChange={(event) =>
                      updateTimelineDraftItem(item.id, (current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder={`Пункт ${index + 1}`}
                  />
                </label>
                <label className="timeline-inline-field">
                  <span>Ответственный</span>
                  <select
                    value={item.ownerId}
                    onChange={(event) =>
                      updateTimelineDraftItem(item.id, (current) => ({ ...current, ownerId: event.target.value }))
                    }
                  >
                    <option value="">Без ответственного</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="timeline-inline-field">
                  <span>Дедлайн</span>
                  <input
                    type="date"
                    value={item.dueDate}
                    onChange={(event) =>
                      updateTimelineDraftItem(item.id, (current) => ({ ...current, dueDate: event.target.value }))
                    }
                  />
                </label>
                <label className="timeline-inline-field">
                  <span>Статус</span>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      updateTimelineDraftItem(item.id, (current) => ({ ...current, status: event.target.value as Status }))
                    }
                  >
                    {statusOrder.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="task-icon-button"
                  type="button"
                  aria-label={`Удалить пункт ${index + 1}`}
                  onClick={() => removeTimelineDraftItem(item.id)}
                >
                  <Trash2 size={15} />
                </button>
                <p className="timeline-inline-summary">
                  {owner?.name ?? 'Без ответственного'} · дедлайн {formatDate(item.dueDate)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskEditPanel({
  draft,
  projects,
  people,
  onDraftChange,
  onSave,
  onCancel,
}: {
  draft: TaskEditDraft;
  projects: Project[];
  people: Person[];
  onDraftChange: Dispatch<SetStateAction<TaskEditDraft>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const setTimelineItem = (itemId: string, updater: (item: TimelineItem) => TimelineItem) => {
    onDraftChange((current) => ({
      ...current,
      timeline: current.timeline.map((item) => (item.id === itemId ? updater(item) : item)),
    }));
  };

  const toggleOwner = (ownerId: string) => {
    onDraftChange((current) => {
      const exists = current.ownerIds.includes(ownerId);
      const ownerIds = exists
        ? current.ownerIds.filter((id) => id !== ownerId)
        : [...current.ownerIds, ownerId];
      return { ...current, ownerIds: ownerIds.length ? ownerIds : current.ownerIds };
    });
  };

  const addTimelineItem = () => {
    onDraftChange((current) => {
      const ownerId = current.ownerIds[0] ?? people[0]?.id ?? '';
      const dueDate = current.deadline || getDefaultTaskDeadline(current.createdAt || todayIso());
      return {
        ...current,
        timelineEnabled: true,
        timeline: [
          ...current.timeline,
          {
            id: uid('timeline'),
            title: 'Новый этап',
            ownerId,
            status: 'planned',
            dueDate,
          },
        ],
      };
    });
  };

  return (
    <div className="task-edit-panel">
      <div className="task-edit-grid">
        <label className="field wide">
          <span>Название</span>
          <input
            value={draft.title}
            onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>Проект</span>
          <select
            value={draft.projectId}
            onChange={(event) => onDraftChange((current) => ({ ...current, projectId: event.target.value }))}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Статус</span>
          <select
            value={draft.status}
            onChange={(event) => onDraftChange((current) => ({ ...current, status: event.target.value as Status }))}
          >
            {statusOrder.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Дата постановки</span>
          <input
            type="date"
            value={draft.createdAt}
            onChange={(event) =>
              onDraftChange((current) => ({
                ...current,
                createdAt: event.target.value,
                deadline: current.deadline || getDefaultTaskDeadline(event.target.value),
              }))
            }
          />
        </label>
        <label className="field">
          <span>Дедлайн</span>
          <input
            type="date"
            value={draft.deadline}
            onChange={(event) => onDraftChange((current) => ({ ...current, deadline: event.target.value }))}
          />
        </label>
        <label className="field wide">
          <span>Описание</span>
          <textarea
            value={draft.description}
            onChange={(event) => onDraftChange((current) => ({ ...current, description: event.target.value }))}
            rows={3}
          />
        </label>
        <label className="field">
          <span>Текст кнопки источника</span>
          <input
            value={draft.sourceLabel}
            onChange={(event) => onDraftChange((current) => ({ ...current, sourceLabel: event.target.value }))}
            placeholder="например: отчет"
          />
        </label>
        <label className="field wide">
          <span>Ссылка источника</span>
          <input
            value={draft.sourceUrl}
            onChange={(event) => onDraftChange((current) => ({ ...current, sourceUrl: event.target.value }))}
            placeholder="https://..."
          />
        </label>
      </div>

      <div className="task-edit-block">
        <div className="task-edit-block-head">
          <strong>Ответственные</strong>
        </div>
        <div className="chip-row" role="group" aria-label="Ответственные задачи">
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              className={`person-chip ${draft.ownerIds.includes(person.id) ? 'is-picked' : ''}`}
              onClick={() => toggleOwner(person.id)}
            >
              <span>{person.name.slice(0, 1)}</span>
              {person.name}
            </button>
          ))}
        </div>
      </div>

      <div className="task-edit-block">
        <div className="task-edit-block-head">
          <label className="toggle-line">
            <input
              type="checkbox"
              checked={draft.timelineEnabled}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...current,
                  timelineEnabled: event.target.checked,
                  timeline:
                    event.target.checked && current.timeline.length === 0
                      ? buildTimeline(
                          current.title || 'Задача',
                          current.ownerIds,
                          current.deadline || getDefaultTaskDeadline(current.createdAt),
                        )
                      : current.timeline,
                }))
              }
            />
            <span>Хронология</span>
          </label>
          <button className="task-action-button" type="button" onClick={addTimelineItem}>
            <Plus size={14} />
            Добавить этап
          </button>
        </div>

        {draft.timelineEnabled && (
          <div className="task-edit-stage-list">
            {draft.timeline.map((item, index) => (
              <div className="task-edit-stage" key={item.id}>
                <label className="field">
                  <span>Этап</span>
                  <input
                    value={item.title}
                    onChange={(event) =>
                      setTimelineItem(item.id, (current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder={`Этап ${index + 1}`}
                  />
                </label>
                <label className="field">
                  <span>Ответственный</span>
                  <select
                    value={item.ownerId}
                    onChange={(event) =>
                      setTimelineItem(item.id, (current) => ({ ...current, ownerId: event.target.value }))
                    }
                  >
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Статус</span>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      setTimelineItem(item.id, (current) => ({ ...current, status: event.target.value as Status }))
                    }
                  >
                    {statusOrder.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Дедлайн этапа</span>
                  <input
                    type="date"
                    value={item.dueDate}
                    onChange={(event) =>
                      setTimelineItem(item.id, (current) => ({ ...current, dueDate: event.target.value }))
                    }
                  />
                </label>
                <button
                  className="task-icon-button"
                  type="button"
                  aria-label={`Удалить этап ${index + 1}`}
                  onClick={() =>
                    onDraftChange((current) => ({
                      ...current,
                      timeline: current.timeline.filter((timelineItem) => timelineItem.id !== item.id),
                    }))
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {draft.timeline.length === 0 && <div className="empty-row">Этапы пока не добавлены.</div>}
          </div>
        )}
      </div>

      <div className="task-edit-actions">
        <button className="primary-button" type="button" onClick={onSave}>
          <Save size={15} />
          Сохранить
        </button>
        <button className="task-action-button" type="button" onClick={onCancel}>
          <X size={15} />
          Отмена
        </button>
      </div>
    </div>
  );
}

function TaskHistoryPanel({ task }: { task: Task }) {
  const history = getTaskHistory(task);

  return (
    <div className="task-history-panel">
      <div className="task-history-head">
        <strong>История изменений</strong>
        <span>{history.length}</span>
      </div>
      {history.length === 0 ? (
        <div className="empty-row">Изменений по этой задаче пока нет.</div>
      ) : (
        <div className="task-history-list">
          {history.map((entry) => (
            <article className="task-history-entry" key={entry.id}>
              <div>
                <strong>{entry.action}</strong>
                <time dateTime={entry.changedAt}>{formatDateTime(entry.changedAt)}</time>
              </div>
              <p>{entry.summary}</p>
              {entry.changes.length > 0 && (
                <dl>
                  {entry.changes.map((change, index) => (
                    <div key={`${entry.id}-${change.field}-${index}`}>
                      <dt>{change.field}</dt>
                      <dd>
                        <span>{change.before}</span>
                        <em>→</em>
                        <span>{change.after}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

type DashboardCardProps = {
  completion: number;
  overdueCount: number;
  collisions: Array<{ id: string; task: Task; owner?: Person; count: number }>;
};

function DashboardCard({ completion, overdueCount, collisions }: DashboardCardProps) {
  return (
    <section className="panel dashboard-card">
      <div className="section-heading compact-heading">
        <div>
          <h2>Сводка управления</h2>
          <p>Сводка по всем разделам.</p>
        </div>
        <BarChart3 size={20} />
      </div>
      <div className="health-card">
        <div>
          <span>Выполнение</span>
          <strong>{completion}%</strong>
        </div>
        <div className="health-line">
          <span style={{ width: `${completion}%` }} />
        </div>
      </div>
      <div className="mini-metrics">
        <Metric label="Просрочено" value={String(overdueCount)} tone={overdueCount ? 'danger' : 'success'} />
        <Metric label="Наложения" value={String(collisions.length)} tone={collisions.length ? 'warning' : 'success'} />
      </div>
      <details className="collision-details">
        <summary>
          <span>Наложения</span>
          <div className="collision-summary-meta">
            <em>{collisions.length}</em>
            <ChevronDown className="details-caret" size={14} />
          </div>
        </summary>
        <div className="collision-list">
          {collisions.slice(0, 3).map((item) => (
            <div key={item.id}>
              <AlertTriangle size={15} />
              <span>
                {item.owner?.name ?? 'Ответственный'}: {item.count} задачи рядом с одним дедлайном
              </span>
            </div>
          ))}
          {collisions.length === 0 && (
            <div>
              <CheckCircle2 size={15} />
              <span>Критичных наложений не видно.</span>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

function ProjectPulse({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  return (
    <section className="panel project-pulse">
      <div className="section-heading compact-heading">
        <div>
          <h2>Пульс проектов</h2>
          <p>Сколько задач сейчас в работе.</p>
        </div>
        <Layers3 size={20} />
      </div>
      {projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id && isCountableTask(task));
        const active = projectTasks.filter((task) => task.status !== 'done').length;
        const percent = projectTasks.length ? Math.round((active / projectTasks.length) * 100) : 0;
        return (
          <div className="pulse-row" key={project.id}>
            <div>
              <span className="mini-dot" style={{ background: project.color }} />
              <strong>{project.name}</strong>
            </div>
            <div className="pulse-track">
              <span style={{ width: `${percent}%`, background: project.color }} />
            </div>
            <em>{active}</em>
          </div>
        );
      })}
    </section>
  );
}

function CalendarHeader({ mode, onModeChange }: { mode: CalendarMode; onModeChange: (mode: CalendarMode) => void }) {
  return (
    <div className="section-heading calendar-heading">
      <div>
        <h2>Календарь по проектам</h2>
        <p>Переключай плановые дедлайны и фактическое закрытие.</p>
      </div>
      <div className="segmented" role="group" aria-label="Режим календаря">
        <button className={mode === 'plan' ? 'is-active' : ''} type="button" onClick={() => onModeChange('plan')}>
          План
        </button>
        <button className={mode === 'fact' ? 'is-active' : ''} type="button" onClick={() => onModeChange('fact')}>
          Факт
        </button>
      </div>
    </div>
  );
}

function ProjectCalendar({
  mode,
  days,
  projects,
  tasks,
  peopleById,
}: {
  mode: CalendarMode;
  days: string[];
  projects: Project[];
  tasks: Task[];
  peopleById: Map<string, Person>;
}) {
  return (
    <div className="calendar-grid" style={{ '--day-count': days.length } as CSSProperties}>
      <div className="calendar-corner">Проект</div>
      {days.map((day) => (
        <div key={day} className="day-head">
          <span>{formatDate(day)}</span>
        </div>
      ))}

      {projects.map((project) => (
        <CalendarProjectRow
          key={project.id}
          project={project}
          mode={mode}
          days={days}
          tasks={tasks.filter((task) => task.projectId === project.id)}
          peopleById={peopleById}
        />
      ))}
    </div>
  );
}

function CalendarProjectRow({
  project,
  mode,
  days,
  tasks,
  peopleById,
}: {
  project: Project;
  mode: CalendarMode;
  days: string[];
  tasks: Task[];
  peopleById: Map<string, Person>;
}) {
  return (
    <>
      <div className="calendar-project" style={{ '--project-color': project.color } as CSSProperties}>
        <span className="project-dot" />
        <strong>{project.name}</strong>
      </div>
      {days.map((day) => {
        const dayTasks = tasks.filter((task) => (mode === 'plan' ? task.deadline : task.completedAt) === day);
        return (
          <div key={`${project.id}-${day}`} className={`day-cell ${dayTasks.length > 1 ? 'has-stack' : ''}`}>
            {dayTasks.slice(0, 2).map((task) => (
              <span key={task.id} title={task.title}>
                {task.ownerIds
                  .map((ownerId) => peopleById.get(ownerId)?.name.slice(0, 1))
                  .filter(Boolean)
                  .join('')}
              </span>
            ))}
          </div>
        );
      })}
    </>
  );
}

type AdminViewProps = {
  tab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  projects: Project[];
  people: Person[];
  tasks: Task[];
  paymentRows: PaymentRow[];
  linkRows: LinkPurchase[];
  managedResources: ManagedResource[];
  projectDraft: string;
  personDraft: { name: string; role: string };
  paymentDraft: PaymentDraft;
  resourceDraft: ManagedResourceDraft;
  onProjectDraftChange: (value: string) => void;
  onPersonDraftChange: Dispatch<SetStateAction<{ name: string; role: string }>>;
  onPaymentDraftChange: Dispatch<SetStateAction<PaymentDraft>>;
  onResourceDraftChange: Dispatch<SetStateAction<ManagedResourceDraft>>;
  onProjectAdd: () => void;
  onPersonAdd: () => void;
  onPaymentAdd: (projectIdOverride?: string) => void;
  onResourceAdd: () => void;
  onProjectDelete: (projectId: string) => void;
  onPersonDelete: (personId: string) => void;
  onTaskDelete: (taskId: string) => void;
  onPaymentUpdate: (rowId: string, patch: Partial<PaymentRow>) => void;
  onPaymentDelete: (rowId: string) => void;
  onResourceDelete: (resourceId: string) => void;
};

function AdminView({
  tab,
  onTabChange,
  projects,
  people,
  tasks,
  paymentRows,
  linkRows,
  managedResources,
  projectDraft,
  personDraft,
  paymentDraft,
  resourceDraft,
  onProjectDraftChange,
  onPersonDraftChange,
  onPaymentDraftChange,
  onResourceDraftChange,
  onProjectAdd,
  onPersonAdd,
  onPaymentAdd,
  onResourceAdd,
  onProjectDelete,
  onPersonDelete,
  onTaskDelete,
  onPaymentUpdate,
  onPaymentDelete,
  onResourceDelete,
}: AdminViewProps) {
  const projectById = new Map(projects.map((project) => [project.id, project]));

  return (
    <section className="panel admin-view">
      <div className="section-heading">
        <div>
          <h2>Админка</h2>
          <p>Центр управления панелью: проекты, ответственные, задачи, источники вкладок и оплаты.</p>
        </div>
        <div className="segmented" role="group" aria-label="Раздел админки">
          <button className={tab === 'projects' ? 'is-active' : ''} type="button" onClick={() => onTabChange('projects')}>
            Проекты
          </button>
          <button className={tab === 'people' ? 'is-active' : ''} type="button" onClick={() => onTabChange('people')}>
            Ответственные
          </button>
          <button className={tab === 'tasks' ? 'is-active' : ''} type="button" onClick={() => onTabChange('tasks')}>
            Задачи
          </button>
          <button className={tab === 'sources' ? 'is-active' : ''} type="button" onClick={() => onTabChange('sources')}>
            Источники
          </button>
          <button className={tab === 'payments' ? 'is-active' : ''} type="button" onClick={() => onTabChange('payments')}>
            Оплаты
          </button>
        </div>
      </div>

      {tab === 'projects' && (
        <div className="admin-layout">
          <div className="admin-form glass-inner">
            <h3>Новый проект</h3>
            <label className="field">
              <span>Название</span>
              <input
                value={projectDraft}
                onChange={(event) => onProjectDraftChange(event.target.value)}
                placeholder="Например: Недвижимость"
              />
            </label>
            <button className="primary-button" type="button" onClick={onProjectAdd}>
              <Plus size={17} />
              Добавить проект
            </button>
          </div>
          <div className="admin-list">
            {projects.map((project) => (
              <div key={project.id} className="admin-row">
                <span className="project-dot" style={{ background: project.color }} />
                <strong>{project.name}</strong>
                <button className="ghost-button danger-button" type="button" onClick={() => onProjectDelete(project.id)}>
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'people' && (
        <div className="admin-layout">
          <div className="admin-form glass-inner">
            <h3>Новый ответственный</h3>
            <label className="field">
              <span>Имя</span>
              <input
                value={personDraft.name}
                onChange={(event) => onPersonDraftChange((current) => ({ ...current, name: event.target.value }))}
                placeholder="Имя"
              />
            </label>
            <label className="field">
              <span>Роль</span>
              <input
                value={personDraft.role}
                onChange={(event) => onPersonDraftChange((current) => ({ ...current, role: event.target.value }))}
                placeholder="Например: SEO"
              />
            </label>
            <button className="primary-button" type="button" onClick={onPersonAdd}>
              <Plus size={17} />
              Добавить ответственного
            </button>
          </div>
          <div className="admin-list">
            {people.map((person) => (
              <div key={person.id} className="admin-row person-row">
                <span className="avatar">{person.name.slice(0, 1)}</span>
                <div>
                  <strong>{person.name}</strong>
                  <small>{person.role}</small>
                </div>
                <button className="ghost-button danger-button" type="button" onClick={() => onPersonDelete(person.id)}>
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="admin-single-column">
          <div className="admin-note glass-inner">
            <strong>Управление задачами</strong>
            <p>Добавление задач остается в списке задач, а здесь можно быстро убрать лишние строки из панели.</p>
          </div>
          <div className="admin-list">
            {tasks.map((task) => (
              <div key={task.id} className="admin-row admin-task-row">
                <span className="project-dot" style={{ background: projectById.get(task.projectId)?.color ?? '#d8eef3' }} />
                <div>
                  <strong>{task.title}</strong>
                  <small>
                    {projectById.get(task.projectId)?.name ?? 'Без проекта'} · {statusLabels[task.status]} · дедлайн{' '}
                    {formatDate(task.deadline)}
                  </small>
                </div>
                <button className="ghost-button danger-button" type="button" onClick={() => onTaskDelete(task.id)}>
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'sources' && (
        <div className="admin-layout">
          <div className="admin-form glass-inner">
            <h3>Новый источник</h3>
            <label className="field">
              <span>Проект</span>
              <select
                value={resourceDraft.projectId}
                onChange={(event) =>
                  onResourceDraftChange((current) => ({ ...current, projectId: event.target.value }))
                }
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Вкладка</span>
              <select
                value={resourceDraft.tab}
                onChange={(event) =>
                  onResourceDraftChange((current) => ({
                    ...current,
                    tab: event.target.value as ManagedResourceTab,
                  }))
                }
              >
                {Object.entries(managedResourceTabLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Название</span>
              <input
                value={resourceDraft.title}
                onChange={(event) => onResourceDraftChange((current) => ({ ...current, title: event.target.value }))}
                placeholder="Например: отчет за август"
              />
            </label>
            <label className="field">
              <span>Ссылка</span>
              <input
                value={resourceDraft.url}
                onChange={(event) => onResourceDraftChange((current) => ({ ...current, url: event.target.value }))}
                placeholder="https://..."
              />
            </label>
            <label className="field">
              <span>Дата / период</span>
              <input
                value={resourceDraft.dateLabel}
                onChange={(event) => onResourceDraftChange((current) => ({ ...current, dateLabel: event.target.value }))}
                placeholder="17 июля / август"
              />
            </label>
            <label className="field">
              <span>Комментарий</span>
              <input
                value={resourceDraft.note}
                onChange={(event) => onResourceDraftChange((current) => ({ ...current, note: event.target.value }))}
                placeholder="Коротко что внутри"
              />
            </label>
            <button className="primary-button" type="button" onClick={onResourceAdd}>
              <Plus size={17} />
              Добавить источник
            </button>
          </div>
          <div className="admin-list">
            {managedResources.map((resource) => (
              <div key={resource.id} className="admin-row admin-source-row">
                <span>{managedResourceTabLabels[resource.tab]}</span>
                <div>
                  <strong>{resource.title}</strong>
                  <small>
                    {projectById.get(resource.projectId)?.name ?? 'Без проекта'}
                    {resource.dateLabel ? ` · ${resource.dateLabel}` : ''}
                  </small>
                </div>
                <a className="ghost-button" href={resource.url} target="_blank" rel="noreferrer">
                  Открыть
                </a>
                <button className="ghost-button danger-button" type="button" onClick={() => onResourceDelete(resource.id)}>
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <PaymentRowsEditor
          projects={projects}
          rows={paymentRows}
          draft={paymentDraft}
          linkRows={linkRows}
          onDraftChange={onPaymentDraftChange}
          onAdd={onPaymentAdd}
          onUpdate={onPaymentUpdate}
          onDelete={onPaymentDelete}
        />
      )}
    </section>
  );
}

type DashboardViewProps = {
  projects: Project[];
  tasks: Task[];
  peopleById: Map<string, Person>;
  completion: number;
  overdueCount: number;
  collisions: Array<{ id: string; task: Task; owner?: Person; count: number }>;
  bitrix24Snapshot: Bitrix24Snapshot;
};

function DashboardView({
  projects,
  tasks,
  peopleById,
  completion,
  overdueCount,
  collisions,
  bitrix24Snapshot,
}: DashboardViewProps) {
  const countableTasks = tasks.filter(isCountableTask);
  const totalTimeline = countableTasks.reduce((sum, task) => sum + task.timeline.length, 0);

  return (
    <section className="dashboard-view">
      <div className="dashboard-hero panel">
        <div>
          <h2>Общая картина</h2>
          <p>Видно выполнение по всем разделам и места, где сроки начинают наслаиваться.</p>
        </div>
        <div className="hero-metrics">
          <Metric label="Выполнение" value={`${completion}%`} />
          <Metric label="Просрочено" value={String(overdueCount)} tone={overdueCount ? 'danger' : 'success'} />
          <Metric label="Подпункты" value={String(totalTimeline)} />
          <Metric label="Наложения" value={String(collisions.length)} tone={collisions.length ? 'warning' : 'success'} />
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-analytics">
          <div className="dashboard-main">
            <section className="panel">
              <div className="section-heading compact-heading">
                <div>
                  <h2>Выполнение по проектам</h2>
                  <p>Процент закрытых задач внутри каждого проекта.</p>
                </div>
                <Target size={20} />
              </div>
              <div className="project-bars">
                {projects.map((project) => {
                  const projectTasks = countableTasks.filter((task) => task.projectId === project.id);
                  const done = projectTasks.filter((task) => task.status === 'done').length;
                  const percent = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
                  return (
                    <div key={project.id} className="bar-row">
                      <div>
                        <span className="mini-dot" style={{ background: project.color }} />
                        <strong>{project.name}</strong>
                      </div>
                      <div className="bar-track">
                        <span style={{ width: `${percent}%`, background: project.color }} />
                      </div>
                      <em>{percent}%</em>
                    </div>
                  );
                })}
              </div>
            </section>

            <details className="panel overlap-panel">
              <summary className="section-heading compact-heading overlap-summary">
                <div>
                  <h2>Наложения</h2>
                  <p>Ответственные с задачами рядом по срокам.</p>
                </div>
                <div className="overlap-summary-meta">
                  <span>{collisions.length}</span>
                  <Users size={20} />
                  <ChevronDown className="details-caret" size={15} />
                </div>
              </summary>
              <div className="overlap-list">
                {collisions.map((item) => (
                  <div key={item.id} className="overlap-item">
                    <span className="avatar">{item.owner?.name.slice(0, 1) ?? '?'}</span>
                    <div>
                      <strong>{item.owner?.name ?? 'Без имени'}</strong>
                      <p>
                        {item.count} задачи около {formatDate(item.task.deadline)} · {item.task.title}
                      </p>
                    </div>
                  </div>
                ))}
                {collisions.length === 0 && <div className="empty-row">Наложений по дедлайнам не найдено.</div>}
              </div>
            </details>
          </div>

          <section className="panel">
            <div className="section-heading compact-heading">
              <div>
                <h2>Ближайшие дедлайны</h2>
                <p>Плановые точки на следующие дни.</p>
              </div>
              <Clock3 size={20} />
            </div>
            <div className="deadline-grid">
              {tasks
                .filter((task) => isCountableTask(task) && task.status !== 'done' && task.deadline)
                .sort((a, b) => a.deadline.localeCompare(b.deadline))
                .slice(0, 8)
                .map((task) => (
                  <div key={task.id} className={`deadline-card ${task.status}`}>
                    <span>{formatDate(task.deadline)}</span>
                    <strong>{task.title}</strong>
                    <p>
                      {task.ownerIds
                        .map((ownerId) => peopleById.get(ownerId)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                ))}
            </div>
          </section>

          <Bitrix24DashboardPanel snapshot={bitrix24Snapshot} />
        </div>

        <TaskChronologyPanel tasks={countableTasks} projects={projects} peopleById={peopleById} />
      </div>
    </section>
  );
}

function Bitrix24DashboardPanel({ snapshot }: { snapshot: Bitrix24Snapshot }) {
  const clientCount = snapshot.crm.leads.length + snapshot.crm.contacts.length + snapshot.crm.companies.length;
  const customFieldCount = snapshot.crm.fields.filter((field) => field.isUserField).length;
  const doneTasks = snapshot.tasks.filter((task) => task.status === '5' || task.statusLabel.toLowerCase() === 'готово').length;
  const latestTasks = [...snapshot.tasks]
    .sort((left, right) => (right.createdDate || '').localeCompare(left.createdDate || ''))
    .slice(0, 5);
  const latestDeals = snapshot.crm.deals.slice(0, 4);
  const latestComments = [...snapshot.comments]
    .sort((left, right) => (right.postDate || '').localeCompare(left.postDate || ''))
    .slice(0, 5);
  const latestResults = [...snapshot.results]
    .sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''))
    .slice(0, 5);
  const crmHasRows = clientCount > 0 || snapshot.crm.deals.length > 0 || customFieldCount > 0;
  const hasLoadedRows = Boolean(snapshot.tasks.length || latestComments.length || latestResults.length || crmHasRows);
  const hasSnapshot = Boolean(
    snapshot.updatedAt || snapshot.tasks.length || latestComments.length || latestResults.length || crmHasRows || snapshot.errors.length,
  );
  const bitrixHealthTitle = hasLoadedRows
    ? 'Bitrix24 выгружен'
    : snapshot.errors.length
      ? 'Bitrix24 ждет настройки на GitHub'
      : 'Bitrix24 подключен, но snapshot пустой';
  const bitrixHealthText = hasLoadedRows
    ? 'Задачи проекта SEO, CRM, комментарии и результаты читаются из безопасного snapshot.'
    : 'На GitHub Pages webhook не попадает в браузер. Данные появятся после успешного запуска backend-выгрузки в GitHub Actions.';

  return (
    <section className="panel bitrix-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>Bitrix24</h2>
          <p>
            {hasSnapshot
              ? `CRM и задачи проекта ${snapshot.seoProjectName || 'SEO'} · обновлено ${formatDateTime(snapshot.updatedAt)}`
              : 'Подключение готово. Данные появятся после запуска backend-выгрузки.'}
          </p>
        </div>
        <Layers3 size={20} />
      </div>

      <div className={`bitrix-health ${hasLoadedRows ? 'is-ready' : 'is-empty'}`} role="status">
        {hasLoadedRows ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        <div>
          <strong>{bitrixHealthTitle}</strong>
          <p>{bitrixHealthText}</p>
          {!hasLoadedRows && (
            <span>
              Сейчас файл выгрузки Bitrix24 не содержит задач, CRM и времени обновления.
              {snapshot.errors[0] ? ` Последняя причина: ${snapshot.errors[0]}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="bitrix-metrics">
        <Metric label="Клиенты CRM" value={String(clientCount)} compact />
        <Metric label="Сделки" value={String(snapshot.crm.deals.length)} compact />
        <Metric label="SEO-задачи" value={String(snapshot.tasks.length)} compact />
        <Metric label="Выполнено" value={String(doneTasks)} compact tone={doneTasks ? 'success' : undefined} />
        <Metric label="Комментарии" value={String(snapshot.comments.length)} compact />
        <Metric label="Результаты" value={String(snapshot.results.length)} compact />
        <Metric label="Поля CRM" value={String(customFieldCount)} compact />
      </div>

      {snapshot.errors.length > 0 && (
        <div className="bitrix-error-list" role="status">
          <strong>Что не загрузилось</strong>
          {snapshot.errors.slice(0, 3).map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      )}

      <div className="bitrix-columns">
        <div className="bitrix-block">
          <div className="bitrix-block-head">
            <h3>SEO-задачи из Bitrix24</h3>
            <span>{snapshot.seoProjectGroupId ? `проект #${snapshot.seoProjectGroupId}` : 'проект SEO'}</span>
          </div>
          {latestTasks.length === 0 ? (
            <div className="empty-row">Пока нет загруженных задач из проекта SEO.</div>
          ) : (
            <div className="bitrix-task-list">
              {latestTasks.map((task) => (
                <article className="bitrix-task-row" key={task.id}>
                  <div>
                    <span>#{task.id}</span>
                    <strong>{task.title}</strong>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  <dl>
                    <div>
                      <dt>Статус</dt>
                      <dd>{task.statusLabel}</dd>
                    </div>
                    <div>
                      <dt>Ответственный</dt>
                      <dd>{task.responsibleName}</dd>
                    </div>
                    <div>
                      <dt>Постановщик</dt>
                      <dd>{task.creatorName}</dd>
                    </div>
                    <div>
                      <dt>Дедлайн</dt>
                      <dd>{formatDateTime(task.deadline)}</dd>
                    </div>
                    {task.closedDate && (
                      <div>
                        <dt>Закрыта</dt>
                        <dd>{formatDateTime(task.closedDate)}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="bitrix-block">
          <div className="bitrix-block-head">
            <h3>CRM-срез</h3>
            <span>{snapshot.portalHost || 'портал не подключен'}</span>
          </div>
          <div className="bitrix-crm-summary">
            <div>
              <strong>{snapshot.crm.leads.length}</strong>
              <span>лидов</span>
            </div>
            <div>
              <strong>{snapshot.crm.contacts.length}</strong>
              <span>контактов</span>
            </div>
            <div>
              <strong>{snapshot.crm.companies.length}</strong>
              <span>компаний</span>
            </div>
          </div>
          {latestDeals.length > 0 ? (
            <div className="bitrix-deal-list">
              {latestDeals.map((deal) => (
                <div key={deal.id}>
                  <strong>{deal.title}</strong>
                  <span>
                    {deal.stageId || 'без стадии'} · {deal.assignedByName}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-row">Сделки появятся после первой успешной выгрузки CRM.</div>
          )}
          {snapshot.crm.fields.length > 0 && (
            <div className="bitrix-field-strip" aria-label="Пользовательские поля CRM">
              {snapshot.crm.fields.slice(0, 10).map((field) => (
                <em key={`${field.entityType}-${field.code}`}>{field.title}</em>
              ))}
            </div>
          )}
        </div>

        <div className="bitrix-block bitrix-comments-block">
          <div className="bitrix-block-head">
            <h3>Комментарии задач</h3>
            <span>{latestComments.length ? 'новые сверху' : 'пока пусто'}</span>
          </div>
          {latestComments.length > 0 ? (
            <div className="bitrix-comment-list">
              {latestComments.map((comment) => (
                <article className="bitrix-comment-row" key={`${comment.taskId}-${comment.id}`}>
                  <div>
                    <span>
                      #{comment.taskId} · {formatDateTime(comment.postDate)}
                    </span>
                    <strong>{comment.taskTitle}</strong>
                  </div>
                  {comment.message ? <p>{comment.message}</p> : <p>Комментарий без текста.</p>}
                  <em>
                    {comment.authorName}
                    {comment.attachmentsCount > 0 ? ` · вложений: ${comment.attachmentsCount}` : ''}
                  </em>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-row">Комментарии появятся после успешной выгрузки из Bitrix24.</div>
          )}
        </div>

        <div className="bitrix-block bitrix-results-block">
          <div className="bitrix-block-head">
            <h3>Результаты задач</h3>
            <span>{latestResults.length ? 'отчетные отметки' : 'пока пусто'}</span>
          </div>
          {latestResults.length > 0 ? (
            <div className="bitrix-comment-list">
              {latestResults.map((result) => (
                <article className="bitrix-comment-row" key={`${result.taskId}-${result.id}`}>
                  <div>
                    <span>
                      #{result.taskId} · {formatDateTime(result.createdAt)}
                    </span>
                    <strong>{result.taskTitle}</strong>
                  </div>
                  {result.text ? <p>{result.text}</p> : <p>Результат без текста.</p>}
                  <em>
                    {result.createdByName}
                    {result.filesCount > 0 ? ` · файлов: ${result.filesCount}` : ''}
                  </em>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-row">Результаты задач появятся после успешной выгрузки из Bitrix24.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function WeeklyReportView({
  projects,
  tasks,
  peopleById,
  reportSnapshots,
  bitrix24Snapshot,
  linkRows,
  promotionSources,
  leadAnalyticsByProject,
  leadErrorsByProject,
  leadLoadStatus,
  leadError,
  leadUpdatedAt,
  metrikaLoadStatus,
  metrikaError,
  metrikaUpdatedAt,
  externalSource,
  externalAdditions,
  onReloadLeads,
  onReloadMetrika,
  onReportSnapshotsChange,
}: {
  projects: Project[];
  tasks: Task[];
  peopleById: Map<string, Person>;
  reportSnapshots: TaskReportSnapshot[];
  bitrix24Snapshot: Bitrix24Snapshot;
  linkRows: LinkPurchase[];
  promotionSources: PromotionResultSource[];
  leadAnalyticsByProject: Map<string, LeadAnalyticsSummary>;
  leadErrorsByProject: Map<string, string>;
  leadLoadStatus: LinkLoadStatus;
  leadError: string;
  leadUpdatedAt: string;
  metrikaLoadStatus: LinkLoadStatus;
  metrikaError: string;
  metrikaUpdatedAt: string;
  externalSource: ExternalProjectsSource;
  externalAdditions: ExternalProjectAdditions;
  onReloadLeads: () => void;
  onReloadMetrika: (mode?: MetrikaStatsLoadMode) => void;
  onReportSnapshotsChange: Dispatch<SetStateAction<TaskReportSnapshot[]>>;
}) {
  const [reportMode, setReportMode] = useStoredState<ReportMode>('task-seo-report-mode', 'tasks');
  const [reportProjectId, setReportProjectId] = useStoredState<string>(
    'task-seo-report-project-id',
    projects[0]?.id ?? '',
  );
  const [reportTaskProjectId, setReportTaskProjectId] = useStoredState<string>(
    'task-seo-report-task-project-id',
    'all',
  );
  const [selectedDrilldown, setSelectedDrilldown] = useState<ReportDrilldownState | null>(null);
  const latestReportWeek = useMemo(() => getWeekWindow(-1), []);
  const archiveStarts = useMemo(
    () => collectReportArchiveStarts(tasks, externalSource, externalAdditions, latestReportWeek),
    [externalAdditions, externalSource, latestReportWeek, tasks],
  );
  const [selectedArchiveStart, setSelectedArchiveStart] = useState(latestReportWeek.start);
  useEffect(() => {
    if (!archiveStarts.includes(selectedArchiveStart)) {
      setSelectedArchiveStart(archiveStarts[0] ?? latestReportWeek.start);
    }
  }, [archiveStarts, latestReportWeek.start, selectedArchiveStart]);
  const selectedReportWeek = useMemo(() => getWeekWindowFromIso(selectedArchiveStart), [selectedArchiveStart]);
  const selectedPlanWeek = useMemo(
    () => getWeekWindowFromIso(addDaysToIso(selectedArchiveStart, 7)),
    [selectedArchiveStart],
  );
  const selectedReportSendDate = selectedPlanWeek.start;
  const archiveFolders = useMemo(
    () =>
      buildReportArchiveFolders(
        archiveStarts,
        projects,
        tasks,
        peopleById,
        externalSource,
        externalAdditions,
      ),
    [archiveStarts, externalAdditions, externalSource, peopleById, projects, tasks],
  );
  const seoReports = useMemo(
    () => buildSeoWeeklyReports(projects, tasks, peopleById, selectedReportWeek, selectedPlanWeek),
    [peopleById, projects, selectedPlanWeek, selectedReportWeek, tasks],
  );
  const externalReports = useMemo(
    () => buildExternalWeeklyReports(externalSource, externalAdditions, selectedReportWeek, selectedPlanWeek),
    [externalAdditions, externalSource, selectedPlanWeek, selectedReportWeek],
  );
  const taskLogicReports = useMemo(
    () =>
      buildTaskLogicReports(
        projects,
        tasks,
        peopleById,
        reportSnapshots,
        bitrix24Snapshot,
        selectedReportWeek,
        selectedPlanWeek,
      ),
    [bitrix24Snapshot, peopleById, projects, reportSnapshots, selectedPlanWeek, selectedReportWeek, tasks],
  );
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const selectedTaskProject =
    reportTaskProjectId === 'all' ? undefined : projects.find((project) => project.id === reportTaskProjectId);
  const visibleSeoReports = useMemo(
    () =>
      selectedTaskProject
        ? seoReports.filter((report) => report.id === selectedTaskProject.id)
        : seoReports,
    [selectedTaskProject, seoReports],
  );
  const visibleTaskLogicReports = useMemo(
    () =>
      selectedTaskProject
        ? taskLogicReports.filter((report) => report.id === selectedTaskProject.id)
        : taskLogicReports,
    [selectedTaskProject, taskLogicReports],
  );
  const allTaskScore = useMemo(() => buildOverallTaskScore(taskLogicReports), [taskLogicReports]);
  const visibleTaskScore = useMemo(() => buildOverallTaskScore(visibleTaskLogicReports), [visibleTaskLogicReports]);
  const selectedMetricsProject = projects.find((project) => project.id === reportProjectId) ?? projects[0];
  const selectedMetricsProjectKey = normalizeProjectName(selectedMetricsProject?.name ?? '');
  const selectedMetricsLinkRows = linkRows.filter((row) => normalizeProjectName(row.projectName) === selectedMetricsProjectKey);
  const selectedMetricsSources = promotionSources.filter(
    (source) => normalizeProjectName(source.projectName) === selectedMetricsProjectKey,
  );
  const selectedMetricsLeadAnalytics = leadAnalyticsByProject.get(selectedMetricsProjectKey);
  const selectedMetricsLeadError = leadErrorsByProject.get(selectedMetricsProjectKey) ?? leadError;
  const selectedMetricsTasks = tasks.filter((task) => task.projectId === selectedMetricsProject?.id);
  const selectedDrilldownReport = selectedDrilldown
    ? visibleSeoReports.find((report) => report.id === selectedDrilldown.projectId)
    : undefined;
  const selectedDrilldownItems =
    selectedDrilldown?.items ??
    selectedDrilldownReport?.summary?.itemsByFilter[selectedDrilldown?.filter ?? 'all'] ??
    [];
  const selectedDrilldownTitle =
    selectedDrilldown?.title ??
    (selectedDrilldown && selectedDrilldownReport
      ? `${selectedDrilldownReport.title}: ${taskReportFilterLabels[selectedDrilldown.filter].toLowerCase()}`
      : '');
  const reportFocusTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            task.status === 'done' &&
            task.completedAt === selectedReportSendDate &&
            task.title.startsWith('Отчет на'),
        )
        .sort((a, b) => a.title.localeCompare(b.title)),
    [selectedReportSendDate, tasks],
  );
  const visibleReportFocusTasks = selectedTaskProject
    ? reportFocusTasks.filter((task) => task.projectId === selectedTaskProject.id)
    : reportFocusTasks;
  const seoDone = visibleSeoReports.reduce((sum, report) => sum + report.done.length, 0);
  const seoLate = visibleSeoReports.reduce((sum, report) => sum + report.late.length, 0);
  const seoPlanned = visibleSeoReports.reduce((sum, report) => sum + report.planned.length, 0);
  const externalDone = externalReports.reduce((sum, report) => sum + report.done.length, 0);
  const externalLate = externalReports.reduce((sum, report) => sum + report.late.length, 0);
  const externalPlanned = externalReports.reduce((sum, report) => sum + report.planned.length, 0);
  const selectedReportTitle = formatReportArchiveTitle(selectedReportWeek);
  const savedSnapshotCount = normalizeReportSnapshots(reportSnapshots).filter(
    (snapshot) => snapshot.reportDate <= selectedPlanWeek.start,
  ).length;
  const saveSelectedSnapshot = () => {
    onReportSnapshotsChange((current) =>
      upsertTaskReportSnapshot(
        current,
        makeTaskReportSnapshot(tasks, selectedPlanWeek.start, bitrix24Snapshot, 'dashboard'),
      ),
    );
  };

  useEffect(() => {
    if (selectedMetricsProject) return;
    setReportProjectId(projects[0]?.id ?? '');
  }, [projects, selectedMetricsProject, setReportProjectId]);

  useEffect(() => {
    if (reportTaskProjectId === 'all') return;
    if (projects.some((project) => project.id === reportTaskProjectId)) return;
    setReportTaskProjectId('all');
  }, [projects, reportTaskProjectId, setReportTaskProjectId]);

  useEffect(() => {
    if (!selectedDrilldown) return;
    if (visibleSeoReports.some((report) => report.id === selectedDrilldown.projectId)) return;
    setSelectedDrilldown(null);
  }, [selectedDrilldown, visibleSeoReports]);

  const taskScopeLabel = selectedTaskProject?.name ?? 'все SEO-проекты';

  return (
    <section className="weekly-report-view">
      <div className="dashboard-hero panel weekly-report-hero">
        <div>
          <h2>Отчет</h2>
          <p>
            Сводка по выбранной отчетной папке: SEO-проекты и сторонние направления отдельно.
          </p>
        </div>
        <div className="hero-metrics">
          <Metric label="Открыт отчет" value={selectedReportTitle} />
          <Metric label="Период" value={formatWeekWindow(selectedReportWeek)} />
          <Metric label="Отправка" value={formatNumericDate(selectedReportSendDate)} />
          <Metric label="Оценка задач" value={`${visibleTaskScore.score}/100`} tone={visibleTaskScore.tone} />
          <Metric label="SEO сделано" value={String(seoDone)} tone={seoDone ? 'success' : undefined} />
          <Metric label="SEO просрочено" value={String(seoLate)} tone={seoLate ? 'danger' : 'success'} />
          <Metric label="SEO план" value={String(seoPlanned)} />
          <Metric label="Сторонние просрочено" value={String(externalLate)} tone={externalLate ? 'danger' : 'success'} />
          <Metric label="Сторонние план" value={String(externalPlanned)} />
        </div>
      </div>

      <ReportModeSwitch
        mode={reportMode}
        onModeChange={(mode) => {
          setReportMode(mode);
          setSelectedDrilldown(null);
        }}
      />

      {reportMode === 'metrics' && selectedMetricsProject ? (
        <ReportMetricsMode
          projects={projects}
          selectedProject={selectedMetricsProject}
          selectedProjectId={reportProjectId}
          linkRows={selectedMetricsLinkRows}
          promotionSources={selectedMetricsSources}
          leadAnalytics={selectedMetricsLeadAnalytics}
          leadLoadStatus={leadLoadStatus}
          leadError={selectedMetricsLeadError}
          leadUpdatedAt={leadUpdatedAt}
          metrikaLoadStatus={metrikaLoadStatus}
          metrikaError={metrikaError}
          metrikaUpdatedAt={metrikaUpdatedAt}
          onReloadLeads={onReloadLeads}
          onReloadMetrika={onReloadMetrika}
          tasks={selectedMetricsTasks}
          onProjectChange={setReportProjectId}
        />
      ) : reportMode === 'logic' ? (
        <>
          <ReportAnalyticsOverview
            reportWeek={selectedReportWeek}
            planWeek={selectedPlanWeek}
            score={allTaskScore}
            seoReports={seoReports}
            externalReports={externalReports}
          />
          <ReportProjectFilter
            projects={projects}
            reports={seoReports}
            selectedProjectId={reportTaskProjectId}
            onSelect={(projectId) => {
              setReportTaskProjectId(projectId);
              setSelectedDrilldown(null);
            }}
          />
          <TaskLogicMode
            reports={visibleTaskLogicReports}
            overallScore={visibleTaskScore}
            selectedReportWeek={selectedReportWeek}
            selectedPlanWeek={selectedPlanWeek}
            savedSnapshotCount={savedSnapshotCount}
            bitrix24Snapshot={bitrix24Snapshot}
            onSaveSnapshot={saveSelectedSnapshot}
            scopeProjectName={selectedTaskProject?.name}
          />
        </>
      ) : (
        <>
          <ReportAnalyticsOverview
            reportWeek={selectedReportWeek}
            planWeek={selectedPlanWeek}
            score={allTaskScore}
            seoReports={seoReports}
            externalReports={externalReports}
          />
          <ReportProjectFilter
            projects={projects}
            reports={seoReports}
            selectedProjectId={reportTaskProjectId}
            onSelect={(projectId) => {
              setReportTaskProjectId(projectId);
              setSelectedDrilldown(null);
            }}
          />
          <WeeklyTaskSummaryTable
            reports={visibleSeoReports}
            selected={selectedDrilldown}
            onSelect={(projectId, filter) => setSelectedDrilldown({ projectId, filter })}
          />

          {selectedDrilldown && (
            <WeeklyReportDrilldown
              title={selectedDrilldownTitle}
              items={selectedDrilldownItems}
              empty="По этому счетчику задач нет."
              onClose={() => setSelectedDrilldown(null)}
            />
          )}

          <WeeklyTaskTrendPanel reports={visibleSeoReports} />

          <section className="panel weekly-focus-card">
            <div>
              <span>Открытая отчетная папка</span>
              <h2>{selectedReportTitle}</h2>
              <p>
                {taskScopeLabel}: работы за {formatWeekWindow(selectedReportWeek)}. Отправка отчета -{' '}
                {formatNumericDate(selectedReportSendDate)}.
              </p>
            </div>
            <div className="weekly-focus-list">
              {visibleReportFocusTasks.map((task) => {
                const project = projectById.get(task.projectId);
                return (
                  <span key={task.id}>
                    <i style={{ background: project?.color ?? '#d8eef3' }} />
                    {project?.name ?? 'Проект'}
                  </span>
                );
              })}
              {visibleReportFocusTasks.length === 0 && <span>Отчетных закрытий по выбранному проекту пока нет</span>}
            </div>
          </section>

          <div className="weekly-report-grid">
            <WeeklyReportSection
              title={selectedTaskProject ? `SEO-проект: ${selectedTaskProject.name}` : 'SEO-проекты'}
              description={`Открытая папка: ${selectedReportTitle}. План на следующую неделю: ${formatWeekWindow(
                selectedPlanWeek,
              )}.`}
              doneCount={seoDone}
              lateCount={seoLate}
              plannedCount={seoPlanned}
              reports={visibleSeoReports}
            />
            <WeeklyReportSection
              title="Сторонние проекты"
              description={`Отдельный блок по задачам из документа с учредителем. План на следующую неделю: ${formatWeekWindow(
                selectedPlanWeek,
              )}.`}
              doneCount={externalDone}
              lateCount={externalLate}
              plannedCount={externalPlanned}
              reports={externalReports}
            />
          </div>

          <ReportArchiveFolders
            folders={archiveFolders}
            selectedStart={selectedArchiveStart}
            onSelect={setSelectedArchiveStart}
          />
        </>
      )}
    </section>
  );
}

function ReportModeSwitch({
  mode,
  onModeChange,
}: {
  mode: ReportMode;
  onModeChange: (mode: ReportMode) => void;
}) {
  return (
    <section className="panel report-mode-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>Режим отчета</h2>
          <p>Можно отдельно смотреть выполнение работ или результаты продвижения.</p>
        </div>
        <div className="segmented" role="group" aria-label="Режим отчета">
          {(Object.keys(reportModeLabels) as ReportMode[]).map((item) => (
            <button
              className={mode === item ? 'is-active' : ''}
              key={item}
              type="button"
              onClick={() => onModeChange(item)}
            >
              {reportModeLabels[item]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReportAnalyticsOverview({
  reportWeek,
  planWeek,
  score,
  seoReports,
  externalReports,
}: {
  reportWeek: WeekWindow;
  planWeek: WeekWindow;
  score: ProjectTaskScore;
  seoReports: WeeklyProjectReport[];
  externalReports: WeeklyProjectReport[];
}) {
  const seoDone = seoReports.reduce((sum, report) => sum + report.done.length, 0);
  const seoLate = seoReports.reduce((sum, report) => sum + report.late.length, 0);
  const seoPlanned = seoReports.reduce((sum, report) => sum + report.planned.length, 0);
  const externalDone = externalReports.reduce((sum, report) => sum + report.done.length, 0);
  const externalLate = externalReports.reduce((sum, report) => sum + report.late.length, 0);
  const externalPlanned = externalReports.reduce((sum, report) => sum + report.planned.length, 0);

  return (
    <section className="panel report-analytics-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>Аналитика всех отчетов</h2>
          <p>Сводка по всем SEO-проектам и сторонним направлениям без фильтра по конкретному клиенту.</p>
        </div>
        <span className={`score-badge ${score.tone}`}>{score.label}</span>
      </div>
      <div className="report-analytics-grid">
        <article>
          <span>Неделя отчета</span>
          <strong>{formatWeekWindow(reportWeek)}</strong>
        </article>
        <article>
          <span>План недели</span>
          <strong>{formatWeekWindow(planWeek)}</strong>
        </article>
        <article>
          <span>SEO сделано</span>
          <strong>{seoDone}</strong>
        </article>
        <article>
          <span>SEO просрочено</span>
          <strong className={seoLate ? 'is-danger' : ''}>{seoLate}</strong>
        </article>
        <article>
          <span>Сторонние сделано</span>
          <strong>{externalDone}</strong>
        </article>
        <article>
          <span>Сторонние просрочено</span>
          <strong className={externalLate ? 'is-danger' : ''}>{externalLate}</strong>
        </article>
        <article>
          <span>Закрыто с опозданием</span>
          <strong className={score.lateDone ? 'is-warning' : ''}>{score.lateDone}</strong>
        </article>
        <article>
          <span>Тянется 2+ отчета</span>
          <strong className={score.stuck ? 'is-warning' : ''}>{score.stuck}</strong>
        </article>
        <article>
          <span>Без дедлайна</span>
          <strong className={score.withoutDeadline ? 'is-warning' : ''}>{score.withoutDeadline}</strong>
        </article>
        <article>
          <span>SEO план</span>
          <strong>{seoPlanned}</strong>
        </article>
        <article>
          <span>Сторонние план</span>
          <strong>{externalPlanned}</strong>
        </article>
        <article>
          <span>Оценка</span>
          <strong>{score.score}/100</strong>
        </article>
      </div>
      <div className="score-signal-list">
        {score.signals.length ? score.signals.map((signal) => <strong key={signal}>{signal}</strong>) : <span>сроки под контролем</span>}
      </div>
    </section>
  );
}

function ReportProjectFilter({
  projects,
  reports,
  selectedProjectId,
  onSelect,
}: {
  projects: Project[];
  reports: WeeklyProjectReport[];
  selectedProjectId: string;
  onSelect: (projectId: string) => void;
}) {
  const reportByProjectId = useMemo(() => new Map(reports.map((report) => [report.id, report])), [reports]);
  const totalTasks = reports.reduce((sum, report) => sum + (report.summary?.total ?? 0), 0);
  const doneTasks = reports.reduce((sum, report) => sum + report.done.length, 0);
  const lateTasks = reports.reduce((sum, report) => sum + report.late.length, 0);
  const plannedTasks = reports.reduce((sum, report) => sum + report.planned.length, 0);

  return (
    <section className="panel report-project-filter-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>Проект в динамике задач</h2>
          <p>Выбери клиента и ниже останутся только его выполненные, просроченные и запланированные задачи.</p>
        </div>
        <div className="report-filter-summary">
          <span>{doneTasks} сделано</span>
          <span className={lateTasks ? 'is-danger' : ''}>{lateTasks} просрочено</span>
          <span>{plannedTasks} в плане</span>
        </div>
      </div>
      <div className="report-project-filter" role="group" aria-label="Фильтр проекта в динамике задач">
        <button className={selectedProjectId === 'all' ? 'is-active' : ''} type="button" onClick={() => onSelect('all')}>
          <span className="mini-dot" />
          Все проекты
          <em>{totalTasks}</em>
        </button>
        {projects.map((project) => {
          const report = reportByProjectId.get(project.id);
          const count = report?.summary?.total ?? 0;
          return (
            <button
              className={selectedProjectId === project.id ? 'is-active' : ''}
              key={project.id}
              type="button"
              onClick={() => onSelect(project.id)}
            >
              <span className="mini-dot" style={{ background: project.color }} />
              {project.name}
              <em>{count}</em>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ReportMetricsMode({
  projects,
  selectedProject,
  selectedProjectId,
  linkRows,
  promotionSources,
  leadAnalytics,
  leadLoadStatus,
  leadError,
  leadUpdatedAt,
  metrikaLoadStatus,
  metrikaError,
  metrikaUpdatedAt,
  onReloadLeads,
  onReloadMetrika,
  tasks,
  onProjectChange,
}: {
  projects: Project[];
  selectedProject: Project;
  selectedProjectId: string;
  linkRows: LinkPurchase[];
  promotionSources: PromotionResultSource[];
  leadAnalytics?: LeadAnalyticsSummary;
  leadLoadStatus: LinkLoadStatus;
  leadError: string;
  leadUpdatedAt: string;
  metrikaLoadStatus: LinkLoadStatus;
  metrikaError: string;
  metrikaUpdatedAt: string;
  onReloadLeads: () => void;
  onReloadMetrika: (mode?: MetrikaStatsLoadMode) => void;
  tasks: Task[];
  onProjectChange: (projectId: string) => void;
}) {
  return (
    <section className="report-metrics-mode">
      <section className="panel seo-project-picker-panel">
        <div className="section-heading compact-heading">
          <div>
            <h2>Проект для показателей</h2>
            <p>Выбор проекта сохраняется при переключении режимов отчета.</p>
          </div>
        </div>
        <div className="seo-project-picker" role="group" aria-label="Выбрать SEO-проект в отчете">
          {projects.map((project) => (
            <button
              className={project.id === selectedProjectId ? 'is-active' : ''}
              key={project.id}
              type="button"
              onClick={() => onProjectChange(project.id)}
            >
              <span className="mini-dot" style={{ background: project.color }} />
              {project.name}
            </button>
          ))}
        </div>
      </section>
      <ProjectSeoAnalyticsTiles
        project={selectedProject}
        linkRows={linkRows}
        promotionSources={promotionSources}
        leadAnalytics={leadAnalytics}
        leadLoadStatus={leadLoadStatus}
        leadError={leadError}
        leadUpdatedAt={leadUpdatedAt}
        metrikaLoadStatus={metrikaLoadStatus}
        metrikaError={metrikaError}
        metrikaUpdatedAt={metrikaUpdatedAt}
        onReloadLeads={onReloadLeads}
        onReloadMetrika={onReloadMetrika}
        tasks={tasks}
      />
    </section>
  );
}

function getTaskScoreRows(score: ProjectTaskScore): Array<{
  metric: TaskScoreMetric;
  label: string;
  value: number;
  count: number;
  tone: 'success' | 'warning' | 'danger' | 'info';
}> {
  return [
    {
      metric: 'done',
      label: 'Процент выполнения',
      value: score.completionPercent,
      count: score.done,
      tone: 'success',
    },
    {
      metric: 'overdue',
      label: 'Процент текущих просрочек',
      value: score.currentOverduePercent,
      count: score.overdue,
      tone: score.overdue ? 'danger' : 'success',
    },
    {
      metric: 'lateDone',
      label: 'Процент закрытых с опозданием',
      value: score.lateDonePercent,
      count: score.lateDone,
      tone: score.lateDone ? 'warning' : 'success',
    },
    {
      metric: 'carried',
      label: 'Тянется от отчета к отчету',
      value: score.carriedPercent,
      count: score.carried,
      tone: score.carried ? 'warning' : 'success',
    },
    {
      metric: 'risk',
      label: 'Задачи в риске',
      value: score.riskPercent,
      count: score.risk,
      tone: score.risk ? 'warning' : 'success',
    },
    {
      metric: 'withoutDeadline',
      label: 'Задачи с дедлайном',
      value: score.deadlineFilledPercent,
      count: score.withoutDeadline,
      tone: score.withoutDeadline ? 'warning' : 'success',
    },
  ];
}

function ReportScoreOverview({
  score,
  reports,
  selectedReportWeek,
  selectedPlanWeek,
  savedSnapshotCount,
  bitrix24Snapshot,
  onSaveSnapshot,
  onOpenItems,
}: {
  score: ProjectTaskScore;
  reports: TaskLogicReport[];
  selectedReportWeek: WeekWindow;
  selectedPlanWeek: WeekWindow;
  savedSnapshotCount: number;
  bitrix24Snapshot: Bitrix24Snapshot;
  onSaveSnapshot: () => void;
  onOpenItems: (title: string, items: WeeklyReportItem[]) => void;
}) {
  const rows = getTaskScoreRows(score);
  const bitrixLabel = bitrix24Snapshot.updatedAt
    ? `Bitrix24: ${formatDateTime(bitrix24Snapshot.updatedAt)}`
    : 'Bitrix24: ждет backend-выгрузку';
  const historyLabel =
    savedSnapshotCount >= 2
      ? `Сохранено снимков: ${savedSnapshotCount}`
      : 'История начнется со следующего отчета';

  return (
    <section className="panel report-score-overview">
      <div className="report-score-head">
        <div className={`score-gauge ${score.tone}`}>
          <strong>{score.score}</strong>
          <span>/100</span>
        </div>
        <div>
          <span>Общая оценка всех SEO-проектов</span>
          <h2>{score.label}</h2>
          <p>
            Отчет за {formatWeekWindow(selectedReportWeek)}. Плановая неделя начинается {formatDate(selectedPlanWeek.start)}.
          </p>
        </div>
        <button className="task-action-button" type="button" onClick={onSaveSnapshot}>
          <Save size={14} />
          Сохранить снимок
        </button>
      </div>

      <div className="score-metric-grid" aria-label="Проценты оценки задач">
        {rows.map((row) => {
          const detailTitle = taskScoreMetricLabels[row.metric];
          const caption =
            row.metric === 'withoutDeadline'
              ? row.count
                ? `${row.count} без даты`
                : 'все с датами'
              : row.count
                ? `${row.count} задач`
                : '0 задач';

          return (
            <button
              className={`score-metric-button ${row.tone}`}
              key={row.metric}
              type="button"
              onClick={() => onOpenItems(detailTitle, score.itemsByMetric[row.metric])}
            >
              <span>{row.label}</span>
              <strong>{row.value}%</strong>
              <em>{caption}</em>
            </button>
          );
        })}
      </div>

      <div className="score-signal-list">
        <span>{historyLabel}</span>
        <span>{bitrixLabel}</span>
        <span>{reports.length} проектов в оценке</span>
        {score.signals.slice(0, 5).map((signal) => (
          <strong key={signal}>{signal}</strong>
        ))}
      </div>
    </section>
  );
}

function ProjectTaskScoreCard({
  report,
  onOpenItems,
}: {
  report: TaskLogicReport;
  onOpenItems: (title: string, items: WeeklyReportItem[]) => void;
}) {
  const rows = getTaskScoreRows(report.score);

  return (
    <article className="project-score-card" style={{ '--project-color': report.color } as CSSProperties}>
      <header>
        <div>
          <span className="project-dot" />
          <strong>{report.title}</strong>
        </div>
        <div className={`score-gauge compact ${report.score.tone}`}>
          <strong>{report.score.score}</strong>
          <span>/100</span>
        </div>
      </header>
      <div className="score-meter" aria-hidden="true">
        <span style={{ width: `${Math.min(report.score.score, 100)}%` }} />
      </div>
      <p>{report.score.signals[0] ?? 'сроки под контролем'}</p>
      <div className="score-metric-grid compact">
        {rows.slice(0, 4).map((row) => {
          const detailLabel = taskScoreMetricLabels[row.metric].toLowerCase();
          const caption =
            row.metric === 'withoutDeadline'
              ? row.count
                ? `${row.count} без даты`
                : 'все с датами'
              : `${row.count} задач`;

          return (
            <button
              className={`score-metric-button ${row.tone}`}
              key={row.metric}
              type="button"
              onClick={() => onOpenItems(`${report.title}: ${detailLabel}`, report.score.itemsByMetric[row.metric])}
            >
              <span>{row.label}</span>
              <strong>{row.value}%</strong>
              <em>{caption}</em>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function TaskLogicProjectCard({
  report,
  hasEnoughHistory,
  onOpenItems,
}: {
  report: TaskLogicReport;
  hasEnoughHistory: boolean;
  onOpenItems: (title: string, items: WeeklyReportItem[]) => void;
}) {
  const categories: TaskLogicCategory[] = ['carried', 'added', 'done', 'lateDone', 'deadlineMoved', 'stuck'];

  return (
    <article className="task-logic-project-card" style={{ '--project-color': report.color } as CSSProperties}>
      <header>
        <div>
          <span className="project-dot" />
          <h3>{report.title}</h3>
          <p>
            Снимки: {formatDate(report.previousSnapshotDate)} и {formatDate(report.currentSnapshotDate)}
          </p>
        </div>
        <span className={`score-badge ${report.score.tone}`}>{report.score.label}</span>
      </header>

      {!hasEnoughHistory && (
        <div className="snapshot-status">
          История начнется со следующего отчета. Сейчас видны текущие завершения, переносы и новые задачи.
        </div>
      )}

      <div className="task-logic-category-grid">
        {categories.map((category) => {
          const requiresHistory = category === 'carried' || category === 'stuck';
          const items = requiresHistory && !hasEnoughHistory ? [] : report.itemsByCategory[category];
          const disabled = items.length === 0;

          return (
            <button
              className={`task-logic-category-card ${category}`}
              key={category}
              type="button"
              onClick={() => onOpenItems(`${report.title}: ${taskLogicCategoryLabels[category]}`, items)}
              disabled={disabled}
            >
              <span>{taskLogicCategoryLabels[category]}</span>
              <strong>{items.length}</strong>
              {items.length > 0 ? (
                <div className="task-logic-preview-list">
                  {items.slice(0, 3).map((item) => (
                    <em key={item.id}>{item.title}</em>
                  ))}
                </div>
              ) : (
                <p>{requiresHistory && !hasEnoughHistory ? 'нужен следующий snapshot' : 'нет задач'}</p>
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function TaskLogicMode({
  reports,
  overallScore,
  selectedReportWeek,
  selectedPlanWeek,
  savedSnapshotCount,
  bitrix24Snapshot,
  onSaveSnapshot,
  scopeProjectName,
}: {
  reports: TaskLogicReport[];
  overallScore: ProjectTaskScore;
  selectedReportWeek: WeekWindow;
  selectedPlanWeek: WeekWindow;
  savedSnapshotCount: number;
  bitrix24Snapshot: Bitrix24Snapshot;
  onSaveSnapshot: () => void;
  scopeProjectName?: string;
}) {
  const hasEnoughHistory = savedSnapshotCount >= 2;
  const [openedItems, setOpenedItems] = useState<{ title: string; items: WeeklyReportItem[] } | null>(null);
  const openItems = (title: string, items: WeeklyReportItem[]) => {
    setOpenedItems((current) =>
      current?.title === title ? null : { title, items },
    );
  };

  return (
    <section className="report-logic-mode">
      <ReportScoreOverview
        score={overallScore}
        reports={reports}
        selectedReportWeek={selectedReportWeek}
        selectedPlanWeek={selectedPlanWeek}
        savedSnapshotCount={savedSnapshotCount}
        bitrix24Snapshot={bitrix24Snapshot}
        onSaveSnapshot={onSaveSnapshot}
        onOpenItems={openItems}
      />

      {openedItems && (
        <WeeklyReportDrilldown
          title={openedItems.title}
          items={openedItems.items}
          empty="По этому сигналу задач нет."
          onClose={() => setOpenedItems(null)}
        />
      )}

      <div className="project-score-grid">
        {reports.length ? (
          reports.map((report) => <ProjectTaskScoreCard key={report.id} report={report} onOpenItems={openItems} />)
        ) : (
          <div className="weekly-report-empty">Пока нет задач для оценки.</div>
        )}
      </div>

      <section className="panel task-logic-board">
        <div className="section-heading compact-heading">
          <div>
            <h2>{scopeProjectName ? `Динамика выполнения: ${scopeProjectName}` : 'Динамика выполнения'}</h2>
            <p>
              Сравнение отчетных снимков: что тянется, что добавилось, что закрыли и где переносился срок.
            </p>
          </div>
          <span className={hasEnoughHistory ? 'snapshot-status success' : 'snapshot-status'}>
            {hasEnoughHistory ? 'История активна' : 'История начнется со следующего отчета'}
          </span>
        </div>

        <div className="task-logic-board-grid">
          {reports.length ? (
            reports.map((report) => (
              <TaskLogicProjectCard
                key={report.id}
                report={report}
                hasEnoughHistory={hasEnoughHistory}
                onOpenItems={openItems}
              />
            ))
          ) : (
            <div className="weekly-report-empty">Проектов с рабочими задачами пока нет.</div>
          )}
        </div>
      </section>
    </section>
  );
}

function WeeklyTaskSummaryTable({
  reports,
  selected,
  onSelect,
}: {
  reports: WeeklyProjectReport[];
  selected: ReportDrilldownState | null;
  onSelect: (projectId: string, filter: TaskReportFilter) => void;
}) {
  const rows = reports.filter((report) => report.summary);
  const filters: TaskReportFilter[] = ['all', 'done', 'open', 'active', 'planned', 'risk', 'overdue', 'lateDone', 'withoutDeadline'];

  return (
    <section className="panel report-summary-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>Сводка выполнения по проектам</h2>
          <p>Нажми на число, чтобы открыть именно эти задачи выбранного проекта.</p>
        </div>
      </div>
      <div className="report-summary-table" role="table" aria-label="Сводка выполнения задач по SEO-проектам">
        <div className="report-summary-row report-summary-head" role="row">
          <span>Проект</span>
          {filters.map((filter) => (
            <span key={filter}>{taskReportFilterLabels[filter]}</span>
          ))}
          <span>% выполнения</span>
        </div>
        {rows.length ? (
          rows.map((report) => {
            const summary = report.summary;
            if (!summary) return null;
            return (
              <div className="report-summary-row" role="row" key={report.id}>
                <strong>
                  <i style={{ background: report.color }} />
                  {report.title}
                </strong>
                {filters.map((filter) => {
                  const value =
                    filter === 'all'
                      ? summary.total
                      : filter === 'done'
                        ? summary.done
                        : filter === 'open'
                          ? summary.open
                          : filter === 'planned'
                            ? summary.planned
                            : filter === 'active'
                              ? summary.active
                              : filter === 'risk'
                                ? summary.risk
                                : filter === 'overdue'
                                  ? summary.overdue
                                  : filter === 'lateDone'
                                    ? summary.lateDone
                                    : summary.withoutDeadline;
                  const isActive = selected?.projectId === report.id && selected.filter === filter;
                  return (
                    <button
                      className={`${isActive ? 'is-active' : ''} ${filter === 'overdue' && value ? 'is-danger' : ''}`}
                      key={filter}
                      type="button"
                      onClick={() => onSelect(report.id, filter)}
                      disabled={value === 0}
                    >
                      {value}
                    </button>
                  );
                })}
                <em>{summary.completionPercent}%</em>
              </div>
            );
          })
        ) : (
          <div className="weekly-report-empty report-summary-empty">По выбранному проекту пока нет данных для сводки.</div>
        )}
      </div>
    </section>
  );
}

function WeeklyReportDrilldown({
  title,
  items,
  empty,
  onClose,
}: {
  title: string;
  items: WeeklyReportItem[];
  empty: string;
  onClose: () => void;
}) {
  return (
    <section className="panel report-drilldown-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>{title || 'Рабочие задачи'}</h2>
          <p>Раскрывай строку, чтобы увидеть сроки, факт, описание, источник и этапы.</p>
        </div>
        <button className="task-action-button" type="button" onClick={onClose}>
          <X size={14} />
          Закрыть
        </button>
      </div>
      <WeeklyReportList title="Задачи по счетчику" items={items} empty={empty} />
    </section>
  );
}

function WeeklyTaskTrendPanel({ reports }: { reports: WeeklyProjectReport[] }) {
  const points = reports.reduce<WeeklyTaskTrendPoint[]>((acc, report) => {
    report.trend?.forEach((point, index) => {
      const current = acc[index] ?? {
        ...point,
        created: 0,
        completed: 0,
        deadline: 0,
        closedByWeekEnd: 0,
        onTime: 0,
        notClosed: 0,
        completionPercent: 0,
      };
      current.created += point.created;
      current.completed += point.completed;
      current.deadline += point.deadline;
      current.closedByWeekEnd += point.closedByWeekEnd;
      current.onTime += point.onTime;
      current.notClosed += point.notClosed;
      current.completionPercent = current.deadline
        ? Math.round((current.closedByWeekEnd / current.deadline) * 100)
        : 0;
      acc[index] = current;
    });
    return acc;
  }, []);
  const maxValue = Math.max(...points.map((point) => Math.max(point.created, point.completed, point.deadline, point.notClosed)), 1);

  return (
    <section className="panel report-trend-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>Недельная динамика задач</h2>
          <p>Последние шесть недель до выбранной отчетной папки, расчет по текущему реестру задач.</p>
        </div>
      </div>
      {points.length ? (
        <div className="report-trend-grid">
          {points.map((point) => (
            <article className="report-trend-week" key={point.start}>
              <strong>{point.label}</strong>
              <div className="report-trend-bars" aria-hidden="true">
                <span className="created" style={{ height: `${Math.max(6, (point.created / maxValue) * 100)}%` }} />
                <span className="deadline" style={{ height: `${Math.max(6, (point.deadline / maxValue) * 100)}%` }} />
                <span className="completed" style={{ height: `${Math.max(6, (point.completed / maxValue) * 100)}%` }} />
                <span className="missed" style={{ height: `${Math.max(6, (point.notClosed / maxValue) * 100)}%` }} />
              </div>
              <dl>
                <div>
                  <dt>Поставлено</dt>
                  <dd>{point.created}</dd>
                </div>
                <div>
                  <dt>План</dt>
                  <dd>{point.deadline}</dd>
                </div>
                <div>
                  <dt>Выполнено</dt>
                  <dd>{point.completed}</dd>
                </div>
                <div>
                  <dt>Не закрыто</dt>
                  <dd>{point.notClosed}</dd>
                </div>
                <div>
                  <dt>План закрыт</dt>
                  <dd>{point.completionPercent}%</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="weekly-report-empty">Динамика появится после сохранения хотя бы одного отчетного снимка.</div>
      )}
    </section>
  );
}

function ReportArchiveFolders({
  folders,
  selectedStart,
  onSelect,
}: {
  folders: WeeklyReportArchiveFolder[];
  selectedStart: string;
  onSelect: (start: string) => void;
}) {
  return (
    <section className="panel report-archive-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>Папка отчетов</h2>
          <p>Каждый сохраненный отчет привязан к понедельнику недели.</p>
        </div>
      </div>
      <div className="report-archive-grid">
        {folders.map((folder) => {
          const totalDone = folder.seoDone + folder.externalDone;
          const totalLate = folder.seoLate + folder.externalLate;
          const totalPlanned = folder.seoPlanned + folder.externalPlanned;
          return (
            <button
              className={`report-archive-folder ${folder.start === selectedStart ? 'is-active' : ''}`}
              key={folder.start}
              type="button"
              onClick={() => onSelect(folder.start)}
            >
              <span>
                <FileText size={15} />
                {folder.title}
              </span>
              <strong>{folder.rangeLabel}</strong>
              <p>
                Сделано: {totalDone} · Просрочено: {totalLate} · План: {totalPlanned}
              </p>
              <div className="report-archive-folder-metrics">
                <em>SEO {folder.seoDone}/{folder.seoLate}/{folder.seoPlanned}</em>
                <em>Сторонние {folder.externalDone}/{folder.externalLate}/{folder.externalPlanned}</em>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WeeklyReportSection({
  title,
  description,
  doneCount,
  lateCount,
  plannedCount,
  reports,
}: {
  title: string;
  description: string;
  doneCount: number;
  lateCount: number;
  plannedCount: number;
  reports: WeeklyProjectReport[];
}) {
  return (
    <section className="panel weekly-report-section">
      <div className="section-heading compact-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="weekly-report-counters" aria-label={`Счетчики ${title}`}>
          <span>
            <CheckCircle2 size={14} />
            {doneCount}
          </span>
          <span className={lateCount ? 'is-danger' : ''}>
            <AlertTriangle size={14} />
            {lateCount}
          </span>
          <span>
            <Clock3 size={14} />
            {plannedCount}
          </span>
        </div>
      </div>

      <div className="weekly-report-projects">
        {reports.length ? (
          reports.map((report) => <WeeklyReportProjectCard key={report.id} report={report} />)
        ) : (
          <div className="weekly-report-empty">Пока нет данных для недельного отчета.</div>
        )}
      </div>
    </section>
  );
}

function WeeklyReportProjectCard({ report }: { report: WeeklyProjectReport }) {
  const summary = report.summary;

  return (
    <article className="weekly-report-project" style={{ '--project-color': report.color } as CSSProperties}>
      <header>
        <span className="project-dot" />
        <h3>{report.title}</h3>
        {summary && (
          <div className="weekly-project-mini-summary">
            <span>{summary.done}/{summary.total} выполнено</span>
            <span>{summary.open} не выполнено</span>
            <span className={summary.overdue ? 'is-danger' : ''}>{summary.overdue} просрочено</span>
          </div>
        )}
      </header>
      <div className="weekly-report-columns">
        <WeeklyReportList title="Сделано за неделю" items={report.done} empty="Нет отмеченных завершений." />
        <WeeklyReportList title="Не выполнено в срок" items={report.late} empty="Просрочек в этом блоке нет." />
        <WeeklyReportList title="План на следующую неделю" items={report.planned} empty="Нет задач на эту неделю." />
      </div>
    </article>
  );
}

function WeeklyReportList({
  title,
  items,
  empty,
}: {
  title: string;
  items: WeeklyReportItem[];
  empty: string;
}) {
  return (
    <div className="weekly-report-column">
      <div className="weekly-report-column-head">
        <strong>{title}</strong>
        <em>{items.length}</em>
      </div>
      {items.length ? (
        <div className="weekly-report-list">
          {items.map((item) => (
            <details className={`weekly-report-line ${item.tone ?? ''}`} key={item.id}>
              <summary>
                <span className="mini-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
                {(item.date || item.statusLabel) && <em>{item.date ? formatDate(item.date) : item.statusLabel}</em>}
              </summary>
              <div className="weekly-report-line-detail">
                <dl>
                  <div>
                    <dt>Проект</dt>
                    <dd>{item.projectName ?? 'не указан'}</dd>
                  </div>
                  <div>
                    <dt>Ответственный</dt>
                    <dd>{item.ownerLabel ?? item.meta}</dd>
                  </div>
                  <div>
                    <dt>Поставлена</dt>
                    <dd>{formatDate(item.createdAt ?? '')}</dd>
                  </div>
                  <div>
                    <dt>Дедлайн</dt>
                    <dd>
                      {formatDate(item.deadline ?? '')}
                      {item.deadlineNote ? <span>{item.deadlineNote}</span> : null}
                    </dd>
                  </div>
                  <div>
                    <dt>Факт</dt>
                    <dd>{formatDate(item.completedAt ?? '')}</dd>
                  </div>
                  <div>
                    <dt>Срок</dt>
                    <dd>{item.timingLabel ?? item.statusLabel ?? 'не указан'}</dd>
                  </div>
                  <div>
                    <dt>Этапы</dt>
                    <dd>{item.timelineProgress ?? 'нет подзадач'}</dd>
                  </div>
                </dl>
                {item.description && <p>{item.description}</p>}
                {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} />
                    Открыть {item.sourceLabel ?? 'источник'}
                  </a>
                )}
                {item.timelineItems && item.timelineItems.length > 0 && (
                  <div className="weekly-report-stage-list">
                    {item.timelineItems.map((timelineItem) => (
                      <span key={timelineItem.id}>
                        {timelineItem.title} · {statusLabels[timelineItem.status]} · {formatDate(timelineItem.dueDate)}
                      </span>
                    ))}
                  </div>
                )}
                {item.logicTrail && item.logicTrail.length > 0 && (
                  <div className="weekly-report-event-line" aria-label="Линия изменений задачи">
                    {item.logicTrail.map((step) => (
                      <div className={`weekly-report-event-step ${step.tone}`} key={step.id}>
                        <i />
                        <span>{formatDate(step.date)}</span>
                        <strong>{step.title}</strong>
                        <em>{step.meta}</em>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="weekly-report-empty">{empty}</div>
      )}
    </div>
  );
}

function buildSeoWeeklyReports(
  projects: Project[],
  tasks: Task[],
  peopleById: Map<string, Person>,
  previousWeek: WeekWindow,
  currentWeek: WeekWindow,
) {
  const reportSendDate = currentWeek.start;
  const today = todayIso();

  return projects
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const done: WeeklyReportItem[] = [];
      const late: WeeklyReportItem[] = [];
      const planned: WeeklyReportItem[] = [];
      const summary = buildProjectTaskSummary(project, projectTasks, peopleById, today);
      const trend = buildWeeklyTaskTrend(projectTasks, previousWeek);

      projectTasks.forEach((task) => {
        const isSentReportTask = isWeeklyReportTask(task);
        const doneTimelineItems = task.timeline.filter(
          (item) =>
            item.status === 'done' &&
            (isIsoInWindow(item.completedAt, previousWeek) ||
              (isSentReportTask && item.completedAt === reportSendDate)),
        );

        if (doneTimelineItems.length) {
          doneTimelineItems.forEach((item) => {
            done.push(makeTimelineReportItem(task, item, project, peopleById, today, 'done'));
          });
        } else if (
          task.status === 'done' &&
          (isIsoInWindow(task.completedAt, previousWeek) ||
            (isSentReportTask && task.completedAt === reportSendDate))
        ) {
          done.push(makeTaskReportItem(task, project, peopleById, today, 'done'));
        }

        const openTimelineItems = task.timeline.filter((item) => item.status !== 'done');
        const lateTimelineItems = openTimelineItems.filter((item) => Boolean(item.dueDate) && item.dueDate < currentWeek.start);
        const currentTimelineItems = openTimelineItems.filter(
          (item) => isIsoInWindow(item.dueDate, currentWeek) || (!item.dueDate && item.status === 'active'),
        );

        if (lateTimelineItems.length) {
          lateTimelineItems.forEach((item) => {
            late.push(makeTimelineReportItem(task, item, project, peopleById, today, 'late'));
          });
        }

        if (currentTimelineItems.length) {
          currentTimelineItems.forEach((item) => {
            planned.push(makeTimelineReportItem(task, item, project, peopleById, today, 'planned'));
          });
        }

        if (
          lateTimelineItems.length === 0 &&
          currentTimelineItems.length === 0 &&
          task.status !== 'done' &&
          Boolean(task.deadline) &&
          task.deadline < currentWeek.start
        ) {
          late.push(makeTaskReportItem(task, project, peopleById, today, 'late'));
        } else if (
          lateTimelineItems.length === 0 &&
          currentTimelineItems.length === 0 &&
          task.status !== 'done' &&
          (isIsoInWindow(task.deadline, currentWeek) || (!task.deadline && task.status === 'active'))
        ) {
          planned.push(makeTaskReportItem(task, project, peopleById, today, 'planned'));
        }
      });

      return {
        id: project.id,
        title: project.name,
        color: project.color,
        done: sortWeeklyItems(done, 'desc'),
        late: sortWeeklyItems(late, 'asc'),
        planned: sortWeeklyItems(planned, 'asc'),
        summary,
        trend,
      };
    })
    .filter((report) => report.done.length || report.late.length || report.planned.length || report.summary?.total);
}

function buildExternalWeeklyReports(
  source: ExternalProjectsSource,
  externalAdditions: ExternalProjectAdditions,
  previousWeek: WeekWindow,
  currentWeek: WeekWindow,
) {
  const colors: Record<ExternalProjectSection['status'], string> = {
    active: '#326d7a',
    done: '#d8eef3',
    waiting: '#ffe1d3',
    next: '#ffe1d3',
  };

  return source.sections
    .map((section) => {
      const additions = getExternalAdditions(externalAdditions, section.id);
      const weeklyUpdates = getExternalWeeklyUpdates(section, additions, source);
      const done: WeeklyReportItem[] = [];
      const late: WeeklyReportItem[] = [];
      const planned: WeeklyReportItem[] = [];

      weeklyUpdates.forEach((week) => {
        const weekDate = parseShortRuDateLabel(`${week.weekLabel} ${week.dateLabel}`);
        if (!isIsoInWindow(weekDate, previousWeek)) return;
        week.items
          .filter((item) => item.status === 'done')
          .forEach((item) => {
            done.push({
              id: `${section.id}-${week.id}-${item.id}-done`,
              title: item.title,
              meta: `${source.title} · лист ${week.weekLabel}`,
              date: weekDate,
              statusLabel: item.displayStatusLabel ?? externalTimelineStatusLabels[item.status],
              tone: 'success',
            });
          });
      });

      if (section.status === 'done' && done.length === 0) {
        getExternalTimeline(section)
          .filter((item) => item.status === 'done')
          .forEach((item) => {
            done.push({
              id: `${section.id}-${item.id}-status-done`,
              title: item.title,
              meta: 'Статус папки: готово',
              statusLabel: externalStatusLabels[section.status],
              tone: 'success',
            });
          });
      }

      if (section.status !== 'done') {
        getExternalTimeline(section)
          .filter((item) => item.status !== 'done')
          .forEach((item) => {
            const itemDate = parseShortRuDateLabel(item.dateLabel ?? '');
            const overdue = Boolean(itemDate) && itemDate < currentWeek.start;
            const row: WeeklyReportItem = {
              id: `${section.id}-${item.id}-planned`,
              title: item.title,
              meta: `${item.ownerLabel ?? source.collaborator} · ${
                item.displayStatusLabel ?? externalStatusLabels[section.status]
              }`,
              date: itemDate,
              statusLabel: overdue ? 'просрочено' : item.displayStatusLabel ?? externalTimelineStatusLabels[item.status],
              tone: overdue ? 'danger' : item.status === 'waiting' || section.status === 'waiting' ? 'warning' : 'info',
            };

            if (overdue) {
              late.push(row);
              return;
            }

            if (isIsoInWindow(itemDate, currentWeek) || (!itemDate && (item.status === 'active' || section.status === 'active'))) {
              planned.push(row);
            }
          });
      }

      return {
        id: section.id,
        title: section.title,
        color: colors[section.status],
        done: sortWeeklyItems(done, 'desc'),
        late: sortWeeklyItems(late, 'asc'),
        planned: sortWeeklyItems(planned, 'asc'),
      };
    })
    .filter((report) => report.done.length || report.late.length || report.planned.length);
}

function getTaskOwnersLabel(task: Task, peopleById: Map<string, Person>) {
  return (
    task.ownerIds
      .map((ownerId) => peopleById.get(ownerId)?.name)
      .filter(Boolean)
      .join(', ') || 'Без ответственного'
  );
}

function makeTaskReportItem(
  task: Task,
  project: Project,
  peopleById: Map<string, Person>,
  today = todayIso(),
  idSuffix = 'task',
): WeeklyReportItem {
  const owners = getTaskOwnersLabel(task, peopleById);
  const timing = getTimingInfo(task.status, task.deadline, task.completedAt, today);

  return {
    id: `${task.id}-${idSuffix}`,
    taskId: task.id,
    title: task.title,
    meta: `${project.name} · ${owners}`,
    projectName: project.name,
    ownerLabel: owners,
    description: task.description,
    sourceLabel: task.sourceLabel,
    sourceUrl: task.sourceUrl,
    createdAt: task.createdAt,
    deadline: task.deadline,
    completedAt: task.completedAt,
    deadlineNote: getTaskDeadlineNote(task),
    timingLabel: timing.label,
    lateDays: timing.lateDays,
    timelineProgress: getTaskTimelineProgress(task),
    timelineItems: task.timeline,
    date: task.status === 'done' ? task.completedAt : task.deadline,
    statusLabel: timing.label,
    tone: timing.tone,
  };
}

function makeTimelineReportItem(
  task: Task,
  item: TimelineItem,
  project: Project,
  peopleById: Map<string, Person>,
  today = todayIso(),
  idSuffix = 'timeline',
): WeeklyReportItem {
  const owner = peopleById.get(item.ownerId)?.name ?? getTaskOwnersLabel(task, peopleById);
  const timing = getTimingInfo(item.status, item.dueDate, item.completedAt, today);

  return {
    id: `${task.id}-${item.id}-${idSuffix}`,
    taskId: task.id,
    title: item.title,
    meta: `${task.title} · ${owner}`,
    projectName: project.name,
    ownerLabel: owner,
    description: task.description,
    sourceLabel: task.sourceLabel,
    sourceUrl: task.sourceUrl,
    createdAt: task.createdAt,
    deadline: item.dueDate,
    completedAt: item.completedAt,
    deadlineNote: getTaskDeadlineNote(task),
    timingLabel: timing.label,
    lateDays: timing.lateDays,
    timelineProgress: getTaskTimelineProgress(task),
    timelineItems: task.timeline,
    date: item.status === 'done' ? item.completedAt : item.dueDate,
    statusLabel: timing.label,
    tone: timing.tone,
  };
}

function percentOf(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function makeEmptyLogicCategoryMap(): Record<TaskLogicCategory, WeeklyReportItem[]> {
  return {
    carried: [],
    added: [],
    done: [],
    lateDone: [],
    deadlineMoved: [],
    stuck: [],
  };
}

function makeEmptyScoreMetricMap(): Record<TaskScoreMetric, WeeklyReportItem[]> {
  return {
    done: [],
    overdue: [],
    lateDone: [],
    carried: [],
    risk: [],
    withoutDeadline: [],
  };
}

function toDateOnly(value = '') {
  return value ? value.slice(0, 10) : '';
}

function isDateInWindow(value: string | undefined, window: WeekWindow) {
  return isIsoInWindow(toDateOnly(value), window);
}

function getTaskStatusAtDate(task: Task, reportDate: string): Status {
  if (task.status === 'done' && !task.completedAt) return 'done';
  if (task.completedAt && task.completedAt <= reportDate) return 'done';
  return task.status === 'done' ? 'active' : task.status;
}

function getTimelineStatusAtDate(item: TimelineItem, reportDate: string): Status {
  if (item.status === 'done' && !item.completedAt) return 'done';
  if (item.completedAt && item.completedAt <= reportDate) return 'done';
  return item.status === 'done' ? 'active' : item.status;
}

function makeTaskReportSnapshot(
  tasks: Task[],
  reportDate: string,
  bitrix24Snapshot: Bitrix24Snapshot = EMPTY_BITRIX24_SNAPSHOT,
  source: TaskReportSnapshot['source'] = 'dashboard',
): TaskReportSnapshot {
  const snapshotTasks = tasks
    .filter(isCountableTask)
    .filter((task) => !task.createdAt || task.createdAt <= reportDate)
    .map((task) => {
      const status = getTaskStatusAtDate(task, reportDate);
      const timeline = task.timeline.filter(() => !task.createdAt || task.createdAt <= reportDate);
      const timelineDone = timeline.filter((item) => getTimelineStatusAtDate(item, reportDate) === 'done').length;

      return {
        taskId: task.id,
        projectId: task.projectId,
        title: task.title,
        status,
        ownerIds: task.ownerIds,
        deadline: task.deadline,
        completedAt: task.completedAt && task.completedAt <= reportDate ? task.completedAt : undefined,
        createdAt: task.createdAt,
        open: status !== 'done',
        timelineDone,
        timelineTotal: timeline.length,
      };
    });

  return {
    id: `snapshot-${reportDate}`,
    reportDate,
    capturedAt: new Date().toISOString(),
    source,
    taskCount: snapshotTasks.length,
    bitrixTaskCount: bitrix24Snapshot.tasks.length,
    tasks: snapshotTasks,
  };
}

function normalizeReportSnapshots(snapshots: TaskReportSnapshot[]) {
  return snapshots
    .filter((snapshot) => snapshot && typeof snapshot.reportDate === 'string' && Array.isArray(snapshot.tasks))
    .sort((left, right) => right.reportDate.localeCompare(left.reportDate));
}

function upsertTaskReportSnapshot(current: TaskReportSnapshot[], next: TaskReportSnapshot) {
  return [next, ...normalizeReportSnapshots(current).filter((snapshot) => snapshot.reportDate !== next.reportDate)]
    .sort((left, right) => right.reportDate.localeCompare(left.reportDate))
    .slice(0, 40);
}

function getReportSnapshotForDate(
  reportSnapshots: TaskReportSnapshot[],
  tasks: Task[],
  bitrix24Snapshot: Bitrix24Snapshot,
  reportDate: string,
) {
  return (
    normalizeReportSnapshots(reportSnapshots).find((snapshot) => snapshot.reportDate === reportDate) ??
    makeTaskReportSnapshot(tasks, reportDate, bitrix24Snapshot, 'inferred')
  );
}

function hasDeadlineMoveInWindow(task: Task, window: WeekWindow) {
  return getTaskHistory(task).some(
    (entry) =>
      isDateInWindow(entry.changedAt, window) &&
      entry.changes.some((change) => change.field === 'Дедлайн' || change.field.startsWith('Хронология:')),
  );
}

function buildTaskLogicTrail(
  task: Task,
  peopleById: Map<string, Person>,
  previousSnapshotItem: TaskReportSnapshotItem | undefined,
  currentSnapshotItem: TaskReportSnapshotItem | undefined,
  previousSnapshotDate: string,
  currentSnapshotDate: string,
  reportWeek: WeekWindow,
  openStreak: number,
): TaskLogicTrailStep[] {
  const steps: TaskLogicTrailStep[] = [
    {
      id: `${task.id}-created`,
      date: task.createdAt,
      title: 'Поставили задачу',
      meta: `${ownerNames(task.ownerIds, peopleById)} · дедлайн ${formatDate(task.deadline)}`,
      tone: 'info',
    },
  ];

  if (previousSnapshotItem?.open) {
    steps.push({
      id: `${task.id}-previous-open`,
      date: previousSnapshotDate,
      title: 'Была открыта в прошлом отчете',
      meta: `${statusLabels[previousSnapshotItem.status]} · этапы ${previousSnapshotItem.timelineDone}/${previousSnapshotItem.timelineTotal}`,
      tone: 'warning',
    });
  }

  getTaskHistory(task)
    .filter((entry) => isDateInWindow(entry.changedAt, reportWeek))
    .forEach((entry) => {
      steps.push({
        id: entry.id,
        date: toDateOnly(entry.changedAt),
        title: entry.action,
        meta: entry.summary,
        tone: entry.changes.some((change) => change.field === 'Дедлайн') ? 'warning' : 'info',
      });
    });

  task.timeline
    .filter((item) => item.status === 'done' && isDateInWindow(item.completedAt, reportWeek))
    .forEach((item) => {
      steps.push({
        id: `${task.id}-${item.id}-done`,
        date: item.completedAt ?? currentSnapshotDate,
        title: `Закрыли этап: ${item.title}`,
        meta: `${peopleById.get(item.ownerId)?.name ?? 'Ответственный'} · срок ${formatDate(item.dueDate)}`,
        tone: item.completedAt && item.dueDate && item.completedAt > item.dueDate ? 'danger' : 'success',
      });
    });

  if (task.completedAt && isDateInWindow(task.completedAt, reportWeek)) {
    steps.push({
      id: `${task.id}-completed`,
      date: task.completedAt,
      title: 'Закрыли задачу',
      meta: task.deadline && task.completedAt > task.deadline ? `Позже срока на ${daysBetweenIso(task.deadline, task.completedAt)} дн.` : 'В срок',
      tone: task.deadline && task.completedAt > task.deadline ? 'danger' : 'success',
    });
  }

  if (currentSnapshotItem?.open) {
    steps.push({
      id: `${task.id}-current-open`,
      date: currentSnapshotDate,
      title: openStreak >= 2 ? 'Тянется дальше' : 'Осталась в работе',
      meta: openStreak >= 2 ? `${openStreak} отчета подряд` : statusLabels[currentSnapshotItem.status],
      tone: openStreak >= 2 ? 'danger' : 'warning',
    });
  }

  return steps
    .filter((step) => step.date)
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-8);
}

function getOpenSnapshotStreak(taskId: string, snapshots: TaskReportSnapshot[]) {
  let streak = 0;
  for (const snapshot of snapshots) {
    const item = snapshot.tasks.find((snapshotTask) => snapshotTask.taskId === taskId);
    if (!item?.open) break;
    streak += 1;
  }
  return streak;
}

function getScoreGrade(score: number, total: number): Pick<ProjectTaskScore, 'label' | 'tone'> {
  if (total === 0) return { label: 'нет задач', tone: 'info' };
  if (score >= 85) return { label: 'стабильно', tone: 'success' };
  if (score >= 70) return { label: 'нужен контроль', tone: 'warning' };
  if (score >= 50) return { label: 'риск срыва', tone: 'warning' };
  return { label: 'критично', tone: 'danger' };
}

function buildProjectTaskScore(
  project: Project,
  projectTasks: Task[],
  peopleById: Map<string, Person>,
  today: string,
  itemsByCategory: Record<TaskLogicCategory, WeeklyReportItem[]>,
  logicTrailByTaskId: Map<string, TaskLogicTrailStep[]> = new Map(),
): ProjectTaskScore {
  const summary = buildProjectTaskSummary(project, projectTasks, peopleById, today);
  const itemsByMetric = makeEmptyScoreMetricMap();
  itemsByMetric.done = summary.itemsByFilter.done;
  itemsByMetric.overdue = summary.itemsByFilter.overdue;
  itemsByMetric.lateDone = summary.itemsByFilter.lateDone;
  itemsByMetric.carried = itemsByCategory.carried;
  itemsByMetric.risk = summary.itemsByFilter.risk;
  itemsByMetric.withoutDeadline = summary.itemsByFilter.withoutDeadline;
  (Object.keys(itemsByMetric) as TaskScoreMetric[]).forEach((metric) => {
    itemsByMetric[metric] = itemsByMetric[metric].map((item) => {
      const trail = item.taskId ? logicTrailByTaskId.get(item.taskId) : undefined;
      return trail ? { ...item, logicTrail: trail } : item;
    });
  });

  const completionPercent = summary.completionPercent;
  const currentOverduePercent = percentOf(summary.overdue, summary.total);
  const lateDonePercent = percentOf(summary.lateDone, summary.total);
  const carriedPercent = percentOf(itemsByCategory.carried.length, summary.total);
  const riskPercent = percentOf(summary.risk, summary.total);
  const deadlineFilledPercent = summary.total ? percentOf(summary.total - summary.withoutDeadline, summary.total) : 0;
  const score = summary.total
    ? Math.round(
        completionPercent * 0.4 +
          (100 - currentOverduePercent) * 0.25 +
          (100 - carriedPercent) * 0.2 +
          (100 - riskPercent) * 0.1 +
          deadlineFilledPercent * 0.05,
      )
    : 0;
  const grade = getScoreGrade(score, summary.total);
  const signals = [
    summary.overdue ? `${summary.overdue} текущих просрочек` : '',
    itemsByCategory.stuck.length ? `${itemsByCategory.stuck.length} задач не закрываются 2+ отчета` : '',
    itemsByCategory.carried.length ? `${itemsByCategory.carried.length} тянутся из прошлого отчета` : '',
    summary.risk ? `${summary.risk} задач в риске` : '',
    summary.lateDone ? `${summary.lateDone} закрыты с опозданием` : '',
    summary.withoutDeadline ? `${summary.withoutDeadline} без дедлайна` : '',
  ].filter(Boolean);

  return {
    score,
    ...grade,
    total: summary.total,
    completionPercent,
    currentOverduePercent,
    lateDonePercent,
    carriedPercent,
    riskPercent,
    deadlineFilledPercent,
    done: summary.done,
    overdue: summary.overdue,
    lateDone: summary.lateDone,
    carried: itemsByCategory.carried.length,
    stuck: itemsByCategory.stuck.length,
    risk: summary.risk,
    withoutDeadline: summary.withoutDeadline,
    signals: signals.length ? signals.slice(0, 5) : ['сроки под контролем'],
    itemsByMetric,
  };
}

function buildTaskLogicReports(
  projects: Project[],
  tasks: Task[],
  peopleById: Map<string, Person>,
  reportSnapshots: TaskReportSnapshot[],
  bitrix24Snapshot: Bitrix24Snapshot,
  reportWeek: WeekWindow,
  planWeek: WeekWindow,
): TaskLogicReport[] {
  const currentSnapshotDate = planWeek.start;
  const previousSnapshotDate = reportWeek.start;
  const normalizedSnapshots = normalizeReportSnapshots(reportSnapshots).filter(
    (snapshot) => snapshot.reportDate <= currentSnapshotDate,
  );
  const currentSnapshot = getReportSnapshotForDate(reportSnapshots, tasks, bitrix24Snapshot, currentSnapshotDate);
  const previousSnapshot = getReportSnapshotForDate(reportSnapshots, tasks, bitrix24Snapshot, previousSnapshotDate);
  const previousByTaskId = new Map(previousSnapshot.tasks.map((item) => [item.taskId, item]));
  const currentByTaskId = new Map(currentSnapshot.tasks.map((item) => [item.taskId, item]));
  const savedDates = new Set(normalizedSnapshots.map((snapshot) => snapshot.reportDate));
  const streakSnapshots = normalizedSnapshots;
  const today = todayIso();

  return projects
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id && isCountableTask(task));
      const itemsByCategory = makeEmptyLogicCategoryMap();
      const hasSavedHistory = savedDates.has(currentSnapshotDate) && savedDates.has(previousSnapshotDate);
      const logicTrailByTaskId = new Map<string, TaskLogicTrailStep[]>();

      projectTasks.forEach((task) => {
        const previousSnapshotItem = previousByTaskId.get(task.id);
        const currentSnapshotItem = currentByTaskId.get(task.id);
        const openStreak = getOpenSnapshotStreak(task.id, streakSnapshots);
        const trail = buildTaskLogicTrail(
          task,
          peopleById,
          previousSnapshotItem,
          currentSnapshotItem,
          previousSnapshotDate,
          currentSnapshotDate,
          reportWeek,
          openStreak,
        );
        logicTrailByTaskId.set(task.id, trail);
        const baseItem = {
          ...makeTaskReportItem(task, project, peopleById, today, 'logic'),
          logicTrail: trail,
        };

        if (hasSavedHistory && previousSnapshotItem?.open && currentSnapshotItem?.open) {
          itemsByCategory.carried.push({
            ...baseItem,
            id: `${task.id}-carried`,
            date: currentSnapshotDate,
            statusLabel: openStreak >= 2 ? `${openStreak} отчета` : 'тянется',
            tone: openStreak >= 2 ? 'danger' : 'warning',
          });
        }

        if (isIsoInWindow(task.createdAt, reportWeek) || (!previousSnapshotItem && currentSnapshotItem)) {
          itemsByCategory.added.push({
            ...baseItem,
            id: `${task.id}-added`,
            date: task.createdAt,
            statusLabel: 'добавлено',
            tone: 'info',
          });
        }

        if (task.completedAt && isIsoInWindow(task.completedAt, reportWeek)) {
          const isLate = Boolean(task.deadline) && task.completedAt > task.deadline;
          const item = {
            ...baseItem,
            id: `${task.id}-logic-done`,
            date: task.completedAt,
            statusLabel: isLate ? 'позже срока' : 'готово',
            tone: isLate ? 'danger' : 'success',
          } satisfies WeeklyReportItem;
          itemsByCategory.done.push(item);
          if (isLate) itemsByCategory.lateDone.push({ ...item, id: `${task.id}-logic-late-done` });
        }

        if (hasDeadlineMoveInWindow(task, reportWeek)) {
          itemsByCategory.deadlineMoved.push({
            ...baseItem,
            id: `${task.id}-deadline-moved`,
            date: currentSnapshotDate,
            statusLabel: 'срок менялся',
            tone: 'warning',
          });
        }

        if (hasSavedHistory && currentSnapshotItem?.open && openStreak >= 2) {
          itemsByCategory.stuck.push({
            ...baseItem,
            id: `${task.id}-stuck`,
            date: currentSnapshotDate,
            statusLabel: `${openStreak} отчета`,
            tone: 'danger',
          });
        }
      });

      Object.keys(itemsByCategory).forEach((key) => {
        const category = key as TaskLogicCategory;
        itemsByCategory[category] = sortWeeklyItems(
          itemsByCategory[category],
          category === 'done' || category === 'lateDone' ? 'desc' : 'asc',
        );
      });

      return {
        id: project.id,
        title: project.name,
        color: project.color,
        score: buildProjectTaskScore(project, projectTasks, peopleById, today, itemsByCategory, logicTrailByTaskId),
        hasSavedHistory,
        currentSnapshotDate,
        previousSnapshotDate,
        itemsByCategory,
      };
    })
    .filter((report) => report.score.total || Object.values(report.itemsByCategory).some((items) => items.length));
}

function buildOverallTaskScore(reports: TaskLogicReport[]): ProjectTaskScore {
  const itemsByMetric = makeEmptyScoreMetricMap();
  reports.forEach((report) => {
    (Object.keys(itemsByMetric) as TaskScoreMetric[]).forEach((metric) => {
      itemsByMetric[metric].push(...report.score.itemsByMetric[metric]);
    });
  });

  const total = reports.reduce((sum, report) => sum + report.score.total, 0);
  const done = reports.reduce((sum, report) => sum + report.score.done, 0);
  const overdue = reports.reduce((sum, report) => sum + report.score.overdue, 0);
  const lateDone = reports.reduce((sum, report) => sum + report.score.lateDone, 0);
  const carried = reports.reduce((sum, report) => sum + report.score.carried, 0);
  const stuck = reports.reduce((sum, report) => sum + report.score.stuck, 0);
  const risk = reports.reduce((sum, report) => sum + report.score.risk, 0);
  const withoutDeadline = reports.reduce((sum, report) => sum + report.score.withoutDeadline, 0);
  const completionPercent = percentOf(done, total);
  const currentOverduePercent = percentOf(overdue, total);
  const lateDonePercent = percentOf(lateDone, total);
  const carriedPercent = percentOf(carried, total);
  const riskPercent = percentOf(risk, total);
  const deadlineFilledPercent = total ? percentOf(total - withoutDeadline, total) : 0;
  const score = total
    ? Math.round(
        completionPercent * 0.4 +
          (100 - currentOverduePercent) * 0.25 +
          (100 - carriedPercent) * 0.2 +
          (100 - riskPercent) * 0.1 +
          deadlineFilledPercent * 0.05,
      )
    : 0;
  const grade = getScoreGrade(score, total);
  const problemSignals = reports
    .flatMap((report) =>
      report.score.signals
        .filter((signal) => signal !== 'сроки под контролем')
        .map((signal) => `${report.title}: ${signal}`),
    )
    .slice(0, 5);

  return {
    score,
    ...grade,
    total,
    completionPercent,
    currentOverduePercent,
    lateDonePercent,
    carriedPercent,
    riskPercent,
    deadlineFilledPercent,
    done,
    overdue,
    lateDone,
    carried,
    stuck,
    risk,
    withoutDeadline,
    signals: problemSignals.length ? problemSignals : ['критичных сигналов нет'],
    itemsByMetric,
  };
}

function emptyTaskReportFilterMap(): Record<TaskReportFilter, WeeklyReportItem[]> {
  return {
    all: [],
    done: [],
    open: [],
    planned: [],
    active: [],
    risk: [],
    overdue: [],
    lateDone: [],
    withoutDeadline: [],
  };
}

function buildProjectTaskSummary(
  project: Project,
  projectTasks: Task[],
  peopleById: Map<string, Person>,
  today = todayIso(),
): WeeklyProjectTaskSummary {
  const itemsByFilter = emptyTaskReportFilterMap();
  const countableTasks = projectTasks.filter(isCountableTask);

  countableTasks.forEach((task) => {
    const item = makeTaskReportItem(task, project, peopleById, today, 'summary');
    itemsByFilter.all.push(item);

    if (task.status === 'done') {
      itemsByFilter.done.push(item);
      if (task.deadline && task.completedAt && task.completedAt > task.deadline) {
        itemsByFilter.lateDone.push(item);
      }
      return;
    }

    itemsByFilter.open.push(item);
    itemsByFilter[task.status].push(item);

    if (!task.deadline) {
      itemsByFilter.withoutDeadline.push(item);
    } else if (task.deadline < today) {
      itemsByFilter.overdue.push(item);
    }
  });

  Object.keys(itemsByFilter).forEach((key) => {
    const filterKey = key as TaskReportFilter;
    itemsByFilter[filterKey] = sortWeeklyItems(itemsByFilter[filterKey], filterKey === 'done' ? 'desc' : 'asc');
  });

  const total = countableTasks.length;
  const done = itemsByFilter.done.length;

  return {
    total,
    done,
    open: itemsByFilter.open.length,
    planned: itemsByFilter.planned.length,
    active: itemsByFilter.active.length,
    risk: itemsByFilter.risk.length,
    overdue: itemsByFilter.overdue.length,
    lateDone: itemsByFilter.lateDone.length,
    withoutDeadline: itemsByFilter.withoutDeadline.length,
    completionPercent: total ? Math.round((done / total) * 100) : 0,
    itemsByFilter,
  };
}

function buildWeeklyTaskTrend(projectTasks: Task[], selectedWeek: WeekWindow): WeeklyTaskTrendPoint[] {
  const countableTasks = projectTasks.filter(isCountableTask);
  return Array.from({ length: 6 }, (_, index) => {
    const start = addDaysToIso(selectedWeek.start, (index - 5) * 7);
    const window = getWeekWindowFromIso(start);
    const weekPlan = countableTasks.filter((task) => isIsoInWindow(task.deadline, window));
    const completedFromPlan = weekPlan.filter(
      (task) => task.status === 'done' && typeof task.completedAt === 'string' && task.completedAt <= window.end,
    );
    const onTime = completedFromPlan.filter((task) => task.deadline && task.completedAt && task.completedAt <= task.deadline);

    return {
      start,
      label: formatNumericDate(start),
      created: countableTasks.filter((task) => isIsoInWindow(task.createdAt, window)).length,
      completed: countableTasks.filter((task) => task.status === 'done' && isIsoInWindow(task.completedAt, window)).length,
      deadline: weekPlan.length,
      closedByWeekEnd: completedFromPlan.length,
      onTime: onTime.length,
      notClosed: Math.max(0, weekPlan.length - completedFromPlan.length),
      completionPercent: weekPlan.length ? Math.round((completedFromPlan.length / weekPlan.length) * 100) : 0,
    };
  });
}

function sortWeeklyItems(items: WeeklyReportItem[], direction: 'asc' | 'desc') {
  return [...items].sort((a, b) => {
    const left = a.date || '9999-12-31';
    const right = b.date || '9999-12-31';
    return direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
  });
}

function collectReportArchiveStarts(
  tasks: Task[],
  externalSource: ExternalProjectsSource,
  externalAdditions: ExternalProjectAdditions,
  latestPastWeek: WeekWindow,
) {
  const starts = new Set<string>([latestPastWeek.start]);
  const addArchiveDate = (value?: string, parentTask?: Task) => {
    const rawStart = getWeekStartIso(value ?? '');
    const start = parentTask && isWeeklyReportTask(parentTask) && rawStart ? addDaysToIso(rawStart, -7) : rawStart;
    if (start && start <= latestPastWeek.start) starts.add(start);
  };

  tasks.forEach((task) => {
    if (task.status === 'done') addArchiveDate(task.completedAt, task);
    task.timeline.forEach((item) => {
      if (item.status === 'done') addArchiveDate(item.completedAt, task);
    });
  });

  externalSource.sections.forEach((section) => {
    const additions = getExternalAdditions(externalAdditions, section.id);
    getExternalWeeklyUpdates(section, additions, externalSource).forEach((week) => {
      addArchiveDate(parseShortRuDateLabel(`${week.weekLabel} ${week.dateLabel}`));
    });
  });

  return [...starts].sort((left, right) => right.localeCompare(left));
}

function buildReportArchiveFolders(
  starts: string[],
  projects: Project[],
  tasks: Task[],
  peopleById: Map<string, Person>,
  externalSource: ExternalProjectsSource,
  externalAdditions: ExternalProjectAdditions,
): WeeklyReportArchiveFolder[] {
  return starts.map((start) => {
    const reportWeek = getWeekWindowFromIso(start);
    const planWeek = getWeekWindowFromIso(addDaysToIso(start, 7));
    const seoReports = buildSeoWeeklyReports(projects, tasks, peopleById, reportWeek, planWeek);
    const externalReports = buildExternalWeeklyReports(externalSource, externalAdditions, reportWeek, planWeek);

    return {
      start,
      title: formatReportArchiveTitle(reportWeek),
      rangeLabel: formatWeekWindow(reportWeek),
      seoDone: seoReports.reduce((sum, report) => sum + report.done.length, 0),
      seoLate: seoReports.reduce((sum, report) => sum + report.late.length, 0),
      seoPlanned: seoReports.reduce((sum, report) => sum + report.planned.length, 0),
      externalDone: externalReports.reduce((sum, report) => sum + report.done.length, 0),
      externalLate: externalReports.reduce((sum, report) => sum + report.late.length, 0),
      externalPlanned: externalReports.reduce((sum, report) => sum + report.planned.length, 0),
    };
  });
}

function SeoProjectsView({
  projects,
  tasks,
  people,
  peopleById,
  linkRows,
  linkSummaries,
  contentTopicsByProject,
  contentSummaries,
  contentSourcesByProject,
  contentErrorsByProject,
  workPlansByProject,
  auditSourcesByProject,
  managedResourcesByProject,
  paymentRows,
  paymentCashflowRows,
  paymentDraft,
  promotionSources,
  leadAnalyticsByProject,
  leadErrorsByProject,
  selectedProjectId,
  reportSnapshots,
  bitrix24Snapshot,
  onProjectChange,
  onReportSnapshotsChange,
  linkLoadStatus,
  linkError,
  linkUpdatedAt,
  contentLoadStatus,
  contentError,
  contentUpdatedAt,
  leadLoadStatus,
  leadError,
  leadUpdatedAt,
  metrikaLoadStatus,
  metrikaError,
  metrikaUpdatedAt,
  paymentCashflowLoadStatus,
  paymentCashflowError,
  paymentCashflowUpdatedAt,
  expanded,
  onReloadLinks,
  onReloadContent,
  onReloadLeads,
  onReloadMetrika,
  onReloadPaymentCashflow,
  onPaymentDraftChange,
  onPaymentAdd,
  onPaymentUpdate,
  onPaymentDelete,
  onToggleExpanded,
  onToggleTimeline,
  onStatusChange,
  onTimelineStatusChange,
  onTaskUpdate,
}: {
  projects: Project[];
  tasks: Task[];
  people: Person[];
  peopleById: Map<string, Person>;
  linkRows: LinkPurchase[];
  linkSummaries: Map<string, LinkPurchaseSummary>;
  contentTopicsByProject: Map<string, ContentPlanTopic[]>;
  contentSummaries: Map<string, ContentPlanSummary>;
  contentSourcesByProject: Map<string, ContentPlanSource>;
  contentErrorsByProject: Map<string, string>;
  workPlansByProject: Map<string, WorkPlanSource[]>;
  auditSourcesByProject: Map<string, ClientAuditSource[]>;
  managedResourcesByProject: Map<string, ManagedResource[]>;
  paymentRows: PaymentRow[];
  paymentCashflowRows: PaymentCashflowRow[];
  paymentDraft: PaymentDraft;
  promotionSources: PromotionResultSource[];
  leadAnalyticsByProject: Map<string, LeadAnalyticsSummary>;
  leadErrorsByProject: Map<string, string>;
  selectedProjectId: string;
  reportSnapshots: TaskReportSnapshot[];
  bitrix24Snapshot: Bitrix24Snapshot;
  onProjectChange: (projectId: string) => void;
  onReportSnapshotsChange: Dispatch<SetStateAction<TaskReportSnapshot[]>>;
  linkLoadStatus: LinkLoadStatus;
  linkError: string;
  linkUpdatedAt: string;
  contentLoadStatus: LinkLoadStatus;
  contentError: string;
  contentUpdatedAt: string;
  leadLoadStatus: LinkLoadStatus;
  leadError: string;
  leadUpdatedAt: string;
  metrikaLoadStatus: LinkLoadStatus;
  metrikaError: string;
  metrikaUpdatedAt: string;
  paymentCashflowLoadStatus: LinkLoadStatus;
  paymentCashflowError: string;
  paymentCashflowUpdatedAt: string;
  expanded: Set<string>;
  onReloadLinks: () => void;
  onReloadContent: () => void;
  onReloadLeads: () => void;
  onReloadMetrika: (mode?: MetrikaStatsLoadMode) => void;
  onReloadPaymentCashflow: () => void;
  onPaymentDraftChange: Dispatch<SetStateAction<PaymentDraft>>;
  onPaymentAdd: (projectIdOverride?: string) => void;
  onPaymentUpdate: (rowId: string, patch: Partial<PaymentRow>) => void;
  onPaymentDelete: (rowId: string) => void;
  onToggleExpanded: (taskId: string) => void;
  onToggleTimeline: (taskId: string, checked: boolean) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onTimelineStatusChange: (taskId: string, itemId: string, status: Status) => void;
  onTaskUpdate: (taskId: string, updater: (task: Task) => Task, action?: string) => void;
}) {
  const [activeTab, setActiveTab] = useStoredState<SeoProjectTab>('task-seo-project-active-tab', 'analytics');
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];
  const selectedKey = normalizeProjectName(selectedProject?.name ?? '');
  const selectedLinkRows = linkRows.filter((row) => normalizeProjectName(row.projectName) === selectedKey);
  const selectedLinkSummary = linkSummaries.get(selectedKey);
  const selectedContentTopics = contentTopicsByProject.get(selectedKey) ?? [];
  const selectedContentSummary = contentSummaries.get(selectedKey);
  const selectedContentSource = contentSourcesByProject.get(selectedKey);
  const selectedContentError = contentErrorsByProject.get(selectedKey);
  const selectedWorkPlans = workPlansByProject.get(selectedKey) ?? [];
  const selectedAuditSources = auditSourcesByProject.get(selectedKey) ?? [];
  const selectedResources = managedResourcesByProject.get(selectedProject?.id ?? '') ?? [];
  const selectedPaymentRows = selectedProject ? paymentRows.filter((row) => row.projectId === selectedProject.id) : [];
  const selectedPaymentCashflowRows = paymentCashflowRows.filter(
    (row) => normalizeProjectName(row.projectName) === selectedKey,
  );
  const selectedSources = promotionSources.filter((source) => normalizeProjectName(source.projectName) === selectedKey);
  const selectedMetrikaQueryCount = selectedSources.reduce(
    (sum, source) => sum + getGoalQueryRows(source.goalAnalytics).length,
    0,
  );
  const selectedLeadAnalytics = leadAnalyticsByProject.get(selectedKey);
  const selectedLeadError = leadErrorsByProject.get(selectedKey) ?? leadError;
  const selectedTasks = selectedProject ? tasks.filter((task) => task.projectId === selectedProject.id) : [];
  const selectedBitrixTasks = selectedProject
    ? bitrix24Snapshot.tasks.filter((task) => bitrixTaskMatchesProject(task, selectedProject))
    : [];
  const activeTasks =
    selectedTasks.filter((task) => task.status !== 'done').length +
    selectedBitrixTasks.filter((task) => !isBitrix24TaskDone(task)).length;
  const reportResourcesCount = selectedResources.filter((resource) => resource.tab === 'report').length;
  const seoTabs: Array<{ id: SeoProjectTab; label: string; count?: number }> = [
    { id: 'analytics', label: 'Аналитика' },
    { id: 'queries', label: 'Запросы Метрики', count: selectedMetrikaQueryCount },
    { id: 'tasks', label: 'Задачи', count: activeTasks },
    { id: 'links', label: 'Закуп ссылок', count: selectedLinkRows.length },
    { id: 'content', label: 'Контент', count: selectedContentTopics.length },
    { id: 'plans', label: 'План работ', count: selectedWorkPlans.length },
    { id: 'audit', label: 'Аудит', count: selectedAuditSources.length + 1 },
    { id: 'reports', label: 'Отчет клиенту', count: reportResourcesCount },
    { id: 'payments', label: 'Оплаты', count: selectedPaymentRows.length + selectedPaymentCashflowRows.length },
  ];
  const effectiveActiveTab = seoTabs.some((item) => item.id === activeTab) ? activeTab : 'analytics';
  const showSideTaskPanel = effectiveActiveTab !== 'analytics';
  const isFocusedAnalytics = effectiveActiveTab === 'analytics';

  return (
    <section className={`seo-projects-view ${isFocusedAnalytics ? 'is-analytics-focused' : ''}`}>
      {!isFocusedAnalytics && (
        <>
          <div className="dashboard-hero panel seo-projects-hero">
            <div>
              <h2>SEO-проекты</h2>
              <p>Разверни одного клиента: аналитика, закуп ссылок, аудит, контент, отчет перед клиентом и график оплат.</p>
            </div>
            <div className="hero-metrics">
              <Metric label="Проекты" value={String(projects.length)} />
              <Metric label="Выбрано" value={selectedProject?.name ?? '—'} />
              <Metric label="Задачи" value={String(activeTasks)} />
              <Metric label="Источники" value={String(selectedSources.length + (selectedLeadAnalytics?.sourceCount ?? 0))} />
            </div>
          </div>

          <section className="panel seo-project-picker-panel">
            <div className="section-heading compact-heading">
              <div>
                <h2>Выбор проекта</h2>
                <p>Карточки ниже перестраиваются под выбранного клиента.</p>
              </div>
            </div>
            <div className="seo-project-picker" role="group" aria-label="Выбрать SEO-проект">
              {projects.map((project) => (
                <button
                  className={project.id === selectedProject?.id ? 'is-active' : ''}
                  key={project.id}
                  type="button"
                  onClick={() => onProjectChange(project.id)}
                >
                  <span className="mini-dot" style={{ background: project.color }} />
                  {project.name}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {selectedProject ? (
        <div className={`seo-project-layout ${showSideTaskPanel ? '' : 'is-full'}`}>
          <div className="seo-project-main">
            <div className="project-tabs seo-inner-tabs" role="group" aria-label={`Разделы SEO-проекта ${selectedProject.name}`}>
              {seoTabs.map((item) => (
                <button
                  className={effectiveActiveTab === item.id ? 'is-active' : ''}
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.label}
                  {typeof item.count === 'number' && <em>{item.count}</em>}
                </button>
              ))}
            </div>

            <Bitrix24SyncStrip snapshot={bitrix24Snapshot} project={selectedProject} />

            {effectiveActiveTab === 'analytics' && (
              <ProjectSeoAnalyticsTiles
                project={selectedProject}
                linkRows={selectedLinkRows}
                promotionSources={selectedSources}
                leadAnalytics={selectedLeadAnalytics}
                leadLoadStatus={leadLoadStatus}
                leadError={selectedLeadError}
                leadUpdatedAt={leadUpdatedAt}
                metrikaLoadStatus={metrikaLoadStatus}
                metrikaError={metrikaError}
                metrikaUpdatedAt={metrikaUpdatedAt}
                onReloadLeads={onReloadLeads}
                onReloadMetrika={onReloadMetrika}
                tasks={selectedTasks}
                peopleById={peopleById}
                onOpenTasks={() => setActiveTab('tasks')}
                allProjects={projects}
                selectedProjectId={selectedProject.id}
                onProjectChange={onProjectChange}
              />
            )}

            {effectiveActiveTab === 'queries' && (
              <SeoMetrikaQueriesPanel
                project={selectedProject}
                promotionSources={selectedSources}
                metrikaLoadStatus={metrikaLoadStatus}
                metrikaError={metrikaError}
                metrikaUpdatedAt={metrikaUpdatedAt}
                onReloadMetrika={onReloadMetrika}
              />
            )}

            {effectiveActiveTab === 'tasks' && (
              <SeoProjectTasksTab
                project={selectedProject}
                projects={projects}
                tasks={selectedTasks}
                people={people}
                peopleById={peopleById}
                bitrix24Snapshot={bitrix24Snapshot}
                expanded={expanded}
                onToggleExpanded={onToggleExpanded}
                onToggleTimeline={onToggleTimeline}
                onStatusChange={onStatusChange}
                onTimelineStatusChange={onTimelineStatusChange}
                onTaskUpdate={onTaskUpdate}
              />
            )}

            {effectiveActiveTab === 'links' && (
              <section className="panel seo-inner-panel">
                <LinkPurchasePanel
                  project={selectedProject}
                  rows={selectedLinkRows}
                  summary={selectedLinkSummary}
                  loadStatus={linkLoadStatus}
                  error={linkError}
                  updatedAt={linkUpdatedAt}
                  onReload={onReloadLinks}
                />
              </section>
            )}

            {effectiveActiveTab === 'content' && (
              <section className="panel seo-inner-panel">
                <ContentPlanPanel
                  project={selectedProject}
                  source={selectedContentSource}
                  topics={selectedContentTopics}
                  summary={selectedContentSummary}
                  loadStatus={contentLoadStatus}
                  error={selectedContentError ?? contentError}
                  updatedAt={contentUpdatedAt}
                  onReload={onReloadContent}
                />
                <ManagedResourcesList
                  title="Дополнительные источники контента"
                  resources={selectedResources.filter((resource) => resource.tab === 'content')}
                />
              </section>
            )}

            {effectiveActiveTab === 'plans' && (
              <section className="panel seo-inner-panel">
                <WorkPlanPanel project={selectedProject} plans={selectedWorkPlans} />
                <ManagedResourcesList
                  title="Дополнительные планы работ"
                  resources={selectedResources.filter((resource) => resource.tab === 'plans')}
                />
              </section>
            )}

            {effectiveActiveTab === 'audit' && (
              <section className="panel seo-inner-panel">
                <AuditPanel project={selectedProject} sources={selectedAuditSources} />
                <ManagedResourcesList
                  title="Дополнительные источники аудита"
                  resources={selectedResources.filter((resource) => resource.tab === 'audit')}
                />
              </section>
            )}

            {effectiveActiveTab === 'reports' && (
              <section className="panel seo-inner-panel">
                <SeoProjectReportsPanel
                  project={selectedProject}
                  resources={selectedResources.filter((resource) => resource.tab === 'report' || resource.tab === 'site')}
                  tasks={tasks}
                  peopleById={peopleById}
                  reportSnapshots={reportSnapshots}
                  bitrix24Snapshot={bitrix24Snapshot}
                  onReportSnapshotsChange={onReportSnapshotsChange}
                  linkRows={selectedLinkRows}
                  promotionSources={selectedSources}
                  leadAnalytics={selectedLeadAnalytics}
                  leadLoadStatus={leadLoadStatus}
                  leadError={selectedLeadError}
                  leadUpdatedAt={leadUpdatedAt}
                  metrikaLoadStatus={metrikaLoadStatus}
                  metrikaError={metrikaError}
                  metrikaUpdatedAt={metrikaUpdatedAt}
                  onReloadLeads={onReloadLeads}
                  onReloadMetrika={onReloadMetrika}
                />
              </section>
            )}

            {effectiveActiveTab === 'payments' && (
              <div className="seo-payment-stack">
                <PaymentCashflowPanel
                  project={selectedProject}
                  rows={selectedPaymentCashflowRows}
                  paymentRows={selectedPaymentRows}
                  linkRows={selectedLinkRows}
                  projects={projects}
                  loadStatus={paymentCashflowLoadStatus}
                  error={paymentCashflowError}
                  updatedAt={paymentCashflowUpdatedAt}
                  onReload={onReloadPaymentCashflow}
                />
                <PaymentRowsEditor
                  projects={projects}
                  rows={selectedPaymentRows}
                  draft={paymentDraft}
                  linkRows={selectedLinkRows}
                  fixedProjectId={selectedProject.id}
                  onDraftChange={onPaymentDraftChange}
                  onAdd={onPaymentAdd}
                  onUpdate={onPaymentUpdate}
                  onDelete={onPaymentDelete}
                />
              </div>
            )}
          </div>
          {showSideTaskPanel && (
            <SeoProjectTaskPanel project={selectedProject} tasks={selectedTasks} peopleById={peopleById} />
          )}
        </div>
      ) : (
        <div className="empty-row">Пока нет проектов для аналитики.</div>
      )}
    </section>
  );
}

function SeoProjectTasksTab({
  project,
  projects,
  tasks,
  people,
  peopleById,
  bitrix24Snapshot,
  expanded,
  onToggleExpanded,
  onToggleTimeline,
  onStatusChange,
  onTimelineStatusChange,
  onTaskUpdate,
}: {
  project: Project;
  projects: Project[];
  tasks: Task[];
  people: Person[];
  peopleById: Map<string, Person>;
  bitrix24Snapshot: Bitrix24Snapshot;
  expanded: Set<string>;
  onToggleExpanded: (taskId: string) => void;
  onToggleTimeline: (taskId: string, checked: boolean) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onTimelineStatusChange: (taskId: string, itemId: string, status: Status) => void;
  onTaskUpdate: (taskId: string, updater: (task: Task) => Task, action?: string) => void;
}) {
  const [taskMode, setTaskMode] = useStoredState<SeoProjectTaskMode>('task-seo-project-task-mode', 'open');
  const [taskFilter, setTaskFilter] = useStoredState<TaskReportFilter>('task-seo-project-task-filter', 'open');
  const [ownerFilter, setOwnerFilter] = useStoredState<string>('task-seo-project-owner-filter', 'all');
  const today = todayIso();
  const summary = buildProjectTaskSummary(project, tasks, peopleById, today);
  const projectBitrixTasks = useMemo(
    () => bitrix24Snapshot.tasks.filter((task) => bitrixTaskMatchesProject(task, project)),
    [bitrix24Snapshot.tasks, project],
  );
  const openBitrixTasks = projectBitrixTasks.filter((task) => !isBitrix24TaskDone(task));
  const doneBitrixTasks = projectBitrixTasks.filter((task) => isBitrix24TaskDone(task));
  const overdueBitrixTasks = projectBitrixTasks.filter((task) => isBitrix24TaskOverdue(task, today));
  const filterOptions: TaskReportFilter[] =
    taskMode === 'done' ? ['done', 'lateDone'] : ['open', 'active', 'planned', 'risk', 'overdue', 'withoutDeadline'];
  const effectiveTaskFilter = filterOptions.includes(taskFilter) ? taskFilter : taskMode === 'done' ? 'done' : 'open';
  const selectedOwnerName = ownerFilter === 'all' ? '' : peopleById.get(ownerFilter)?.name ?? '';

  useEffect(() => {
    if (effectiveTaskFilter !== taskFilter) setTaskFilter(effectiveTaskFilter);
  }, [effectiveTaskFilter, setTaskFilter, taskFilter]);

  const ownerOptions = people.filter((person) => tasks.some((task) => task.ownerIds.includes(person.id)));
  const getFilterCount = (filter: TaskReportFilter) =>
    summary.itemsByFilter[filter].length +
    projectBitrixTasks.filter((task) => bitrixTaskMatchesFilter(task, filter, today)).length;
  const filteredTasks = tasks
    .filter((task) => {
      if (ownerFilter !== 'all' && !task.ownerIds.includes(ownerFilter)) return false;
      if (effectiveTaskFilter === 'open') return task.status !== 'done';
      if (effectiveTaskFilter === 'done') return task.status === 'done';
      if (effectiveTaskFilter === 'overdue') return task.status !== 'done' && Boolean(task.deadline) && task.deadline < today;
      if (effectiveTaskFilter === 'lateDone') {
        return task.status === 'done' && Boolean(task.deadline) && typeof task.completedAt === 'string' && task.completedAt > task.deadline;
      }
      if (effectiveTaskFilter === 'withoutDeadline') return task.status !== 'done' && !task.deadline;
      return task.status === effectiveTaskFilter;
    })
    .sort((a, b) => {
      if (effectiveTaskFilter === 'done' || effectiveTaskFilter === 'lateDone') {
        return (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt);
      }
      if (effectiveTaskFilter === 'overdue') return a.deadline.localeCompare(b.deadline);
      return b.createdAt.localeCompare(a.createdAt) || a.deadline.localeCompare(b.deadline);
    });
  const visibleBitrixTasks = projectBitrixTasks
    .filter((task) => {
      if (selectedOwnerName && !normalizeSearchText(task.responsibleName).includes(normalizeSearchText(selectedOwnerName))) return false;
      return bitrixTaskMatchesFilter(task, effectiveTaskFilter, today);
    })
    .sort((left, right) => {
      if (effectiveTaskFilter === 'done' || effectiveTaskFilter === 'lateDone') {
        return (right.closedDate || right.createdDate).localeCompare(left.closedDate || left.createdDate);
      }
      if (effectiveTaskFilter === 'overdue') {
        return getBitrixTaskIso(left.deadline).localeCompare(getBitrixTaskIso(right.deadline));
      }
      return (right.createdDate || '').localeCompare(left.createdDate || '');
    });
  const hasVisibleTasks = filteredTasks.length > 0 || visibleBitrixTasks.length > 0;

  return (
    <section className="panel seo-inner-panel seo-project-tasks-tab">
      <div className="section-heading compact-heading">
        <div>
          <h2>{taskMode === 'done' ? 'Выполнено' : 'Задачи в работе'}: {project.name}</h2>
          <p>Статусы, дедлайны, хронология, редактирование и история изменений по выбранному SEO-проекту.</p>
        </div>
        <div className="seo-task-summary-strip">
          <span>{summary.open + openBitrixTasks.length} в работе</span>
          <span className={summary.overdue + overdueBitrixTasks.length ? 'is-danger' : ''}>
            {summary.overdue + overdueBitrixTasks.length} просрочено
          </span>
          <span>{summary.done + doneBitrixTasks.length} выполнено</span>
        </div>
      </div>

      <div className="seo-task-filters">
        <div className="segmented seo-task-mode-switch" role="group" aria-label="Режим задач SEO-проекта">
          <button
            className={taskMode === 'open' ? 'is-active' : ''}
            type="button"
            onClick={() => {
              setTaskMode('open');
              setTaskFilter('open');
            }}
          >
            Задачи в работе
            <em>{summary.open + openBitrixTasks.length}</em>
          </button>
          <button
            className={taskMode === 'done' ? 'is-active' : ''}
            type="button"
            onClick={() => {
              setTaskMode('done');
              setTaskFilter('done');
            }}
          >
            Выполнено
            <em>{summary.done + doneBitrixTasks.length}</em>
          </button>
        </div>
        <div className="segmented seo-task-filter-group" role="group" aria-label="Фильтр задач SEO-проекта">
          {filterOptions.map((filter) => (
            <button
              className={effectiveTaskFilter === filter ? 'is-active' : ''}
              key={filter}
              type="button"
              onClick={() => setTaskFilter(filter)}
            >
              {taskReportFilterLabels[filter]}
              <em>{getFilterCount(filter)}</em>
            </button>
          ))}
        </div>
        <label className="field seo-owner-filter">
          <span>Ответственный</span>
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">Все</option>
            {ownerOptions.map((person) => (
              <option value={person.id} key={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!hasVisibleTasks ? (
        <div className="empty-row">По выбранным фильтрам задач нет.</div>
      ) : (
        <>
          {filteredTasks.length > 0 && (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  project={project}
                  projects={projects}
                  people={people}
                  peopleById={peopleById}
                  expanded={expanded.has(task.id)}
                  onToggleExpanded={onToggleExpanded}
                  onToggleTimeline={onToggleTimeline}
                  onStatusChange={onStatusChange}
                  onTimelineStatusChange={onTimelineStatusChange}
                  onTaskUpdate={onTaskUpdate}
                />
              ))}
            </div>
          )}
          <Bitrix24ProjectTaskList tasks={visibleBitrixTasks} taskMode={taskMode} />
        </>
      )}
    </section>
  );
}

function SeoMetrikaQueriesPanel({
  project,
  promotionSources,
  metrikaLoadStatus,
  metrikaError,
  metrikaUpdatedAt,
  onReloadMetrika,
}: {
  project: Project;
  promotionSources: PromotionResultSource[];
  metrikaLoadStatus: LinkLoadStatus;
  metrikaError: string;
  metrikaUpdatedAt: string;
  onReloadMetrika: (mode?: MetrikaStatsLoadMode) => void;
}) {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useStoredState<SeoQuerySort>('task-seo-metrika-query-sort', 'goals');
  const [visibleLimit, setVisibleLimit] = useState(150);
  const [exportStatus, setExportStatus] = useState<{ status: MetrikaQueryExportStatus; message: string }>({
    status: 'idle',
    message: '',
  });
  const sourceWithAnalytics = promotionSources.find((source) => source.goalAnalytics);
  const hasFullQueryList = promotionSources.some((source) => Boolean(source.goalAnalytics?.queries?.length));
  const queryRows = useMemo(() => mergePromotionQueryRows(promotionSources), [promotionSources]);
  const totalVisits = queryRows.reduce((sum, row) => sum + row.visits, 0);
  const totalGoals = queryRows.reduce((sum, row) => sum + row.goals, 0);
  const rowsWithGoals = queryRows.filter((row) => row.goals > 0).length;
  const maxGoals = Math.max(...queryRows.map((row) => row.goals), 1);
  const metrikaSourceText = metrikaError
    ? `Метрика сейчас не обновилась: ${metrikaError}`
    : metrikaUpdatedAt
      ? `данные Метрики от: ${metrikaUpdatedAt}`
      : 'Метрика: дата live-обновления не сохранена';
  const normalizedSearch = normalizeSearchText(search);
  const filteredRows = queryRows
    .filter((row) => !normalizedSearch || normalizeSearchText(row.query).includes(normalizedSearch))
    .sort((left, right) => {
      if (sortMode === 'query') return left.query.localeCompare(right.query, 'ru');
      if (sortMode === 'visits') return right.visits - left.visits || right.goals - left.goals;
      return right.goals - left.goals || right.visits - left.visits || left.query.localeCompare(right.query, 'ru');
    });
  const visibleRows = filteredRows.slice(0, visibleLimit);

  useEffect(() => {
    setVisibleLimit(150);
  }, [project.id, normalizedSearch, sortMode]);

  useEffect(() => {
    setExportStatus({ status: 'idle', message: '' });
  }, [project.id]);

  const handleQueryExport = () => {
    if (!queryRows.length) {
      setExportStatus({ status: 'error', message: 'Нет строк для выгрузки.' });
      return;
    }
    const result = submitMetrikaQueriesExport(project, queryRows, sourceWithAnalytics);
    if (result === 'ready') {
      setExportStatus({ status: 'ready', message: 'Создание Google-таблицы открыто в новой вкладке.' });
      return;
    }
    setExportStatus({
      status: 'fallback',
      message: 'Google endpoint пока не подключен, поэтому скачан CSV со всеми запросами.',
    });
  };

  return (
    <section className="panel seo-inner-panel seo-metrika-query-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>Поисковые запросы из Метрики: {project.name}</h2>
          <p>
            Органический поиск: каждая фраза, количество переходов и достижения целей по данным Метрики.
          </p>
        </div>
        <div className="metrika-query-head-actions">
          <button type="button" onClick={() => onReloadMetrika('live')} disabled={metrikaLoadStatus === 'loading'}>
            <RefreshCw className={metrikaLoadStatus === 'loading' ? 'spin' : undefined} size={16} />
            Обновить Метрику
          </button>
          <button type="button" onClick={handleQueryExport} disabled={!queryRows.length}>
            <FileSpreadsheet size={16} />
            Сделать выгрузку
          </button>
        </div>
      </div>

      <div className="metrika-query-stats">
        <Metric label="Запросы" value={formatInteger(queryRows.length)} compact />
        <Metric label="Переходы" value={formatInteger(totalVisits)} compact />
        <Metric label="С целями" value={formatInteger(rowsWithGoals)} compact tone={rowsWithGoals ? 'success' : undefined} />
        <Metric label="Достижения целей" value={formatInteger(totalGoals)} compact tone={totalGoals ? 'success' : undefined} />
      </div>

      <div className="metrika-query-toolbar">
        <label className="field">
          <span>Поиск по запросу</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Например: очистные сооружения"
          />
        </label>
        <div className="segmented" role="group" aria-label="Сортировка поисковых запросов">
          {[
            ['goals', 'По целям'],
            ['visits', 'По переходам'],
            ['query', 'А-Я'],
          ].map(([id, label]) => (
            <button
              className={sortMode === id ? 'is-active' : ''}
              key={id}
              type="button"
              onClick={() => setSortMode(id as SeoQuerySort)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`metrika-query-source-note ${hasFullQueryList ? 'is-ready' : ''}`}>
        <RefreshCw size={16} />
        <span>
          {sourceWithAnalytics
            ? hasFullQueryList
              ? `${sourceWithAnalytics.spreadsheetTitle} · полный список из Метрики · ${metrikaSourceText}`
              : `${sourceWithAnalytics.spreadsheetTitle} · пока доступен текущий топ, полный список появится после обновления Метрики`
            : 'источник Метрики не подключен'}
        </span>
      </div>

      {exportStatus.message && (
        <div className={`metrika-query-export-status ${exportStatus.status}`}>
          <FileSpreadsheet size={15} />
          <span>{exportStatus.message}</span>
        </div>
      )}

      {queryRows.length === 0 ? (
        <div className="empty-row">поисковые запросы в данных Метрики пока пустые</div>
      ) : (
        <div className="metrika-query-table" role="table" aria-label={`Поисковые запросы Метрики ${project.name}`}>
          <div className="metrika-query-row metrika-query-head" role="row">
            <span>Запрос</span>
            <span>Переходы</span>
            <span>Достижения целей</span>
            <span>CR</span>
          </div>
          {visibleRows.map((row) => {
            const goalRate = getQueryGoalRate(row);
            return (
              <div className="metrika-query-row" key={row.query} role="row">
                <strong>{row.query}</strong>
                <span>{formatInteger(row.visits)}</span>
                <div className="metrika-query-goals">
                  <i style={{ width: `${row.goals > 0 ? Math.max(8, (row.goals / maxGoals) * 100) : 0}%` }} />
                  <em>{formatInteger(row.goals)}</em>
                </div>
                <span>{formatConversionRate(goalRate)}</span>
              </div>
            );
          })}
        </div>
      )}

      {visibleRows.length < filteredRows.length && (
        <button className="ghost-button metrika-query-more" type="button" onClick={() => setVisibleLimit((current) => current + 150)}>
          Показать еще {Math.min(150, filteredRows.length - visibleRows.length)}
        </button>
      )}
    </section>
  );
}

function Bitrix24SyncStrip({ snapshot, project }: { snapshot: Bitrix24Snapshot; project: Project }) {
  const clientCount = snapshot.crm.leads.length + snapshot.crm.contacts.length + snapshot.crm.companies.length;
  const projectTasks = snapshot.tasks.filter((task) => bitrixTaskMatchesProject(task, project));
  const activeProjectTasks = projectTasks.filter((task) => !isBitrix24TaskDone(task));
  const doneProjectTasks = projectTasks.filter((task) => isBitrix24TaskDone(task));
  const hasLoadedRows = Boolean(snapshot.updatedAt || snapshot.tasks.length || clientCount || snapshot.crm.deals.length);
  const statusText = hasLoadedRows
    ? `backend snapshot · обновлено ${formatDateTime(snapshot.updatedAt)}`
    : 'backend snapshot ожидает первую успешную выгрузку';

  return (
    <section className={`bitrix-sync-strip ${hasLoadedRows ? 'is-ready' : 'is-empty'}`} aria-label="Синхронизация Bitrix24">
      <div className="bitrix-sync-status">
        {hasLoadedRows ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
        <div>
          <strong>Bitrix24 API</strong>
          <span>{statusText}</span>
          {snapshot.errors[0] && <em>{snapshot.errors[0]}</em>}
        </div>
      </div>
      <dl>
        <div>
          <dt>SEO-задачи</dt>
          <dd>{snapshot.tasks.length}</dd>
        </div>
        <div>
          <dt>{project.name}</dt>
          <dd>{activeProjectTasks.length} в работе</dd>
        </div>
        <div>
          <dt>Выполнено</dt>
          <dd>{doneProjectTasks.length}</dd>
        </div>
        <div>
          <dt>CRM</dt>
          <dd>{clientCount + snapshot.crm.deals.length}</dd>
        </div>
      </dl>
    </section>
  );
}

function Bitrix24ProjectTaskList({
  tasks,
  taskMode,
}: {
  tasks: Bitrix24ProjectTask[];
  taskMode: SeoProjectTaskMode;
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="bitrix-project-task-list" aria-label="Задачи проекта из Bitrix24">
      <div className="tile-heading">
        <Layers3 size={18} />
        <h3>Задачи из Bitrix24</h3>
        <span>{taskMode === 'done' ? 'выполненные' : 'в работе'} · {tasks.length}</span>
      </div>
      <div className="bitrix-project-task-stack">
        {tasks.slice(0, 12).map((task) => (
          <article
            className={`bitrix-task-row ${isBitrix24TaskOverdue(task) ? 'is-overdue' : ''}`}
            key={`bitrix-project-${task.id}`}
          >
            <div>
              <span>#{task.id} · {task.statusLabel || (isBitrix24TaskDone(task) ? 'готово' : 'в работе')}</span>
              <strong>{task.title}</strong>
              {task.description && <p>{compactExternalText(task.description)}</p>}
            </div>
            <dl>
              <div>
                <dt>Ответственный</dt>
                <dd>{task.responsibleName || 'не указан'}</dd>
              </div>
              <div>
                <dt>Постановщик</dt>
                <dd>{task.creatorName || 'не указан'}</dd>
              </div>
              <div>
                <dt>Создана</dt>
                <dd>{formatDateTime(task.createdDate)}</dd>
              </div>
              <div>
                <dt>Дедлайн</dt>
                <dd>{formatDateTime(task.deadline)}</dd>
              </div>
              {task.closedDate && (
                <div>
                  <dt>Закрыта</dt>
                  <dd>{formatDateTime(task.closedDate)}</dd>
                </div>
              )}
            </dl>
          </article>
        ))}
      </div>
      {tasks.length > 12 && <div className="empty-row">Показаны последние 12 задач из Bitrix24 по выбранному фильтру.</div>}
    </section>
  );
}

function ProjectSeoAnalyticsTiles({
  project,
  linkRows,
  promotionSources,
  leadAnalytics,
  leadLoadStatus,
  leadError,
  leadUpdatedAt,
  metrikaLoadStatus,
  metrikaError,
  metrikaUpdatedAt,
  onReloadLeads,
  onReloadMetrika,
  tasks = [],
  peopleById,
  onOpenTasks,
  allProjects,
  selectedProjectId,
  onProjectChange,
}: {
  project: Project;
  linkRows: LinkPurchase[];
  promotionSources: PromotionResultSource[];
  leadAnalytics?: LeadAnalyticsSummary;
  leadLoadStatus: LinkLoadStatus;
  leadError: string;
  leadUpdatedAt: string;
  metrikaLoadStatus: LinkLoadStatus;
  metrikaError: string;
  metrikaUpdatedAt: string;
  onReloadLeads: () => void;
  onReloadMetrika: (mode?: MetrikaStatsLoadMode) => void;
  tasks?: Task[];
  peopleById?: Map<string, Person>;
  onOpenTasks?: () => void;
  allProjects?: Project[];
  selectedProjectId?: string;
  onProjectChange?: (projectId: string) => void;
}) {
  return (
    <ProjectSeoAnalyticsScreen
      project={project}
      linkRows={linkRows}
      promotionSources={promotionSources}
      leadAnalytics={leadAnalytics}
      leadLoadStatus={leadLoadStatus}
      leadError={leadError}
      leadUpdatedAt={leadUpdatedAt}
      metrikaLoadStatus={metrikaLoadStatus}
      metrikaError={metrikaError}
      metrikaUpdatedAt={metrikaUpdatedAt}
      onReloadLeads={onReloadLeads}
      onReloadMetrika={onReloadMetrika}
      tasks={tasks}
      peopleById={peopleById}
      onOpenTasks={onOpenTasks}
      allProjects={allProjects}
      selectedProjectId={selectedProjectId}
      onProjectChange={onProjectChange}
    />
  );
}
function ProjectSeoAnalyticsScreen({
  project,
  linkRows,
  promotionSources,
  leadAnalytics,
  leadLoadStatus,
  leadError,
  leadUpdatedAt,
  metrikaLoadStatus,
  metrikaError,
  metrikaUpdatedAt,
  onReloadLeads,
  onReloadMetrika,
  tasks = [],
  peopleById,
  onOpenTasks,
  allProjects = [],
  selectedProjectId,
  onProjectChange,
}: {
  project: Project;
  linkRows: LinkPurchase[];
  promotionSources: PromotionResultSource[];
  leadAnalytics?: LeadAnalyticsSummary;
  leadLoadStatus: LinkLoadStatus;
  leadError: string;
  leadUpdatedAt: string;
  metrikaLoadStatus: LinkLoadStatus;
  metrikaError: string;
  metrikaUpdatedAt: string;
  onReloadLeads: () => void;
  onReloadMetrika: (mode?: MetrikaStatsLoadMode) => void;
  tasks?: Task[];
  peopleById?: Map<string, Person>;
  onOpenTasks?: () => void;
  allProjects?: Project[];
  selectedProjectId?: string;
  onProjectChange?: (projectId: string) => void;
}) {
  const source = promotionSources[0];
  const goalAnalytics = source?.goalAnalytics;
  const sourceEndDate = getLatestAnalyticsDate(goalAnalytics, leadAnalytics);
  const defaultRange = resolveSeoDateRange('30d', { start: '', end: '' }, sourceEndDate);
  const [periodPreset, setPeriodPreset] = useStoredState<SeoPeriodPreset>('task-seo-analytics-period-preset', '30d');
  const [trendMode, setTrendMode] = useStoredState<SeoTrendMode>('task-seo-analytics-trend-mode', 'daily');
  const [compareMode, setCompareMode] = useStoredState<SeoCompareMode>('task-seo-analytics-compare-mode', 'previous');
  const [trafficSystem, setTrafficSystem] = useStoredState<SeoTrafficSystem>('task-seo-analytics-traffic-system', 'all');
  const [leadMetricMode, setLeadMetricMode] = useStoredState<SeoLeadMetricMode>('task-seo-analytics-lead-mode', 'target');
  const [showMarkers, setShowMarkers] = useStoredState<boolean>('task-seo-analytics-show-markers', true);
  const [impactTab, setImpactTab] = useStoredState<SeoImpactTab>('task-seo-analytics-impact-tab', 'queries');
  const [impactDirection, setImpactDirection] = useStoredState<SeoImpactDirection>('task-seo-analytics-impact-direction', 'growth');
  const [customRange, setCustomRange] = useStoredState<AnalyticsDateRange>('task-seo-analytics-custom-range', defaultRange);
  const [customCompareRange, setCustomCompareRange] = useStoredState<AnalyticsDateRange>(
    'task-seo-analytics-custom-compare-range',
    { start: addDaysToIso(defaultRange.start, -30), end: addDaysToIso(defaultRange.start, -1) },
  );
  const [impactSearch, setImpactSearch] = useState('');

  const currentRange = resolveSeoDateRange(periodPreset, customRange, sourceEndDate);
  const compareRange = resolveSeoCompareRange(compareMode, currentRange, customCompareRange);
  const currentGoalDaily = filterGoalDailyPoints(goalAnalytics, currentRange);
  const previousGoalDaily = compareRange ? filterGoalDailyPoints(goalAnalytics, compareRange) : [];
  const currentLeadDaily = filterLeadDailyPoints(leadAnalytics, currentRange);
  const previousLeadDaily = compareRange ? filterLeadDailyPoints(leadAnalytics, compareRange) : [];
  const trafficBreakdownMissing = trafficSystem !== 'all';
  const trafficSeries = trafficBreakdownMissing ? [] : buildGoalSeries(currentGoalDaily, trendMode, 'visits');
  const previousTrafficSeries =
    compareRange && !trafficBreakdownMissing ? buildGoalSeries(previousGoalDaily, trendMode, 'visits') : [];
  const goalSeries = trafficBreakdownMissing ? [] : buildGoalSeries(currentGoalDaily, trendMode, 'goals');
  const previousGoalSeries = compareRange && !trafficBreakdownMissing ? buildGoalSeries(previousGoalDaily, trendMode, 'goals') : [];
  const leadSeries = buildLeadSeries(currentLeadDaily, trendMode, leadMetricMode);
  const previousLeadSeries = compareRange ? buildLeadSeries(previousLeadDaily, trendMode, leadMetricMode) : [];
  const targetLeadSeries = buildLeadSeries(currentLeadDaily, trendMode, 'target');
  const previousTargetLeadSeries = compareRange ? buildLeadSeries(previousLeadDaily, trendMode, 'target') : [];
  const conversionSeries = buildConversionSeries(trafficSeries, goalSeries);
  const previousConversionSeries = buildConversionSeries(previousTrafficSeries, previousGoalSeries);
  const organicVisits = trafficBreakdownMissing ? null : currentGoalDaily.length ? sumSeries(trafficSeries) : null;
  const previousOrganicVisits =
    compareRange && !trafficBreakdownMissing && previousGoalDaily.length ? sumSeries(previousTrafficSeries) : null;
  const conversionVisits = trafficBreakdownMissing ? null : currentGoalDaily.length ? sumSeries(goalSeries) : null;
  const previousConversionVisits =
    compareRange && !trafficBreakdownMissing && previousGoalDaily.length ? sumSeries(previousGoalSeries) : null;
  const targetSeoLeads = currentLeadDaily.length ? sumSeries(targetLeadSeries) : leadAnalytics ? null : null;
  const previousTargetSeoLeads = compareRange && previousLeadDaily.length ? sumSeries(previousTargetLeadSeries) : null;
  const conversionRate = getSeriesRate(conversionVisits, organicVisits);
  const previousConversionRate = getSeriesRate(previousConversionVisits, previousOrganicVisits);
  const leadIssue = getLeadDataIssue(leadAnalytics, currentLeadDaily);
  const linkSummary = useMemo(() => summarizeLinkPurchases(linkRows), [linkRows]);
  const markers = getAnalyticsMarkers(tasks, currentRange);
  const activeTasks = tasks
    .filter((task) => task.status !== 'done')
    .sort((left, right) => left.deadline.localeCompare(right.deadline) || right.createdAt.localeCompare(left.createdAt))
    .slice(0, 5);
  const peopleMap = peopleById ?? new Map<string, Person>();
  const allDailySum = (goalAnalytics?.daily ?? []).reduce((sum, point) => sum + point.visits, 0);
  const hasMetrikaMismatch = Boolean(goalAnalytics?.daily?.length && goalAnalytics.visits !== allDailySum);
  const isMetrikaLoading = metrikaLoadStatus === 'loading';
  const isAnyAnalyticsLoading = isMetrikaLoading || leadLoadStatus === 'loading';
  const metrikaStatusText =
    metrikaLoadStatus === 'loading'
      ? 'Метрика обновляется'
      : metrikaError
        ? 'Метрика: показаны последние доступные данные'
        : metrikaUpdatedAt
          ? `Данные Метрики от: ${metrikaUpdatedAt}`
          : 'Метрика: дата обновления не сохранена';
  const handleRefreshAnalytics = () => {
    onReloadMetrika('live');
    onReloadLeads();
  };
  const impactRows = useMemo<SeoImpactRow[]>(() => {
    if (impactTab === 'pages') return [];
    return (goalAnalytics?.topQueries ?? []).map((item, index) => ({
      id: `query-${index}`,
      label: item.query,
      visits: item.visits,
      previousVisits: null,
      change: null,
      conversionVisits: item.goals,
      cr: item.visits > 0 ? (item.goals / item.visits) * 100 : null,
      note: 'В текущих данных Метрики есть топ запросов без периодного сравнения.',
    }));
  }, [goalAnalytics, impactTab]);
  const visibleImpactRows = impactRows
    .filter((row) => row.label.toLowerCase().includes(impactSearch.trim().toLowerCase()))
    .filter((row) => (impactDirection === 'drop' ? (row.change ?? 0) < 0 : (row.change ?? 0) >= 0 || row.change === null))
    .sort((left, right) => {
      if (left.change !== null || right.change !== null) return Math.abs(right.change ?? 0) - Math.abs(left.change ?? 0);
      return (right.visits ?? 0) - (left.visits ?? 0);
    });

  const kpiCards: SeoKpiCardModel[] = [
    {
      title: 'Органические визиты',
      value: organicVisits === null ? '—' : formatInteger(organicVisits),
      meta: `за ${formatInputRange(currentRange)}`,
      deltaLabel: getDeltaLabel(organicVisits, previousOrganicVisits).label,
      tone: trafficBreakdownMissing ? 'warning' : getDeltaLabel(organicVisits, previousOrganicVisits).tone,
      statusLabel: trafficBreakdownMissing ? 'разбивка по системам не выгружена' : 'по временному ряду Метрики',
      icon: 'leaf',
    },
    {
      title: 'Конверсионные визиты',
      value: conversionVisits === null ? '—' : formatInteger(conversionVisits),
      meta: 'достижения целей Метрики',
      deltaLabel: getDeltaLabel(conversionVisits, previousConversionVisits).label,
      tone: getDeltaLabel(conversionVisits, previousConversionVisits).tone,
      statusLabel: conversionVisits === 0 ? 'подтвержденный 0 в выбранном периоде' : 'по целям Метрики',
      icon: 'users',
    },
    {
      title: 'Целевые SEO-лиды',
      value: targetSeoLeads === null ? '—' : formatInteger(targetSeoLeads),
      meta: leadUpdatedAt || leadAnalytics?.periodLabel || 'Google Sheets',
      deltaLabel: getDeltaLabel(targetSeoLeads, previousTargetSeoLeads).label,
      tone: leadIssue ? 'warning' : getDeltaLabel(targetSeoLeads, previousTargetSeoLeads).tone,
      statusLabel: leadIssue || 'по распознанным датам заявок',
      icon: 'target',
    },
    {
      title: 'Конверсия в обращение',
      value: formatConversionRate(conversionRate),
      meta: 'конв. визиты / органика',
      deltaLabel: getDeltaLabel(conversionRate, previousConversionRate, { percentPoint: true }).label,
      tone: conversionVisits === 0 ? 'warning' : getDeltaLabel(conversionRate, previousConversionRate, { percentPoint: true }).tone,
      statusLabel: conversionVisits === 0 ? 'учет обращений в целях не настроен' : 'отношение сумм за период',
      icon: 'funnel',
    },
  ];

  const sourceWarnings = [
    hasMetrikaMismatch
      ? `Данные Метрики требуют повторного обновления: итог ${formatInteger(goalAnalytics?.visits ?? 0)}, сумма ряда ${formatInteger(allDailySum)}.`
      : '',
    metrikaError ? `Метрика не обновилась в live-режиме: ${metrikaError}` : '',
    trafficBreakdownMissing
      ? `${seoTrafficSystemLabels[trafficSystem]} пока не выделены отдельной выгрузкой, показан пустой режим.`
      : '',
    leadIssue && leadAnalytics ? leadIssue : '',
    leadError && leadLoadStatus === 'error'
      ? 'Заявки не обновились: Google Sheets недоступен или закрыт для текущей сессии.'
      : '',
  ].filter(Boolean);

  return (
    <section className="aquaguard-analytics" aria-label={`Аналитика SEO-проекта ${project.name}`}>
      <header className="aquaguard-analytics-head glass-inner">
        <div>
          <p>
            task-SEO <span>/</span> SEO-проекты <span>/</span> <strong>{project.name}</strong> <span>/</span> Аналитика
          </p>
          <h2>{project.name}: динамика SEO-результата</h2>
        </div>
        {allProjects.length > 0 && onProjectChange && (
          <label className="aquaguard-project-select">
            <span>Проект</span>
            <select value={selectedProjectId ?? project.id} onChange={(event) => onProjectChange(event.target.value)}>
              {allProjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="aquaguard-freshness">
          <span>{metrikaStatusText}</span>
          <button type="button" onClick={handleRefreshAnalytics} disabled={isAnyAnalyticsLoading}>
            <RefreshCw className={isAnyAnalyticsLoading ? 'spin' : undefined} size={16} />
            Обновить сейчас
          </button>
        </div>
      </header>

      <div className="aquaguard-filter-panel glass-inner">
        <div className="segmented aquaguard-periods" role="group" aria-label="Период аналитики">
          {(Object.keys(seoPeriodPresetLabels) as SeoPeriodPreset[]).map((preset) => (
            <button
              className={periodPreset === preset ? 'is-active' : ''}
              key={preset}
              type="button"
              onClick={() => setPeriodPreset(preset)}
            >
              {seoPeriodPresetLabels[preset]}
            </button>
          ))}
        </div>
        <div className="aquaguard-date-controls">
          <label>
            <span>Период</span>
            <input
              type="date"
              value={currentRange.start}
              onChange={(event) => {
                setPeriodPreset('custom');
                setCustomRange((current) => ({ ...current, start: event.target.value }));
              }}
            />
          </label>
          <label>
            <span>до</span>
            <input
              type="date"
              value={currentRange.end}
              onChange={(event) => {
                setPeriodPreset('custom');
                setCustomRange((current) => ({ ...current, end: event.target.value }));
              }}
            />
          </label>
        </div>
        <label className="aquaguard-select">
          <span>Сравнить</span>
          <select value={compareMode} onChange={(event) => setCompareMode(event.target.value as SeoCompareMode)}>
            {(Object.keys(seoCompareModeLabels) as SeoCompareMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {seoCompareModeLabels[mode]}
              </option>
            ))}
          </select>
        </label>
        {compareMode === 'custom' && (
          <div className="aquaguard-date-controls compact">
            <label>
              <span>сравнение</span>
              <input
                type="date"
                value={customCompareRange.start}
                onChange={(event) => setCustomCompareRange((current) => ({ ...current, start: event.target.value }))}
              />
            </label>
            <label>
              <span>до</span>
              <input
                type="date"
                value={customCompareRange.end}
                onChange={(event) => setCustomCompareRange((current) => ({ ...current, end: event.target.value }))}
              />
            </label>
          </div>
        )}
        <div className="segmented aquaguard-granularity" role="group" aria-label="Детализация графиков">
          {(Object.keys(seoTrendModeLabels) as SeoTrendMode[]).map((mode) => (
            <button
              className={trendMode === mode ? 'is-active' : ''}
              key={mode}
              type="button"
              onClick={() => setTrendMode(mode)}
            >
              {seoTrendModeShortLabels[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className="aquaguard-context-row">
        <span>{source ? `${source.spreadsheetTitle} · ${source.periodLabel}` : 'источник Метрики не подключен'}</span>
        {compareRange ? <span>Сравнение: {formatInputRange(compareRange)}</span> : <span>Сравнение выключено</span>}
        <span>{metrikaStatusText}</span>
        <span>{leadUpdatedAt ? `Заявки обновлены: ${leadUpdatedAt}` : 'Заявки: последняя успешная дата не сохранена'}</span>
      </div>

      {sourceWarnings.length > 0 && (
        <div className="aquaguard-warning-list">
          {sourceWarnings.map((warning) => (
            <span key={warning}>
              <AlertTriangle size={14} />
              {warning}
            </span>
          ))}
        </div>
      )}

      <div className="aquaguard-kpi-grid">
        {kpiCards.map((card) => (
          <SeoAnalyticsKpiCard card={card} key={card.title} />
        ))}
      </div>

      <article className="aquaguard-chart-panel aquaguard-chart-panel-main">
        <div className="aquaguard-chart-toolbar">
          <div>
            <h3>Органический трафик</h3>
            <p>Визиты из поиска · текущий период и сравнение на единой оси.</p>
          </div>
          <label className="aquaguard-checkbox">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(event) => setShowMarkers(event.target.checked)}
            />
            <span>Показать внедрения</span>
          </label>
          <label className="aquaguard-select compact">
            <span>Система</span>
            <select value={trafficSystem} onChange={(event) => setTrafficSystem(event.target.value as SeoTrafficSystem)}>
              {(Object.keys(seoTrafficSystemLabels) as SeoTrafficSystem[]).map((system) => (
                <option key={system} value={system}>
                  {seoTrafficSystemLabels[system]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <SeoAnalyticsLineChart
          current={trafficSeries}
          emptyLabel={
            trafficBreakdownMissing
              ? 'разбивка по выбранной поисковой системе пока не выгружена'
              : 'источник Метрики не подключен'
          }
          markers={showMarkers ? markers : []}
          previous={previousTrafficSeries}
          previousLabel={compareRange ? formatInputRange(compareRange) : ''}
          title="Органические визиты"
          unitLabel="визитов"
          valueFormatter={formatInteger}
        />
      </article>

      <div className="aquaguard-chart-grid">
        <article className="aquaguard-chart-panel">
          <div className="aquaguard-chart-toolbar">
            <div>
              <h3>Обращения из SEO</h3>
              <p>Дата создания заявки · только распознанные записи.</p>
            </div>
            <div className="segmented aquaguard-mini-switch" role="group" aria-label="Тип лидов">
              <button
                className={leadMetricMode === 'all' ? 'is-active' : ''}
                type="button"
                onClick={() => setLeadMetricMode('all')}
              >
                Все
              </button>
              <button
                className={leadMetricMode === 'target' ? 'is-active' : ''}
                type="button"
                onClick={() => setLeadMetricMode('target')}
              >
                Целевые
              </button>
            </div>
          </div>
          <SeoAnalyticsGroupedBarChart
            current={leadSeries}
            currentLabel="Текущий период"
            emptyLabel={leadIssue || 'данных пока нет'}
            previous={previousLeadSeries}
            previousLabel={compareRange ? 'Предыдущий период' : ''}
            valueFormatter={formatInteger}
          />
        </article>

        <article className="aquaguard-chart-panel">
          <div className="aquaguard-chart-toolbar">
            <div>
              <h3>Конверсия в обращение</h3>
              <p>
                {conversionVisits ?? 0} конверсионных визитов из {organicVisits ?? 0} органических.
              </p>
            </div>
            <span className="aquaguard-info-link">Какие цели учитываются</span>
          </div>
          <SeoAnalyticsLineChart
            current={conversionSeries}
            emptyLabel="Не настроен учет обращений в целях"
            previous={previousConversionSeries}
            previousLabel={compareRange ? formatInputRange(compareRange) : ''}
            title="CR"
            unitLabel="%"
            valueFormatter={(value) => formatConversionRate(value)}
          />
        </article>
      </div>

      <section className="aquaguard-impact-panel">
        <div className="aquaguard-chart-toolbar">
          <div>
            <h3>Что повлияло на изменение</h3>
            <p>Детализация использует те же период, сравнение и фильтры, где источник это поддерживает.</p>
          </div>
          <div className="segmented aquaguard-impact-tabs" role="group" aria-label="Тип детализации">
            {(Object.keys(seoImpactTabLabels) as SeoImpactTab[]).map((tab) => (
              <button className={impactTab === tab ? 'is-active' : ''} key={tab} type="button" onClick={() => setImpactTab(tab)}>
                {seoImpactTabLabels[tab]}
              </button>
            ))}
          </div>
        </div>
        <div className="aquaguard-impact-actions">
          <div className="segmented aquaguard-mini-switch" role="group" aria-label="Рост или падение">
            <button
              className={impactDirection === 'growth' ? 'is-active' : ''}
              type="button"
              onClick={() => setImpactDirection('growth')}
            >
              Рост
            </button>
            <button
              className={impactDirection === 'drop' ? 'is-active' : ''}
              type="button"
              onClick={() => setImpactDirection('drop')}
            >
              Падение
            </button>
          </div>
          <input
            aria-label="Поиск по детализации"
            placeholder="Поиск..."
            value={impactSearch}
            onChange={(event) => setImpactSearch(event.target.value)}
          />
          <button type="button" onClick={() => downloadCsv(`${slugifyFilePart(project.name)}-seo-impact.csv`, visibleImpactRows)}>
            <FileSpreadsheet size={16} />
            CSV
          </button>
        </div>
        <SeoImpactTable rows={visibleImpactRows} tab={impactTab} />
      </section>

      <section className="aquaguard-work-strip glass-inner">
        <div className="tile-heading">
          <LayoutList size={18} />
          <h3>Выполненные работы и расходы</h3>
        </div>
        <div className="aquaguard-work-chips">
          <span>
            Внедрения <em>{markers.length}</em>
          </span>
          <span>
            Размещено ссылок <em>{linkSummary.placed}</em>
          </span>
          <span>
            Факт закупа <em>{formatMoney(linkSummary.factCost)}</em>
          </span>
          <span>
            План закупа <em>{formatMoney(linkSummary.planCost)}</em>
          </span>
        </div>
        <button type="button" onClick={onOpenTasks}>
          Открыть задачи
          <ChevronRight size={16} />
        </button>
      </section>

      {activeTasks.length > 0 && (
        <details className="aquaguard-open-tasks">
          <summary>Актуальные задачи: {project.name}</summary>
          <div>
            {activeTasks.map((task) => (
              <article key={task.id}>
                <strong>{task.title}</strong>
                <span>
                  {task.ownerIds
                    .map((ownerId) => peopleMap.get(ownerId)?.name)
                    .filter(Boolean)
                    .join(', ') || 'Без ответственного'}{' '}
                  · {statusLabels[task.status]} · дедлайн {formatDate(task.deadline)}
                </span>
              </article>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function SeoAnalyticsKpiCard({ card }: { card: SeoKpiCardModel }) {
  const Icon =
    card.icon === 'users' ? Users : card.icon === 'target' ? Target : card.icon === 'funnel' ? SlidersHorizontal : BarChart3;
  return (
    <article className={`aquaguard-kpi-card ${card.tone}`}>
      <div>
        <Icon size={20} />
      </div>
      <section>
        <span>{card.title}</span>
        <strong>{card.value}</strong>
        <em>{card.deltaLabel}</em>
        <p>{card.statusLabel}</p>
      </section>
      <small>{card.meta}</small>
    </article>
  );
}

function SeoAnalyticsLineChart({
  current,
  previous,
  previousLabel,
  title,
  unitLabel,
  valueFormatter,
  markers = [],
  emptyLabel,
}: {
  current: AnalyticsSeriesPoint[];
  previous: AnalyticsSeriesPoint[];
  previousLabel: string;
  title: string;
  unitLabel: string;
  valueFormatter: (value: number) => string;
  markers?: AnalyticsMarker[];
  emptyLabel: string;
}) {
  if (current.length === 0) return <div className="aquaguard-chart-empty">{emptyLabel}</div>;

  const width = 880;
  const height = 248;
  const padding = { top: 18, right: 20, bottom: 38, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const chartLength = Math.max(current.length, previous.length, 2);
  const maxValue = Math.max(...current.map((point) => point.value), ...previous.map((point) => point.value), 1);
  const xFor = (index: number) => padding.left + (plotWidth * index) / Math.max(chartLength - 1, 1);
  const yFor = (value: number) => padding.top + plotHeight - (plotHeight * value) / maxValue;
  const pathFor = (points: AnalyticsSeriesPoint[]) => {
    if (points.length === 0) return '';
    const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point.value)}`).join(' ');
    return points.length === 1 ? `${path} L ${xFor(0) + 0.1} ${yFor(points[0].value)}` : path;
  };
  const labelEvery = Math.max(1, Math.ceil(current.length / 6));
  const labels = current.filter((_, index) => index === 0 || index === current.length - 1 || index % labelEvery === 0);
  const markerItems = markers
    .map((marker) => {
      const index = current.findIndex((point) => marker.date >= point.startDate && marker.date <= point.endDate);
      return index >= 0 ? { ...marker, x: xFor(index) } : null;
    })
    .filter((marker): marker is AnalyticsMarker & { x: number } => Boolean(marker));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => ({
    y: padding.top + plotHeight - plotHeight * part,
    value: maxValue * part,
  }));

  return (
    <div className="aquaguard-line-chart">
      <svg role="img" viewBox={`0 0 ${width} ${height}`} aria-label={title}>
        <title>{title}</title>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line x1={padding.left} x2={width - padding.right} y1={tick.y} y2={tick.y} />
            <text x={padding.left - 10} y={tick.y + 4}>
              {valueFormatter(tick.value)}
            </text>
          </g>
        ))}
        {labels.map((point, index) => {
          const pointIndex = current.indexOf(point);
          return (
            <text className="axis-label" key={`${point.key}-${index}`} x={xFor(pointIndex)} y={height - 18}>
              {point.label}
            </text>
          );
        })}
        {previous.length > 0 && <path className="previous-line" d={pathFor(previous)} />}
        <path className="current-line" d={pathFor(current)} />
        {previous.map((point, index) => (
          <circle className="previous-point" cx={xFor(index)} cy={yFor(point.value)} key={`prev-${point.key}`} r="3" />
        ))}
        {current.map((point, index) => (
          <circle className="current-point" cx={xFor(index)} cy={yFor(point.value)} key={point.key} r="4">
            <title>
              {point.label}: {valueFormatter(point.value)} {unitLabel}
            </title>
          </circle>
        ))}
        {markerItems.map((marker) => (
          <g className="chart-marker" key={`${marker.date}-${marker.title}`}>
            <line x1={marker.x} x2={marker.x} y1={padding.top} y2={height - padding.bottom} />
            <circle cx={marker.x} cy={padding.top + 4} r="5" />
          </g>
        ))}
      </svg>
      <div className="aquaguard-chart-legend">
        <span className="current">Текущий период</span>
        {previous.length > 0 && <span className="previous">{previousLabel}</span>}
      </div>
      {markerItems.length > 0 && (
        <div className="aquaguard-marker-list">
          {markerItems.slice(0, 4).map((marker) => (
            <span key={`${marker.date}-${marker.title}`}>
              {formatDate(marker.date)} · {marker.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SeoAnalyticsGroupedBarChart({
  current,
  previous,
  currentLabel,
  previousLabel,
  valueFormatter,
  emptyLabel,
}: {
  current: AnalyticsSeriesPoint[];
  previous: AnalyticsSeriesPoint[];
  currentLabel: string;
  previousLabel: string;
  valueFormatter: (value: number) => string;
  emptyLabel: string;
}) {
  if (current.length === 0) return <div className="aquaguard-chart-empty">{emptyLabel}</div>;

  const width = 620;
  const height = 260;
  const padding = { top: 18, right: 18, bottom: 42, left: 38 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const chartLength = Math.max(current.length, 1);
  const maxValue = Math.max(...current.map((point) => point.value), ...previous.map((point) => point.value), 1);
  const groupWidth = plotWidth / chartLength;
  const barWidth = Math.min(24, Math.max(7, groupWidth * 0.28));
  const yFor = (value: number) => padding.top + plotHeight - (plotHeight * value) / maxValue;
  const previousByIndex = new Map(previous.map((point, index) => [index, point]));
  const labelEvery = Math.max(1, Math.ceil(current.length / 5));

  return (
    <div className="aquaguard-bar-chart">
      <svg role="img" viewBox={`0 0 ${width} ${height}`} aria-label={currentLabel}>
        {[0, 0.5, 1].map((part) => {
          const y = padding.top + plotHeight - plotHeight * part;
          return (
            <g key={part}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text x={padding.left - 8} y={y + 4}>
                {valueFormatter(Math.round(maxValue * part))}
              </text>
            </g>
          );
        })}
        {current.map((point, index) => {
          const x = padding.left + groupWidth * index + groupWidth / 2;
          const previousPoint = previousByIndex.get(index);
          const currentHeight = point.value > 0 ? plotHeight - (yFor(point.value) - padding.top) : 0;
          const previousHeight =
            previousPoint && previousPoint.value > 0 ? plotHeight - (yFor(previousPoint.value) - padding.top) : 0;
          return (
            <g key={point.key}>
              {previousPoint && (
                <rect
                  className="previous-bar"
                  height={previousHeight}
                  rx="3"
                  width={barWidth}
                  x={x - barWidth - 2}
                  y={padding.top + plotHeight - previousHeight}
                />
              )}
              <rect
                className="current-bar"
                height={currentHeight}
                rx="3"
                width={barWidth}
                x={x + 2}
                y={padding.top + plotHeight - currentHeight}
              >
                <title>
                  {point.label}: {valueFormatter(point.value)}
                </title>
              </rect>
              {(index === 0 || index === current.length - 1 || index % labelEvery === 0) && (
                <text className="axis-label" x={x} y={height - 16}>
                  {point.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="aquaguard-chart-legend">
        <span className="current">{currentLabel}</span>
        {previous.length > 0 && <span className="previous">{previousLabel}</span>}
      </div>
    </div>
  );
}

function SeoImpactTable({ rows, tab }: { rows: SeoImpactRow[]; tab: SeoImpactTab }) {
  if (rows.length === 0) {
    return (
      <div className="aquaguard-impact-empty">
        {tab === 'pages'
          ? 'Посадочные страницы в текущих данных Метрики не выгружены.'
          : 'По выбранному направлению нет строк с доступным сравнением.'}
      </div>
    );
  }

  return (
    <div className="aquaguard-impact-table" role="table" aria-label={seoImpactTabLabels[tab]}>
      <div className="aquaguard-impact-row head" role="row">
        <span>{tab === 'pages' ? 'Страница' : 'Запрос'}</span>
        <span>Визиты</span>
        <span>Ранее</span>
        <span>Изменение</span>
        <span>Конв. визиты</span>
        <span>CR</span>
      </div>
      {rows.map((row) => (
        <div className="aquaguard-impact-row" key={row.id} role="row">
          <div>
            <strong>{row.label}</strong>
            <em>{row.note}</em>
          </div>
          <span>{row.visits === null ? '—' : formatInteger(row.visits)}</span>
          <span>{row.previousVisits === null ? '—' : formatInteger(row.previousVisits)}</span>
          <span className={row.change && row.change < 0 ? 'negative' : 'positive'}>
            {row.change === null ? 'нет сравнения' : formatInteger(row.change)}
          </span>
          <span>{row.conversionVisits === null ? '—' : formatInteger(row.conversionVisits)}</span>
          <span>{formatConversionRate(row.cr)}</span>
        </div>
      ))}
    </div>
  );
}

function SeoProjectTaskPanel({
  project,
  tasks,
  peopleById,
}: {
  project: Project;
  tasks: Task[];
  peopleById: Map<string, Person>;
}) {
  const activeTasks = tasks
    .filter((task) => task.status !== 'done')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.deadline.localeCompare(b.deadline));

  return (
    <aside className="panel seo-project-task-panel" style={{ '--project-color': project.color } as CSSProperties}>
      <div className="section-heading compact-heading">
        <div>
          <h2>Задачи проекта</h2>
          <p>{project.name}: актуальное сверху, закрытое не смешивается с аналитикой.</p>
        </div>
        <span className="soft-count">{activeTasks.length}</span>
      </div>
      {activeTasks.length === 0 ? (
        <div className="empty-row">Активных задач по проекту сейчас нет.</div>
      ) : (
        <div className="seo-project-task-list">
          {activeTasks.slice(0, 8).map((task) => (
            <article className={`seo-project-task ${task.status}`} key={task.id}>
              <div>
                <span className="mini-dot" />
                <strong>{task.title}</strong>
              </div>
              <p>
                {task.ownerIds
                  .map((ownerId) => peopleById.get(ownerId)?.name)
                  .filter(Boolean)
                  .join(', ') || 'Без ответственного'}
              </p>
              <footer>
                <span>{statusLabels[task.status]}</span>
                <em>{formatDate(task.deadline)}</em>
              </footer>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

function ManagedResourcesList({ title, resources }: { title: string; resources: ManagedResource[] }) {
  if (resources.length === 0) return null;

  return (
    <section className="managed-resource-section">
      <div className="tile-heading">
        <ExternalLink size={18} />
        <h3>{title}</h3>
      </div>
      <div className="managed-resource-grid">
        {resources.map((resource) => (
          <a className="managed-resource-card" href={resource.url} target="_blank" rel="noreferrer" key={resource.id}>
            <span>{managedResourceTabLabels[resource.tab]}</span>
            <strong>{resource.title}</strong>
            <p>{resource.note || resource.dateLabel || 'Источник добавлен через админку.'}</p>
            {resource.dateLabel && <em>{resource.dateLabel}</em>}
          </a>
        ))}
      </div>
    </section>
  );
}

function SeoProjectReportsPanel({
  project,
  resources,
  tasks,
  peopleById,
  reportSnapshots,
  bitrix24Snapshot,
  onReportSnapshotsChange,
  linkRows,
  promotionSources,
  leadAnalytics,
  leadLoadStatus,
  leadError,
  leadUpdatedAt,
  metrikaLoadStatus,
  metrikaError,
  metrikaUpdatedAt,
  onReloadLeads,
  onReloadMetrika,
}: {
  project: Project;
  resources: ManagedResource[];
  tasks: Task[];
  peopleById: Map<string, Person>;
  reportSnapshots: TaskReportSnapshot[];
  bitrix24Snapshot: Bitrix24Snapshot;
  onReportSnapshotsChange: Dispatch<SetStateAction<TaskReportSnapshot[]>>;
  linkRows: LinkPurchase[];
  promotionSources: PromotionResultSource[];
  leadAnalytics?: LeadAnalyticsSummary;
  leadLoadStatus: LinkLoadStatus;
  leadError: string;
  leadUpdatedAt: string;
  metrikaLoadStatus: LinkLoadStatus;
  metrikaError: string;
  metrikaUpdatedAt: string;
  onReloadLeads: () => void;
  onReloadMetrika: (mode?: MetrikaStatsLoadMode) => void;
}) {
  const [reportMode, setReportMode] = useStoredState<ReportMode>('task-seo-single-project-report-mode', 'tasks');
  const reportWeek = useMemo(() => getWeekWindow(-1), []);
  const planWeek = useMemo(() => getWeekWindow(0), []);
  const report = useMemo(
    () => buildSeoWeeklyReports([project], tasks, peopleById, reportWeek, planWeek)[0],
    [peopleById, planWeek, project, reportWeek, tasks],
  );
  const taskLogicReports = useMemo(
    () => buildTaskLogicReports([project], tasks, peopleById, reportSnapshots, bitrix24Snapshot, reportWeek, planWeek),
    [bitrix24Snapshot, peopleById, planWeek, project, reportSnapshots, reportWeek, tasks],
  );
  const overallTaskScore = useMemo(() => buildOverallTaskScore(taskLogicReports), [taskLogicReports]);
  const savedSnapshotCount = normalizeReportSnapshots(reportSnapshots).filter(
    (snapshot) => snapshot.reportDate <= planWeek.start,
  ).length;
  const saveCurrentSnapshot = () => {
    onReportSnapshotsChange((current) =>
      upsertTaskReportSnapshot(current, makeTaskReportSnapshot(tasks, planWeek.start, bitrix24Snapshot, 'dashboard')),
    );
  };
  const reportResources = resources.filter((resource) => resource.tab === 'report');
  const siteResources = resources.filter((resource) => resource.tab === 'site');

  return (
    <div className="seo-report-panel">
      <div className="link-panel-head">
        <div>
          <strong>Сайт и отчет перед клиентом: {project.name}</strong>
          <p>Кнопки на сайт, клиентские отчетные документы и дополнительные материалы из админки.</p>
        </div>
      </div>

      <div className="seo-report-mode-switch">
        <div className="segmented" role="group" aria-label={`Режим отчета перед клиентом SEO-проекта ${project.name}`}>
          {(Object.keys(reportModeLabels) as ReportMode[]).map((mode) => (
            <button
              className={reportMode === mode ? 'is-active' : ''}
              key={mode}
              type="button"
              onClick={() => setReportMode(mode)}
            >
              {reportModeLabels[mode]}
            </button>
          ))}
        </div>
      </div>

      {reportMode === 'metrics' ? (
        <ProjectSeoAnalyticsTiles
          project={project}
          linkRows={linkRows}
          promotionSources={promotionSources}
          leadAnalytics={leadAnalytics}
          leadLoadStatus={leadLoadStatus}
          leadError={leadError}
          leadUpdatedAt={leadUpdatedAt}
          metrikaLoadStatus={metrikaLoadStatus}
          metrikaError={metrikaError}
          metrikaUpdatedAt={metrikaUpdatedAt}
          onReloadLeads={onReloadLeads}
          onReloadMetrika={onReloadMetrika}
          tasks={tasks.filter((task) => task.projectId === project.id)}
        />
      ) : reportMode === 'logic' ? (
        <>
          <TaskLogicMode
            reports={taskLogicReports}
            overallScore={overallTaskScore}
            selectedReportWeek={reportWeek}
            selectedPlanWeek={planWeek}
            savedSnapshotCount={savedSnapshotCount}
            bitrix24Snapshot={bitrix24Snapshot}
            onSaveSnapshot={saveCurrentSnapshot}
            scopeProjectName={project.name}
          />
        </>
      ) : report ? (
        <div className="seo-single-report">
          <WeeklyReportProjectCard report={report} />
        </div>
      ) : (
        <div className="empty-row">По задачам этого проекта пока нет данных для недельного отчета перед клиентом.</div>
      )}

      <ManagedResourcesList title="Сайты" resources={siteResources} />
      <ManagedResourcesList title="Отчеты перед клиентом" resources={reportResources} />

      {resources.length === 0 && (
        <div className="empty-row">Для этого проекта пока нет сайта или отчетов перед клиентом. Добавить можно в админке.</div>
      )}
    </div>
  );
}

function PaymentMonthlyOverview({
  months,
  nextMonth,
}: {
  months: PaymentMonthlySummary[];
  nextMonth: PaymentMonthlySummary;
}) {
  const currentMonthKey = getRelativeMonthKey(0);
  const maxIncome = Math.max(...months.map((month) => Math.max(month.planIncome, month.factIncome)), 1);
  const nextProgress = nextMonth.planIncome > 0 ? Math.round((nextMonth.factIncome / nextMonth.planIncome) * 100) : 0;
  const nextProgressLabel = nextMonth.planIncome > 0 ? `${nextProgress}% от плана` : 'План еще не внесен';
  const nextDelta = nextMonth.factIncome - nextMonth.planIncome;
  const barWidth = (value: number) => (value > 0 ? `${Math.max(5, Math.round((value / maxIncome) * 100))}%` : '0%');

  return (
    <div className="payment-monthly-overview">
      <article className="payment-next-month-card">
        <div className="payment-monthly-card-head">
          <span>Следующий месяц</span>
          <strong>{nextMonth.label}</strong>
        </div>
        <div className="payment-next-month-values">
          <div>
            <span>План дохода</span>
            <strong>{formatMoney(nextMonth.planIncome)}</strong>
          </div>
          <div>
            <span>Факт</span>
            <strong className={nextMonth.factIncome >= nextMonth.planIncome ? 'payment-positive' : ''}>
              {formatMoney(nextMonth.factIncome)}
            </strong>
          </div>
        </div>
        <div className="payment-monthly-meter" aria-hidden="true">
          <span style={{ width: `${Math.min(Math.max(nextProgress, 0), 100)}%` }} />
        </div>
        <p>
          {nextProgressLabel}
          {nextMonth.planIncome > 0 && (
            <em className={nextDelta < 0 ? 'payment-negative' : 'payment-positive'}>
              {nextDelta < 0 ? ` · осталось ${formatMoney(Math.abs(nextDelta))}` : ` · +${formatMoney(nextDelta)}`}
            </em>
          )}
        </p>
      </article>

      <section className="payment-monthly-history">
        <div className="tile-heading">
          <Clock3 size={18} />
          <h3>Помесячная хронология</h3>
        </div>
        <div className="payment-monthly-list">
          {months.length === 0 ? (
            <div className="empty-row">Пока нет месяцев с планом или фактом.</div>
          ) : (
            months.slice(0, 12).map((month) => (
              <article className={`payment-monthly-row ${month.key === currentMonthKey ? 'is-current' : ''}`} key={month.key}>
                <header>
                  <div>
                    <strong>{month.label}</strong>
                    <span>
                      {month.projectNames.size || 0} проектов · {month.paymentCount + month.factRowCount} строк
                    </span>
                  </div>
                  {month.key === currentMonthKey && <em>текущий</em>}
                </header>
                <div className="payment-monthly-bars" aria-hidden="true">
                  <span className="plan" style={{ width: barWidth(month.planIncome) }} />
                  <span className="fact" style={{ width: barWidth(month.factIncome) }} />
                </div>
                <div className="payment-monthly-values">
                  <div>
                    <span>План</span>
                    <strong>{formatMoney(month.planIncome)}</strong>
                  </div>
                  <div>
                    <span>Факт</span>
                    <strong>{formatMoney(month.factIncome)}</strong>
                  </div>
                  <div>
                    <span>Расходы</span>
                    <strong>{formatMoney(month.serviceExpenseAmount)}</strong>
                  </div>
                  <div>
                    <span>Ссылки</span>
                    <strong>{formatMoney(month.linkExpenseAmount)}</strong>
                  </div>
                  <div>
                    <span>Остаток</span>
                    <strong className={month.netAmount < 0 ? 'payment-negative' : 'payment-positive'}>
                      {formatMoney(month.netAmount)}
                    </strong>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function PaymentCashflowPanel({
  project,
  rows,
  paymentRows,
  linkRows,
  projects,
  loadStatus,
  error,
  updatedAt,
  onReload,
}: {
  project?: Project;
  rows: PaymentCashflowRow[];
  paymentRows: PaymentRow[];
  linkRows: LinkPurchase[];
  projects: Project[];
  loadStatus: LinkLoadStatus;
  error: string;
  updatedAt: string;
  onReload: () => void;
}) {
  const summary = useMemo(() => summarizePaymentCashflowRows(rows), [rows]);
  const monthlySummaries = useMemo(
    () => buildPaymentMonthlySummaries(paymentRows, rows, linkRows, projects),
    [paymentRows, rows, linkRows, projects],
  );
  const nextMonthKey = getRelativeMonthKey(1);
  const nextMonthSummary = ensureMonthSummary(monthlySummaries, nextMonthKey);
  const monthsWithNext = monthlySummaries.some((month) => month.key === nextMonthKey)
    ? monthlySummaries
    : [nextMonthSummary, ...monthlySummaries].sort((left, right) => right.key.localeCompare(left.key));
  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (left, right) =>
          right.monthNo - left.monthNo ||
          left.projectName.localeCompare(right.projectName, 'ru') ||
          left.client.localeCompare(right.client, 'ru'),
      ),
    [rows],
  );

  return (
    <section className="panel payment-cashflow-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>{project ? `Приход/расход: ${project.name}` : 'Приход/расход из Google Sheets'}</h2>
          <p>Автоматическая выгрузка из вкладки SEo сайта: приход клиентов и расходы по SEO, разработке и прочему.</p>
        </div>
        <div className="link-actions">
          <a href={PAYMENT_CASHFLOW_SPREADSHEET_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Таблица
          </a>
          <button type="button" onClick={onReload} disabled={loadStatus === 'loading'}>
            <RefreshCw className={loadStatus === 'loading' ? 'spin' : undefined} size={16} />
            Обновить
          </button>
        </div>
      </div>

      {loadStatus === 'loading' && (
        <div className="sync-state">
          <RefreshCw className="spin" size={16} />
          Загружаю приход/расход из SEo сайта...
        </div>
      )}
      {loadStatus === 'error' && (
        <div className="sync-state is-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {loadStatus === 'ready' && updatedAt && (
        <div className="sync-state">Данные из SEo сайта · обновлено {updatedAt}</div>
      )}

      <div className="payment-cashflow-grid">
        <div>
          <span>Приход</span>
          <strong>{formatMoney(summary.incomeAmount)}</strong>
        </div>
        <div>
          <span>Расходы всего</span>
          <strong>{formatMoney(summary.totalExpenseAmount)}</strong>
        </div>
        <div>
          <span>SEO</span>
          <strong>{formatMoney(summary.seoExpenseAmount)}</strong>
        </div>
        <div>
          <span>Разработка</span>
          <strong>{formatMoney(summary.developerExpenseAmount)}</strong>
        </div>
        <div>
          <span>Другое</span>
          <strong>{formatMoney(summary.otherExpenseAmount)}</strong>
        </div>
        <div>
          <span>Остаток</span>
          <strong className={summary.netAmount < 0 ? 'payment-negative' : 'payment-positive'}>
            {formatMoney(summary.netAmount)}
          </strong>
        </div>
      </div>

      <PaymentMonthlyOverview months={monthsWithNext} nextMonth={nextMonthSummary} />

      {sortedRows.length === 0 && loadStatus !== 'loading' ? (
        <div className="empty-row">
          {project ? 'По этому проекту в SEo сайта пока нет строк прихода/расхода.' : 'Во вкладке SEo сайта пока нет строк прихода/расхода.'}
        </div>
      ) : (
        <div className="payment-cashflow-table">
          <div className="payment-cashflow-row payment-cashflow-head">
            <span>Клиент / месяц</span>
            <span>Приход</span>
            <span>SEO</span>
            <span>Разработка</span>
            <span>Другое</span>
            <span>Расходы</span>
            <span>Остаток</span>
          </div>
          {sortedRows.map((row) => (
            <div className="payment-cashflow-row" key={row.id}>
              <div>
                <strong>{project ? row.periodLabel : `${row.projectName} · ${row.periodLabel}`}</strong>
                <span>
                  {row.client}
                  {row.legalEntity ? ` · ${row.legalEntity}` : ''}
                </span>
              </div>
              <span>{formatMoney(row.incomeAmount)}</span>
              <span>{formatMoney(row.seoExpenseAmount)}</span>
              <span>{formatMoney(row.developerExpenseAmount)}</span>
              <span>{formatMoney(row.otherExpenseAmount)}</span>
              <span>{formatMoney(row.totalExpenseAmount)}</span>
              <strong className={row.netAmount < 0 ? 'payment-negative' : 'payment-positive'}>
                {formatMoney(row.netAmount)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PaymentsView({
  projects,
  paymentRows,
  paymentCashflowRows,
  paymentDraft,
  linkRows,
  paymentCashflowLoadStatus,
  paymentCashflowError,
  paymentCashflowUpdatedAt,
  onReloadPaymentCashflow,
  onPaymentDraftChange,
  onPaymentAdd,
  onPaymentUpdate,
  onPaymentDelete,
}: {
  projects: Project[];
  paymentRows: PaymentRow[];
  paymentCashflowRows: PaymentCashflowRow[];
  paymentDraft: PaymentDraft;
  linkRows: LinkPurchase[];
  paymentCashflowLoadStatus: LinkLoadStatus;
  paymentCashflowError: string;
  paymentCashflowUpdatedAt: string;
  onReloadPaymentCashflow: () => void;
  onPaymentDraftChange: Dispatch<SetStateAction<PaymentDraft>>;
  onPaymentAdd: (projectIdOverride?: string) => void;
  onPaymentUpdate: (rowId: string, patch: Partial<PaymentRow>) => void;
  onPaymentDelete: (rowId: string) => void;
}) {
  const summary = getPaymentSummary(paymentRows, linkRows, paymentCashflowRows);

  return (
    <section className="payments-view">
      <div className="dashboard-hero panel payments-hero">
        <div>
          <h2>График оплат</h2>
          <p>Отдельная вкладка по оплатам клиентов, аутсорсу и фактическим затратам на закуп ссылок.</p>
        </div>
        <div className="hero-metrics">
          <Metric label="Приход" value={formatMoney(summary.clientAmount)} />
          <Metric label="Расходы" value={formatMoney(summary.outsourceAmount)} />
          <Metric label="Закуп ссылок" value={formatMoney(summary.linkFact)} />
          <Metric label="Остаток" value={formatMoney(summary.margin)} tone={summary.margin < 0 ? 'danger' : 'success'} />
        </div>
      </div>
      <PaymentCashflowPanel
        rows={paymentCashflowRows}
        paymentRows={paymentRows}
        linkRows={linkRows}
        projects={projects}
        loadStatus={paymentCashflowLoadStatus}
        error={paymentCashflowError}
        updatedAt={paymentCashflowUpdatedAt}
        onReload={onReloadPaymentCashflow}
      />
      <PaymentRowsEditor
        projects={projects}
        rows={paymentRows}
        draft={paymentDraft}
        linkRows={linkRows}
        onDraftChange={onPaymentDraftChange}
        onAdd={onPaymentAdd}
        onUpdate={onPaymentUpdate}
        onDelete={onPaymentDelete}
      />
    </section>
  );
}

function PaymentRowsEditor({
  projects,
  rows,
  draft,
  linkRows,
  fixedProjectId,
  onDraftChange,
  onAdd,
  onUpdate,
  onDelete,
}: {
  projects: Project[];
  rows: PaymentRow[];
  draft: PaymentDraft;
  linkRows: LinkPurchase[];
  fixedProjectId?: string;
  onDraftChange: Dispatch<SetStateAction<PaymentDraft>>;
  onAdd: (projectIdOverride?: string) => void;
  onUpdate: (rowId: string, patch: Partial<PaymentRow>) => void;
  onDelete: (rowId: string) => void;
}) {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const visibleProjectId = fixedProjectId ?? draft.projectId;

  return (
    <section className="panel payment-editor">
      <div className="section-heading compact-heading">
        <div>
          <h2>График оплат</h2>
          <p>Статус оплаты, тип услуги, аутсорс и отдельная строка затрат на закуп ссылок.</p>
        </div>
        <CreditCard size={20} />
      </div>

      <div className="payment-add-form glass-inner">
        {!fixedProjectId && (
          <label className="field">
            <span>Проект</span>
            <select
              value={draft.projectId}
              onChange={(event) => onDraftChange((current) => ({ ...current, projectId: event.target.value }))}
            >
              {projects.map((project) => (
                <option value={project.id} key={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>Период</span>
          <input
            value={draft.periodLabel}
            onChange={(event) => onDraftChange((current) => ({ ...current, periodLabel: event.target.value }))}
            placeholder="Август 2026"
          />
        </label>
        <label className="field">
          <span>Дедлайн оплаты</span>
          <input
            type="date"
            value={draft.dueDate}
            onChange={(event) => onDraftChange((current) => ({ ...current, dueDate: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>Вид оплаты</span>
          <select
            value={draft.kind}
            onChange={(event) => onDraftChange((current) => ({ ...current, kind: event.target.value as PaymentKind }))}
          >
            {Object.entries(paymentKindLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Сумма клиента</span>
          <input
            value={draft.clientAmount}
            onChange={(event) => onDraftChange((current) => ({ ...current, clientAmount: event.target.value }))}
            placeholder="125000"
            inputMode="numeric"
          />
        </label>
        <button className="primary-button" type="button" onClick={() => onAdd(fixedProjectId)}>
          <Plus size={17} />
          Добавить оплату
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="empty-row">Строк оплат пока нет. Добавь первую строку выше.</div>
      ) : (
        <div className="payment-table">
          <div className="payment-row payment-head">
            <span>Проект / период</span>
            <span>Статус</span>
            <span>Вид</span>
            <span>Клиент</span>
            <span>Аутсорс</span>
            <span>Закуп ссылок</span>
            <span>Остаток</span>
            <span />
          </div>
          {rows.map((row) => {
            const project = projectById.get(row.projectId);
            const projectLinkRows =
              fixedProjectId || linkRows.length === 0
                ? linkRows
                : linkRows.filter((link) => normalizeProjectName(link.projectName) === normalizeProjectName(project?.name ?? ''));
            const linkFact = summarizeLinkPurchases(projectLinkRows).factCost;
            const outsourceCost = row.kind === 'outsource' ? row.outsourceAmount : 0;
            const margin = row.clientAmount - outsourceCost - linkFact;
            return (
              <div className="payment-row" key={row.id}>
                <div>
                  <strong>{project?.name ?? 'Без проекта'}</strong>
                  <input
                    value={row.periodLabel}
                    onChange={(event) => onUpdate(row.id, { periodLabel: event.target.value })}
                    aria-label="Период оплаты"
                  />
                  <input
                    type="date"
                    value={row.dueDate}
                    onChange={(event) => onUpdate(row.id, { dueDate: event.target.value })}
                    aria-label="Дедлайн оплаты"
                  />
                </div>
                <select
                  value={row.status}
                  onChange={(event) => onUpdate(row.id, { status: event.target.value as PaymentStatus })}
                  aria-label="Статус оплаты"
                >
                  {paymentStatusOrder.map((status) => (
                    <option key={status} value={status}>
                      {paymentStatusLabels[status]}
                    </option>
                  ))}
                </select>
                <select
                  value={row.kind}
                  onChange={(event) => onUpdate(row.id, { kind: event.target.value as PaymentKind })}
                  aria-label="Вид оплаты"
                >
                  {Object.entries(paymentKindLabels).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={row.clientAmount || ''}
                  onChange={(event) => onUpdate(row.id, { clientAmount: parseMoneyInput(event.target.value) })}
                  aria-label="Сумма от клиента"
                  inputMode="numeric"
                />
                <input
                  value={row.outsourceAmount || ''}
                  onChange={(event) => onUpdate(row.id, { outsourceAmount: parseMoneyInput(event.target.value) })}
                  aria-label="Оплата аутсорсу"
                  inputMode="numeric"
                  disabled={row.kind !== 'outsource'}
                  placeholder={row.kind === 'outsource' ? '0' : 'не нужно'}
                />
                <div className="payment-link-cost">
                  <strong>{formatMoney(linkFact)}</strong>
                  <input
                    value={row.linkBudgetLimit || ''}
                    onChange={(event) => onUpdate(row.id, { linkBudgetLimit: parseMoneyInput(event.target.value) })}
                    aria-label="Лимит затрат на закуп ссылок"
                    placeholder="лимит"
                    inputMode="numeric"
                  />
                </div>
                <strong className={margin < 0 ? 'payment-negative' : 'payment-positive'}>{formatMoney(margin)}</strong>
                <button className="ghost-button danger-button" type="button" onClick={() => onDelete(row.id)}>
                  Удалить
                </button>
              </div>
            );
          })}
        </div>
      )}

      {fixedProjectId && visibleProjectId && (
        <p className="payment-editor-note">
          Новая строка будет добавлена в проект {projectById.get(visibleProjectId)?.name ?? 'выбранный проект'}.
        </p>
      )}
    </section>
  );
}

function getPaymentSummary(
  rows: PaymentRow[],
  linkRows: LinkPurchase[],
  cashflowRows: PaymentCashflowRow[] = [],
) {
  const manualSummary = rows.reduce(
    (summary, row) => {
      const outsourceCost = row.kind === 'outsource' ? row.outsourceAmount : 0;
      return {
        clientAmount: summary.clientAmount + row.clientAmount,
        outsourceAmount: summary.outsourceAmount + outsourceCost,
        margin: summary.margin + row.clientAmount - outsourceCost,
      };
    },
    { clientAmount: 0, outsourceAmount: 0, margin: 0 },
  );
  const cashflowSummary = summarizePaymentCashflowRows(cashflowRows);
  const linkFact = summarizeLinkPurchases(linkRows).factCost;

  return {
    clientAmount: manualSummary.clientAmount + cashflowSummary.incomeAmount,
    outsourceAmount: manualSummary.outsourceAmount + cashflowSummary.totalExpenseAmount,
    linkFact,
    margin: manualSummary.margin + cashflowSummary.netAmount - linkFact,
  };
}

function TaskChronologyPanel({
  tasks,
  projects,
  peopleById,
}: {
  tasks: Task[];
  projects: Project[];
  peopleById: Map<string, Person>;
}) {
  const today = todayIso();
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const overdueTasks = tasks
    .filter((task) => task.status !== 'done' && Boolean(task.deadline) && task.deadline < today)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const currentTasks = tasks
    .filter((task) => task.status !== 'done' && (!task.deadline || task.deadline >= today))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.deadline.localeCompare(b.deadline));
  const doneTasks = tasks
    .filter((task) => task.status === 'done')
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt));

  const sections = [
    { id: 'overdue', title: 'Просрочено', subtitle: 'закреп сверху', items: overdueTasks, tone: 'danger' },
    { id: 'current', title: 'Новые и текущие', subtitle: 'свежее выше', items: currentTasks, tone: 'info' },
    { id: 'done', title: 'Выполнено', subtitle: 'закрытое ниже', items: doneTasks, tone: 'success' },
  ];

  return (
    <aside className="panel chronology-panel">
      <div className="section-heading compact-heading">
        <div>
          <h2>Хронология задач</h2>
          <p>Просроченное закреплено первым, новые идут сверху, выполненное собрано ниже.</p>
        </div>
        <Clock3 size={20} />
      </div>

      <div className="chronology-sections">
        {sections.map((section) => (
          <section className={`chronology-section ${section.tone}`} key={section.id}>
            <header>
              <div>
                <strong>{section.title}</strong>
                <span>{section.subtitle}</span>
              </div>
              <em>{section.items.length}</em>
            </header>
            {section.items.length === 0 ? (
              <div className="chronology-empty">Нет задач в этой группе.</div>
            ) : (
              <div className="chronology-list">
                {section.items.slice(0, 12).map((task) => {
                  const project = projectById.get(task.projectId);
                  const owners = task.ownerIds
                    .map((ownerId) => peopleById.get(ownerId)?.name)
                    .filter(Boolean)
                    .join(', ');
                  const displayDate = task.status === 'done' ? task.completedAt ?? '' : task.deadline || task.createdAt;
                  return (
                    <article className={`chronology-item ${task.status}`} key={`${section.id}-${task.id}`}>
                      <div className="chronology-item-top">
                        <span>
                          <i style={{ background: project?.color ?? '#4f65ff' }} />
                          {project?.name ?? 'Проект'}
                        </span>
                        <em>{formatDate(displayDate)}</em>
                      </div>
                      <strong>{task.title}</strong>
                      <p>{owners || 'Без ответственного'}</p>
                      <small>{statusLabels[task.status]}</small>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </aside>
  );
}

function StatusBadge({ status, urgency }: { status: string; urgency: string }) {
  const normalized = `${status} ${urgency}`.toLowerCase();
  const tone = normalized.includes('размещ') || normalized.includes('куплено')
    ? 'success'
    : normalized.includes('нужно')
      ? 'warning'
      : normalized.includes('закупил')
        ? 'info'
        : '';

  return <span className={`status-badge ${tone}`}>{status || urgency || 'Без статуса'}</span>;
}

function LinkStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'danger';
}) {
  return (
    <div className={`link-stat ${tone ?? ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  compact = false,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
  compact?: boolean;
}) {
  return (
    <div className={`metric ${tone ?? ''} ${compact ? 'compact' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function parseMoneyInput(value: string) {
  const normalized = value.replace(/\s/g, '').replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'RUB',
  }).format(value);
}

export default App;
