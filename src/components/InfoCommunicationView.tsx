import React, { useState, useMemo } from 'react';
import {
  FileText,
  MessageSquare,
  HelpCircle,
  Upload,
  Download,
  Eye,
  Trash2,
  Pin,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Image as ImageIcon,
  Send,
  Heart,
  MessageCircle,
  Share2,
  ShieldCheck,
  Building,
  User,
  Tag,
  Paperclip,
  Check,
  X,
  ExternalLink,
  Plus,
  FileCheck,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import {
  User as UserType,
  Member,
  IncomeEntry,
  ExpenseEntry,
  SocietyDocument,
  DocumentCategory,
  MemberQuery,
  QueryCategory,
  DiscussionPost,
} from '../types';
import { storageService } from '../services/storageService';

interface InfoCommunicationViewProps {
  currentUser: UserType | null;
  members?: Member[];
  incomes?: IncomeEntry[];
  expenses?: ExpenseEntry[];
}

type SubModule = 'DOCUMENTATIONS' | 'DISCUSSION_GROUP' | 'QUERY_WINDOW';

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Executive Committee Notice',
  'Site & Land Development',
  'Legal & Deed Porcha',
  'Financial & Audit Report',
  'Engineering & Layout Map',
  'Member Circular & Guidelines',
];

const QUERY_CATEGORIES: QueryCategory[] = [
  'Finance & Deposit Query',
  'Site & Land Development',
  'Share Transfer & Ownership',
  'Utility & Infrastructure',
  'General Inquiry',
];

const SAMPLE_PROJECT_IMAGES = [
  {
    title: 'Central 40ft Boulevard Soil Compaction',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Phase-1 Boundary Fortification Drone View',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'RCC Box Culvert & Drainage Conduits',
    url: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Sand Dredging & Lowland Grading Operations',
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
  },
];

export const InfoCommunicationView: React.FC<InfoCommunicationViewProps> = ({
  currentUser,
}) => {
  const [activeSubModule, setActiveSubModule] = useState<SubModule>('DOCUMENTATIONS');

  // --- Sub-module 1: Documentations State ---
  const [documents, setDocuments] = useState<SocietyDocument[]>(() => storageService.getDocuments());
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('ALL');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState<SocietyDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<SocietyDocument | null>(null);

  // Attach Document Form State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>('Executive Committee Notice');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocFileType, setNewDocFileType] = useState<'PDF' | 'DOCX' | 'XLSX' | 'JPG' | 'PNG' | 'ZIP'>('PDF');
  const [newDocFileSize, setNewDocFileSize] = useState('2.4 MB');
  const [newDocDataUrl, setNewDocDataUrl] = useState('');
  const [newDocIsPinned, setNewDocIsPinned] = useState(false);
  const [docAttachError, setDocAttachError] = useState('');

  // --- Sub-module 2: Discussion Group State ---
  const [posts, setPosts] = useState<DiscussionPost[]>(() => storageService.getDiscussionPosts());
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('ALL');
  const [newPostText, setNewPostText] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<DiscussionPost['category']>('PROJECT_PROGRESS');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [newPostImageCaption, setNewPostImageCaption] = useState('');
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);

  // --- Sub-module 3: Query Window State ---
  const [queries, setQueries] = useState<MemberQuery[]>(() => storageService.getQueries());
  const [queryCategoryFilter, setQueryCategoryFilter] = useState<string>('ALL');
  const [queryStatusFilter, setQueryStatusFilter] = useState<string>('ALL');
  const [onlyMyQueries, setOnlyMyQueries] = useState(false);
  const [showNewQueryModal, setShowNewQueryModal] = useState(false);
  const [selectedQueryForResponse, setSelectedQueryForResponse] = useState<MemberQuery | null>(null);

  // New Query Form State
  const [newQueryCategory, setNewQueryCategory] = useState<QueryCategory>('Finance & Deposit Query');
  const [newQuerySubject, setNewQuerySubject] = useState('');
  const [newQueryRefId, setNewQueryRefId] = useState('');
  const [newQueryDetails, setNewQueryDetails] = useState('');
  const [queryFormError, setQueryFormError] = useState('');

  // Official Response Form State
  const [responseText, setResponseText] = useState('');
  const [responseNewStatus, setResponseNewStatus] = useState<MemberQuery['status']>('RESOLVED');

  // Permission Check: Can attach documents (System Admin, Delegated Admin, Official)
  const canAttachDocs = useMemo(() => {
    return storageService.isUserAuthorizedToAttachDocs(currentUser);
  }, [currentUser]);

  // Can moderate or officially resolve tickets
  const canRespondOfficial = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'SYSTEM_ADMIN' ||
      currentUser.role === 'DELEGATED_ADMIN' ||
      currentUser.role === 'MANAGER' ||
      !!currentUser.officialDesignation
    );
  }, [currentUser]);

  // Refresh data from storage
  const reloadData = () => {
    setDocuments(storageService.getDocuments());
    setPosts(storageService.getDiscussionPosts());
    setQueries(storageService.getQueries());
  };

  // --- Document Handlers ---
  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewDocFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setNewDocFileSize(`${sizeMb} MB`);

      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      if (['PDF', 'DOCX', 'XLSX', 'JPG', 'PNG', 'ZIP'].includes(ext)) {
        setNewDocFileType(ext as any);
      } else {
        setNewDocFileType('PDF');
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewDocDataUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDocAttachError('');

    if (!currentUser || !canAttachDocs) {
      setDocAttachError('Access Denied: Only System Admin, Delegated Admin, and Officials can attach documents.');
      return;
    }

    if (!newDocTitle.trim()) {
      setDocAttachError('Please enter a descriptive document title.');
      return;
    }

    try {
      storageService.addDocument(
        {
          title: newDocTitle.trim(),
          category: newDocCategory,
          description: newDocDesc.trim() || 'Official document issued for shareholder information and record.',
          fileName: newDocFileName.trim() || `${newDocTitle.trim().replace(/\s+/g, '_')}.${newDocFileType.toLowerCase()}`,
          fileType: newDocFileType,
          fileSize: newDocFileSize || '1.5 MB',
          fileDataUrl: newDocDataUrl || undefined,
          isPinned: newDocIsPinned,
        },
        currentUser
      );

      reloadData();
      setShowAttachModal(false);
      setNewDocTitle('');
      setNewDocDesc('');
      setNewDocFileName('');
      setNewDocDataUrl('');
      setNewDocIsPinned(false);
    } catch (err: any) {
      setDocAttachError(err.message || 'Failed to attach document.');
    }
  };

  const handleConfirmDeleteDoc = () => {
    if (!currentUser || !canAttachDocs || !docToDelete) return;
    storageService.deleteDocument(docToDelete.id, currentUser);
    setDocToDelete(null);
    reloadData();
  };

  const handleDownloadDoc = (doc: SocietyDocument) => {
    storageService.incrementDocumentDownload(doc.id);
    reloadData();

    // Trigger download
    if (doc.fileDataUrl) {
      const link = document.createElement('a');
      link.href = doc.fileDataUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create certified text/mock blob for immediate download
      const content = `PROTTASHA HOUSING SOCIETY - OFFICIAL REPOSITORY
Document ID: ${doc.id}
Title: ${doc.title}
Category: ${doc.category}
Uploaded By: ${doc.uploadedBy} (${doc.uploadedByDesignation || doc.uploadedByRole})
Date of Issue: ${new Date(doc.uploadedAt).toLocaleDateString()}
File Reference: ${doc.fileName} (${doc.fileSize})

Summary:
${doc.description}

---------------------------------------------------------
Official Seal & Certification:
Prottasha Housing Society Central Escrow Registry
Certified for Shareholder Review (144 Shares Capital Registry)
Saif Ahmed Sakil, System Administrator (ISRT, DU)
---------------------------------------------------------`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName.replace(/\.[^/.]+$/, '') + '.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // --- Discussion Handlers ---
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() || !currentUser) return;

    storageService.addDiscussionPost(
      {
        message: newPostText.trim(),
        category: newPostCategory,
        imageUrl: newPostImageUrl.trim() || undefined,
        imageCaption: newPostImageCaption.trim() || undefined,
      },
      currentUser
    );

    reloadData();
    setNewPostText('');
    setNewPostImageUrl('');
    setNewPostImageCaption('');
  };

  const handleLikePost = (postId: string) => {
    if (!currentUser) return;
    storageService.toggleLikePost(postId, currentUser.id);
    reloadData();
  };

  const handleAddComment = (postId: string) => {
    if (!currentUser) return;
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    storageService.addPostComment(postId, text, currentUser);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    reloadData();
  };

  const handleModeratePost = (postId: string) => {
    if (!currentUser) return;
    storageService.moderateDiscussionPost(postId, currentUser);
    reloadData();
  };

  // --- Query Window Handlers ---
  const handleSubmitNewQuery = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryFormError('');

    if (!currentUser) return;
    if (!newQuerySubject.trim()) {
      setQueryFormError('Please enter a query subject.');
      return;
    }
    if (!newQueryDetails.trim()) {
      setQueryFormError('Please provide details for your inquiry.');
      return;
    }

    try {
      storageService.addQuery(
        {
          category: newQueryCategory,
          subject: newQuerySubject.trim(),
          details: newQueryDetails.trim(),
          referenceId: newQueryRefId.trim() || undefined,
        },
        currentUser
      );

      reloadData();
      setShowNewQueryModal(false);
      setNewQuerySubject('');
      setNewQueryDetails('');
      setNewQueryRefId('');
    } catch (err: any) {
      setQueryFormError(err.message || 'Failed to submit query.');
    }
  };

  const handleSendOfficialResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueryForResponse || !currentUser || !responseText.trim()) return;

    storageService.addQueryResponse(
      selectedQueryForResponse.id,
      responseText.trim(),
      currentUser,
      responseNewStatus
    );

    reloadData();
    setResponseText('');
    setSelectedQueryForResponse(null);
  };

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (docCategoryFilter !== 'ALL' && doc.category !== docCategoryFilter) {
        return false;
      }
      if (docSearchQuery.trim()) {
        const q = docSearchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchDesc = doc.description.toLowerCase().includes(q);
        const matchFile = doc.fileName.toLowerCase().includes(q);
        const matchUploader = doc.uploadedBy.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchFile && !matchUploader) return false;
      }
      return true;
    });
  }, [documents, docCategoryFilter, docSearchQuery]);

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (postCategoryFilter !== 'ALL' && post.category !== postCategoryFilter) {
        return false;
      }
      return true;
    });
  }, [posts, postCategoryFilter]);

  // Filtered Queries
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      if (queryCategoryFilter !== 'ALL' && q.category !== queryCategoryFilter) return false;
      if (queryStatusFilter !== 'ALL' && q.status !== queryStatusFilter) return false;
      if (onlyMyQueries && currentUser && q.memberId !== currentUser.memberId && q.submitterName !== currentUser.name) {
        return false;
      }
      return true;
    });
  }, [queries, queryCategoryFilter, queryStatusFilter, onlyMyQueries, currentUser]);

  const openQueriesCount = queries.filter((q) => q.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      {/* ==================== MODULE TOP BANNER ==================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/5 -skew-x-12 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Information, Notices & Collaboration Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">144 Shares Central Portal</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Info & Communication</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Official document repository, Executive Committee circulars, instant social progress sharing, and official shareholder query window.
            </p>
          </div>

          {/* User Privileges Pill */}
          <div className="flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {currentUser?.name ? currentUser.name[0] : 'U'}
            </div>
            <div className="text-xs">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>{currentUser?.name}</span>
                {currentUser?.memberId && (
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-1 rounded">
                    {currentUser.memberId}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {canAttachDocs ? (
                  <span className="text-emerald-400 font-medium">Document Attachment Empowered</span>
                ) : (
                  <span>Shareholder Access</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SUB-MODULE NAVIGATION TABS ==================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sub-module 1: Documentations */}
          <button
            onClick={() => setActiveSubModule('DOCUMENTATIONS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubModule === 'DOCUMENTATIONS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documentations</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSubModule === 'DOCUMENTATIONS'
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {documents.length}
            </span>
          </button>

          {/* Sub-module 2: Discussion Group */}
          <button
            onClick={() => setActiveSubModule('DISCUSSION_GROUP')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubModule === 'DISCUSSION_GROUP'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Discussion Group</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSubModule === 'DISCUSSION_GROUP'
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {posts.length}
            </span>
          </button>

          {/* Sub-module 3: Query Window */}
          <button
            onClick={() => setActiveSubModule('QUERY_WINDOW')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubModule === 'QUERY_WINDOW'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Query Window</span>
            {openQueriesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950 animate-pulse">
                {openQueriesCount} Open
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Context Action based on active tab */}
        <div className="px-2">
          {activeSubModule === 'DOCUMENTATIONS' && canAttachDocs && (
            <button
              onClick={() => setShowAttachModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Attach Required Document</span>
            </button>
          )}

          {activeSubModule === 'QUERY_WINDOW' && (
            <button
              onClick={() => setShowNewQueryModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Query / Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* -------------------- SUB-MODULE 1: DOCUMENTATIONS -------------------- */}
      {/* ========================================================================= */}
      {activeSubModule === 'DOCUMENTATIONS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls: Search & Category Filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Category:</span>
              <select
                value={docCategoryFilter}
                onChange={(e) => setDocCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Document Types ({documents.length})</option>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <div className="text-xs text-slate-400 border-l border-slate-800 pl-3 hidden sm:block">
                Showing <strong className="text-emerald-400 font-mono">{filteredDocs.length}</strong> official files
              </div>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Search notices, blueprints, deed porcha, uploader..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Document Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const isPinned = doc.isPinned;

              return (
                <div
                  key={doc.id}
                  className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-lg relative group ${
                    isPinned ? 'border-emerald-800/80 bg-slate-900/90' : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Strip: Category & Pin */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-slate-800 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{doc.category}</span>
                      </span>

                      {isPinned && (
                        <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 flex items-center gap-1">
                          <Pin className="w-3 h-3 text-amber-400" />
                          <span>Pinned Notice</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                      {doc.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {doc.description}
                    </p>

                    {/* File Attachment Meta Box */}
                    <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-mono text-white text-xs truncate" title={doc.fileName}>
                            {doc.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{doc.fileType}</span>
                            <span>•</span>
                            <span>{doc.fileSize}</span>
                            <span>•</span>
                            <span>{doc.downloadCount || 0} downloads</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-slate-400">
                      <div>
                        Issued by: <strong className="text-slate-200">{doc.uploadedBy}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedDocPreview(doc)}
                        title="View document metadata & executive summary"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDownloadDoc(doc)}
                        title="Download official file attachment"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Download</span>
                      </button>

                      {canAttachDocs && (
                        <button
                          onClick={() => setDocToDelete(doc)}
                          title="Delete document record"
                          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition"
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

          {filteredDocs.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              No society documents found matching this filter or search query.
            </div>
          )}
        </div>
      )}

      {/* ============================================================================= */}
      {/* -------------------- SUB-MODULE 2: DISCUSSION GROUP -------------------- */}
      {/* ============================================================================= */}
      {activeSubModule === 'DISCUSSION_GROUP' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Post Creation Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Share Update, Progress Photo, or Discussion Note</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Posting as: <strong className="text-emerald-400">{currentUser?.name}</strong>{' '}
                {currentUser?.memberId ? `(${currentUser.memberId})` : ''}
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                rows={3}
                required
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Write your observation, engineering query, site progress update, or announcement for all shareholders..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />

              {/* Photo Attachment URL or Preset Selector */}
              {newPostImageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-48 group">
                  <img
                    src={newPostImageUrl}
                    alt="Post Attachment"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-between p-3">
                    <span className="text-xs text-white font-medium bg-black/60 px-2 py-1 rounded">
                      {newPostImageCaption || 'Attached Photo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostImageUrl('');
                        setNewPostImageCaption('');
                      }}
                      className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">Channel:</span>
                  <select
                    value={newPostCategory}
                    onChange={(e: any) => setNewPostCategory(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-emerald-500"
                  >
                    <option value="PROJECT_PROGRESS">🏗️ Project Progress Sharing</option>
                    <option value="PICTURE_SHARING">📸 Picture & Media Sharing</option>
                    <option value="INFO_SHARING">📢 Info Sharing & Bulletins</option>
                    <option value="GENERAL">💬 General Society Discussion</option>
                  </select>

                  {/* Preset Site Photo Dropdown */}
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const item = SAMPLE_PROJECT_IMAGES.find((p) => p.url === val);
                        if (item) {
                          setNewPostImageUrl(item.url);
                          setNewPostImageCaption(item.title);
                        }
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:border-emerald-500"
                  >
                    <option value="">Attach Site Photo Preset...</option>
                    {SAMPLE_PROJECT_IMAGES.map((img, i) => (
                      <option key={i} value={img.url}>
                        📸 {img.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Discussion Group</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Filter Feed:</span>
            {[
              { id: 'ALL', label: 'All Updates' },
              { id: 'PROJECT_PROGRESS', label: '🏗️ Project Progress' },
              { id: 'PICTURE_SHARING', label: '📸 Picture Sharing' },
              { id: 'INFO_SHARING', label: '📢 Info Sharing' },
              { id: 'GENERAL', label: '💬 General' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPostCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  postCategoryFilter === tab.id
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const isLiked = currentUser ? post.likedBy?.includes(currentUser.id) : false;
              const hasComments = post.comments && post.comments.length > 0;
              const isCommentsOpen = expandedCommentsPostId === post.id;

              return (
                <div
                  key={post.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5"
                >
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow">
                        {post.senderName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{post.senderName}</span>
                          {post.senderMemberId && (
                            <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                              {post.senderMemberId}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({post.senderDesignation || post.senderRole})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(post.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400">
                      {post.category === 'PROJECT_PROGRESS'
                        ? '🏗️ Project Progress'
                        : post.category === 'PICTURE_SHARING'
                        ? '📸 Picture Sharing'
                        : post.category === 'INFO_SHARING'
                        ? '📢 Info Sharing'
                        : '💬 General'}
                    </span>
                  </div>

                  {/* Post Content */}
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {post.message}
                  </p>

                  {/* Attached Picture / Photo with Lightbox trigger */}
                  {post.imageUrl && (
                    <div
                      onClick={() => setLightboxImage({ url: post.imageUrl!, caption: post.imageCaption || post.message })}
                      className="relative rounded-xl overflow-hidden border border-slate-800 group cursor-pointer"
                    >
                      <img
                        src={post.imageUrl}
                        alt="Discussion Attachment"
                        className="w-full max-h-80 object-cover group-hover:scale-101 transition duration-200"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-center justify-between text-xs text-white">
                        <span className="text-[11px] font-medium">{post.imageCaption || 'Click to enlarge photo'}</span>
                        <Maximize2 className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  )}

                  {/* Interaction Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 transition font-semibold ${
                          isLiked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{post.likesCount || 0} Likes</span>
                      </button>

                      <button
                        onClick={() =>
                          setExpandedCommentsPostId(isCommentsOpen ? null : post.id)
                        }
                        className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition font-semibold"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments?.length || 0} Comments</span>
                      </button>
                    </div>

                    {canRespondOfficial && (
                      <button
                        onClick={() => handleModeratePost(post.id)}
                        title="Moderate / Archive post (Audit trail logged)"
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Comment Thread Box */}
                  {isCommentsOpen && (
                    <div className="pt-3 border-t border-slate-800/60 space-y-3">
                      {/* Comments List */}
                      {hasComments && (
                        <div className="space-y-2 pl-3 border-l-2 border-slate-800">
                          {post.comments.map((comm) => (
                            <div key={comm.id} className="text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-white">{comm.userName}</span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                                {comm.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Write a constructive response or feedback..."
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* -------------------- SUB-MODULE 3: QUERY WINDOW -------------------- */}
      {/* ========================================================================== */}
      {activeSubModule === 'QUERY_WINDOW' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls: Category, Status & My Queries Filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-md">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Topic:</span>
                <select
                  value={queryCategoryFilter}
                  onChange={(e) => setQueryCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-emerald-500"
                >
                  <option value="ALL">All Categories</option>
                  {QUERY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <select
                  value={queryStatusFilter}
                  onChange={(e) => setQueryStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-emerald-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open Queries</option>
                  <option value="IN_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved Tickets</option>
                </select>
              </div>

              {currentUser && (
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer border-l border-slate-800 pl-3">
                  <input
                    type="checkbox"
                    checked={onlyMyQueries}
                    onChange={(e) => setOnlyMyQueries(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-950"
                  />
                  <span>Show My Queries Only</span>
                </label>
              )}
            </div>

            <button
              onClick={() => setShowNewQueryModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit New Query</span>
            </button>
          </div>

          {/* Queries List */}
          <div className="space-y-4">
            {filteredQueries.map((q) => {
              const isOpen = q.status === 'OPEN';
              const isInReview = q.status === 'IN_REVIEW';
              const isResolved = q.status === 'RESOLVED';

              return (
                <div
                  key={q.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {q.id}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {q.submitterName} {q.shareNumber ? `(Share #${q.shareNumber})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(q.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isOpen
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : isInReview
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {isOpen ? 'WAITING OFFICIAL REVIEW' : isInReview ? 'UNDER REVIEW' : 'RESOLVED'}
                      </span>

                      {canRespondOfficial && (
                        <button
                          onClick={() => {
                            setSelectedQueryForResponse(q);
                            setResponseNewStatus(q.status === 'OPEN' ? 'RESOLVED' : q.status);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold transition"
                        >
                          Official Action
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subject & Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {q.category}
                      </span>
                      {q.referenceId && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          Ref: {q.referenceId}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{q.subject}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {q.details}
                    </p>
                  </div>

                  {/* Responses & Resolution Thread */}
                  {q.responses && q.responses.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Official Society Response & Resolution</span>
                      </div>
                      <div className="space-y-2 pl-3 border-l-2 border-emerald-600/60">
                        {q.responses.map((resp) => (
                          <div
                            key={resp.id}
                            className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-emerald-300">
                                {resp.responderName} ({resp.responderDesignation || resp.responderRole})
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(resp.respondedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-200 text-xs leading-relaxed">
                              {resp.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.resolutionRemarks && (
                    <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <strong>Audit Note:</strong> {q.resolutionRemarks}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredQueries.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                No inquiries submitted under this filter. Use "Submit New Query" to log a question with society management.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- MODAL: ATTACH DOCUMENT -------------------- */}
      {/* ========================================================================= */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Attach Required Document</h3>
              </div>
              <button
                onClick={() => setShowAttachModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAttachDocumentSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              {docAttachError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200">
                  {docAttachError}
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Executive Committee Notice 2026/02: Road Layout Approval"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Document Category *</label>
                  <select
                    value={newDocCategory}
                    onChange={(e: any) => setNewDocCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                  >
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">File Format</label>
                  <select
                    value={newDocFileType}
                    onChange={(e: any) => setNewDocFileType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">Word Document (.docx)</option>
                    <option value="XLSX">Excel Spreadsheet (.xlsx)</option>
                    <option value="JPG">Image (.jpg)</option>
                    <option value="PNG">Image (.png)</option>
                    <option value="ZIP">Zip Archive (.zip)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Upload File or Select Computer File
                </label>
                <input
                  type="file"
                  onChange={handleFileUploadChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                />
                {newDocFileName && (
                  <div className="text-[11px] text-emerald-400 mt-1">
                    Attached: {newDocFileName} ({newDocFileSize})
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Executive Summary / Notice Contents
                </label>
                <textarea
                  rows={3}
                  value={newDocDesc}
                  onChange={(e) => setNewDocDesc(e.target.value)}
                  placeholder="Provide context, meeting resolution summary, or shareholder instructions..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNoticeCheck"
                  checked={newDocIsPinned}
                  onChange={(e) => setNewDocIsPinned(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-950"
                />
                <label htmlFor="pinNoticeCheck" className="text-slate-300 cursor-pointer font-medium">
                  Pin to Top of Member Documentations (High Priority Notice)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow"
                >
                  Commit & Publish Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- MODAL: DOCUMENT PREVIEW -------------------- */}
      {/* ========================================================================= */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden space-y-0">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {selectedDocPreview.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Category</span>
                  <span className="font-semibold text-emerald-400">{selectedDocPreview.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">File Size & Format</span>
                  <span className="font-mono text-white">
                    {selectedDocPreview.fileType} ({selectedDocPreview.fileSize})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Issued By</span>
                  <span className="text-white">
                    {selectedDocPreview.uploadedBy} ({selectedDocPreview.uploadedByDesignation || selectedDocPreview.uploadedByRole})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Upload Date</span>
                  <span className="text-slate-300">
                    {new Date(selectedDocPreview.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Executive Description</span>
                <p className="text-slate-200 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
                  {selectedDocPreview.description}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Official registered document verified under Prottasha Housing Society capital records.
                </span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadDoc(selectedDocPreview);
                  setSelectedDocPreview(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Attachment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- MODAL: SUBMIT NEW QUERY -------------------- */}
      {/* ========================================================================= */}
      {showNewQueryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Submit Inquiry to Society Desk</h3>
              </div>
              <button
                onClick={() => setShowNewQueryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewQuery} className="p-6 space-y-4 text-xs">
              {queryFormError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200">
                  {queryFormError}
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Inquiry Topic Category *</label>
                <select
                  value={newQueryCategory}
                  onChange={(e: any) => setNewQueryCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                >
                  {QUERY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Subject / Question Summary *</label>
                <input
                  type="text"
                  required
                  value={newQuerySubject}
                  onChange={(e) => setNewQuerySubject(e.target.value)}
                  placeholder="e.g. Deposit reconciliation for Phase-1 voucher DEP-2026-004"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Relevant Reference ID (Optional)
                </label>
                <input
                  type="text"
                  value={newQueryRefId}
                  onChange={(e) => setNewQueryRefId(e.target.value)}
                  placeholder="e.g. Voucher DEP-2026-001, Plot #B-45, or Bank Cheque #"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Detailed Query *</label>
                <textarea
                  rows={4}
                  required
                  value={newQueryDetails}
                  onChange={(e) => setNewQueryDetails(e.target.value)}
                  placeholder="Describe your question in detail so finance officers or site supervisors can assist..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewQueryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow"
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- MODAL: OFFICIAL QUERY RESPONSE -------------------- */}
      {/* ========================================================================= */}
      {selectedQueryForResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Respond to Inquiry {selectedQueryForResponse.id}</span>
              </h3>
              <button
                onClick={() => setSelectedQueryForResponse(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendOfficialResponse} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px]">
                  From: {selectedQueryForResponse.submitterName} ({selectedQueryForResponse.memberId})
                </div>
                <div className="font-bold text-white">{selectedQueryForResponse.subject}</div>
                <p className="text-slate-300 text-[11px] mt-1">{selectedQueryForResponse.details}</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Official Resolution / Response *</label>
                <textarea
                  rows={4}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Provide official verification details, voucher adjustments, or site engineering status..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Ticket Status</label>
                <select
                  value={responseNewStatus}
                  onChange={(e: any) => setResponseNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                >
                  <option value="IN_REVIEW">Under Review / Working</option>
                  <option value="RESOLVED">Mark as Resolved & Closed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedQueryForResponse(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow"
                >
                  Publish Official Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- LIGHTBOX: PHOTO PREVIEW -------------------- */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage.url}
              alt="Full Preview"
              className="w-full max-h-[75vh] object-contain bg-black"
            />
            {lightboxImage.caption && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-white">
                {lightboxImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Document Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-rose-800/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-500/10 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Document</h3>
                <p className="text-xs text-slate-400">Permanent registry removal</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove <strong className="text-white">"{docToDelete.title}"</strong> ({docToDelete.fileName}) from the society's official documentation repository?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDoc}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
