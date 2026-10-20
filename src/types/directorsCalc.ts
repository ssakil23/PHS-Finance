/**
 * TypeScript Data Structures for "Director's Calc" Module
 * An isolated financial ledger designed to process management service fee income (10% of total project expense),
 * deduct operational overhead, and execute controlled multi-tranche distributions to Founders (75%) and Shareholders (25%).
 */

export type OperationalExpenseCategory =
  | 'GUARD_SALARY'
  | 'ENGINEER_SALARY'
  | 'MEETING_COST'
  | 'OFFICE_ADMIN'
  | 'MISCELLANEOUS_COST';

export interface OperationalExpense {
  id: string;
  category: OperationalExpenseCategory;
  title: string;
  amountBDT: number;
  date: string;
  voucherRef?: string;
  createdBy: string;
  createdByName?: string;
  notes?: string;
}

export interface FounderRatioConfig {
  founderId: string;
  founderName: string;
  ratioPercentage: number;
  designation?: string;
  sharesHeld?: number;
}

export interface FounderPayoutBreakdown {
  founderId: string;
  founderName: string;
  ratioPercentage: number;
  amountBDT: number;
}

export interface DistributionInstallment {
  id: string;
  timestamp: string;
  authorizedBy: string;
  authorizedByName?: string;
  authorizedRole?: string;
  installmentPercentage: number; // 20% to 70%
  totalReserveFundAtTrigger: number;
  availableReserveFundAtTrigger: number;
  payoutAmount: number;
  foundersPoolTotal: number;
  shareholdersPoolTotal: number;
  founderBreakdown: FounderPayoutBreakdown[];
  shareholderBreakdownTotal: number;
  selectedShareholders?: string[];
  remarks: string;
}

export interface LiveReserveFundCalculation {
  totalLiveProjectExpense: number;
  overheadPercentage: number; // 10%
  moduleGrossIncome: number; // 10% of live project expense
  totalOperationalExpenses: number;
  netReserveFund: number; // moduleGrossIncome - totalOperationalExpenses
  foundersPoolTotal: number; // 75% of netReserveFund
  shareholdersPoolTotal: number; // 25% of netReserveFund
  totalDistributedToDate: number;
  availableReserveFund: number; // netReserveFund - totalDistributedToDate
  foundersDistributedToDate: number;
  shareholdersDistributedToDate: number;
  availableFoundersPool: number;
  availableShareholdersPool: number;
}

export interface DirectorsCalcState {
  overheadPercentage: number; // 10
  foundersPoolPercentage: number; // 75
  shareholdersPoolPercentage: number; // 25
  founderRatios: FounderRatioConfig[];
  expenses: OperationalExpense[];
  distributionHistory: DistributionInstallment[];
  selectedShareholderIds: string[]; // Selected by System Admin from PHSM-001 to PHSM-144

  // Store Actions
  addOperationalExpense: (expense: Omit<OperationalExpense, 'id'>) => OperationalExpense;
  deleteOperationalExpense: (id: string) => void;
  updateFounderRatios: (ratios: FounderRatioConfig[]) => { success: boolean; error?: string };
  setSelectedShareholderIds: (ids: string[]) => void;
  calculateLiveReserveFund: (totalLiveProjectExpense: number) => LiveReserveFundCalculation;
  triggerDistributionInstallment: (
    installmentPct: number,
    authorizedByUserId: string,
    authorizedByName: string,
    authorizedRole: string,
    totalLiveProjectExpense: number,
    remarks: string
  ) => { success: boolean; installment?: DistributionInstallment; error?: string };
  resetToDefaults: () => void;
}

export const DEFAULT_FOUNDERS: FounderRatioConfig[] = [
  {
    founderId: 'FND-001',
    founderName: 'SAIF AHMED SAKIL',
    ratioPercentage: 25.0,
    designation: 'Root Founder & Project Lead',
  },
  {
    founderId: 'FND-002',
    founderName: 'M MASUD SAWDAGOR',
    ratioPercentage: 25.0,
    designation: 'Co-Founder & Managing Director',
  },
  {
    founderId: 'FND-003',
    founderName: 'M OMAR FARUQUE MOLLA',
    ratioPercentage: 11.66667,
    designation: 'Founding Director',
  },
  {
    founderId: 'FND-004',
    founderName: 'M SHAHIN AHMED',
    ratioPercentage: 11.66667,
    designation: 'Founding Director',
  },
  {
    founderId: 'FND-005',
    founderName: 'ABUL HASHIM',
    ratioPercentage: 6.66667,
    designation: 'Founding Director',
  },
  {
    founderId: 'FND-006',
    founderName: 'SIRAJUL ISLAM',
    ratioPercentage: 6.66667,
    designation: 'Founding Director',
  },
  {
    founderId: 'FND-007',
    founderName: 'M ABU YOUSUF',
    ratioPercentage: 6.66667,
    designation: 'Founding Director',
  },
  {
    founderId: 'FND-008',
    founderName: 'FAIZAN AHMED',
    ratioPercentage: 6.66667,
    designation: 'Founding Director',
  },
];

export const CATEGORY_LABELS: Record<OperationalExpenseCategory, { label: string; icon: string; desc: string }> = {
  GUARD_SALARY: {
    label: 'Security Guard Salary',
    icon: 'Shield',
    desc: 'On-site 24/7 security & property protection payroll',
  },
  ENGINEER_SALARY: {
    label: 'Engineer Salary',
    icon: 'HardHat',
    desc: 'Resident civil & structural engineer professional fees',
  },
  MEETING_COST: {
    label: 'Meeting Costs',
    icon: 'Users',
    desc: 'Board of directors, general meetings & refreshment logistics',
  },
  OFFICE_ADMIN: {
    label: 'Office Admin',
    icon: 'Briefcase',
    desc: 'Secretarial, utility bills, documentation, and office stationery',
  },
  MISCELLANEOUS_COST: {
    label: 'Miscellaneous Costs',
    icon: 'HelpCircle',
    desc: 'Emergency logistics, site transport, legal stamp duty & incidentals',
  },
};
