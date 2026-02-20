import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
type WoStatus = 'draft' | 'issued' | 'in_progress' | 'completed' | 'cancelled';
import { withAuth, AuthenticatedUser } from '@/lib/api/with-auth';
import { withErrorHandler, AppError } from '@/lib/api/with-error-handler';
import { ok, fail } from '@/lib/api/api-response';

const schema = z.object({
  status: z.enum(['issued', 'in_progress', 'completed', 'cancelled']),
});

// Valid state machine transitions
const VALID_TRANSITIONS: Record<WoStatus, WoStatus[]> = {
  draft:       ['issued', 'cancelled'],
  issued:      ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed:   [],
  cancelled:   [],
};

async function handleStatusChange(
  req: NextRequest,
  ctx: { params: Record<string, string> },
  _user: AuthenticatedUser,
) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid status', parsed.error.flatten());
  }

  const id        = ctx.params.id;
  const newStatus = parsed.data.status as WoStatus;

  const wo = await prisma.workOrder.findUnique({ where: { id } });
  if (!wo) throw new AppError(404, 'Work order not found', 'NOT_FOUND');

  const allowed = VALID_TRANSITIONS[wo.status as WoStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      422,
      `Cannot transition from '${wo.status}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`,
      'INVALID_TRANSITION',
    );
  }

  const updateData: Partial<{ status: WoStatus; actualStart: Date; actualEnd: Date }> = { status: newStatus };
  if (newStatus === 'in_progress') updateData.actualStart = new Date();
  if (newStatus === 'completed')   updateData.actualEnd   = new Date();

  const updated = await prisma.workOrder.update({ where: { id }, data: updateData });
  return ok(updated);
}

export const PATCH = withErrorHandler(
  withAuth(handleStatusChange, ['operator', 'supervisor', 'manager', 'admin']),
);

export const PUT = PATCH;
