import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Plus,
  ZoomIn,
  Calendar,
  User,
  Tag,
} from 'lucide-react';
import { EntryAttachment, User as UserType } from '../types';
import { storageService } from '../services/storageService';
import { formatBDT } from '../utils/calculations';

interface EntryAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryType: 'INCOME' | 'EXPENSE';
  entryId: string;
  entryTitle: string; // e.g. "DEP-2026-001 - Monthly Contribution"
  entryAmount: number;
  entryDate: string;
  recipientOrMember: string;
  attachments?: EntryAttachment[];
  currentUser: UserType | null;
  onAttachmentChanged: () => void;
}

export const EntryAttachmentModal: React.FC<EntryAttachmentModalProps> = ({
  isOpen,
  onClose,
  entryType,
  entryId,
  entryTitle,
  entryAmount,
  entryDate,
  recipientOrMember,
  attachments = [],
  currentUser,
  onAttachmentChanged,
}) => {
  const [activePreview, setActivePreview] = useState<EntryAttachment | null>(null);
  const [docType, setDocType] = useState<EntryAttachment['documentType']>(
    entryType === 'INCOME' ? 'Receipt' : 'Voucher'
  );
  const [docNote, setDocNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const isOfficialOrAdmin = storageService.isOfficialOrAdmin(currentUser);

  const processFile = (file: File) => {
    setUploadError('');
    setUploadSuccess('');

    // Check size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    const reader = new FileReader();
    setIsUploading(true);

    reader.onload = (e) => {
      try {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          throw new Error('Failed to read file content.');
        }

        const attachmentPayload: Omit<EntryAttachment, 'id' | 'uploadedAt'> = {
          name: file.name,
          size: file.size,
          type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          dataUrl,
          uploadedBy: currentUser?.username || currentUser?.id || 'unknown',
          uploadedByName: currentUser?.name || 'Staff User',
          documentType: docType,
          note: docNote.trim() || undefined,
        };

        if (entryType === 'INCOME') {
          if (!currentUser) throw new Error('You must be logged in to upload attachments.');
          storageService.addIncomeAttachment(entryId, attachmentPayload, currentUser);
        } else {
          if (!currentUser) throw new Error('You must be logged in to upload attachments.');
          storageService.addExpenseAttachment(entryId, attachmentPayload, currentUser);
        }

        setUploadSuccess(`Successfully attached "${file.name}" to ${entryId}`);
        setDocNote('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onAttachmentChanged();
      } catch (err: any) {
        setUploadError(err.message || 'Error saving attachment');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Failed to read document from disk.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDelete = (attachmentId: string, attachmentName: string) => {
    if (!currentUser) return;
    if (!window.confirm(`Are you sure you want to remove supporting document "${attachmentName}"?`)) {
      return;
    }

    try {
      if (entryType === 'INCOME') {
        storageService.removeIncomeAttachment(entryId, attachmentId, currentUser);
      } else {
        storageService.removeExpenseAttachment(entryId, attachmentId, currentUser);
      }
      setUploadSuccess(`Attachment "${attachmentName}" removed.`);
      if (activePreview?.id === attachmentId) {
        setActivePreview(null);
      }
      onAttachmentChanged();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to remove attachment.');
    }
  };

  const handleDownload = (att: EntryAttachment) => {
    const link = document.createElement('a');
    link.href = att.dataUrl;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl shrink-0 ${
              entryType === 'INCOME' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              <Paperclip className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  Supporting Documents & Attachments
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                  entryType === 'INCOME'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {entryId}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {recipientOrMember} • {entryDate} • {formatBDT(entryAmount)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Banners */}
          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{uploadSuccess}</span>
              </div>
              <button onClick={() => setUploadSuccess('')} className="text-slate-400 hover:text-white shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between gap-2 shadow">
              <div className="flex items-center gap-2 truncate">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">{uploadError}</span>
              </div>
              <button onClick={() => setUploadError('')} className="text-slate-400 hover:text-white shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached Files Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Uploaded Documents ({attachments.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Vouchers, receipts, cash memos & bank confirmation slips
              </span>
            </div>

            {attachments.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
                <Paperclip className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No supporting documents attached yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload a photo of the cash memo, receipt voucher, cheque leaf, or bank transaction slip below.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((att) => {
                  const isImage = att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image/');
                  const isPdf = att.type?.includes('pdf') || att.name.toLowerCase().endsWith('.pdf');
                  const canDelete = isOfficialOrAdmin || att.uploadedBy === currentUser?.username || att.uploadedBy === currentUser?.id;

                  return (
                    <div
                      key={att.id}
                      className="group relative p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail / Icon */}
                        <div
                          onClick={() => setActivePreview(att)}
                          className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-90 transition relative"
                        >
                          {isImage ? (
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-6 h-6 text-emerald-400" />
                          )}
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-bold border border-slate-700 uppercase">
                              {att.documentType || 'Receipt'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {(att.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <p
                            onClick={() => setActivePreview(att)}
                            className="text-xs font-semibold text-slate-200 truncate cursor-pointer hover:text-emerald-400 transition mt-0.5"
                            title={att.name}
                          >
                            {att.name}
                          </p>
                          {att.note && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                              "{att.note}"
                            </p>
                          )}
                          <p className="text-[10px] text-slate-500 mt-1">
                            By {att.uploadedByName || att.uploadedBy} • {att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString('en-GB') : 'Recent'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <button
                          onClick={() => setActivePreview(att)}
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDownload(att)}
                            title="Download file"
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(att.id, att.name)}
                              title="Delete attachment"
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upload New Attachment Dropzone */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-teal-400" />
              <span>Attach Supporting Document</span>
            </h4>

            {/* Document metadata inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Receipt">Receipt Voucher</option>
                  <option value="Voucher">Expense Voucher</option>
                  <option value="Invoice">Supplier Invoice / Bill</option>
                  <option value="Memo">Cash Memo</option>
                  <option value="Cheque">Cheque Leaf / Deposit Counterfoil</option>
                  <option value="Bank Slip">Bank Deposit / EFT Slip</option>
                  <option value="Other">Other Supporting Document</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Document Note / Voucher Reference (Optional)
                </label>
                <input
                  type="text"
                  value={docNote}
                  onChange={(e) => setDocNote(e.target.value)}
                  placeholder="e.g., EBL Bank Slip #44901 or Hardware Bill #12"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center ${
                dragOver
                  ? 'border-teal-400 bg-teal-950/20'
                  : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 mb-2">
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {isUploading ? 'Encoding & Saving Attachment...' : 'Click to browse or drag file here'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supports JPG, PNG, WEBP, or PDF (Max 5 MB)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Total Attachments: {attachments.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Full-Screen Image / Document Preview Lightbox */}
      {activePreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Lightbox Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-bold text-white truncate">{activePreview.name}</h4>
                <p className="text-[11px] text-slate-400">
                  {activePreview.documentType || 'Receipt'} • {(activePreview.size / 1024).toFixed(1)} KB • Uploaded by {activePreview.uploadedByName || activePreview.uploadedBy}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(activePreview)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setActivePreview(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Content */}
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950/70 flex-1 min-h-[300px]">
              {activePreview.type?.startsWith('image/') || activePreview.dataUrl?.startsWith('data:image/') ? (
                <img
                  src={activePreview.dataUrl}
                  alt={activePreview.name}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
                />
              ) : activePreview.type?.includes('pdf') || activePreview.name.toLowerCase().endsWith('.pdf') ? (
                <div className="w-full h-[65vh] flex flex-col items-center justify-center">
                  <iframe
                    src={activePreview.dataUrl}
                    title={activePreview.name}
                    className="w-full h-full rounded-lg border border-slate-800 bg-white"
                  />
                </div>
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-300 font-semibold mb-2">Preview not directly available for this format</p>
                  <button
                    onClick={() => handleDownload(activePreview)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download to View ({activePreview.name})</span>
                  </button>
                </div>
              )}
            </div>

            {activePreview.note && (
              <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-slate-400">Note: </span>
                {activePreview.note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
