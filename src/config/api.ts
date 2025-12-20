export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const SECRET_LOCAL_TOKEN = process.env.NEXT_PUBLIC_SECRET_LOCAL_TOKEN || '';

// Функция для получения заголовков с токеном
export function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-API-Token': SECRET_LOCAL_TOKEN,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Базовые функции для API запросов
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = getAuthHeaders(token);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка запроса' }));
    throw new Error(error.detail || 'Ошибка запроса');
  }
  
  return response.json();
}
