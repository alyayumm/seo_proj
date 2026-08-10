import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
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
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Target,
  Users,
} from 'lucide-react';
import {
  CLIENT_AUDIT_SPREADSHEET_URL,
  CLIENT_AUDIT_SOURCES,
  SEO_AUDIT_CHECKLIST,
  type ClientAuditSource,
} from './auditSources';
import {
  fetchLinkPurchases,
  LINK_SOURCE_SPREADSHEET_URL,
  REQUIRED_LINK_PROJECTS,
  summarizeLinkPurchases,
  type LinkPurchase,
  type LinkPurchaseSummary,
} from './linkPurchases';
import { WORK_PLAN_SOURCES, type WorkPlanSource } from './workPlans';

type View = 'tasks' | 'admin' | 'dashboard';
type Status = 'planned' | 'active' | 'done' | 'risk';
type CalendarMode = 'plan' | 'fact';
type AdminTab = 'projects' | 'people';
type ProjectTab = 'tasks' | 'links' | 'plans' | 'audit';
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
];

const initialPeople: Person[] = requiredPeople;

const legacyPersonIdMap: Record<string, string> = {
  'person-vlad': 'person-aleksey',
  'person-maria': 'person-nikolay',
  'person-sergey': 'person-kristina',
};

const taskSeedVersion = 'actual-client-tasks-2026-08-v1';
const legacyDemoTaskIds = new Set(['task-1', 'task-2', 'task-3', 'task-4']);

const requiredTaskSeeds: Task[] = [
  {
    id: 'current-promteh-site-transfer',
    projectId: 'project-promteh',
    title: 'Перенос сайта',
    description: 'Актуальная задача по Промтех / Макулатура.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-smartstroy-sya-projects',
    projectId: 'project-smart',
    title: 'Расширение СЯ по проектам',
    description: 'Актуальная задача по СмартСтрой.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-smartstroy-eeat-pages',
    projectId: 'project-smart',
    title: 'ТЗ на ЕЕАТ страницы',
    description: 'Актуальная задача по СмартСтрой.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-aquaguard-service-content-plan',
    projectId: 'project-aquaguard',
    title: 'Контент план по разделу услуг',
    description: 'Актуальная задача по Аквагард.',
    status: 'active',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-aquaguard-catalog-products',
    projectId: 'project-aquaguard',
    title: 'Правки по каталогу и товарам',
    description: 'Актуальная задача по Аквагард.',
    status: 'active',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-aquaguard-feeds-yandex-support',
    projectId: 'project-aquaguard',
    title: 'Вопрос с фидами пробуем решить через саппорт Яндекса',
    description: 'Актуальная задача по Аквагард.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
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
    description: 'Актуальная задача по Балт-паллет.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'current-balt-images',
    projectId: 'project-balt-pallet',
    title: 'Актуализация изображений',
    description: 'Актуальная задача по Балт-паллет.',
    status: 'active',
    ownerIds: ['person-marketing', 'person-aleksey'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: true,
    timeline: [
      {
        id: 'timeline-balt-images-marketing',
        title: 'Подготовка и подбор изображений',
        ownerId: 'person-marketing',
        status: 'active',
        dueDate: '',
      },
      {
        id: 'timeline-balt-images-aleksey',
        title: 'Внедрение изображений на сайте',
        ownerId: 'person-aleksey',
        status: 'active',
        dueDate: '',
      },
    ],
  },
  {
    id: 'current-balt-content-feeds',
    projectId: 'project-balt-pallet',
    title: 'Контент план по товарам и фиды',
    description: 'Актуальная задача по Балт-паллет.',
    status: 'active',
    ownerIds: ['person-aleksey'],
    createdAt: '2026-08-10',
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
    title: 'ТЗ на теговые ЧПУ страницы, фиды и разметку',
    description: 'Актуальная задача по Часы / WatchStore.',
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
    title: 'Правки по верстке шаблонов основных страниц сайта',
    description: 'Актуальная задача по Ректоп.',
    status: 'active',
    ownerIds: ['person-outsource'],
    createdAt: '2026-08-10',
    deadline: '',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-watchstore-2026-08',
    projectId: 'project-watch',
    title: 'Отчет за август: WatchStore',
    description: 'Отчетная дата на август.',
    status: 'planned',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-22',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-aquaguard-2026-08',
    projectId: 'project-aquaguard',
    title: 'Отчет за август: Аквагард',
    description: 'Отчетная дата на август.',
    status: 'planned',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-16',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-promteh-2026-08',
    projectId: 'project-promteh',
    title: 'Отчет за август: Макулатура',
    description: 'Отчетная дата на август.',
    status: 'planned',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-16',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-smartstroy-2026-08',
    projectId: 'project-smart',
    title: 'Отчет за август: СмартСтрой',
    description: 'Отчетная дата на август.',
    status: 'planned',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-16',
    timelineEnabled: false,
    timeline: [],
  },
  {
    id: 'report-balt-pallet-2026-08',
    projectId: 'project-balt-pallet',
    title: 'Отчет за август: Паллет',
    description: 'Отчетная дата на август.',
    status: 'planned',
    ownerIds: ['person-kristina'],
    createdAt: '2026-08-10',
    deadline: '2026-08-16',
    timelineEnabled: false,
    timeline: [],
  },
];

const initialTasks: Task[] = requiredTaskSeeds;

const navItems = [
  { id: 'tasks' as const, label: 'Список задач', icon: LayoutList },
  { id: 'admin' as const, label: 'Админка', icon: SlidersHorizontal },
  { id: 'dashboard' as const, label: 'Общий дашборд', icon: BarChart3 },
];

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
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('plan');
  const [adminTab, setAdminTab] = useState<AdminTab>('projects');
  const [projectTabs, setProjectTabs] = useState<Record<string, ProjectTab>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['task-1']));
  const [linkRows, setLinkRows] = useState<LinkPurchase[]>([]);
  const [linkLoadStatus, setLinkLoadStatus] = useState<LinkLoadStatus>('idle');
  const [linkError, setLinkError] = useState('');
  const [linkUpdatedAt, setLinkUpdatedAt] = useState('');

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
    setProjects((current) => {
      const names = new Set(current.map((project) => normalizeProjectName(project.name)));
      const missingProjects = REQUIRED_LINK_PROJECTS.filter(
        (project) => !names.has(normalizeProjectName(project.name)),
      );
      return missingProjects.length ? [...current, ...missingProjects] : current;
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
        const taskChanged =
          ownerIds.some((ownerId, index) => ownerId !== task.ownerIds[index]) ||
          new Set(ownerIds).size !== ownerIds.length ||
          timeline.some((item, index) => item.ownerId !== task.timeline[index]?.ownerId);

        if (!taskChanged) return task;
        changed = true;
        return { ...task, ownerIds: Array.from(new Set(ownerIds)), timeline };
      });

      return changed ? next : current;
    });
  }, [setTasks]);

  useEffect(() => {
    if (localStorage.getItem('task-seo-task-seed-version') === taskSeedVersion) return;

    setTasks((current) => {
      const withoutDemo = current.filter((task) => !legacyDemoTaskIds.has(task.id));
      const next = [...withoutDemo];
      const taskIds = new Set(next.map((task) => task.id));

      requiredTaskSeeds.forEach((task) => {
        if (!taskIds.has(task.id)) {
          next.push(task);
          taskIds.add(task.id);
        }
      });

      return next.length !== current.length ? next : current;
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

  useEffect(() => {
    void loadLinkRows();
  }, [loadLinkRows]);

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

  const linkTotalSummary = useMemo(() => summarizeLinkPurchases(linkRows), [linkRows]);

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
                      workPlans={workPlansByProject.get(normalizeProjectName(project.name)) ?? []}
                      auditSources={auditSourcesByProject.get(normalizeProjectName(project.name)) ?? []}
                      linkLoadStatus={linkLoadStatus}
                      linkError={linkError}
                      linkUpdatedAt={linkUpdatedAt}
                      activeTab={projectTabs[project.id] ?? 'tasks'}
                      peopleById={peopleById}
                      expanded={expanded}
                      onTabChange={(tab) => setProjectTabs((current) => ({ ...current, [project.id]: tab }))}
                      onReloadLinks={loadLinkRows}
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
            linkRows={linkRows}
            linkSummaries={linkSummaries}
            linkTotalSummary={linkTotalSummary}
            workPlans={WORK_PLAN_SOURCES}
            auditSources={CLIENT_AUDIT_SOURCES}
            linkLoadStatus={linkLoadStatus}
            linkError={linkError}
            linkUpdatedAt={linkUpdatedAt}
            onReloadLinks={loadLinkRows}
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
      </nav>
    </div>
  );
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
  workPlans: WorkPlanSource[];
  auditSources: ClientAuditSource[];
  linkLoadStatus: LinkLoadStatus;
  linkError: string;
  linkUpdatedAt: string;
  activeTab: ProjectTab;
  peopleById: Map<string, Person>;
  expanded: Set<string>;
  onTabChange: (tab: ProjectTab) => void;
  onReloadLinks: () => void;
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
  workPlans,
  auditSources,
  linkLoadStatus,
  linkError,
  linkUpdatedAt,
  activeTab,
  peopleById,
  expanded,
  onTabChange,
  onReloadLinks,
  onToggleExpanded,
  onToggleTimeline,
  onStatusChange,
  onTimelineStatusChange,
}: ProjectGroupProps) {
  return (
    <article className="project-group" style={{ '--project-color': project.color } as CSSProperties}>
      <div className="project-heading">
        <div>
          <span className="project-dot" />
          <h3>{project.name}</h3>
        </div>
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
            className={activeTab === 'audit' ? 'is-active' : ''}
            type="button"
            onClick={() => onTabChange('audit')}
          >
            Аудит <em>{auditSources.length + 1}</em>
          </button>
        </div>
      </div>

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

      {activeTab === 'audit' && <AuditPanel project={project} sources={auditSources} />}
    </article>
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

function countWorkPlanItems(plan: WorkPlanSource) {
  return plan.sections?.reduce((sum, section) => sum + section.items.length, 0) ?? 0;
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
  linkRows: LinkPurchase[];
  linkSummaries: Map<string, LinkPurchaseSummary>;
  linkTotalSummary: LinkPurchaseSummary;
  workPlans: WorkPlanSource[];
  auditSources: ClientAuditSource[];
  linkLoadStatus: LinkLoadStatus;
  linkError: string;
  linkUpdatedAt: string;
  onReloadLinks: () => void;
};

function DashboardView({
  projects,
  tasks,
  peopleById,
  completion,
  overdueCount,
  collisions,
  linkRows,
  linkSummaries,
  linkTotalSummary,
  workPlans,
  auditSources,
  linkLoadStatus,
  linkError,
  linkUpdatedAt,
  onReloadLinks,
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
          <Metric label="Ссылки" value={String(linkRows.length)} />
          <Metric label="Планы" value={String(workPlans.length)} />
          <Metric label="Аудиты" value={String(auditSources.length)} />
        </div>
      </div>

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

      <LinkReportSummary
        projects={projects}
        summaries={linkSummaries}
        total={linkTotalSummary}
        status={linkLoadStatus}
        error={linkError}
        updatedAt={linkUpdatedAt}
        onReload={onReloadLinks}
      />

      <WorkPlanSummary plans={workPlans} />

      <AuditSummary sources={auditSources} />
    </section>
  );
}

function AuditSummary({ sources }: { sources: ClientAuditSource[] }) {
  return (
    <section className="panel audit-report">
      <div className="section-heading compact-heading">
        <div>
          <h2>Изначальный аудит</h2>
          <p>Аккаунт собирает вводные по клиенту, SEO-специалист закрывает стартовый чек-лист.</p>
        </div>
        <CheckCircle2 size={20} />
      </div>

      <div className="audit-summary-grid">
        <div className="audit-summary-card">
          <span>этап 1</span>
          <strong>Сбор инфо с клиента</strong>
          <p>Кристина · аккаунт менеджер · {sources.length} клиентских вкладок</p>
          <a href={CLIENT_AUDIT_SPREADSHEET_URL} target="_blank" rel="noreferrer">
            Открыть таблицу
          </a>
        </div>
        <div className="audit-summary-card">
          <span>этап 2</span>
          <strong>SEO-чек-лист</strong>
          <p>Николай · SEO-специалист · {SEO_AUDIT_CHECKLIST.totalChecks} проверок</p>
          <a href={SEO_AUDIT_CHECKLIST.url} target="_blank" rel="noreferrer">
            Открыть чек-лист
          </a>
        </div>
      </div>

      <div className="work-plan-list">
        {sources.map((source) => (
          <div className="work-plan-row" key={source.id}>
            <div>
              <strong>{source.projectName}</strong>
              <p>{source.sheetName}</p>
            </div>
            <span>{source.clientName}</span>
            <span>вводные</span>
            <a href={source.url} target="_blank" rel="noreferrer">
              Анкета
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkPlanSummary({ plans }: { plans: WorkPlanSource[] }) {
  return (
    <section className="panel work-plan-report">
      <div className="section-heading compact-heading">
        <div>
          <h2>Планы работ по клиентам</h2>
          <p>Источники SEO-планов и контент-плана, разложенные по проектам.</p>
        </div>
        <FileText size={20} />
      </div>

      <div className="work-plan-list">
        {plans.map((plan) => (
          <div className="work-plan-row" key={plan.id}>
            <div>
              <strong>{plan.projectName}</strong>
              <p>
                {plan.title} · {countWorkPlanItems(plan)} пунктов
              </p>
            </div>
            <span>{plan.clientName}</span>
            <span>{plan.period}</span>
            <a href={plan.url} target="_blank" rel="noreferrer">
              {plan.kind === 'doc' ? 'Документ' : 'Таблица'}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function LinkReportSummary({
  projects,
  summaries,
  total,
  status,
  error,
  updatedAt,
  onReload,
}: {
  projects: Project[];
  summaries: Map<string, LinkPurchaseSummary>;
  total: LinkPurchaseSummary;
  status: LinkLoadStatus;
  error: string;
  updatedAt: string;
  onReload: () => void;
}) {
  const projectsWithLinks = projects
    .map((project) => ({ project, summary: summaries.get(normalizeProjectName(project.name)) }))
    .filter((item) => item.summary && item.summary.count > 0);

  return (
    <section className="panel link-report">
      <div className="section-heading compact-heading">
        <div>
          <h2>Отчет по закупу ссылок</h2>
          <p>
            Склейка клиентов из Google Sheets в проекты
            {updatedAt ? ` · обновлено ${updatedAt}` : ''}
          </p>
        </div>
        <div className="link-actions">
          <a href={LINK_SOURCE_SPREADSHEET_URL} target="_blank" rel="noreferrer">
            <FileSpreadsheet size={15} />
            Источник
          </a>
          <button type="button" onClick={onReload} disabled={status === 'loading'}>
            <RefreshCw size={15} />
            {status === 'loading' ? 'Обновляю' : 'Обновить'}
          </button>
        </div>
      </div>

      {status === 'error' && (
        <div className="sync-state is-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="link-summary-grid report-grid">
        <LinkStat label="всего строк" value={String(total.count)} />
        <LinkStat label="план" value={formatMoney(total.planCost)} />
        <LinkStat label="факт" value={formatMoney(total.factCost)} />
        <LinkStat label="размещено" value={String(total.placed)} tone="success" />
        <LinkStat label="купить" value={String(total.needToBuy)} tone="warning" />
      </div>

      <div className="report-table">
        {projectsWithLinks.map(({ project, summary }) => (
          <div key={project.id} className="report-row">
            <div>
              <span className="mini-dot" style={{ background: project.color }} />
              <strong>{project.name}</strong>
            </div>
            <span>{summary?.count ?? 0} строк</span>
            <span>{formatMoney(summary?.factCost ?? 0)}</span>
            <span>{summary?.placed ?? 0} размещено</span>
          </div>
        ))}
      </div>
    </section>
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
