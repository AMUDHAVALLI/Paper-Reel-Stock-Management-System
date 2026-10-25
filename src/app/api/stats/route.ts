import { NextResponse } from 'next/server';
import { getStockSummary, getAuditLogs, getConsumptionLogs } from '@/lib/storage';

export async function GET() {
  try {
    const [summary, allAudit, allConsumption] = await Promise.all([
      getStockSummary(),
      getAuditLogs(),
      getConsumptionLogs(),
    ]);
    const recentAudit = allAudit.slice(0, 10);
    const recentConsumption = allConsumption.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        recentAudit,
        recentConsumption,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
