const isNumericKey = (key) => /^\d+$/.test(key);

export const parseSpecialFieldsRaw = (raw) => {
  if (!raw) {
    return null;
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to parse special fields JSON", err);
  }
  return null;
};

const normalizeInitialValue = (value, datatypeName) => {
  const type = (datatypeName || "").toLowerCase();
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const trimmed = value.trim().toLowerCase();
      if (!trimmed) return false;
      return trimmed === "true" || trimmed === "1" || trimmed === "yes";
    }
    return Boolean(value);
  }
  if (type === "integer") {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isNaN(num) ? "" : Math.trunc(num);
  }
  if (type === "decimal") {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isNaN(num) ? "" : num;
  }
  return value == null ? "" : String(value);
};

export const normalizeSpecialFieldsForInitial = (
  rawValues,
  assignedFields,
  catalog
) => {
  if (!rawValues || typeof rawValues !== "object") {
    return {};
  }

  const assignedById = {};
  const assignedByName = {};
  assignedFields.forEach((field) => {
    assignedById[String(field.id)] = field;
    assignedByName[field.name] = field;
  });

  const entries = Object.entries(rawValues);
  if (!entries.length) {
    return {};
  }

  const normalized = {};

  entries.forEach(([key, value]) => {
    const field =
      (isNumericKey(key) && assignedById[String(key)]) ||
      assignedByName[key];
    if (!field) {
      return;
    }
    normalized[String(field.id)] = normalizeInitialValue(
      value,
      field.datatypeName
    );
  });

  return normalized;
};

const castValueForSubmit = (value, datatypeName) => {
  const type = (datatypeName || "").toLowerCase();
  if (type === "boolean") {
    return Boolean(value);
  }
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }
  if (type === "integer") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (type === "decimal") {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (type === "string") {
    return String(value);
  }
  return value;
};

export const buildSpecialFieldsPayload = (values, assignedFields) => {
  const payload = {};
  assignedFields.forEach((field) => {
    const value = values?.[field.id];
    payload[field.id] = castValueForSubmit(value, field.datatypeName);
  });
  return payload;
};
