import * as dotenv from "dotenv";

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  dotenv.config();
  loaded = true;
}

export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getEnvOptional(name: string): string | undefined {
  return process.env[name];
}

export function getEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
