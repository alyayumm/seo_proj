export type ExternalProjectSection = {
  id: string;
  title: string;
  status: 'active' | 'done' | 'waiting' | 'next';
  items: string[];
  note?: string;
  link?: string;
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
  collaborator: 'Антон',
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
    },
    {
      id: 'avito-test',
      title: 'Тест Авито',
      status: 'next',
      items: ['Тест признан дорогим инструментом', 'Есть смысл перезапустить тест на МСК'],
      note: 'Подробные метрики оставлены в Google Docs.',
    },
    {
      id: 'trial-lesson-mailing',
      title: 'Рассылка “пробный урок”',
      status: 'active',
      items: ['Письмо на верстке', 'Рассылка на почту', 'Следующий этап: мессенджеры без упоминания АШ'],
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
      title: 'Сайт Ректоп',
      status: 'waiting',
      items: ['Ожидается обратная связь от Алексея'],
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
