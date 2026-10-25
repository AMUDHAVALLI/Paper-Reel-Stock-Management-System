import { NextResponse } from 'next/server';
import { parseReelStockExcel } from '@/lib/excel-parser';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No Excel file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = parseReelStockExcel(buffer);
    const mode = (formData.get('mode') as string) || 'append'; // 'replace' or 'append'
    const user = (formData.get('user') as string) || 'Admin';

    if (mode === 'replace') {
      await prisma.consumptionLog.deleteMany();
      await prisma.reel.deleteMany();
    }

    let inserted = 0;
    let updated = 0;

    for (const r of parsed.reels) {
      const existing = await prisma.reel.findUnique({
        where: { reelNo: r.reelNo },
      });

      if (existing) {
        if (mode === 'replace') {
          await prisma.reel.update({
            where: { reelNo: r.reelNo },
            data: {
              weight: r.weight,
              usedWeight: r.usedWeight,
              balanceWeight: r.balanceWeight,
              pricePerKg: r.pricePerKg,
              reelAmount: r.reelAmount,
              consumedAmount: r.consumedAmount,
              balanceAmount: r.balanceAmount,
              status: r.status,
            },
          });
          updated++;
        }
      } else {
        await prisma.reel.create({
          data: {
            reelNo: r.reelNo,
            itemType: r.itemType,
            category: r.category,
            sizeDesc: r.sizeDesc,
            sizeValue: r.sizeValue,
            sizeUnit: r.sizeUnit,
            gsm: r.gsm,
            bf: r.bf,
            weight: r.weight,
            usedWeight: r.usedWeight,
            balanceWeight: r.balanceWeight,
            pricePerKg: r.pricePerKg,
            reelAmount: r.reelAmount,
            consumedAmount: r.consumedAmount,
            balanceAmount: r.balanceAmount,
            millName: r.millName,
            status: r.status,
            inwardDate: r.inwardDate,
            usedDate: r.usedDate,
            financialYear: r.financialYear,
            isSheet: r.isSheet,
          },
        });
        inserted++;
      }
    }

    await prisma.auditLog.create({
      data: {
        action: 'IMPORT',
        entityName: 'EXCEL_SHEET',
        entityId: file.name,
        details: `Imported spreadsheet ${file.name} to SQLite DB: ${inserted} inserted, ${updated} updated (Mode: ${mode})`,
        user,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported into SQLite DB: ${inserted} new reels added, ${updated} updated`,
      data: {
        totalParsed: parsed.totalParsed,
        totalWeight: parsed.totalWeight,
        balanceWeight: parsed.balanceWeight,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
