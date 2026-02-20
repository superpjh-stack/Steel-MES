import { NextResponse } from 'next/server';

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: ApiMeta;
}

export function ok<T>(data: T, meta?: ApiMeta): NextResponse {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body);
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, { status: 201 });
}

export function fail(status: number, code: string, message: string, details?: unknown): NextResponse {
  const body: ApiResponse<never> = { success: false, error: { code, message } };
  if (details !== undefined) body.error!.details = details;
  return NextResponse.json(body, { status });
}

export function parsePagination(url: URL, defaultLimit = 20): { page: number; limit: number; skip: number } {
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? String(defaultLimit), 10)));
  return { page, limit, skip: (page - 1) * limit };
}
