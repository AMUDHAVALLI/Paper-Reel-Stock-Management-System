import { UserRole } from './types';
import bcrypt from 'bcryptjs';

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewRegister: boolean;
  canInwardReels: boolean;
  canIssueReels: boolean;
  canViewSheets: boolean;
  canPrintLabels: boolean;
  canViewPrices: boolean;      // Financial visibility (₹/KG, total inventory value)
  canViewReports: boolean;     // Closing stock valuation & audit statements
  canManageSettings: boolean;  // Database backups & system masters
  canDeleteReels: boolean;
  canAccessAdmin: boolean;     // Dedicated Admin module access
  roleBadgeText?: string;
  roleDescription?: string;
}

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  ADMIN: {
    canViewDashboard: true,
    canViewRegister: true,
    canInwardReels: true,
    canIssueReels: true,
    canViewSheets: true,
    canPrintLabels: true,
    canViewPrices: true,
    canViewReports: true,
    canManageSettings: true,
    canDeleteReels: true,
    canAccessAdmin: true,
    roleBadgeText: 'Admin / Owner',
    roleDescription: 'Full access to all stock operations, purchase prices, valuations, admin module, and backups.',
  },
  ACCOUNTANT: {
    canViewDashboard: true,
    canViewRegister: true,
    canInwardReels: false,
    canIssueReels: false,
    canViewSheets: true,
    canPrintLabels: false,
    canViewPrices: true,
    canViewReports: true,
    canManageSettings: false,
    canDeleteReels: false,
    canAccessAdmin: false,
    roleBadgeText: 'Chief Accountant',
    roleDescription: 'Full financial visibility, closing stock asset valuation, and audit reporting.',
  },
  STOREKEEPER: {
    canViewDashboard: true,
    canViewRegister: true,
    canInwardReels: true,
    canIssueReels: true,
    canViewSheets: true,
    canPrintLabels: true,
    canViewPrices: false, // Masked
    canViewReports: false, // Restricted
    canManageSettings: false,
    canDeleteReels: false,
    canAccessAdmin: false,
    roleBadgeText: 'Store Incharge',
    roleDescription: 'Raw material roll inward, barcode sticker generation, and warehouse bay tracking. Prices masked.',
  },
  OPERATOR: {
    canViewDashboard: true,
    canViewRegister: true,
    canInwardReels: false, // Cannot add stock
    canIssueReels: true,   // Can issue rolls to machines
    canViewSheets: true,
    canPrintLabels: false,
    canViewPrices: false,  // Masked
    canViewReports: false, // Restricted
    canManageSettings: false,
    canDeleteReels: false,
    canAccessAdmin: false,
    roleBadgeText: 'Machine Operator',
    roleDescription: 'Record roll consumption on corrugator lines. Rates and reports restricted.',
  },
};

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

