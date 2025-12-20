export interface AdminQuestion {
  id: string;
  question: { kz: string; ru: string };
  options: { kz: string; ru: string }[];
  correct: number;
  explanation: { kz: string; ru: string };
  section: string;
  section_name: { kz: string; ru: string };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

