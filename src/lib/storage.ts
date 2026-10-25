import { prisma } from './prisma';
import { Reel, ConsumptionLog, AuditLog, StockSummary } from './types';
import fs from 'fs';
import path from 'path';

// Helper to convert Prisma Reel entity to typed Reel domain object
function toReelDomain(r: any): Reel {
  return {
    id: r.id,
    reelNo: r.reelNo,
    itemType: r.itemType as any,
    category: r.category,
    sizeDesc: r.sizeDesc,
    sizeValue: r.sizeValue ?? undefined,
    sizeUnit: (r.sizeUnit || 'CM') as any,
    gsm: r.gsm,
    bf: r.bf ?? undefined,
    weight: r.weight,
    usedWeight: r.usedWeight,
    balanceWeight: r.balanceWeight,
    pricePerKg: r.pricePerKg,
    reelAmount: r.reelAmount,
    consumedAmount: r.consumedAmount,
    balanceAmount: r.balanceAmount,
    millName: r.millName,
    bayLocation: r.bayLocation ?? undefined,
    status: r.status as any,
    inwardDate: r.inwardDate,
    usedDate: r.usedDate ?? undefined,
    financialYear: r.financialYear,
    isSheet: Boolean(r.isSheet),
    sheetCount: r.sheetCount ?? undefined,
    remarks: r.remarks ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getReels(): Promise<Reel[]> {
  try {
    const records = await prisma.reel.findMany({
      orderBy: [
        { inwardDate: 'desc' },
        { createdAt: 'desc' }
      ],
    });
    return records.map(toReelDomain);
  } catch (err: any) {
    console.warn('Prisma getReels failed, using local json cache fallback:', err?.message);
    try {
      const dataFilePath = path.join(process.cwd(), 'data', 'paper_reel_db.json');
      if (fs.existsSync(dataFilePath)) {
        const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed.reels)) {
          return parsed.reels;
        }
      }
    } catch (e) {
      // ignore
    }
    return [];
  }
}

export async function getReelById(id: string): Promise<Reel | null> {
  try {
    const record = await prisma.reel.findFirst({
      where: {
        OR: [
          { id },
          { reelNo: id },
        ],
      },
    });
    return record ? toReelDomain(record) : null;
  } catch (err) {
    const all = await getReels();
    return all.find((r) => r.id === id || r.reelNo === id) || null;
  }
}

export async function addReel(
  data: Omit<Reel, 'id' | 'reelAmount' | 'consumedAmount' | 'balanceAmount' | 'status' | 'createdAt' | 'updatedAt'>,
  user: string = 'Admin'
): Promise<Reel> {
  const reelAmount = data.weight * data.pricePerKg;
  const consumedAmount = data.usedWeight * data.pricePerKg;
  const balanceWeight = Math.max(0, data.weight - data.usedWeight);
  const balanceAmount = balanceWeight * data.pricePerKg;

  let status = 'IN_STOCK';
  if (balanceWeight <= 0) {
    status = 'EXHAUSTED';
  } else if (data.usedWeight > 0) {
    status = 'PARTIAL';
  }

  const created = await prisma.reel.create({
    data: {
      reelNo: data.reelNo,
      itemType: data.itemType,
      category: data.category,
      sizeDesc: data.sizeDesc,
      sizeValue: data.sizeValue,
      sizeUnit: data.sizeUnit,
      gsm: data.gsm,
      bf: data.bf,
      weight: data.weight,
      usedWeight: data.usedWeight,
      balanceWeight,
      pricePerKg: data.pricePerKg,
      reelAmount,
      consumedAmount,
      balanceAmount,
      millName: data.millName,
      bayLocation: data.bayLocation,
      status,
      inwardDate: data.inwardDate,
      usedDate: data.usedDate,
      financialYear: data.financialYear,
      isSheet: data.isSheet,
      sheetCount: data.sheetCount,
      remarks: data.remarks,
    },
  });

  // Log in AuditLog
  await prisma.auditLog.create({
    data: {
      action: 'INWARD',
      entityName: 'REEL',
      entityId: created.reelNo,
      details: `Inwarded reel #${created.reelNo} (${created.sizeDesc}, ${created.gsm} GSM, ${created.weight} KG) from ${created.millName}`,
      user,
      newValues: JSON.stringify(created),
    },
  });

  return toReelDomain(created);
}

export async function updateReel(
  id: string,
  updates: Partial<Reel>,
  user: string = 'Admin'
): Promise<Reel | null> {
  const existing = await prisma.reel.findFirst({
    where: { OR: [{ id }, { reelNo: id }] },
  });
  if (!existing) return null;

  const weight = updates.weight !== undefined ? updates.weight : existing.weight;
  const usedWeight = updates.usedWeight !== undefined ? updates.usedWeight : existing.usedWeight;
  const pricePerKg = updates.pricePerKg !== undefined ? updates.pricePerKg : existing.pricePerKg;

  const balanceWeight = Math.max(0, weight - usedWeight);
  const reelAmount = weight * pricePerKg;
  const consumedAmount = usedWeight * pricePerKg;
  const balanceAmount = balanceWeight * pricePerKg;

  let status = existing.status;
  if (balanceWeight <= 0) {
    status = 'EXHAUSTED';
  } else if (usedWeight > 0) {
    status = 'PARTIAL';
  } else {
    status = 'IN_STOCK';
  }

  const updated = await prisma.reel.update({
    where: { id: existing.id },
    data: {
      ...updates,
      weight,
      usedWeight,
      balanceWeight,
      pricePerKg,
      reelAmount,
      consumedAmount,
      balanceAmount,
      status,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entityName: 'REEL',
      entityId: updated.reelNo,
      details: `Updated reel #${updated.reelNo} in SQLite database`,
      user,
      oldValues: JSON.stringify(existing),
      newValues: JSON.stringify(updated),
    },
  });

  return toReelDomain(updated);
}

export async function consumeReel(params: {
  reelId: string;
  consumedWeight: number;
  machineId?: string;
  jobOrderNo?: string;
  remarks?: string;
  user?: string;
  consumedDate?: string;
}): Promise<{ reel: Reel; log: ConsumptionLog }> {
  const reel = await prisma.reel.findFirst({
    where: { OR: [{ id: params.reelId }, { reelNo: params.reelId }] },
  });

  if (!reel) {
    throw new Error(`Reel not found: ${params.reelId}`);
  }

  if (params.consumedWeight <= 0) {
    throw new Error('Consumption weight must be greater than 0');
  }

  if (params.consumedWeight > reel.balanceWeight + 0.001) {
    throw new Error(`Cannot consume ${params.consumedWeight} KG. Available balance is ${reel.balanceWeight} KG.`);
  }

  const newUsedWeight = reel.usedWeight + params.consumedWeight;
  const newBalanceWeight = Math.max(0, Number((reel.weight - newUsedWeight).toFixed(2)));
  const consumedDate = params.consumedDate || new Date().toISOString().split('T')[0];
  const amount = params.consumedWeight * reel.pricePerKg;
  const newStatus = newBalanceWeight <= 0.05 ? 'EXHAUSTED' : 'PARTIAL';

  // Execute in Prisma transaction
  const [updatedReel, log] = await prisma.$transaction([
    prisma.reel.update({
      where: { id: reel.id },
      data: {
        usedWeight: newUsedWeight,
        balanceWeight: newBalanceWeight,
        consumedAmount: newUsedWeight * reel.pricePerKg,
        balanceAmount: newBalanceWeight * reel.pricePerKg,
        usedDate: consumedDate,
        status: newStatus,
      },
    }),
    prisma.consumptionLog.create({
      data: {
        reelId: reel.id,
        reelNo: reel.reelNo,
        consumedWeight: params.consumedWeight,
        balanceAfter: newBalanceWeight,
        pricePerKg: reel.pricePerKg,
        amount,
        consumedDate,
        machineId: params.machineId,
        jobOrderNo: params.jobOrderNo,
        recordedBy: params.user || 'Machine Operator',
        remarks: params.remarks,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'CONSUME',
        entityName: 'REEL',
        entityId: reel.reelNo,
        details: `Consumed ${params.consumedWeight} KG from reel #${reel.reelNo} (Remaining: ${newBalanceWeight} KG) on ${params.machineId || 'Machine'}`,
        user: params.user || 'Machine Operator',
      },
    }),
  ]);

  return {
    reel: toReelDomain(updatedReel),
    log: {
      id: log.id,
      reelId: log.reelId,
      reelNo: log.reelNo,
      consumedWeight: log.consumedWeight,
      balanceAfter: log.balanceAfter,
      pricePerKg: log.pricePerKg,
      amount: log.amount,
      consumedDate: log.consumedDate,
      machineId: log.machineId ?? undefined,
      jobOrderNo: log.jobOrderNo ?? undefined,
      recordedBy: log.recordedBy,
      remarks: log.remarks ?? undefined,
      createdAt: log.createdAt.toISOString(),
    },
  };
}

export async function deleteReel(id: string, user: string = 'Admin'): Promise<boolean> {
  const reel = await prisma.reel.findFirst({
    where: { OR: [{ id }, { reelNo: id }] },
  });
  if (!reel) return false;

  await prisma.reel.delete({
    where: { id: reel.id },
  });

  await prisma.auditLog.create({
    data: {
      action: 'DELETE',
      entityName: 'REEL',
      entityId: reel.reelNo,
      details: `Deleted reel #${reel.reelNo} from SQLite database`,
      user,
    },
  });

  return true;
}

export async function getConsumptionLogs(): Promise<ConsumptionLog[]> {
  try {
    const records = await prisma.consumptionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map((l) => ({
      id: l.id,
      reelId: l.reelId,
      reelNo: l.reelNo,
      consumedWeight: l.consumedWeight,
      balanceAfter: l.balanceAfter,
      pricePerKg: l.pricePerKg,
      amount: l.amount,
      consumedDate: l.consumedDate,
      machineId: l.machineId ?? undefined,
      jobOrderNo: l.jobOrderNo ?? undefined,
      recordedBy: l.recordedBy,
      remarks: l.remarks ?? undefined,
      createdAt: l.createdAt.toISOString(),
    }));
  } catch (err) {
    return [];
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const records = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return records.map((a) => ({
      id: a.id,
      timestamp: a.timestamp.toISOString(),
      action: a.action as any,
      entityName: a.entityName,
      entityId: a.entityId,
      details: a.details,
      user: a.user,
    }));
  } catch (err) {
    return [];
  }
}

export async function getStockSummary(): Promise<StockSummary> {
  const reels = await getReels();

  let totalWeight = 0;
  let usedWeight = 0;
  let balanceWeight = 0;
  let totalAmount = 0;
  let consumedAmount = 0;
  let balanceAmount = 0;
  let activeReels = 0;
  let partialReels = 0;
  let exhaustedReels = 0;

  const byGsm: StockSummary['byGsm'] = {};
  const byMill: StockSummary['byMill'] = {};

  for (const r of reels) {
    totalWeight += r.weight;
    usedWeight += r.usedWeight;
    balanceWeight += r.balanceWeight;
    totalAmount += r.reelAmount;
    consumedAmount += r.consumedAmount;
    balanceAmount += r.balanceAmount;

    if (r.status === 'IN_STOCK') activeReels++;
    else if (r.status === 'PARTIAL') partialReels++;
    else if (r.status === 'EXHAUSTED') exhaustedReels++;

    const gsmKey = r.category || `${r.gsm} GSM`;
    if (!byGsm[gsmKey]) {
      byGsm[gsmKey] = {
        count: 0,
        totalWeight: 0,
        usedWeight: 0,
        balanceWeight: 0,
        totalAmount: 0,
        balanceAmount: 0,
      };
    }
    byGsm[gsmKey].count++;
    byGsm[gsmKey].totalWeight += r.weight;
    byGsm[gsmKey].usedWeight += r.usedWeight;
    byGsm[gsmKey].balanceWeight += r.balanceWeight;
    byGsm[gsmKey].totalAmount += r.reelAmount;
    byGsm[gsmKey].balanceAmount += r.balanceAmount;

    const millKey = r.millName || 'UNKNOWN';
    if (!byMill[millKey]) {
      byMill[millKey] = {
        count: 0,
        totalWeight: 0,
        balanceWeight: 0,
        totalAmount: 0,
      };
    }
    byMill[millKey].count++;
    byMill[millKey].totalWeight += r.weight;
    byMill[millKey].balanceWeight += r.balanceWeight;
    byMill[millKey].totalAmount += r.reelAmount;
  }

  return {
    totalReels: reels.length,
    activeReels,
    partialReels,
    exhaustedReels,
    totalWeight: Number(totalWeight.toFixed(2)),
    usedWeight: Number(usedWeight.toFixed(2)),
    balanceWeight: Number(balanceWeight.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    consumedAmount: Number(consumedAmount.toFixed(2)),
    balanceAmount: Number(balanceAmount.toFixed(2)),
    byGsm,
    byMill,
  };
}
