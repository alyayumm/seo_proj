const MAX_QUERY_ROWS = 20000;
const ALLOWED_PROJECTS = new Set([
  'АШ',
  'Ломбард',
  'Часы',
  'Смартстрой',
  'Ректоп',
  'Аквагард',
  'Промтех',
  'Профскиллс',
  'Балт-паллет',
  'Свич',
]);

function doGet() {
  return htmlResponse('Экспорт запросов Метрики', 'Откройте выгрузку из панели task-SEO.');
}

function doPost(event) {
  try {
    const payload = parsePayload(event);
    const spreadsheetUrl = createMetrikaExportSheet(payload);
    return htmlResponse(
      'Выгрузка готова',
      'Google-таблица с поисковыми запросами создана.',
      spreadsheetUrl,
    );
  } catch (error) {
    return htmlResponse('Выгрузка не создана', error instanceof Error ? error.message : String(error));
  }
}

function parsePayload(event) {
  const rawPayload = event?.parameter?.payload || event?.postData?.contents || '';
  if (!rawPayload || rawPayload.length > 5000000) {
    throw new Error('Нет данных для выгрузки или payload слишком большой.');
  }

  const payload = JSON.parse(rawPayload);
  const projectName = sanitizePlainText(payload.projectName);
  if (!ALLOWED_PROJECTS.has(projectName)) {
    throw new Error('Проект не входит в список разрешенных SEO-проектов.');
  }

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) throw new Error('В выгрузке нет поисковых запросов.');
  if (rows.length > MAX_QUERY_ROWS) throw new Error(`Слишком много строк: максимум ${MAX_QUERY_ROWS}.`);

  return {
    projectName,
    sourceTitle: sanitizePlainText(payload.sourceTitle || 'Яндекс Метрика'),
    periodLabel: sanitizePlainText(payload.periodLabel || ''),
    generatedAt: sanitizePlainText(payload.generatedAt || ''),
    rows: rows.map((row) => ({
      query: sanitizeCellText(row.query),
      visits: normalizeNumber(row.visits),
      goals: normalizeNumber(row.goals),
      cr: normalizeNumber(row.cr),
    })),
  };
}

function createMetrikaExportSheet(payload) {
  const timestamp = Utilities.formatDate(new Date(), 'Europe/Moscow', 'dd.MM.yyyy HH:mm');
  const spreadsheet = SpreadsheetApp.create(`Выгрузка запросов Метрики - ${payload.projectName} - ${timestamp}`);
  const sheet = spreadsheet.getSheets()[0];
  sheet.setName('Запросы Метрики');

  const values = [
    ['Проект', payload.projectName],
    ['Источник', payload.sourceTitle],
    ['Период', payload.periodLabel],
    ['Создано', payload.generatedAt || timestamp],
    [],
    ['Запрос', 'Переходы', 'Достижения целей', 'CR'],
    ...payload.rows.map((row) => [row.query, row.visits, row.goals, row.cr]),
  ];

  const range = sheet.getRange(1, 1, values.length, 4);
  range.setValues(values);
  sheet.getRange(1, 1, 4, 1).setFontWeight('bold');
  sheet.getRange(6, 1, 1, 4).setFontWeight('bold').setBackground('#d8eef3');
  sheet.getRange(7, 4, Math.max(payload.rows.length, 1), 1).setNumberFormat('0.00%');
  sheet.setFrozenRows(6);
  sheet.autoResizeColumns(1, 4);

  return spreadsheet.getUrl();
}

function sanitizePlainText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function sanitizeCellText(value) {
  const text = sanitizePlainText(value).slice(0, 500);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function normalizeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function htmlResponse(title, message, url) {
  const escapedTitle = escapeHtml(title);
  const escapedMessage = escapeHtml(message);
  const escapedUrl = url ? escapeHtml(url) : '';
  const html = `
    <!doctype html>
    <html lang="ru">
      <head>
        <base target="_top">
        <meta charset="utf-8">
        ${escapedUrl ? `<meta http-equiv="refresh" content="1; url=${escapedUrl}">` : ''}
        <title>${escapedTitle}</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #061112;
            color: #f5fbfc;
            font: 16px/1.5 Arial, sans-serif;
          }
          main {
            width: min(520px, calc(100vw - 40px));
            padding: 28px;
            border: 1px solid rgba(216,238,243,.22);
            border-radius: 18px;
            background: linear-gradient(145deg, rgba(7,63,72,.9), rgba(6,17,17,.88));
          }
          h1 { margin: 0 0 8px; font-size: 24px; }
          p { margin: 0 0 18px; color: #d8eef3; }
          a {
            display: inline-flex;
            padding: 12px 16px;
            border-radius: 12px;
            color: #061112;
            background: #9bf5ff;
            font-weight: 700;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${escapedTitle}</h1>
          <p>${escapedMessage}</p>
          ${escapedUrl ? `<a href="${escapedUrl}">Открыть Google-таблицу</a>` : ''}
        </main>
      </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html).setTitle(title);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
