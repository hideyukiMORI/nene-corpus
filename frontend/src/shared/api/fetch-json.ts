interface ProblemDetailsError {
  field?: string;
  message?: string;
}

interface ProblemDetailsPayload {
  detail?: string;
  errors?: ProblemDetailsError[];
}

/**
 * Exported for reuse by `transport.ts` (admin nene2-client adapter, issue #339):
 * it reformats `Nene2ClientError`'s Problem Details payload into this exact
 * string shape so existing `catch (e) { setError(e.message) }` call sites keep
 * showing field-level validation detail after the Bearer paths move to
 * `createNene2Transport`.
 */
export function formatHttpError(status: number, url: string, payload: unknown): string {
  if (payload !== null && typeof payload === 'object') {
    const problem = payload as ProblemDetailsPayload;

    if (Array.isArray(problem.errors) && problem.errors.length > 0) {
      const details = problem.errors
        .map((error) => {
          if (error.field && error.message) {
            return `${error.field}: ${error.message}`;
          }

          return error.message ?? error.field ?? null;
        })
        .filter((detail): detail is string => detail !== null && detail !== '')
        .join('; ');

      if (details !== '') {
        return `HTTP ${status} for ${url}: ${details}`;
      }
    }

    if (typeof problem.detail === 'string' && problem.detail !== '') {
      return `HTTP ${status} for ${url}: ${problem.detail}`;
    }
  }

  return `HTTP ${status} for ${url}`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();

  let payload: unknown;

  try {
    payload = text === '' ? null : JSON.parse(text);
  } catch {
    throw new Error(
      response.ok
        ? `Non-JSON response for ${url}: ${text.slice(0, 160)}`
        : `HTTP ${response.status} for ${url}: ${text.slice(0, 160)}`,
    );
  }

  if (!response.ok) {
    throw new Error(formatHttpError(response.status, url, payload));
  }

  return payload as T;
}
