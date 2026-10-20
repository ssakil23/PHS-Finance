import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Layers,
} from 'lucide-react';
import { User, ExpenseEntry, TransactionTier, EntryStatus } from '../types';
import { storageService } from '../services/storageService';
import { formatBDT } from '../utils/calculations';

interface ExpenseCSVImportModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number, totalAmount: number) => void;
}

interface ParsedExpenseRow {
  rowNum: number;
  category: string;
  amount: number;
  date: string;
  billRecipient: string;
  voucherNumber?: string;
  tier: TransactionTier;
  remarks: string;
  isValid: boolean;
  errors: string[];
}

const EXPENSE_TIERS: TransactionTier[] = ['Tier-1', 'Tier-2', 'Tier-3', 'Tier-4', 'Tier-5'];

export const splitCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
};

export const parseExpenseCSVText = (text: string, knownCategories: string[]): ParsedExpenseRow[] => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const headerTokens = splitCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const isHeaderRow =
    headerTokens.some((t) => t.includes('category') || t.includes('expense') || t.includes('type')) &&
    headerTokens.some((t) => t.includes('amount') || t.includes('bdt') || t.includes('cost') || t.includes('taka'));

  // Default column indexes
  let colCategory = 0;
  let colAmount = 1;
  let colDate = 2;
  let colPayee = 3;
  let colVoucher = 4;
  let colTier = 5;
  let colRemarks = 6;

  let startIndex = 0;
  if (isHeaderRow) {
    startIndex = 1;
    headerTokens.forEach((tok, idx) => {
      if (tok.includes('cat') || tok.includes('head') || tok.includes('purpose')) colCategory = idx;
      else if (tok.includes('amount') || tok.includes('bdt') || tok.includes('taka') || tok.includes('cost')) colAmount = idx;
      else if (tok.includes('date') || tok.includes('time')) colDate = idx;
      else if (tok.includes('payee') || tok.includes('recipient') || tok.includes('vendor') || tok.includes('contractor') || tok.includes('bill')) colPayee = idx;
      else if (tok.includes('voucher') || tok.includes('vch') || tok.includes('ref') || tok.includes('inv')) colVoucher = idx;
      else if (tok.includes('tier')) colTier = idx;
      else if (tok.includes('remark') || tok.includes('note') || tok.includes('desc') || tok.includes('memo')) colRemarks = idx;
    });
  }

  const parsed: ParsedExpenseRow[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    const rawCategory = cols[colCategory] || '';
    const rawAmount = cols[colAmount] || '';
    const rawDate = cols[colDate] || '';
    const rawPayee = cols[colPayee] || '';
    const rawVoucher = cols[colVoucher] || '';
    const rawTier = cols[colTier] || '';
    const rawRemarks = cols[colRemarks] || '';

    const errors: string[] = [];

    // Category validation
    let resolvedCategory = rawCategory.trim() || 'Site Development';
    if (!rawCategory.trim()) {
      errors.push('Expense Category is missing.');
    } else {
      // Find matching case-insensitive category
      const matchedCat = knownCategories.find((c) => c.toLowerCase() === rawCategory.trim().toLowerCase());
      if (matchedCat) {
        resolvedCategory = matchedCat;
      }
    }

    // Amount validation
    const numAmount = parseFloat(rawAmount.replace(/[^0-9.-]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      errors.push(`Invalid Amount: "${rawAmount}". Must be positive number.`);
    }

    // Date validation
    let resolvedDate = rawDate.trim();
    if (!resolvedDate) {
      resolvedDate = new Date().toISOString().split('T')[0];
    } else {
      // Clean date like 2026-03-20 or 20/03/2026
      if (resolvedDate.includes('/')) {
        const parts = resolvedDate.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            resolvedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else if (parts[0].length === 4) {
            resolvedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        }
      }
      const parsedTime = Date.parse(resolvedDate);
      if (isNaN(parsedTime)) {
        errors.push(`Invalid Date format: "${rawDate}". Use YYYY-MM-DD.`);
      }
    }

    // Payee / Bill Recipient validation
    const resolvedPayee = rawPayee.trim();
    if (!resolvedPayee) {
      errors.push('Bill Recipient (Payee / Contractor / Authority) is required.');
    }

    // Tier validation
    let resolvedTier: TransactionTier = 'Tier-1';
    if (rawTier.trim()) {
      const matchTier = EXPENSE_TIERS.find(
        (t) => t.toLowerCase() === rawTier.trim().toLowerCase() || t.replace('-', '').toLowerCase() === rawTier.trim().toLowerCase()
      );
      if (matchTier) {
        resolvedTier = matchTier;
      } else {
        // Soft fallback with warning or default
        resolvedTier = 'Tier-1';
      }
    }

    parsed.push({
      rowNum: i + 1,
      category: resolvedCategory,
      amount: isNaN(numAmount) ? 0 : Math.round(numAmount),
      date: resolvedDate,
      billRecipient: resolvedPayee || 'Unspecified Contractor',
      voucherNumber: rawVoucher.trim() || undefined,
      tier: resolvedTier,
      remarks: rawRemarks.trim() || 'Bulk CSV Import',
      isValid: errors.length === 0,
      errors,
    });
  }

  return parsed;
};

export const ExpenseCSVImportModal: React.FC<ExpenseCSVImportModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'PASTE'>('UPLOAD');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedExpenseRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [importStatusMode, setImportStatusMode] = useState<EntryStatus>(
    currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'DELEGATED_ADMIN' ? 'APPROVED' : 'PENDING'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const knownCategories = storageService.getExpenseCategories();

  if (!isOpen) return null;

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);
  const totalImportAmount = validRows.reduce((sum, r) => sum + r.amount, 0);

  // Download Predefined CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'Category,Amount,Date,Bill Recipient (Payee),Voucher Number,Tier,Remarks\n' +
      'Site Development,120000,2026-03-20,Meghna Construction Ltd,VCH-2026-042,Tier-1,Earth moving & ground compaction payment\n' +
      'Security,45000,2026-03-22,Apex Security Services,VCH-2026-043,Tier-2,Gate 1 & Gate 2 March site protection\n' +
      'Labor,35000,2026-03-24,Daily Labor Union,VCH-2026-044,Tier-1,Boundary wall foundation bricklaying\n' +
      'Electricity Bill,18500,2026-03-25,DESCO Site Line,VCH-2026-045,Tier-3,Site lighting and water drainage pump bill\n' +
      'Meeting Expense,12500,2026-03-26,Board Conference Catering,VCH-2026-046,Tier-2,Quarterly steering committee refreshments\n' +
      'Purchase,65000,2026-03-27,Bashundhara Cement Depot,VCH-2026-047,Tier-1,100 bags composite Portland cement\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'PHS_Operational_Expense_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
        const parsed = parseExpenseCSVText(text, knownCategories);
        setParsedRows(parsed);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected CSV file. Please check file formatting.');
    };
    reader.readAsText(file);
  };

  // Handle Text Paste Change
  const handleTextChange = (text: string) => {
    setRawText(text);
    setErrorMsg('');
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    const parsed = parseExpenseCSVText(text, knownCategories);
    setParsedRows(parsed);
  };

  // Execute Bulk Import
  const handleExecuteImport = () => {
    if (!currentUser) return;
    setErrorMsg('');

    if (validRows.length === 0) {
      setErrorMsg('No valid expense entries found to import. Please review validation errors.');
      return;
    }

    setIsProcessing(true);
    try {
      const entriesToCreate = validRows.map((r) => ({
        category: r.category,
        amount: r.amount,
        date: r.date,
        billRecipient: r.billRecipient,
        voucherNumber: r.voucherNumber,
        tier: r.tier,
        remarks: r.remarks,
        status: importStatusMode,
      }));

      const res = storageService.bulkImportExpenses(entriesToCreate, currentUser);

      if (res.success) {
        onSuccess(res.count, res.totalAmount);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Bulk expense import failed. Please verify your permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Bulk Operational Expense CSV Import</span>
                <span className="text-[10px] font-mono text-rose-300 bg-rose-950/70 border border-rose-800/60 px-2 py-0.5 rounded">
                  Disbursements Ledger
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload operational or site development expense vouchers in bulk using the standard CSV template.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="Download standard 7-column CSV template"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Download Template</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('UPLOAD')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'UPLOAD'
                    ? 'bg-rose-700 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload CSV File</span>
              </button>
              <button
                onClick={() => setActiveTab('PASTE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'PASTE'
                    ? 'bg-rose-700 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Raw CSV Text</span>
              </button>
            </div>

            {/* Approval Status Toggle for Admins */}
            {(currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'DELEGATED_ADMIN') && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Import Status:</span>
                <select
                  value={importStatusMode}
                  onChange={(e) => setImportStatusMode(e.target.value as EntryStatus)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="APPROVED">Auto-Approve (Direct Ledger Credit)</option>
                  <option value="PENDING">Pending Approval (Requires Review)</option>
                </select>
              </div>
            )}
          </div>

          {/* Tab 1: Upload Dropzone */}
          {activeTab === 'UPLOAD' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 transition space-y-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto group-hover:scale-105 transition">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {fileName ? fileName : 'Choose CSV file or drag and drop here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports comma-separated values (.csv) with headers: Category, Amount, Date, Bill Recipient, Voucher Number, Tier, Remarks
                </p>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 bg-slate-800 group-hover:bg-rose-700 text-slate-200 group-hover:text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5"
              >
                <span>Browse Local Computer</span>
              </button>
            </div>
          ) : (
            /* Tab 2: Raw Text Paste */
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Raw CSV Text (with or without headers):</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Category, Amount, Date, Payee, Voucher, Tier, Remarks
                </span>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`Site Development,120000,2026-03-20,Meghna Construction Ltd,VCH-2026-042,Tier-1,Earth moving & leveling\nSecurity,45000,2026-03-22,Apex Security Services,VCH-2026-043,Tier-2,Gate 1 & Gate 2 deployment`}
                rows={7}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Validation Metrics Strip */}
          {parsedRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-slate-400">Total Rows Detected</div>
                <div className="text-lg font-bold font-mono text-white">{parsedRows.length}</div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-emerald-400">Valid Entries</div>
                <div className="text-lg font-bold font-mono text-emerald-400">{validRows.length}</div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-rose-400">Invalid Rows</div>
                <div className="text-lg font-bold font-mono text-rose-400">{invalidRows.length}</div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-slate-400">Total Valid Outlay</div>
                <div className="text-lg font-bold font-mono text-rose-300">{formatBDT(totalImportAmount)}</div>
              </div>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Validation Preview Table:</span>
                <span className="text-slate-400">
                  {validRows.length} of {parsedRows.length} rows ready for entry
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Amount (BDT)</th>
                      <th className="py-2 px-3">Payee / Recipient</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Tier</th>
                      <th className="py-2 px-3">Voucher</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {parsedRows.map((r) => (
                      <tr
                        key={r.rowNum}
                        className={r.isValid ? 'hover:bg-slate-900/50' : 'bg-rose-950/20 text-rose-200'}
                      >
                        <td className="py-2 px-3 text-slate-500 font-sans">{r.rowNum}</td>
                        <td className="py-2 px-3 font-sans text-white font-medium">{r.category}</td>
                        <td className="py-2 px-3 text-right text-rose-300 font-bold">{formatBDT(r.amount)}</td>
                        <td className="py-2 px-3 font-sans text-slate-200 truncate max-w-[140px]">{r.billRecipient}</td>
                        <td className="py-2 px-3 text-slate-400">{r.date}</td>
                        <td className="py-2 px-3 font-sans">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {r.tier}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{r.voucherNumber || '—'}</td>
                        <td className="py-2 px-3 text-center font-sans">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-rose-400"
                              title={r.errors.join('; ')}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {validRows.length > 0 ? (
              <span>
                Ready to import <strong className="text-white">{validRows.length}</strong> operational expenses totalling{' '}
                <strong className="text-rose-400">{formatBDT(totalImportAmount)}</strong>.
              </span>
            ) : (
              <span>Upload or paste a CSV file to validate entries before committing to the expense ledger.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              disabled={validRows.length === 0 || isProcessing}
              onClick={handleExecuteImport}
              className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 transition ${
                validRows.length > 0 && !isProcessing
                  ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Importing Entries...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Commit {validRows.length} Expenses</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
