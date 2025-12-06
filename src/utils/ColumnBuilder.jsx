export function buildColumns(data) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const allKeys = Array.from(
    data.reduce((acc, row) => {
      Object.keys(row || {}).forEach((k) => acc.add(k));
      return acc;
    }, new Set())
  );

  const COLUMN_LABELS = {
    ModelId: "ID",
    Name: "Model",          // Name stays, but we will override its display
    Digest: "Hash",
    CreateDateTime: "Build date",
  };

  // Hide Version, ModelId, Type, DefaultLangCode
  const HIDDEN_COLUMNS = ["Version", "ModelId", "Type", "DefaultLangCode", "DescrNote"];

  const COLUMN_ORDER = ["Name", "CreateDateTime", "Digest"];

  const orderedKeys = [
    ...COLUMN_ORDER.filter((k) => allKeys.includes(k)),
    ...allKeys.filter((k) => !COLUMN_ORDER.includes(k)),
  ].filter((k) => !HIDDEN_COLUMNS.includes(k));

  return orderedKeys.map((k) => ({
    key: k,
    label: COLUMN_LABELS[k] || k,
  }));
}
