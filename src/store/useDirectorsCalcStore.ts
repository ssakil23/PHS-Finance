import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DirectorsCalcState,
  OperationalExpense,
  FounderRatioConfig,
  DistributionInstallment,
  LiveReserveFundCalculation,
  DEFAULT_FOUNDERS,
} from '../types/directorsCalc';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';

const INITIAL_EXPENSES: OperationalExpense[] = [
  {
    id: 'OPEXP-001',
    category: 'GUARD_SALARY',
    title: 'Monthly Site Security Guard Payroll (Gate 1 & 2)',
    amountBDT: 45000,
    date: '2026-03-01',
    voucherRef: 'VCH-SEC-01',
    createdBy: 'usr-admin-root',
    createdByName: 'Saif Ahmed Sakil',
    notes: '24/7 security deployment for Prottasha Housing site boundary',
  },
  {
    id: 'OPEXP-002',
    category: 'ENGINEER_SALARY',
    title: 'Lead Structural & Civil Engineer Consultancy',
    amountBDT: 75000,
    date: '2026-03-05',
    voucherRef: 'VCH-ENG-02',
    createdBy: 'usr-admin-root',
    createdByName: 'Saif Ahmed Sakil',
    notes: 'Resident engineer inspection and site development quality oversight',
  },
  {
    id: 'OPEXP-003',
    category: 'MEETING_COST',
    title: 'Quarterly Founders & Steering Committee Strategy Meeting',
    amountBDT: 18500,
    date: '2026-03-12',
    voucherRef: 'VCH-MTG-03',
    createdBy: 'usr-admin-root',
    createdByName: 'Saif Ahmed Sakil',
    notes: 'Refreshments, conference room facility, and presentation folders',
  },
  {
    id: 'OPEXP-004',
    category: 'OFFICE_ADMIN',
    title: 'Documentation, Legal Registry Stationery & Site Utilities',
    amountBDT: 22000,
    date: '2026-03-18',
    voucherRef: 'VCH-ADM-04',
    createdBy: 'usr-admin-root',
    createdByName: 'Saif Ahmed Sakil',
    notes: 'Stamp paper, deed documentation archive, and site office internet/electric',
  },
  {
    id: 'OPEXP-005',
    category: 'MISCELLANEOUS_COST',
    title: 'Emergency Site Logistics & Transport Honorarium',
    amountBDT: 12000,
    date: '2026-03-22',
    voucherRef: 'VCH-MISC-05',
    createdBy: 'usr-admin-root',
    createdByName: 'Saif Ahmed Sakil',
    notes: 'Site boundary survey transport and emergency flood mitigation consumables',
  },
];

// Default selected shareholders: Initial 12 foundational share owners
const DEFAULT_SELECTED_SHAREHOLDERS: string[] = [
  'PHSM-001', 'PHSM-002', 'PHSM-003', 'PHSM-004',
  'PHSM-005', 'PHSM-006', 'PHSM-007', 'PHSM-008',
  'PHSM-009', 'PHSM-010', 'PHSM-011', 'PHSM-012',
];

// Sample Tranche Distribution (25% Tranche under Board Resolution EC-RES-2026-015)
const INITIAL_DISTRIBUTIONS: DistributionInstallment[] = [
  {
    id: 'DIST-2026-TR1',
    timestamp: '2026-03-25T11:30:00.000Z',
    authorizedBy: 'usr-admin-root',
    authorizedByName: 'Saif Ahmed Sakil (System Admin)',
    authorizedRole: 'SYSTEM_ADMIN',
    installmentPercentage: 25,
    totalReserveFundAtTrigger: 1412500,
    availableReserveFundAtTrigger: 1412500,
    payoutAmount: 353125,
    foundersPoolTotal: 264844,
    shareholdersPoolTotal: 88281,
    founderBreakdown: [
      { founderId: 'FND-001', founderName: 'SAIF AHMED SAKIL', ratioPercentage: 25.0, amountBDT: 66211 },
      { founderId: 'FND-002', founderName: 'M MASUD SAWDAGOR', ratioPercentage: 25.0, amountBDT: 66211 },
      { founderId: 'FND-003', founderName: 'M OMAR FARUQUE MOLLA', ratioPercentage: 11.66667, amountBDT: 30898 },
      { founderId: 'FND-004', founderName: 'M SHAHIN AHMED', ratioPercentage: 11.66667, amountBDT: 30898 },
      { founderId: 'FND-005', founderName: 'ABUL HASHIM', ratioPercentage: 6.66667, amountBDT: 17656 },
      { founderId: 'FND-006', founderName: 'SIRAJUL ISLAM', ratioPercentage: 6.66667, amountBDT: 17656 },
      { founderId: 'FND-007', founderName: 'M ABU YOUSUF', ratioPercentage: 6.66667, amountBDT: 17656 },
      { founderId: 'FND-008', founderName: 'FAIZAN AHMED', ratioPercentage: 6.66667, amountBDT: 17656 },
    ],
    shareholderBreakdownTotal: 88281,
    selectedShareholders: DEFAULT_SELECTED_SHAREHOLDERS,
    remarks: 'Q1-2026 Executive Tranche 1 (25%) authorized by Board Resolution EC-RES-2026-015.',
  },
];

export const useDirectorsCalcStore = create<DirectorsCalcState>()(
  persist(
    (set, get) => ({
      overheadPercentage: 10,
      foundersPoolPercentage: 75,
      shareholdersPoolPercentage: 25,
      founderRatios: DEFAULT_FOUNDERS,
      expenses: INITIAL_EXPENSES,
      distributionHistory: INITIAL_DISTRIBUTIONS,
      selectedShareholderIds: DEFAULT_SELECTED_SHAREHOLDERS,

      addOperationalExpense: (expenseData) => {
        const id = `OPEXP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
        const newExpense: OperationalExpense = {
          ...expenseData,
          id,
          amountBDT: Math.round(Number(expenseData.amountBDT) || 0),
          date: expenseData.date || new Date().toISOString().split('T')[0],
        };

        set((state) => ({
          expenses: [newExpense, ...state.expenses],
        }));

        // Log audit if currentUser exists
        try {
          const authUser = authService.getCurrentUser();
          if (authUser) {
            storageService.logAudit(
              authUser,
              'CREATE',
              'EXPENSE',
              id,
              `[Director's Calc] Added operational expense: "${newExpense.title}" (৳ ${newExpense.amountBDT.toLocaleString()}) under category ${newExpense.category}`
            );
          }
        } catch {}

        return newExpense;
      },

      deleteOperationalExpense: (id) => {
        const target = get().expenses.find((e) => e.id === id);
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }));

        try {
          const authUser = authService.getCurrentUser();
          if (authUser && target) {
            storageService.logAudit(
              authUser,
              'SOFT_DELETE',
              'EXPENSE',
              id,
              `[Director's Calc] Deleted operational expense: "${target.title}" (৳ ${target.amountBDT.toLocaleString()})`
            );
          }
        } catch {}
      },

      updateFounderRatios: (ratios) => {
        const total = ratios.reduce((sum, r) => sum + (Number(r.ratioPercentage) || 0), 0);
        // Allow tiny floating point tolerance (0.05%)
        if (Math.abs(total - 100) > 0.05) {
          return {
            success: false,
            error: `Sum of all 8 Founder ratios must equal exactly 100.00%. Current total is ${total.toFixed(4)}%.`,
          };
        }

        set({ founderRatios: ratios });

        try {
          const authUser = authService.getCurrentUser();
          if (authUser) {
            storageService.logAudit(
              authUser,
              'UPDATE',
              'SYSTEM_CONFIG',
              'FOUNDER_RATIOS',
              `[Director's Calc] Updated 8 Founder payout distribution ratios (Total: ${total.toFixed(2)}%)`
            );
          }
        } catch {}

        return { success: true };
      },

      setSelectedShareholderIds: (ids) => {
        set({ selectedShareholderIds: ids });
      },

      calculateLiveReserveFund: (totalLiveProjectExpense: number): LiveReserveFundCalculation => {
        const state = get();
        const safeExpense = Math.max(0, Number(totalLiveProjectExpense) || 0);

        // Rule 1: Live Module Gross Income = 10% of Live Total Project Expense
        const moduleGrossIncome = Math.round(safeExpense * 0.10);

        // Rule 2: Operational Expenses = sum of all recorded operational expenses
        const totalOperationalExpenses = state.expenses.reduce(
          (sum, exp) => sum + (Number(exp.amountBDT) || 0),
          0
        );

        // Rule 3: Net Reserve Fund = Module_Income - Total_Operational_Expenses
        const netReserveFund = Math.max(0, moduleGrossIncome - totalOperationalExpenses);

        // Rule 4: Allocation Pools (75% / 25% Split with exact zero-drift balance)
        const foundersPoolTotal = Math.round(netReserveFund * 0.75);
        const shareholdersPoolTotal = Math.max(0, netReserveFund - foundersPoolTotal);

        // Distributions already executed to date
        const totalDistributedToDate = state.distributionHistory.reduce(
          (sum, d) => sum + (Number(d.payoutAmount) || 0),
          0
        );
        const foundersDistributedToDate = state.distributionHistory.reduce(
          (sum, d) => sum + (Number(d.foundersPoolTotal) || 0),
          0
        );
        const shareholdersDistributedToDate = state.distributionHistory.reduce(
          (sum, d) => sum + (Number(d.shareholdersPoolTotal) || 0),
          0
        );

        // Available remaining reserve fund
        const availableReserveFund = Math.max(0, netReserveFund - totalDistributedToDate);
        const availableFoundersPool = Math.max(0, foundersPoolTotal - foundersDistributedToDate);
        const availableShareholdersPool = Math.max(0, shareholdersPoolTotal - shareholdersDistributedToDate);

        return {
          totalLiveProjectExpense: safeExpense,
          overheadPercentage: state.overheadPercentage,
          moduleGrossIncome,
          totalOperationalExpenses,
          netReserveFund,
          foundersPoolTotal,
          shareholdersPoolTotal,
          totalDistributedToDate,
          availableReserveFund,
          foundersDistributedToDate,
          shareholdersDistributedToDate,
          availableFoundersPool,
          availableShareholdersPool,
        };
      },

      triggerDistributionInstallment: (
        installmentPct,
        authorizedByUserId,
        authorizedByName,
        authorizedRole,
        totalLiveProjectExpense,
        remarks
      ) => {
        // Enforce Authorized Roles: System Admin & Delegated Admin ONLY
        if (authorizedRole !== 'SYSTEM_ADMIN' && authorizedRole !== 'DELEGATED_ADMIN') {
          return {
            success: false,
            error: 'Unauthorized: Tranche distributions can only be triggered by System Admin or Delegated Admin.',
          };
        }

        // Enforce Allowed Installment Range: 20% to 70% Band
        const pct = Number(installmentPct);
        if (isNaN(pct) || pct < 20 || pct > 70) {
          return {
            success: false,
            error: `Invalid installment percentage (${pct}%). The allowable distribution tranche band is strictly 20% to 70% of available reserve funds.`,
          };
        }

        const state = get();
        const calc = state.calculateLiveReserveFund(totalLiveProjectExpense);

        if (calc.availableReserveFund <= 0) {
          return {
            success: false,
            error: 'Cannot trigger distribution: Available Net Reserve Fund is currently ৳ 0 or negative.',
          };
        }

        // Payout calculations with exact sum integrity
        const payoutAmount = Math.round(calc.availableReserveFund * (pct / 100));
        if (payoutAmount <= 0) {
          return {
            success: false,
            error: 'Calculated payout amount is ৳ 0.',
          };
        }

        const foundersTranche = Math.round(payoutAmount * 0.75);
        const shareholdersTranche = Math.max(0, payoutAmount - foundersTranche);

        // Compute individual Founder payouts based on assigned ratios (100% of founders pool with remainder reconciliation)
        let allocatedFounderSum = 0;
        const founderBreakdown = state.founderRatios.map((f, idx) => {
          const ratio = Number(f.ratioPercentage) || 0;
          let individualShare: number;
          if (idx === state.founderRatios.length - 1) {
            // Assign remaining balance to final founder to guarantee sum(founderBreakdown) === foundersTranche exactly
            individualShare = Math.max(0, foundersTranche - allocatedFounderSum);
          } else {
            individualShare = Math.round(foundersTranche * (ratio / 100));
            allocatedFounderSum += individualShare;
          }
          return {
            founderId: f.founderId,
            founderName: f.founderName,
            ratioPercentage: ratio,
            amountBDT: individualShare,
          };
        });

        const newInstallment: DistributionInstallment = {
          id: `DIST-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          authorizedBy: authorizedByUserId,
          authorizedByName: authorizedByName || authorizedByUserId,
          authorizedRole,
          installmentPercentage: pct,
          totalReserveFundAtTrigger: calc.netReserveFund,
          availableReserveFundAtTrigger: calc.availableReserveFund,
          payoutAmount,
          foundersPoolTotal: foundersTranche,
          shareholdersPoolTotal: shareholdersTranche,
          founderBreakdown,
          shareholderBreakdownTotal: shareholdersTranche,
          selectedShareholders: state.selectedShareholderIds,
          remarks: remarks.trim() || `Authorized ${pct}% tranche distribution across 8 Founders & selected Share Owners.`,
        };

        set((s) => ({
          distributionHistory: [newInstallment, ...s.distributionHistory],
        }));

        // Log to PHS system audit
        try {
          const authUser = authService.getCurrentUser();
          if (authUser) {
            storageService.logAudit(
              authUser,
              'CREATE',
              'SYSTEM_CONFIG',
              newInstallment.id,
              `[Director's Calc] Triggered ${pct}% distribution tranche: Total ৳ ${payoutAmount.toLocaleString()} (Founders 75%: ৳ ${foundersTranche.toLocaleString()}, Shareholders 25%: ৳ ${shareholdersTranche.toLocaleString()}). Remarks: ${newInstallment.remarks}`
            );
          }
        } catch {}

        return {
          success: true,
          installment: newInstallment,
        };
      },

      resetToDefaults: () => {
        set({
          overheadPercentage: 10,
          foundersPoolPercentage: 75,
          shareholdersPoolPercentage: 25,
          founderRatios: DEFAULT_FOUNDERS,
          expenses: INITIAL_EXPENSES,
          distributionHistory: INITIAL_DISTRIBUTIONS,
          selectedShareholderIds: DEFAULT_SELECTED_SHAREHOLDERS,
        });
      },
    }),
    {
      name: 'phs_directors_calc_v1',
      version: 2,
      migrate: (persistedState: any) => {
        const state = (persistedState || {}) as Partial<DirectorsCalcState>;
        return {
          ...state,
          overheadPercentage: 10,
          foundersPoolPercentage: 75,
          shareholdersPoolPercentage: 25,
          founderRatios: state.founderRatios && state.founderRatios.length === 8 ? state.founderRatios : DEFAULT_FOUNDERS,
          expenses: state.expenses && state.expenses.length > 0 ? state.expenses : INITIAL_EXPENSES,
          distributionHistory: state.distributionHistory && state.distributionHistory.length > 0 ? state.distributionHistory : INITIAL_DISTRIBUTIONS,
          selectedShareholderIds: state.selectedShareholderIds && state.selectedShareholderIds.length > 0 ? state.selectedShareholderIds : DEFAULT_SELECTED_SHAREHOLDERS,
        };
      },
      partialize: (state) => ({
        overheadPercentage: state.overheadPercentage,
        foundersPoolPercentage: state.foundersPoolPercentage,
        shareholdersPoolPercentage: state.shareholdersPoolPercentage,
        founderRatios: state.founderRatios,
        expenses: state.expenses,
        distributionHistory: state.distributionHistory,
        selectedShareholderIds: state.selectedShareholderIds,
      }),
    }
  )
);
