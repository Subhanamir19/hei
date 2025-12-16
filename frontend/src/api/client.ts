import Constants from 'expo-constants';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://192.168.0.176:8080';

export const apiFetch = async <T>(path: string, options?: RequestInit & { userId?: string }): Promise<T> => {
  const { userId, ...requestInit } = options ?? {};

  const headers = new Headers(requestInit.headers ?? {});
  headers.set('Content-Type', 'application/json');

  if (userId) {
    headers.set('x-user-id', userId);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...requestInit,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return (await res.json()) as T;
};
