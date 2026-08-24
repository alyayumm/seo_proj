import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  LayoutList,
  Layers3,
  Moon,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sun,
  Target,
  Users,
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
  EXTERNAL_PROJECTS_SOURCE,
  type ExternalBudgetLine,
  type ExternalProjectAsset,
  type ExternalProjectSection,
  type ExternalProjectsSource,
  type ExternalTimelineItem,
  type ExternalWeeklyUpdate,
} from './externalProjects';
import { PROMOTION_RESULT_SOURCES, type PromotionResultSource } from './promotionResults';
import { WORK_PLAN_SOURCES, type WorkPlanSource } from './workPlans';

type View = 'tasks' | 'admin' | 'dashboard' | 'seo' | 'external';
type Status = 'planned' | 'active' | 'done' | 'risk';
type CalendarMode = 'plan' | 'fact';
type ThemeMode = 'dark' | 'light';
type AdminTab = 'projects' | 'people';
type ProjectTab = 'tasks' | 'links' | 'plans' | 'content' | 'results' | 'audit';
type LinkLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

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
};

const statusLabels: Record<Status, string> = {
  planned: 'План',
  active: 'В работе',
  done: 'Готово',
  risk: 'Риск',
};

const statusOrder: Status[] = ['planned', 'active', 'risk', 'done'];

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
  { id: 'person-marketing', name: 'Маркетинг', role: 'команда' },
  { id: 'person-kirill', name: 'Кирилл', role: 'ответственный' },
  { id: 'person-olga', name: 'Ольга', role: 'каталог и карточки' },
  { id: 'person-vlad-it', name: 'Влад', role: 'IT' },
];

const initialPeople: Person[] = requiredPeople;

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

const taskSeedVersion = 'client-statuses-2026-08-24-v1';
const legacyDemoTaskIds = new Set(['task-1', 'task-2', 'task-3', 'task-4']);

const requiredTaskSeeds: Task[] = [
  {
    id: 'current-ash-avtopravo-redesign',
    projectId: 'project-ash',
    title: 'Редизайн сайта Автоправо',
    description: 'Изменили ТЗ и брендбук, ориентир - сайты Симакина. Дедлайн по окну 20-23.08.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '2026-08-23',
    timelineEnabled: false,
    timeline: [],
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
    description: 'Собираем отзывы с ОП и ждем доступ к кабинету, чтобы ответить на имеющиеся негативные отзывы.',
    status: 'active',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-14',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-proskills-rustore-positive-reviews',
        title: 'Собрать положительные отзывы с ОП',
        ownerId: 'person-kristina',
        status: 'active',
        dueDate: '2026-08-14',
      },
      {
        id: 'timeline-proskills-rustore-access',
        title: 'Получить доступ к кабинету RuStore',
        ownerId: 'person-kristina',
        status: 'planned',
        dueDate: '2026-08-14',
      },
      {
        id: 'timeline-proskills-rustore-negative-replies',
        title: 'Ответить на имеющиеся негативные отзывы',
        ownerId: 'person-kristina',
        status: 'planned',
        dueDate: '2026-08-14',
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
    description: 'На 24.08: данные из Ahrefs собраны, сам прогноз идет в отчет к 25.08.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-17',
    deadline: '2026-08-25',
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
        status: 'active',
        dueDate: '2026-08-25',
      },
    ],
  },
  {
    id: 'current-promteh-site-usability-indexing',
    projectId: 'project-promteh',
    title: 'Точечные правки сайта, верстка, юзабилити и индексация',
    description: 'На 24.08: в работе мелкие точечные правки по сайту, верстке, юзабилити и индексации.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-promteh-new-quarter-plan',
    projectId: 'project-promteh',
    title: 'Новый план работ на 3 месяца',
    description: 'На 24.08: в работе новый план работ на 3 месяца.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '',
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
    description: 'На 24.08: в работе актуализация проектов.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-smartstroy-new-quarter-plan',
    projectId: 'project-smart',
    title: 'Новый план работ на 3 месяца',
    description: 'На 24.08: в работе новый план работ на 3 месяца.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
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
    description: 'На 24.08: каталог реализован, в работе заполнение и мелкие правки по товарке.',
    status: 'active',
    ownerIds: ['person-olga'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-aquaguard-new-quarter-plan',
    projectId: 'project-aquaguard',
    title: 'Новый план работ на 3 месяца',
    description: 'На 24.08: в работе новый план работ на 3 месяца.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-aquaguard-feeds-yandex-support',
    projectId: 'project-aquaguard',
    title: 'Листы, фиды и индексация товаров',
    description: 'На 17.08: листы и фиды готовы, товары на индексации.',
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
    description: 'На 24.08: в работе контент план по товарам и фиды.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-site-usability-fixes',
    projectId: 'project-balt-pallet',
    title: 'Правки по сайту, верстке и юзабилити',
    description: 'На 24.08: в работе правки по сайту, верстке и юзабилити.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-24',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-semantics-source',
    projectId: 'project-balt-pallet',
    title: 'Семантика Балт Паллет',
    description: 'Источник семантики: файл balt-pallet.ru - ся, вкладка balt-pallet_stranicy_zaprosy.',
    sourceLabel: 'Семантика',
    sourceUrl:
      'https://docs.google.com/spreadsheets/d/14iLj1IePYPPhC_GKvcQgaJXV8wTCX0OqxliMBCfJHyQ/edit?gid=1142275802#gid=1142275802',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-17',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-domain',
    projectId: 'project-balt-pallet',
    title: 'Покупка домена',
    description: 'Актуальная задача по Балт-паллет.',
    status: 'planned',
    ownerIds: ['person-kirill'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-watch-tag-pages-feeds-schema',
    projectId: 'project-watch',
    title: 'ЧПУ страницы, фиды, разметка и юзабилити',
    description: 'На 24.08: в работе ЧПУ страницы, фиды, разметка и юзабилити.',
    status: 'active',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-rectop-layout-templates',
    projectId: 'project-rectop',
    title: 'WP-верстка и импорт контента',
    description: 'На 17.08: сайт сверстан на WP, ждем правки импорта контента и финальную готовность.',
    status: 'active',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-rectop-wp-layout',
        title: 'Сверстать сайт на WP',
        ownerId: 'person-outsource',
        status: 'done',
        dueDate: '',
        completedAt: '2026-08-17',
      },
      {
        id: 'timeline-rectop-content-import-fixes',
        title: 'Дождаться правок импорта контента',
        ownerId: 'person-outsource',
        status: 'active',
        dueDate: '',
      },
      {
        id: 'timeline-rectop-final-ready',
        title: 'Финальная готовность после импорта',
        ownerId: 'person-outsource',
        status: 'planned',
        dueDate: '',
      },
    ],
  },
  {
    id: 'report-watchstore-2026-08',
    projectId: 'project-watch',
    title: 'Обновить отчет за август: WatchStore',
    description: 'На 24.08: нужно обновить отчет. Дедлайн по отчетам - 25 число каждого месяца.',
    status: 'active',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-aquaguard-2026-08',
    projectId: 'project-aquaguard',
    title: 'Отчет за август: Аквагард',
    description: 'Дедлайн по отчетам - 25 число каждого месяца.',
    status: 'planned',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-promteh-2026-08',
    projectId: 'project-promteh',
    title: 'Отчет за август: Макулатура + прогноз',
    description: 'К отчету на 25.08 добавить прогноз по данным Ahrefs.',
    status: 'active',
    ownerIds: ['person-kristina', 'person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-smartstroy-2026-08',
    projectId: 'project-smart',
    title: 'Отчет за август: СмартСтрой',
    description: 'Дедлайн по отчетам - 25 число каждого месяца.',
    status: 'planned',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-balt-pallet-2026-08',
    projectId: 'project-balt-pallet',
    title: 'Отчет за август: Паллет',
    description: 'Дедлайн по отчетам - 25 число каждого месяца.',
    status: 'planned',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-25',
    timelineEnabled: false,
    timeline: [],
  },
];

const requiredTaskSeedById = new Map(requiredTaskSeeds.map((task) => [task.id, task]));

const initialTasks: Task[] = requiredTaskSeeds;

const navItems = [
  { id: 'tasks' as const, label: 'Список задач', icon: LayoutList },
  { id: 'admin' as const, label: 'Админка', icon: SlidersHorizontal },
  { id: 'dashboard' as const, label: 'Общий дашборд', icon: BarChart3 },
  { id: 'seo' as const, label: 'SEO-проекты', icon: Target },
  { id: 'external' as const, label: 'Сторонние проекты', icon: FileText },
];

const externalStatusLabels: Record<ExternalProjectSection['status'], string> = {
  active: 'в работе',
  done: 'готово',
  waiting: 'ожидание',
  next: 'следующий шаг',
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

function normalizeProjectName(value: string) {
  return value.trim().toLowerCase();
}

function getDays(count = 14) {
  return Array.from({ length: count }, (_, index) => addDaysIso(index));
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

function App() {
  const [projects, setProjects] = useStoredState<Project[]>('task-seo-projects', initialProjects);
  const [people, setPeople] = useStoredState<Person[]>('task-seo-people', initialPeople);
  const [tasks, setTasks] = useStoredState<Task[]>('task-seo-tasks', initialTasks);
  const [activeView, setActiveView] = useState<View>('tasks');
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

  const [taskDraft, setTaskDraft] = useState({
    title: '',
    description: '',
    projectId: initialProjects[0].id,
    deadline: addDaysIso(3),
    ownerIds: [initialPeople[0].id],
    multi: false,
  });
  const [projectDraft, setProjectDraft] = useState('');
  const [personDraft, setPersonDraft] = useState({ name: '', role: '' });

  const peopleById = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);
  const days = useMemo(() => getDays(14), []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    setProjects((current) => {
      const withoutLegacy = current.filter((project) => !legacyProjectNamesToRemove.has(normalizeProjectName(project.name)));
      const names = new Set(withoutLegacy.map((project) => normalizeProjectName(project.name)));
      const missingProjects = REQUIRED_LINK_PROJECTS.filter(
        (project) => !names.has(normalizeProjectName(project.name)),
      );
      const changed = withoutLegacy.length !== current.length || missingProjects.length > 0;
      return changed ? [...withoutLegacy, ...missingProjects] : current;
    });
  }, [setProjects]);

  useEffect(() => {
    setPeople((current) => {
      const legacyIds = new Set(Object.keys(legacyPersonIdMap));
      const withoutLegacy = current.filter((person) => !legacyIds.has(person.id));
      let changed = withoutLegacy.length !== current.length;

      const next = withoutLegacy.map((person) => {
        const required = requiredPeople.find(
          (item) => normalizeProjectName(item.name) === normalizeProjectName(person.name),
        );
        if (!required || person.role === required.role) return person;
        changed = true;
        return { ...person, role: required.role };
      });

      const names = new Set(next.map((person) => normalizeProjectName(person.name)));
      requiredPeople.forEach((person) => {
        if (!names.has(normalizeProjectName(person.name))) {
          next.push(person);
          changed = true;
        }
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
        if (!required) return task;
        changed = true;
        return required;
      });
      const taskIds = new Set(next.map((task) => task.id));

      requiredTaskSeeds.forEach((task) => {
        if (!taskIds.has(task.id)) {
          next.push(task);
          taskIds.add(task.id);
          changed = true;
        }
      });

      return changed ? next : current;
    });

    localStorage.setItem('task-seo-task-seed-version', taskSeedVersion);
  }, [setTasks]);

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

    try {
      const rows = await fetchContentPlanTopics();
      setContentTopics(rows);
      setContentUpdatedAt(new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }));
      setContentLoadStatus('ready');
    } catch (error) {
      setContentError(error instanceof Error ? error.message : 'Не удалось загрузить контент-план');
      setContentLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadLinkRows();
  }, [loadLinkRows]);

  useEffect(() => {
    void loadContentTopics();
  }, [loadContentTopics]);

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
    PROMOTION_RESULT_SOURCES.forEach((source) => {
      const key = normalizeProjectName(source.projectName);
      const current = map.get(key) ?? [];
      current.push(source);
      map.set(key, current);
    });
    return map;
  }, []);

  const clientLinksByProject = useMemo(
    () => new Map(CLIENT_QUICK_LINKS.map((item) => [normalizeProjectName(item.projectName), item])),
    [],
  );

  const collapsedProjectIds = useMemo(() => new Set(collapsedProjects), [collapsedProjects]);

  const completion = useMemo(() => {
    const total = tasks.length || 1;
    const done = tasks.filter((task) => task.status === 'done').length;
    return Math.round((done / total) * 100);
  }, [tasks]);

  const collisions = useMemo(() => {
    const activeTasks = tasks.filter((task) => task.status !== 'done' && task.deadline);
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
    () => tasks.filter((task) => task.status !== 'done' && task.deadline && task.deadline < todayIso()).length,
    [tasks],
  );

  const setTaskStatus = (taskId: string, status: Status) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              completedAt: status === 'done' ? task.completedAt ?? todayIso() : undefined,
            }
          : task,
      ),
    );
  };

  const toggleTimeline = (taskId: string, checked: boolean) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              timelineEnabled: checked,
              timeline:
                checked && task.timeline.length === 0
                  ? buildTimeline(task.title, task.ownerIds, task.deadline)
                  : task.timeline,
            }
          : task,
      ),
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
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
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
            }
          : task,
      ),
    );
  };

  const createTask = () => {
    const title = taskDraft.title.trim();
    if (!title || taskDraft.ownerIds.length === 0) return;

    const timelineEnabled = taskDraft.ownerIds.length > 1;
    const nextTask: Task = {
      id: uid('task'),
      projectId: taskDraft.projectId,
      title,
      description: taskDraft.description.trim(),
      status: 'planned',
      ownerIds: taskDraft.ownerIds,
      createdAt: todayIso(),
      deadline: taskDraft.deadline,
      timelineEnabled,
      timeline: timelineEnabled ? buildTimeline(title, taskDraft.ownerIds, taskDraft.deadline) : [],
    };

    setTasks((current) => [nextTask, ...current]);
    setExpanded((current) => {
      const next = new Set(current);
      if (timelineEnabled) next.add(nextTask.id);
      return next;
    });
    setTaskDraft({
      title: '',
      description: '',
      projectId: projects[0]?.id ?? '',
      deadline: addDaysIso(3),
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

  const addPerson = () => {
    const name = personDraft.name.trim();
    if (!name) return;
    setPeople((current) => [
      ...current,
      { id: uid('person'), name, role: personDraft.role.trim() || 'ответственный' },
    ]);
    setPersonDraft({ name: '', role: '' });
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
                    <h2>Список задач</h2>
                    <p>Задачи сгруппированы по проектам. Хронология раскрывается только там, где нужна детализация.</p>
                  </div>
                  <span className="soft-count">{tasks.length} задач</span>
                </div>

                <div className="project-stack">
                  {groupedTasks.map(({ project, tasks: projectTasks }) => (
                    <ProjectGroup
                      key={project.id}
                      project={project}
                      tasks={projectTasks}
                      linkRows={linkRowsByProject.get(normalizeProjectName(project.name)) ?? []}
                      linkSummary={linkSummaries.get(normalizeProjectName(project.name))}
                      contentTopics={contentTopicsByProject.get(normalizeProjectName(project.name)) ?? []}
                      contentSummary={contentSummaries.get(normalizeProjectName(project.name))}
                      contentSource={contentSourcesByProject.get(normalizeProjectName(project.name))}
                      workPlans={workPlansByProject.get(normalizeProjectName(project.name)) ?? []}
                      auditSources={auditSourcesByProject.get(normalizeProjectName(project.name)) ?? []}
                      promotionResults={promotionResultsByProject.get(normalizeProjectName(project.name)) ?? []}
                      clientLinks={clientLinksByProject.get(normalizeProjectName(project.name))}
                      linkLoadStatus={linkLoadStatus}
                      linkError={linkError}
                      linkUpdatedAt={linkUpdatedAt}
                      contentLoadStatus={contentLoadStatus}
                      contentError={contentError}
                      contentUpdatedAt={contentUpdatedAt}
                      activeTab={projectTabs[project.id] ?? 'tasks'}
                      collapsed={collapsedProjectIds.has(project.id)}
                      peopleById={peopleById}
                      expanded={expanded}
                      onTabChange={(tab) => setProjectTabs((current) => ({ ...current, [project.id]: tab }))}
                      onReloadLinks={loadLinkRows}
                      onReloadContent={loadContentTopics}
                      onToggleCollapsed={() => toggleProjectCollapsed(project.id)}
                      onToggleExpanded={toggleExpanded}
                      onToggleTimeline={toggleTimeline}
                      onStatusChange={setTaskStatus}
                      onTimelineStatusChange={setTimelineStatus}
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
            projectDraft={projectDraft}
            personDraft={personDraft}
            onProjectDraftChange={setProjectDraft}
            onPersonDraftChange={setPersonDraft}
            onProjectAdd={addProject}
            onPersonAdd={addPerson}
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
          />
        )}

        {activeView === 'seo' && (
          <SeoProjectsView
            projects={projects}
            tasks={tasks}
            peopleById={peopleById}
            linkRows={linkRows}
            promotionSources={PROMOTION_RESULT_SOURCES}
            selectedProjectId={seoProjectId}
            onProjectChange={setSeoProjectId}
          />
        )}

        {activeView === 'external' && <ExternalProjectsView source={EXTERNAL_PROJECTS_SOURCE} />}
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

function ExternalProjectsView({ source }: { source: ExternalProjectsSource }) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [projectAdditions, setProjectAdditions] = useStoredState<ExternalProjectAdditions>(
    'task-seo-external-project-additions',
    {},
  );
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
    setProjectAdditions((current) => ({
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
                              {externalTimelineStatusLabels[item.status]}
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
            Отдельная зона для задач, которые идут не внутри клиентского SEO-списка, а в рабочем документе с{' '}
            {source.collaborator}.
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

function getExternalTimeline(section: ExternalProjectSection) {
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
          <p>Дата постановки появится автоматически сегодня.</p>
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
  tasks: Task[];
  linkRows: LinkPurchase[];
  linkSummary?: LinkPurchaseSummary;
  contentTopics: ContentPlanTopic[];
  contentSummary?: ContentPlanSummary;
  contentSource?: ContentPlanSource;
  workPlans: WorkPlanSource[];
  auditSources: ClientAuditSource[];
  promotionResults: PromotionResultSource[];
  clientLinks?: ClientQuickLinks;
  linkLoadStatus: LinkLoadStatus;
  linkError: string;
  linkUpdatedAt: string;
  contentLoadStatus: LinkLoadStatus;
  contentError: string;
  contentUpdatedAt: string;
  activeTab: ProjectTab;
  collapsed: boolean;
  peopleById: Map<string, Person>;
  expanded: Set<string>;
  onTabChange: (tab: ProjectTab) => void;
  onReloadLinks: () => void;
  onReloadContent: () => void;
  onToggleCollapsed: () => void;
  onToggleExpanded: (taskId: string) => void;
  onToggleTimeline: (taskId: string, checked: boolean) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onTimelineStatusChange: (taskId: string, itemId: string, status: Status) => void;
};

function ProjectGroup({
  project,
  tasks,
  linkRows,
  linkSummary,
  contentTopics,
  contentSummary,
  contentSource,
  workPlans,
  auditSources,
  promotionResults,
  clientLinks,
  linkLoadStatus,
  linkError,
  linkUpdatedAt,
  contentLoadStatus,
  contentError,
  contentUpdatedAt,
  activeTab,
  collapsed,
  peopleById,
  expanded,
  onTabChange,
  onReloadLinks,
  onReloadContent,
  onToggleCollapsed,
  onToggleExpanded,
  onToggleTimeline,
  onStatusChange,
  onTimelineStatusChange,
}: ProjectGroupProps) {
  const panelId = `project-panel-${project.id}`;
  const projectSummary = [
    `${tasks.length} задач`,
    `${linkRows.length} ссылок`,
    `${workPlans.length} планов`,
    `${contentTopics.length} тем`,
    `${promotionResults.length} результатов`,
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
              Результаты <em>{promotionResults.length}</em>
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
                    peopleById={peopleById}
                    expanded={expanded.has(task.id)}
                    onToggleExpanded={onToggleExpanded}
                    onToggleTimeline={onToggleTimeline}
                    onStatusChange={onStatusChange}
                    onTimelineStatusChange={onTimelineStatusChange}
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

          {activeTab === 'results' && <PromotionResultsPanel project={project} sources={promotionResults} />}

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
      <a href={links.siteUrl} target="_blank" rel="noreferrer" title={links.siteUrl}>
        <ExternalLink size={14} />
        Сайт
      </a>
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
  const statusText =
    loadStatus === 'loading'
      ? 'Загружаю темы из Google Sheets...'
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

      <div className={`sync-state ${loadStatus === 'error' ? 'is-error' : ''}`}>
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
                ? `${summary.nextTopic.date} · ${summary.nextTopic.service} · ${summary.nextTopic.format}`
                : source.note}
            </p>
          </article>

          {groupedTopics.length === 0 ? (
            <div className="empty-row">Темы еще загружаются или таблица пока не вернула строки.</div>
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
                          <p>
                            {topic.block} · {topic.intent} · {topic.service}
                          </p>
                        </div>
                        <span>{topic.priority}</span>
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

function PromotionResultsPanel({ project, sources }: { project: Project; sources: PromotionResultSource[] }) {
  const source = sources[0];

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
        <article className="promotion-result-card is-muted">
          <span>Заявки</span>
          <strong>Данных пока нет</strong>
          <p>Блок уже заложен в отчет. Когда появится источник по заявкам, сюда можно будет добавить цифры и динамику.</p>
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

      {source ? (
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
      ) : (
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
  peopleById: Map<string, Person>;
  expanded: boolean;
  onToggleExpanded: (taskId: string) => void;
  onToggleTimeline: (taskId: string, checked: boolean) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onTimelineStatusChange: (taskId: string, itemId: string, status: Status) => void;
};

function TaskRow({
  task,
  project,
  peopleById,
  expanded,
  onToggleExpanded,
  onToggleTimeline,
  onStatusChange,
  onTimelineStatusChange,
}: TaskRowProps) {
  const owners = task.ownerIds.map((id) => peopleById.get(id)).filter(Boolean) as Person[];
  const isOverdue = task.status !== 'done' && Boolean(task.deadline) && task.deadline < todayIso();

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
                <FileSpreadsheet size={13} />
                {task.sourceLabel ?? 'Источник'}
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

        <label className="timeline-toggle">
          <input
            type="checkbox"
            checked={task.timelineEnabled}
            onChange={(event) => onToggleTimeline(task.id, event.target.checked)}
          />
          <span>Хронология</span>
        </label>
      </div>

      {task.timelineEnabled && expanded && (
        <div className="timeline-list">
          {task.timeline.map((item) => {
            const owner = peopleById.get(item.ownerId);
            return (
              <div key={item.id} className="timeline-item">
                <span className="timeline-rail" />
                <div>
                  <strong>{item.title}</strong>
                  <p>
                    {owner?.name ?? 'Без ответственного'} · дедлайн {formatDate(item.dueDate)}
                  </p>
                </div>
                <select
                  value={item.status}
                  onChange={(event) => onTimelineStatusChange(task.id, item.id, event.target.value as Status)}
                >
                  {statusOrder.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
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
          <h2>Общий дашборд</h2>
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
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
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
  projectDraft: string;
  personDraft: { name: string; role: string };
  onProjectDraftChange: (value: string) => void;
  onPersonDraftChange: Dispatch<SetStateAction<{ name: string; role: string }>>;
  onProjectAdd: () => void;
  onPersonAdd: () => void;
};

function AdminView({
  tab,
  onTabChange,
  projects,
  people,
  projectDraft,
  personDraft,
  onProjectDraftChange,
  onPersonDraftChange,
  onProjectAdd,
  onPersonAdd,
}: AdminViewProps) {
  return (
    <section className="panel admin-view">
      <div className="section-heading">
        <div>
          <h2>Админка</h2>
          <p>Здесь добавляются проекты и база ответственных, чтобы не вводить их в каждой задаче.</p>
        </div>
        <div className="segmented" role="group" aria-label="Раздел админки">
          <button className={tab === 'projects' ? 'is-active' : ''} type="button" onClick={() => onTabChange('projects')}>
            Проекты
          </button>
          <button className={tab === 'people' ? 'is-active' : ''} type="button" onClick={() => onTabChange('people')}>
            Ответственные
          </button>
        </div>
      </div>

      {tab === 'projects' ? (
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
              </div>
            ))}
          </div>
        </div>
      ) : (
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
              </div>
            ))}
          </div>
        </div>
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
};

function DashboardView({
  projects,
  tasks,
  peopleById,
  completion,
  overdueCount,
  collisions,
}: DashboardViewProps) {
  const totalTimeline = tasks.reduce((sum, task) => sum + task.timeline.length, 0);

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
                  const projectTasks = tasks.filter((task) => task.projectId === project.id);
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

            <section className="panel">
              <div className="section-heading compact-heading">
                <div>
                  <h2>Наложения</h2>
                  <p>Ответственные с задачами рядом по срокам.</p>
                </div>
                <Users size={20} />
              </div>
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
            </section>
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
                .filter((task) => task.status !== 'done' && task.deadline)
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

        </div>

        <TaskChronologyPanel tasks={tasks} projects={projects} peopleById={peopleById} />
      </div>
    </section>
  );
}

function SeoProjectsView({
  projects,
  tasks,
  peopleById,
  linkRows,
  promotionSources,
  selectedProjectId,
  onProjectChange,
}: {
  projects: Project[];
  tasks: Task[];
  peopleById: Map<string, Person>;
  linkRows: LinkPurchase[];
  promotionSources: PromotionResultSource[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
}) {
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];
  const selectedKey = normalizeProjectName(selectedProject?.name ?? '');
  const selectedLinkRows = linkRows.filter((row) => normalizeProjectName(row.projectName) === selectedKey);
  const selectedSources = promotionSources.filter((source) => normalizeProjectName(source.projectName) === selectedKey);
  const selectedTasks = selectedProject ? tasks.filter((task) => task.projectId === selectedProject.id) : [];
  const activeTasks = selectedTasks.filter((task) => task.status !== 'done').length;

  return (
    <section className="seo-projects-view">
      <div className="dashboard-hero panel seo-projects-hero">
        <div>
          <h2>SEO-проекты</h2>
          <p>Разверни аналитику по одному проекту: ссылки, переходы, лиды, цели и ближайшие задачи.</p>
        </div>
        <div className="hero-metrics">
          <Metric label="Проекты" value={String(projects.length)} />
          <Metric label="Выбрано" value={selectedProject?.name ?? '—'} />
          <Metric label="Задачи" value={String(activeTasks)} />
          <Metric label="Источники" value={String(selectedSources.length)} />
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

      {selectedProject ? (
        <div className="seo-project-layout">
          <div className="seo-project-main">
            <ProjectSeoAnalyticsTiles
              project={selectedProject}
              linkRows={selectedLinkRows}
              promotionSources={selectedSources}
            />
          </div>
          <SeoProjectTaskPanel project={selectedProject} tasks={selectedTasks} peopleById={peopleById} />
        </div>
      ) : (
        <div className="empty-row">Пока нет проектов для аналитики.</div>
      )}
    </section>
  );
}

function ProjectSeoAnalyticsTiles({
  project,
  linkRows,
  promotionSources,
}: {
  project: Project;
  linkRows: LinkPurchase[];
  promotionSources: PromotionResultSource[];
}) {
  const linkSummary = useMemo(() => summarizeLinkPurchases(linkRows), [linkRows]);
  const source = promotionSources[0];
  const goalExamples = source?.goalExamples ?? [];
  const hasGoalField = Boolean(source?.fields.includes('Достижение цели'));
  const linkChartItems = [
    { label: 'Всего строк', value: linkSummary.count },
    { label: 'Размещено', value: linkSummary.placed },
    { label: 'В работе', value: linkSummary.inProgress },
    { label: 'Купить', value: linkSummary.needToBuy },
  ].filter((item) => item.value > 0);
  const maxLinks = Math.max(...linkChartItems.map((item) => item.value), 1);

  return (
    <section className="analytics-tile-grid" aria-label={`Аналитика SEO-проекта ${project.name}`}>
      <article className="analytics-tile analytics-tile-large">
        <div className="analytics-tile-head">
          <div>
            <span>Закуп ссылок</span>
            <h3>{linkSummary.count ? `${linkSummary.count} строк` : 'нет строк'}</h3>
          </div>
          <BarChart3 size={20} />
        </div>
        {linkChartItems.length === 0 ? (
          <div className="analytics-empty">нет строк закупа по проекту</div>
        ) : (
          <div className="analytics-bar-chart">
            {linkChartItems.map((item) => (
              <div className="analytics-bar-row" key={item.label}>
                <span>{item.label}</span>
                <div>
                  <i style={{ width: `${Math.max(9, (item.value / maxLinks) * 100)}%` }} />
                </div>
                <em>{item.value}</em>
              </div>
            ))}
          </div>
        )}
        <div className="analytics-tile-footer">
          <span>План: {formatMoney(linkSummary.planCost)}</span>
          <span>Факт: {formatMoney(linkSummary.factCost)}</span>
          <a href={LINK_SOURCE_SPREADSHEET_URL} target="_blank" rel="noreferrer">
            Источник
          </a>
        </div>
      </article>

      <article className="analytics-tile">
        <div className="analytics-tile-head">
          <div>
            <span>Динамика переходов</span>
            <h3>{source ? source.recordsLabel : 'нет источника'}</h3>
          </div>
          <RefreshCw size={20} />
        </div>
        <div className={source ? 'analytics-wave-chart' : 'analytics-placeholder-chart'} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <p>
          {source
            ? `${source.spreadsheetTitle} · ${source.periodLabel}. Для помесячной динамики нужен периодный срез.`
            : 'источник Метрики не подключен'}
        </p>
        {source && (
          <div className="analytics-chip-row">
            {source.sampleQueries.map((query) => (
              <em key={query}>{query}</em>
            ))}
          </div>
        )}
      </article>

      <article className="analytics-tile">
        <div className="analytics-tile-head">
          <div>
            <span>Динамика лидов</span>
            <h3>данных пока нет</h3>
          </div>
          <Users size={20} />
        </div>
        <div className="analytics-placeholder-chart" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <p>Слот под заявки уже есть. Когда появится источник, сюда встанут лиды и динамика по периодам.</p>
      </article>

      <article className="analytics-tile">
        <div className="analytics-tile-head">
          <div>
            <span>Цели на сайте</span>
            <h3>{hasGoalField ? (goalExamples.length ? `${goalExamples.length} примера` : 'колонка готова') : 'нет источника'}</h3>
          </div>
          <Target size={20} />
        </div>
        <div className="analytics-chip-row">
          {(hasGoalField
            ? goalExamples.length
              ? goalExamples
              : ['цели будут подтягиваться из таблицы']
            : ['цели будут подтягиваться из таблицы']
          ).map((goal) => (
            <em key={goal}>{goal}</em>
          ))}
        </div>
        <p>
          {hasGoalField
            ? 'Поле “Достижение цели” есть в таблице результатов продвижения.'
            : 'Когда появится таблица целей, она попадет в эту часть отчета.'}
        </p>
      </article>
    </section>
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
                  const displayDate =
                    task.status === 'done' ? task.completedAt ?? task.deadline : task.deadline || task.createdAt;
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
  tone?: 'success' | 'warning' | 'danger';
  compact?: boolean;
}) {
  return (
    <div className={`metric ${tone ?? ''} ${compact ? 'compact' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'RUB',
  }).format(value);
}

export default App;
