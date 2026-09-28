/**
 * PHS-Finance - Financial Calculation Engine
 * High precision, unit-safe financial formula implementations for Prottasha Housing Society.
 */

import { IncomeEntry, ExpenseEntry, DirectorInfo, Member } from '../types';
import { TOTAL_SHARES, DIRECTORS, parseShareNumberFromMemberId, getDirectorForShareNumber } from './directors';

export interface DirectorFinancialSummary {
  director: DirectorInfo;
  controlledShares: number;
  sharePercentage: number;
  totalExpense: number; // (Total Project Expense * Director's Controlled Shares) / 144
  totalCollection: number; // Sum of collections from shares controlled by that Director
  currentBalance: number; // totalCollection - totalExpense
  collectionPercentage: number;
  status: 'SURPLUS' | 'BALANCED' | 'DEFICIT';
}

export interface MemberFinancialSummary {
  member: Member;
  memberId: string;
  shareNumber: number;
  controllingDirector: DirectorInfo;
  totalProjectExpense: number;
  memberShareExpense: number; // Total Project Expense / 144
  memberPersonalDeposit: number; // Total money deposited against this specific Member ID
  currentBalance: number; // memberPersonalDeposit - memberShareExpense
  status: 'ADVANCE' | 'PAID' | 'DUE';
}

export interface OverallProjectFinancials {
  totalCollection: number; // General + Sales approved
  totalGeneralDeposits: number;
  totalSalesDeposits: number;
  totalProjectExpense: number; // Approved expenses
  netSocietyBalance: number; // totalCollection - totalProjectExpense
  perShareExpense: number; // totalProjectExpense / 144
  totalPendingIncomeAmount: number;
  totalPendingExpenseAmount: number;
  pendingIncomeCount: number;
  pendingExpenseCount: number;
}

/**
 * Format monetary amount into Bangladeshi Taka (BDT)
 * Supports both Bengali ৳ symbol or BDT code.
 */
export function formatBDT(amount: number | undefined | null, useSymbol: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return useSymbol ? '৳ 0' : 'BDT 0';
  }

  // Format with standard thousands separator
  const rounded = Math.round(amount * 100) / 100;
  const parts = Math.abs(rounded).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const sign = rounded < 0 ? '-' : '';
  const prefix = useSymbol ? '৳ ' : 'BDT ';

  return `${sign}${prefix}${parts}`;
}

/**
 * Computes overall project financial metrics from active, approved records
 */
export function computeProjectFinancials(
  incomes: IncomeEntry[],
  expenses: ExpenseEntry[]
): OverallProjectFinancials {
  // Only APPROVED and non-soft-deleted entries count towards active financials
  const approvedIncomes = incomes.filter(
    (inc) => inc.status === 'APPROVED' && !inc.isSoftDeleted
  );
  const approvedExpenses = expenses.filter(
    (exp) => exp.status === 'APPROVED' && !exp.isSoftDeleted
  );

  const pendingIncomes = incomes.filter(
    (inc) => inc.status === 'PENDING' && !inc.isSoftDeleted
  );
  const pendingExpenses = expenses.filter(
    (exp) => exp.status === 'PENDING' && !exp.isSoftDeleted
  );

  let totalGeneralDeposits = 0;
  let totalSalesDeposits = 0;

  for (const inc of approvedIncomes) {
    if (inc.type === 'SALES_DEPOSIT') {
      totalSalesDeposits += inc.amount;
    } else {
      totalGeneralDeposits += inc.amount;
    }
  }

  const totalCollection = totalGeneralDeposits + totalSalesDeposits;

  let totalProjectExpense = 0;
  for (const exp of approvedExpenses) {
    totalProjectExpense += exp.amount;
  }

  const netSocietyBalance = totalCollection - totalProjectExpense;
  const perShareExpense = TOTAL_SHARES > 0 ? totalProjectExpense / TOTAL_SHARES : 0;

  const totalPendingIncomeAmount = pendingIncomes.reduce((acc, i) => acc + i.amount, 0);
  const totalPendingExpenseAmount = pendingExpenses.reduce((acc, e) => acc + e.amount, 0);

  return {
    totalCollection,
    totalGeneralDeposits,
    totalSalesDeposits,
    totalProjectExpense,
    netSocietyBalance,
    perShareExpense,
    totalPendingIncomeAmount,
    totalPendingExpenseAmount,
    pendingIncomeCount: pendingIncomes.length,
    pendingExpenseCount: pendingExpenses.length,
  };
}

/**
 * Computes Director Summary Dashboard Calculations:
 * - Director's Total Expense = (Total Project Expense * Director's Controlled Shares) / 144
 * - Director's Total Collection = Sum of collections from shares controlled by that Director
 * - Current Balance = Director's Total Collection - Director's Total Expense
 */
export function computeDirectorSummaries(
  incomes: IncomeEntry[],
  expenses: ExpenseEntry[]
): DirectorFinancialSummary[] {
  const projectFinancials = computeProjectFinancials(incomes, expenses);
  const totalProjectExpense = projectFinancials.totalProjectExpense;

  const approvedIncomes = incomes.filter(
    (inc) => inc.status === 'APPROVED' && !inc.isSoftDeleted
  );

  return DIRECTORS.map((director) => {
    // Calculate Director's Total Expense = (Total Project Expense * Director's Controlled Shares) / 144
    const directorExpense = (totalProjectExpense * director.shareCount) / TOTAL_SHARES;

    // Director's Total Collection = Sum of collections from shares controlled by that Director
    // Match either by controllingDirector key/name or share number range
    let directorCollection = 0;

    for (const inc of approvedIncomes) {
      if (inc.type === 'GENERAL_DEPOSIT') {
        const shareNum = inc.shareNumber || (inc.shareOwnerId ? parseShareNumberFromMemberId(inc.shareOwnerId) : null);
        if (shareNum !== null) {
          if (shareNum >= director.startShare && shareNum <= director.endShare) {
            directorCollection += inc.amount;
            continue;
          }
        }
        if (inc.controllingDirector && (inc.controllingDirector === director.name || inc.controllingDirector === director.key)) {
          directorCollection += inc.amount;
        }
      }
    }

    const currentBalance = directorCollection - directorExpense;
    const sharePercentage = (director.shareCount / TOTAL_SHARES) * 100;
    const collectionPercentage = directorExpense > 0 ? (directorCollection / directorExpense) * 100 : 100;

    let status: 'SURPLUS' | 'BALANCED' | 'DEFICIT' = 'BALANCED';
    if (currentBalance > 0.01) {
      status = 'SURPLUS';
    } else if (currentBalance < -0.01) {
      status = 'DEFICIT';
    }

    return {
      director,
      controlledShares: director.shareCount,
      sharePercentage,
      totalExpense: directorExpense,
      totalCollection: directorCollection,
      currentBalance,
      collectionPercentage,
      status,
    };
  });
}

/**
 * Computes Share Owner Dashboard Calculation:
 * - Member Share Expense = Total Project Expense / 144
 * - Member Personal Deposit = Total money deposited against this specific Member ID
 * - Current Balance = Member Personal Deposit - Member Share Expense
 */
export function computeMemberSummary(
  member: Member,
  incomes: IncomeEntry[],
  expenses: ExpenseEntry[]
): MemberFinancialSummary {
  const projectFinancials = computeProjectFinancials(incomes, expenses);
  const totalProjectExpense = projectFinancials.totalProjectExpense;

  // Member Share Expense = Total Project Expense / 144
  const memberShareExpense = totalProjectExpense / TOTAL_SHARES;

  // Member Personal Deposit = Total money deposited against this specific Member ID
  const memberDeposits = incomes
    .filter(
      (inc) =>
        inc.status === 'APPROVED' &&
        !inc.isSoftDeleted &&
        inc.type === 'GENERAL_DEPOSIT' &&
        (inc.shareOwnerId === member.id || inc.shareNumber === member.shareNumber)
    )
    .reduce((sum, inc) => sum + inc.amount, 0);

  const currentBalance = memberDeposits - memberShareExpense;

  let status: 'ADVANCE' | 'PAID' | 'DUE' = 'PAID';
  if (currentBalance > 0.01) {
    status = 'ADVANCE';
  } else if (currentBalance < -0.01) {
    status = 'DUE';
  }

  const controllingDirector = getDirectorForShareNumber(member.shareNumber);

  return {
    member,
    memberId: member.id,
    shareNumber: member.shareNumber,
    controllingDirector,
    totalProjectExpense,
    memberShareExpense,
    memberPersonalDeposit: memberDeposits,
    currentBalance,
    status,
  };
}

/**
 * Computes all 144 Member Summaries
 */
export function computeAllMemberSummaries(
  members: Member[],
  incomes: IncomeEntry[],
  expenses: ExpenseEntry[]
): MemberFinancialSummary[] {
  return members.map((member) => computeMemberSummary(member, incomes, expenses));
}
