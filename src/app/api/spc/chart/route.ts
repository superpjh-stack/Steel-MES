import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workOrderId    = searchParams.get('workOrderId') ?? '';
  const characteristic = searchParams.get('characteristic') ?? '';

  if (!workOrderId || !characteristic) {
    return NextResponse.json({ error: 'workOrderId and characteristic required' }, { status: 400 });
  }

  const measurements = await prisma.spcMeasurement.findMany({
    where: { workOrderId, characteristic },
    orderBy: [{ subgroupNo: 'asc' }, { measuredAt: 'asc' }],
  });

  if (measurements.length === 0) {
    return NextResponse.json({ points: [], ucl: null, lcl: null, cl: null, usl: null, lsl: null });
  }

  // 소그룹별 그룹화
  const bySubgroup = new Map<number, number[]>();
  for (const m of measurements) {
    const v = parseFloat(m.measuredValue.toString());
    const sg = m.subgroupNo;
    if (!bySubgroup.has(sg)) bySubgroup.set(sg, []);
    bySubgroup.get(sg)!.push(v);
  }

  const subgroups = Array.from(bySubgroup.entries()).sort((a, b) => a[0] - b[0]);
  const xbars = subgroups.map(([, vals]) => vals.reduce((s, v) => s + v, 0) / vals.length);
  const ranges = subgroups.map(([, vals]) => Math.max(...vals) - Math.min(...vals));

  const xbarMean = xbars.reduce((s, v) => s + v, 0) / xbars.length;
  const rMean    = ranges.reduce((s, v) => s + v, 0) / ranges.length;

  // A2, D3, D4 상수 (n=5 기준)
  const n  = subgroups[0]?.[1].length ?? 5;
  const A2 = n === 2 ? 1.880 : n === 3 ? 1.023 : n === 4 ? 0.729 : 0.577;
  const D3 = n <= 6 ? 0 : n === 7 ? 0.076 : 0.136;
  const D4 = n === 2 ? 3.267 : n === 3 ? 2.575 : n === 4 ? 2.282 : 2.114;

  const usl = parseFloat(measurements[0].usl.toString());
  const lsl = parseFloat(measurements[0].lsl.toString());

  const chartData = subgroups.map(([sg, vals], i) => ({
    subgroup: sg,
    xbar:     parseFloat(xbars[i].toFixed(4)),
    range:    parseFloat(ranges[i].toFixed(4)),
  }));

  return NextResponse.json({
    points:  chartData,
    xbar: { cl: xbarMean, ucl: xbarMean + A2 * rMean, lcl: Math.max(0, xbarMean - A2 * rMean) },
    range: { cl: rMean,   ucl: D4 * rMean,             lcl: D3 * rMean },
    usl, lsl,
    characteristic,
  });
}
