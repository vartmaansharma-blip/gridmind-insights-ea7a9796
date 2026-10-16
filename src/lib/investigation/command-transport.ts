/** Retry only commands whose server contract provides receipts/CAS, or reads. */
export interface CommandSession {
  userId: string;
  token: string;
}
export interface TransportOptions {
  session: () => Promise<CommandSession>;
  retrySafe: boolean;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  random?: () => number;
  now?: () => number;
}
export class CommandRequestError extends Error {
  constructor(
    public readonly code: string,
    public readonly status?: number,
  ) {
    super(code);
    this.name = "CommandRequestError";
  }
}
const unavailable = new Set([
  "CONNECTED_CASES_DISABLED",
  "CONNECTED_CASES_NOT_CONFIGURED",
  "INTAKE_NOT_CONFIGURED",
]);
const transient = new Set([429, 502, 503, 504]);
function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(new CommandRequestError("REQUEST_CANCELLED"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    if (signal?.aborted) cancel();
    else signal?.addEventListener("abort", cancel, { once: true });
  });
}
function retryAfter(response: Response, now: number): number | null {
  const raw = response.headers.get("Retry-After");
  if (!raw) return null;
  const seconds = Number(raw);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(raw) - now;
  return Number.isFinite(delay) ? Math.max(0, delay) : null;
}

export async function sendCommand(
  endpoint: "/api/portal" | "/api/investigations",
  command: unknown,
  options: TransportOptions,
): Promise<unknown> {
  // Freeze request bytes once, including the receipt key. Never persist tokens/payloads.
  const body = JSON.stringify(command);
  const fetcher = options.fetcher ?? fetch;
  const sleep = options.sleep ?? pause;
  let actor: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (options.signal?.aborted) throw new CommandRequestError("REQUEST_CANCELLED");
    const session = await options.session();
    if (!session.userId || !session.token)
      throw new CommandRequestError("AUTHENTICATION_REQUIRED", 401);
    if (actor && actor !== session.userId) throw new CommandRequestError("ACCOUNT_CHANGED", 401);
    actor = session.userId;
    if (options.signal?.aborted) throw new CommandRequestError("REQUEST_CANCELLED");
    const controller = new AbortController();
    const cancel = () => controller.abort();
    options.signal?.addEventListener("abort", cancel, { once: true });
    if (options.signal?.aborted) controller.abort();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
    let retryDelay = 250 * 2 ** attempt + (options.random ?? Math.random)() * 250;
    try {
      const response = await fetcher(endpoint, {
        method: "POST",
        credentials: "omit",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
        body,
      });
      // Gateways may return HTML. Never show that response or SQL details to the user.
      const raw = await response.text();
      let result: unknown;
      try {
        result = JSON.parse(raw);
      } catch {
        if (!transient.has(response.status))
          throw new CommandRequestError("INVALID_API_RESPONSE", response.status);
      }
      if (response.ok) {
        if (!result || typeof result !== "object" || Array.isArray(result))
          throw new CommandRequestError("INVALID_API_RESPONSE", response.status);
        return result;
      }
      const code =
        result &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string" &&
        /^[A-Z_]{1,80}$/.test(result.error)
          ? result.error
          : "WORKSPACE_REQUEST_FAILED";
      if (
        !options.retrySafe ||
        attempt === 2 ||
        !transient.has(response.status) ||
        unavailable.has(code)
      )
        throw new CommandRequestError(code, response.status);
      const requested = retryAfter(response, (options.now ?? Date.now)());
      // Respect a longer server delay by stopping, not retrying earlier than requested.
      if (requested !== null && requested > 5000)
        throw new CommandRequestError("RETRY_LATER", response.status);
      retryDelay = Math.max(retryDelay, requested ?? 0);
    } catch (error) {
      if (options.signal?.aborted) throw new CommandRequestError("REQUEST_CANCELLED");
      if (error instanceof CommandRequestError) throw error;
      const networkError =
        error instanceof TypeError ||
        controller.signal.aborted ||
        (error instanceof Error && error.name === "AbortError");
      if (!networkError || !options.retrySafe || attempt === 2)
        throw new CommandRequestError("CONNECTION_INTERRUPTED");
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", cancel);
    }
    await sleep(retryDelay, options.signal);
  }
  throw new CommandRequestError("CONNECTION_INTERRUPTED");
}
