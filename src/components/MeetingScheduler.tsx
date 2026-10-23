import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Plus,
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  UserX,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  Send,
  Sparkles,
  ExternalLink,
  Edit,
  Trash2,
  CheckSquare,
  XCircle,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';
import {
  MeetingRecord,
  MeetingType,
  MeetingStatus,
  AttendanceStatus,
  RSVPStatus,
  User,
  Member,
  ExecutiveCommittee,
} from '../types';
import { storageService } from '../services/storageService';

interface MeetingSchedulerProps {
  currentUser: User | null;
  members: Member[];
  ec: ExecutiveCommittee;
}

export const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  currentUser,
  members,
  ec,
}) => {
  const [meetings, setMeetings] = useState<MeetingRecord[]>(() => storageService.getMeetings());
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UPCOMING' | 'EC_ONLY' | 'GENERAL' | 'COMPLETED'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingRecord | null>(null);
  const [attendanceModalMeeting, setAttendanceModalMeeting] = useState<MeetingRecord | null>(null);
  const [minutesModalMeeting, setMinutesModalMeeting] = useState<MeetingRecord | null>(null);

  // Create / Edit Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<MeetingType>('EC_MEETING');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('10:30 AM');
  const [formEndTime, setFormEndTime] = useState('01:30 PM');
  const [formLocation, setFormLocation] = useState('Society Registered Secretariat, Sector 14, Uttara, Dhaka');
  const [formVirtualLink, setFormVirtualLink] = useState('https://meet.google.com/phs-governance');
  const [formChairperson, setFormChairperson] = useState('Saif Ahmed Sakil (President & System Admin)');
  const [formTargetScope, setFormTargetScope] = useState<'ALL_SHARE_OWNERS' | 'EC_AND_SELECTED_MEMBERS'>('EC_AND_SELECTED_MEMBERS');
  const [formSelectedMemberIds, setFormSelectedMemberIds] = useState<string[]>(['PHSM-007', 'PHSM-014']);
  const [formAgenda, setFormAgenda] = useState<Array<{ title: string; description: string; presenter: string; allocatedMinutes: number }>>([
    { title: 'Confirmation of Previous Meeting Minutes', description: 'Ratification of matters arising', presenter: 'Mohammad Jahangir Alam (General Secretary)', allocatedMinutes: 15 },
    { title: 'Operational & Financial Progress Review', description: 'Review of ongoing sector work and expenses', presenter: 'M Omar Faruque Molla (Vice President)', allocatedMinutes: 30 },
  ]);
  const [formEnableDailyReminders, setFormEnableDailyReminders] = useState(true);

  // Minutes & Resolutions Form
  const [minutesText, setMinutesText] = useState('');
  const [resolutionInput, setResolutionInput] = useState('');
  const [resolutionsList, setResolutionsList] = useState<string[]>([]);

  // Attendance Filter in Modal
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'PENDING'>('ALL');

  // Feedback alerts
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const canManage = storageService.canManageMeetings(currentUser);
  const currentMemberId = currentUser?.memberId || (currentUser?.role === 'MEMBER' ? currentUser.username : undefined);

  // Subscribe to storage changes & check daily reminders automatically on mount
  useEffect(() => {
    // Automatically evaluate daily reminders on load
    try {
      const res = storageService.checkAndTriggerDailyReminders(currentUser || undefined);
      if (res.triggeredCount > 0) {
        setFeedbackSuccess(`Automated Daily Reminders dispatched for ${res.triggeredCount} upcoming meeting(s)!`);
        setTimeout(() => setFeedbackSuccess(''), 4000);
      }
    } catch {}

    const unsub = storageService.subscribe(() => {
      setMeetings(storageService.getMeetings());
    });
    return unsub;
  }, [currentUser]);

  // Sync expanded attendance modal when meetings state updates
  useEffect(() => {
    if (attendanceModalMeeting) {
      const refreshed = meetings.find((m) => m.id === attendanceModalMeeting.id);
      if (refreshed) {
        setAttendanceModalMeeting(refreshed);
      }
    }
  }, [meetings]);

  const handleTriggerDailyRemindersNow = () => {
    try {
      const res = storageService.checkAndTriggerDailyReminders(currentUser || undefined);
      if (res.triggeredCount > 0) {
        setFeedbackSuccess(`Success: Dispatched daily push & in-app reminders for ${res.triggeredCount} meeting(s) to relevant members.`);
      } else {
        setFeedbackSuccess('Daily reminders have already been sent today for all active meetings. Next scheduled dispatch: Tomorrow.');
      }
      setTimeout(() => setFeedbackSuccess(''), 4000);
    } catch (e: any) {
      setFeedbackError(e.message);
      setTimeout(() => setFeedbackError(''), 4000);
    }
  };

  const handleRequestPushPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          storageService.triggerWebPushNotification(
            '🔔 PHS-Finance Push Notifications Activated',
            'You will receive instant alerts and daily morning reminders for all upcoming EC Meetings, SGMs, and AGMs.'
          );
          setFeedbackSuccess('Push notifications enabled successfully on this browser device!');
        } else {
          setFeedbackError('Notification permission was declined or dismissed in browser settings.');
        }
        setTimeout(() => {
          setFeedbackSuccess('');
          setFeedbackError('');
        }, 4000);
      });
    } else {
      setFeedbackError('Web Push Notification API is not supported in this browser.');
      setTimeout(() => setFeedbackError(''), 4000);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingMeeting(null);
    setFormTitle('');
    setFormType('EC_MEETING');
    // Default date: 3 days from now
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setFormDate(d.toISOString().split('T')[0]);
    setFormStartTime('10:30 AM');
    setFormEndTime('01:30 PM');
    setFormLocation('Society Registered Secretariat, Sector 14, Uttara, Dhaka');
    setFormVirtualLink('https://meet.google.com/phs-governance');
    setFormChairperson(`${currentUser?.name || 'Saif Ahmed Sakil'} (${currentUser?.role === 'SYSTEM_ADMIN' ? 'President' : 'EC Executive'})`);
    setFormTargetScope('EC_AND_SELECTED_MEMBERS');
    setFormSelectedMemberIds(['PHSM-007', 'PHSM-014']);
    setFormAgenda([
      { title: 'Confirmation of Minutes of the Previous Meeting', description: 'Review and ratification of action items', presenter: ec.generalSecretary.name, allocatedMinutes: 20 },
      { title: 'Infrastructure Progress & Financial Ledger Review', description: 'Sector 14 earth compaction, perimeter boundary, and deposits', presenter: ec.vicePresident?.name || 'Vice President', allocatedMinutes: 35 },
      { title: 'Open Floor Discussion & Next Steps', description: 'Executive resolutions and action items', presenter: 'Chairperson', allocatedMinutes: 25 },
    ]);
    setFormEnableDailyReminders(true);
    setShowCreateModal(true);
  };

  const handleAddAgendaRow = () => {
    setFormAgenda([
      ...formAgenda,
      {
        title: '',
        description: '',
        presenter: ec.generalSecretary.name,
        allocatedMinutes: 20,
      },
    ]);
  };

  const handleRemoveAgendaRow = (index: number) => {
    if (formAgenda.length <= 1) return;
    setFormAgenda(formAgenda.filter((_, i) => i !== index));
  };

  const handleSaveMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const cleanAgenda = formAgenda.filter((a) => a.title.trim().length > 0);
      if (cleanAgenda.length === 0) {
        throw new Error('Please add at least one valid agenda item.');
      }

      if (editingMeeting) {
        // Update existing meeting
        storageService.updateMeeting(
          editingMeeting.id,
          {
            title: formTitle,
            meetingType: formType,
            date: formDate,
            startTime: formStartTime,
            endTime: formEndTime,
            location: formLocation,
            virtualLink: formVirtualLink,
            chairperson: formChairperson,
            targetScope: formTargetScope,
            selectedMemberIds: formSelectedMemberIds,
            agenda: cleanAgenda.map((a, idx) => ({
              id: editingMeeting.agenda[idx]?.id || `AGD-${Date.now()}-${idx + 1}`,
              itemNumber: idx + 1,
              title: a.title,
              description: a.description,
              presenter: a.presenter,
              allocatedMinutes: a.allocatedMinutes,
              status: editingMeeting.agenda[idx]?.status || 'PENDING',
            })),
            enableDailyReminders: formEnableDailyReminders,
          },
          currentUser
        );
        setFeedbackSuccess(`Meeting "${formTitle}" updated successfully.`);
      } else {
        // Create new meeting
        const created = storageService.createMeeting(
          {
            title: formTitle,
            meetingType: formType,
            date: formDate,
            startTime: formStartTime,
            endTime: formEndTime,
            location: formLocation,
            virtualLink: formVirtualLink,
            chairperson: formChairperson,
            targetScope: formTargetScope,
            selectedMemberIds: formSelectedMemberIds,
            agenda: cleanAgenda,
            enableDailyReminders: formEnableDailyReminders,
          },
          currentUser
        );
        setFeedbackSuccess(
          `Meeting "${created.title}" scheduled successfully! Instant Push & In-App notifications dispatched, and daily reminders activated.`
        );
      }

      setShowCreateModal(false);
      setEditingMeeting(null);
      setTimeout(() => setFeedbackSuccess(''), 4500);
    } catch (err: any) {
      setFeedbackError(err.message);
      setTimeout(() => setFeedbackError(''), 4500);
    }
  };

  const handleMemberRSVP = (meetingId: string, rsvp: RSVPStatus) => {
    if (!currentUser || !currentMemberId) {
      setFeedbackError('Please log in with a valid shareholder or official account to submit RSVP.');
      setTimeout(() => setFeedbackError(''), 3000);
      return;
    }

    try {
      storageService.submitRSVP(meetingId, currentMemberId, rsvp, currentUser);
      setFeedbackSuccess(`Your RSVP has been marked as "${rsvp}". Thank you!`);
      setTimeout(() => setFeedbackSuccess(''), 3000);
    } catch (err: any) {
      setFeedbackError(err.message);
      setTimeout(() => setFeedbackError(''), 3000);
    }
  };

  const handleMarkAttendance = (meetingId: string, targetMemberId: string, status: AttendanceStatus) => {
    if (!currentUser || !canManage) return;
    try {
      storageService.recordAttendance(meetingId, targetMemberId, status, undefined, currentUser);
    } catch (err: any) {
      setFeedbackError(err.message);
      setTimeout(() => setFeedbackError(''), 3000);
    }
  };

  const handleBatchMarkPresent = (meeting: MeetingRecord) => {
    if (!currentUser || !canManage) return;
    const attendees = Object.values(meeting.attendees);
    // Mark all who RSVP'd ATTENDING or are PENDING as PRESENT
    const list = attendees
      .filter((a) => a.attendanceStatus === 'PENDING' || a.rsvpStatus === 'ATTENDING')
      .map((a) => ({ memberId: a.memberId, status: 'PRESENT' as AttendanceStatus }));

    if (list.length === 0) {
      setFeedbackSuccess('All attendees already have attendance recorded.');
      setTimeout(() => setFeedbackSuccess(''), 3000);
      return;
    }

    storageService.batchRecordAttendance(meeting.id, list, currentUser);
    setFeedbackSuccess(`Marked ${list.length} attendees as PRESENT.`);
    setTimeout(() => setFeedbackSuccess(''), 3000);
  };

  const handleOpenMinutesModal = (meeting: MeetingRecord) => {
    setMinutesModalMeeting(meeting);
    setMinutesText(meeting.minutesOfMeeting || '');
    setResolutionsList(meeting.officialResolutions || []);
    setResolutionInput('');
  };

  const handleAddResolution = () => {
    if (!resolutionInput.trim()) return;
    setResolutionsList([...resolutionsList, resolutionInput.trim()]);
    setResolutionInput('');
  };

  const handleSaveMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !minutesModalMeeting || !canManage) return;

    try {
      storageService.completeMeeting(minutesModalMeeting.id, minutesText, resolutionsList, currentUser);
      setFeedbackSuccess(`Meeting minutes & ${resolutionsList.length} resolutions published. Meeting marked as COMPLETED.`);
      setMinutesModalMeeting(null);
      setTimeout(() => setFeedbackSuccess(''), 4000);
    } catch (err: any) {
      setFeedbackError(err.message);
      setTimeout(() => setFeedbackError(''), 4000);
    }
  };

  const handleExportAttendanceCSV = (meeting: MeetingRecord) => {
    const attendees = Object.values(meeting.attendees);
    const headers = ['Member ID', 'Shareholder Name', 'Share Number', 'EC Member', 'Designation', 'Phone', 'RSVP Status', 'Attendance Status', 'Marked By', 'Marked At'];
    const rows = attendees.map((a) => [
      `"${a.memberId}"`,
      `"${a.name.replace(/"/g, '""')}"`,
      a.shareNumber || '',
      a.isECMember ? 'YES' : 'NO',
      `"${a.designation || 'Shareholder'}"`,
      `"${a.phone || ''}"`,
      `"${a.rsvpStatus}"`,
      `"${a.attendanceStatus}"`,
      `"${a.attendanceMarkedBy || ''}"`,
      `"${a.attendanceMarkedAt || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PHS_Attendance_${meeting.id}_${meeting.date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Meetings
  const filteredMeetings = meetings.filter((m) => {
    if (activeFilter === 'UPCOMING') {
      if (m.status !== 'UPCOMING' && m.status !== 'IN_PROGRESS') return false;
    } else if (activeFilter === 'EC_ONLY') {
      if (m.meetingType !== 'EC_MEETING' && m.meetingType !== 'EMERGENCY_EC') return false;
    } else if (activeFilter === 'GENERAL') {
      if (m.meetingType !== 'SGM' && m.meetingType !== 'AGM') return false;
    } else if (activeFilter === 'COMPLETED') {
      if (m.status !== 'COMPLETED' && m.status !== 'CANCELLED') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchLoc = m.location.toLowerCase().includes(q);
      const matchChair = m.chairperson.toLowerCase().includes(q);
      const matchAgenda = m.agenda.some((a) => a.title.toLowerCase().includes(q));
      if (!matchTitle && !matchLoc && !matchChair && !matchAgenda) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Meeting Scheduler Top Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-800/60 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Executive Meeting Scheduler & Attendance</span>
              </span>
              <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Authorized: President, VP, EC Secretary
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>EC & Shareholder Meeting Governance Engine</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Convening authority for <strong>Executive Committee Meetings</strong> (EC Members + Invited Observers) and <strong>General Assemblies (SGM / AGM)</strong> with all 144 registered shareholders. Dispatches instant Web Push notifications and daily automated morning reminders until event completion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Native Web Push Permission Request */}
            <button
              onClick={handleRequestPushPermission}
              title="Activate Native Browser Web Push Notifications for Meeting Alerts"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Enable Push Alerts</span>
            </button>

            {/* Daily Reminders Manual Trigger */}
            <button
              onClick={handleTriggerDailyRemindersNow}
              title="Broadcast today's automated morning meeting reminder blast to all relevant members"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Broadcast Daily Reminders</span>
            </button>

            {/* Schedule New Meeting (President / VP / EC Secretary / Admin) */}
            {canManage && (
              <button
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Meeting</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Banners */}
        {feedbackSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        )}
        {feedbackError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackError}</span>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('UPCOMING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'UPCOMING'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Upcoming & Active ({meetings.filter((m) => m.status === 'UPCOMING' || m.status === 'IN_PROGRESS').length})
          </button>
          <button
            onClick={() => setActiveFilter('EC_ONLY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'EC_ONLY'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            EC Meetings ({meetings.filter((m) => m.meetingType === 'EC_MEETING' || m.meetingType === 'EMERGENCY_EC').length})
          </button>
          <button
            onClick={() => setActiveFilter('GENERAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'GENERAL'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            General (SGM / AGM) ({meetings.filter((m) => m.meetingType === 'SGM' || m.meetingType === 'AGM').length})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Meetings ({meetings.length})
          </button>
          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Past / Completed ({meetings.filter((m) => m.status === 'COMPLETED' || m.status === 'CANCELLED').length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search meetings, agenda, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">No Meetings Found</h4>
            <p className="text-xs text-slate-400 mt-1">
              No meetings match your current filter. Use "Schedule New Meeting" above to convene a session.
            </p>
          </div>
        ) : (
          filteredMeetings.map((meeting) => {
            const isExpanded = expandedMeetingId === meeting.id;
            const attendeesList = Object.values(meeting.attendees);
            const totalInvited = attendeesList.length;
            const attendingCount = attendeesList.filter((a) => a.rsvpStatus === 'ATTENDING').length;
            const presentCount = attendeesList.filter((a) => a.attendanceStatus === 'PRESENT').length;
            const absentCount = attendeesList.filter((a) => a.attendanceStatus === 'ABSENT').length;
            const excusedCount = attendeesList.filter((a) => a.attendanceStatus === 'EXCUSED').length;

            const myAttendeeRecord = currentMemberId ? meeting.attendees[currentMemberId] : undefined;

            // Date calculations
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = meeting.date === todayStr;
            const diffDays = Math.ceil(
              (new Date(meeting.date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
            );

            // Badges
            const typeBadgeStyle =
              meeting.meetingType === 'SGM'
                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                : meeting.meetingType === 'AGM'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : meeting.meetingType === 'EMERGENCY_EC'
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-800';

            const statusBadgeStyle =
              meeting.status === 'COMPLETED'
                ? 'bg-blue-950 text-blue-300 border-blue-800'
                : meeting.status === 'CANCELLED'
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : isToday
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div
                key={meeting.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition space-y-4"
              >
                {/* Meeting Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${typeBadgeStyle}`}>
                        {meeting.meetingType === 'EC_MEETING'
                          ? 'EC Meeting'
                          : meeting.meetingType === 'SGM'
                          ? 'Special General Meeting (SGM)'
                          : meeting.meetingType === 'AGM'
                          ? 'Annual General Meeting (AGM)'
                          : 'Emergency EC'}
                      </span>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusBadgeStyle}`}>
                        {meeting.status === 'UPCOMING'
                          ? isToday
                            ? 'TODAY'
                            : diffDays > 0
                            ? `In ${diffDays} day${diffDays > 1 ? 's' : ''}`
                            : 'Passed Date'
                          : meeting.status}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {meeting.targetScope === 'ALL_SHARE_OWNERS'
                          ? 'Scope: All 144 Share Owners'
                          : `Scope: EC Committee & Selected (${totalInvited} Members)`}
                      </span>

                      {meeting.enableDailyReminders !== false && (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          <span>Daily Reminders Active ({meeting.dailyReminderCount} sent)</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{meeting.title}</span>
                    </h4>

                    {/* Chairperson & Logistics */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <strong className="text-white">{meeting.date}</strong> ({meeting.startTime} {meeting.endTime ? `- ${meeting.endTime}` : ''})
                      </span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{meeting.location}</span>
                      </span>
                      {meeting.virtualLink && (
                        <a
                          href={meeting.virtualLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-medium"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Virtual Room</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                    {/* Live Attendance Register Button */}
                    <button
                      onClick={() => setAttendanceModalMeeting(meeting)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Live Attendance Register ({presentCount}/{totalInvited})</span>
                    </button>

                    {/* Publish Minutes Button (if canManage & not completed) */}
                    {canManage && meeting.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleOpenMinutesModal(meeting)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>{meeting.status === 'COMPLETED' ? 'View Minutes' : 'Record Minutes & Close'}</span>
                      </button>
                    )}

                    {/* Expand Agenda Toggle */}
                    <button
                      onClick={() => setExpandedMeetingId(isExpanded ? null : meeting.id)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition"
                      title={isExpanded ? 'Collapse Agenda' : 'Expand Agenda'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Live Attendance / RSVP Progress Summary Bar */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-slate-400">Attendance Tally:</span>
                    <span className="font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Present: {presentCount}</span>
                    </span>
                    <span className="font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>RSVP Attending: {attendingCount}</span>
                    </span>
                    <span className="font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60 flex items-center gap-1">
                      <UserX className="w-3.5 h-3.5" />
                      <span>Absent: {absentCount}</span>
                    </span>
                    {excusedCount > 0 && (
                      <span className="font-semibold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
                        Excused: {excusedCount}
                      </span>
                    )}
                  </div>

                  {/* Interactive RSVP Action for Logged-in Shareholder / Attendee */}
                  {currentMemberId && myAttendeeRecord && meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && (
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                      <span className="text-[11px] text-slate-400">My RSVP:</span>
                      <span className="font-bold text-white text-[11px] capitalize">
                        {myAttendeeRecord.rsvpStatus.toLowerCase()}
                      </span>
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleMemberRSVP(meeting.id, 'ATTENDING')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            myAttendeeRecord.rsvpStatus === 'ATTENDING'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-emerald-950'
                          }`}
                        >
                          Attending
                        </button>
                        <button
                          onClick={() => handleMemberRSVP(meeting.id, 'TENTATIVE')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            myAttendeeRecord.rsvpStatus === 'TENTATIVE'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-amber-950'
                          }`}
                        >
                          Tentative
                        </button>
                        <button
                          onClick={() => handleMemberRSVP(meeting.id, 'UNABLE_TO_ATTEND')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            myAttendeeRecord.rsvpStatus === 'UNABLE_TO_ATTEND'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-rose-950'
                          }`}
                        >
                          Cannot Attend
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Agenda & Meeting Details Section */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800 space-y-4 animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                          <span>Structured Meeting Agenda Items ({meeting.agenda.length})</span>
                        </h5>
                        <span className="text-[11px] text-slate-400">
                          Presided by: <strong className="text-white">{meeting.chairperson}</strong>
                        </span>
                      </div>

                      <div className="space-y-2">
                        {meeting.agenda.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-3 text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {item.itemNumber}
                            </span>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between flex-wrap">
                                <span className="font-bold text-white text-xs">{item.title}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.allocatedMinutes} mins | Presenter: {item.presenter || 'Chairperson'}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-slate-400">{item.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Official Minutes of Meeting if Published */}
                    {meeting.minutesOfMeeting && (
                      <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-2 text-xs">
                        <h5 className="font-bold text-emerald-300 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span>Official Minutes of the Meeting & Ratified Resolutions</span>
                        </h5>
                        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-[11px] font-mono bg-slate-950/90 p-3 rounded-lg border border-slate-800">
                          {meeting.minutesOfMeeting}
                        </div>
                        {meeting.officialResolutions && meeting.officialResolutions.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="font-semibold text-slate-300 text-[11px]">Ratified Resolutions:</span>
                            <ul className="list-disc pl-5 text-[11px] text-emerald-400 space-y-0.5">
                              {meeting.officialResolutions.map((res, i) => (
                                <li key={i}>{res}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Live Attendance Register Modal */}
      {attendanceModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Official Attendance Register
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <span>{attendanceModalMeeting.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Date: {attendanceModalMeeting.date} ({attendanceModalMeeting.startTime}) | Venue: {attendanceModalMeeting.location}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportAttendanceCSV(attendanceModalMeeting)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Export Attendance Sheet as CSV file"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setAttendanceModalMeeting(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Attendance Tally & Controls */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search member, ID, share #..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {(['ALL', 'PRESENT', 'ABSENT', 'EXCUSED', 'PENDING'] as const).map((filterOpt) => (
                    <button
                      key={filterOpt}
                      onClick={() => setAttendanceFilter(filterOpt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        attendanceFilter === filterOpt
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {filterOpt}
                    </button>
                  ))}
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBatchMarkPresent(attendanceModalMeeting)}
                    className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Mark RSVP Attending as Present</span>
                  </button>
                </div>
              )}
            </div>

            {/* Attendance List Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Member ID & Share</th>
                    <th className="py-2.5 px-3">Shareholder / Official</th>
                    <th className="py-2.5 px-3">Role / Designation</th>
                    <th className="py-2.5 px-3">Member RSVP</th>
                    <th className="py-2.5 px-3">Attendance Record</th>
                    {canManage && <th className="py-2.5 px-3 text-right">Quick Mark Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {Object.values(attendanceModalMeeting.attendees)
                    .filter((a) => {
                      if (attendanceFilter === 'PRESENT' && a.attendanceStatus !== 'PRESENT') return false;
                      if (attendanceFilter === 'ABSENT' && a.attendanceStatus !== 'ABSENT') return false;
                      if (attendanceFilter === 'EXCUSED' && a.attendanceStatus !== 'EXCUSED') return false;
                      if (attendanceFilter === 'PENDING' && a.attendanceStatus !== 'PENDING') return false;

                      if (attendanceSearch.trim()) {
                        const q = attendanceSearch.toLowerCase();
                        const matchId = a.memberId.toLowerCase().includes(q);
                        const matchName = a.name.toLowerCase().includes(q);
                        const matchShare = String(a.shareNumber || '').includes(q);
                        if (!matchId && !matchName && !matchShare) return false;
                      }
                      return true;
                    })
                    .map((att) => (
                      <tr key={att.memberId} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-mono font-bold text-white">
                          <span className="text-emerald-400">{att.memberId}</span>
                          {att.shareNumber && (
                            <span className="text-[10px] text-slate-500 ml-1.5 font-normal">
                              (Share #{att.shareNumber})
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-200">
                          {att.name}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            att.isECMember
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {att.designation || 'Shareholder'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            att.rsvpStatus === 'ATTENDING'
                              ? 'bg-emerald-950 text-emerald-400'
                              : att.rsvpStatus === 'UNABLE_TO_ATTEND'
                              ? 'bg-rose-950 text-rose-400'
                              : att.rsvpStatus === 'TENTATIVE'
                              ? 'bg-amber-950 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {att.rsvpStatus.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max ${
                            att.attendanceStatus === 'PRESENT'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : att.attendanceStatus === 'ABSENT'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : att.attendanceStatus === 'EXCUSED'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {att.attendanceStatus === 'PRESENT' && <CheckCircle2 className="w-3 h-3" />}
                            {att.attendanceStatus === 'ABSENT' && <XCircle className="w-3 h-3" />}
                            <span>{att.attendanceStatus}</span>
                          </span>
                        </td>
                        {canManage && (
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleMarkAttendance(attendanceModalMeeting.id, att.memberId, 'PRESENT')}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                                  att.attendanceStatus === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow'
                                    : 'bg-slate-800 text-slate-300 hover:bg-emerald-950'
                                }`}
                                title="Mark Present"
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(attendanceModalMeeting.id, att.memberId, 'ABSENT')}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                                  att.attendanceStatus === 'ABSENT'
                                    ? 'bg-rose-600 text-white shadow'
                                    : 'bg-slate-800 text-slate-300 hover:bg-rose-950'
                                }`}
                                title="Mark Absent"
                              >
                                A
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(attendanceModalMeeting.id, att.memberId, 'EXCUSED')}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                                  att.attendanceStatus === 'EXCUSED'
                                    ? 'bg-amber-600 text-white shadow'
                                    : 'bg-slate-800 text-slate-300 hover:bg-amber-950'
                                }`}
                                title="Mark Excused"
                              >
                                E
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setAttendanceModalMeeting(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule / Edit Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>{editingMeeting ? 'Modify Meeting Details' : 'Convene Official Meeting (Scheduler)'}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMeetingSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Meeting Title */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Meeting Title & Subject</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 15th Special General Meeting (SGM) on Master Plan & Land Allocation"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500"
                />
              </div>

              {/* Meeting Type & Target Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Meeting Classification</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const val = e.target.value as MeetingType;
                      setFormType(val);
                      if (val === 'SGM' || val === 'AGM') {
                        setFormTargetScope('ALL_SHARE_OWNERS');
                      } else {
                        setFormTargetScope('EC_AND_SELECTED_MEMBERS');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                  >
                    <option value="EC_MEETING">Executive Committee (EC) Meeting</option>
                    <option value="SGM">Special General Meeting (SGM) - All Shareholders</option>
                    <option value="AGM">Annual General Meeting (AGM) - All Shareholders</option>
                    <option value="EMERGENCY_EC">Emergency EC Meeting</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Target Audience & Attendees</label>
                  <select
                    value={formTargetScope}
                    onChange={(e) => setFormTargetScope(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                  >
                    <option value="ALL_SHARE_OWNERS">All 144 Share Owners (General Assembly)</option>
                    <option value="EC_AND_SELECTED_MEMBERS">Executive Committee (EC) + Selected Invitees</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Date of Meeting</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Start Time</label>
                  <input
                    type="text"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">End Time (Expected)</label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="e.g. 01:30 PM"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              {/* Location & Virtual Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Physical Location / Venue</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Society Registered Secretariat, Sector 14, Uttara, Dhaka"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Virtual Meeting Link (Zoom / Meet)</label>
                  <input
                    type="url"
                    value={formVirtualLink}
                    onChange={(e) => setFormVirtualLink(e.target.value)}
                    placeholder="https://meet.google.com/phs-governance"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              {/* Chairperson */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Presided By (Chairperson)</label>
                <input
                  type="text"
                  required
                  value={formChairperson}
                  onChange={(e) => setFormChairperson(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              {/* Invite Specific Members (if EC_AND_SELECTED_MEMBERS) */}
              {formTargetScope === 'EC_AND_SELECTED_MEMBERS' && (
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Invite Additional Selected Share Owners</span>
                    <span className="text-[11px] text-slate-400">
                      EC Members are auto-included.
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-1">
                    {members.slice(0, 30).map((m) => {
                      const isSelected = formSelectedMemberIds.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormSelectedMemberIds([...formSelectedMemberIds, m.id]);
                              } else {
                                setFormSelectedMemberIds(formSelectedMemberIds.filter((id) => id !== m.id));
                              }
                            }}
                            className="rounded accent-emerald-500"
                          />
                          <span className="truncate">{m.id} - {m.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Agenda Items Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>Meeting Agenda Points</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAgendaRow}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Agenda Point</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formAgenda.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                          Agenda #{idx + 1}
                        </span>
                        {formAgenda.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAgendaRow(idx)}
                            className="text-rose-400 hover:text-rose-300 text-[11px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Agenda title (e.g. Contractor bill approval, Master plan review)"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...formAgenda];
                          updated[idx].title = e.target.value;
                          setFormAgenda(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Presenter / Lead Official"
                          value={item.presenter}
                          onChange={(e) => {
                            const updated = [...formAgenda];
                            updated[idx].presenter = e.target.value;
                            setFormAgenda(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="5"
                            max="180"
                            placeholder="Duration (mins)"
                            value={item.allocatedMinutes}
                            onChange={(e) => {
                              const updated = [...formAgenda];
                              updated[idx].allocatedMinutes = parseInt(e.target.value) || 15;
                              setFormAgenda(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                          />
                          <span className="text-slate-400 text-[11px]">mins</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Push & Automated Daily Reminder Notice */}
              <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-800/60 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formEnableDailyReminders}
                    onChange={(e) => setFormEnableDailyReminders(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <span className="font-semibold text-emerald-300">
                    Enable Automated Daily Reminders (Dispatches Push Alert every day until meeting concludes)
                  </span>
                </label>
                <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
                  Upon saving, instant notifications will be dispatched to all targeted shareholders. The automated watchdog will remind them daily in the morning with a live countdown.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  {editingMeeting ? 'Save Meeting Changes' : 'Broadcast & Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Minutes & Resolutions Modal */}
      {minutesModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Publish Minutes of the Meeting & Resolutions</span>
              </h3>
              <button
                onClick={() => setMinutesModalMeeting(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMinutes} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white text-sm">{minutesModalMeeting.title}</span>
                <p className="text-slate-400 text-[11px]">
                  Date: {minutesModalMeeting.date} | Chairperson: {minutesModalMeeting.chairperson}
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Official Minutes & Discussion Notes</label>
                <textarea
                  required
                  rows={5}
                  value={minutesText}
                  onChange={(e) => setMinutesText(e.target.value)}
                  placeholder="Record discussions, financial approvals, decisions, and key outcomes..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                />
              </div>

              {/* Official Resolutions */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">Formal Ratified Resolutions</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    placeholder="e.g. Resolution 1: Approved Contractor Earth Filling payment of ৳ 850,000."
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddResolution}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-lg"
                  >
                    Add
                  </button>
                </div>

                {resolutionsList.length > 0 && (
                  <div className="space-y-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    {resolutionsList.map((res, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 p-2 rounded-lg">
                        <span>{i + 1}. {res}</span>
                        <button
                          type="button"
                          onClick={() => setResolutionsList(resolutionsList.filter((_, idx) => idx !== i))}
                          className="text-rose-400 hover:text-rose-300 text-[11px] ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-[11px] text-amber-300">
                Submitting this form marks the meeting status as <strong>COMPLETED</strong> and publishes the ratified minutes to all relevant shareholder ledgers.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMinutesModalMeeting(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Publish Minutes & Complete Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
