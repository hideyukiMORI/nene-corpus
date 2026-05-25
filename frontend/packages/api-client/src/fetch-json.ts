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
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return payload as T;
}
