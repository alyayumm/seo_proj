export type WorkPlanSource = {
  id: string;
  projectName: string;
  clientName: string;
  title: string;
  documentTitle: string;
  period: string;
  kind: 'doc' | 'sheet';
  url: string;
  note?: string;
};

export const WORK_PLAN_SOURCES: WorkPlanSource[] = [
  {
    id: 'watchstore-jul-sep',
    projectName: 'Часы',
    clientName: 'WatchStore',
    title: 'WatchStore: план работ',
    documentTitle: 'watchstoree.ru - План работ на Июль-Сентябрь',
    period: 'июль-сентябрь',
    kind: 'doc',
    url: 'https://docs.google.com/document/d/15TzGsyM3UzaOXz1BANG_z_-hTPw0iKK-gSczqk1Qb4o/edit?usp=sharing',
  },
  {
    id: 'aquaguard-jun-aug',
    projectName: 'Аквагард',
    clientName: 'Аквагард',
    title: 'Аквагард: SEO-план',
    documentTitle: 'План SEO продвижения Аквагард 06.26-08.26',
    period: 'июнь-август',
    kind: 'doc',
    url: 'https://docs.google.com/document/d/1w2ZJ1sMgTbDqgNKXYFVT6fy0eTceLoqWfy3gNQFxoDc/edit?tab=t.0',
  },
  {
    id: 'promteh-jun-aug',
    projectName: 'Промтех',
    clientName: 'Макулатура',
    title: 'Макулатура: SEO-план',
    documentTitle: 'План SEO продвижения ПромТех 06.26-08.26',
    period: 'июнь-август',
    kind: 'doc',
    url: 'https://docs.google.com/document/d/16XW-xZ1zQqR0z0jIVsNS44V5ciWAAxXfbzE1LBYQ6ng/edit?tab=t.0',
  },
  {
    id: 'smartstroy-jun-aug',
    projectName: 'Смартстрой',
    clientName: 'СмартСтрой',
    title: 'СмартСтрой: SEO-план',
    documentTitle: 'План SEO продвижения СмартСтрой 06.26-08.26',
    period: 'июнь-август',
    kind: 'doc',
    url: 'https://docs.google.com/document/d/1JI9gYNcjw3iTfYWsLKERT3GmKBP1twZo3wu0v936b9k/edit?usp=sharing',
  },
  {
    id: 'smartstroy-content-plan',
    projectName: 'Смартстрой',
    clientName: 'СмартСтрой',
    title: 'Контент-план на 5 месяцев',
    documentTitle: 'smart-spb.pro - Контент план',
    period: 'до 15.08',
    kind: 'sheet',
    url: 'https://docs.google.com/spreadsheets/d/1hhNc8EN3BlSWTaKQKTiwrpLQVyGoFmYAxeNe47Us40Q/edit?usp=sharing',
    note: 'Вкладка «Статьи»: темы и URL контента.',
  },
  {
    id: 'balt-pallet-jul-sep',
    projectName: 'Балт-паллет',
    clientName: 'Паллет',
    title: 'Паллет: план работ',
    documentTitle: 'План работ balt-pallet.ru',
    period: 'июль-сентябрь',
    kind: 'doc',
    url: 'https://docs.google.com/document/d/19QtJi8HxT2b4bcrEhDHWm2BZ1qdm-DId1W3ZKHFwjrQ/edit?usp=sharing',
  },
];
