export type ClientReportLink = {
  id: string;
  label: string;
  reportDate: string;
  title: string;
  url: string;
};

export type ClientQuickLinks = {
  projectName: string;
  clientName: string;
  siteUrl: string;
  reports: ClientReportLink[];
};

export const CLIENT_QUICK_LINKS: ClientQuickLinks[] = [
  {
    projectName: 'Часы',
    clientName: 'WatchStore',
    siteUrl: 'https://watchstoree.ru',
    reports: [],
  },
  {
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    siteUrl: 'https://аквагард.рф',
    reports: [
      {
        id: 'aquaguard-report-2026-07-17',
        label: 'Отчет',
        reportDate: '17 июля',
        title: 'Отчет Аквагард за 16.06.26 - 16.07.26',
        url: 'https://docs.google.com/document/d/1OvQ1X-3cAJzTMyQF6b4ym78Yo0pIBnw1lcVZlFI3RvM/edit?usp=sharing',
      },
    ],
  },
  {
    projectName: 'Промтех',
    clientName: 'Макулатура',
    siteUrl: 'https://promtehmakulatura.ru',
    reports: [
      {
        id: 'promteh-report-2026-07-17',
        label: 'Отчет',
        reportDate: '17 июля',
        title: 'Отчет ПромТехМакулатура за 16.06.26 - 16.07.26',
        url: 'https://docs.google.com/document/d/1eBrZbaXgd_PSpta9fIzVoHpHPxk7uHMCeGnRZ7pUDfI/edit?usp=sharing',
      },
    ],
  },
  {
    projectName: 'Смартстрой',
    clientName: 'СмартСтрой',
    siteUrl: 'https://smart-spb.pro',
    reports: [
      {
        id: 'smartstroy-report-2026-07-17',
        label: 'Отчет',
        reportDate: '17 июля',
        title: 'Отчет smart-spb.pro за 16.06.26 - 16.07.26',
        url: 'https://docs.google.com/document/d/1-a8shtEMMJZiMbUByAxXogU5T0YqYBPIFS-u2Eng8_4/edit?usp=sharing',
      },
    ],
  },
  {
    projectName: 'Балт-паллет',
    clientName: 'Паллет',
    siteUrl: 'https://balt-pallet.ru',
    reports: [],
  },
  {
    projectName: 'Ломбард',
    clientName: 'ЛомбардБанка',
    siteUrl: 'https://lombard-banka.ru',
    reports: [],
  },
];
