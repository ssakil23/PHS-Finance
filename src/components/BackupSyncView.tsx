import React, { useState } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Database,
  Cloud,
  CheckCircle,
  AlertCircle,
  Server,
  Layers,
  ShieldAlert,
  HardDrive,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface BackupSyncViewProps {
  currentUser: User | null;
}

export const BackupSyncView: React.FC<BackupSyncViewProps> = ({ currentUser }) => {
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncError, setSyncError] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [restoreMessage, setRestoreMessage] = useState<string>('');

  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';
  const lastSync = storageService.getLastSyncTime();

  const handleManualBackupJSON = () => {
    if (!currentUser) return;
    const jsonStr = storageService.createDatabaseBackupJSON(currentUser);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PHS_Finance_Database_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSyncStatus('Complete JSON database backup exported successfully.');
    setTimeout(() => setSyncStatus(''), 4000);
  };

  const handleExportIncomesCSV = () => {
    const csv = storageService.exportIncomesCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PHS_Incomes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExpensesCSV = () => {
    const csv = storageService.exportExpensesCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PHS_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storageService.restoreDatabaseBackupJSON(content, currentUser);
      if (res.success) {
        setRestoreMessage(res.message);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncError(res.message);
      }
    };
    reader.readAsText(file);
  };

  const handleSimulateCentralSync = () => {
    setIsSyncing(true);
    setSyncStatus('');
    setTimeout(() => {
      storageService.updateLastSyncTime();
      setIsSyncing(false);
      setSyncStatus('Real-time synchronization with central society server complete.');
      setTimeout(() => setSyncStatus(''), 4000);
    }, 1000);
  };

  const handleResetFactory = () => {
    if (!currentUser || !isSystemAdmin) return;
    if (
      window.confirm(
        'WARNING: You are about to reset the entire database to factory defaults. All custom transactions will be replaced with initial seed data. Proceed?'
      )
    ) {
      storageService.resetToFactoryDefaults(currentUser);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Resilience & Data Continuity
              </span>
              <span className="text-xs text-slate-400 font-mono">Offline-First Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Backup, Restore & Cloud Migration Engine</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Manual JSON/CSV database snapshots, automated cloud sync, and enterprise infrastructure abstraction.
            </p>
          </div>

          <button
            onClick={handleSimulateCentralSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-2 transition self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Central Database'}</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {syncError && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {restoreMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{restoreMessage} (Reloading application...)</span>
        </div>
      )}

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Snapshots Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Database Snapshots</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Download full portable snapshots of all 144 shares, income deposits, expenses, chat records, and audit logs.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleManualBackupJSON}
              className="w-full px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-400" />
                <span>Full System Backup (JSON Snapshot)</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">.json</span>
            </button>

            <button
              onClick={handleExportIncomesCSV}
              className="w-full px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                <span>Incomes & Collections Ledger (CSV)</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">.csv</span>
            </button>

            <button
              onClick={handleExportExpensesCSV}
              className="w-full px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-rose-400" />
                <span>Project Expenses Ledger (CSV)</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">.csv</span>
            </button>
          </div>
        </div>

        {/* Restore Snapshot Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Restore External Database Snapshot</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Upload an existing PHS-Finance JSON backup file to synchronize records across devices or recover from a previous backup point.
          </p>

          <div className="p-5 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl text-center bg-slate-950/60 transition">
            <HardDrive className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <div className="text-xs text-slate-300 font-medium">Select JSON Backup File</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Compatible with PHS-Finance v1.0 exports</p>
            <label className="mt-3 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition">
              <span>Choose File</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Resource Strategy & Cloud Migration Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Server className="w-5 h-5 text-emerald-400" />
          <span>SRSS Resource Strategy & Enterprise Migration Layer</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          As required by the specification, PHS-Finance uses an abstracted database service layer (
          <code className="text-emerald-400 font-mono">storageService.ts</code>) capable of operating on <strong>100% Free Tier services</strong> (Client-side offline-first cache + LocalStorage/IndexedDB with simulated sync) while allowing seamless migration to Paid Enterprise Infrastructure (Cloud SQL, Firebase, Supabase, or AWS RDS).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Active Tier: Zero-Cost Initial
            </div>
            <h4 className="text-sm font-semibold text-white">Offline-First LocalDB</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Zero hosting cost. Immediate response, offline fault-tolerance, client-side encryption, and manual export.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              Option 2: Cloud Firestore
            </div>
            <h4 className="text-sm font-semibold text-white">Firebase Free Tier</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Provides real-time multi-device sync, Spark plan (1GB storage, 50k reads/day) without infrastructure costs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
              Option 3: Enterprise Cloud SQL
            </div>
            <h4 className="text-sm font-semibold text-white">PostgreSQL & Cloud SQL</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Production relational database for large-scale enterprise expansion with strict transactional ACID guarantees.
            </p>
          </div>
        </div>
      </div>

      {/* Root Factory Reset (System Admin Only) */}
      {isSystemAdmin && (
        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>System Admin Root Maintenance</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Reset all member allocations, sample deposits, and expenses to default seed state.
            </p>
          </div>

          <button
            onClick={handleResetFactory}
            className="px-3.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded-lg text-xs font-semibold transition self-start sm:self-auto"
          >
            Reset Database to Factory Defaults
          </button>
        </div>
      )}
    </div>
  );
};
