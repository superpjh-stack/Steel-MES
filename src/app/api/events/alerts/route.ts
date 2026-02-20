import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const fetchAlerts = async () => {
        const now = new Date();

        const [overdueWos, breakdownEquip, inventoryAlerts, openNcr] = await Promise.all([
          prisma.workOrder.count({
            where: { status: { in: ['issued', 'in_progress'] }, dueDate: { lt: now } },
          }),
          prisma.equipment.findMany({
            where: { status: 'breakdown' },
            select: { code: true, name: true },
          }),
          prisma.inventory.count({
            where: { materialId: { not: null } },
          }),
          prisma.nonconformanceReport.count({
            where: { status: { in: ['open', 'under_review'] } },
          }),
        ]);

        const alerts = [];
        if (overdueWos > 0)       alerts.push({ type: 'overdue_wo',    level: 'error',   message: `납기 초과 작업지시 ${overdueWos}건`, count: overdueWos });
        if (breakdownEquip.length) alerts.push({ type: 'breakdown',     level: 'error',   message: `고장 설비: ${breakdownEquip.map((e) => e.name).join(', ')}`, count: breakdownEquip.length });
        if (openNcr > 0)           alerts.push({ type: 'open_ncr',      level: 'warning', message: `미처리 NCR ${openNcr}건`, count: openNcr });

        return { alerts, timestamp: now.toISOString() };
      };

      // 초기 전송
      send(await fetchAlerts());

      // 30초마다 갱신
      const interval = setInterval(async () => {
        try {
          send(await fetchAlerts());
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
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
