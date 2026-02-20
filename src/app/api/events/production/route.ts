import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

async function getProductionData() {
  const today = new Date();
  const [logs, orders] = await Promise.all([
    prisma.productionLog.aggregate({
      where: { createdAt: { gte: startOfDay(today), lte: endOfDay(today) } },
      _sum: { goodQty: true, defectQty: true, plannedQty: true },
    }),
    prisma.workOrder.findMany({
      where: { status: 'in_progress' },
      include: { product: { select: { name: true } } },
      orderBy: { priority: 'asc' },
      take: 10,
    }),
  ]);

  return { logs: logs._sum, orders, timestamp: new Date().toISOString() };
}

export async function GET() {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const encoder = new TextEncoder();
  let closed = false;
  let interval: ReturnType<typeof setInterval> | null = null;
  let timeout:  ReturnType<typeof setTimeout>  | null = null;

  const cleanup = () => {
    if (interval) { clearInterval(interval); interval = null; }
    if (timeout)  { clearTimeout(timeout);   timeout  = null; }
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        if (closed) return;
        try {
          const data = await getProductionData();
          if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          if (!closed) {
            closed = true;
            cleanup();
            controller.close();
          }
        }
      };

      await send();
      interval = setInterval(send, 10_000);

      // 60초 후 종료 — 클라이언트에서 재연결
      timeout = setTimeout(() => {
        if (!closed) {
          closed = true;
          cleanup();
          controller.close();
        }
      }, 60_000);
    },
    cancel() {
      closed = true;
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
