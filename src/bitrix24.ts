export type Bitrix24User = {
  id: string;
  name: string;
  workPosition: string;
  active: boolean;
};

export type Bitrix24Task = {
  id: string;
  title: string;
  status: string;
  statusLabel: string;
  responsibleId: string;
  responsibleName: string;
  creatorId: string;
  creatorName: string;
  createdDate: string;
  deadline: string;
  closedDate: string;
  description: string;
  groupId: string;
  groupName: string;
};

export type Bitrix24CrmEntityType = 'lead' | 'deal' | 'contact' | 'company';

export type Bitrix24CrmItem = {
  id: string;
  title: string;
  entityType: Bitrix24CrmEntityType;
  assignedById: string;
  assignedByName: string;
  stageId: string;
  createdTime: string;
  updatedTime: string;
  closedTime: string;
  companyId: string;
  contactIds: string[];
  customFields: Record<string, unknown>;
};

export type Bitrix24CrmField = {
  entityType: Bitrix24CrmEntityType;
  entityTypeId: number;
  code: string;
  title: string;
  type: string;
  isUserField: boolean;
};

export type Bitrix24Snapshot = {
  schemaVersion: number;
  updatedAt: string;
  portalHost: string;
  seoProjectName: string;
  seoProjectGroupId: string;
  users: Bitrix24User[];
  tasks: Bitrix24Task[];
  crm: {
    leads: Bitrix24CrmItem[];
    deals: Bitrix24CrmItem[];
    contacts: Bitrix24CrmItem[];
    companies: Bitrix24CrmItem[];
    fields: Bitrix24CrmField[];
  };
  errors: string[];
};

export const EMPTY_BITRIX24_SNAPSHOT: Bitrix24Snapshot = {
  schemaVersion: 1,
  updatedAt: '',
  portalHost: '',
  seoProjectName: 'SEO',
  seoProjectGroupId: '',
  users: [],
  tasks: [],
  crm: {
    leads: [],
    deals: [],
    contacts: [],
    companies: [],
    fields: [],
  },
  errors: [],
};

function toStringValue(value: unknown) {
  return value === undefined || value === null ? '' : String(value);
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  const normalized = toStringValue(value).toLowerCase();
  return normalized === 'true' || normalized === 'y' || normalized === '1';
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toStringValue(item)).filter(Boolean);
}

function normalizeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeUser(value: unknown): Bitrix24User | null {
  const source = normalizeRecord(value);
  const id = toStringValue(source.id);
  if (!id) return null;

  return {
    id,
    name: toStringValue(source.name) || `ID ${id}`,
    workPosition: toStringValue(source.workPosition),
    active: toBoolean(source.active),
  };
}

function normalizeTask(value: unknown): Bitrix24Task | null {
  const source = normalizeRecord(value);
  const id = toStringValue(source.id);
  if (!id) return null;

  return {
    id,
    title: toStringValue(source.title) || `Задача #${id}`,
    status: toStringValue(source.status),
    statusLabel: toStringValue(source.statusLabel) || 'Без статуса',
    responsibleId: toStringValue(source.responsibleId),
    responsibleName: toStringValue(source.responsibleName) || 'Без ответственного',
    creatorId: toStringValue(source.creatorId),
    creatorName: toStringValue(source.creatorName) || 'Без постановщика',
    createdDate: toStringValue(source.createdDate),
    deadline: toStringValue(source.deadline),
    closedDate: toStringValue(source.closedDate),
    description: toStringValue(source.description),
    groupId: toStringValue(source.groupId),
    groupName: toStringValue(source.groupName) || 'SEO',
  };
}

function normalizeCrmItem(value: unknown): Bitrix24CrmItem | null {
  const source = normalizeRecord(value);
  const id = toStringValue(source.id);
  if (!id) return null;

  return {
    id,
    title: toStringValue(source.title) || `CRM #${id}`,
    entityType: (toStringValue(source.entityType) || 'deal') as Bitrix24CrmEntityType,
    assignedById: toStringValue(source.assignedById),
    assignedByName: toStringValue(source.assignedByName) || 'Без ответственного',
    stageId: toStringValue(source.stageId),
    createdTime: toStringValue(source.createdTime),
    updatedTime: toStringValue(source.updatedTime),
    closedTime: toStringValue(source.closedTime),
    companyId: toStringValue(source.companyId),
    contactIds: toStringArray(source.contactIds),
    customFields: normalizeRecord(source.customFields),
  };
}

function normalizeCrmField(value: unknown): Bitrix24CrmField | null {
  const source = normalizeRecord(value);
  const code = toStringValue(source.code);
  if (!code) return null;

  return {
    entityType: (toStringValue(source.entityType) || 'deal') as Bitrix24CrmEntityType,
    entityTypeId: Number(source.entityTypeId) || 0,
    code,
    title: toStringValue(source.title) || code,
    type: toStringValue(source.type),
    isUserField: toBoolean(source.isUserField),
  };
}

export function normalizeBitrix24Snapshot(value: unknown): Bitrix24Snapshot {
  if (!value || typeof value !== 'object') return EMPTY_BITRIX24_SNAPSHOT;
  const source = value as Partial<Bitrix24Snapshot>;
  const crm = source.crm ?? EMPTY_BITRIX24_SNAPSHOT.crm;

  return {
    schemaVersion: Number(source.schemaVersion) || 1,
    updatedAt: toStringValue(source.updatedAt),
    portalHost: toStringValue(source.portalHost),
    seoProjectName: toStringValue(source.seoProjectName) || 'SEO',
    seoProjectGroupId: toStringValue(source.seoProjectGroupId),
    users: Array.isArray(source.users)
      ? source.users.map((user) => normalizeUser(user)).filter((user): user is Bitrix24User => Boolean(user))
      : [],
    tasks: Array.isArray(source.tasks)
      ? source.tasks.map((task) => normalizeTask(task)).filter((task): task is Bitrix24Task => Boolean(task))
      : [],
    crm: {
      leads: Array.isArray(crm.leads)
        ? crm.leads.map((item) => normalizeCrmItem(item)).filter((item): item is Bitrix24CrmItem => Boolean(item))
        : [],
      deals: Array.isArray(crm.deals)
        ? crm.deals.map((item) => normalizeCrmItem(item)).filter((item): item is Bitrix24CrmItem => Boolean(item))
        : [],
      contacts: Array.isArray(crm.contacts)
        ? crm.contacts.map((item) => normalizeCrmItem(item)).filter((item): item is Bitrix24CrmItem => Boolean(item))
        : [],
      companies: Array.isArray(crm.companies)
        ? crm.companies.map((item) => normalizeCrmItem(item)).filter((item): item is Bitrix24CrmItem => Boolean(item))
        : [],
      fields: Array.isArray(crm.fields)
        ? crm.fields.map((field) => normalizeCrmField(field)).filter((field): field is Bitrix24CrmField => Boolean(field))
        : [],
    },
    errors: Array.isArray(source.errors) ? source.errors.map(String).filter(Boolean) : [],
  };
}
