import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export interface LowStockAlertPayload {
  reelNo: string;
  millName: string;
  sizeDesc: string;
  gsm: number;
  bf?: number | null;
  weight: number;
  consumedWeight: number;
  balanceWeight: number;
  balancePercentage: number;
  machineId?: string;
  jobOrderNo?: string;
  user?: string;
  date?: string;
}

export const DEFAULT_OWNER_EMAIL = 'ammudhavalli@gmail.com';

/**
 * Returns a configured nodemailer transporter or null if SMTP credentials are missing
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Generates an HTML email for low balance reel notification
 */
function generateLowStockHtml(payload: LowStockAlertPayload, ownerEmail: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Low Stock Alert - OM Namasivayam Packaging</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background: #d97706; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 12px; opacity: 0.9; }
    .alert-pill { display: inline-block; background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 9999px; margin-top: 16px; text-transform: uppercase; }
    .content { padding: 28px; }
    .lead { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
    .stat-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    .stat-value { font-size: 16px; font-weight: 800; color: #0f172a; font-family: monospace; }
    .stat-value.highlight { color: #dc2626; }
    .stat-value.brand { color: #d97706; }
    .table-details { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    .table-details th { text-align: left; padding: 10px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #475569; }
    .table-details td { padding: 10px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .progress-wrap { background: #e2e8f0; border-radius: 9999px; height: 10px; overflow: hidden; margin-top: 6px; }
    .progress-bar { background: #ef4444; height: 100%; width: ${Math.min(100, Math.max(0, payload.balancePercentage))}%; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748b; }
    .btn { display: inline-block; background: #d97706; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>OM NAMASIVAYAM PACKAGING</h1>
      <p>Paper Reel Stock & Corrugated Box Inventory ERP • Puducherry</p>
      <div class="alert-pill">⚠️ Low Balance Weight Warning: ${payload.balancePercentage}% Remaining</div>
    </div>

    <div class="content">
      <p class="lead">
        Dear Owner,
        <br><br>
        This is an automated production alert notifying you that <strong>Reel #${payload.reelNo}</strong> has reached or dropped below the <strong>20% Balance Weight threshold</strong> following recent corrugator line consumption.
      </p>

      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Reel Number</div>
          <div class="stat-value brand">#${payload.reelNo}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Remaining Balance Weight</div>
          <div class="stat-value highlight">${payload.balanceWeight} KG (${payload.balancePercentage}%)</div>
          <div class="progress-wrap">
            <div class="progress-bar"></div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Initial Inward Wt</div>
          <div class="stat-value">${payload.weight} KG</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Consumed Wt</div>
          <div class="stat-value">${payload.consumedWeight} KG</div>
        </div>
      </div>

      <table class="table-details">
        <tr>
          <th>Paper Mill Supplier</th>
          <td><strong>${payload.millName}</strong></td>
        </tr>
        <tr>
          <th>Size / Deckle</th>
          <td>${payload.sizeDesc}</td>
        </tr>
        <tr>
          <th>GSM / BF Spec</th>
          <td>${payload.gsm} GSM ${payload.bf ? `• ${payload.bf} BF` : ''}</td>
        </tr>
        <tr>
          <th>Machine / Line Issued</th>
          <td>${payload.machineId || 'Corrugator Line'}</td>
        </tr>
        ${payload.jobOrderNo ? `
        <tr>
          <th>Job / Box Reference</th>
          <td>${payload.jobOrderNo}</td>
        </tr>` : ''}
        <tr>
          <th>Operator / Logged By</th>
          <td>${payload.user || 'Machine Operator'}</td>
        </tr>
        <tr>
          <th>Date of Consumption</th>
          <td>${payload.date || new Date().toISOString().split('T')[0]}</td>
        </tr>
      </table>

      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; font-size: 12px; color: #92400e; margin-bottom: 18px;">
        <strong>Recommended Action:</strong> This roll is nearing exhaustion. Please check your raw paper buffer inventory and schedule mill purchase orders to avoid machine downtime at the corrugation line.
      </div>
    </div>

    <div class="footer">
      <p>This automated email was sent to <strong>${ownerEmail}</strong> by OM Namasivayam Packaging Paper Reel Stock Management System.</p>
      <p>Plant: Thanathumedu, Villianur Commune, Puducherry 605110 • Capacity: 70–90 Tonnes/Month</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends a low stock alert email to the owner when a reel reaches 20% or less balance weight
 */
export async function sendLowStockAlert(payload: LowStockAlertPayload): Promise<{
  success: boolean;
  sent: boolean;
  simulated: boolean;
  error?: string;
  recipient: string;
}> {
  const recipient = process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL;
  const subject = `[LOW STOCK ALERT] Reel #${payload.reelNo} Balance Weight has reached ${payload.balancePercentage}% (${payload.balanceWeight} KG remaining)`;
  const html = generateLowStockHtml(payload, recipient);

  const transporter = getTransporter();

  // If no SMTP credentials configured, log and record audit log
  if (!transporter) {
    console.warn(`[EMAIL ALERT - SMTP NOT CONFIGURED]`);
    console.warn(`To: ${recipient}`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Reel: #${payload.reelNo} | Mill: ${payload.millName} | Balance: ${payload.balanceWeight} KG (${payload.balancePercentage}%)`);

    try {
      await prisma.auditLog.create({
        data: {
          action: 'EMAIL_ALERT',
          entityName: 'REEL',
          entityId: payload.reelNo,
          details: `[SIMULATED - NO SMTP] Sent low stock email alert for Reel #${payload.reelNo} (${payload.balanceWeight} KG / ${payload.balancePercentage}%) to ${recipient}`,
          user: payload.user || 'System Alert',
        },
      });
    } catch (e) {
      console.error('Failed to write audit log for email alert:', e);
    }

    return {
      success: true,
      sent: false,
      simulated: true,
      recipient,
    };
  }

  // If SMTP credentials ARE configured, deliver email
  try {
    const fromAddress = process.env.SMTP_FROM || `"OM Namasivayam Packaging" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject,
      html,
    });

    console.log(`[EMAIL ALERT DELIVERED] Message ID: ${info.messageId} to ${recipient}`);

    await prisma.auditLog.create({
      data: {
        action: 'EMAIL_ALERT',
        entityName: 'REEL',
        entityId: payload.reelNo,
        details: `Delivered low stock email alert for Reel #${payload.reelNo} (${payload.balanceWeight} KG / ${payload.balancePercentage}%) to ${recipient}`,
        user: payload.user || 'System Alert',
      },
    });

    return {
      success: true,
      sent: true,
      simulated: false,
      recipient,
    };
  } catch (err: any) {
    console.error('[EMAIL ALERT ERROR] Failed to send email:', err);

    await prisma.auditLog.create({
      data: {
        action: 'EMAIL_ALERT_ERROR',
        entityName: 'REEL',
        entityId: payload.reelNo,
        details: `Failed to deliver low stock email alert to ${recipient}: ${err.message}`,
        user: payload.user || 'System Alert',
      },
    });

    return {
      success: false,
      sent: false,
      simulated: false,
      error: err.message,
      recipient,
    };
  }
}
