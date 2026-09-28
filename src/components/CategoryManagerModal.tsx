import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
  AlertTriangle,
  FolderTree,
  Tag,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { User, IncomeEntry, ExpenseEntry } from '../types';
import { storageService } from '../services/storageService';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialTab?: 'INCOME' | 'EXPENSE';
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'INCOME',
  incomes,
  expenses,
}) => {
  const [activeTab, setActiveTab] = useState<'INCOME' | 'EXPENSE'>(initialTab);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);

  // Add category state
  const [newCatName, setNewCatName] = useState('');
  
  // Edit category state
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editInputVal, setEditInputVal] = useState('');
  const [cascadeUpdate, setCascadeUpdate] = useState<boolean>(true);

  // Status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync categories
  const reloadCategories = () => {
    setIncomeCategories(storageService.getIncomeCategories());
    setExpenseCategories(storageService.getExpenseCategories());
  };

  useEffect(() => {
    if (isOpen) {
      reloadCategories();
      setActiveTab(initialTab);
      setEditingCatName(null);
      setNewCatName('');
      setFeedback(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';

  // Count usage of categories
  const getUsageCount = (catName: string, type: 'INCOME' | 'EXPENSE') => {
    if (type === 'INCOME') {
      return incomes.filter((i) => i.category?.toLowerCase() === catName.toLowerCase()).length;
    } else {
      return expenses.filter((e) => e.category?.toLowerCase() === catName.toLowerCase()).length;
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isSystemAdmin) {
      setFeedback({ type: 'error', message: 'Access Denied: Only SYSTEM ADMIN can manage categories.' });
      return;
    }
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Please enter a valid category name.' });
      return;
    }

    try {
      if (activeTab === 'INCOME') {
        storageService.addIncomeCategory(trimmed, currentUser);
      } else {
        storageService.addExpenseCategory(trimmed, currentUser);
      }
      setFeedback({ type: 'success', message: `Successfully added "${trimmed}" to ${activeTab} categories.` });
      setNewCatName('');
      reloadCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add category.' });
    }
  };

  const handleStartEdit = (catName: string) => {
    setEditingCatName(catName);
    setEditInputVal(catName);
    setCascadeUpdate(true);
    setFeedback(null);
  };

  const handleSaveEdit = (oldCatName: string) => {
    if (!currentUser || !isSystemAdmin) {
      setFeedback({ type: 'error', message: 'Access Denied: Only SYSTEM ADMIN can modify categories.' });
      return;
    }
    const trimmed = editInputVal.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Category name cannot be empty.' });
      return;
    }

    try {
      if (activeTab === 'INCOME') {
        storageService.updateIncomeCategory(oldCatName, trimmed, cascadeUpdate, currentUser);
      } else {
        storageService.updateExpenseCategory(oldCatName, trimmed, cascadeUpdate, currentUser);
      }
      setFeedback({
        type: 'success',
        message: `Successfully modified "${oldCatName}" to "${trimmed}"${cascadeUpdate ? ' and updated existing records.' : '.'}`,
      });
      setEditingCatName(null);
      reloadCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to modify category.' });
    }
  };

  const handleDeleteCategory = (catName: string) => {
    if (!currentUser || !isSystemAdmin) {
      setFeedback({ type: 'error', message: 'Access Denied: Only SYSTEM ADMIN can delete categories.' });
      return;
    }
    const count = getUsageCount(catName, activeTab);
    const confirmPrompt = count > 0
      ? `Warning: "${catName}" is currently assigned to ${count} active transaction(s). Are you sure you want to delete this category from future selection?`
      : `Are you sure you want to delete the category "${catName}"?`;

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      if (activeTab === 'INCOME') {
        storageService.deleteIncomeCategory(catName, currentUser);
      } else {
        storageService.deleteExpenseCategory(catName, currentUser);
      }
      setFeedback({ type: 'success', message: `Deleted category "${catName}".` });
      reloadCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete category.' });
    }
  };

  const handleResetDefaults = () => {
    if (!currentUser || !isSystemAdmin) {
      setFeedback({ type: 'error', message: 'Access Denied: Only SYSTEM ADMIN can reset categories.' });
      return;
    }
    if (window.confirm(`Reset ${activeTab} categories to standard system defaults?`)) {
      try {
        storageService.resetCategoriesToDefault(activeTab, currentUser);
        setFeedback({ type: 'success', message: `Reset ${activeTab} categories to defaults.` });
        reloadCategories();
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Failed to reset categories.' });
      }
    }
  };

  const currentCategories = activeTab === 'INCOME' ? incomeCategories : expenseCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Category Management Engine
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> System Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit, modify, add, or delete Income & Expense transaction categories.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('INCOME');
                setEditingCatName(null);
                setFeedback(null);
              }}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'INCOME'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Income Categories ({incomeCategories.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('EXPENSE');
                setEditingCatName(null);
                setFeedback(null);
              }}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'EXPENSE'
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Expense Categories ({expenseCategories.length})</span>
            </button>
          </div>

          <button
            onClick={handleResetDefaults}
            className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition mb-3"
            title="Restore default category list"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restore Defaults</span>
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white text-xs ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Add Category Bar */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={`Create new ${activeTab === 'INCOME' ? 'Income' : 'Expense'} Category...`}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Active {activeTab === 'INCOME' ? 'Income' : 'Expense'} Categories & Usage Ledger
            </div>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">
              {currentCategories.map((cat, idx) => {
                const count = getUsageCount(cat, activeTab);
                const isEditing = editingCatName === cat;

                return (
                  <div
                    key={`${cat}-${idx}`}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition"
                  >
                    {isEditing ? (
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editInputVal}
                            onChange={(e) => setEditInputVal(e.target.value)}
                            className="flex-1 bg-slate-900 border border-emerald-500/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatName(null)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                          >
                            Cancel
                          </button>
                        </div>

                        {count > 0 && (
                          <label className="flex items-center gap-2 text-[11px] text-amber-300/90 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={cascadeUpdate}
                              onChange={(e) => setCascadeUpdate(e.target.checked)}
                              className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-900"
                            />
                            <span>
                              Also automatically update <strong>{count} existing {activeTab.toLowerCase()} record(s)</strong> with this new category name.
                            </span>
                          </label>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-mono text-slate-500">
                            {idx + 1}.
                          </span>
                          <div>
                            <div className="font-semibold text-xs text-slate-200 flex items-center gap-2">
                              <span>{cat}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                                  count > 0
                                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                                    : 'bg-slate-900 text-slate-500'
                                }`}
                              >
                                {count} {count === 1 ? 'entry' : 'entries'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
                            title="Edit or rename category"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="hidden sm:inline">Modify</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 border border-rose-900/30 transition flex items-center gap-1 text-xs"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Changes synchronize immediately to forms, filters, and reports.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
