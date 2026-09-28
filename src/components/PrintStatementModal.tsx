import React from 'react';
import { X, Printer, Building2, CheckCircle2, Shield } from 'lucide-react';
import { MemberFinancialSummary, formatBDT } from '../utils/calculations';
import { IncomeEntry, ExpenseEntry } from '../types';

interface PrintStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'MEMBER_STATEMENT' | 'INCOME_VOUCHER' | 'EXPENSE_VOUCHER';
  memberSummary?: MemberFinancialSummary;
  memberDeposits?: IncomeEntry[];
  incomeEntry?: IncomeEntry;
  expenseEntry?: ExpenseEntry;
}

export const PrintStatementModal: React.FC<PrintStatementModalProps> = ({
  isOpen,
  onClose,
  type,
  memberSummary,
  memberDeposits = [],
  incomeEntry,
  expenseEntry,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Official Society Voucher / Statement Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet (Standard White paper styling on print) */}
        <div className="p-8 bg-white text-slate-900 print:p-0 print:m-0" id="printable-voucher-content">
          {/* Header Letterhead */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                PHS
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                Prottasha Housing Society Ltd.
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Registered Central Office: Sector 14, Uttara Model Town, Dhaka-1230, Bangladesh
            </p>
            <p className="text-[11px] text-slate-500">
              Department of Accounts, Share Allocation & Governance • 144 Share Collective Registry
            </p>
          </div>

          {/* DOCUMENT CONTENT 1: MEMBER STATEMENT */}
          {type === 'MEMBER_STATEMENT' && memberSummary && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                    Shareholder Financial Statement (Joma & Khorch)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Statement Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded border border-slate-300">
                    Member ID: {memberSummary.memberId}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Share #{memberSummary.shareNumber} of 144
                  </div>
                </div>
              </div>

              {/* Dossier Information */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <div><span className="text-slate-500">Member Name:</span> <strong>{memberSummary.member.name}</strong></div>
                  <div className="mt-1"><span className="text-slate-500">Mobile Phone:</span> <strong>{memberSummary.member.phone}</strong></div>
                  <div className="mt-1"><span className="text-slate-500">Email:</span> {memberSummary.member.email}</div>
                </div>
                <div>
                  <div><span className="text-slate-500">Controlling Director:</span> <strong>{memberSummary.controllingDirector.name}</strong></div>
                  <div className="mt-1"><span className="text-slate-500">Plot Reference:</span> {memberSummary.member.address}</div>
                  <div className="mt-1"><span className="text-slate-500">Member Status:</span> <strong className="text-emerald-700">Active Shareholder</strong></div>
                </div>
              </div>

              {/* Core Financial Summary Matrix */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-xs text-slate-500 mb-1">Total Personal Deposits (Joma)</div>
                  <div className="text-xl font-bold font-mono text-emerald-700">
                    {formatBDT(memberSummary.memberPersonalDeposit)}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-xs text-slate-500 mb-1">Share Expense Quota (1/144)</div>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {formatBDT(memberSummary.memberShareExpense)}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-xs text-slate-500 mb-1">Current Net Balance</div>
                  <div className={`text-xl font-bold font-mono ${memberSummary.currentBalance >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
                    {formatBDT(memberSummary.currentBalance)}
                  </div>
                  <div className="text-[10px] font-bold uppercase mt-1">
                    {memberSummary.currentBalance >= 0 ? 'Surplus Advance' : 'Pending Dues'}
                  </div>
                </div>
              </div>

              {/* Deposit Transactions Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Itemized Verified Deposits History
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2 px-3 border-b">Deposit ID</th>
                      <th className="py-2 px-3 border-b">Date</th>
                      <th className="py-2 px-3 border-b">Category</th>
                      <th className="py-2 px-3 border-b">Payment Method & Ref</th>
                      <th className="py-2 px-3 border-b text-right">Amount (BDT)</th>
                      <th className="py-2 px-3 border-b text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {memberDeposits.map((dep) => (
                      <tr key={dep.id}>
                        <td className="py-2 px-3 font-mono font-semibold">{dep.id}</td>
                        <td className="py-2 px-3 text-slate-600">{dep.date}</td>
                        <td className="py-2 px-3">{dep.category}</td>
                        <td className="py-2 px-3 text-slate-600">
                          {dep.paymentMethod} {dep.referenceNumber ? `(${dep.referenceNumber})` : ''}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          {formatBDT(dep.amount)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {dep.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-right">Total Verified Deposits Credited:</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">
                        {formatBDT(memberSummary.memberPersonalDeposit)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* DOCUMENT CONTENT 2: INCOME VOUCHER */}
          {type === 'INCOME_VOUCHER' && incomeEntry && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                    Money Receipt / Deposit Voucher
                  </h2>
                  <p className="text-xs text-slate-500">Official Credit Voucher to Society Central Account</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded border border-slate-300">
                    Voucher ID: {incomeEntry.id}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Date: {incomeEntry.date}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Received From (Member / Source):</span>
                  <strong className="text-sm">{incomeEntry.memberName || incomeEntry.salesDescription}</strong>
                </div>

                {incomeEntry.shareOwnerId && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500">Share Owner ID / Share Number:</span>
                    <span className="font-mono font-bold">{incomeEntry.shareOwnerId} (Share #{incomeEntry.shareNumber})</span>
                  </div>
                )}

                {incomeEntry.controllingDirector && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500">Controlling Director:</span>
                    <strong>{incomeEntry.controllingDirector}</strong>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Purpose / Category:</span>
                  <strong className="text-emerald-800">{incomeEntry.category}</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Payment Method & Reference:</span>
                  <span>{incomeEntry.paymentMethod} {incomeEntry.referenceNumber ? `[Ref: ${incomeEntry.referenceNumber}]` : ''}</span>
                </div>

                <div className="flex justify-between items-center py-2 bg-emerald-50 px-3 rounded border border-emerald-200 mt-3">
                  <span className="text-sm font-bold text-slate-800">Total Amount Credited:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatBDT(incomeEntry.amount)}
                  </span>
                </div>
              </div>

              {incomeEntry.remarks && (
                <div className="text-xs text-slate-600 italic">
                  Remarks / Notes: {incomeEntry.remarks}
                </div>
              )}
            </div>
          )}

          {/* DOCUMENT CONTENT 3: EXPENSE VOUCHER */}
          {type === 'EXPENSE_VOUCHER' && expenseEntry && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                    Payment Disbursement Voucher
                  </h2>
                  <p className="text-xs text-slate-500">Official Society Expenditure Authorization</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded border border-slate-300">
                    Expense ID: {expenseEntry.id}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Date: {expenseEntry.date}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Paid To (Bill Recipient / Payee):</span>
                  <strong className="text-sm">{expenseEntry.billRecipient}</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Expense Category:</span>
                  <strong className="text-slate-800">{expenseEntry.category}</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Voucher / Bill Reference:</span>
                  <span className="font-mono font-bold">{expenseEntry.voucherNumber || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Submitted By:</span>
                  <span>{expenseEntry.submitterName} ({expenseEntry.submitterRole})</span>
                </div>

                <div className="flex justify-between items-center py-2 bg-rose-50 px-3 rounded border border-rose-200 mt-3">
                  <span className="text-sm font-bold text-slate-800">Total Disbursed Amount:</span>
                  <span className="text-xl font-bold font-mono text-rose-800">
                    {formatBDT(expenseEntry.amount)}
                  </span>
                </div>
              </div>

              {expenseEntry.remarks && (
                <div className="text-xs text-slate-600 italic">
                  Details / Purpose: {expenseEntry.remarks}
                </div>
              )}
            </div>
          )}

          {/* Official Signatures Strip */}
          <div className="pt-16 grid grid-cols-4 gap-4 text-center text-xs text-slate-700 border-t border-slate-200 mt-12">
            <div>
              <div className="border-t border-slate-400 pt-2 font-semibold">
                Prepared By (Manager)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Accounts Officer</div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-2 font-semibold">
                Checked By (Treasurer)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Executive Committee</div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-2 font-semibold">
                Approved By (President / GS)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Executive Committee</div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-2 font-semibold">
                Received / Member Sign
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Shareholder</div>
            </div>
          </div>

          {/* Document Verification Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Generated from PHS-Finance Central System • Valid with Society Seal</span>
            <span>Authentication ID: PHS-{Date.now().toString(36).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
