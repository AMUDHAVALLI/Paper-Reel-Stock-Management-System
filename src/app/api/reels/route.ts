import { NextResponse } from 'next/server';
import { getReels, addReel } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const gsm = searchParams.get('gsm');
    const mill = searchParams.get('mill');
    const status = searchParams.get('status');
    const isSheet = searchParams.get('isSheet');

    let reels = await getReels();

    if (search) {
      reels = reels.filter(
        (r) =>
          r.reelNo.toLowerCase().includes(search) ||
          r.sizeDesc.toLowerCase().includes(search) ||
          r.millName.toLowerCase().includes(search) ||
          r.category.toLowerCase().includes(search)
      );
    }

    if (gsm) {
      const gsmNum = parseInt(gsm, 10);
      reels = reels.filter((r) => r.gsm === gsmNum);
    }

    if (mill) {
      reels = reels.filter((r) => r.millName.toLowerCase() === mill.toLowerCase());
    }

    if (status) {
      reels = reels.filter((r) => r.status === status);
    }

    if (isSheet !== null && isSheet !== undefined && isSheet !== '') {
      const isSheetBool = isSheet === 'true';
      reels = reels.filter((r) => r.isSheet === isSheetBool);
    }

    return NextResponse.json({ success: true, count: reels.length, data: reels });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.reelNo || !body.weight || !body.gsm) {
      return NextResponse.json(
        { success: false, error: 'Reel No, Weight (KG), and GSM are required' },
        { status: 400 }
      );
    }

    const reel = await addReel({
      reelNo: body.reelNo.trim().toUpperCase(),
      itemType: body.itemType || 'KRAFT_REEL',
      category: body.category || `${body.gsm} GSM`,
      sizeDesc: body.sizeDesc || 'STANDARD',
      sizeValue: body.sizeValue ? parseFloat(body.sizeValue) : undefined,
      sizeUnit: body.sizeUnit || 'CM',
      gsm: parseInt(body.gsm, 10),
      bf: body.bf ? parseInt(body.bf, 10) : undefined,
      weight: parseFloat(body.weight),
      usedWeight: body.usedWeight ? parseFloat(body.usedWeight) : 0,
      balanceWeight: Math.max(0, parseFloat(body.weight) - (parseFloat(body.usedWeight) || 0)),
      pricePerKg: parseFloat(body.pricePerKg) || 0,
      millName: (body.millName || 'UNKNOWN').trim().toUpperCase(),
      bayLocation: body.bayLocation?.trim(),
      inwardDate: body.inwardDate || new Date().toISOString().split('T')[0],
      financialYear: body.financialYear || '2026-2027',
      isSheet: Boolean(body.isSheet),
      sheetCount: body.sheetCount ? parseInt(body.sheetCount, 10) : undefined,
      remarks: body.remarks,
    }, body.user || 'Admin');

    return NextResponse.json({ success: true, data: reel }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
