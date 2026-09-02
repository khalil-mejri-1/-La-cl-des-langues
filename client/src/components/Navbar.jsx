import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import EditNavModal from './EditNavModal';
import { API_BASE_URL } from '../config';
import { filterNotificationsForUser, syncSessionsToNotifications, playNotificationSound } from '../utils/notifications';

export default function Navbar() {
  const { lang, setLang, t, isRtl } = useLanguage();
  const { user, isLoggedIn, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditNavOpen, setIsEditNavOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifContainerRef = useRef(null);
  const popoverRef = useRef(null);
  const userMenuRef = useRef(null);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_read_ids') || '[]'); } catch { return []; }
  });
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAdmin = (() => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const r = user.role || user.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('admin');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('admin'));
    return false;
  })();

  const isMaitresse = (() => {
    if (!user) return false;
    const r = user.role || user.roles;
    if (!r) return false;
    const roleStr = Array.isArray(r) ? r.join(' ').toLowerCase() : String(r).toLowerCase();
    return roleStr.includes('maitresse') || roleStr.includes('teacher') || roleStr.includes('maître');
  })();

  const showAdmin = isAdmin || isMaitresse;
  const showCalendar = isMaitresse || isAdmin;

  const formatRoleLabel = (roleVal) => {
    if (!roleVal) return [{ label: lang === 'ar' ? '👨‍👩‍👧 ولي أمر' : '👨‍👩‍👧 Parent', color: 'bg-slate-100 text-slate-700 border border-slate-200' }];
    const roleStr = Array.isArray(roleVal) ? roleVal.join(', ').toLowerCase() : String(roleVal).toLowerCase();
    
    const badges = [];
    if (roleStr.includes('admin')) {
      badges.push({
        label: lang === 'ar' ? '👑 مشرف (Admin)' : '👑 Admin',
        color: 'bg-[#e0d7ff] text-[#4221b6] border border-[#8c90f6]/50',
      });
    }
    if (roleStr.includes('maitresse') || roleStr.includes('teacher') || roleStr.includes('maître')) {
      badges.push({
        label: lang === 'ar' ? '👩‍🏫 معلمة' : '👩‍🏫 Maîtresse',
        color: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      });
    }
    if (badges.length === 0) {
      badges.push({
        label: lang === 'ar' ? '👨‍👩‍👧 ولي أمر' : '👨‍👩‍👧 Parent',
        color: 'bg-slate-100 text-slate-700 border border-slate-200',
      });
    }
    return badges;
  };

  // ── Derived values from notifications ─────────────────────────────────────
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  // One-time total wipe of legacy notifications for all accounts
  useEffect(() => {
    try {
      const isWiped = localStorage.getItem('notif_all_accounts_cleared_v2');
      if (!isWiped) {
        const now = Date.now();
        localStorage.setItem('notif_cleared_timestamp', String(now));
        localStorage.setItem('app_unified_notifications', '[]');
        localStorage.setItem('student_notifications', '[]');
        localStorage.setItem('notif_read_ids', '[]');
        localStorage.setItem('notif_deleted_ids', '[]');
        localStorage.setItem('notif_all_accounts_cleared_v2', 'true');
        setNotifications([]);
        setReadIds([]);
      }
    } catch {}
  }, []);

  // Load notifications from localStorage + DB + listen for new ones in real time
  const loadNotifications = useCallback(async (shouldPlaySound = false) => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const clearedTimestamp = parseInt(localStorage.getItem('notif_cleared_timestamp') || '0', 10);
      const deletedIds = JSON.parse(localStorage.getItem('notif_deleted_ids') || '[]');

      const unified = JSON.parse(localStorage.getItem('app_unified_notifications') || '[]');
      const studentOld = JSON.parse(localStorage.getItem('student_notifications') || '[]');
      const sessionsCache = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');

      // 1. Initial fast local pass
      let allSessions = Array.isArray(sessionsCache) ? [...sessionsCache] : [];

      // 2. Fetch fresh sessions from database API
      try {
        const res = await fetch(`${API_BASE_URL}/api/sessions`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.sessions)) {
            allSessions = data.sessions;
            try {
              localStorage.setItem('admin_sessions_cache', JSON.stringify(data.sessions));
            } catch {}
          }
        }
      } catch (fetchErr) {
        // Silent fallback
      }

      // 3. Convert all database sessions to live notifications for this user
      const dbNotifs = syncSessionsToNotifications(allSessions, user);

      // 4. Combine with stored broadcast notifications
      const combined = [...unified];

      // Add student old format if not present
      studentOld.forEach(so => {
        const matchingId = String(so.id || so.sessionId);
        if (!combined.some(n => n.id === matchingId || (n.meta?.sessionId && n.meta.sessionId === so.sessionId))) {
          combined.push({
            id: matchingId,
            type: 'MEET_LINK_ADDED',
            targetStudentId: so.studentId,
            targetStudentEmail: so.studentEmail,
            targetTeacherName: so.teacherName,
            title: {
              fr: `🔗 Lien Google Meet ajouté !`,
              ar: `🔗 تمت إضافة رابط Google Meet !`,
              en: `🔗 Google Meet link ready!`,
            },
            desc: {
              fr: `${so.teacherName || 'La maîtresse'} a ajouté un lien Google Meet pour votre séance du ${so.day || ''} à ${so.time || ''}.`,
              ar: `أضافت المعلمة ${so.teacherName || 'المعلمة'} رابط حصتك ليوم ${so.day || ''} الساعة ${so.time || ''}.`,
              en: `${so.teacherName || 'Tutor'} added a Google Meet link for your session on ${so.day || ''} at ${so.time || ''}.`,
            },
            icon: 'videocam',
            iconBg: 'bg-emerald-100 text-emerald-700',
            link: '/dashboard',
            timestamp: so.timestamp || new Date().toISOString(),
          });
        }
      });

      // Merge DB synthesized notifications
      dbNotifs.forEach(dn => {
        const exists = combined.some(cn => 
          cn.id === dn.id || 
          (cn.meta?.sessionId && dn.meta?.sessionId && String(cn.meta.sessionId) === String(dn.meta.sessionId))
        );
        if (!exists) {
          combined.push(dn);
        }
      });

      // Filter and sort for the logged in user, excluding deleted/cleared notifications
      const userNotifs = filterNotificationsForUser(combined, user)
        .filter(n => {
          if (deletedIds.includes(n.id)) return false;
          if (clearedTimestamp > 0) {
            const notifTime = new Date(n.timestamp || 0).getTime();
            if (notifTime > 0 && notifTime <= clearedTimestamp) return false;
          }
          return true;
        })
        .sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA;
        });

      setNotifications(userNotifs);

      if (shouldPlaySound) {
        playNotificationSound();
      }
    } catch (e) {
      console.error('Erreur chargement notifications:', e);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications(false);

    // BroadcastChannel listener (real-time cross-tab)
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('app_sessions_channel');
        bc.onmessage = (e) => {
          if (e.data?.type === 'ALL_NOTIFICATIONS_CLEARED') {
            setNotifications([]);
            setReadIds([]);
            loadNotifications(false);
          } else if (
            e.data?.type === 'NOTIFICATION_CREATED' ||
            e.data?.type === 'NEW_SESSION_BOOKED' ||
            e.data?.type === 'MEET_LINK_ADDED' ||
            e.data?.type === 'SESSION_DELETED'
          ) {
            loadNotifications(false);
          }
        };
      }
    } catch {}

    // Custom app_notification event listener (same-tab instant 0ms update)
    const handleAppNotification = () => {
      loadNotifications(false);
    };
    const handleAppCleared = () => {
      setNotifications([]);
      setReadIds([]);
      loadNotifications(false);
    };
    window.addEventListener('app_notification', handleAppNotification);
    window.addEventListener('app_notifications_cleared', handleAppCleared);

    // Storage event listener (cross-tab instant fallback)
    const handleStorage = (e) => {
      if (
        e.key === 'app_unified_notifications' ||
        e.key === 'student_notifications' ||
        e.key === 'notif_cleared_timestamp' ||
        e.key === 'notif_deleted_ids'
      ) {
        loadNotifications(false);
      }
    };
    window.addEventListener('storage', handleStorage);

    // Fast periodic live background sync (every 3s) for separate devices/browsers
    const liveInterval = setInterval(() => {
      loadNotifications(false);
    }, 3000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('app_notification', handleAppNotification);
      window.removeEventListener('app_notifications_cleared', handleAppCleared);
      window.removeEventListener('storage', handleStorage);
      clearInterval(liveInterval);
    };
  }, [loadNotifications]);

  // Escape listener to close notifications window
  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isNotificationsOpen]);

  // Click outside listener for User Menu Dropdown
  useEffect(() => {
    const handleUserOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleUserEscape = (e) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleUserOutsideClick);
      document.addEventListener('touchstart', handleUserOutsideClick);
      document.addEventListener('keydown', handleUserEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleUserOutsideClick);
      document.removeEventListener('touchstart', handleUserOutsideClick);
      document.removeEventListener('keydown', handleUserEscape);
    };
  }, [isUserMenuOpen]);

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    try { localStorage.setItem('notif_read_ids', JSON.stringify(allIds)); } catch {}
  };

  const clearAllNotifications = () => {
    const now = Date.now();
    try {
      localStorage.setItem('notif_cleared_timestamp', String(now));
      localStorage.setItem('app_unified_notifications', '[]');
      localStorage.setItem('student_notifications', '[]');
      localStorage.setItem('notif_read_ids', '[]');
      const currentIds = notifications.map(n => n.id);
      const existingDeleted = JSON.parse(localStorage.getItem('notif_deleted_ids') || '[]');
      const updatedDeleted = Array.from(new Set([...existingDeleted, ...currentIds]));
      localStorage.setItem('notif_deleted_ids', JSON.stringify(updatedDeleted));
    } catch {}

    setNotifications([]);
    setReadIds([]);

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('app_sessions_channel');
        bc.postMessage({ type: 'ALL_NOTIFICATIONS_CLEARED', timestamp: now });
        bc.close();
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('app_notifications_cleared', { detail: { timestamp: now } }));
  };

  const deleteNotification = (e, notifId) => {
    e.stopPropagation();
    try {
      const existingDeleted = JSON.parse(localStorage.getItem('notif_deleted_ids') || '[]');
      const updatedDeleted = Array.from(new Set([...existingDeleted, notifId]));
      localStorage.setItem('notif_deleted_ids', JSON.stringify(updatedDeleted));

      const unified = JSON.parse(localStorage.getItem('app_unified_notifications') || '[]');
      localStorage.setItem('app_unified_notifications', JSON.stringify(unified.filter(n => n.id !== notifId)));
    } catch {}

    setNotifications(prev => prev.filter(n => n.id !== notifId));
    setReadIds(prev => prev.filter(id => id !== notifId));
  };

  const handleNotificationClick = (notif) => {
    if (!notif) return;

    if (!readIds.includes(notif.id)) {
      const updated = [...readIds, notif.id];
      setReadIds(updated);
      try { localStorage.setItem('notif_read_ids', JSON.stringify(updated)); } catch {}
    }

    setIsNotificationsOpen(false);

    const sessionId = notif.meta?.sessionId || '';
    const studentName = notif.meta?.studentName || '';

    // 1. Student notification: MEET_LINK_ADDED or link to dashboard
    if (notif.type === 'MEET_LINK_ADDED' || notif.link === '/dashboard' || (notif.link && notif.link.startsWith('/dashboard'))) {
      try {
        if (sessionId) sessionStorage.setItem('student_target_session_id', String(sessionId));
      } catch {}

      const targetUrl = `/dashboard${sessionId ? `?sessionId=${sessionId}` : ''}`;

      window.dispatchEvent(new CustomEvent('student_focus_session', {
        detail: { sessionId, notif }
      }));

      if (window.location.pathname === '/dashboard') {
        navigate(targetUrl, { replace: true });
      } else {
        navigate(targetUrl);
      }

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('student_focus_session', {
          detail: { sessionId, notif }
        }));
      }, 100);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('student_focus_session', {
          detail: { sessionId, notif }
        }));
      }, 300);
      return;
    }

    // 2. Student notification: SESSION_COMPLETED or link to /parent
    if (notif.type === 'SESSION_COMPLETED' || notif.link === '/parent' || (notif.link && notif.link.startsWith('/parent'))) {
      try {
        if (sessionId) sessionStorage.setItem('parent_target_session_id', String(sessionId));
      } catch {}

      const targetUrl = `/parent${sessionId ? `?sessionId=${sessionId}` : ''}`;

      window.dispatchEvent(new CustomEvent('parent_focus_session', {
        detail: { sessionId, notif }
      }));

      if (window.location.pathname === '/parent') {
        navigate(targetUrl, { replace: true });
      } else {
        navigate(targetUrl);
      }

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('parent_focus_session', {
          detail: { sessionId, notif }
        }));
      }, 100);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('parent_focus_session', {
          detail: { sessionId, notif }
        }));
      }, 300);
      return;
    }

    // 3. Admin / Teacher notification: NEW_SESSION_REQUEST or link to /admin
    if (notif.type === 'NEW_SESSION_REQUEST' || notif.link === '/admin' || (notif.link && notif.link.startsWith('/admin')) || !!sessionId) {
      try {
        sessionStorage.setItem('admin_target_tab', 'session');
        if (sessionId) sessionStorage.setItem('admin_target_session_id', String(sessionId));
      } catch {}

      const targetQuery = `tab=session${sessionId ? `&sessionId=${sessionId}` : ''}${studentName ? `&student=${encodeURIComponent(studentName)}` : ''}`;
      const targetUrl = `/admin?${targetQuery}`;

      // Dispatch custom event immediately for same-window active page
      window.dispatchEvent(new CustomEvent('admin_switch_tab', {
        detail: { tab: 'session', sessionId, studentName, notif }
      }));

      if (window.location.pathname === '/admin') {
        navigate(targetUrl, { replace: true });
      } else {
        navigate(targetUrl);
      }

      // Backup delayed dispatches to ensure AdminPage catches it
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('admin_switch_tab', {
          detail: { tab: 'session', sessionId, studentName, notif }
        }));
      }, 100);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('admin_switch_tab', {
          detail: { tab: 'session', sessionId, studentName, notif }
        }));
      }, 300);
      return;
    }

    if (notif.link) {
      navigate(notif.link);
    } else {
      navigate('/dashboard');
    }
  };

  const formatRelativeTime = (isoStr) => {
    try {
      const diff = Date.now() - new Date(isoStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return lang === 'ar' ? 'الآن' : 'À l\'instant';
      if (mins < 60) return lang === 'ar' ? `منذ ${mins} دقيقة` : `il y a ${mins} min`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return lang === 'ar' ? `منذ ${hrs} ساعة` : `il y a ${hrs}h`;
      const days = Math.floor(hrs / 24);
      return lang === 'ar' ? `منذ ${days} يوم` : `il y a ${days}j`;
    } catch { return ''; }
  };

  const cleanTitle = (raw) => {
    if (!raw) return '';
    const str = typeof raw === 'object' ? (raw[lang] || raw.fr || raw.ar || raw.en || '') : String(raw);
    return str
      .replace(/\s*\(\d{4}-\d{2}-\d{2}\)/g, '')
      .replace(/\s*\(Séance\)/g, '')
      .replace(/\s*\(حصة\)/g, '')
      .replace(/\s*\(Session\)/g, '')
      .trim();
  };
  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
    logoutUser();
    navigate('/');
  };
  // ──────────────────────────────────────────────────────────────────────────

  const navLinks = [
    { to: '/', label: t.nav.home, icon: 'home', end: true },
    { to: '/dashboard', label: t.nav.dashboard, icon: 'face' },
    { to: '/parent', label: t.nav.parent, icon: 'supervisor_account' },
    { to: '/games', label: t.nav.games || 'Jeux', icon: 'sports_esports' },
    ...(showCalendar ? [{ to: '/calendar', label: t.nav.calendar, icon: 'calendar_month' }] : []),
    ...(showAdmin ? [{ to: '/admin', label: t.nav.admin || 'Admin', icon: 'admin_panel_settings' }] : []),
  ];

  return (
    <header className={`bg-surface/95 dark:bg-surface-dim/95 backdrop-blur-lg top-0 border-b border-surface-variant/80 shadow-sm z-50 sticky transition-all${!isLoggedIn ? ' guest-nav' : ''}${showAdmin ? ' admin-teacher-nav' : ''}`}>
      <div className="flex justify-between items-center w-full px-4 sm:px-8 md:px-12 h-[80px]">
        {/* Left: Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="text-xl md:text-2xl font-black text-[#1c0576] flex items-center gap-2.5 cursor-pointer text-left hover:scale-105 transition-transform"
          >
            <img
              src="/logo.png"
              alt="Logo La clé des langues"
              className="w-10 h-10 object-contain rounded-xl shadow-xs hide-on-357"
            />
            <span className="tracking-tight">{t.brand}</span>
            {isAdminPath && (
              <span className="text-tertiary text-xs font-bold bg-surface-container-high px-2.5 py-1 rounded-full border border-surface-variant hidden sm:inline-block">
                {t.adminPage.badge}
              </span>
            )}
          </Link>
        </div>

        {/* Center: Navigation Tabs (Desktop > 1252px) */}
        <div className="nav-desktop-only items-center justify-center flex-1 mx-4 sm:mx-8">
          <div className="bg-surface-container-low/90 backdrop-blur-md p-1.5 sm:p-2 rounded-full border border-surface-variant/80 gap-2 sm:gap-3 shadow-inner inline-flex items-center">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `nav-pill-creative inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap gap-2 cursor-pointer ${isActive
                    ? 'active-pill'
                    : 'text-on-surface-variant'
                  }`
                }
              >
                <span className="material-symbols-outlined text-xl inline-flex items-center justify-center shrink-0">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Actions & Menu Toggle */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Admin Edit Navbar Button - Only visible for Admin accounts */}
          {user?.role?.toLowerCase().includes('admin') && (
            <button
              onClick={() => setIsEditNavOpen(true)}
              title={lang === 'ar' ? 'تعديل أسماء أزرار الهيدر' : 'Modifier les boutons du Header'}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#4221b6] to-[#5d35e0] text-white px-3 sm:px-4 py-2 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border border-white/20"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'تعديل الأزرار' : 'Modifier Nav'}
              </span>
            </button>
          )}

          {/* Globe Language Button (Desktop) */}
          <button
            onClick={() => setIsLangModalOpen(true)}
            title={lang === 'ar' ? 'تغيير اللغة' : lang === 'en' ? 'Change language' : 'Changer de langue'}
            aria-label="Change Language"
            className="hidden md:flex hide-on-471 items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-white border border-surface-variant hover:border-[#4221b6]/40 text-on-surface hover:text-[#4221b6] shadow-xs hover:shadow-sm transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined text-lg text-[#4221b6] group-hover:rotate-45 transition-transform duration-300">
              public
            </span>
            <span className="font-black text-xs uppercase tracking-wider text-slate-700 group-hover:text-[#4221b6]">
              {lang}
            </span>
            <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-[#4221b6]">
              expand_more
            </span>
          </button>

          {/* Notifications Bell */}
          <div className="flex items-center gap-2 text-on-surface-variant">
            <div ref={notifContainerRef} className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (isMenuOpen) setIsMenuOpen(false);
                }}
                aria-label="notifications"
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all cursor-pointer relative shadow-sm hover:scale-105 ${isNotificationsOpen ? 'bg-[#4221b6] text-white shadow-md' : 'bg-surface-container-low hover:bg-surface-container-high hover:text-[#4221b6] border border-surface-variant'
                  }`}
              >
                <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#4221b6] text-white rounded-full text-[11px] font-black flex items-center justify-center border-2 border-surface shadow-md animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover / Mobile Sheet via Portal */}
              {isNotificationsOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col justify-start items-center p-3 sm:p-0 pointer-events-none">
                  {/* Fullscreen Dark Backdrop covering 100% of website */}
                  <div
                    onClick={() => setIsNotificationsOpen(false)}
                    className="fixed inset-0 bg-black/60 cursor-pointer pointer-events-auto transition-opacity duration-200 animate-in fade-in"
                  ></div>

                  {/* Popover Card */}
                  <div
                    ref={popoverRef}
                    className={`pointer-events-auto w-full max-w-md sm:w-96 bg-white rounded-3xl shadow-2xl border-2 border-[#8c90f6]/40 z-[10000] overflow-hidden transform transition-all duration-200 mt-20 sm:mt-0 sm:fixed sm:top-[86px] ${isRtl ? 'sm:left-6 md:left-12' : 'sm:right-6 md:right-12'} flex flex-col max-h-[calc(100vh-100px)] animate-in zoom-in-95`}
                  >
                    <div className="p-3.5 sm:p-4 px-4 sm:px-5 bg-gradient-to-r from-[#f5f3ff] to-white border-b border-slate-100 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#4221b6] text-white flex items-center justify-center text-sm shadow-xs">
                          🔔
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-[#1c0576]">
                          {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-[#4221b6] text-white shadow-xs">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={markAllRead}
                            title={lang === 'ar' ? 'تحديد الكل كمقروء' : 'Tout marquer lu'}
                            className="text-[11px] sm:text-xs font-extrabold text-[#4221b6] hover:text-[#351996] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">done_all</span>
                            <span>{lang === 'ar' ? 'مقروء' : 'Lu'}</span>
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={clearAllNotifications}
                            title={lang === 'ar' ? 'حذف جميع الإشعارات تماماً' : 'Supprimer toutes les notifications'}
                            className="text-[11px] sm:text-xs font-extrabold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">delete_sweep</span>
                            <span>{lang === 'ar' ? 'حذف الكل' : 'Effacer'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">notifications_off</span>
                          </div>
                          <p className="text-xs font-bold text-slate-500">
                            {lang === 'ar' ? 'لا توجد إشعارات حالياً' : 'Aucune notification pour l\'instant'}
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isUnread = !readIds.includes(notif.id);
                          const titleText = typeof notif.title === 'object'
                            ? (notif.title[lang] || notif.title.fr || notif.title.ar || 'Notification')
                            : (notif.title || 'Notification');
                          
                          const descText = typeof notif.desc === 'object'
                            ? (notif.desc[lang] || notif.desc.fr || notif.desc.ar || '')
                            : (notif.desc || (typeof notif.message === 'object' ? (notif.message[lang] || notif.message.fr) : notif.message) || '');

                          const iconName = notif.icon || (notif.type === 'MEET_LINK_ADDED' ? 'videocam' : notif.type === 'NEW_USER_REGISTERED' ? 'person_add' : 'calendar_month');
                          const iconBg = notif.iconBg || (notif.type === 'MEET_LINK_ADDED' ? 'bg-emerald-100 text-emerald-700' : notif.type === 'NEW_USER_REGISTERED' ? 'bg-blue-100 text-blue-700' : 'bg-[#e0d7ff] text-[#4221b6]');

                          return (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3.5 sm:p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0 group relative ${isUnread ? 'bg-[#f7f5ff]' : ''}`}
                            >
                              <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                                <span className="material-symbols-outlined text-lg sm:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  {iconName}
                                </span>
                              </div>
                              <div className="flex-grow space-y-1 min-w-0 pr-6 rtl:pr-0 rtl:pl-6">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="break-words">{cleanTitle(titleText)}</span>
                                    {isUnread && (
                                      <span className="inline-block w-2 h-2 rounded-full bg-[#4221b6] shrink-0 animate-pulse"></span>
                                    )}
                                  </h4>
                                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 whitespace-nowrap shrink-0 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {formatRelativeTime(notif.timestamp)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                  {descText}
                                </p>
                              </div>

                              {/* Individual Notification Delete Button */}
                              <button
                                onClick={(e) => deleteNotification(e, notif.id)}
                                title={lang === 'ar' ? 'حذف هذا الإشعار' : 'Supprimer cette notification'}
                                className="absolute top-3 right-3 rtl:right-auto rtl:left-3 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-slate-200 hover:bg-red-500 hover:text-white text-slate-600 flex items-center justify-center text-xs transition-all cursor-pointer shadow-xs"
                              >
                                <span className="material-symbols-outlined text-xs">close</span>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-4 shrink-0">
                      {notifications.length > 0 ? (
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs font-extrabold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete_sweep</span>
                          <span>{lang === 'ar' ? 'مسح جميع الإشعارات' : 'Vider les notifications'}</span>
                        </button>
                      ) : <div></div>}

                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-xs font-black text-slate-600 hover:text-[#4221b6] transition-colors cursor-pointer inline-flex items-center gap-1 px-4 py-1.5 rounded-full hover:bg-slate-200"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        <span>{lang === 'ar' ? 'إغلاق' : 'Fermer'}</span>
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>

            <button
              onClick={() => setIsLangModalOpen(true)}
              aria-label="language"
              title={lang === 'ar' ? 'تغيير اللغة' : 'Changer la langue'}
              className="w-11 h-11 hide-on-471 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container-high border border-surface-variant text-on-surface hover:text-[#4221b6] transition-colors md:hidden cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px] text-[#4221b6]">public</span>
            </button>
          </div>

          {/* Account Profile Circle Widget with Dropdown */}
          {user ? (
            <div ref={userMenuRef} className="relative hide-on-471">
              {/* Circular Avatar Trigger */}
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  if (isNotificationsOpen) setIsNotificationsOpen(false);
                }}
                aria-label="Account Menu"
                title={user.parentName || user.email}
                className={`w-11 h-11 rounded-full bg-gradient-to-tr from-[#4221b6] via-[#5d35e0] to-[#78fd7d] text-white flex items-center justify-center font-black text-sm relative transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 border-2 border-white ${
                  isUserMenuOpen
                    ? 'ring-4 ring-[#4221b6]/35 shadow-lg scale-105'
                    : 'hover:shadow-md'
                }`}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white font-black text-sm">
                    {user.parentName ? user.parentName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '👤')}
                  </span>
                )}
                {/* Online Status Dot */}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs"></span>
              </button>

              {/* Dropdown Popover Under the Circle */}
              {isUserMenuOpen && (
                <div
                  className={`absolute top-full mt-3 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-3xl border border-slate-100 shadow-2xl p-4 z-[999] animate-in fade-in zoom-in-95 duration-150 ${
                    isRtl ? 'left-0' : 'right-0'
                  }`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                >
                  {/* User Profile Card */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#f5f3ff] via-[#faf8ff] to-[#f0fdf4] border border-[#8c90f6]/25 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4221b6] via-[#5d35e0] to-[#78fd7d] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 overflow-hidden">
                      {user.picture ? (
                        <img src={user.picture} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.parentName ? user.parentName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '👤')}</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 text-left rtl:text-right flex-1">
                      <span className="text-sm font-black text-[#1c0576] truncate block">
                        {user.parentName || (user.email ? user.email.split('@')[0] : 'Compte')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium truncate block" title={user.email}>
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* Badges / Extra info */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 px-0.5">
                    {formatRoleLabel(user.role || user.roles).map((rb, rIdx) => (
                      <span
                        key={rIdx}
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${rb.color}`}
                      >
                        {rb.label}
                      </span>
                    ))}
                    {user.childName && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        👶 {user.childName}
                      </span>
                    )}
                  </div>

                  {/* Navigation Links inside Dropdown */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1">
                    {(isAdmin || isMaitresse) && (
                      <Link
                        to="/admin?tab=session"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#4221b6] hover:bg-violet-50/80 transition-all group"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-lg text-[#4221b6] group-hover:scale-110 transition-transform">
                            {isAdmin ? 'admin_panel_settings' : 'school'}
                          </span>
                          <span>
                            {isAdmin
                              ? (lang === 'ar' ? 'لوحة التحكم والإدارة' : 'Espace Administration')
                              : (lang === 'ar' ? 'مساحة المعلمة وإدارة الحصص' : 'Espace Maîtresse & Sessions')}
                          </span>
                        </span>
                        <span className="material-symbols-outlined text-xs rtl:rotate-180 text-slate-400 group-hover:text-[#4221b6]">arrow_forward</span>
                      </Link>
                    )}

                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#4221b6] hover:bg-violet-50/80 transition-all group"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-lg text-emerald-600 group-hover:scale-110 transition-transform">school</span>
                        <span>{lang === 'ar' ? 'لوحة التعلّم والدروس' : 'Espace Élève & Cours'}</span>
                      </span>
                      <span className="material-symbols-outlined text-xs rtl:rotate-180 text-slate-400 group-hover:text-[#4221b6]">arrow_forward</span>
                    </Link>

                    <Link
                      to="/parent"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#4221b6] hover:bg-violet-50/80 transition-all group"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-lg text-amber-500 group-hover:scale-110 transition-transform">family_restroom</span>
                        <span>{lang === 'ar' ? 'مساحة الولي والمتابعة' : 'Espace Parent'}</span>
                      </span>
                      <span className="material-symbols-outlined text-xs rtl:rotate-180 text-slate-400 group-hover:text-[#4221b6]">arrow_forward</span>
                    </Link>
                  </div>

                  {/* Logout Button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 hover:border-red-600 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-[0.99] group"
                    >
                      <span className="material-symbols-outlined text-base group-hover:rotate-180 transition-transform">logout</span>
                      <span>{lang === 'ar' ? 'تسجيل الخروج' : lang === 'en' ? 'Log out' : 'Déconnexion'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isAdminPath ? (
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-bold text-label-bold shadow-md cursor-pointer font-bold hover:scale-105 transition-transform hide-on-471">
              AD
            </div>
          ) : (
            <div className="hide-on-471 hidden md:flex items-center gap-2 guest-auth-btns">
              <Link
                to="/auth?mode=login"
                className="flex items-center gap-1.5 border-2 border-[#4221b6] text-[#4221b6] px-5 py-2 rounded-full font-label-bold text-sm hover:bg-[#4221b6] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer font-bold"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                {t.nav.login}
              </Link>
              <Link
                to="/auth?mode=signup"
                className="flex items-center gap-1.5 bg-[#78fd7d] text-[#064e3b] px-6 py-2 rounded-full font-label-bold text-sm hover:brightness-95 hover:-translate-y-0.5 transition-all cursor-pointer font-bold shadow-md"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                {t.nav.signup}
              </Link>
            </div>
          )}

          {/* Creative Menu Toggle Button (Visible at <= 1252px) */}
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              if (isNotificationsOpen) setIsNotificationsOpen(false);
            }}
            aria-label="Toggle Menu"
            className="nav-menu-toggle-btn w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#4221b6] to-[#5d35e0] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 cursor-pointer relative overflow-hidden group ml-1"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span className="material-symbols-outlined text-2xl transition-transform duration-300 group-hover:rotate-90">
              {isMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Render Creative Overlay Menu Portal to document.body so it overlays ALL page elements cleanly */}
      {isMenuOpen && createPortal(
        <>
          {/* Global Dark Backdrop attached directly to body */}
          <div
            onClick={() => setIsMenuOpen(false)}
            style={{ zIndex: 999998 }}
            className="creative-menu-overlay fixed inset-0 bg-black/60 cursor-pointer transition-opacity duration-200"
          />

          {/* Floating Glassmorphic Menu Card */}
          <div
            style={{ zIndex: 999999 }}
            className={`creative-menu-card fixed top-[76px] sm:top-[82px] ${isRtl ? 'left-3 sm:left-6 md:left-12' : 'right-3 sm:right-6 md:right-12'} w-[calc(100vw-24px)] max-w-[330px] sm:max-w-[350px] bg-white rounded-3xl border-2 border-[#8c90f6]/40 p-3 sm:p-4 shadow-[0_25px_60px_-15px_rgba(28,5,118,0.3)] overflow-hidden flex flex-col max-h-[calc(100vh-90px)] animate-in zoom-in-95`}
          >
            {/* Header banner */}
            <div className="flex items-center justify-between p-2.5 mb-2.5 rounded-2xl bg-gradient-to-r from-[#4221b6] to-[#5d35e0] text-white shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Logo La clé des langues"
                  className="w-8 h-8 object-contain rounded-lg bg-white/90 p-0.5 shadow-sm shrink-0"
                />
                <div>
                  <h3 className="font-black text-xs sm:text-sm leading-tight tracking-tight">{t.brand}</h3>
                  <p className="text-[10px] text-white/80 font-medium">Navigation rapide</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Scrollable container for links & details */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-0.5">
              {/* Nav links */}
              <div className="space-y-1.5">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `creative-menu-item flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${isActive
                        ? 'bg-gradient-to-r from-[#4221b6] to-[#5d35e0] text-white border-[#4221b6] shadow-sm scale-[1.01]'
                        : 'bg-[#faf9f5] text-[#1c0576] hover:bg-[#e0d7ff]/50 hover:text-[#4221b6] border-slate-200/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-white/20 text-[#b0fdb5]' : 'bg-[#e0d7ff] text-[#4221b6]'}`}>
                            <span className="material-symbols-outlined text-base sm:text-lg">{link.icon}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-extrabold tracking-tight truncate">{link.label}</span>
                        </div>
                        <span className={`material-symbols-outlined text-base shrink-0 ${isActive ? 'text-white' : 'text-[#4221b6]/60'}`}>
                          {isRtl ? 'chevron_left' : 'chevron_right'}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Quick Actions (Language & User Profile / Logout) */}
              <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                {/* Language Selector in Menu */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLangModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#faf9f5] hover:bg-violet-50 border border-slate-200/60 hover:border-[#4221b6]/30 transition-all cursor-pointer group text-left rtl:text-right"
                >
                  <span className="text-xs font-bold text-slate-700 group-hover:text-[#4221b6] flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-[#4221b6]">public</span>
                    <span>{lang === 'ar' ? 'تغيير لغة المنصة' : lang === 'en' ? 'Change platform language' : 'Changer la langue'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#e0d7ff] text-[#4221b6] font-black text-xs uppercase flex items-center gap-1">
                    <span>{lang}</span>
                    <span className="material-symbols-outlined text-xs rtl:rotate-180">arrow_forward</span>
                  </span>
                </button>

                {/* User Profile & Logout Section in Menu */}
                {user ? (
                  <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[#faf9f5] border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#4221b6] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {user.parentName ? user.parentName.charAt(0).toUpperCase() : '👤'}
                      </div>
                      <div className="flex flex-col overflow-hidden text-left rtl:text-right min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#1c0576] truncate">{user.parentName || (user.email ? user.email.split('@')[0] : 'Compte')}</span>
                          {formatRoleLabel(user.role || user.roles).map((rb, rIdx) => (
                            <span
                              key={rIdx}
                              className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${rb.color}`}
                            >
                              {rb.label}
                            </span>
                          ))}
                        </div>
                        {user.email && (
                          <span className="text-[10px] text-slate-500 font-medium truncate" title={user.email}>
                            {user.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] transition-colors border border-red-200 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      <span>{lang === 'ar' ? 'تسجيل الخروج' : lang === 'en' ? 'Log out' : 'Déconnexion'}</span>
                    </button>
                  </div>
                ) : !isAdminPath ? (
                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                    <Link
                      to="/auth?mode=login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl border border-[#4221b6] text-[#4221b6] font-bold text-xs hover:bg-[#4221b6] hover:text-white transition-all shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">login</span>
                      {t.nav.login}
                    </Link>
                    <Link
                      to="/auth?mode=signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl bg-[#78fd7d] text-[#064e3b] font-bold text-xs hover:brightness-95 transition-all shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      {t.nav.signup}
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Edit Nav Titles Modal */}
      {isEditNavOpen && (
        <EditNavModal onClose={() => setIsEditNavOpen(false)} />
      )}

      {/* Language Selection Modal */}
      {isLangModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLangModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 text-center animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#4221b6] to-[#6d44f5] text-white flex items-center justify-center shadow-lg shadow-[#4221b6]/25 mb-3.5">
              <span className="material-symbols-outlined text-3xl">public</span>
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {lang === 'ar' ? 'اختر لغة المنصة' : lang === 'en' ? 'Choose Platform Language' : 'Choisir la langue'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 mb-5">
              {lang === 'ar' 
                ? 'حدد اللغة المفضلة لتصفح الموقع والدروس' 
                : lang === 'en'
                ? 'Select your preferred language for navigation'
                : 'Sélectionnez votre langue pour une expérience personnalisée'}
            </p>

            {/* Language Options */}
            <div className="flex flex-col gap-2.5">
              {[
                {
                  code: 'fr',
                  name: 'Français',
                  native: 'Français',
                  flag: '🇫🇷',
                  desc: lang === 'ar' ? 'اللغة الفرنسية للدروس والمحتوى' : 'Langue officielle des cours'
                },
                {
                  code: 'ar',
                  name: 'العربية',
                  native: 'العربية',
                  flag: '🌍',
                  desc: lang === 'ar' ? 'التصفح والمحتوى باللغة العربية' : 'Interface en langue arabe'
                },
                {
                  code: 'en',
                  name: 'English',
                  native: 'English',
                  flag: '🇬🇧',
                  desc: lang === 'ar' ? 'التصفح باللغة الإنجليزية' : 'English interface & lessons'
                }
              ].map((item) => {
                const isSelected = lang === item.code;
                return (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLang(item.code);
                      setIsLangModalOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-[#4221b6] bg-gradient-to-r from-violet-50/80 to-indigo-50/50 shadow-sm scale-[1.01]'
                        : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0 p-1 bg-white rounded-xl shadow-xs border border-slate-100">
                        {item.flag}
                      </span>
                      <div className="text-left rtl:text-right">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${isSelected ? 'text-[#4221b6]' : 'text-slate-800'}`}>
                            {item.native}
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#4221b6] text-white">
                              {lang === 'ar' ? 'الحالية' : 'Active'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {item.desc}
                        </span>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#4221b6] text-white' : 'border-2 border-slate-300'
                    }`}>
                      {isSelected && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsLangModalOpen(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
