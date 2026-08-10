export type ClientAuditSource = {
  id: string;
  projectName: string;
  clientName: string;
  sheetName: string;
  gid: number;
  url: string;
  fields: string[];
};

export type SeoAuditChecklist = {
  title: string;
  url: string;
  sheetName: string;
  totalChecks: number;
  sections: string[];
};

export const CLIENT_AUDIT_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1k3w2quiHCc5OcG_T6f-OGRteaT6p4mRV67vrbJSqKqo/edit';

export const SEO_AUDIT_CHECKLIST: SeoAuditChecklist = {
  title: 'SEO чек-лист начало работы',
  url: 'https://docs.google.com/spreadsheets/d/1w4u-d3oU0Ygkx_XHUUD_xeZXAJOVShAC4EhVeWHU49Y/edit?gid=0#gid=0',
  sheetName: 'шаблон',
  totalChecks: 85,
  sections: [
    'Доступы и исходные данные',
    'Robots.txt',
    'Sitemap.xml',
    'Редиректы и зеркала',
    'HTTP-коды и ошибки',
    'Дубли и canonical',
    'Индексация',
    'Технические настройки',
    'Метатеги и заголовки',
    'Контент',
    'Микроразметка',
    'Аналитика',
    'Юзабилити и доверие',
    'Структура и семантика',
    'Внешняя оптимизация',
    'План работ',
    'Приёмка',
  ],
};

const intakeFields = [
  'Сайт',
  'Тематика',
  'Гео продвижения',
  'Модель',
  'ЦА',
  'Конкуренты',
  'Пакет услуг',
  'Тариф',
  'Начало',
  'Отчетный период',
];

function clientAuditUrl(gid: number) {
  return `${CLIENT_AUDIT_SPREADSHEET_URL}?gid=${gid}#gid=${gid}`;
}

export const CLIENT_AUDIT_SOURCES: ClientAuditSource[] = [
  {
    id: 'audit-aquaguard',
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    sheetName: 'Аквагард',
    gid: 1077823443,
    url: clientAuditUrl(1077823443),
    fields: intakeFields,
  },
  {
    id: 'audit-promteh',
    projectName: 'Промтех',
    clientName: 'ПромТехМакулатура',
    sheetName: 'ПромТехМакулатура',
    gid: 154069280,
    url: clientAuditUrl(154069280),
    fields: intakeFields,
  },
  {
    id: 'audit-smartstroy',
    projectName: 'Смартстрой',
    clientName: 'СмартСтрой',
    sheetName: 'СмартСтрой',
    gid: 1160487931,
    url: clientAuditUrl(1160487931),
    fields: intakeFields,
  },
  {
    id: 'audit-switch',
    projectName: 'Свич',
    clientName: 'SwitchENG',
    sheetName: 'SwitchENG',
    gid: 1821749614,
    url: clientAuditUrl(1821749614),
    fields: intakeFields,
  },
  {
    id: 'audit-balt-pallet',
    projectName: 'Балт-паллет',
    clientName: 'Балт Паллет',
    sheetName: 'Балт Паллет',
    gid: 1273867783,
    url: clientAuditUrl(1273867783),
    fields: intakeFields,
  },
  {
    id: 'audit-watchstore',
    projectName: 'Часы',
    clientName: 'Watchstore',
    sheetName: 'Watchstore',
    gid: 1119650439,
    url: clientAuditUrl(1119650439),
    fields: intakeFields,
  },
  {
    id: 'audit-lombard',
    projectName: 'Ломбард',
    clientName: 'Ломбард',
    sheetName: 'Ломбард',
    gid: 493749014,
    url: clientAuditUrl(493749014),
    fields: intakeFields,
  },
];
