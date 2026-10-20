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
  Users,
  Shield,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { User, Member } from '../types';
import { storageService } from '../services/storageService';

interface MemberDataCSVImportModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCount: number) => void;
  membersList?: Member[];
}

interface ParsedMemberRow {
  rowNum: number;
  rawMemberId: string;
  matchedMemberId?: string;
  existingMember?: Member;
  name?: string;
  phone?: string;
  email?: string;
  currentAddress?: string;
  permanentAddress?: string;
  spouseName?: string;
  spouseMobile?: string;
  isValid: boolean;
  errors: string[];
  changedFields: string[];
}

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

export const parseMemberCSVText = (text: string, currentMembers: Member[]): ParsedMemberRow[] => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const headerTokens = splitCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const isHeaderRow =
    headerTokens.some((t) => t.includes('member') || t.includes('id') || t.includes('share')) &&
    headerTokens.some((t) => t.includes('name') || t.includes('phone') || t.includes('email') || t.includes('address'));

  // Default column positions:
  // Member ID, Full Name, Primary Phone, Official Email, Current Address (Plot / Residence), Permanent Address, Spouse Name, Spouse Mobile
  let colId = 0;
  let colName = 1;
  let colPhone = 2;
  let colEmail = 3;
  let colCurrentAddr = 4;
  let colPermAddr = 5;
  let colSpouseName = 6;
  let colSpouseMobile = 7;

  let startIndex = 0;
  if (isHeaderRow) {
    startIndex = 1;
    headerTokens.forEach((tok, idx) => {
      if (tok.includes('member') || tok.includes('shareowner') || tok === 'id') colId = idx;
      else if (tok.includes('fullname') || tok === 'name') colName = idx;
      else if (tok.includes('phone') && !tok.includes('spouse') || tok.includes('mobile') && !tok.includes('spouse')) colPhone = idx;
      else if (tok.includes('email') || tok.includes('mail')) colEmail = idx;
      else if (tok.includes('current') || tok.includes('plot') || tok.includes('residence') || tok.includes('present')) colCurrentAddr = idx;
      else if (tok.includes('permanent') || tok.includes('village')) colPermAddr = idx;
      else if (tok.includes('spousename') || tok.includes('spouse') && !tok.includes('mobile') && !tok.includes('phone')) colSpouseName = idx;
      else if (tok.includes('spousemobile') || tok.includes('spousephone') || tok.includes('spousetel')) colSpouseMobile = idx;
    });
  }

  const parsed: ParsedMemberRow[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    const rawId = cols[colId] || '';
    const rawName = cols[colName] || '';
    const rawPhone = cols[colPhone] || '';
    const rawEmail = cols[colEmail] || '';
    const rawCurrentAddr = cols[colCurrentAddr] || '';
    const rawPermAddr = cols[colPermAddr] || '';
    const rawSpouseName = cols[colSpouseName] || '';
    const rawSpouseMobile = cols[colSpouseMobile] || '';

    const errors: string[] = [];
    const cleanId = rawId.trim();

    if (!cleanId) {
      errors.push('Member ID is missing.');
    }

    // Match member in directory
    const cleanNum = cleanId.replace(/\D/g, '');
    const foundMember = currentMembers.find(
      (m) =>
        m.id.toLowerCase() === cleanId.toLowerCase() ||
        (cleanNum && String(m.shareNumber) === cleanNum) ||
        m.id.toLowerCase() === `phsm-${cleanNum.padStart(3, '0')}`.toLowerCase()
    );

    if (cleanId && !foundMember) {
      errors.push(`Member ID "${cleanId}" not found in registered 144 shareholders.`);
    }

    // Detect changed fields compared to existing record
    const changedFields: string[] = [];
    if (foundMember) {
      if (rawName.trim() && rawName.trim() !== foundMember.name) changedFields.push('Full Name');
      if (rawPhone.trim() && rawPhone.trim() !== foundMember.phone) changedFields.push('Phone');
      if (rawEmail.trim() && rawEmail.trim() !== foundMember.email) changedFields.push('Email');
      if (rawCurrentAddr.trim() && rawCurrentAddr.trim() !== foundMember.currentAddress && rawCurrentAddr.trim() !== foundMember.address) {
        changedFields.push('Current Address');
      }
      if (rawPermAddr.trim() && rawPermAddr.trim() !== foundMember.permanentAddress) {
        changedFields.push('Permanent Address');
      }
      if (rawSpouseName.trim() && rawSpouseName.trim() !== foundMember.spouseName) {
        changedFields.push('Spouse Name');
      }
      if (rawSpouseMobile.trim() && rawSpouseMobile.trim() !== foundMember.spouseMobile) {
        changedFields.push('Spouse Mobile');
      }
    }

    parsed.push({
      rowNum: i + 1,
      rawMemberId: cleanId,
      matchedMemberId: foundMember?.id,
      existingMember: foundMember,
      name: rawName.trim() || undefined,
      phone: rawPhone.trim() || undefined,
      email: rawEmail.trim() || undefined,
      currentAddress: rawCurrentAddr.trim() || undefined,
      permanentAddress: rawPermAddr.trim() || undefined,
      spouseName: rawSpouseName.trim() || undefined,
      spouseMobile: rawSpouseMobile.trim() || undefined,
      isValid: errors.length === 0 && !!foundMember,
      errors,
      changedFields,
    });
  }

  return parsed;
};

export const MemberDataCSVImportModal: React.FC<MemberDataCSVImportModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSuccess,
  membersList: propMembers,
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'PASTE'>('UPLOAD');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMembers = propMembers || storageService.getMembers();

  if (!isOpen) return null;

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);
  const totalModifications = validRows.reduce((sum, r) => sum + r.changedFields.length, 0);

  // Download Predefined CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'Member ID,Full Name,Primary Phone,Official Email,Current Address (Plot / Residence),Permanent Address,Spouse Name,Spouse Mobile\n' +
      'PHSM-001,Kazi Rafiqul Islam,+8801711223344,kazi.rafiq@gmail.com,Plot 14-B Road 5 Sector 3 Uttara Dhaka,Vill: Rampur PO: Chandpur Dist: Chandpur,Nasrin Akhter,+8801711998877\n' +
      'PHSM-002,Tanvir Chowdhury,+8801819334455,tanvir.chy@yahoo.com,House 22 Road 8 Dhanmondi Dhaka,Vill: Mirpur PO: Brahmanbaria Dist: Brahmanbaria,Farhana Tanvir,+8801819887766\n' +
      'PHSM-003,Engr. Shamim Reza,+8801912445566,shamim.reza@gmail.com,Flat 4A House 12 Mirpur DOHS Dhaka,Vill: Sonargaon PO: Sonargaon Dist: Narayanganj,Shirin Sultana,+8801912998877\n' +
      'PHSM-004,Dr. Mizanur Rahman,+8801715667788,mizanur.dr@gmail.com,House 45 Road 11 Banani Dhaka,Vill: Gopalpur PO: Tangail Dist: Tangail,Dr. Rokeya Begum,+8801715112233\n' +
      'PHSM-005,Mohammad Ali Khan,+8801817556677,m.ali.khan@gmail.com,Road 2 Block C Bashundhara R/A Dhaka,Vill: Chhagalnaiya PO: Feni Dist: Feni,Salma Begum,+8801817112244\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'PHS_Member_Basic_Data_Template.csv');
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
        const parsed = parseMemberCSVText(text, currentMembers);
        setParsedRows(parsed);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected CSV file. Please verify formatting.');
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
    const parsed = parseMemberCSVText(text, currentMembers);
    setParsedRows(parsed);
  };

  // Execute Bulk Import
  const handleExecuteImport = () => {
    if (!currentUser) return;
    setErrorMsg('');

    if (validRows.length === 0) {
      setErrorMsg('No valid member rows found to update. Please review errors below.');
      return;
    }

    setIsProcessing(true);
    try {
      const rowsToUpdate = validRows.map((r) => ({
        memberId: r.matchedMemberId || r.rawMemberId,
        name: r.name,
        phone: r.phone,
        email: r.email,
        currentAddress: r.currentAddress,
        permanentAddress: r.permanentAddress,
        spouseName: r.spouseName,
        spouseMobile: r.spouseMobile,
      }));

      const res = storageService.bulkImportMembersBasicData(rowsToUpdate, currentUser);

      if (res.success) {
        onSuccess(res.updatedCount);
        onClose();
      } else {
        setErrorMsg('No members were updated. Please check matching IDs.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Bulk member data import failed.');
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
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Bulk Update Members Basic Data (CSV)</span>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded">
                  Member Registry
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Update Full Name, Primary Phone, Official Email, Current & Permanent Address, Spouse Name, and Spouse Mobile by Member ID.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="Download standard 8-column Member demographic CSV template"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
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
          {/* Privacy & Safety Banner */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Credential Safety Guarantee:</strong> Bulk demographic updating modifies only contact and residential fields. Existing passwords, user roles, share counts (1/144), controlling directors, and KYC archives are strictly preserved.
            </span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('UPLOAD')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'UPLOAD'
                  ? 'bg-indigo-600 text-white shadow'
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
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Raw CSV Text</span>
            </button>
          </div>

          {/* Tab 1: Upload Dropzone */}
          {activeTab === 'UPLOAD' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 transition space-y-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto group-hover:scale-105 transition">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {fileName ? fileName : 'Choose Member CSV file or drag and drop here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Headers: Member ID, Full Name, Primary Phone, Official Email, Current Address, Permanent Address, Spouse Name, Spouse Mobile
                </p>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 bg-slate-800 group-hover:bg-indigo-600 text-slate-200 group-hover:text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5"
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
                  Member ID, Name, Phone, Email, Current Addr, Permanent Addr, Spouse Name, Spouse Mobile
                </span>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`PHSM-001,Kazi Rafiqul Islam,+8801711223344,kazi.rafiq@gmail.com,Plot 14-B Road 5 Uttara,Vill: Rampur PO: Chandpur,Nasrin Akhter,+8801711998877\nPHSM-002,Tanvir Chowdhury,+8801819334455,tanvir.chy@yahoo.com,House 22 Road 8 Dhanmondi,Vill: Mirpur PO: Brahmanbaria,Farhana Tanvir,+8801819887766`}
                rows={7}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Validation Metrics Strip */}
          {parsedRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-slate-400">Total Rows Processed</div>
                <div className="text-lg font-bold font-mono text-white">{parsedRows.length}</div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-emerald-400">Matched Shareholders</div>
                <div className="text-lg font-bold font-mono text-emerald-400">{validRows.length}</div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-rose-400">Unmatched / Invalid</div>
                <div className="text-lg font-bold font-mono text-rose-400">{invalidRows.length}</div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[11px] text-indigo-400">Field Updates Detected</div>
                <div className="text-lg font-bold font-mono text-indigo-300">{totalModifications}</div>
              </div>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Member Matching & Verification Preview:</span>
                <span className="text-slate-400">
                  {validRows.length} of {parsedRows.length} members matched to official registry
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Member ID</th>
                      <th className="py-2 px-3">Current Registry Name</th>
                      <th className="py-2 px-3">Updated Full Name</th>
                      <th className="py-2 px-3">Primary Phone</th>
                      <th className="py-2 px-3">Official Email</th>
                      <th className="py-2 px-3">Current Address</th>
                      <th className="py-2 px-3">Spouse Info</th>
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
                        <td className="py-2 px-3 font-bold text-emerald-400">
                          {r.matchedMemberId || r.rawMemberId}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-300 truncate max-w-[130px]">
                          {r.existingMember?.name || '—'}
                        </td>
                        <td className="py-2 px-3 font-sans text-white font-medium truncate max-w-[130px]">
                          {r.name || r.existingMember?.name || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-300">{r.phone || r.existingMember?.phone || '—'}</td>
                        <td className="py-2 px-3 text-slate-400 truncate max-w-[120px]">
                          {r.email || r.existingMember?.email || '—'}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-300 truncate max-w-[140px]" title={r.currentAddress}>
                          {r.currentAddress || r.existingMember?.currentAddress || r.existingMember?.address || '—'}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-300 truncate max-w-[120px]">
                          {r.spouseName ? `${r.spouseName} (${r.spouseMobile || 'No Tel'})` : r.existingMember?.spouseName ? `${r.existingMember.spouseName}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          {r.isValid ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-400"
                              title={r.changedFields.length > 0 ? `Changes: ${r.changedFields.join(', ')}` : 'Identical to current registry'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{r.changedFields.length > 0 ? `${r.changedFields.length} edits` : 'Matched'}</span>
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
                Ready to update demographic & contact data for <strong className="text-white">{validRows.length}</strong> official shareholders.
              </span>
            ) : (
              <span>Select or paste a CSV file to validate member identifiers before applying updates.</span>
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
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Applying Updates...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Update {validRows.length} Members</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
