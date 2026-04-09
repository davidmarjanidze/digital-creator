import {
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function listFiles(dirPath: string): Promise<string[]> {
  const names = await readdir(dirPath);
  const files: string[] = [];
  for (const name of names) {
    const full = path.join(dirPath, name);
    const s = await stat(full);
    if (s.isFile()) files.push(full);
  }
  files.sort();
  return files;
}

export async function moveFile(
  fromPath: string,
  toDir: string,
): Promise<string> {
  await ensureDir(toDir);
  const destPath = path.join(toDir, path.basename(fromPath));
  await rename(fromPath, destPath);
  return destPath;
}

export async function moveSidecarJson(
  fromFilePath: string,
  toFilePath: string,
): Promise<void> {
  const fromJson = `${fromFilePath}.json`;
  const toJson = `${toFilePath}.json`;
  try {
    await rename(fromJson, toJson);
  } catch {
    // ignore missing sidecar
  }
}

export function timestampedName(
  prefix: string,
  index: number,
  ext: string,
): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const idx = String(index).padStart(2, "0");
  return `${prefix}-${ts}-${idx}.${ext}`;
}

export async function writeSidecarJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  const jsonPath = `${filePath}.json`;
  await writeFile(jsonPath, JSON.stringify(data, null, 2));
}

export async function readSidecarJson<T>(
  filePath: string,
): Promise<T | undefined> {
  const jsonPath = `${filePath}.json`;
  try {
    const raw = await readFile(jsonPath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function fileToDataUri(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}
