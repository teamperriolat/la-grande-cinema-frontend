export const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
    throw new Error(body.message ?? `Erreur ${response.status}`);
  }
  return response.json() as Promise<T>;
}
