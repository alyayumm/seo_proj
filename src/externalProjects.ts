export type ExternalBudgetLine = {
  id: string;
  label: string;
  amountLabel: string;
};

export type ExternalProjectAsset = {
  id: string;
  title: string;
  url: string;
  kind: 'file' | 'photo' | 'link';
};

export type ExternalTimelineItem = {
  id: string;
  title: string;
  status: 'planned' | 'active' | 'done' | 'waiting';
  dateLabel?: string;
  ownerLabel?: string;
  displayStatusLabel?: string;
};

export type ExternalWeeklyUpdate = {
  id: string;
  weekLabel: string;
  dateLabel: string;
  items: ExternalTimelineItem[];
};

export type ExternalProjectSection = {
  id: string;
  title: string;
  status: 'active' | 'done' | 'waiting' | 'next';
  items: string[];
  note?: string;
  link?: string;
  goal?: string;
  budgetLabel?: string;
  people?: string[];
  budgetLines?: ExternalBudgetLine[];
  assets?: ExternalProjectAsset[];
  timeline?: ExternalTimelineItem[];
  weeklyUpdates?: ExternalWeeklyUpdate[];
};

export type ExternalProjectsSource = {
  title: string;
  documentTitle: string;
  tabTitle: string;
  collaborator: string;
  url: string;
  updatedLabel: string;
  sections: ExternalProjectSection[];
};

export const EXTERNAL_PROJECTS_SOURCE: ExternalProjectsSource = {
  title: 'Сторонние проекты',
  documentTitle: '10.08',
  tabTitle: '10.08.26',
  collaborator: 'Отдел маркетинга',
  updatedLabel: 'по документу от 10.08.26',
  url: 'https://docs.google.com/document/d/1hec-2lJGGsjDsmmbXHTk4YbFgwJV82avNA-EIT1ryEo/edit?tab=t.k4dzyo6kfkhb',
  sections: [
    {
      id: 'aso-base-site',
      title: 'Сайт АСО Основа',
      status: 'active',
      link: 'https://alyayumm.github.io/ASOash/',
      items: [
        'Блок кейсов реализован',
        'Добавить информацию о покупке франшизы',
        'Соцсети под сайт',
        'Покупка домена: ожидание обратной связи от Кирилла',
      ],
      timeline: [
        {
          id: 'aso-base-site-cases',
          title: 'Блок кейсов реализован',
          status: 'done',
          dateLabel: 'готово ранее',
        },
        {
          id: 'aso-base-site-franchise',
          title: 'Добавить информацию о покупке франшизы',
          status: 'planned',
        },
        {
          id: 'aso-base-site-socials',
          title: 'Соцсети под сайт',
          status: 'done',
          dateLabel: '17.08.26',
        },
        {
          id: 'aso-base-site-domain',
          title: 'Покупка домена: ожидание обратной связи от Кирилла',
          status: 'waiting',
        },
      ],
      weeklyUpdates: [
        {
          id: 'aso-base-site-week-17-08-26',
          weekLabel: '17.08.26',
          dateLabel: 'прошлая неделя',
          items: [
            {
              id: 'aso-base-site-socials-done-17-08',
              title: 'Соцсети под сайт',
              status: 'done',
              dateLabel: '17.08.26',
            },
          ],
        },
      ],
    },
    {
      id: 'avito-test',
      title: 'Авито: запуск Москва',
      status: 'active',
      items: ['Запустить Авито по Москве', 'Контролировать расход бюджета 40 000 ₽', 'Заложить 15 000 ₽ на исполнителя'],
      note: 'Запускаем Москва. Бюджет кампании 40 000 ₽, исполнитель 15 000 ₽.',
      goal: 'Запустить тест Авито по Москве и оценить стоимость заявок.',
      budgetLabel: '40 000 ₽',
      people: ['Отдел маркетинга'],
      budgetLines: [
        {
          id: 'avito-moscow-budget',
          label: 'Бюджет запуска Москва',
          amountLabel: '40 000 ₽',
        },
        {
          id: 'avito-moscow-executor',
          label: 'Исполнитель',
          amountLabel: '15 000 ₽',
        },
      ],
    },
    {
      id: 'trial-lesson-mailing',
      title: 'Рассылка “пробный урок”',
      status: 'active',
      items: ['Письмо на верстке', 'Рассылка на почту'],
      note: 'Следующий этап: мессенджеры без упоминания АШ снят с плана этой недели.',
      people: ['Отдел маркетинга', 'IT-отдел'],
      timeline: [
        {
          id: 'trial-lesson-mailing-letter-layout',
          title: 'Письмо на верстке',
          status: 'done',
          dateLabel: '17.08.26',
        },
        {
          id: 'trial-lesson-mailing-email-send',
          title: 'Рассылка на почту',
          status: 'waiting',
          dateLabel: 'новый дедлайн 26.08.26',
          ownerLabel: 'IT-отдел',
          displayStatusLabel: 'просрочено',
        },
      ],
      weeklyUpdates: [
        {
          id: 'trial-lesson-mailing-week-17-08-26',
          weekLabel: '17.08.26',
          dateLabel: 'прошлая неделя',
          items: [
            {
              id: 'trial-lesson-mailing-letter-layout-done-17-08',
              title: 'Письмо на верстке',
              status: 'done',
              dateLabel: '17.08.26',
            },
          ],
        },
      ],
    },
    {
      id: 'seo-dashboard',
      title: 'Единый дашборд по SEO-проектам',
      status: 'done',
      link: 'https://alyayumm.github.io/seo_proj/',
      items: ['Дашборд вынесен отдельным рабочим инструментом'],
    },
    {
      id: 'telegram-ai-bot',
      title: 'ИИ-бот в Telegram',
      status: 'active',
      items: [
        'Смена базы под SEO готова',
        'АШ СПБ: тест откручен, база заменена',
        'АШ МСК: запуск',
        'SEO: запуск',
        'Рассылка в MAX: следующий шаг',
      ],
    },
    {
      id: 'autoschools',
      title: 'Автошколы',
      status: 'active',
      items: [
        'Редизайн сайта Автоправо',
        'Создание сайтов по шаблону',
        'Матрица параметров передается IT на реализацию',
      ],
    },
    {
      id: 'english',
      title: 'Английский',
      status: 'waiting',
      items: [
        'Тест сотрудника на продажу пробного урока',
        'Подключение Юклайнс к CRM пока остановлено до возврата преподавателей',
      ],
    },
    {
      id: 'rustore-reviews',
      title: 'Отзывы РуСтор',
      status: 'active',
      items: ['Собрать отзывы с ОП', 'Дождаться доступа к кабинету и ответить на негативные отзывы'],
    },
    {
      id: 'rectop-site',
      title: 'Ректоп',
      status: 'active',
      items: ['Перенести сайт на домен', 'Переверстать первый блок на главной'],
      note: 'Ректоп и сайт Ректоп - один проект.',
      people: ['Аутсорс'],
      timeline: [
        {
          id: 'rectop-site-domain-transfer',
          title: 'Перенести сайт на домен',
          status: 'active',
        },
        {
          id: 'rectop-site-first-block-home',
          title: 'Переверстать первый блок на главной',
          status: 'active',
        },
      ],
    },
    {
      id: 'education-test-site',
      title: 'Сайт для теста образовательных услуг',
      status: 'active',
      items: ['Ориентировочный дедлайн: 20.08'],
    },
    {
      id: 'rectop-team',
      title: 'Ректоп штат',
      status: 'active',
      items: ['Разработчик: закрыть вакансию'],
    },
    {
      id: 'referral',
      title: 'Рефералка',
      status: 'next',
      items: ['Разобраться с механикой', 'Мониторить кабинет на ПС', 'Сайт-визитка с рефералкой'],
    },
  ],
};
