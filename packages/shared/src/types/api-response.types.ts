export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function successResponse<T>(data: T, message?: string, meta?: PaginationMeta): ApiResponse<T> {
  return { success: true, data, message, meta };
}

export function errorResponse(message: string, errors?: string[]): ApiResponse<never> {
  return { success: false, message, errors };
}
