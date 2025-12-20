// Используем API route для проксирования запросов к бэкенду
// Это позволяет скрыть SECRET_LOCAL_TOKEN от клиента
const API_PROXY_URL = '/api/proxy';

// Функция для получения заголовков (без SECRET_LOCAL_TOKEN, он добавляется на сервере)
export function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Базовые функции для API запросов
// Теперь запросы идут через Next.js API route, который добавляет SECRET_LOCAL_TOKEN на сервере
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  // Убираем /api из начала endpoint, так как proxy route уже добавляет его
  const cleanEndpoint = endpoint.startsWith('/api/') 
    ? endpoint.slice(5) 
    : endpoint.startsWith('/') 
    ? endpoint.slice(1)
    : endpoint;
  
  const url = `${API_PROXY_URL}/${cleanEndpoint}`;
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
