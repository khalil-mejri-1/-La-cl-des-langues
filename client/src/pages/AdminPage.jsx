import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import MeetModal from '../components/MeetModal';
import ChangeStudentAvatarModal from '../components/ChangeStudentAvatarModal';
import { API_BASE_URL } from '../config';
import { createNotification } from '../utils/notifications';
import { AdminSessionPackSkeleton, TableRowsSkeleton } from '../components/Skeletons';

// Sound disabled per user request
const playNotificationChime = () => {};

export default function AdminPage() {
  const { t, lang, isRtl } = useLanguage();
  const { user, loginUser, updateCurrentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('session'); // 'session' | 'client' | 'calendar'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSession, setEditingSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [selectedStudentForAvatar, setSelectedStudentForAvatar] = useState(null);
  const [highlightedSessionId, setHighlightedSessionId] = useState(null);
  const [highlightedGroupId, setHighlightedGroupId] = useState(null);

  // Calendar Lock & Month state for Teacher
  const initialLoadDoneRef = useRef(false);
  const [adminCalMonth, setAdminCalMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState(user?.blockedDates || []);
  const [blockedSlots, setBlockedSlots] = useState(user?.blockedSlots || []); // Format: ["YYYY-MM-DD_10:00", ...]
  const [customDaySlots, setCustomDaySlots] = useState(user?.customDaySlots || {}); // Format: { "YYYY-MM-DD": ["11:00", "15:00"] }
  const [selectedDayForSlots, setSelectedDayForSlots] = useState(null); // 'YYYY-MM-DD' modal for hour management
  const [confirmLockMonthModal, setConfirmLockMonthModal] = useState(null); // { monthName, datesToBlock }
  const [lockSaving, setLockSaving] = useState(false);
  const [showGlobalTimeModal, setShowGlobalTimeModal] = useState(false);

  // Pagination State for Sessions
  const [sessionPage, setSessionPage] = useState(1);
  const SESSIONS_PER_PAGE = 5;

  // Role detection:
  // 1. hasAdminRole: true if user has 'admin' (even if combined with 'maitresse' like ['admin', 'maitresse'])
  // 2. isOnlyMaitresse: true if user has 'maitresse' and does NOT have 'admin'
  const hasAdminRole = (() => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const r = user.role || user.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('admin');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('admin'));
    return false;
  })();

  const isOnlyMaitresse = (() => {
    if (!user) return false;
    if (hasAdminRole) return false;
    const r = user.role || user.roles;
    if (!r) return false;
    const roleStr = Array.isArray(r) ? r.join(' ').toLowerCase() : String(r).toLowerCase();
    return roleStr.includes('maitresse') || roleStr.includes('teacher') || roleStr.includes('maître');
  })();

  // Real clients from MongoDB + fallback mocks
  const [clientsList, setClientsList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Confirmation & Edit Modals State
  const [editAccountModal, setEditAccountModal] = useState(null); // { client, role, status }
  const [deleteModalData, setDeleteModalData] = useState(null); // client
  const [actionLoading, setActionLoading] = useState(false);

  // Dynamic Sessions from MongoDB & Cache
  const [adminSessions, setAdminSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchSessions = async (isPolling = false) => {
    if (!isPolling) setLoadingSessions(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions`);
      const data = await res.json();
      if (res.ok && data.sessions && Array.isArray(data.sessions)) {
        setAdminSessions(data.sessions);
      } else {
        const cached = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
        if (cached.length > 0) {
          setAdminSessions(cached);
        }
      }
    } catch (err) {
      if (!isPolling) console.log('Erreur chargement sessions:', err);
      const cached = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
      if (cached.length > 0) {
        setAdminSessions(cached);
      }
    } finally {
      if (!isPolling) setLoadingSessions(false);
      initialLoadDoneRef.current = true;
    }
  };

  // If user is only Maitresse, restrict tab to 'session' and lock 'client'
  useEffect(() => {
    if (isOnlyMaitresse && activeTab === 'client') {
      setActiveTab('session');
    }
  }, [isOnlyMaitresse, activeTab]);

  // Read target tab and session from sessionStorage if present
  useEffect(() => {
    try {
      const storedTab = sessionStorage.getItem('admin_target_tab');
      if (storedTab && ['session', 'client', 'calendar'].includes(storedTab)) {
        setActiveTab(storedTab);
        sessionStorage.removeItem('admin_target_tab');
      }
      const storedSessId = sessionStorage.getItem('admin_target_session_id');
      if (storedSessId) {
        setHighlightedSessionId(storedSessId);
        sessionStorage.removeItem('admin_target_session_id');
      }
    } catch {}
  }, []);

  // Read tab and session params from URL (e.g. /admin?tab=session&sessionId=123)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['session', 'client', 'calendar'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const sessIdParam = searchParams.get('sessionId');
    if (sessIdParam) {
      setHighlightedSessionId(sessIdParam);
    }
  }, [searchParams]);

  // Listen for notification click → switch to session tab & refresh
  useEffect(() => {
    const handleSwitchTab = (e) => {
      const tab = e.detail?.tab || 'session';
      setActiveTab(tab);
      fetchSessions(true);

      const targetSessId = e.detail?.sessionId || e.detail?.notif?.meta?.sessionId;
      if (targetSessId) {
        setHighlightedSessionId(String(targetSessId));
      }
      // Scroll to top of session list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('admin_switch_tab', handleSwitchTab);
    return () => window.removeEventListener('admin_switch_tab', handleSwitchTab);
  }, []);

  // Sync blocked dates & slots & customDaySlots from user context
  useEffect(() => {
    if (user?.blockedDates) setBlockedDates(user.blockedDates);
    if (user?.blockedSlots) setBlockedSlots(user.blockedSlots);
    if (user?.customDaySlots) setCustomDaySlots(user.customDaySlots);
  }, [user]);

  // Save all schedule options to DB & current user state
  const saveFullScheduleToDB = async (payload) => {
    setLockSaving(true);
    const targetId = user?.id || user?._id;

    const newBlockedDates = payload.blockedDates !== undefined ? payload.blockedDates : blockedDates;
    const newBlockedSlots = payload.blockedSlots !== undefined ? payload.blockedSlots : blockedSlots;
    const newCustomDaySlots = payload.customDaySlots !== undefined ? payload.customDaySlots : customDaySlots;
    const newTimeSlots = payload.timeSlots !== undefined ? payload.timeSlots : (user?.timeSlots || []);

    setBlockedDates(newBlockedDates);
    setBlockedSlots(newBlockedSlots);
    setCustomDaySlots(newCustomDaySlots);

    if (targetId) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/teachers/${targetId}/schedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockedDates: newBlockedDates,
            blockedSlots: newBlockedSlots,
            customDaySlots: newCustomDaySlots,
            timeSlots: newTimeSlots,
          }),
        });
        if (res.ok) {
          updateCurrentUser?.({
            blockedDates: newBlockedDates,
            blockedSlots: newBlockedSlots,
            customDaySlots: newCustomDaySlots,
            timeSlots: newTimeSlots,
          });

          // Broadcast schedule update in real time
          window.dispatchEvent(new CustomEvent('teacher_schedule_updated', {
            detail: {
              teacherId: targetId,
              blockedDates: newBlockedDates,
              blockedSlots: newBlockedSlots,
              customDaySlots: newCustomDaySlots,
              timeSlots: newTimeSlots,
            }
          }));

          try {
            localStorage.setItem('teacher_schedule_cache_sync', JSON.stringify({
              ts: Date.now(),
              teacherId: targetId,
              blockedDates: newBlockedDates,
              blockedSlots: newBlockedSlots,
              customDaySlots: newCustomDaySlots,
              timeSlots: newTimeSlots,
            }));
          } catch {}
        }
      } catch (err) {
        console.error('Erreur sauvegarde du planning:', err);
      } finally {
        setLockSaving(false);
      }
    } else {
      setLockSaving(false);
    }
  };

  // Save blocked dates Specifically
  const saveBlockedDatesToDB = async (newBlockedDates, newBlockedSlots = blockedSlots) => {
    saveFullScheduleToDB({ blockedDates: newBlockedDates, blockedSlots: newBlockedSlots });
  };

  // Save blocked slots specifically
  const saveBlockedSlotsToDB = async (newBlockedSlots) => {
    saveFullScheduleToDB({ blockedSlots: newBlockedSlots });
  };

  // Add Day-Specific Custom Time Slot (saved for THAT day only)
  const handleAddDaySpecificTimeSlot = (dateStr, newTimeStr) => {
    if (!dateStr || !newTimeStr) return;
    const existingDaySlots = customDaySlots[dateStr] || [];
    if (!existingDaySlots.includes(newTimeStr)) {
      const updated = {
        ...customDaySlots,
        [dateStr]: [...existingDaySlots, newTimeStr],
      };
      saveFullScheduleToDB({ customDaySlots: updated });
    }
  };

  // Delete Day-Specific Custom Time Slot
  const handleDeleteDaySpecificTimeSlot = (dateStr, timeToDelete) => {
    const existingDaySlots = customDaySlots[dateStr] || [];
    const updatedDaySlots = existingDaySlots.filter(t => t !== timeToDelete);
    const updated = {
      ...customDaySlots,
      [dateStr]: updatedDaySlots,
    };
    saveFullScheduleToDB({ customDaySlots: updated });
  };

  // Add Shared (Global) Time Slot for ALL Days
  const handleAddGlobalTimeSlot = (newTimeStr) => {
    if (!newTimeStr) return;
    const currentSlots = user?.timeSlots || [];
    if (!currentSlots.includes(newTimeStr)) {
      const updated = [...currentSlots, newTimeStr];
      saveFullScheduleToDB({ timeSlots: updated });
    }
  };

  // Delete Shared (Global) Time Slot from ALL Days
  const handleDeleteGlobalTimeSlot = (timeToDelete) => {
    const currentSlots = user?.timeSlots || [];
    const updated = currentSlots.filter(t => (typeof t === 'object' ? (t.fr || t.ar || t.en) : t) !== timeToDelete);
    saveFullScheduleToDB({ timeSlots: updated });
  };

  // Toggle Single Hour Slot Lock/Unlock for Teacher (Format: "YYYY-MM-DD_10:00")
  const handleToggleSingleSlotLock = (dateStr, slotTime) => {
    const slotKey = `${dateStr}_${slotTime}`;
    const isCurrentlyBlocked = blockedSlots.includes(slotKey);
    let updated;
    if (isCurrentlyBlocked) {
      updated = blockedSlots.filter(s => s !== slotKey);
    } else {
      updated = [...blockedSlots, slotKey];
    }
    saveBlockedSlotsToDB(updated);
  };

  // Toggle Single Day Lock/Unlock for Teacher
  const handleToggleSingleDayLock = (dateStr) => {
    const isCurrentlyBlocked = blockedDates.includes(dateStr);
    let updated;
    if (isCurrentlyBlocked) {
      // Unlock day
      updated = blockedDates.filter(d => d !== dateStr);
    } else {
      // Lock day
      updated = [...blockedDates, dateStr];
    }
    saveBlockedDatesToDB(updated);
  };

  // Lock All Days of Current Month Action (with confirmation modal)
  const requestLockEntireMonth = () => {
    const year = adminCalMonth.getFullYear();
    const month = adminCalMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDates = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      monthDates.push(`${y}-${m}-${day}`);
    }

    const monthName = adminCalMonth.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'long', year: 'numeric' });
    setConfirmLockMonthModal({ monthName, datesToBlock: monthDates });
  };

  // Confirm Lock Entire Month
  const confirmLockEntireMonth = () => {
    if (!confirmLockMonthModal) return;
    const combined = Array.from(new Set([...blockedDates, ...confirmLockMonthModal.datesToBlock]));
    saveBlockedDatesToDB(combined);
    setConfirmLockMonthModal(null);
  };

  // Reset page to 1 on search or tab change
  useEffect(() => {
    setSessionPage(1);
  }, [searchQuery, activeTab]);

  // Check if a session belongs to / is relevant to current user
  const isSessionRelevant = (session) => {
    if (!session) return false;
    if (hasAdminRole) return true;

    if (isOnlyMaitresse) {
      const currentId = String(user?.id || user?._id || '').trim();
      const currentEmail = (user?.email || '').toLowerCase().trim();
      const currentParentName = (user?.parentName || '').toLowerCase().trim();
      const currentUsername = currentEmail.split('@')[0];

      const sTeacherId = String(session.teacherId || '').trim();
      const sTeacherEmail = (session.teacherEmail || '').toLowerCase().trim();
      const sTeacherName = (session.teacherName || '').toLowerCase().trim();

      if (sTeacherId && currentId && sTeacherId === currentId) return true;
      if (sTeacherEmail && currentEmail && sTeacherEmail === currentEmail) return true;
      if (sTeacherName) {
        if (currentParentName && (sTeacherName.includes(currentParentName) || currentParentName.includes(sTeacherName))) return true;
        if (currentUsername && (sTeacherName.includes(currentUsername) || currentUsername.includes(sTeacherName))) return true;
      }
      return false;
    }
    return false;
  };

  // Multi-channel real-time listener + polling heartbeat
  useEffect(() => {
    fetchSessions();

    // 1. Same-window custom event
    const handleSessionCreated = (e) => {
      const newSession = e.detail;
      if (newSession) {
        triggerNotification(newSession);
      }
      fetchSessions(true);
    };
    window.addEventListener('session_created', handleSessionCreated);

    // 2. BroadcastChannel across different browser tabs/windows
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('app_sessions_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_SESSION_BOOKED' && event.data?.session) {
            triggerNotification(event.data.session);
            fetchSessions(true);
          }
        };
      }
    } catch {}

    // 3. Storage event across tabs
    const handleStorage = (e) => {
      if (e.key === 'admin_latest_booked_session' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.session) {
            triggerNotification(parsed.session);
            fetchSessions(true);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Lightweight polling heartbeat (every 4 seconds) to ensure zero delay
    const interval = setInterval(() => {
      fetchSessions(true);
    }, 4000);

    return () => {
      window.removeEventListener('session_created', handleSessionCreated);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [user, hasAdminRole, isOnlyMaitresse]);


  // Fetch clients from MongoDB Atlas (Always fetch so teacher subjects are readily available)
  useEffect(() => {
    fetchClients();
  }, [hasAdminRole]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/clients`);
      const data = await res.json();
      if (res.ok && data.clients) {
        setClientsList(data.clients);
      }
    } catch (err) {
      console.log('Erreur chargement clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Helper to dynamically resolve the teacher's configured subject
  const getTeacherSubjectForSession = (session) => {
    if (!session) return 'Français & Arabe';

    const currentId = String(user?.id || user?._id || '').trim();
    const currentEmail = (user?.email || '').toLowerCase().trim();
    const currentParentName = (user?.parentName || '').toLowerCase().trim();
    const currentUsername = currentEmail.split('@')[0];

    const sTeacherId = String(session.teacherId || '').trim();
    const sTeacherEmail = (session.teacherEmail || '').toLowerCase().trim();
    const sTeacherName = (session.teacherName || '').toLowerCase().trim();

    // 1. If current logged in teacher matches session
    if (
      user?.subject && (
        (sTeacherId && currentId && sTeacherId === currentId) ||
        (sTeacherEmail && currentEmail && sTeacherEmail === currentEmail) ||
        (sTeacherName && currentParentName && (sTeacherName.includes(currentParentName) || currentParentName.includes(sTeacherName))) ||
        (sTeacherName && currentUsername && (sTeacherName.includes(currentUsername) || currentUsername.includes(sTeacherName)))
      )
    ) {
      const match = String(session.subject || '').match(/(\(Séance \d+\/4\))/);
      const suffix = match ? ` ${match[1]}` : '';
      return `${user.subject}${suffix}`;
    }

    // 2. Search in clientsList
    const matchedClient = clientsList.find((c) => {
      const cId = String(c._id || c.id || '').trim();
      const cEmail = (c.email || '').toLowerCase().trim();
      const cName = (c.parentName || c.name || c.email?.split('@')[0] || '').toLowerCase().trim();

      if (sTeacherId && cId && sTeacherId === cId) return true;
      if (sTeacherEmail && cEmail && sTeacherEmail === cEmail) return true;
      if (sTeacherName && cName && (sTeacherName.includes(cName) || cName.includes(sTeacherName))) return true;
      return false;
    });

    if (matchedClient?.subject) {
      const match = String(session.subject || '').match(/(\(Séance \d+\/4\))/);
      const suffix = match ? ` ${match[1]}` : '';
      return `${matchedClient.subject}${suffix}`;
    }

    return session.subject || 'Français & Arabe';
  };

  const parseRoles = (roleData) => {
    if (!roleData) return ['user'];
    if (Array.isArray(roleData)) return roleData.map(r => String(r).toLowerCase().trim());
    return String(roleData).toLowerCase().split(',').map(r => r.trim()).filter(Boolean);
  };

  // Open Edit Account (Role, Status, Teacher Subject & Phone) Modal
  const openEditAccountModal = (client) => {
    const rolesArray = parseRoles(client.role);
    setEditAccountModal({
      client,
      roles: rolesArray.length > 0 ? rolesArray : ['user'],
      status: client.status || 'Actif',
      subject: client.subject || 'Français & Arabe',
      phone: client.phone || client.studentPhone || '',
    });
  };

  // Toggle Role in Edit Account Modal
  const toggleRoleInModal = (roleKey) => {
    setEditAccountModal(prev => {
      const current = prev?.roles || [];
      const exists = current.includes(roleKey);
      let updated;
      if (exists) {
        updated = current.filter(r => r !== roleKey);
        if (updated.length === 0) updated = ['user'];
      } else {
        updated = [...current, roleKey];
      }
      return { ...prev, roles: updated };
    });
  };

  // Confirm Account Role, Status & Phone Update
  const confirmAccountUpdate = async () => {
    if (!editAccountModal) return;
    setActionLoading(true);
    const { client, roles: targetRoles, status: targetStatus, subject: targetSubject, phone: targetPhone } = editAccountModal;
    const targetRoleString = (targetRoles || ['user']).join(', ');

    try {
      if (client._id) {
        const res = await fetch(`${API_BASE_URL}/api/clients/${client._id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: targetRoleString,
            status: targetStatus,
            subject: targetSubject || 'Français & Arabe',
            phone: targetPhone || '',
          }),
        });
        if (res.ok) {
          setClientsList(prev => prev.map(c => c._id === client._id ? { ...c, role: targetRoleString, status: targetStatus, subject: targetSubject, phone: targetPhone } : c));
          
          const isCurrentLoggedInUser = user && (
            String(user.id || user._id) === String(client._id) ||
            user.email?.toLowerCase() === client.email?.toLowerCase()
          );

          if (isCurrentLoggedInUser) {
            updateCurrentUser({ role: targetRoleString, status: targetStatus, subject: targetSubject, phone: targetPhone });
            loginUser({ ...user, role: targetRoleString, status: targetStatus, subject: targetSubject, phone: targetPhone });
          }

          // Real-time instant notification event
          window.dispatchEvent(new CustomEvent('auth_role_updated', {
            detail: { clientId: client._id, role: targetRoleString, status: targetStatus, subject: targetSubject, phone: targetPhone }
          }));

          fetchSessions(true);
          fetchClients();
        }
      } else {
        // Mock update
        setClientsList(prev => prev.map(c => c === client ? { ...c, role: targetRoleString, status: targetStatus, subject: targetSubject, phone: targetPhone } : c));
        if (user && user.email === client.email) {
          updateCurrentUser({ role: targetRoleString, status: targetStatus, subject: targetSubject, phone: targetPhone });
          loginUser({ ...user, role: targetRoleString, status: targetStatus, subject: targetSubject, phone: targetPhone });
        }
      }
    } catch (err) {
      console.error('Erreur mise à jour compte:', err);
    } finally {
      setActionLoading(false);
      setEditAccountModal(null);
    }
  };

  // Trigger Delete Confirmation Modal
  const requestDeleteClient = (client) => {
    setDeleteModalData(client);
  };

  // Confirm Delete API Call
  const confirmDeleteClient = async () => {
    if (!deleteModalData) return;
    setActionLoading(true);
    const client = deleteModalData;

    try {
      if (client._id) {
        const res = await fetch(`${API_BASE_URL}/api/clients/${client._id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setClientsList(prev => prev.filter(c => c._id !== client._id));
        }
      } else {
        // Mock delete
        setClientsList(prev => prev.filter(c => c !== client));
      }
    } catch (err) {
      console.error('Erreur suppression client:', err);
    } finally {
      setActionLoading(false);
      setDeleteModalData(null);
    }
  };

  // Confirm Delete Session API Call
  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const sessionId = String(sessionToDelete._id || sessionToDelete.id);
    setActionLoading(true);

    // Optimistically update local state
    setAdminSessions(prev => prev.filter(s => String(s._id || s.id) !== sessionId));

    try {
      await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      // Update localStorage cache
      try {
        const existing = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
        const updated = existing.filter(s => String(s._id || s.id) !== sessionId);
        localStorage.setItem('admin_sessions_cache', JSON.stringify(updated));
      } catch {}

      // Broadcast to other tabs/windows
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('app_sessions_channel');
          bc.postMessage({ type: 'SESSION_DELETED', sessionId });
          bc.close();
        }
      } catch {}

      // Custom event for same-window updates
      window.dispatchEvent(new CustomEvent('session_deleted', { detail: { sessionId } }));
    } catch (err) {
      console.error('Erreur suppression session:', err);
    } finally {
      setActionLoading(false);
      setSessionToDelete(null);
    }
  };

  const handleSaveMeetLink = async (sessionId, meetUrl, customStatus) => {
    const targetUrl = meetUrl || 'https://meet.google.com/xyz';
    const finalStatus = customStatus || (meetUrl ? 'meet_added' : 'pending');

    // Find session info before updating state
    const session = adminSessions.find(s => String(s._id || s.id) === String(sessionId));

    setAdminSessions(prev => prev.map(s => {
      if (String(s._id || s.id) === String(sessionId)) {
        return {
          ...s,
          meetUrl: targetUrl,
          status: finalStatus
        };
      }
      return s;
    }));

    try {
      await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetUrl: targetUrl, status: finalStatus }),
      });
    } catch (err) {
      console.error('Erreur mise à jour session meet:', err);
    }

    // ── Instant Local & Cross-Tab Broadcasts ────────────────────────────────
    try {
      const cached = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
      const updatedCache = cached.map(s => (String(s._id || s.id) === String(sessionId)) ? { ...s, meetUrl: targetUrl, status: finalStatus } : s);
      localStorage.setItem('admin_sessions_cache', JSON.stringify(updatedCache));
    } catch {}

    window.dispatchEvent(new CustomEvent('session_updated', {
      detail: { sessionId, meetUrl: targetUrl, status: finalStatus }
    }));
    window.dispatchEvent(new CustomEvent('session_created', {
      detail: { sessionId, meetUrl: targetUrl, status: finalStatus }
    }));

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('app_sessions_channel');
        bc.postMessage({
          type: 'MEET_LINK_ADDED',
          sessionId: String(sessionId),
          meetUrl: targetUrl,
          status: finalStatus,
        });
        bc.close();
      }
    } catch {}

    // ── Real-time notification broadcast to student ──────────────────────────
    if (session) {
      const teacherDisplayName = user?.parentName || user?.email?.split('@')[0] || session.teacherName || 'La maîtresse';
      const studentDisplayName = session.studentName || session.childName || session.parentName || 'Élève';

      createNotification({
        type: 'MEET_LINK_ADDED',
        targetStudentId: String(session.studentId || ''),
        targetStudentEmail: session.studentEmail || '',
        targetTeacherName: teacherDisplayName,
        title: {
          fr: `🔗 Lien Google Meet ajouté !`,
          ar: `🔗 تمت إضافة رابط Google Meet !`,
          en: `🔗 Google Meet link ready!`,
        },
        desc: {
          fr: `${teacherDisplayName} a ajouté le lien pour votre séance du ${session.day || ''} à ${session.time || ''}.`,
          ar: `أضافت المعلمة ${teacherDisplayName} رابط حصتك ليوم ${session.day || ''} الساعة ${session.time || ''}.`,
          en: `${teacherDisplayName} added the link for your session on ${session.day || ''} at ${session.time || ''}.`,
        },
        icon: 'videocam',
        iconBg: 'bg-emerald-100 text-emerald-700',
        link: '/dashboard',
        meta: {
          sessionId: String(session._id || session.id),
          meetUrl: targetUrl,
          day: session.day,
          time: session.time,
        },
      });

      // Backward compatible student_notifications event
      try {
        const notifPayload = {
          type: 'MEET_LINK_ADDED',
          sessionId: String(session._id || session.id),
          studentId: session.studentId || '',
          studentEmail: session.studentEmail || '',
          teacherName: teacherDisplayName,
          studentName: studentDisplayName,
          day: session.day || '',
          time: session.time || '',
          subject: session.subject || 'Français & Arabe',
          meetUrl: targetUrl,
          timestamp: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem('student_notifications') || '[]');
        existing.unshift({ ...notifPayload, id: Date.now() });
        localStorage.setItem('student_notifications', JSON.stringify(existing.slice(0, 50)));
      } catch {}
    }
    // ────────────────────────────────────────────────────────────────────────

    setEditingSession(null);
  };

  // Instant update session status (e.g. Complété, Pending, Meet Added)
  const handleUpdateSessionStatus = async (sessionId, newStatus) => {
    const targetSession = adminSessions.find(s => String(s._id || s.id) === String(sessionId));

    // Optimistic update
    setAdminSessions(prev =>
      prev.map(s => (String(s._id || s.id) === String(sessionId) ? { ...s, status: newStatus } : s))
    );

    try {
      await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Erreur mise à jour statut séance:', err);
    }

    try {
      const cached = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
      const updatedCache = cached.map(s =>
        String(s._id || s.id) === String(sessionId) ? { ...s, status: newStatus } : s
      );
      localStorage.setItem('admin_sessions_cache', JSON.stringify(updatedCache));
    } catch {}

    window.dispatchEvent(new CustomEvent('session_updated', {
      detail: { sessionId, status: newStatus }
    }));

    // Send real-time notification to student if marked as completed
    if (newStatus === 'completed' || newStatus === 'done') {
      const studentDisplayName = targetSession?.studentName || targetSession?.childName || targetSession?.parentName || 'Élève';
      const teacherDisplayName = targetSession?.teacherName || user?.parentName || user?.name || 'Maîtresse';
      const timeInfo = targetSession?.day ? `${targetSession.day} à ${targetSession.time || '14:00'}` : (targetSession?.datetime || 'votre séance');

      createNotification({
        type: 'SESSION_COMPLETED',
        targetStudentId: String(targetSession?.studentId || ''),
        targetStudentEmail: (targetSession?.studentEmail || '').toLowerCase().trim(),
        targetTeacherName: teacherDisplayName,
        title: {
          fr: `🎉 Séance Complétée !`,
          ar: `🎉 اكتملت الحصة بنجاح !`,
          en: `🎉 Session Completed!`,
        },
        desc: {
          fr: `La maîtresse ${teacherDisplayName} a validé votre séance du ${timeInfo} comme complétée. Consultez votre suivi dans l'Espace Parent.`,
          ar: `أكدت المعلمة ${teacherDisplayName} اكتمال حصتكم ليوم ${timeInfo} بنجاح. تفقد تقرير المتابعة في مساحة الولي.`,
          en: `Teacher ${teacherDisplayName} marked your session on ${timeInfo} as completed. Check progress in Parent Space.`,
        },
        icon: 'verified',
        iconBg: 'bg-emerald-100 text-emerald-700',
        link: '/parent',
        meta: {
          sessionId: String(sessionId),
          studentName: studentDisplayName,
          teacherName: teacherDisplayName,
        },
      });
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('app_sessions_channel');
        bc.postMessage({
          type: 'SESSION_UPDATED',
          sessionId: String(sessionId),
          status: newStatus,
        });
        bc.close();
      }
    } catch {}
  };

  // Filter sessions according to user role:
  // - If hasAdminRole (pure admin or admin+maitresse): show ALL sessions
  // - If isOnlyMaitresse: show ONLY sessions requested for this specific teacher
  const teacherScopedSessions = adminSessions.filter(session => {
    if (hasAdminRole) return true;

    if (isOnlyMaitresse) {
      const currentId = String(user?.id || user?._id || '').trim();
      const currentEmail = (user?.email || '').toLowerCase().trim();
      const currentParentName = (user?.parentName || user?.name || '').toLowerCase().trim();
      const currentUsername = currentEmail ? currentEmail.split('@')[0].toLowerCase() : '';

      const sTeacherId = String(session.teacherId || '').trim();
      const sTeacherEmail = (session.teacherEmail || '').toLowerCase().trim();
      const sTeacherName = (session.teacherName || '').toLowerCase().trim();

      // 1. Exact teacher ID match
      if (sTeacherId && currentId && sTeacherId === currentId) return true;
      // 2. Exact teacher Email match
      if (sTeacherEmail && currentEmail && sTeacherEmail === currentEmail) return true;
      // 3. Teacher Name match with teacher's own identity
      if (sTeacherName) {
        if (currentParentName && (sTeacherName === currentParentName || sTeacherName.includes(currentParentName) || currentParentName.includes(sTeacherName))) return true;
        if (currentUsername && (sTeacherName === currentUsername || sTeacherName.includes(currentUsername) || currentUsername.includes(sTeacherName))) return true;
      }
      return false;
    }

    return true;
  });

  // Group sessions strictly by booking pack / batch request
  const groupSessions = (list) => {
    const groups = [];
    const processedIds = new Set();

    const getNum = (str) => {
      const match = String(str || '').match(/(\d+)\s*\/\s*4/);
      return match ? parseInt(match[1], 10) : null;
    };

    const getBaseSubject = (str) => {
      return String(str || '')
        .replace(/\s*\(Séance \d+\/4\)/i, '')
        .replace(/\s*\(الحصة \d+ من 4\)/i, '')
        .trim()
        .toLowerCase();
    };

    list.forEach((session, idx) => {
      const sId = String(session._id || session.id || idx);
      if (processedIds.has(sId)) return;

      const sPackId = String(session.packId || '').trim();
      const sStudentKey = (session.studentId || session.studentEmail || session.studentName || session.childName || session.parentName || '').toLowerCase().trim();
      const sTeacherKey = (session.teacherId || session.teacherName || '').toLowerCase().trim();
      const sBaseSubj = getBaseSubject(session.subject);
      const sCreated = new Date(session.createdAt || session.timestamp || 0).getTime();

      const matchingSessions = [session];
      processedIds.add(sId);

      const usedNumbers = new Set();
      const initialNum = getNum(session.subject);
      if (initialNum) usedNumbers.add(initialNum);

      list.forEach((other, otherIdx) => {
        if (matchingSessions.length >= 4) return;

        const otherId = String(other._id || other.id || otherIdx);
        if (processedIds.has(otherId)) return;

        const otherPackId = String(other.packId || '').trim();
        const otherStudentKey = (other.studentId || other.studentEmail || other.studentName || other.childName || other.parentName || '').toLowerCase().trim();
        const otherTeacherKey = (other.teacherId || other.teacherName || '').toLowerCase().trim();
        const otherBaseSubj = getBaseSubject(other.subject);
        const otherCreated = new Date(other.createdAt || other.timestamp || 0).getTime();
        const otherNum = getNum(other.subject);

        // Case 1: Both have packId -> Must match packId exactly
        if (sPackId && otherPackId) {
          if (sPackId === otherPackId) {
            matchingSessions.push(other);
            processedIds.add(otherId);
          }
          return;
        }

        // Case 2: One has packId and other has different/empty packId -> Do NOT mix
        if ((sPackId && !otherPackId) || (!sPackId && otherPackId)) {
          return;
        }

        // Case 3: Legacy sessions without packId -> Strict timestamp proximity (within 60s) AND same student, teacher, base subject
        const isCreatedTogether = sCreated && otherCreated && Math.abs(sCreated - otherCreated) <= 60 * 1000;
        const isSameGroup = sStudentKey === otherStudentKey && sTeacherKey === otherTeacherKey && sBaseSubj === otherBaseSubj;

        if (isSameGroup && isCreatedTogether) {
          if (otherNum) {
            if (!usedNumbers.has(otherNum)) {
              usedNumbers.add(otherNum);
              matchingSessions.push(other);
              processedIds.add(otherId);
            }
          } else {
            matchingSessions.push(other);
            processedIds.add(otherId);
          }
        }
      });

      // Sort matching sessions by Séance index (1, 2, 3, 4)
      matchingSessions.sort((a, b) => {
        const numA = getNum(a.subject) || 999;
        const numB = getNum(b.subject) || 999;
        if (numA !== numB) return numA - numB;
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });

      const studentName = session.studentName || session.name || session.childName || session.parentName || 'Élève';
      const studentPhone = session.studentPhone || session.phone || matchingSessions.find(ms => ms.studentPhone || ms.phone)?.studentPhone || matchingSessions.find(ms => ms.studentPhone || ms.phone)?.phone || '';

      groups.push({
        groupId: sPackId ? `group_${sPackId}` : `group_${sId}`,
        packId: sPackId,
        studentName,
        parentName: session.parentName || '',
        childAge: session.childAge || '',
        studentEmail: session.studentEmail || '',
        studentPhone,
        teacherName: session.teacherName || 'Maîtresse',
        paymentMethod: session.paymentMethod || 'fawran',
        createdAt: session.createdAt || session.timestamp,
        sessions: matchingSessions,
      });
    });

    return groups;
  };

  const filteredSessions = teacherScopedSessions.filter(s => {
    const student = (s.studentName || s.name || s.childName || s.parentName || '').toLowerCase();
    const subject = (s.subject || '').toLowerCase();
    const teacher = (s.teacherName || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return student.includes(query) || subject.includes(query) || teacher.includes(query);
  });

  // Group filtered sessions into unified booking frames
  const sessionGroups = groupSessions(filteredSessions);
  const totalGroups = sessionGroups.length;
  const GROUPS_PER_PAGE = 4;
  const totalGroupPages = Math.ceil(totalGroups / GROUPS_PER_PAGE) || 1;
  const sessionStartIndex = totalGroups === 0 ? 0 : (sessionPage - 1) * GROUPS_PER_PAGE + 1;
  const sessionEndIndex = Math.min(sessionPage * GROUPS_PER_PAGE, totalGroups);
  const displayedGroups = sessionGroups.slice((sessionPage - 1) * GROUPS_PER_PAGE, sessionPage * GROUPS_PER_PAGE);

  // Auto-scroll and highlight target session group when clicked from notification
  useEffect(() => {
    if (!highlightedSessionId || sessionGroups.length === 0) return;

    const groupIdx = sessionGroups.findIndex(g =>
      g.sessions.some(s => String(s._id || s.id) === String(highlightedSessionId)) ||
      String(g.groupId).includes(highlightedSessionId)
    );

    if (groupIdx !== -1) {
      const targetPage = Math.floor(groupIdx / GROUPS_PER_PAGE) + 1;
      if (sessionPage !== targetPage) {
        setSessionPage(targetPage);
      }
      const matchedGroup = sessionGroups[groupIdx];
      setHighlightedGroupId(matchedGroup.groupId);

      setTimeout(() => {
        const el = document.getElementById(`session_group_${matchedGroup.groupId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      const timer = setTimeout(() => {
        setHighlightedGroupId(null);
        setHighlightedSessionId(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [highlightedSessionId, sessionGroups]);

  const filteredClients = clientsList.filter(c =>
    (c.parentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.childName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div class="w-full max-w-7xl mx-auto px-container-margin py-8 md:py-12 pb-32 md:pb-16 flex flex-col gap-8 relative">
      
      {/* Header Bar */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-headline-md font-headline-md text-on-surface mb-2 font-bold">
            {activeTab === 'session'
              ? (lang === 'ar' ? 'إدارة الجلسات' : 'Gestion de Session')
              : (lang === 'ar' ? 'إدارة الحرفاء والأولياء' : 'Gestion de Client')}
          </h1>
          <p class="text-body-md font-body-md text-on-surface-variant font-medium">
            {activeTab === 'session'
              ? (lang === 'ar' ? 'إدارة طلبات الحصص إضافة روابط الاجتماعات' : 'Gérez les demandes de cours et ajoutez des liens de visioconférence.')
              : (lang === 'ar' ? 'عرض أولياء الأمور المسجلين وحسابات الأطفال' : 'Consultez la liste des parents inscrits et des élèves.')}
          </p>
        </div>

        {/* Search */}
        <div class="flex gap-4 w-full md:w-auto">
          <div class="relative flex-grow md:flex-grow-0">
            <span class="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'session' ? t.adminPage.searchPlaceholder : 'Rechercher client...'}
              class="h-12 pl-10 pr-4 rounded-xl border-2 border-surface-variant bg-surface-container-low focus:border-primary-container outline-none font-body-md transition-all w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Container Layout with Left Sidebar Navigation */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Column: Vertical Navigation Buttons */}
        <div class="lg:col-span-3 w-full order-1 lg:order-1">
          <div class="bg-surface-container-lowest rounded-3xl p-5 soft-card-shadow border-2 border-surface-variant flex flex-col gap-4 sticky top-24">
            <div class="flex items-center gap-2 border-b border-surface-variant/70 pb-3">
              <span class="material-symbols-outlined text-primary text-xl">tune</span>
              <h2 class="text-sm font-bold text-on-surface uppercase tracking-wider">
                {lang === 'ar' ? 'قائمة الإدارة' : 'Menu Admin'}
              </h2>
            </div>

            {/* Stacked Vertical Buttons */}
            <div class="flex flex-col gap-2.5">
              {/* Gestion de Client Button (Locked for Maitresse only) */}
              {isOnlyMaitresse ? (
                <div
                  title={lang === 'ar' ? 'هذا القسم مخصص للمشرفين فقط (Admin)' : 'Accès réservé aux administrateurs'}
                  class="w-full p-3.5 rounded-2xl font-bold text-sm bg-slate-100/80 text-slate-400 border border-slate-200/80 flex items-center justify-between cursor-not-allowed opacity-60 select-none"
                >
                  <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-xl text-slate-400">
                      lock
                    </span>
                    <span>Gestion de Client</span>
                  </div>
                  <span class="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    {lang === 'ar' ? 'مقفل' : 'Verrouillé'}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('client')}
                  class={`w-full p-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between group ${activeTab === 'client'
                    ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:text-[#4221b6] border border-surface-variant/80'
                    }`}
                >
                  <div class="flex items-center gap-3">
                    <span class={`material-symbols-outlined text-xl ${activeTab === 'client' ? 'text-[#b0fdb5]' : 'text-[#4221b6]'}`}>
                      person_outline
                    </span>
                    <span>Gestion de Client</span>
                  </div>
                  <span class="material-symbols-outlined text-sm opacity-60 group-hover:translate-x-1 transition-transform">
                    {isRtl ? 'chevron_left' : 'chevron_right'}
                  </span>
                </button>
              )}

              {/* Gestion de Session Button */}
              <button
                onClick={() => setActiveTab('session')}
                class={`w-full p-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between group ${activeTab === 'session'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:text-[#4221b6] border border-surface-variant/80'
                  }`}
              >
                <div class="flex items-center gap-3">
                  <span class={`material-symbols-outlined text-xl ${activeTab === 'session' ? 'text-[#b0fdb5]' : 'text-[#4221b6]'}`}>
                    event_note
                  </span>
                  <span>Gestion de Session</span>
                </div>
                <span class="material-symbols-outlined text-sm opacity-60 group-hover:translate-x-1 transition-transform">
                  {isRtl ? 'chevron_left' : 'chevron_right'}
                </span>
              </button>

              {/* Calendrier / Planning Button */}
              <button
                onClick={() => setActiveTab('calendar')}
                class={`w-full p-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between group ${activeTab === 'calendar'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:text-[#4221b6] border border-surface-variant/80'
                  }`}
              >
                <div class="flex items-center gap-3">
                  <span class={`material-symbols-outlined text-xl ${activeTab === 'calendar' ? 'text-[#b0fdb5]' : 'text-[#4221b6]'}`}>
                    calendar_month
                  </span>
                  <span>{lang === 'ar' ? 'تقويم الأستاذ والقفل' : 'Calendrier & Blocage'}</span>
                </div>
                <span class="material-symbols-outlined text-sm opacity-60 group-hover:translate-x-1 transition-transform">
                  {isRtl ? 'chevron_left' : 'chevron_right'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right/Main Column: Active Section View */}
        <div class="lg:col-span-9 w-full order-2 lg:order-2 flex flex-col gap-4">
          {activeTab === 'calendar' ? (
            /* Teacher Calendar Lock View */
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 soft-card-shadow border-2 border-surface-variant space-y-6">
              
              {/* Header & Lock Month Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1c0576] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4221b6]">edit_calendar</span>
                    <span>{lang === 'ar' ? 'إدارة تقويم الأستاذ وقفل الأيام' : 'Gestion du Calendrier & Blocage'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {lang === 'ar'
                      ? 'اضغط على أي يوم لقفله أو قفل ساعات محددة، أو أضف توقيتاً مشتركاً لجميع الأيام.'
                      : 'Cliquez sur un jour pour gérer ses horaires ou bloquer, ou ajoutez un créneau commun pour tous les jours.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setShowGlobalTimeModal(true)}
                    className="px-4 py-3 rounded-2xl bg-[#4221b6] hover:bg-[#351996] text-white font-black text-xs sm:text-sm shadow-md transition hover:scale-105 flex items-center gap-2 cursor-pointer border-2 border-[#8c90f6]/50"
                  >
                    <span className="material-symbols-outlined text-base">more_time</span>
                    <span>{lang === 'ar' ? 'توقيت مشترك لجميع الأيام 🌐' : 'Horaire commun tous jours 🌐'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={requestLockEntireMonth}
                    disabled={lockSaving}
                    className="px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm shadow-md transition hover:scale-105 flex items-center gap-2 cursor-pointer shrink-0 border-2 border-red-300"
                  >
                    <span className="material-symbols-outlined text-base">lock_clock</span>
                    <span>{lang === 'ar' ? 'قفل كامل الشهر' : 'Bloquer le mois'}</span>
                  </button>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(adminCalMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setAdminCalMonth(prev);
                  }}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">{isRtl ? 'chevron_right' : 'chevron_left'}</span>
                </button>

                <h3 className="text-lg font-black text-[#1c0576] capitalize">
                  {adminCalMonth.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'long', year: 'numeric' })}
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(adminCalMonth);
                    next.setMonth(next.getMonth() + 1);
                    setAdminCalMonth(next);
                  }}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">{isRtl ? 'chevron_left' : 'chevron_right'}</span>
                </button>
              </div>

              {/* Calendar Days Header */}
              <div className="grid grid-cols-7 text-center gap-2">
                {(lang === 'ar' ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']).map((d, idx) => (
                  <span key={idx} className="text-xs font-black text-slate-400 py-1 uppercase tracking-wider">
                    {d}
                  </span>
                ))}
              </div>

              {/* Calendar Grid Cells */}
              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {(() => {
                  const year = adminCalMonth.getFullYear();
                  const month = adminCalMonth.getMonth();
                  const firstDayOfMonth = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const cells = [];

                  // Empty slots before start
                  for (let i = 0; i < firstDayOfMonth; i++) {
                    cells.push(<div key={`empty-${i}`} className="h-14 sm:h-16 rounded-2xl bg-transparent"></div>);
                  }

                  // Days Cells
                  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
                    const dateObj = new Date(year, month, dayNum);
                    const y = dateObj.getFullYear();
                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const dateStr = `${y}-${m}-${day}`;
                    const isBlocked = blockedDates.includes(dateStr);
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    // Count how many hour slots are blocked for this specific day
                    const blockedSlotsForDay = blockedSlots.filter(s => s.startsWith(`${dateStr}_`)).length;

                    cells.push(
                      <div
                        key={dateStr}
                        className={`h-20 sm:h-24 rounded-2xl p-1.5 border-2 transition-all flex flex-col justify-between relative group shadow-sm ${
                          isBlocked
                            ? 'bg-slate-200 text-slate-600 border-slate-300 shadow-inner'
                            : isToday
                              ? 'bg-emerald-50/80 text-emerald-900 border-emerald-500 font-black'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-[#4221b6]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-black text-xs sm:text-sm px-1.5 py-0.5 rounded-lg bg-slate-100">{dayNum}</span>
                          <button
                            type="button"
                            title={isBlocked ? (lang === 'ar' ? 'فتح اليوم بالكامل' : 'Débloquer jour') : (lang === 'ar' ? 'قفل اليوم بالكامل' : 'Bloquer jour')}
                            onClick={() => handleToggleSingleDayLock(dateStr)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition ${
                              isBlocked ? 'bg-red-500 text-white' : 'bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">{isBlocked ? 'lock' : 'lock_open'}</span>
                          </button>
                        </div>

                        {/* Slot hours trigger */}
                        {!isBlocked && (
                          <button
                            type="button"
                            onClick={() => setSelectedDayForSlots(dateStr)}
                            className="w-full py-1 px-1.5 rounded-xl bg-[#4221b6]/10 hover:bg-[#4221b6] text-[#4221b6] hover:text-white font-extrabold text-[10px] sm:text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            <span>
                              {blockedSlotsForDay > 0
                                ? (lang === 'ar' ? `ساعات 🔒 (${blockedSlotsForDay})` : `Heures 🔒 (${blockedSlotsForDay})`)
                                : (lang === 'ar' ? 'تحديد الساعات' : 'Gérer heures')}
                            </span>
                          </button>
                        )}

                        {isBlocked && (
                          <span className="text-[10px] font-extrabold text-red-600 text-center block">
                            {lang === 'ar' ? 'يوم مقفول 🔒' : 'Jour bloqué 🔒'}
                          </span>
                        )}
                      </div>
                    );
                  }

                  return cells;
                })()}
              </div>

              {/* Status Legend & Info */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-emerald-100 border-2 border-emerald-400 inline-block"></span>
                    <span>{lang === 'ar' ? 'يوم مفتوح للحجز' : 'Jour disponible'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-slate-200 border-2 border-slate-300 inline-block"></span>
                    <span>{lang === 'ar' ? 'يوم مقفول (رمادي) 🔒' : 'Jour bloqué 🔒'}</span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400">
                  {lang === 'ar' ? 'يتم حفظ التغييرات تلقائياً وتطبيقها على تقويم الطالب فوراً.' : 'Changements enregistrés et appliqués en temps réel.'}
                </span>
              </div>
            </div>
          ) : activeTab === 'session' ? (
            /* Gestion de Session View */
            <div class="bg-surface-container-lowest rounded-2xl soft-card-shadow border border-surface-variant overflow-hidden">
              
              {/* Role Scope Banner */}
              <div className="p-4 bg-gradient-to-r from-[#eef2ff] via-white to-[#f0fdf4] border-b border-surface-variant flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#4221b6] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                    {isOnlyMaitresse ? '👩‍🏫' : '👑'}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#1c0576]">
                      {isOnlyMaitresse
                        ? (lang === 'ar'
                          ? `فضاء المعلمة: ${user?.parentName || user?.email} (عرض طلباتك فقط)`
                          : `Espace Enseignante : ${user?.parentName || user?.email} (Vos demandes uniquement)`)
                        : (lang === 'ar'
                          ? `لوحة الإدارة الشاملة (عرض جميع الحصص لجميع الأساتذة)`
                          : `Vue Administrateur : Toutes les demandes de cours (${filteredSessions.length})`)}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isOnlyMaitresse
                        ? (lang === 'ar' ? 'تظهر هنا فقط الحصص المحجوزة معك من طرف التلاميذ' : 'Seules les sessions réservées avec vous sont affichées ici.')
                        : (lang === 'ar' ? 'يمكنك مشاهدة وإدارة الحصص الخاصة بكل معلمة' : 'Gestion centralisée de toutes les réservations d\'élèves.')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => fetchSessions(false)}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-[#4221b6] flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>{lang === 'ar' ? 'تحديث' : 'Actualiser'}</span>
                </button>
              </div>

              {loadingSessions ? (
                <div className="p-4 md:p-6 space-y-6">
                  <AdminSessionPackSkeleton />
                  <AdminSessionPackSkeleton />
                </div>
              ) : displayedGroups.length > 0 ? (
                <div className="p-4 md:p-6 space-y-6">
                  {displayedGroups.map((group) => {
                    const isFourPack = group.sessions.length === 4;
                    const addedCount = group.sessions.filter(s => s.meetUrl || s.status === 'meet_added').length;
                    const totalCount = group.sessions.length;
                    const isAllMeetAdded = addedCount === totalCount;
                    const initial = (group.studentName[0] || 'E').toUpperCase();
                    const isHighlighted = highlightedGroupId === group.groupId || (
                      highlightedSessionId && group.sessions.some(s => String(s._id || s.id) === String(highlightedSessionId))
                    );

                    return (
                      <div
                        id={`session_group_${group.groupId}`}
                        key={group.groupId}
                        className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                          isHighlighted
                            ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                            : isFourPack
                              ? 'border-[#4221b6]/30 hover:border-[#4221b6] shadow-sm hover:shadow-xl'
                              : 'border-slate-200 hover:border-[#4221b6]/60 shadow-sm hover:shadow-xl'
                        }`}
                      >
                        {/* ── Frame Header: Student Info & Pack Meta ────────── */}
                        <div className={`p-4 sm:p-5 border-b-2 flex flex-wrap items-center justify-between gap-3.5 ${
                          isHighlighted
                            ? 'bg-gradient-to-r from-[#e0d7ff] via-[#f5f3ff] to-[#dcfce7] border-[#8c90f6]'
                            : 'bg-gradient-to-r from-[#f5f3ff] via-[#faf8ff] to-[#f0fdf4] border-[#e0d7ff]/80'
                        }`}>
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4221b6] via-[#5d35e0] to-[#8c90f6] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black text-base sm:text-lg text-[#1c0576] leading-tight truncate">
                                  {group.studentName}
                                </h3>
                                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#e0d7ff] text-[#4221b6] border border-[#8c90f6]/40 flex items-center gap-1 shadow-sm">
                                  <span>📦</span>
                                  <span>
                                    {isFourPack
                                      ? (lang === 'ar' ? 'باقة 4 حصص فرد طلب' : 'Pack 4 Séances')
                                      : `${group.sessions.length} ${lang === 'ar' ? 'حصص' : 'Séances'}`}
                                  </span>
                                </span>
                                {isHighlighted && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 animate-pulse">
                                    <span>🔔</span>
                                    <span>{lang === 'ar' ? 'طلب محدد من الإشعار' : 'Séance sélectionnée'}</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-semibold mt-1.5 flex items-center gap-2 flex-wrap">
                                {group.parentName && (
                                  <span className="bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
                                    {lang === 'ar' ? `الولي: ${group.parentName}` : `Parent : ${group.parentName}`}
                                  </span>
                                )}
                                {group.studentEmail && (
                                  <span className="text-slate-400 truncate text-[11px]">
                                    📧 {group.studentEmail}
                                  </span>
                                )}
                                {group.studentPhone ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs" dir="ltr">
                                      <span className="material-symbols-outlined text-xs text-emerald-600">phone_iphone</span>
                                      <span>{group.studentPhone}</span>
                                    </span>
                                    {/* Quick WhatsApp Action */}
                                    <a
                                      href={`https://wa.me/${group.studentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                        lang === 'ar'
                                          ? `مرحباً ${group.studentName}، بخصوص حجزك في منصة المفتاح للغات...`
                                          : `Bonjour ${group.studentName}, concernant votre réservation sur la plateforme...`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-xs transition hover:scale-105"
                                      title={lang === 'ar' ? 'مراسلة عبر الواتساب' : 'Contacter sur WhatsApp'}
                                    >
                                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.71 4.29 3.8 2.52 1.08 2.52.72 2.97.68.46-.05 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
                                      </svg>
                                      <span>WhatsApp</span>
                                    </a>
                                    {/* Quick Call Action */}
                                    <a
                                      href={`tel:${group.studentPhone}`}
                                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition hover:scale-105"
                                      title={lang === 'ar' ? 'اتصال هاتفي' : 'Appel direct'}
                                    >
                                      <span className="material-symbols-outlined text-[11px]">call</span>
                                      <span>{lang === 'ar' ? 'اتصال' : 'Appeler'}</span>
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">
                                    {lang === 'ar' ? '📱 لا يوجد رقم مسجل' : '📱 Aucun tél.'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Teacher Assigned & Meet Completion Counter */}
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm">
                              <span>👩‍🏫</span>
                              <span>{lang === 'ar' ? `المعلمة: ${group.teacherName}` : `Maîtresse : ${group.teacherName}`}</span>
                            </div>

                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm border ${
                                isAllMeetAdded
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : addedCount > 0
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isAllMeetAdded ? 'check_circle' : 'pending'}
                              </span>
                              <span>
                                {addedCount}/{totalCount} {lang === 'ar' ? 'روابط مضافة' : 'Liens Meet'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ── Frame Body: 4 Sessions Table ─────────────────── */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/90 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200/80">
                                <th className="p-3.5 pl-5">{lang === 'ar' ? 'الحصة' : 'Séance'}</th>
                                <th className="p-3.5">{lang === 'ar' ? 'اليوم والساعة' : 'Date & Heure'}</th>
                                <th className="p-3.5">{lang === 'ar' ? 'المادة' : 'Matière'}</th>
                                <th className="p-3.5">{lang === 'ar' ? 'حالة الرابط' : 'Statut'}</th>
                                <th className="p-3.5 pr-5 text-right">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {group.sessions.map((session, sIdx) => {
                                const sessionDateTime = session.datetime || (session.day ? `${session.day}, ${session.time}` : 'Date non spécifiée');
                                const hasMeet = Boolean(session.meetUrl);

                                return (
                                  <tr
                                    key={session._id || session.id || sIdx}
                                    className="hover:bg-[#faf9ff] transition-colors"
                                  >
                                    {/* Session Index Chip */}
                                    <td className="p-3.5 pl-5 font-extrabold text-xs text-on-surface">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-[#e0d7ff]/70 text-[#4221b6] border border-[#8c90f6]/30">
                                        <span className="material-symbols-outlined text-sm">school</span>
                                        <span>
                                          {lang === 'ar'
                                            ? `الحصة ${sIdx + 1} من ${group.sessions.length}`
                                            : `Séance ${sIdx + 1}/${group.sessions.length}`}
                                        </span>
                                      </span>
                                    </td>

                                    {/* Date & Time */}
                                    <td className="p-3.5 text-xs text-slate-800 font-bold">
                                      <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-[#4221b6]">calendar_today</span>
                                        <span>{sessionDateTime}</span>
                                      </div>
                                    </td>

                                    {/* Subject */}
                                    <td className="p-3.5 text-xs text-slate-800 font-bold">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                                        <span className="material-symbols-outlined text-sm text-emerald-700">menu_book</span>
                                        <span>{getTeacherSubjectForSession(session)}</span>
                                      </span>
                                    </td>

                                    {/* Meet Status & Interactive Nature Selector */}
                                    <td className="p-3.5">
                                      <div className="relative inline-block">
                                        <select
                                          value={session.status || (hasMeet ? 'meet_added' : 'pending')}
                                          onChange={(e) => handleUpdateSessionStatus(session._id || session.id, e.target.value)}
                                          title={lang === 'ar' ? 'تغيير حالة وطبيعة الحصة (Complété / Meet Added / Pending)' : 'Changer le statut de la séance'}
                                          className={`text-xs font-black py-1.5 px-3 rounded-full border shadow-sm cursor-pointer outline-none transition-all appearance-none pr-7 pl-3 ${
                                            session.status === 'completed' || session.status === 'done'
                                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                              : session.status === 'meet_added' || hasMeet
                                              ? 'bg-[#E1F5FE] text-[#0277BD] border-[#0277BD]/30 hover:bg-[#b3e5fc]'
                                              : 'bg-[#FFF3E0] text-[#E65100] border-[#E65100]/30 hover:bg-[#ffe0b2]'
                                          }`}
                                        >
                                          <option value="pending" className="bg-white text-slate-800 font-bold">
                                            ⏳ {lang === 'ar' ? 'في الانتظار (Pending)' : 'En attente (Pending)'}
                                          </option>
                                          <option value="meet_added" className="bg-white text-slate-800 font-bold">
                                            📹 {lang === 'ar' ? 'تمت إضافة الرابط (Meet)' : 'Lien Ajouté (Meet)'}
                                          </option>
                                          <option value="completed" className="bg-white text-emerald-800 font-black">
                                            ✅ {lang === 'ar' ? 'مكتملة (Complété)' : 'Complété (Terminé)'}
                                          </option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none opacity-60">
                                          expand_more
                                        </span>
                                      </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-3.5 pr-5 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => setEditingSession(session)}
                                          className="px-3.5 py-1.5 rounded-full bg-[#4221b6] hover:bg-[#341a99] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm hover:scale-105"
                                        >
                                          <span className="material-symbols-outlined text-sm">videocam</span>
                                          <span>
                                            {hasMeet
                                              ? (lang === 'ar' ? 'تعديل الرابط' : 'Modifier Meet')
                                              : (lang === 'ar' ? 'إضافة رابط Meet' : 'Ajouter lien Meet')}
                                          </span>
                                        </button>

                                        {hasMeet && (
                                          <a
                                            href={session.meetUrl.startsWith('http') ? session.meetUrl : `https://${session.meetUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={lang === 'ar' ? 'فتح رابط Google Meet' : 'Rejoindre la réunion'}
                                            className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                                          >
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                          </a>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => setSessionToDelete(session)}
                                          title={lang === 'ar' ? 'حذف هذه الحصة' : 'Supprimer cette séance'}
                                          className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 transition-all flex items-center justify-center cursor-pointer shadow-sm shrink-0 hover:scale-105"
                                        >
                                          <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 font-medium">
                  <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">event_busy</span>
                  {isOnlyMaitresse
                    ? (lang === 'ar' ? 'لا توجد طلبات حصص خاصة بك حتى الآن.' : 'Aucune demande de réservation pour vous pour le moment.')
                    : (lang === 'ar' ? 'لا توجد جلسات مسجلة حتى الآن.' : 'Aucune session enregistrée pour le moment.')}
                </div>
              )}

              {/* Real Dynamic Table Footer Pagination */}
              <div className="p-4 border-t border-surface-variant bg-surface-container-lowest flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-on-surface-variant">
                <span className="font-semibold text-xs sm:text-sm text-slate-600">
                  {lang === 'ar'
                    ? `عرض ${sessionStartIndex} إلى ${sessionEndIndex} من أصل ${totalGroups} طلب حجز (${filteredSessions.length} حصة)`
                    : lang === 'en'
                    ? `Showing ${sessionStartIndex} to ${sessionEndIndex} of ${totalGroups} booking packs (${filteredSessions.length} sessions)`
                    : `Affichage de ${sessionStartIndex} à ${sessionEndIndex} sur ${totalGroups} packs (${filteredSessions.length} séances)`}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSessionPage(prev => Math.max(1, prev - 1))}
                    disabled={sessionPage === 1}
                    className="w-8 h-8 rounded-lg border border-surface-variant flex items-center justify-center hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">{isRtl ? 'chevron_right' : 'chevron_left'}</span>
                  </button>

                  {Array.from({ length: totalGroupPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setSessionPage(pageNum)}
                      className={`w-8 h-8 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                        sessionPage === pageNum
                          ? 'bg-[#4221b6] text-white border-[#4221b6] shadow-sm scale-105'
                          : 'border-surface-variant hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setSessionPage(prev => Math.min(totalGroupPages, prev + 1))}
                    disabled={sessionPage === totalGroupPages || totalGroupPages === 0}
                    className="w-8 h-8 rounded-lg border border-surface-variant flex items-center justify-center hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">{isRtl ? 'chevron_left' : 'chevron_right'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Gestion de Client View */
            <div class="bg-surface-container-lowest rounded-2xl soft-card-shadow border border-surface-variant overflow-hidden">
              <div class="p-4 bg-surface-container-low border-b border-surface-variant flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-xl text-[#4221b6]">group</span>
                  <h3 class="font-bold text-on-surface text-base">
                    {lang === 'ar' ? 'قائمة الحرفاء المسجلين (MongoDB)' : 'Liste des clients inscrits'}
                  </h3>
                </div>
                <button
                  onClick={fetchClients}
                  class="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-variant text-xs font-bold text-on-surface flex items-center gap-1 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-sm">refresh</span>
                  <span>{lang === 'ar' ? 'تحديث' : 'Actualiser'}</span>
                </button>
              </div>

              {loadingClients ? (
                <div className="p-4 bg-white">
                  <TableRowsSkeleton rows={5} cols={5} />
                </div>
              ) : (
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-surface-container-low text-on-surface-variant text-label-bold uppercase tracking-wider text-xs">
                        <th class="p-4 border-b border-surface-variant">Parent</th>
                        <th class="p-4 border-b border-surface-variant">Enfant</th>
                        <th class="p-4 border-b border-surface-variant">E-mail</th>
                        <th class="p-4 border-b border-surface-variant">{lang === 'ar' ? 'الهاتف' : 'Téléphone'}</th>
                        <th class="p-4 border-b border-surface-variant">Rôle</th>
                        <th class="p-4 border-b border-surface-variant text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-surface-variant">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client, idx) => (
                          <tr key={client._id || idx} class="hover:bg-surface-container-low transition-colors">
                            <td class="p-4 font-bold text-on-surface flex items-center gap-3">
                              <div
                                onClick={() => setSelectedStudentForAvatar(client)}
                                title={lang === 'ar' ? 'تغيير صورة هذا التلميذ فقط' : 'Changer la photo de cet élève uniquement'}
                                className="w-10 h-10 rounded-2xl overflow-hidden bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center font-black text-sm relative group cursor-pointer border border-[#8c90f6]/30 shadow-sm shrink-0 hover:scale-105 transition-transform"
                              >
                                {client.picture ? (
                                  <img src={client.picture} alt={client.childName || 'Avatar'} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{(client.parentName || client.email || 'P')[0].toUpperCase()}</span>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                                </div>
                              </div>
                              <div>
                                <span class="block">{client.parentName || 'Parent'}</span>
                                <span class="text-[10px] text-on-surface-variant block">ID: {client._id ? client._id.slice(-6) : idx + 1}</span>
                              </div>
                            </td>
                            <td class="p-4 text-on-surface text-sm font-semibold">{client.childName || 'Non spécifié'}</td>
                            <td class="p-4 text-on-surface-variant text-sm font-medium">{client.email}</td>
                            <td class="p-4 text-sm font-semibold">
                              {client.phone ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200" dir="ltr">
                                    {client.phone}
                                  </span>
                                  <a
                                    href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-6 h-6 rounded-md bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center shadow-xs transition hover:scale-105"
                                    title="WhatsApp"
                                  >
                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.71 4.29 3.8 2.52 1.08 2.52.72 2.97.68.46-.05 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
                                    </svg>
                                  </a>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">{lang === 'ar' ? 'غير مسجل' : 'Non renseigné'}</span>
                              )}
                            </td>
                            <td className="p-4">
                              {/* Clickable Multi-Role Badges Container */}
                              <div
                                onClick={() => openEditAccountModal(client)}
                                title={lang === 'ar' ? 'انقر لتغيير الرتب والحالة' : 'Cliquer pour modifier les rôles'}
                                className="flex flex-wrap items-center gap-1.5 cursor-pointer group"
                              >
                                {parseRoles(client.role).map((r, rIdx) => {
                                  if (r === 'admin') {
                                    return (
                                      <span key={rIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#e0d7ff] text-[#4221b6] border border-[#8c90f6] shadow-sm">
                                        <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                                        <span>{lang === 'ar' ? 'أدمن' : 'Admin'}</span>
                                      </span>
                                    );
                                  }
                                  if (r === 'maitresse' || r === 'maître' || r === 'teacher') {
                                    return (
                                      <div key={rIdx} className="flex flex-col gap-1 items-start">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                                          <span className="material-symbols-outlined text-sm">school</span>
                                          <span>{lang === 'ar' ? 'معلمة' : 'Maîtresse'}</span>
                                        </span>
                                        {client.subject && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-200">
                                            <span>📚</span>
                                            <span>{client.subject}</span>
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }
                                  return (
                                    <span key={rIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4F1EA] text-[#5A6E5E] border border-surface-variant/80 shadow-sm">
                                      <span className="material-symbols-outlined text-sm">person</span>
                                      <span>{lang === 'ar' ? 'ولي أمر' : 'Parent'}</span>
                                    </span>
                                  );
                                })}
                                <span className="material-symbols-outlined text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Clickable Status Pill */}
                                <button
                                  onClick={() => openEditAccountModal(client)}
                                  title={lang === 'ar' ? 'تغيير حالة الحساب' : 'Changer le statut'}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer hover:scale-105 ${
                                    client.status === 'Suspendu'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : client.status === 'Inactif'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-[#E8F5E9] text-[#2E7D32] border-emerald-300'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${
                                    client.status === 'Suspendu' ? 'bg-red-600' : client.status === 'Inactif' ? 'bg-amber-600' : 'bg-[#2E7D32]'
                                  }`}></span>
                                  <span>{client.status || 'Actif'}</span>
                                </button>

                                {/* Edit Account Button */}
                                <button
                                  onClick={() => openEditAccountModal(client)}
                                  title={lang === 'ar' ? 'تعديل الحساب' : 'Modifier le compte'}
                                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors flex items-center justify-center cursor-pointer font-bold shadow-sm hover:scale-105"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>

                                {/* Delete User Button */}
                                <button
                                  onClick={() => requestDeleteClient(client)}
                                  title={lang === 'ar' ? 'حذف الحساب' : 'Supprimer le compte'}
                                  className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors flex items-center justify-center cursor-pointer font-bold shadow-sm hover:scale-105"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-on-surface-variant font-medium">
                            {lang === 'ar' ? 'لا يوجد حرفاء مسجلين حتى الآن' : 'Aucun client enregistré pour le moment.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meet Modal */}
      {editingSession && (
        <MeetModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSave={handleSaveMeetLink}
        />
      )}

      {/* Edit Account Role & Status Modal */}
      {editAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full relative soft-card-shadow flex flex-col gap-5 border-2 border-[#8c90f6] animate-in fade-in zoom-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                  <span className="material-symbols-outlined text-2xl">manage_accounts</span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1c0576] leading-tight">
                    {lang === 'ar' ? 'تعديل حساب المستخدم' : 'Modifier le compte client'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editAccountModal.client.parentName || editAccountModal.client.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditAccountModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Select Role - Multi-Select Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#4221b6]">badge</span>
                <span>{lang === 'ar' ? 'رتبة / دور الحساب (يمكن اختيار أكثر من رتبة):' : 'Rôle(s) du compte (multi-sélection possible) :'}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Option 1: Parent / User */}
                <button
                  type="button"
                  onClick={() => toggleRoleInModal('user')}
                  className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer relative ${
                    (editAccountModal.roles || []).includes('user')
                      ? 'border-[#4221b6] bg-[#e0d7ff]/40 text-[#4221b6] shadow-sm scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {(editAccountModal.roles || []).includes('user') && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#4221b6] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[10px]">check</span>
                    </span>
                  )}
                  <span className="material-symbols-outlined text-2xl">person</span>
                  <span>{lang === 'ar' ? 'ولي أمر' : 'Parent'}</span>
                </button>

                {/* Option 2: Maîtresse */}
                <button
                  type="button"
                  onClick={() => toggleRoleInModal('maitresse')}
                  className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer relative ${
                    (editAccountModal.roles || []).includes('maitresse')
                      ? 'border-emerald-500 bg-emerald-100/50 text-emerald-800 shadow-sm scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {(editAccountModal.roles || []).includes('maitresse') && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[10px]">check</span>
                    </span>
                  )}
                  <span className="material-symbols-outlined text-2xl">school</span>
                  <span>{lang === 'ar' ? 'معلمة' : 'Maîtresse'}</span>
                </button>

                {/* Option 3: Admin */}
                <button
                  type="button"
                  onClick={() => toggleRoleInModal('admin')}
                  className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer relative ${
                    (editAccountModal.roles || []).includes('admin')
                      ? 'border-purple-600 bg-purple-100/60 text-purple-900 shadow-sm scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {(editAccountModal.roles || []).includes('admin') && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[10px]">check</span>
                    </span>
                  )}
                  <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                  <span>{lang === 'ar' ? 'أدمن' : 'Admin'}</span>
                </button>
              </div>

              {/* Current Selection Preview */}
              <div className="flex flex-wrap gap-1.5 pt-1 min-h-[28px]">
                {(editAccountModal.roles || []).map((r, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    r === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                    r === 'maitresse' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    'bg-[#e0d7ff] text-[#4221b6] border-[#8c90f6]'
                  }`}>
                    <span className="material-symbols-outlined text-[11px]">
                      {r === 'admin' ? 'admin_panel_settings' : r === 'maitresse' ? 'school' : 'person'}
                    </span>
                    <span>{r === 'admin' ? 'Admin' : r === 'maitresse' ? 'Maîtresse' : 'Parent'}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* If Maîtresse role is selected: Specify Subject Section */}
            {(editAccountModal.roles || []).includes('maitresse') && (
              <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-emerald-700">menu_book</span>
                    <span>{lang === 'ar' ? 'المادة التي تدرسها المعلمة :' : 'Matière enseignée par la maîtresse :'}</span>
                  </label>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                    {lang === 'ar' ? 'تخصيص' : 'Matière'}
                  </span>
                </div>

                {/* Quick Selection Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Français & Arabe',
                    'Français',
                    'Arabe',
                    'Mathématiques',
                    'Anglais',
                  ].map((sub) => {
                    const isSubSelected = editAccountModal.subject === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setEditAccountModal(prev => ({ ...prev, subject: sub }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSubSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm scale-105'
                            : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/50'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>

                {/* Custom input for custom subject */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 text-base">edit_note</span>
                  <input
                    type="text"
                    value={editAccountModal.subject || ''}
                    onChange={(e) => setEditAccountModal(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={lang === 'ar' ? 'أو اكتب اسم المادة يدوياً...' : 'Ou saisir une matière personnalisée...'}
                    className="w-full h-10 pl-9 pr-3 text-xs font-bold rounded-xl border border-emerald-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Client Phone Number Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-emerald-600">phone_iphone</span>
                <span>{lang === 'ar' ? 'رقم الهاتف للتواصل وتأكيد الحصص :' : 'Numéro de téléphone / WhatsApp :'}</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">call</span>
                <input
                  type="tel"
                  value={editAccountModal.phone || ''}
                  onChange={(e) => setEditAccountModal(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={lang === 'ar' ? 'مثال: 33069770 أو +974...' : 'Ex: +974... ou 06...'}
                  className="w-full h-11 pl-9 pr-3 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-[#4221b6] focus:outline-none focus:ring-2 focus:ring-[#8c90f6]/30"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Select Status */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#4221b6]">toggle_on</span>
                <span>{lang === 'ar' ? 'حالة الحساب (Status):' : 'Statut du compte :'}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Option 1: Actif */}
                <button
                  type="button"
                  onClick={() => setEditAccountModal(prev => ({ ...prev, status: 'Actif' }))}
                  className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    editAccountModal.status === 'Actif' || !editAccountModal.status
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-800 shadow-sm scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>{lang === 'ar' ? 'مفعل' : 'Actif'}</span>
                </button>

                {/* Option 2: Inactif */}
                <button
                  type="button"
                  onClick={() => setEditAccountModal(prev => ({ ...prev, status: 'Inactif' }))}
                  className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    editAccountModal.status === 'Inactif'
                      ? 'border-amber-500 bg-amber-100 text-amber-900 shadow-sm scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  <span>{lang === 'ar' ? 'غير مفعل' : 'Inactif'}</span>
                </button>

                {/* Option 3: Suspendu */}
                <button
                  type="button"
                  onClick={() => setEditAccountModal(prev => ({ ...prev, status: 'Suspendu' }))}
                  className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    editAccountModal.status === 'Suspendu'
                      ? 'border-red-500 bg-red-100 text-red-900 shadow-sm scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  <span>{lang === 'ar' ? 'معلق' : 'Suspendu'}</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditAccountModal(null)}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-full border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmAccountUpdate}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-full bg-[#4221b6] hover:bg-[#341a99] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{actionLoading ? 'Sauvegarde...' : (lang === 'ar' ? 'حفظ التغييرات' : 'Enregistrer')}</span>
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {deleteModalData && (
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 max-w-md w-full relative soft-card-shadow flex flex-col items-center text-center gap-4 border-2 border-red-300 animate-in fade-in zoom-in duration-200">
            <div class="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
              <span class="material-symbols-outlined text-3xl">warning</span>
            </div>

            <h3 class="text-xl font-extrabold text-red-700">
              {lang === 'ar' ? 'تأكيد حذف الحساب' : 'Supprimer le compte client'}
            </h3>

            <p class="text-xs text-[#5A6E5E] leading-relaxed font-medium">
              {lang === 'ar' ? (
                <>
                  هل أنت تأكد من حذف حساب الحريف <strong class="text-black">{deleteModalData.parentName || deleteModalData.email}</strong> نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer définitivement le compte de <strong class="text-black">{deleteModalData.parentName || deleteModalData.email}</strong> de la base de données ?
                </>
              )}
            </p>

            <div class="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalData(null)}
                disabled={actionLoading}
                class="flex-1 py-3 rounded-full border border-surface-variant bg-surface-container-low text-on-surface font-bold text-xs hover:bg-surface-container transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteClient}
                disabled={actionLoading}
                class="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{actionLoading ? 'Suppression...' : (lang === 'ar' ? 'حذف نهائياً' : 'Supprimer')}</span>
                <span class="material-symbols-outlined text-sm">delete_forever</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Session Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full relative soft-card-shadow flex flex-col items-center text-center gap-4 border-2 border-red-300 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>

            <h3 className="text-xl font-extrabold text-red-700">
              {lang === 'ar' ? 'تأكيد حذف الحصة' : 'Supprimer la séance'}
            </h3>

            <div className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200 w-full text-left rtl:text-right space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#4221b6]">person</span>
                <span><strong>{lang === 'ar' ? 'التلميذ:' : 'Élève :'}</strong> {sessionToDelete.studentName || sessionToDelete.name || sessionToDelete.childName || 'Élève'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-600">school</span>
                <span><strong>{lang === 'ar' ? 'المعلمة:' : 'Maîtresse :'}</strong> {sessionToDelete.teacherName || 'Enseignante'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-purple-600">calendar_today</span>
                <span><strong>{lang === 'ar' ? 'الموعد:' : 'Date & Heure :'}</strong> {sessionToDelete.datetime || `${sessionToDelete.day}, ${sessionToDelete.time}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-slate-500">book</span>
                <span><strong>{lang === 'ar' ? 'المادة:' : 'Matière :'}</strong> {sessionToDelete.subject || 'Français & Arabe'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {lang === 'ar'
                ? 'هل أنت متأكد من حذف هذه الحصة نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Êtes-vous sûr de vouloir supprimer définitivement cette réservation ? Cette action est irréversible.'}
            </p>

            <div className="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-full border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteSession}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{actionLoading ? (lang === 'ar' ? 'جاري الحذف...' : 'Suppression...') : (lang === 'ar' ? 'حذف نهائياً' : 'Supprimer')}</span>
                <span className="material-symbols-outlined text-sm">delete_forever</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Lock Entire Month Confirmation Modal */}
      {confirmLockMonthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full relative soft-card-shadow flex flex-col items-center text-center gap-5 border-2 border-red-400 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">lock_clock</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">
                {lang === 'ar' ? 'تأكيد قفل كامل الشهر' : 'Confirmer le blocage du mois'}
              </h3>
              <p className="text-sm font-bold text-red-600">
                {confirmLockMonthModal.monthName}
              </p>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {lang === 'ar'
                ? `هل أنت متأكد من قفل جميع أيام شهر (${confirmLockMonthModal.monthName})؟ ستظهر جميع أيام الشهر باللون الرمادي ومقفولة كلياً للتلاميذ.`
                : `Êtes-vous sûr de vouloir bloquer tous les jours du mois de (${confirmLockMonthModal.monthName}) ? Tous les jours apparaîtront en gris et seront verrouillés pour les élèves.`}
            </p>

            <div className="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => setConfirmLockMonthModal(null)}
                disabled={lockSaving}
                className="flex-1 py-3 rounded-full border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmLockEntireMonth}
                disabled={lockSaving}
                className="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {lockSaving ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">lock</span>
                )}
                <span>{lang === 'ar' ? 'نعم، اقفل الشهر' : 'Oui, bloquer le mois'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Lock Specific Hours / Slots Modal for Selected Day */}
      {selectedDayForSlots && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full relative soft-card-shadow flex flex-col gap-6 border-2 border-[#8c90f6]/50 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#4221b6] text-white flex items-center justify-center font-black text-lg shadow-md">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1c0576]">
                    {lang === 'ar' ? 'تحديد الساعات المتاحة والمقفولة' : 'Gérer les créneaux horaires'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === 'ar' ? `ليوم : ${selectedDayForSlots}` : `Pour le : ${selectedDayForSlots}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayForSlots(null)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100 text-slate-600 hover:text-red-600 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {lang === 'ar'
                ? 'انقر على أية ساعة لقفلها (ستظهر باللون الرمادي والرمز 🔒 للتلاميذ) أو إعادة فتحها (الأخضر ✓):'
                : 'Cliquez sur un créneau pour le bloquer (gris 🔒) ou le rendre disponible (vert ✓) :'}
            </p>

            {/* Slots List for THIS selected day (Combines Global TimeSlots + Day-Specific Slots) */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {(() => {
                const globalSlots = user?.timeSlots || ['10:00', '14:00', '16:30'];
                const daySpecificSlots = customDaySlots[selectedDayForSlots] || [];
                // Combine and deduplicate
                const allSlotsForDay = Array.from(new Set([...globalSlots, ...daySpecificSlots]));

                if (allSlotsForDay.length === 0) {
                  return (
                    <div className="text-center py-4 text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                      {lang === 'ar' ? 'لا يوجد تواقيت حالية لهذا اليوم. أضف توقيتاً جديداً أدناه 👇' : 'Aucun horaire enregistrée.'}
                    </div>
                  );
                }

                return allSlotsForDay.map((slotObj, idx) => {
                  const slotTime = typeof slotObj === 'object' ? (slotObj[lang] || slotObj.fr || slotObj.ar || '') : slotObj;
                  const slotKey = `${selectedDayForSlots}_${slotTime}`;
                  const isSlotBlocked = blockedSlots.includes(slotKey);
                  const isDaySpecific = daySpecificSlots.includes(slotTime);

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all shadow-sm ${
                        isSlotBlocked
                          ? 'bg-slate-100 text-slate-500 border-slate-300'
                          : isDaySpecific
                            ? 'bg-purple-50 text-purple-950 border-purple-300'
                            : 'bg-emerald-50 text-emerald-950 border-emerald-300'
                      }`}
                    >
                      {/* Time Clickable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleSingleSlotLock(selectedDayForSlots, slotTime)}
                        className="flex items-center gap-2 font-black text-sm cursor-pointer hover:opacity-80 flex-1 text-left rtl:text-right"
                      >
                        <span className="material-symbols-outlined text-base">{isSlotBlocked ? 'lock' : 'schedule'}</span>
                        <span>{slotTime}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-current">
                          {isSlotBlocked
                            ? (lang === 'ar' ? 'مقفول 🔒' : 'Bloqué 🔒')
                            : isDaySpecific
                              ? (lang === 'ar' ? 'خاص باليوم ⭐' : 'Spécifique ⭐')
                              : (lang === 'ar' ? 'مشترك ✓' : 'Partagé ✓')}
                        </span>
                      </button>

                      {/* Actions: Delete time slot */}
                      <div className="flex items-center gap-1">
                        {isDaySpecific ? (
                          <button
                            type="button"
                            title={lang === 'ar' ? 'حذف هذا التوقيت الخاص بهذا اليوم' : 'Supprimer cet horaire du jour'}
                            onClick={() => handleDeleteDaySpecificTimeSlot(selectedDayForSlots, slotTime)}
                            className="w-8 h-8 rounded-xl bg-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            title={lang === 'ar' ? 'حذف من جميع الأيام' : 'Supprimer de tous les jours'}
                            onClick={() => handleDeleteGlobalTimeSlot(slotTime)}
                            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Form: Add New Time Slot Specifically for THIS Day */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const inputEl = e.target.elements.newDaySlotInput;
                if (inputEl && inputEl.value) {
                  handleAddDaySpecificTimeSlot(selectedDayForSlots, inputEl.value);
                  inputEl.value = '';
                }
              }}
              className="flex items-center gap-2 pt-2 border-t border-slate-100"
            >
              <input
                name="newDaySlotInput"
                type="time"
                required
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-800 outline-none focus:border-[#4221b6] transition"
              />
              <button
                type="submit"
                disabled={lockSaving}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-sm">add_alarm</span>
                <span>{lang === 'ar' ? 'إضافة لهذا اليوم فقط' : 'Ajouter ce jour'}</span>
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] font-bold pt-1 text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-purple-100 border border-purple-400 inline-block"></span>
                <span>{lang === 'ar' ? 'توقيت خاص باليوم' : 'Spécifique'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-400 inline-block"></span>
                <span>{lang === 'ar' ? 'توقيت مشترك' : 'Partagé'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-200 border border-slate-300 inline-block"></span>
                <span>{lang === 'ar' ? 'مقفول 🔒' : 'Bloqué 🔒'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayForSlots(null)}
              className="w-full py-3.5 rounded-2xl bg-[#4221b6] text-white font-black text-xs sm:text-sm shadow-md hover:scale-[1.02] transition cursor-pointer"
            >
              {lang === 'ar' ? 'إنهاء وحفظ المواعيد' : 'Terminer'}
            </button>
          </div>
        </div>
      )}

      {/* Global / Shared Time Slots Modal for ALL Days */}
      {showGlobalTimeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full relative soft-card-shadow flex flex-col gap-6 border-2 border-[#4221b6]/50 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#4221b6] text-white flex items-center justify-center font-black text-lg shadow-md">
                  <span className="material-symbols-outlined text-xl">more_time</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1c0576]">
                    {lang === 'ar' ? 'التواقيت المشتركة لجميع الأيام 🌐' : 'Horaires communs pour tous les jours 🌐'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === 'ar' ? 'التواقيت المضافة هنا تظهر تلقائياً في كافة أيام التقويم' : 'Ces créneaux apparaissent sur tous les jours.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGlobalTimeModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100 text-slate-600 hover:text-red-600 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Global Slots List */}
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {(user?.timeSlots || ['10:00', '14:00', '16:30']).map((slotObj, idx) => {
                const slotTime = typeof slotObj === 'object' ? (slotObj[lang] || slotObj.fr || slotObj.ar || '') : slotObj;
                return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between font-extrabold text-sm text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#4221b6]">schedule</span>
                      <span>{slotTime}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGlobalTimeSlot(slotTime)}
                      className="w-8 h-8 rounded-xl bg-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add New Global Time Slot */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const inputEl = e.target.elements.newGlobalSlotInput;
                if (inputEl && inputEl.value) {
                  handleAddGlobalTimeSlot(inputEl.value);
                  inputEl.value = '';
                }
              }}
              className="flex items-center gap-2 pt-2 border-t border-slate-100"
            >
              <input
                name="newGlobalSlotInput"
                type="time"
                required
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-800 outline-none focus:border-[#4221b6] transition"
              />
              <button
                type="submit"
                disabled={lockSaving}
                className="px-5 py-2.5 rounded-xl bg-[#4221b6] hover:bg-[#351996] text-white font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>{lang === 'ar' ? 'إضافة توقيت مشترك' : 'Ajouter'}</span>
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowGlobalTimeModal(false)}
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm transition cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        </div>
      )}

      {/* Change Student Avatar Modal in Admin View */}
      {selectedStudentForAvatar && (
        <ChangeStudentAvatarModal
          isOpen={!!selectedStudentForAvatar}
          onClose={() => setSelectedStudentForAvatar(null)}
          student={selectedStudentForAvatar}
          onSuccess={(newPic) => {
            fetchClients(true);
          }}
        />
      )}
    </div>
  );
}
