import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUT_PATH = fileURLToPath(new URL('../public/data/bitrix24-snapshot.json', import.meta.url));
const SEO_PROJECT_NAME = process.env.BITRIX24_SEO_PROJECT_NAME || 'SEO';
const TASK_LIMIT = parseLimit('BITRIX24_TASK_LIMIT', 500);
const CRM_LIMIT = parseLimit('BITRIX24_CRM_LIMIT', 500);
const TASK_COMMENT_TASK_LIMIT = parseLimit('BITRIX24_TASK_COMMENT_TASK_LIMIT', 80);
const TASK_COMMENTS_PER_TASK_LIMIT = parseLimit('BITRIX24_COMMENTS_PER_TASK_LIMIT', 5);
const TASK_RESULT_TASK_LIMIT = parseLimit('BITRIX24_TASK_RESULT_TASK_LIMIT', 80);
const TASK_RESULTS_PER_TASK_LIMIT = parseLimit('BITRIX24_TASK_RESULTS_PER_TASK_LIMIT', 5);
const PAGE_LIMIT = 50;
const MAX_PAGES = 200;
const REQUEST_TIMEOUT_MS = 30000;
const RETRYABLE_ERRORS = /QUERY_LIMIT_EXCEEDED|OVERLOAD_LIMIT|OPERATION_TIME_LIMIT|429|502|503|504|timeout/i;

const CRM_ENTITY_TYPES = [
  { key: 'leads', entityType: 'lead', entityTypeId: 1, fallbackTitle: 'Лид' },
  { key: 'deals', entityType: 'deal', entityTypeId: 2, fallbackTitle: 'Сделка' },
  { key: 'contacts', entityType: 'contact', entityTypeId: 3, fallbackTitle: 'Контакт' },
  { key: 'companies', entityType: 'company', entityTypeId: 4, fallbackTitle: 'Компания' },
];

const TASK_SELECT = [
  'ID',
  'TITLE',
  'STATUS',
  'REAL_STATUS',
  'RESPONSIBLE_ID',
  'CREATED_BY',
  'CREATED_BY_ID',
  'CREATED_DATE',
  'DEADLINE',
  'CLOSED_DATE',
  'DESCRIPTION',
  'GROUP_ID',
];

const TASK_STATUS_LABELS = new Map([
  ['1', 'Новая'],
  ['2', 'Ждет выполнения'],
  ['3', 'В работе'],
  ['4', 'Ждет контроля'],
  ['5', 'Готово'],
  ['6', 'Отложена'],
  ['7', 'Отклонена'],
]);

const SENSITIVE_FIELD_PATTERN =
  /(PHONE|EMAIL|IM|WEB|ADDRESS|RQ_|REQUISITE|BANK|PASSPORT|SNILS|INN|KPP|OGRN|BIRTH|телефон|почт|email|e-mail|адрес|паспорт|реквиз|банк|инн|огрн|кпп|снилс|дата рождения)/i;

function parseLimit(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeWebhookBase(rawValue) {
  if (!rawValue) {
    throw new Error('BITRIX24_WEBHOOK_URL не задан.');
  }

  const url = new URL(rawValue);
  if (url.protocol !== 'https:') {
    throw new Error('BITRIX24_WEBHOOK_URL должен начинаться с https.');
  }

  const host = url.hostname.toLowerCase();
  if (!/(^|\.)bitrix24\.(ru|com|by|kz)$/.test(host)) {
    throw new Error('Для Bitrix24 разрешены только официальные портальные домены.');
  }

  const pathname = url.pathname.replace(/\/?$/, '/');
  const apiPathname = pathname.includes('/rest/api/') ? pathname : pathname.replace(/^\/rest\//, '/rest/api/');

  return {
    baseUrl: `${url.origin}${pathname}`,
    apiBaseUrl: `${url.origin}${apiPathname}`,
    portalHost: host,
  };
}

function redactText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email скрыт]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[телефон скрыт]')
    .replace(/[A-Za-z0-9_-]{28,}/g, '[скрыто]')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactText(value, limit = 300) {
  const text = redactText(value);
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}…` : text;
}

function safeErrorLabel(method, error) {
  const message = error instanceof Error ? error.message : String(error);
  return compactText(`${method}: ${message}`, 500);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function callBitrix(baseUrl, method, params = {}, attempt = 1) {
  const url = new URL(`${method}.json`, baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Bitrix24 вернул не JSON, HTTP ${response.status}.`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${payload.error_description || payload.error || text.slice(0, 200)}`);
    }

    if (payload.error) {
      throw new Error(`${payload.error}: ${payload.error_description || 'без описания'}`);
    }

    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (attempt < 3 && RETRYABLE_ERRORS.test(message)) {
      await wait(750 * attempt);
      return callBitrix(baseUrl, method, params, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function pick(source, keys) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') return source[key];
  }
  return '';
}

function idValue(value) {
  return String(value ?? '').trim();
}

function resultArray(result, keys) {
  if (Array.isArray(result)) return result;
  if (!result || typeof result !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(result[key])) return result[key];
  }
  return [];
}

function nextValue(payload) {
  const next = payload.next ?? payload.result?.next;
  if (next === undefined || next === null || next === '') return null;
  const numeric = Number(next);
  return Number.isFinite(numeric) ? numeric : null;
}

async function callPaged(baseUrl, method, params, extractItems, limit) {
  const items = [];
  let start = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const payload = await callBitrix(baseUrl, method, { ...params, start });
    const pageItems = extractItems(payload.result);
    items.push(...pageItems);

    const next = nextValue(payload);
    if (items.length >= limit || next === null || pageItems.length < PAGE_LIMIT) break;
    start = next;
  }

  return items.slice(0, limit);
}

function buildUserName(user) {
  const lastName = compactText(pick(user, ['LAST_NAME', 'lastName']), 80);
  const name = compactText(pick(user, ['NAME', 'name']), 80);
  const secondName = compactText(pick(user, ['SECOND_NAME', 'secondName']), 80);
  const fullName = [lastName, name, secondName].filter(Boolean).join(' ').trim();
  return fullName || `ID ${idValue(pick(user, ['ID', 'id']))}`;
}

function normalizeUser(user) {
  const id = idValue(pick(user, ['ID', 'id']));
  return {
    id,
    name: buildUserName(user),
    workPosition: compactText(pick(user, ['WORK_POSITION', 'workPosition']), 120),
    active: String(pick(user, ['ACTIVE', 'active'])).toUpperCase() !== 'N',
  };
}

async function fetchUsers(baseUrl) {
  const users = await callPaged(
    baseUrl,
    'user.get',
    {
      FILTER: { ACTIVE: true },
      SELECT: ['ID', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'ACTIVE', 'WORK_POSITION'],
    },
    (result) => resultArray(result, ['users']),
    2000,
  );

  return users.map(normalizeUser).filter((user) => user.id);
}

function userName(userMap, id) {
  return userMap.get(String(id))?.name || (id ? `ID ${id}` : 'Не указан');
}

function taskStatusLabel(task) {
  const status = idValue(pick(task, ['STATUS', 'status', 'REAL_STATUS', 'realStatus']));
  return TASK_STATUS_LABELS.get(status) || (status ? `Статус ${status}` : 'Без статуса');
}

function normalizeTask(task, userMap, group) {
  const id = idValue(pick(task, ['ID', 'id']));
  const responsibleId = idValue(pick(task, ['RESPONSIBLE_ID', 'responsibleId']));
  const creatorId = idValue(pick(task, ['CREATED_BY', 'CREATED_BY_ID', 'createdBy', 'createdById']));

  return {
    id,
    title: compactText(pick(task, ['TITLE', 'title']) || `Задача #${id}`, 220),
    status: idValue(pick(task, ['STATUS', 'status', 'REAL_STATUS', 'realStatus'])),
    statusLabel: taskStatusLabel(task),
    responsibleId,
    responsibleName: userName(userMap, responsibleId),
    creatorId,
    creatorName: userName(userMap, creatorId),
    createdDate: idValue(pick(task, ['CREATED_DATE', 'createdDate'])),
    deadline: idValue(pick(task, ['DEADLINE', 'deadline'])),
    closedDate: idValue(pick(task, ['CLOSED_DATE', 'closedDate'])),
    description: compactText(pick(task, ['DESCRIPTION', 'description']), 1600),
    groupId: group.id,
    groupName: group.name,
  };
}

function attachmentCount(value) {
  if (!value || typeof value !== 'object') return 0;
  return Object.keys(value).length;
}

function normalizeTaskComment(comment, task, userMap) {
  const id = idValue(pick(comment, ['ID', 'id']));
  const authorId = idValue(pick(comment, ['AUTHOR_ID', 'authorId']));
  if (!id) return null;

  return {
    id,
    taskId: task.id,
    taskTitle: task.title,
    authorId,
    authorName: compactText(pick(comment, ['AUTHOR_NAME', 'authorName']), 120) || userName(userMap, authorId),
    postDate: idValue(pick(comment, ['POST_DATE', 'postDate'])),
    message: compactText(pick(comment, ['POST_MESSAGE', 'postMessage', 'POST_MESSAGE_HTML', 'postMessageHtml']), 700),
    attachmentsCount: attachmentCount(pick(comment, ['ATTACHED_OBJECTS', 'attachedObjects'])),
  };
}

function normalizeTaskResult(result, task, userMap) {
  const id = idValue(pick(result, ['id', 'ID']));
  const createdById = idValue(pick(result, ['createdBy', 'CREATED_BY']));
  if (!id) return null;

  const filesValue = pick(result, ['files', 'FILES']);
  const filesCount = Array.isArray(filesValue) ? filesValue.length : 0;

  return {
    id,
    taskId: task.id,
    taskTitle: task.title,
    commentId: idValue(pick(result, ['commentId', 'COMMENT_ID'])),
    createdById,
    createdByName: userName(userMap, createdById),
    createdAt: idValue(pick(result, ['createdAt', 'CREATED_AT'])),
    updatedAt: idValue(pick(result, ['updatedAt', 'UPDATED_AT'])),
    status: idValue(pick(result, ['status', 'STATUS'])),
    text: compactText(pick(result, ['text', 'TEXT', 'formattedText', 'FORMATTED_TEXT']), 900),
    filesCount,
  };
}

async function fetchSeoGroup(baseUrl) {
  const configuredId = idValue(process.env.BITRIX24_SEO_GROUP_ID);
  if (configuredId) return { id: configuredId, name: SEO_PROJECT_NAME };

  const exactGroups = await callPaged(
    baseUrl,
    'sonet_group.get',
    {
      ORDER: { ID: 'DESC' },
      FILTER: { NAME: SEO_PROJECT_NAME, ACTIVE: 'Y' },
      SELECT: ['ID', 'NAME'],
    },
    (result) => resultArray(result, ['groups']),
    100,
  );
  const exact = exactGroups.find((group) => compactText(pick(group, ['NAME', 'name'])).toLowerCase() === SEO_PROJECT_NAME.toLowerCase());
  if (exact) {
    return {
      id: idValue(pick(exact, ['ID', 'id'])),
      name: compactText(pick(exact, ['NAME', 'name']) || SEO_PROJECT_NAME, 120),
    };
  }

  const matchingGroups = await callPaged(
    baseUrl,
    'sonet_group.get',
    {
      ORDER: { ID: 'DESC' },
      FILTER: { '%NAME': SEO_PROJECT_NAME, ACTIVE: 'Y' },
      SELECT: ['ID', 'NAME'],
    },
    (result) => resultArray(result, ['groups']),
    100,
  );
  const fallback = matchingGroups[0];
  if (!fallback) return { id: '', name: SEO_PROJECT_NAME };

  return {
    id: idValue(pick(fallback, ['ID', 'id'])),
    name: compactText(pick(fallback, ['NAME', 'name']) || SEO_PROJECT_NAME, 120),
  };
}

async function fetchSeoTasks(baseUrl, group, userMap) {
  if (!group.id) return [];

  const tasks = await callPaged(
    baseUrl,
    'tasks.task.list',
    {
      order: { ID: 'DESC' },
      filter: { GROUP_ID: group.id },
      select: TASK_SELECT,
      params: { WITH_PARSED_DESCRIPTION: 'N' },
    },
    (result) => resultArray(result, ['tasks', 'items']),
    TASK_LIMIT,
  );

  return tasks.map((task) => normalizeTask(task, userMap, group)).filter((task) => task.id);
}

async function fetchTaskComments(baseUrl, tasks, userMap, errors) {
  const comments = [];
  const commentTasks = tasks.slice(0, TASK_COMMENT_TASK_LIMIT);

  for (const task of commentTasks) {
    try {
      const payload = await callBitrix(baseUrl, 'task.commentitem.getlist', {
        TASKID: Number(task.id) || task.id,
        ORDER: { POST_DATE: 'desc' },
      });
      const taskComments = resultArray(payload.result, ['comments', 'items'])
        .map((comment) => normalizeTaskComment(comment, task, userMap))
        .filter(Boolean)
        .slice(0, TASK_COMMENTS_PER_TASK_LIMIT);
      comments.push(...taskComments);
    } catch (error) {
      if (errors.length < 8) {
        errors.push(safeErrorLabel(`task.commentitem.getlist task ${task.id}`, error));
      }
    }
  }

  return comments
    .sort((left, right) => (right.postDate || '').localeCompare(left.postDate || ''))
    .slice(0, TASK_COMMENT_TASK_LIMIT * TASK_COMMENTS_PER_TASK_LIMIT);
}

async function fetchTaskResults(baseUrl, apiBaseUrl, tasks, userMap, errors) {
  const results = [];
  const resultTasks = tasks.slice(0, TASK_RESULT_TASK_LIMIT);

  for (const task of resultTasks) {
    try {
      let payload;
      try {
        payload = await callBitrix(apiBaseUrl, 'tasks.task.result.list', {
          order: { createdAt: 'DESC' },
          filter: [['taskId', Number(task.id) || task.id]],
          pagination: { limit: TASK_RESULTS_PER_TASK_LIMIT, offset: 0 },
        });
      } catch {
        payload = await callBitrix(baseUrl, 'tasks.task.result.list', {
          taskId: Number(task.id) || task.id,
          start: 0,
        });
      }
      const taskResults = resultArray(payload.result, ['results', 'items'])
        .map((result) => normalizeTaskResult(result, task, userMap))
        .filter(Boolean)
        .slice(0, TASK_RESULTS_PER_TASK_LIMIT);
      results.push(...taskResults);
    } catch (error) {
      if (errors.length < 8) {
        errors.push(safeErrorLabel(`tasks.task.result.list task ${task.id}`, error));
      }
    }
  }

  return results
    .sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''))
    .slice(0, TASK_RESULT_TASK_LIMIT * TASK_RESULTS_PER_TASK_LIMIT);
}

function isCustomFieldCode(code) {
  return /^UF_/i.test(code) || /^uf[A-Z]/.test(code);
}

function normalizeCrmFields(entity, rawFields) {
  const fieldsObject = rawFields?.fields && typeof rawFields.fields === 'object' ? rawFields.fields : rawFields;
  if (!fieldsObject || typeof fieldsObject !== 'object') return [];

  return Object.entries(fieldsObject)
    .map(([code, field]) => {
      const source = field && typeof field === 'object' ? field : {};
      const title = compactText(source.title || source.formLabel || source.listLabel || code, 180);
      const isUserField = Boolean(source.isUserField) || isCustomFieldCode(code);
      return {
        entityType: entity.entityType,
        entityTypeId: entity.entityTypeId,
        code,
        title,
        type: compactText(source.type || source.dataType || '', 60),
        isUserField,
      };
    })
    .filter((field) => field.isUserField)
    .sort((left, right) => left.code.localeCompare(right.code, 'ru'));
}

async function fetchCrmFields(baseUrl, entity) {
  const payload = await callBitrix(baseUrl, 'crm.item.fields', {
    entityTypeId: entity.entityTypeId,
    useOriginalUfNames: 'Y',
  });
  return normalizeCrmFields(entity, payload.result);
}

function customValue(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    const items = value.map((item) => customValue(item)).filter((item) => item !== undefined);
    return items.length ? items.slice(0, 20) : undefined;
  }
  if (typeof value === 'object') return undefined;
  return compactText(value, 300);
}

function customFieldsFromItem(item, fieldsByCode) {
  const result = {};

  Object.entries(item).forEach(([code, value]) => {
    if (!isCustomFieldCode(code)) return;
    const field = fieldsByCode.get(code);
    const title = field?.title || code;
    if (SENSITIVE_FIELD_PATTERN.test(code) || SENSITIVE_FIELD_PATTERN.test(title)) return;
    const normalized = customValue(value);
    if (normalized !== undefined) result[code] = normalized;
  });

  return result;
}

function normalizeContactTitle(item, entity, id) {
  if (entity.entityType === 'contact' && process.env.BITRIX24_INCLUDE_CONTACT_NAMES !== 'true') {
    return `Контакт #${id}`;
  }

  const directTitle = pick(item, ['TITLE', 'title']);
  const fullName = [
    pick(item, ['LAST_NAME', 'lastName']),
    pick(item, ['NAME', 'name']),
    pick(item, ['SECOND_NAME', 'secondName']),
  ]
    .map((part) => compactText(part, 80))
    .filter(Boolean)
    .join(' ');

  return compactText(directTitle || fullName || `${entity.fallbackTitle} #${id}`, 220);
}

function normalizeCrmItem(item, entity, fieldsByCode, userMap) {
  const id = idValue(pick(item, ['ID', 'id']));
  const assignedById = idValue(pick(item, ['ASSIGNED_BY_ID', 'assignedById', 'assignedBy']));
  const contactIdsValue = pick(item, ['CONTACT_IDS', 'contactIds', 'CONTACT_ID', 'contactId']);
  const contactIds = Array.isArray(contactIdsValue)
    ? contactIdsValue.map(idValue).filter(Boolean)
    : idValue(contactIdsValue)
      ? [idValue(contactIdsValue)]
      : [];

  return {
    id,
    title: normalizeContactTitle(item, entity, id),
    entityType: entity.entityType,
    assignedById,
    assignedByName: userName(userMap, assignedById),
    stageId: idValue(pick(item, ['STAGE_ID', 'stageId', 'STATUS_ID', 'statusId'])),
    createdTime: idValue(pick(item, ['DATE_CREATE', 'createdTime', 'createdDate'])),
    updatedTime: idValue(pick(item, ['DATE_MODIFY', 'updatedTime', 'updatedDate'])),
    closedTime: idValue(pick(item, ['CLOSED_DATE', 'closedTime', 'closedDate'])),
    companyId: idValue(pick(item, ['COMPANY_ID', 'companyId'])),
    contactIds,
    customFields: customFieldsFromItem(item, fieldsByCode),
  };
}

async function fetchCrmItems(baseUrl, entity, fields, userMap) {
  const fieldsByCode = new Map(fields.map((field) => [field.code, field]));
  const items = await callPaged(
    baseUrl,
    'crm.item.list',
    {
      entityTypeId: entity.entityTypeId,
      order: { id: 'DESC' },
      select: ['*', 'UF_*'],
    },
    (result) => resultArray(result, ['items']),
    CRM_LIMIT,
  );

  return items.map((item) => normalizeCrmItem(item, entity, fieldsByCode, userMap)).filter((item) => item.id);
}

function emptyPayload(portalHost = '', errors = []) {
  return {
    schemaVersion: 1,
    updatedAt: '',
    portalHost,
    seoProjectName: SEO_PROJECT_NAME,
    seoProjectGroupId: '',
    users: [],
    tasks: [],
    comments: [],
    results: [],
    crm: {
      leads: [],
      deals: [],
      contacts: [],
      companies: [],
      fields: [],
    },
    errors,
  };
}

async function writePayload(payload) {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function main() {
  const rawWebhook = process.env.BITRIX24_WEBHOOK_URL;
  if (!rawWebhook) {
    await writePayload(
      emptyPayload('', [
        'BITRIX24_WEBHOOK_URL не задан в GitHub Secrets. Frontend читает только безопасный snapshot; webhook не передается в браузер.',
      ]),
    );
    console.log('BITRIX24_WEBHOOK_URL is not set. Empty snapshot with diagnostic was written.');
    return;
  }

  let baseUrl;
  let apiBaseUrl;
  let portalHost;
  try {
    const normalized = normalizeWebhookBase(rawWebhook);
    baseUrl = normalized.baseUrl;
    apiBaseUrl = normalized.apiBaseUrl;
    portalHost = normalized.portalHost;
  } catch (error) {
    await writePayload(emptyPayload('', [safeErrorLabel('config', error)]));
    return;
  }

  const errors = [];
  let users = [];
  try {
    users = await fetchUsers(baseUrl);
    console.log(`Bitrix24 users: ${users.length}`);
  } catch (error) {
    errors.push(safeErrorLabel('user.get', error));
  }

  const userMap = new Map(users.map((user) => [user.id, user]));
  let seoGroup = { id: '', name: SEO_PROJECT_NAME };
  try {
    seoGroup = await fetchSeoGroup(baseUrl);
    if (!seoGroup.id) errors.push(`sonet_group.get: проект "${SEO_PROJECT_NAME}" не найден.`);
  } catch (error) {
    errors.push(safeErrorLabel('sonet_group.get', error));
  }

  let tasks = [];
  try {
    tasks = await fetchSeoTasks(baseUrl, seoGroup, userMap);
    console.log(`Bitrix24 SEO tasks: ${tasks.length}`);
  } catch (error) {
    errors.push(safeErrorLabel('tasks.task.list', error));
  }

  let comments = [];
  if (tasks.length > 0) {
    comments = await fetchTaskComments(baseUrl, tasks, userMap, errors);
    console.log(`Bitrix24 SEO task comments: ${comments.length}`);
  }

  let results = [];
  if (tasks.length > 0) {
    results = await fetchTaskResults(baseUrl, apiBaseUrl, tasks, userMap, errors);
    console.log(`Bitrix24 SEO task results: ${results.length}`);
  }

  const crm = {
    leads: [],
    deals: [],
    contacts: [],
    companies: [],
    fields: [],
  };

  for (const entity of CRM_ENTITY_TYPES) {
    let fields = [];
    try {
      fields = await fetchCrmFields(baseUrl, entity);
      crm.fields.push(...fields);
    } catch (error) {
      errors.push(safeErrorLabel(`crm.item.fields ${entity.entityType}`, error));
    }

    try {
      crm[entity.key] = await fetchCrmItems(baseUrl, entity, fields, userMap);
      console.log(`Bitrix24 CRM ${entity.key}: ${crm[entity.key].length}`);
    } catch (error) {
      errors.push(safeErrorLabel(`crm.item.list ${entity.entityType}`, error));
    }
  }

  await writePayload({
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    portalHost,
    seoProjectName: SEO_PROJECT_NAME,
    seoProjectGroupId: seoGroup.id,
    users,
    tasks,
    comments,
    results,
    crm,
    errors,
  });
}

main().catch((error) => {
  console.error(safeErrorLabel('bitrix24', error));
  process.exitCode = 1;
});
