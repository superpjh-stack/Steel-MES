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
  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const data = await getProductionData();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          controller.close();
        }
      };

      await send();
      const interval = setInterval(send, 10000); // 10초마다 갱신

      // 클린업 (60초 후 종료 — 클라이언트에서 재연결)
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 60000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
