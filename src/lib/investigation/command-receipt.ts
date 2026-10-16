/** A failed read must never turn an acknowledged write into an ambiguous write. */
export async function commandAndRefresh<T>(
  send: () => Promise<T>,
  refresh: () => Promise<unknown>,
  acknowledge: () => void,
) {
  const result = await send();
  acknowledge();
  try {
    await refresh();
    return { result, refreshFailed: false };
  } catch {
    return { result, refreshFailed: true };
  }
}
