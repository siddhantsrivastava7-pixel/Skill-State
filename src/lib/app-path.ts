export const APP_BASE_PATH = "/skillstate";

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === APP_BASE_PATH || normalized.startsWith(`${APP_BASE_PATH}/`)) {
    return normalized;
  }
  return `${APP_BASE_PATH}${normalized}`;
}

export function absoluteAppUrl(path: string, origin: string): string {
  return new URL(withBasePath(path), origin).toString();
}
