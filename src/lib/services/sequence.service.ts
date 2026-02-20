import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

/**
 * Atomically generates a sequential ID in the format PREFIX-YYYYMMDD-NNN.
 * Uses a Sequences table with an upsert+increment pattern to avoid race conditions.
 *
 * Must be called inside a Prisma $transaction to guarantee atomicity.
 *
 * @example
 *   const woNo = await prisma.$transaction((tx) => nextSequenceId(tx, 'WO'));
 *   // => "WO-20260220-001"
 */
export async function nextSequenceId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  prefix: 'WO' | 'NCR' | 'SHP' | 'SO',
): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');

  // Atomic upsert: insert or increment, resetting counter on new day
  const result = await tx.$queryRaw<[{ current_val: number }]>`
    INSERT INTO sequences (prefix, current_val, last_date)
    VALUES (${prefix}, 1, ${today})
    ON CONFLICT (prefix) DO UPDATE
    SET current_val = CASE
          WHEN sequences.last_date = ${today}
          THEN sequences.current_val + 1
          ELSE 1
        END,
        last_date = ${today}
    RETURNING current_val
  `;

  const seq = result[0].current_val;
  return `${prefix}-${today}-${String(seq).padStart(3, '0')}`;
}

// Convenience wrappers for standalone calls (outside a transaction)
export async function generateWoNo(): Promise<string> {
  return prisma.$transaction((tx) => nextSequenceId(tx, 'WO'));
}

export async function generateNcrNo(): Promise<string> {
  return prisma.$transaction((tx) => nextSequenceId(tx, 'NCR'));
}

export async function generateShipmentNo(): Promise<string> {
  return prisma.$transaction((tx) => nextSequenceId(tx, 'SHP'));
}

export async function generateSoNo(): Promise<string> {
  return prisma.$transaction((tx) => nextSequenceId(tx, 'SO'));
}
