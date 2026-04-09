export class HttpError extends Error {
  public readonly status: number;
  public readonly bodyText: string | undefined;

  constructor(message: string, status: number, bodyText?: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

export async function requestJson<T>(
  url: string,
  init: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const bodyText = await safeReadText(res);
    throw new HttpError(`HTTP ${res.status} for ${url}`, res.status, bodyText);
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function downloadToFile(
  url: string,
  filePath: string,
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    const bodyText = await safeReadText(res);
    throw new HttpError(`HTTP ${res.status} for ${url}`, res.status, bodyText);
  }
  const arrayBuffer = await res.arrayBuffer();
  const { writeFile } = await import("node:fs/promises");
  await writeFile(filePath, Buffer.from(arrayBuffer));
}

async function safeReadText(res: Response): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}
