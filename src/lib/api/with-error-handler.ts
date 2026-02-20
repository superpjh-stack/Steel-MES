import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { fail } from './api-response';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = 'APP_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyHandler = (req: NextRequest, ctx?: any) => Promise<NextResponse>;

/**
 * Wraps any async route handler with unified error handling.
 * Handles: AppError, Prisma errors, JSON parse errors, and unknown errors.
 * Usage:
 *   export const GET = withErrorHandler(withAuth(async (req, ctx, user) => { ... }));
 */
export function withErrorHandler(handler: AnyHandler): AnyHandler {
  return async (req: NextRequest, ctx?: unknown): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      // Application-level errors
      if (err instanceof AppError) {
        return fail(err.statusCode, err.code, err.message);
      }

      // Prisma known errors
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          return fail(404, 'NOT_FOUND', 'Record not found');
        }
        if (err.code === 'P2002') {
          const fields = (err.meta?.target as string[])?.join(', ') ?? 'unknown';
          return fail(409, 'CONFLICT', `Duplicate value for: ${fields}`);
        }
        if (err.code === 'P2003') {
          return fail(400, 'FOREIGN_KEY_ERROR', 'Referenced record does not exist');
        }
        return fail(500, 'DB_ERROR', `Database error: ${err.code}`);
      }

      // Prisma validation errors
      if (err instanceof Prisma.PrismaClientValidationError) {
        return fail(400, 'VALIDATION_ERROR', 'Invalid data provided to database');
      }

      // JSON parse errors (malformed request body)
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return fail(400, 'INVALID_JSON', 'Request body is not valid JSON');
      }

      // Unknown errors — log but don't leak details
      console.error('[API Error]', err);
      return fail(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
    }
  };
}
