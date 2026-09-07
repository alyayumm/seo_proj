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
const RECTOP_CORRECTIONS_BRIEF_URL =
  'https://docs.google.com/document/d/1H9039MtjWEtQjWv4R_iosviGo0gTeNlxlQr0cWExSmM/edit?usp=sharing';
const RECTOP_FAQ_URL =
  'https://docs.google.com/document/d/1pytSVh4lxSb5BDV9C9CM9gOgwxdm8Wnb2gR2mgrRpWg/edit?tab=t.0#heading=h.mlgh27lmuw4v';
const AUTOPRAVO_FIGMA_URL =
  'https://www.figma.com/design/BrReyqlaV4p15QX0bekG2X/%D0%90%D0%B2%D1%82%D0%BE%D0%BF%D1%80%D0%B0%D0%B2%D0%BE?node-id=519-8247&t=RXaNEtFVQQizrAjv-1';

export const EXTERNAL_PROJECTS_SOURCE: ExternalProjectsSource = {
  title: 'Сторонние проекты',
  documentTitle: '10.08',
  tabTitle: '10.08.26',
  collaborator: 'Отдел маркетинга',
  updatedLabel: 'по документу от 10.08.26, апдейту 04.09.26 и отчету 07.09.26',
  url: 'https://docs.google.com/document/d/1hec-2lJGGsjDsmmbXHTk4YbFgwJV82avNA-EIT1ryEo/edit?tab=t.k4dzyo6kfkhb',
  sections: ([
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
      title: 'Авито в МСК',
      status: 'active',
      items: [
        'Период теста: 20.08-06.09',
        'Лиды: 121 шт., цена лида 528 ₽',
        'Квалы: 61 шт., цена квала 1 049 ₽',
        'Продажи: 6 шт., цена продажи 10 666 ₽',
        'Выручка: 256 470 ₽',
        'Чистая прибыль: около 13 000 ₽',
        'Потенциальных продаж: 8',
      ],
      note:
        'Отчет 07.09: инструмент вышел в ноль, потенциальные продажи дальше идут в прибыль.',
      goal: 'Закрепить окупаемый канал Авито в Москве и дожать потенциальные продажи.',
      budgetLabel: '64 000 ₽ затрат',
      people: ['Отдел маркетинга', 'Исполнитель'],
      budgetLines: [
        {
          id: 'avito-moscow-budget',
          label: 'Бюджет Avito',
          amountLabel: '44 000 ₽',
        },
        {
          id: 'avito-moscow-executor',
          label: 'Исполнитель',
          amountLabel: '20 000 ₽',
        },
        {
          id: 'avito-moscow-total-costs',
          label: 'Всего затрат',
          amountLabel: '64 000 ₽',
        },
        {
          id: 'avito-moscow-revenue',
          label: 'Выручка',
          amountLabel: '256 470 ₽',
        },
        {
          id: 'avito-moscow-net-profit',
          label: 'Чистая прибыль',
          amountLabel: 'около 13 000 ₽',
        },
      ],
      timeline: [
        {
          id: 'avito-moscow-test-period',
          title: 'Провести запуск Авито в МСК за 20.08-06.09',
          status: 'done',
          dateLabel: '06.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'avito-moscow-leads-results',
          title: 'Получено 121 лид, 61 квал и 6 продаж',
          status: 'done',
          dateLabel: '07.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'avito-moscow-profit-results',
          title: 'Зафиксирована выручка 256 470 ₽ и чистая прибыль около 13 000 ₽',
          status: 'done',
          dateLabel: '07.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'avito-moscow-potential-sales',
          title: 'Дожать 8 потенциальных продаж',
          status: 'active',
          dateLabel: '13.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
      ],
      weeklyUpdates: [
        {
          id: 'avito-moscow-week-31-08-26',
          weekLabel: '31.08.26',
          dateLabel: 'отчет 07.09.26',
          items: [
            {
              id: 'avito-moscow-results-07-09',
              title: 'За 20.08-06.09 получено 121 лид, 61 квал и 6 продаж',
              status: 'done',
              dateLabel: '07.09.26',
              ownerLabel: 'Отдел маркетинга',
            },
            {
              id: 'avito-moscow-money-07-09',
              title: 'Затраты 64 000 ₽, выручка 256 470 ₽, чистая прибыль около 13 000 ₽',
              status: 'done',
              dateLabel: '07.09.26',
              ownerLabel: 'Отдел маркетинга',
            },
            {
              id: 'avito-moscow-break-even-07-09',
              title: 'Инструмент вышел в ноль, дальше потенциальные продажи идут в прибыль',
              status: 'done',
              dateLabel: '07.09.26',
              ownerLabel: 'Отдел маркетинга',
            },
          ],
        },
      ],
    },
    {
      id: 'trial-lesson-mailing',
      title: 'Рассылка “пробный урок”',
      status: 'active',
      items: [
        'Письмо на верстке',
        'Рассылка на почту',
        'Повторная рассылка дала 0 переходов',
        'Договориться о рассылке без упоминания бренда',
        'Выбрать дешевую рассылку или ИИ-рассылку',
      ],
      note:
        'Отчет 07.09: рассылка неуспешна, 0 переходов. Дальше договариваемся о рассылке без упоминания бренда и выбираем дешевую рассылку или ИИ.',
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
          title: 'Выбрать дешевую рассылку или ИИ-рассылку',
          status: 'planned',
          dateLabel: '13.09.26',
          ownerLabel: 'Отдел маркетинга',
          displayStatusLabel: 'новая гипотеза',
        },
        {
          id: 'trial-lesson-mailing-telegram-extra-04-09',
          title: 'Повторная рассылка дала 0 переходов',
          status: 'done',
          dateLabel: '07.09.26',
          ownerLabel: 'Отдел маркетинга',
          displayStatusLabel: 'неуспешно',
        },
        {
          id: 'trial-lesson-mailing-no-brand',
          title: 'Договориться о рассылке без упоминания бренда',
          status: 'active',
          dateLabel: '13.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
      ],
      weeklyUpdates: [
        {
          id: 'trial-lesson-mailing-week-31-08-26',
          weekLabel: '31.08.26',
          dateLabel: 'отчет 07.09.26',
          items: [
            {
              id: 'trial-lesson-mailing-zero-clicks-07-09',
              title: 'Рассылка “пробный урок” неуспешна: 0 переходов',
              status: 'done',
              dateLabel: '07.09.26',
              ownerLabel: 'Отдел маркетинга',
              displayStatusLabel: 'неуспешно',
            },
          ],
        },
        {
          id: 'trial-lesson-mailing-week-04-09-26',
          weekLabel: '04.09.26',
          dateLabel: 'апдейт',
          items: [
            {
              id: 'trial-lesson-mailing-telegram-extra-04-09-update',
              title: 'В понедельник запускается дополнительная рассылка в Telegram',
              status: 'active',
              dateLabel: '07.09.26',
              ownerLabel: 'Отдел маркетинга',
              displayStatusLabel: 'запуск',
            },
            {
              id: 'trial-lesson-mailing-max-wait-answer-04-09-update',
              title: 'Ждем ответ от компании по рассылке в MAX через ИИ',
              status: 'waiting',
              dateLabel: '10.09.26',
              ownerLabel: 'Отдел маркетинга',
              displayStatusLabel: 'ожидание',
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
      id: 'rectop-mailings',
      title: 'Рассылки Ректоп',
      status: 'active',
      items: [
        'Повторный запуск Telegram через ИИ утром 08.09',
        'Есть бюджет на 500 контактов',
        'MAX через ИИ: подрядчик найден, ждем КП',
        'Запуск MAX планируется на этой неделе',
      ],
      note:
        'Отчет 07.09: Telegram-запуск стоит на утро 08.09, по MAX найден подрядчик и ожидается КП.',
      goal: 'Повторно запустить рассылки Ректоп в Telegram и MAX через ИИ.',
      budgetLabel: '500 контактов',
      people: ['Отдел маркетинга', 'Подрядчик ИИ'],
      timeline: [
        {
          id: 'rectop-mailings-telegram-ai-repeat',
          title: 'Запустить Telegram через ИИ повторно',
          status: 'active',
          dateLabel: '08.09.26',
          ownerLabel: 'Отдел маркетинга',
          displayStatusLabel: 'запуск утром',
        },
        {
          id: 'rectop-mailings-max-contractor-found',
          title: 'Подрядчик для MAX через ИИ найден',
          status: 'done',
          dateLabel: '07.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'rectop-mailings-max-commercial-offer',
          title: 'Получить КП по запуску MAX',
          status: 'waiting',
          dateLabel: '10.09.26',
          ownerLabel: 'Подрядчик ИИ',
          displayStatusLabel: 'ждем КП',
        },
        {
          id: 'rectop-mailings-max-launch',
          title: 'Запустить рассылку MAX на этой неделе',
          status: 'planned',
          dateLabel: '13.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
      ],
      weeklyUpdates: [
        {
          id: 'rectop-mailings-week-31-08-26',
          weekLabel: '31.08.26',
          dateLabel: 'отчет 07.09.26',
          items: [
            {
              id: 'rectop-mailings-max-contractor-found-07-09',
              title: 'Для рассылки MAX через ИИ найден подрядчик',
              status: 'done',
              dateLabel: '07.09.26',
              ownerLabel: 'Отдел маркетинга',
            },
            {
              id: 'rectop-mailings-telegram-budget-07-09',
              title: 'Подготовлен повторный запуск Telegram через ИИ, есть бюджет на 500 контактов',
              status: 'done',
              dateLabel: '07.09.26',
              ownerLabel: 'Отдел маркетинга',
            },
          ],
        },
      ],
    },
    {
      id: 'rectop-cases',
      title: 'Кейсы Ректоп',
      status: 'active',
      items: ['Кейсы собраны', 'Кейсы не оформлены', 'Оформить кейсы до отпуска'],
      note: 'Отчет 07.09: кейсы собрали, но пока не оформили. Дедлайн - сдать до отпуска.',
      goal: 'Оформить собранные кейсы Ректоп в готовый материал до отпуска.',
      people: ['Отдел маркетинга', 'Алина'],
      timeline: [
        {
          id: 'rectop-cases-collected',
          title: 'Собрать кейсы Ректоп',
          status: 'done',
          dateLabel: '07.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'rectop-cases-format',
          title: 'Оформить кейсы Ректоп',
          status: 'active',
          dateLabel: 'до отпуска',
          ownerLabel: 'Алина',
        },
      ],
      weeklyUpdates: [
        {
          id: 'rectop-cases-week-31-08-26',
          weekLabel: '31.08.26',
          dateLabel: 'отчет 07.09.26',
          items: [
            {
              id: 'rectop-cases-collected-07-09',
              title: 'Кейсы Ректоп собраны',
              status: 'done',
              dateLabel: '07.09.26',
              ownerLabel: 'Отдел маркетинга',
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
        'MAX: подрядчик найден, ждем КП',
      ],
      note:
        'На 24.08 закрыты смена базы под SEO, АШ СПБ, АШ МСК и SEO-запуск. В текущей работе остался MAX.',
      people: ['Отдел маркетинга', 'Подрядчик ИИ'],
      timeline: [
        {
          id: 'telegram-ai-bot-seo-base-switch',
          title: 'Смена базы под SEO готова',
          status: 'done',
          dateLabel: '24.08.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'telegram-ai-bot-ash-spb-test-base',
          title: 'АШ СПБ: тест откручен, база заменена',
          status: 'done',
          dateLabel: '24.08.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'telegram-ai-bot-ash-msk-launch',
          title: 'АШ МСК: запуск',
          status: 'done',
          dateLabel: '24.08.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'telegram-ai-bot-seo-launch',
          title: 'SEO: запуск',
          status: 'done',
          dateLabel: '24.08.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'telegram-ai-bot-max-contractor',
          title: 'MAX: подрядчик найден, ждем КП',
          status: 'waiting',
          dateLabel: '07.09.26',
          ownerLabel: 'Подрядчик ИИ',
        },
      ],
      weeklyUpdates: [
        {
          id: 'telegram-ai-bot-week-24-08-26',
          weekLabel: '24.08.26',
          dateLabel: 'отчет 31.08.26',
          items: [
            {
              id: 'telegram-ai-bot-seo-base-switch-24-08',
              title: 'Смена базы под SEO готова',
              status: 'done',
              dateLabel: '24.08.26',
              ownerLabel: 'Отдел маркетинга',
            },
            {
              id: 'telegram-ai-bot-ash-spb-test-base-24-08',
              title: 'АШ СПБ: тест откручен, база заменена',
              status: 'done',
              dateLabel: '24.08.26',
              ownerLabel: 'Отдел маркетинга',
            },
            {
              id: 'telegram-ai-bot-ash-msk-launch-24-08',
              title: 'АШ МСК: запуск',
              status: 'done',
              dateLabel: '24.08.26',
              ownerLabel: 'Отдел маркетинга',
            },
            {
              id: 'telegram-ai-bot-seo-launch-24-08',
              title: 'SEO: запуск',
              status: 'done',
              dateLabel: '24.08.26',
              ownerLabel: 'Отдел маркетинга',
            },
          ],
        },
      ],
    },
    {
      id: 'autoschools',
      title: 'Автошколы',
      status: 'active',
      items: [
        'Сайт Автоправо: сдан макет блога',
        'Остались небольшие блоки типа FAQ',
        'Передать макет айтишникам на этой неделе',
        'На всех сайтах убрали интеграцию с amo',
        'В хеддер добавлены кнопки с мессенджерами',
        'Обучить Кирилла пользоваться Codex',
        'Создание сайтов по шаблону',
        'Матрица параметров передается IT на реализацию',
      ],
      note:
        'Отчет 07.09: макет блога Автоправо сдан, работу с IT на ветке настроили. На сайтах убрали интеграцию с amo и добавили кнопки с мессенджерами.',
      goal: 'Передать редизайн Автоправо в IT и ускорить самостоятельные правки по автошколам через ветку.',
      people: ['Отдел маркетинга', 'IT-отдел', 'Кирилл', 'Аутсорс'],
      assets: [
        {
          id: 'autoschools-avtopravo-figma',
          title: 'Редизайн Автоправо',
          url: AUTOPRAVO_FIGMA_URL,
          kind: 'link',
        },
      ],
      timeline: [
        {
          id: 'autoschools-avtopravo-blog-layout',
          title: 'Сдать макет блога для сайта Автоправо',
          status: 'done',
          dateLabel: '07.09.26',
          ownerLabel: 'Аутсорс',
        },
        {
          id: 'autoschools-dev-branch-workflow',
          title: 'Настроить работу с айтишниками для оперативных правок на ветке',
          status: 'done',
          dateLabel: '05.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'autoschools-remove-amo-messengers',
          title: 'Убрать интеграцию с amo и добавить в хеддер кнопки с мессенджерами',
          status: 'done',
          dateLabel: '05.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'autoschools-avtopravo-faq-blocks',
          title: 'Доделать небольшие блоки типа FAQ',
          status: 'active',
          dateLabel: '13.09.26',
          ownerLabel: 'Аутсорс',
        },
        {
          id: 'autoschools-transfer-layout-to-it',
          title: 'Передать макет айтишникам',
          status: 'planned',
          dateLabel: '13.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'autoschools-kirill-codex-training',
          title: 'Обучить Кирилла пользоваться Codex',
          status: 'planned',
          dateLabel: '08.09.26',
          ownerLabel: 'Алина',
        },
      ],
      weeklyUpdates: [
        {
          id: 'autoschools-week-31-08-26',
          weekLabel: '31.08.26',
          dateLabel: 'отчет 07.09.26',
          items: [
            {
              id: 'autoschools-avtopravo-blog-layout-07-09',
              title: 'Сдан макет блога для сайта Автоправо',
              status: 'done',
              dateLabel: '07.09.26',
              ownerLabel: 'Аутсорс',
            },
            {
              id: 'autoschools-dev-branch-workflow-07-09',
              title: 'Настроили работу с IT, чтобы оперативно вносить правки на ветке',
              status: 'done',
              dateLabel: '05.09.26',
              ownerLabel: 'Отдел маркетинга',
            },
            {
              id: 'autoschools-remove-amo-messengers-07-09',
              title: 'На всех сайтах убрали интеграцию с amo и добавили в хеддер кнопки с мессенджерами',
              status: 'done',
              dateLabel: '05.09.26',
              ownerLabel: 'Отдел маркетинга',
            },
          ],
        },
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
          dateLabel: 'отчет 31.08.26',
          items: [
            {
              id: 'rustore-reviews-positive-24-08',
              title: 'Написать положительные отзывы',
              status: 'done',
              dateLabel: '24.08.26',
              ownerLabel: 'Отдел маркетинга',
            },
            {
              id: 'rustore-reviews-negative-replies-24-08',
              title: 'Ответить на негативные отзывы',
              status: 'done',
              dateLabel: '24.08.26',
              ownerLabel: 'Отдел маркетинга',
            },
          ],
        },
      ],
    },
    {
      id: 'rectop-site',
      title: 'Ректоп',
      status: 'active',
      items: [
        'ТЗ по правкам составлено',
        'Сайт перенесен на домен',
        'Внесение правок согласно ТЗ',
        'Переверстать первый блок на главной',
      ],
      note:
        'Отчет 07.09: ТЗ по правкам составлено, сайт перенесен на домен до 06.09. Дальше в работе внесение правок согласно ТЗ.',
      goal: 'Довести сайт Ректоп до готовности: закрыть правки, перенести на домен и обновить первый блок главной.',
      people: ['Аутсорс', 'Разработчик', 'Отдел маркетинга'],
      assets: [
        {
          id: 'rectop-corrections-brief',
          title: 'ТЗ правки',
          url: RECTOP_CORRECTIONS_BRIEF_URL,
          kind: 'file',
        },
        {
          id: 'rectop-faq',
          title: 'FAQ',
          url: RECTOP_FAQ_URL,
          kind: 'file',
        },
      ],
      timeline: [
        {
          id: 'rectop-site-corrections-brief',
          title: 'Составить ТЗ по правкам',
          status: 'done',
          dateLabel: '07.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
        {
          id: 'rectop-site-dev-finish-week',
          title: 'Внесение правок согласно ТЗ',
          status: 'active',
          dateLabel: '13.09.26',
          ownerLabel: 'Разработчик',
        },
        {
          id: 'rectop-site-domain-transfer',
          title: 'Перенести сайт на домен',
          status: 'done',
          dateLabel: '06.09.26',
          ownerLabel: 'Разработчик',
        },
        {
          id: 'rectop-site-first-block-home',
          title: 'Переверстать первый блок на главной',
          status: 'active',
          dateLabel: '13.09.26',
          ownerLabel: 'Разработчик',
        },
      ],
      weeklyUpdates: [
        {
          id: 'rectop-site-week-31-08-26',
          weekLabel: '31.08.26',
          dateLabel: 'отчет 07.09.26',
          items: [
            {
              id: 'rectop-site-corrections-brief-07-09',
              title: 'ТЗ по правкам сайта Ректоп составлено',
              status: 'done',
              dateLabel: '07.09.26',
              ownerLabel: 'Отдел маркетинга',
            },
            {
              id: 'rectop-site-domain-transfer-06-09',
              title: 'Сайт Ректоп перенесен на домен',
              status: 'done',
              dateLabel: '06.09.26',
              ownerLabel: 'Разработчик',
            },
          ],
        },
      ],
    },
    {
      id: 'education-test-site',
      title: 'Сайт для теста образовательных услуг',
      status: 'active',
      items: ['Ориентировочный дедлайн: 20.09'],
      timeline: [
        {
          id: 'education-test-site-deadline',
          title: 'Ориентировочный дедлайн: 20.09',
          status: 'active',
          dateLabel: '20.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
      ],
    },
    {
      id: 'rectop-team',
      title: 'Ректоп штат',
      status: 'active',
      items: ['Разработчик вышел в тест на прошлой неделе'],
      note: 'На неделе 31.08-06.09 разработчик вышел в тест.',
      people: ['Отдел маркетинга', 'Разработчик'],
      timeline: [
        {
          id: 'rectop-team-developer-test-start',
          title: 'Разработчик вышел в тест',
          status: 'done',
          dateLabel: '05.09.26',
          ownerLabel: 'Отдел маркетинга',
        },
      ],
      weeklyUpdates: [
        {
          id: 'rectop-team-week-31-08-26',
          weekLabel: '31.08.26',
          dateLabel: 'отчет 07.09.26',
          items: [
            {
              id: 'rectop-team-developer-test-start-05-09',
              title: 'Разработчик вышел в тест',
              status: 'done',
              dateLabel: '05.09.26',
              ownerLabel: 'Отдел маркетинга',
            },
          ],
        },
      ],
    },
    {
      id: 'referral',
      title: 'Рефералка',
      status: 'active',
      items: [
        'ЛК веб-мастеров в работе у IT',
        'Разобраться с механикой',
        'Мониторить кабинет на ПС',
        'Сайт-визитка с рефералкой',
      ],
      people: ['IT-отдел', 'Отдел маркетинга'],
      timeline: [
        {
          id: 'referral-webmaster-account-it',
          title: 'ЛК веб-мастеров в работе у IT',
          status: 'active',
          dateLabel: '13.09.26',
          ownerLabel: 'IT-отдел',
        },
      ],
    },
  ] satisfies ExternalProjectSection[]).filter((section) => section.id !== 'rectop-site'),
};
