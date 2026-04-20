// Shared runtime config. Each platform injects its API base URL at bootstrap.
// Web: import.meta.env.VITE_API_URL. RN: process.env.EXPO_PUBLIC_API_URL.

let _apiBaseUrl = '';

export function setApiBaseUrl(url: string) {
  _apiBaseUrl = url;
}

export function getApiBaseUrl(): string {
  return _apiBaseUrl;
}
