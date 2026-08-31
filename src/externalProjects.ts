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

const SEO_PLANNING_CHECKLIST_URL =
  'https://docs.google.com/document/d/1waAgTlkXKntLTkYruIVXEtprteaJhcq4ZiOe1XPqio8/edit?tab=t.emcoqoq3hai5#heading=h.9ocmnxqz6u8e';

const DENTAL_CLINIC_URL = 'https://pershin-clinic.ru/services';

export const EXTERNAL_PROJECTS_SOURCE: ExternalProjectsSource = {
  title: 'Сторонние проекты',
  documentTitle: '10.08',
  tabTitle: '10.08.26',
  collaborator: 'Отдел маркетинга',
  updatedLabel: 'по документу от 10.08.26',
  url: 'https://docs.google.com/document/d/1hec-2lJGGsjDsmmbXHTk4YbFgwJV82avNA-EIT1ryEo/edit?tab=t.k4dzyo6kfkhb',
  sections: [
    {
      id: 'dental-clinic-seo-launch',
      title: 'Стоматологическая клиника',
      status: 'active',
      link: DENTAL_CLINIC_URL,
      items: [
        'Уточнить, на чем запускать сайт: WordPress или статичная версия',
        'Подготовить первичную SEO-стратегию и семантику',
        'Запустить тестовое SEO и оптимизацию сайта на месяц',
        'После теста подготовить предложение на постоянное обслуживание',
      ],
      note: 'Пункт 1 планерки 25.08: не сделано, заведено как новая задача.',
      goal: 'Запустить тестовое SEO и подготовить предложение на постоянное обслуживание после месяца работ.',
      people: ['Отдел маркетинга', 'SEO'],
      assets: [
        {
          id: 'dental-clinic-checklist',
          title: 'Чек-лист планерки 25.08',
          url: SEO_PLANNING_CHECKLIST_URL,
          kind: 'file',
        },
        {
          id: 'dental-clinic-site',
          title: 'Сайт стоматологической клиники',
          url: DENTAL_CLINIC_URL,
          kind: 'link',
        },
      ],
      timeline: [
        {
          id: 'dental-clinic-site-engine',
          title: 'Уточнить, на чем запускать сайт: WordPress или статичная версия',
          status: 'waiting',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'dental-clinic-strategy-semantics',
          title: 'Подготовить первичную SEO-стратегию и семантику',
          status: 'active',
          ownerLabel: 'SEO',
        },
        {
          id: 'dental-clinic-test-seo',
          title: 'Запустить тестовое SEO и оптимизацию сайта на месяц',
          status: 'planned',
          ownerLabel: 'SEO',
        },
        {
          id: 'dental-clinic-service-offer',
          title: 'Подготовить предложение на постоянное обслуживание после теста',
          status: 'planned',
          ownerLabel: 'SEO',
        },
      ],
    },
    {
      id: 'agency-seo-business-club',
      title: 'Продвижение агентства, кейсы и SEO-бизнес-клуб',
      status: 'active',
      items: [
        'Подготовить полные SEO-кейсы',
        'Подготовить кейсы по разработке сайтов',
        'Обезличить клиентские названия и коммерческие данные',
        'Запустить и продвинуть сайт агентства',
        'Определить требования к компаниям для бесплатного продвижения в бизнес-клубе',
        'Описать механику проекта и план ежемесячных презентаций',
      ],
      note: 'Пункт 2 планерки 25.08: не сделано, заведено как новая задача.',
      goal: 'Подготовить кейсы и механику бесплатного SEO-запуска для бизнес-клуба.',
      people: ['Отдел маркетинга', 'Алина'],
      assets: [
        {
          id: 'agency-seo-business-club-checklist',
          title: 'Чек-лист планерки 25.08',
          url: SEO_PLANNING_CHECKLIST_URL,
          kind: 'file',
        },
      ],
      timeline: [
        {
          id: 'agency-seo-cases',
          title: 'Подготовить полные SEO-кейсы: было, работы, динамика, запросы, трафик, лиды, результат',
          status: 'active',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'agency-dev-cases',
          title: 'Подготовить кейсы по разработке сайтов',
          status: 'active',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'agency-anonymize-cases',
          title: 'Обезличить клиентские названия и коммерческие данные',
          status: 'planned',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'agency-site-launch',
          title: 'Запустить и продвинуть сайт агентства',
          status: 'planned',
          dateLabel: '28.08.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'business-club-requirements',
          title: 'Определить требования к компаниям для бесплатного SEO-продвижения',
          status: 'planned',
          dateLabel: 'октябрь 2026',
          ownerLabel: 'Алина',
        },
        {
          id: 'business-club-mechanics',
          title: 'Описать механику проекта и план ежемесячных презентаций',
          status: 'planned',
          dateLabel: 'октябрь 2026',
          ownerLabel: 'Алина',
        },
      ],
    },
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
      items: ['Письмо на верстке', 'Рассылка на почту', 'Рассылка в MAX: исполнитель найден, запуск 03.09.26'],
      note:
        'Исполнитель для MAX найден, запуск планируется на 03.09.26. Рассылка на почту просрочена у IT-отдела, новый дедлайн 26.08.26. Следующий этап: мессенджеры без упоминания АШ снят с плана этой недели.',
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
        {
          id: 'trial-lesson-mailing-max-launch',
          title: 'Запустить рассылку в MAX',
          status: 'active',
          dateLabel: '03.09.26',
          ownerLabel: 'Отдел маркетинга',
          displayStatusLabel: 'запуск планируется',
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
        {
          id: 'trial-lesson-mailing-week-24-08-26',
          weekLabel: '24.08.26',
          dateLabel: 'прошлая планерка',
          items: [
            {
              id: 'trial-lesson-mailing-max-executor-found-24-08',
              title: 'Исполнитель для запуска рассылок в MAX найден',
              status: 'done',
              dateLabel: '24.08.26',
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
      status: 'done',
      items: ['Отзывы РуСтор по Профскиллс закрыты'],
      note: 'По Профскиллс все сделано.',
      people: ['Отдел маркетинга'],
      timeline: [
        {
          id: 'rustore-reviews-positive',
          title: 'Написать положительные отзывы',
          status: 'done',
          dateLabel: '24.08.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'rustore-reviews-negative-replies',
          title: 'Ответить на негативные отзывы',
          status: 'done',
          dateLabel: '24.08.26',
          ownerLabel: 'Отдел маркетинга',
        },
      ],
      weeklyUpdates: [
        {
          id: 'rustore-reviews-week-24-08-26',
          weekLabel: '24.08.26',
          dateLabel: 'прошлая неделя',
          items: [
            {
              id: 'rustore-reviews-done-24-08',
              title: 'Отзывы РуСтор по Профскиллс закрыты',
              status: 'done',
              dateLabel: '24.08.26',
            },
          ],
        },
      ],
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
