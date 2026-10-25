import { NextResponse } from 'next/server';
import { consumeReel } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.reelId || body.consumedWeight === undefined || body.consumedWeight === null) {
      return NextResponse.json(
        { success: false, error: 'Reel ID/Number and consumedWeight are required' },
        { status: 400 }
      );
    }

    const consumedWeight = parseFloat(body.consumedWeight);
    if (isNaN(consumedWeight) || consumedWeight <= 0) {
      return NextResponse.json(
        { success: false, error: 'Consumed weight must be a positive number' },
        { status: 400 }
      );
    }

    const result = await consumeReel({
      reelId: body.reelId,
      consumedWeight,
      machineId: body.machineId || 'Corrugator Line 1',
      jobOrderNo: body.jobOrderNo,
      remarks: body.remarks,
      user: body.user || 'Machine Operator',
      consumedDate: body.consumedDate || new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
