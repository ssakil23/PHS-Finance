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

export interface ExpenseSubCategoryBreakdown {
  name: string;
  totalAmount: number;
  perShareAmount: number; // totalAmount / 144
  percentageOfCategory: number;
  percentageOfTotal: number;
  transactionCount: number;
  items: ExpenseEntry[];
}

export interface ExpenseCategoryBreakdown {
  category: string;
  totalAmount: number;
  perShareAmount: number; // totalAmount / 144
  percentageOfTotal: number;
  transactionCount: number;
  subCategories: ExpenseSubCategoryBreakdown[];
  items: ExpenseEntry[];
}

export interface ProjectExpenseDetailedAnalysis {
  totalProjectExpense: number;
  perShareExpense: number;
  approvedCount: number;
  pendingCount: number;
  pendingAmount: number;
  categories: ExpenseCategoryBreakdown[];
}

/**
 * Intelligently resolves the sub-category of an expense entry
 */
export function getExpenseSubCategory(exp: ExpenseEntry): string {
  if (exp.subCategory && exp.subCategory.trim()) {
    return exp.subCategory.trim();
  }
  const rem = (exp.remarks || '').toLowerCase();
  const cat = exp.category || 'Others';
  const rec = (exp.billRecipient || '').toLowerCase();

  switch (cat) {
    case 'Site Development':
      if (rem.includes('excavat') || rem.includes('level') || rem.includes('compact')) {
        return 'Earth Leveling & Site Compaction';
      }
      if (rem.includes('wall') || rem.includes('brick') || rem.includes('fence') || rem.includes('perimeter')) {
        return 'Perimeter Boundary Wall & Fencing';
      }
      if (rem.includes('culvert') || rem.includes('drain') || rem.includes('pipe') || rem.includes('rcc')) {
        return 'RCC Box Culvert & Drainage';
      }
      if (rem.includes('sand') || rem.includes('dredg') || rem.includes('grad')) {
        return 'Sand Dredging & Ground Grading';
      }
      if (rem.includes('survey') || rem.includes('demarc') || rem.includes('mouza')) {
        return 'Topographic Survey & Demarcation';
      }
      return 'Earthworks & Site Infrastructure';

    case 'Labor':
      if (rem.includes('wall') || rem.includes('fence') || rem.includes('mason') || rem.includes('brick')) {
        return 'Perimeter Masonry & Wall Construction';
      }
      if (rem.includes('muster') || rem.includes('daily') || rem.includes('wage')) {
        return 'Daily Construction Labor Muster Roll';
      }
      if (rem.includes('steel') || rem.includes('rod') || rem.includes('weld') || rem.includes('shutter')) {
        return 'Steel Binding & Shuttering Craftsmen';
      }
      return 'General Site Labor Force';

    case 'Purchase':
      if (rem.includes('cement') || rem.includes('rod') || rem.includes('steel') || rem.includes('grade')) {
        return 'Structural Cement & Steel (60-Grade Rod)';
      }
      if (rem.includes('brick') || rem.includes('sand') || rem.includes('stone') || rem.includes('aggregate')) {
        return 'Red Bricks & Sylhet Sand Aggregates';
      }
      if (rem.includes('pipe') || rem.includes('sanitary') || rem.includes('pvc') || rem.includes('conduit')) {
        return 'UPVC Drainage Pipes & Plumbing';
      }
      if (rem.includes('electr') || rem.includes('cable') || rem.includes('wire') || rem.includes('transform')) {
        return 'Electrical Conduits & Transformer Equipment';
      }
      return 'Construction Materials Procurement';

    case 'Electricity Bill':
      if (rem.includes('substation') || rem.includes('meter') || rec.includes('desco')) {
        return 'DESCO Construction Substation Meter';
      }
      if (rem.includes('generator') || rem.includes('diesel') || rem.includes('fuel')) {
        return 'Backup Generator Fuel & Upkeep';
      }
      return 'Site Electrical & Illumination Utility';

    case 'Water Bill':
      if (rem.includes('tube-well') || rem.includes('tubewell') || rem.includes('boring') || rem.includes('permit') || rem.includes('deep')) {
        return 'Deep Tube-well Permit & Boring';
      }
      if (rem.includes('tanker') || rem.includes('bulk') || rem.includes('curing')) {
        return 'Bulk Water Supply for Concrete Curing';
      }
      return 'DWASA Water Utility & Conduits';

    case 'Salary':
      if (rem.includes('staff') || rem.includes('guard') || rem.includes('manager') || rem.includes('supervisor')) {
        return 'Site Operations & Security Guard Payroll';
      }
      if (rem.includes('engineer') || rem.includes('technical') || rem.includes('supervisor')) {
        return 'Civil Engineer & Site Supervisory Payroll';
      }
      return 'Administrative Site Operations Payroll';

    case 'EC Honorarium':
      if (rem.includes('resolution') || rem.includes('monthly') || rem.includes('president') || rem.includes('treasurer')) {
        return 'Executive Leadership Monthly Honorarium';
      }
      return 'Committee Governance Allowance';

    case 'Security':
      if (rem.includes('cctv') || rem.includes('camera') || rem.includes('streetlight') || rem.includes('solar')) {
        return 'CCTV Perimeter Surveillance & Lighting';
      }
      if (rem.includes('guard') || rem.includes('elite') || rem.includes('patrol')) {
        return 'Uniformed Security Guard Force Retainer';
      }
      return 'Perimeter Security Protection';

    case 'Legal & Registration':
      if (rem.includes('deed') || rem.includes('vetting') || rem.includes('porcha')) {
        return 'Deed Porcha & Sub-Registry Vetting';
      }
      if (rem.includes('mutation') || rem.includes('rajuk')) {
        return 'Land Mutation & Regulatory Approvals';
      }
      return 'Legal Counsel & Government Statutory Fees';

    case 'Maintenance':
      if (rem.includes('excavator') || rem.includes('repair') || rem.includes('machine')) {
        return 'Heavy Machinery Maintenance & Repair';
      }
      return 'Site Facility & Equipment Upkeep';

    case 'Meeting Expense':
      if (rem.includes('agm') || rem.includes('hall')) {
        return 'AGM Assembly & Hall Logistics';
      }
      return 'Executive Committee Meetings & Refreshments';

    case 'Audit & Compliance':
      if (rem.includes('ca') || rem.includes('chartered') || rem.includes('audit')) {
        return 'Statutory Chartered Accountant Audit';
      }
      return 'Cooperative Department Regulatory Filing';

    default:
      return 'General Operations & Procurement';
  }
}

/**
 * Computes full category and sub-category breakdown of project expenses
 */
export function computeProjectExpenseCategoryBreakdown(
  expenses: ExpenseEntry[]
): ProjectExpenseDetailedAnalysis {
  const approved = expenses.filter((e) => e.status === 'APPROVED' && !e.isSoftDeleted);
  const pending = expenses.filter((e) => e.status === 'PENDING' && !e.isSoftDeleted);

  const totalProjectExpense = approved.reduce((sum, e) => sum + e.amount, 0);
  const perShareExpense = TOTAL_SHARES > 0 ? totalProjectExpense / TOTAL_SHARES : 0;
  const pendingAmount = pending.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const categoryMap: Record<
    string,
    {
      totalAmount: number;
      items: ExpenseEntry[];
      subCategoryMap: Record<string, { totalAmount: number; items: ExpenseEntry[] }>;
    }
  > = {};

  approved.forEach((exp) => {
    const cat = exp.category || 'Others';
    const subCat = getExpenseSubCategory(exp);

    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        totalAmount: 0,
        items: [],
        subCategoryMap: {},
      };
    }

    categoryMap[cat].totalAmount += exp.amount;
    categoryMap[cat].items.push(exp);

    if (!categoryMap[cat].subCategoryMap[subCat]) {
      categoryMap[cat].subCategoryMap[subCat] = {
        totalAmount: 0,
        items: [],
      };
    }
    categoryMap[cat].subCategoryMap[subCat].totalAmount += exp.amount;
    categoryMap[cat].subCategoryMap[subCat].items.push(exp);
  });

  const categories: ExpenseCategoryBreakdown[] = Object.entries(categoryMap)
    .map(([catName, catData]) => {
      const percentageOfTotal =
        totalProjectExpense > 0 ? (catData.totalAmount / totalProjectExpense) * 100 : 0;
      const perShareAmount = TOTAL_SHARES > 0 ? catData.totalAmount / TOTAL_SHARES : 0;

      const subCategories: ExpenseSubCategoryBreakdown[] = Object.entries(
        catData.subCategoryMap
      )
        .map(([subName, subData]) => {
          const percentageOfCategory =
            catData.totalAmount > 0 ? (subData.totalAmount / catData.totalAmount) * 100 : 0;
          const percentageOfSubTotal =
            totalProjectExpense > 0 ? (subData.totalAmount / totalProjectExpense) * 100 : 0;
          const subPerShare = TOTAL_SHARES > 0 ? subData.totalAmount / TOTAL_SHARES : 0;

          return {
            name: subName,
            totalAmount: subData.totalAmount,
            perShareAmount: subPerShare,
            percentageOfCategory,
            percentageOfTotal: percentageOfSubTotal,
            transactionCount: subData.items.length,
            items: subData.items,
          };
        })
        .sort((a, b) => b.totalAmount - a.totalAmount);

      return {
        category: catName,
        totalAmount: catData.totalAmount,
        perShareAmount,
        percentageOfTotal,
        transactionCount: catData.items.length,
        subCategories,
        items: catData.items,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    totalProjectExpense,
    perShareExpense,
    approvedCount: approved.length,
    pendingCount: pending.length,
    pendingAmount,
    categories,
  };
}
