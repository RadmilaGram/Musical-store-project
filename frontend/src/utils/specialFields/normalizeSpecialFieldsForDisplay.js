const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const NUMERIC_KEY_REGEX = /^\d+$/;

const parseSpecialFields = (specialFieldsRaw) => {
  if (specialFieldsRaw == null) {
    return null;
  }

  if (typeof specialFieldsRaw === "string") {
    const trimmed = specialFieldsRaw.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed);
      return isPlainObject(parsed) ? parsed : null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to parse special fields string", error);
      }
      return null;
    }
  }

  if (isPlainObject(specialFieldsRaw)) {
    return specialFieldsRaw;
  }

  return null;
};

const buildCatalogMap = (catalog = []) => {
  const map = new Map();
  catalog.forEach((field) => {
    if (field?.id != null) {
      map.set(String(field.id), field);
    }
  });
  return map;
};

export function normalizeSpecialFieldsForDisplay(
  specialFieldsRaw,
  catalog = []
) {
  const parsed = parseSpecialFields(specialFieldsRaw);
  if (!parsed) {
    return [];
  }

  const entries = Object.entries(parsed);
  if (!entries.length) {
    return [];
  }

  const allNumeric = entries.every(([key]) => NUMERIC_KEY_REGEX.test(key));
  if (allNumeric) {
    const catalogMap = buildCatalogMap(catalog);
    return entries.map(([fieldId, value]) => {
      const meta = catalogMap.get(fieldId);
      return {
        id: fieldId,
        name: meta?.name || "—",
        value,
      };
    });
  }

  return entries.map(([name, value]) => ({
    id: name,
    name,
    value,
  }));
}

export default normalizeSpecialFieldsForDisplay;
