const key = "gridmind.authorized-factory-selection.v1";
/** Only an identifier pair, never records/roles. Revalidate against freshly authorized IDs every load. */
export function selectedFactory(
  userId: string,
  allowed: string[],
  storage: Pick<Storage, "getItem" | "removeItem">,
): string | null {
  try {
    const value = JSON.parse(storage.getItem(key) ?? "null");
    if (
      value &&
      value.userId === userId &&
      typeof value.factoryId === "string" &&
      allowed.includes(value.factoryId)
    )
      return value.factoryId;
    storage.removeItem(key);
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      /* Storage may be unavailable. */
    }
  }
  return null;
}
export function rememberFactory(
  userId: string,
  factoryId: string,
  storage: Pick<Storage, "setItem">,
) {
  try {
    storage.setItem(key, JSON.stringify({ userId, factoryId }));
  } catch {
    /* Selection works in-memory when storage is unavailable. */
  }
}
