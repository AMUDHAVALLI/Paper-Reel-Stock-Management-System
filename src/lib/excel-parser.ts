import * as XLSX from 'xlsx';
import { Reel, ItemType, ReelStatus } from './types';

// Convert Excel Serial Date (e.g. 46211) to YYYY-MM-DD
export function excelDateToString(serial: any): string {
  if (!serial) return '';
  if (typeof serial === 'string' && serial.includes('-')) return serial;
  
  const num = Number(serial);
  if (isNaN(num) || num <= 0) return String(serial);

  // Excel epoch is 1899-12-30 (due to 1900 leap year bug)
  const utcDays = Math.floor(num - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface ParseResult {
  reels: Reel[];
  financialYear: string;
  companyName: string;
  totalParsed: number;
  totalWeight: number;
  balanceWeight: number;
}

export function parseReelStockExcel(bufferOrPath: string | Buffer): ParseResult {
  const workbook = typeof bufferOrPath === 'string' 
    ? XLSX.readFile(bufferOrPath) 
    : XLSX.read(bufferOrPath, { type: 'buffer' });

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert worksheet to 2D array of rows
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  let companyName = 'OM NAMASIVAYAM PACKAGING';
  let financialYear = '2026-2027';

  if (rawData[0] && rawData[0][0]) {
    companyName = String(rawData[0][0]).trim();
  }
  if (rawData[1] && rawData[1][0]) {
    financialYear = String(rawData[1][0]).trim();
  }

  let currentCategory = '100 GSM';
  const reels: Reel[] = [];
  let reelIdCounter = 1;

  for (let r = 0; r < rawData.length; r++) {
    const row = rawData[r];
    if (!row || row.length === 0) continue;

    const colA = String(row[0] || '').trim().toUpperCase();
    const colC = String(row[2] || '').trim();
    const colD = String(row[3] || '').trim();
    const colE = String(row[4] || '').trim();
    const colG = String(row[6] || '').trim();

    // Check for section header lines (e.g., "120 GSM", "CUT SHEET 230 GSM", etc.)
    if (colA.includes('GSM') && !colA.includes('SL NO')) {
      currentCategory = colA;
      continue;
    }
    if (colD.includes('GSM') && !colA.match(/^\d+$/)) {
      currentCategory = colD;
      continue;
    }
    if (colA.includes('CUT SHEET')) {
      currentCategory = colA;
      continue;
    }

    // Skip summary, empty, or table header rows
    if (colA === 'SL NO' || colA.startsWith('TOTAL') || colA.includes('STOCK')) {
      continue;
    }

    // Check if this row is a valid data row (must have a reel number or a weight)
    const weightNum = parseFloat(colG.replace(/,/g, ''));
    if (!colC && isNaN(weightNum)) {
      continue;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      continue;
    }

    // Parse columns
    const dateRaw = row[1];
    const inwardDate = excelDateToString(dateRaw) || '2026-07-01';

    let reelNo = colC || `ROLL-${String(reelIdCounter).padStart(4, '0')}`;
    let sizeDesc = colD || 'STANDARD';
    const gsmNum = parseInt(colE, 10) || parseInt(currentCategory.match(/\d+/)?.[0] || '100', 10);
    const bfNum = parseInt(String(row[5] || ''), 10) || undefined;

    const usedWeight = parseFloat(String(row[7] || '0').replace(/,/g, '')) || 0;
    const balanceWeight = parseFloat(String(row[8] || (weightNum - usedWeight)).replace(/,/g, '')) || (weightNum - usedWeight);
    const usedDate = excelDateToString(row[9]) || undefined;

    const pricePerKg = parseFloat(String(row[10] || '0').replace(/,/g, '')) || 0;
    const reelAmount = parseFloat(String(row[11] || (weightNum * pricePerKg)).replace(/,/g, '')) || (weightNum * pricePerKg);
    const consumedAmount = parseFloat(String(row[12] || (usedWeight * pricePerKg)).replace(/,/g, '')) || (usedWeight * pricePerKg);
    const balanceAmount = parseFloat(String(row[13] || (balanceWeight * pricePerKg)).replace(/,/g, '')) || (balanceWeight * pricePerKg);

    const millName = String(row[14] || 'UNKNOWN').trim().toUpperCase() || 'UNKNOWN';

    // Determine ItemType & status
    const isSheet = currentCategory.includes('CUT SHEET') || sizeDesc.includes('X');
    let itemType: ItemType = 'KRAFT_REEL';
    if (isSheet) {
      itemType = 'CUT_SHEET';
    } else if (currentCategory.includes('WHITE') || sizeDesc.toUpperCase().includes('WHITE')) {
      itemType = 'WHITE_REEL';
    } else if (currentCategory.includes('RUBY') || sizeDesc.toUpperCase().includes('RUBY')) {
      itemType = 'SHADE_REEL';
    }

    let status: ReelStatus = 'IN_STOCK';
    if (balanceWeight <= 0) {
      status = 'EXHAUSTED';
    } else if (usedWeight > 0) {
      status = 'PARTIAL';
    }

    // Extract numeric size value if possible (e.g. "90.5 CM" -> 90.5)
    const sizeMatch = sizeDesc.match(/^([\d.]+)/);
    const sizeValue = sizeMatch ? parseFloat(sizeMatch[1]) : undefined;

    reels.push({
      id: `reel-${Date.now()}-${reelIdCounter++}`,
      reelNo,
      itemType,
      category: currentCategory,
      sizeDesc,
      sizeValue,
      sizeUnit: 'CM',
      gsm: gsmNum,
      bf: bfNum,
      weight: weightNum,
      usedWeight,
      balanceWeight: Math.max(0, balanceWeight),
      pricePerKg,
      reelAmount,
      consumedAmount,
      balanceAmount,
      millName,
      status,
      inwardDate,
      usedDate,
      financialYear,
      isSheet,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const totalWeight = reels.reduce((sum, r) => sum + r.weight, 0);
  const balanceWeight = reels.reduce((sum, r) => sum + r.balanceWeight, 0);

  return {
    reels,
    financialYear,
    companyName,
    totalParsed: reels.length,
    totalWeight,
    balanceWeight,
  };
}
