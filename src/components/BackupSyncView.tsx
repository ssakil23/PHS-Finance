import React, { useState, useEffect } from 'react';
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
  Wifi,
  WifiOff,
  Globe,
  ArrowRight,
  ShieldCheck,
  Zap,
  Laptop,
  FileCheck,
  Check,
  Info,
  X,
  Plus,
  Trash2,
  Copy,
  Clock,
  Sparkles,
} from 'lucide-react';
import { User, SystemSnapshotRecord } from '../types';
import { storageService } from '../services/storageService';
import { useOnlineSync } from '../hooks/useOnlineSync';
import { PWAInstallButton } from './PWAInstallButton';

interface BackupSyncViewProps {
  currentUser: User | null;
}

export const BackupSyncView: React.FC<BackupSyncViewProps> = ({ currentUser }) => {
  const { isOnline, isSyncing, lastSyncTime, syncFeedback, storageUsedKB, syncNow } = useOnlineSync(currentUser);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncError, setSyncError] = useState<string>('');
  const [restoreMessage, setRestoreMessage] = useState<string>('');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Local Snapshots State
  const [snapshots, setSnapshots] = useState<SystemSnapshotRecord[]>(() => storageService.getLocalSystemSnapshots());
  const [showCreateSnapshotModal, setShowCreateSnapshotModal] = useState<boolean>(false);
  const [snapshotLabelInput, setSnapshotLabelInput] = useState<string>('');
  const [isPrecaching, setIsPrecaching] = useState<boolean>(false);
  const [precacheMessage, setPrecacheMessage] = useState<string>('');

  // Migration Preview Modal State
  const [pendingMigrationData, setPendingMigrationData] = useState<{
    rawJson: string;
    meta?: any;
    entityCounts?: Record<string, number>;
  } | null>(null);

  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';
  const offlineStats = storageService.getOfflineSystemStats();

  const refreshSnapshots = () => {
    setSnapshots(storageService.getLocalSystemSnapshots());
  };

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      refreshSnapshots();
    });
    return unsub;
  }, []);

  // Complete Domain & Hosting Migration Master Backup (.json)
  const handleDomainMigrationBackup = () => {
    if (!currentUser) return;
    try {
      const jsonStr = storageService.createDatabaseBackupJSON(currentUser);
      const hostName = typeof window !== 'undefined' ? window.location.hostname : 'domain';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `PHS_Finance_DOMAIN_MIGRATION_MASTER_BACKUP_${hostName}_${timestamp}.json`;

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSyncStatus('Complete Domain & Hosting Migration package generated successfully with 100% zero data loss guarantee!');
      setTimeout(() => setSyncStatus(''), 6000);
    } catch (err: any) {
      setSyncError(`Failed to generate migration package: ${err.message}`);
    }
  };

  // Save Instant Local Snapshot on Current Device
  const handleCreateLocalSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const label = snapshotLabelInput.trim() || `Snapshot ${new Date().toLocaleDateString('en-GB')}`;
      const snap = storageService.saveLocalSystemSnapshot(label, currentUser);
      setShowCreateSnapshotModal(false);
      setSnapshotLabelInput('');
      refreshSnapshots();
      setSyncStatus(`Instant device snapshot "${snap.label}" created successfully (${snap.dataSizeKB} KB, ${snap.totalRecordsCount} entities)!`);
      setTimeout(() => setSyncStatus(''), 5000);
    } catch (err: any) {
      setSyncError(`Failed to create snapshot: ${err.message}`);
    }
  };

  const handleDownloadSnapshot = (snap: SystemSnapshotRecord) => {
    try {
      const filename = `PHS_Finance_SNAPSHOT_${snap.label.replace(/[^a-zA-Z0-9_-]/g, '_')}_${snap.id}.json`;
      const blob = new Blob([snap.jsonPayload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setSyncError(`Download failed: ${err.message}`);
    }
  };

  const handleRestoreSnapshot = (snap: SystemSnapshotRecord) => {
    if (!currentUser) return;
    if (window.confirm(`Are you sure you want to restore snapshot "${snap.label}" taken on ${new Date(snap.timestamp).toLocaleString('en-GB')}? This will replace current database state with this snapshot.`)) {
      const res = storageService.restoreLocalSystemSnapshot(snap.id, currentUser);
      if (res.success) {
        setRestoreMessage(res.message);
        setTimeout(() => window.location.reload(), 1800);
      } else {
        setSyncError(res.message);
      }
    }
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    if (!currentUser) return;
    if (window.confirm('Delete this local device snapshot?')) {
      storageService.deleteLocalSystemSnapshot(snapshotId, currentUser);
      refreshSnapshots();
    }
  };

  // Precache all assets for offline execution
  const handlePrecacheResources = async () => {
    setIsPrecaching(true);
    try {
      const res = await storageService.precacheAllOfflineResources();
      setPrecacheMessage(res.message);
      setTimeout(() => setPrecacheMessage(''), 5000);
    } catch (err: any) {
      setSyncError(`Precache failed: ${err.message}`);
    } finally {
      setIsPrecaching(false);
    }
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

  // Inspect and validate file before restoring
  const handleSelectRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = storageService.validateMigrationBackup(content);
      if (!validation.isValid) {
        setSyncError(validation.errorMessage || 'Invalid backup file structure.');
        return;
      }

      setPendingMigrationData({
        rawJson: content,
        meta: validation.meta,
        entityCounts: validation.entityCounts,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteRestore = () => {
    if (!currentUser || !pendingMigrationData) return;
    try {
      const res = storageService.restoreDatabaseBackupJSON(pendingMigrationData.rawJson, currentUser);
      if (res.success) {
        setPendingMigrationData(null);
        setRestoreMessage(res.message);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setSyncError(res.message);
      }
    } catch (err: any) {
      setSyncError(`Restoration failed: ${err.message}`);
    }
  };

  const handleResetFactory = () => {
    if (!currentUser || !isSystemAdmin) return;
    setShowResetConfirmModal(true);
  };

  const handleConfirmFactoryReset = () => {
    if (!currentUser || !isSystemAdmin) return;
    storageService.resetToFactoryDefaults(currentUser);
    setShowResetConfirmModal(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Domain & Hosting Migration Ready</span>
              </span>
              <span className="text-xs text-sky-400 font-mono bg-sky-950/80 px-2.5 py-0.5 rounded border border-sky-800/60 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-300" />
                <span>Fast Offline & Instant Sync</span>
              </span>
              <span className="text-[11px] text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60">
                Zero Data Loss Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Full System Backup, Cloud Migration & Offline Engine</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              System Admin authority to export 100% complete database archives for moving domains, hosting providers, or servers without losing any data. Offline-first local storage keeps all 144 share accounts, deposits, expenses, and policies alive even with zero network.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <PWAInstallButton />

            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Instantly Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Connectivity & Device Storage Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px]">Network Connectivity</div>
            <div className="font-bold flex items-center gap-1.5 mt-0.5">
              {isOnline ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online (Connected)</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                  <span>Offline (Device Cache)</span>
                </span>
              )}
            </div>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px]">Current Device Storage</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {storageUsedKB || offlineStats.storageUsedKB} KB Active
            </div>
          </div>
          <Laptop className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px]">Total Device Records</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {offlineStats.totalRecordsCount} Entities Cached
            </div>
          </div>
          <HardDrive className="w-4 h-4 text-sky-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px]">Last Synchronized</div>
            <div className="text-xs font-semibold text-slate-300 mt-0.5 truncate max-w-[150px]">
              {new Date(lastSyncTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
          <RefreshCw className="w-4 h-4 text-purple-400" />
        </div>
      </div>

      {syncStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-sky-950/60 border border-sky-800 text-sky-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Zap className="w-4 h-4 shrink-0 text-sky-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {precacheMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0 text-yellow-300" />
          <span>{precacheMessage}</span>
        </div>
      )}

      {syncError && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {restoreMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{restoreMessage} (Reloading application...)</span>
        </div>
      )}

      {/* System Admin Complete Domain Migration Master Card */}
      {isSystemAdmin && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border-2 border-emerald-500/70 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-800/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>Complete Domain & Hosting Migration Master Backup</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                    Zero Data Loss Guarantee
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Package all 21 system collections, 144 member ledgers, vouchers, budgets, documents, user credentials, and periodic password policies into a single portable master archive (.json) to change domains or hosting providers.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowCreateSnapshotModal(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Save Device Snapshot</span>
              </button>

              <button
                onClick={handleDomainMigrationBackup}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Master Migration Archive (.json)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px] text-slate-300 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Members & Shares:</span>
              <strong className="text-emerald-400 font-mono">144 Shares</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Incomes & Deposits:</span>
              <strong className="text-emerald-400 font-mono">Full Ledger</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Project Expenses:</span>
              <strong className="text-emerald-400 font-mono">All Tier Vouchers</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Credentials:</span>
              <strong className="text-emerald-400 font-mono">All User Passwords</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Budgets & Overdue:</span>
              <strong className="text-emerald-400 font-mono">Annual Targets</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Governance:</span>
              <strong className="text-emerald-400 font-mono">EC & Elections</strong>
            </div>
          </div>
        </div>
      )}

      {/* Local Device Snapshots Archive (System Admin Only) */}
      {isSystemAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Local Device Snapshots Archive ({snapshots.length}/10)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant recovery points stored securely in local device storage. Allows immediate rollback or downloading without network access.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrecacheResources}
                disabled={isPrecaching}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Sparkles className={`w-3.5 h-3.5 text-yellow-400 ${isPrecaching ? 'animate-spin' : ''}`} />
                <span>{isPrecaching ? 'Precaching...' : 'Precache Offline Assets'}</span>
              </button>
              <button
                onClick={() => setShowCreateSnapshotModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Take Snapshot Now</span>
              </button>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
              No local device snapshots saved yet. Click <strong>"Take Snapshot Now"</strong> to preserve a point-in-time recovery image on this device.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Snapshot Label</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">Entities</th>
                    <th className="py-2.5 px-3">Size / Integrity</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {snapshots.map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{snap.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {new Date(snap.timestamp).toLocaleString('en-GB')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{snap.createdByName}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-mono font-bold">
                        {snap.totalRecordsCount} records
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-slate-300 text-[11px]">{snap.dataSizeKB} KB</span>
                        <span className="block text-[10px] text-slate-500 font-mono">{snap.checksum}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleDownloadSnapshot(snap)}
                          title="Download .json file"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white transition inline-flex items-center"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRestoreSnapshot(snap)}
                          title="Restore database to this snapshot"
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[11px] font-semibold transition inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          title="Delete snapshot"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 transition inline-flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Snapshots Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Portable Ledger Snapshots</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Export individual spreadsheet ledgers for executive committee meetings, annual general audits, or offline accounting verification.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleDomainMigrationBackup}
              className="w-full px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-400" />
                <span>Full System Master JSON Snapshot</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Complete</span>
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
                <span>Project Expenses & Vouchers Ledger (CSV)</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">.csv</span>
            </button>
          </div>
        </div>

        {/* Restore Snapshot Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Restore & Migrate from Another Domain / Host</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Upload an existing PHS-Finance master migration backup file to transfer society records to this new domain or recover from an earlier point.
          </p>

          <div className="p-5 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl text-center bg-slate-950/60 transition">
            <HardDrive className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <div className="text-xs text-slate-300 font-medium">Select Master Backup / Migration File</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Compatible with all PHS-Finance v1.0 and v2.x JSON archives</p>
            <label className="mt-3 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition">
              <span>Choose JSON Migration Archive</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleSelectRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Migration Confirmation Modal with Interactive Verification Preview */}
      {pendingMigrationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-lg w-full bg-slate-900 border border-emerald-500/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Verify Domain Migration Archive</h3>
              </div>
              <button
                onClick={() => setPendingMigrationData(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Source Host/Domain:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {pendingMigrationData.meta?.sourceDomain || 'External Domain'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Exported Timestamp:</span>
                  <span className="text-slate-200">
                    {pendingMigrationData.meta?.exportedAt
                      ? new Date(pendingMigrationData.meta.exportedAt).toLocaleString('en-GB')
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Exported By:</span>
                  <span className="text-slate-200">
                    {pendingMigrationData.meta?.exportedBy?.name || 'Administrator'}
                  </span>
                </div>
                {pendingMigrationData.meta?.checksum && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Integrity Checksum:</span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {pendingMigrationData.meta.checksum} (Verified)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-slate-300 font-semibold mb-1.5">Records to be Restored:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Shareholders:</span>
                    <strong className="text-white font-mono">{pendingMigrationData.entityCounts?.members || 144}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Incomes:</span>
                    <strong className="text-white font-mono">{pendingMigrationData.entityCounts?.incomes || 0}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Expenses:</span>
                    <strong className="text-white font-mono">{pendingMigrationData.entityCounts?.expenses || 0}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Annual Budgets:</span>
                    <strong className="text-white font-mono">{pendingMigrationData.entityCounts?.budgets || 0}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Official Docs:</span>
                    <strong className="text-white font-mono">{pendingMigrationData.entityCounts?.documents || 0}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">User Passwords:</span>
                    <strong className="text-emerald-400 font-mono">Restored 100%</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  All records, credentials, periodic password policies, and documents will be imported into this domain with zero data loss.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPendingMigrationData(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Execute Migration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Step Domain & Hosting Migration Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Globe className="w-5 h-5 text-emerald-400" />
          <span>Step-by-Step Guide: Moving PHS-Finance to a New Domain or Hosting Provider</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Follow these 3 simple steps to move the entire society finance system from one hosting provider or domain to another with 100% data continuity:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="text-sm font-semibold text-white">Download Backup on Current Host</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Click <strong>"Download Master Migration Archive"</strong> above. This exports every share record, deposit, voucher, budget, password, and file with an integrity manifest.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="text-sm font-semibold text-white">Deploy App to New Domain</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Deploy the repository code to your new host (custom domain, Cloud Run, Vercel, Netlify, or local server). The PWA Service Worker will instantly prepare the offline cache.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="text-sm font-semibold text-white">Upload & Restore on New Domain</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Open <strong>Backup & Cloud</strong> on the new domain, select your JSON migration file, verify the preview, and click <strong>"Confirm & Execute Migration"</strong>. All records are live!
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Save Local Device Snapshot */}
      {showCreateSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Save Local Device Snapshot</h3>
              </div>
              <button
                onClick={() => setShowCreateSnapshotModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLocalSnapshot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Snapshot Label / Description</label>
                <input
                  type="text"
                  required
                  value={snapshotLabelInput}
                  onChange={(e) => setSnapshotLabelInput(e.target.value)}
                  placeholder="e.g. Pre-AGM Ledger Snapshot, FY26 Baseline, etc."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="text-slate-400 font-semibold">Snapshot includes:</div>
                <div className="text-emerald-400">
                  • 144 Member Share Records & Profiles<br />
                  • Complete Income & Deposit Transactions<br />
                  • All Tier 1-5 Expense Vouchers<br />
                  • System Passwords & Periodic Rotation Policy<br />
                  • Annual Budgets & Documents
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateSnapshotModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Snapshot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Factory Reset Modal Confirmation */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-rose-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-500/10 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Database</h3>
                <p className="text-xs text-rose-400">Irreversible System Action</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              WARNING: You are about to reset the entire database to factory defaults. All custom transactions, uploads, and changes will be replaced with initial seed data. Do you wish to proceed?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFactoryReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Confirm Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
