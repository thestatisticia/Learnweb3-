export async function parseApiJson<T extends Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      "Server returned an invalid response. Refresh the page and try again.",
    );
  }
}
