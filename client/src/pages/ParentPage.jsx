import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import EditSectionModal from '../components/EditSectionModal';
import { API_BASE_URL } from '../config';
import { ParentHeroSkeleton, TableRowsSkeleton } from '../components/Skeletons';

export default function ParentPage() {
  const { lang, t, isRtl } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedSessionId, setHighlightedSessionId] = useState(null);

  // Check if user role contains 'admin'
  const isAdmin = (() => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const r = user.role || user.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('admin');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('admin'));
    return false;
  })();

  const [editingSectionModal, setEditingSectionModal] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep a 1-second live clock for precision unlocking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real sessions for the logged-in parent
  const fetchUserSessions = async (isBackground = false) => {
    try {
      if (!isBackground && sessions.length === 0) {
        setLoadingSessions(true);
      }
      const res = await fetch(`${API_BASE_URL}/api/sessions`);
      if (res.ok) {
        const data = await res.json();
        if (data.sessions && Array.isArray(data.sessions)) {
          const userEmail = (user?.email || '').toLowerCase().trim();
          const userId = String(user?.id || user?._id || '').trim();
          const parentName = (user?.parentName || '').toLowerCase().trim();
          const childName = (user?.childName || '').toLowerCase().trim();

          const myFiltered = data.sessions.filter((s) => {
            const sEmail = (s.studentEmail || '').toLowerCase().trim();
            const sId = String(s.studentId || '').trim();
            const sParent = (s.parentName || '').toLowerCase().trim();
            const sChild = (s.childName || s.studentName || s.name || '').toLowerCase().trim();

            if (userId && sId && userId === sId) return true;
            if (userEmail && sEmail && userEmail === sEmail) return true;
            if (parentName && sParent && (parentName.includes(sParent) || sParent.includes(parentName))) return true;
            if (childName && sChild && (childName.includes(sChild) || sChild.includes(childName))) return true;
            if (isAdmin) return true;

            return false;
          });

          setSessions(myFiltered);
          try {
            localStorage.setItem('admin_sessions_cache', JSON.stringify(data.sessions));
          } catch {}
        }
      }
    } catch (err) {
      console.log('Erreur chargement sessions parent:', err);
    } finally {
      if (!isBackground) {
        setLoadingSessions(false);
      }
    }
  };

  useEffect(() => {
    fetchUserSessions(false);

    // BroadcastChannel listener (real-time cross-tab)
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('app_sessions_channel');
        bc.onmessage = (e) => {
          if (
            e.data?.type === 'MEET_LINK_ADDED' ||
            e.data?.type === 'NEW_SESSION_BOOKED' ||
            e.data?.type === 'SESSION_DELETED' ||
            e.data?.type === 'NOTIFICATION_CREATED'
          ) {
            fetchUserSessions(true);
          }
        };
      }
    } catch {}

    const handleSessionCreated = () => fetchUserSessions(true);
    const handleSessionUpdated = () => fetchUserSessions(true);
    const handleSessionDeleted = () => fetchUserSessions(true);
    const handleAppNotif = () => fetchUserSessions(true);

    window.addEventListener('session_created', handleSessionCreated);
    window.addEventListener('session_updated', handleSessionUpdated);
    window.addEventListener('session_deleted', handleSessionDeleted);
    window.addEventListener('app_notification', handleAppNotif);

    // Live background polling every 2.5s
    const livePoll = setInterval(() => {
      fetchUserSessions(true);
    }, 2500);

    return () => {
      window.removeEventListener('session_created', handleSessionCreated);
      window.removeEventListener('session_updated', handleSessionUpdated);
      window.removeEventListener('session_deleted', handleSessionDeleted);
      window.removeEventListener('app_notification', handleAppNotif);
      clearInterval(livePoll);
      if (bc) bc.close();
    };
  }, [user, isAdmin]);

  // Read target session from sessionStorage or URL query
  useEffect(() => {
    try {
      const storedSessId = sessionStorage.getItem('parent_target_session_id');
      if (storedSessId) {
        setHighlightedSessionId(String(storedSessId));
        sessionStorage.removeItem('parent_target_session_id');
      }
    } catch {}
  }, []);

  useEffect(() => {
    const sessParam = searchParams.get('sessionId');
    if (sessParam) {
      setHighlightedSessionId(String(sessParam));
    }
  }, [searchParams]);

  useEffect(() => {
    const handleFocus = (e) => {
      const targetSessId = e.detail?.sessionId || e.detail?.notif?.meta?.sessionId;
      if (targetSessId) {
        setHighlightedSessionId(String(targetSessId));
        fetchUserSessions(true);
      }
    };
    window.addEventListener('parent_focus_session', handleFocus);
    return () => window.removeEventListener('parent_focus_session', handleFocus);
  }, []);

  // Auto-scroll to highlighted session row
  useEffect(() => {
    if (!highlightedSessionId || sessions.length === 0) return;

    const targetId = String(highlightedSessionId);
    setTimeout(() => {
      const el = document.getElementById(`parent_session_${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);

    const timer = setTimeout(() => {
      setHighlightedSessionId(null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [highlightedSessionId, sessions]);

  // ── Helper to calculate next concrete Date object for a session ─────────────
  const DAY_MAP = {
    dimanche: 0, sunday: 0, 'الأحد': 0, 'الاحد': 0,
    lundi: 1, monday: 1, 'الإثنين': 1, 'الاثنين': 1,
    mardi: 2, tuesday: 2, 'الثلاثاء': 2,
    mercredi: 3, wednesday: 3, 'الأربعاء': 3, 'الاربعاء': 3,
    jeudi: 4, thursday: 4, 'الخميس': 4,
    vendredi: 5, friday: 5, 'الجمعة': 5, 'الجمعه': 5,
    samedi: 6, saturday: 6, 'السبت': 6,
  };

  const getSessionDateObject = (session) => {
    if (!session) return null;
    const now = currentTime;

    // 1. Extract hours and minutes
    let hours = 10, minutes = 0;
    const timeMatch = String(session.time || session.datetime || '').match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    }

    // 2. Day of week match
    const rawDay = String(session.day || session.datetime || '').toLowerCase();
    let targetDayOfWeek = null;
    for (const [key, val] of Object.entries(DAY_MAP)) {
      if (rawDay.includes(key)) {
        targetDayOfWeek = val;
        break;
      }
    }

    if (targetDayOfWeek !== null) {
      const currentDayOfWeek = now.getDay();
      let diff = targetDayOfWeek - currentDayOfWeek;

      const candidateToday = new Date(now);
      candidateToday.setHours(hours, minutes, 0, 0);

      // If it's today and the session was more than 1 hour ago, move to next week
      if (diff === 0 && now.getTime() > candidateToday.getTime() + 60 * 60 * 1000) {
        diff = 7;
      } else if (diff < 0) {
        diff += 7;
      }

      const target = new Date(now);
      target.setDate(now.getDate() + diff);
      target.setHours(hours, minutes, 0, 0);
      return target;
    }

    // 3. Fallback direct date parse
    const directDate = new Date(session.datetime || session.day || session.createdAt || Date.now());
    if (!isNaN(directDate.getTime())) {
      directDate.setHours(hours, minutes, 0, 0);
      return directDate;
    }

    return null;
  };

  // ── Find closest session with Meet link added ──────────────────────────────
  const sessionsWithMeet = sessions.filter((s) => Boolean(s.meetUrl) || s.status === 'meet_added');

  const sortedMeetSessions = [...sessionsWithMeet].map((s) => {
    const dateObj = getSessionDateObject(s);
    return {
      session: s,
      dateObj,
      targetTime: dateObj ? dateObj.getTime() : 0,
      diffFromNow: dateObj ? dateObj.getTime() - currentTime.getTime() : Infinity,
    };
  }).sort((a, b) => {
    // Sort upcoming first (diffFromNow >= -3600000), then past
    const isAUpcoming = a.diffFromNow >= -3600000;
    const isBUpcoming = b.diffFromNow >= -3600000;
    if (isAUpcoming && !isBUpcoming) return -1;
    if (!isAUpcoming && isBUpcoming) return 1;
    return a.targetTime - b.targetTime;
  });

  const closestItem = sortedMeetSessions.length > 0 ? sortedMeetSessions[0] : null;
  const closestSession = closestItem?.session || null;
  const closestDateObj = closestItem?.dateObj || null;

  // Session is unlocked EXACTLY when current time reaches or passes the session time
  const isUnlocked = closestDateObj ? (currentTime.getTime() >= closestDateObj.getTime()) : false;

  // Calculate formatted times
  const formattedStartTime = closestDateObj
    ? closestDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : (closestSession?.time || '10:00');

  const formattedEndTime = closestDateObj
    ? new Date(closestDateObj.getTime() + 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '10:45';

  const isSessionToday = closestDateObj && closestDateObj.toDateString() === currentTime.toDateString();

  return (
    <div className="w-full max-w-7xl mx-auto px-container-margin py-8 md:py-12 space-y-12 pb-32 md:pb-16 relative">
      
      {/* 1. Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-[#f3e5f5]/50 to-[#e1bee7]/30 p-6 rounded-3xl border border-[#ab47bc]/30 relative shadow-sm">
        {/* Admin Edit Button */}
        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'parentHeader', title: lang === 'ar' ? 'ترويسة فضاء الوليّ' : 'En-tête Espace Parent' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl md:text-display-lg font-extrabold text-[#4221b6] tracking-tight title-parent-responsive">
            {t.parentPage?.title}
          </h1>
          <p className="text-sm sm:text-base md:text-body-lg text-on-surface-variant mt-2 font-medium">
            {t.parentPage?.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/90 py-3 px-5 rounded-full border border-surface-variant shadow-sm shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container flex-shrink-0">
            <img
              className="w-full h-full object-cover"
              alt="Parent profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsYrFVHxYGB5DTFF6Vt8NMnvUybBzPs13vQDZsROgn5IwHPVdvlUc_y1tCCpuVnNS_XDyAYTZOVg6AS8casZMYZmr_lIoTiqrQF0LKeKcN0VrCs6e6tSZOgwFx2EhHwzUICzKBV9tMsLjAwWFZfzbGniXEttVF9FXUY_OpoSgHqo797hXzkRa-uOWTFMhQckejrn0yh9JJwoJC43PkMRTDAxLwRAOPRU9fEtdvJcwOdZOi24NLFKKg"
            />
          </div>
          <div>
            <div className="font-label-bold text-label-bold text-on-surface font-bold">
              {user?.parentName || t.parentPage?.accountType}
            </div>
            <div className="text-sm text-tertiary font-bold">
              {user?.childName ? user.childName : t.parentPage?.accountBadge}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. History Section */}
          <section className="bg-surface rounded-3xl p-4 sm:p-6 md:p-8 card-padding-515 soft-card-shadow border border-surface-variant card-hover-effect relative">
            {/* Admin Edit Button */}
            {isAdmin && (
              <button
                onClick={() => setEditingSectionModal({ key: 'parentHistory', title: lang === 'ar' ? 'جدول سجل الجلسات' : 'Historique des sessions' })}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
              </button>
            )}

            <div className="flex justify-between items-center mb-4 sm:mb-6 pr-24 rtl:pr-0 rtl:pl-24">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl sm:text-[28px]">history</span>
                <h2 className="text-base sm:text-lg md:text-headline-md font-headline-md font-bold text-on-surface">
                  {t.parentPage?.historyTitle}
                </h2>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-primary text-xs sm:text-sm font-label-bold hover:underline cursor-pointer font-bold"
              >
                {t.parentPage?.seeAll}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-responsive-515">
                <thead>
                  <tr className="border-b border-outline-variant text-tertiary font-label-bold uppercase tracking-wider text-xs">
                    <th className="pb-4">{t.parentPage?.thDate}</th>
                    <th className="pb-4">{t.parentPage?.thSubject}</th>
                    <th className="pb-4">{t.parentPage?.thTutor}</th>
                    <th className="pb-4">{t.parentPage?.thStatus}</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface divide-y divide-surface-variant">
                  {loadingSessions ? (
                    <tr>
                      <td colSpan="4" className="p-0">
                        <TableRowsSkeleton rows={4} cols={4} />
                      </td>
                    </tr>
                  ) : sessions.length > 0 ? (
                    sessions.slice(0, 10).map((session, sIdx) => {
                      const sessionDateTime = session.datetime || (session.day ? `${session.day}, ${session.time}` : 'Date');
                      const hasMeet = Boolean(session.meetUrl) || session.status === 'meet_added';
                      const sessionIdStr = String(session._id || session.id || sIdx);
                      const isHighlighted = highlightedSessionId && (
                        sessionIdStr === String(highlightedSessionId) ||
                        String(session._id) === String(highlightedSessionId) ||
                        String(session.id) === String(highlightedSessionId)
                      );

                      return (
                        <tr
                          id={`parent_session_${sessionIdStr}`}
                          key={session._id || session.id || sIdx}
                          className={`transition-all duration-300 ${
                            isHighlighted
                              ? 'bg-gradient-to-r from-emerald-100 via-emerald-50 to-teal-50 ring-1 ring-emerald-500 font-extrabold shadow-sm'
                              : 'hover:bg-surface-container-low'
                          }`}
                        >
                          <td className="py-4 font-bold text-xs sm:text-sm text-slate-800">
                            <div className="flex items-center gap-2">
                              {isHighlighted && (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0"></span>
                              )}
                              <span>{sessionDateTime}</span>
                            </div>
                          </td>
                          <td className="py-4 text-xs sm:text-sm font-semibold text-slate-600">
                            {session.subject || 'Français & Arabe'}
                          </td>
                          <td className="py-4 flex items-center gap-2 text-xs sm:text-sm">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0">
                              {(session.teacherName || 'M')[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-700">{session.teacherName || 'Maîtresse'}</span>
                          </td>
                          <td className="py-4">
                            {session.status === 'completed' || session.status === 'done' ? (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                                isHighlighted
                                  ? 'bg-emerald-600 text-white animate-pulse ring-2 ring-white shadow-md'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                <span className="material-symbols-outlined text-xs">verified</span>
                                <span>{lang === 'ar' ? 'مكتملة بنجاح ✅' : 'Complété ✅'}</span>
                              </span>
                            ) : hasMeet ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-800 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                <span>{lang === 'ar' ? 'رابط جاهز' : 'Lien Meet'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                <span>{lang === 'ar' ? 'في الانتظار' : 'En attente'}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400 font-semibold text-xs">
                        <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">history</span>
                        {lang === 'ar' ? 'لا يوجد سجل حصص مسجل حتى الآن.' : 'Aucun historique de session pour le moment.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* 3. Upcoming Sessions Section (À Venir) */}
        <div className="lg:col-span-1">
          <section className="bg-surface-bright rounded-3xl p-6 soft-card-shadow border border-secondary-fixed/50 h-full flex flex-col card-hover-effect relative">
            {/* Admin Edit Button */}
            {isAdmin && (
              <button
                onClick={() => setEditingSectionModal({ key: 'parentUpcoming', title: lang === 'ar' ? 'قسم الجلسات القادمة' : 'Sessions à venir' })}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
              </button>
            )}

            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary text-[28px]">calendar_month</span>
              <h2 className="text-headline-md font-headline-md text-on-surface font-extrabold">
                {t.parentPage?.upcomingTitle || (lang === 'ar' ? 'الجلسات القادمة' : 'À Venir')}
              </h2>
            </div>

            <div className="space-y-4 flex-grow">
              {loadingSessions ? (
                <ParentHeroSkeleton />
              ) : closestSession ? (
                <div className="bg-surface rounded-2xl p-5 border-2 border-[#4221b6]/30 shadow-md relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 left-0 w-2 h-full bg-[#4221b6]"></div>
                  
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="bg-[#e0d7ff] text-[#4221b6] border border-[#8c90f6]/40 text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                      {isSessionToday
                        ? (lang === 'ar' ? 'اليوم' : 'AUJOURD\'HUI')
                        : (closestSession.day || (lang === 'ar' ? 'قريباً' : 'PROCHAINEMENT'))}
                    </span>
                    <span className="text-slate-700 font-extrabold text-xs flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                      <span className="material-symbols-outlined text-xs text-[#4221b6]">schedule</span>
                      <span>{formattedStartTime} - {formattedEndTime}</span>
                    </span>
                  </div>

                  <h3 className="font-black text-base sm:text-lg text-[#1c0576] mb-1 leading-snug">
                    {closestSession.subject || (lang === 'ar' ? 'جلسة تعليمية' : 'Français & Arabe')}
                  </h3>

                  <p className="text-xs text-slate-500 font-bold mb-4 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-emerald-700">school</span>
                    <span>
                      {lang === 'ar'
                        ? `مع المعلمة: ${closestSession.teacherName || 'الأستاذة'}`
                        : `Avec ${closestSession.teacherName || 'Maîtresse'}`}
                    </span>
                  </p>

                  {/* Dynamic Action Button: Unlocked vs Locked */}
                  {isUnlocked && closestSession.meetUrl ? (
                    <a
                      href={closestSession.meetUrl.startsWith('http') ? closestSession.meetUrl : `https://${closestSession.meetUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#4221b6] hover:bg-[#341a99] text-white min-h-[48px] px-4 py-2.5 rounded-full font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-xl">videocam</span>
                      <span>{t.parentPage?.joinVideo || (lang === 'ar' ? 'الانضمام إلى الحصة' : 'Rejoindre la session')}</span>
                    </a>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled
                        className="w-full bg-slate-100 text-slate-400 border border-slate-200 min-h-[48px] px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-inner"
                      >
                        <span className="material-symbols-outlined text-lg text-slate-400">lock</span>
                        <span>{lang === 'ar' ? 'مغلق حتى موعد الحصة' : 'Verrouillé jusqu\'à l\'heure du cours'}</span>
                      </button>

                      <p className="text-[11px] text-center text-slate-500 font-semibold flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs text-[#4221b6]">info</span>
                        <span>
                          {lang === 'ar'
                            ? 'سيفتح الزر تلقائياً في موعد بداية الحصة بالضبط'
                            : 'Le bouton s\'activera exactement à l\'heure du cours'}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-surface rounded-2xl p-6 border border-slate-200 text-center flex flex-col items-center justify-center gap-3 py-10 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-[#e0d7ff]/60 text-[#4221b6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">event_available</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 mb-1">
                      {lang === 'ar' ? 'لا توجد حصص برابط حالياً' : 'Aucune session avec lien pour le moment'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium max-w-xs">
                      {lang === 'ar'
                        ? 'ستظهر هنا أقرب حصة فور قيام المعلمة بإضافة رابط Google Meet.'
                        : 'La prochaine session apparaîtra ici dès que l\'enseignante ajoutera le lien de la réunion.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Admin Section Edit Modal */}
      {editingSectionModal && (
        <EditSectionModal
          sectionKey={editingSectionModal.key}
          sectionTitle={editingSectionModal.title}
          onClose={() => setEditingSectionModal(null)}
        />
      )}
    </div>
  );
}
