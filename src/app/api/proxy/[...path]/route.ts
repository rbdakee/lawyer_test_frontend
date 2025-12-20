import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SECRET_LOCAL_TOKEN = process.env.SECRET_LOCAL_TOKEN || '';

// Проверка переменных окружения в runtime (только для предупреждения)
if (process.env.NODE_ENV === 'production' && !SECRET_LOCAL_TOKEN) {
  console.warn('WARNING: SECRET_LOCAL_TOKEN is not set in production environment');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'PATCH');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Собираем путь из параметров
    const path = params.path.join('/');
    const url = new URL(request.url);
    
    // Создаем URL для бэкенда
    const backendUrl = `${BACKEND_URL}/api/${path}${url.search}`;
    
    // Получаем тело запроса, если есть
    let body: string | undefined;
    const contentType = request.headers.get('content-type');
    if (method !== 'GET' && method !== 'DELETE') {
      body = await request.text();
    }
    
    // Получаем токен авторизации из заголовков клиента
    const authToken = request.headers.get('authorization');
    
    // Формируем заголовки для запроса к бэкенду
    const headers: HeadersInit = {
      'Content-Type': contentType || 'application/json',
      'X-API-Token': SECRET_LOCAL_TOKEN,
    };
    
    if (authToken) {
      headers['Authorization'] = authToken;
    }
    
    // Выполняем запрос к бэкенду
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    });
    
    // Получаем данные ответа
    const data = await response.text();
    
    // Возвращаем ответ с теми же заголовками и статусом
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { detail: 'Ошибка проксирования запроса' },
      { status: 500 }
    );
  }
}

