import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import EditSectionModal from '../components/EditSectionModal';
import { API_BASE_URL } from '../config';
import { createNotification } from '../utils/notifications';
import { TeacherCardsSkeleton } from '../components/Skeletons';

export default function CalendarPage() {
  const { lang, t, isRtl, customSections, updateSectionData } = useLanguage();
  const { user, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const teacherIdParam = searchParams.get('teacherId');
  const teacherNameParam = searchParams.get('teacher');

  // Target teacher loaded from URL params or selected
  const [targetTeacher, setTargetTeacher] = useState(null);
  const [teachersList, setTeachersList] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // 4-Session Pack State: Each session has its own day & time
  const [activeSessionIndex, setActiveSessionIndex] = useState(0); // 0 (Séance 1), 1 (Séance 2), 2 (Séance 3), 3 (Séance 4)
  const [packSessions, setPackSessions] = useState([
    { id: 1, day: '', time: '' },
    { id: 2, day: '', time: '' },
    { id: 3, day: '', time: '' },
    { id: 4, day: '', time: '' },
  ]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('fawran');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isPackSelected, setIsPackSelected] = useState(true);

  // Modals state
  const [editingSectionModal, setEditingSectionModal] = useState(null); // { key, title }
  const [scheduleModal, setScheduleModal] = useState(null); // 'days' | 'times'
  const [schedDays, setSchedDays] = useState([]);
  const [schedTimes, setSchedTimes] = useState([]);
  const [schedSaving, setSchedSaving] = useState(false);

  const isMaitresse = (() => {
    if (!user) return false;
    const r = user.role || user.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('maitresse');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('maitresse'));
    return false;
  })();

  const isAdmin = (() => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const r = user.role || user.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('admin');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('admin'));
    return false;
  })();

  // Fallbacks
  const defaultFallbackDays = lang === 'ar' ? ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const defaultFallbackTimes = ['10:00', '14:00', '16:30'];

  // Load teacher from URL query params or API
  useEffect(() => {
    const fetchTargetTeacherAndList = async () => {
      let foundTeacher = null;

      try {
        const res = await fetch(`${API_BASE_URL}/api/teachers`);
        if (res.ok) {
          const data = await res.json();
          if (data.teachers && Array.isArray(data.teachers)) {
            setTeachersList(data.teachers);

            if (teacherIdParam || teacherNameParam) {
              foundTeacher = data.teachers.find(t =>
                (teacherIdParam && (String(t.id || t._id) === String(teacherIdParam))) ||
                (teacherNameParam && (
                  (t.name && t.name.toLowerCase() === teacherNameParam.toLowerCase()) ||
                  (t.parentName && t.parentName.toLowerCase() === teacherNameParam.toLowerCase()) ||
                  (t.email && t.email.toLowerCase().includes(teacherNameParam.toLowerCase()))
                ))
              );
            } else if (data.teachers.length > 0 && !isMaitresse) {
              foundTeacher = data.teachers[0];
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement maîtresses:', err);
      }

      if (!foundTeacher && teacherIdParam) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/clients/${teacherIdParam}`);
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              foundTeacher = data.user;
            }
          }
        } catch {}
      }

      if (foundTeacher) {
        setTargetTeacher(foundTeacher);
      }
      setLoadingTeachers(false);
    };

    fetchTargetTeacherAndList();
  }, [teacherIdParam, teacherNameParam, isMaitresse]);

  // Determine active schedule (from target teacher if selected, or logged in user, or fallbacks)
  const effectiveTeacher = targetTeacher || (isMaitresse ? user : null);

  const effectiveDays = effectiveTeacher?.availableDays && effectiveTeacher.availableDays.length > 0
    ? effectiveTeacher.availableDays
    : (user?.availableDays && user.availableDays.length > 0
      ? user.availableDays
      : (customSections?.calendarStep1?.availableDays || t.calendarPage?.availableDays || defaultFallbackDays));

  const availableDays = effectiveDays.map(d => typeof d === 'object' ? (d[lang] || d.fr || d.ar || d.en || '') : d).filter(Boolean);

  const effectiveTimes = effectiveTeacher?.timeSlots && effectiveTeacher.timeSlots.length > 0
    ? effectiveTeacher.timeSlots
    : (user?.timeSlots && user.timeSlots.length > 0
      ? user.timeSlots
      : (customSections?.calendarStep2?.timeSlots || t.calendarPage?.timeSlots || defaultFallbackTimes));

  const timeSlots = effectiveTimes.map(s => typeof s === 'object' ? (s[lang] || s.fr || s.ar || s.en || '') : s).filter(Boolean);

  // Current session being edited (starts completely blank)
  const currentSession = packSessions[activeSessionIndex] || {
    id: activeSessionIndex + 1,
    day: '',
    time: '',
  };

  // Change Day for Active Session
  const handleSelectDay = (dayName) => {
    setPackSessions((prev) => {
      const updated = [...prev];
      const current = { ...updated[activeSessionIndex], day: dayName };
      // Check if current time is already taken on this day by another session
      const conflict = updated.some((s, idx) => idx !== activeSessionIndex && s.day === dayName && s.time === current.time && s.time);
      if (conflict) {
        current.time = '';
      }
      updated[activeSessionIndex] = current;
      return updated;
    });
  };

  // Change Time for Active Session (Disallow if already taken by another session on the same day)
  const handleSelectTime = (timeSlot) => {
    const isTaken = isTimeSlotTaken(timeSlot);
    if (isTaken) return; // Prevent selection

    setPackSessions((prev) => {
      const updated = [...prev];
      updated[activeSessionIndex] = {
        ...updated[activeSessionIndex],
        time: timeSlot,
      };
      return updated;
    });
  };

  // Helper: check if a time slot is already taken by another session for the current active day
  const isTimeSlotTaken = (timeSlot) => {
    const activeDay = currentSession.day;
    const sessionThatTookIt = packSessions.find(
      (s, idx) => idx !== activeSessionIndex && s.day === activeDay && s.time === timeSlot
    );
    return sessionThatTookIt ? sessionThatTookIt.id : null;
  };

  // Open schedule manager modal
  const openScheduleModal = (type) => {
    if (type === 'days') {
      const list = effectiveDays.map((d, i) =>
        typeof d === 'object'
          ? { ...d, id: d.id || String(i + 1) }
          : { id: String(i + 1), fr: d, ar: d, en: d }
      );
      setSchedDays(list);
    } else {
      const list = effectiveTimes.map((s, i) =>
        typeof s === 'object'
          ? { ...s, id: s.id || String(i + 1) }
          : { id: String(i + 1), fr: s, ar: s, en: s }
      );
      setSchedTimes(list);
    }
    setScheduleModal(type);
  };

  // Save days directly to target teacher or logged-in user account in MongoDB
  const saveScheduleDays = async () => {
    setSchedSaving(true);
    const targetId = effectiveTeacher?.id || effectiveTeacher?._id || user?.id || user?._id;
    try {
      if (targetId) {
        const res = await fetch(`${API_BASE_URL}/api/teachers/${targetId}/schedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availableDays: schedDays }),
        });
        if (res.ok) {
          if (user && String(user.id || user._id) === String(targetId)) {
            updateCurrentUser?.({ availableDays: schedDays });
          }
          if (targetTeacher) {
            setTargetTeacher(prev => ({ ...prev, availableDays: schedDays }));
          }
        }
      }
      // Also update section settings for global fallback
      await updateSectionData('calendarStep1', { availableDays: schedDays });
    } catch (err) {
      console.error('Erreur sauvegarde des jours:', err);
    } finally {
      setSchedSaving(false);
      setScheduleModal(null);
    }
  };

  // Save times directly to target teacher or logged-in user account in MongoDB
  const saveScheduleTimes = async () => {
    setSchedSaving(true);
    const targetId = effectiveTeacher?.id || effectiveTeacher?._id || user?.id || user?._id;
    try {
      if (targetId) {
        const res = await fetch(`${API_BASE_URL}/api/teachers/${targetId}/schedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSlots: schedTimes }),
        });
        if (res.ok) {
          if (user && String(user.id || user._id) === String(targetId)) {
            updateCurrentUser?.({ timeSlots: schedTimes });
          }
          if (targetTeacher) {
            setTargetTeacher(prev => ({ ...prev, timeSlots: schedTimes }));
          }
        }
      }
      // Also update section settings for global fallback
      await updateSectionData('calendarStep2', { timeSlots: schedTimes });
    } catch (err) {
      console.error('Erreur sauvegarde des horaires:', err);
    } finally {
      setSchedSaving(false);
      setScheduleModal(null);
    }
  };

  // Submit and confirm 4-session pack booking to MongoDB Atlas & local state
  const handleConfirmReservation = async () => {
    // Validate that all 4 sessions have a day and a time
    const incompleteIdx = packSessions.findIndex(s => !s.day || !s.time);
    if (incompleteIdx !== -1) {
      setActiveSessionIndex(incompleteIdx);
      return;
    }

    setBookingLoading(true);

    const teacherObj = targetTeacher || (isMaitresse ? user : null) || (teachersList[0] || null);
    const teacherName = teacherObj?.name || teacherObj?.parentName || teacherObj?.email?.split('@')[0] || (lang === 'ar' ? 'معلمة' : 'Maîtresse');
    const teacherEmail = teacherObj?.email || '';
    const teacherId = teacherObj?.id || teacherObj?._id || '';
    const teacherSubject = teacherObj?.subject || teacherObj?.matiere || 'Français & Arabe';

    const currentPackId = `pack_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const sessionsPayload = packSessions.map((ps, idx) => ({
      studentName: user?.childName || user?.parentName || (user?.email ? user.email.split('@')[0] : 'Élève'),
      parentName: user?.parentName || (user?.email ? user.email.split('@')[0] : 'Parent'),
      childName: user?.childName || '',
      childAge: user?.childAge || '6 ans',
      studentEmail: user?.email || '',
      studentId: user?.id || user?._id || '',
      teacherId: String(teacherId),
      teacherName: teacherName,
      teacherEmail: teacherEmail,
      day: ps.day,
      time: ps.time,
      datetime: `${ps.day}, ${ps.time}`,
      subject: `${teacherSubject} (${lang === 'ar' ? `الحصة ${idx + 1} من 4` : `Séance ${idx + 1}/4`})`,
      paymentMethod: selectedPaymentMethod,
      packId: currentPackId,
    }));

    try {
      // 1. Try batch creation endpoint
      const res = await fetch(`${API_BASE_URL}/api/sessions/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: sessionsPayload, packId: currentPackId }),
      });

      let savedSessions = [];
      if (res.ok) {
        const data = await res.json();
        savedSessions = data?.sessions || [];
      } else {
        // Fallback: send individually
        for (const sPayload of sessionsPayload) {
          const singleRes = await fetch(`${API_BASE_URL}/api/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sPayload),
          });
          if (singleRes.ok) {
            const data = await singleRes.json();
            if (data?.session) savedSessions.push(data.session);
          }
        }
      }

      if (savedSessions.length === 0) {
        savedSessions = sessionsPayload.map((s, i) => ({
          id: String(Date.now() + i),
          ...s,
          status: 'pending',
          meetUrl: '',
          createdAt: new Date().toISOString(),
        }));
      }

      // Dispatch custom events and broadcasts
      savedSessions.forEach((savedSession) => {
        window.dispatchEvent(new CustomEvent('session_created', { detail: savedSession }));
      });

      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('app_sessions_channel');
          bc.postMessage({ type: 'NEW_SESSION_BOOKED', sessions: savedSessions, session: savedSessions[0] });
          bc.close();
        }
      } catch {}

      try {
        localStorage.setItem('admin_latest_booked_session', JSON.stringify({
          session: savedSessions[0],
          sessions: savedSessions,
          timestamp: Date.now(),
        }));
      } catch {}

      // Cache locally
      try {
        const existing = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
        localStorage.setItem('admin_sessions_cache', JSON.stringify([...savedSessions, ...existing]));
      } catch {}

      // ── Dispatch Real-time Notification for Admins & Teacher ───────────
      const studentDisplayName = user?.childName || user?.parentName || (user?.email ? user.email.split('@')[0] : 'Élève');
      createNotification({
        type: 'NEW_SESSION_REQUEST',
        targetRoles: ['admin', 'maitresse'],
        targetTeacherId: String(teacherId),
        targetTeacherEmail: teacherEmail,
        targetTeacherName: teacherName,
        targetStudentId: String(user?.id || user?._id || ''),
        targetStudentEmail: user?.email || '',
        title: {
          fr: `📩 Nouvelle réservation (Pack 4 séances)`,
          ar: `📩 طلب حجز جديد (باقة 4 حصص)`,
          en: `📩 New booking request (4-session pack)`,
        },
        desc: {
          fr: `${studentDisplayName} a réservé 4 séances avec ${teacherName} (${sessionsPayload[0]?.day} à ${sessionsPayload[0]?.time}...)`,
          ar: `قام التلميذ ${studentDisplayName} بحجز 4 حصص مع ${teacherName} (${sessionsPayload[0]?.day} الساعة ${sessionsPayload[0]?.time}...)`,
          en: `${studentDisplayName} booked 4 sessions with ${teacherName} (${sessionsPayload[0]?.day} at ${sessionsPayload[0]?.time}...)`,
        },
        icon: 'calendar_month',
        iconBg: 'bg-purple-100 text-purple-700',
        link: '/admin',
        meta: {
          studentName: studentDisplayName,
          teacherName,
          sessionsCount: sessionsPayload.length,
        },
      });

    } catch (err) {
      console.error('Erreur réservation pack 4 sessions:', err);
    } finally {
      setBookingLoading(false);
      setIsSuccessOpen(true);
    }
  };


  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 flex flex-col gap-10 relative z-10 pb-32">
      
      {/* 1. Header Section */}
      <header className="text-center space-y-3 relative p-4 rounded-3xl">
        {/* Admin Edit Button */}
        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'calendarHeader', title: lang === 'ar' ? 'عنوان صفحة الحجز' : 'En-tête de réservation' })}
            className="absolute top-0 right-0 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}

        <h1 className="text-2xl sm:text-3xl md:text-display-lg font-extrabold text-[#4221b6] tracking-tight title-calendar-responsive-441">{t.calendarPage?.title}</h1>
        <p className="text-xs sm:text-sm md:text-body-lg text-on-surface-variant max-w-xl mx-auto font-medium">
          {t.calendarPage?.subtitle}
        </p>
      </header>

      {/* Teacher Selector / Indicator Bar */}
      {loadingTeachers && !isMaitresse ? (
        <div className="bg-white p-4 rounded-3xl border-2 border-[#8c90f6]/20 shadow-sm">
          <TeacherCardsSkeleton count={3} />
        </div>
      ) : teachersList.length > 0 && !isMaitresse ? (
        <div className="bg-white p-4 rounded-3xl border-2 border-[#8c90f6]/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#4221b6]">school</span>
            <div>
              <span className="text-xs font-black text-[#1c0576] uppercase tracking-wider block">
                {lang === 'ar' ? 'اختر المعلمة المطلوبة للحصة:' : 'Choisissez votre Maîtresse :'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {lang === 'ar' ? 'سيتم إرسال طلب الحجز إلى المعلمة المختارة مباشرة' : 'Votre demande sera envoyée directement à cette enseignante.'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {teachersList.map((tItem) => {
              const isCurrent = targetTeacher && (
                String(targetTeacher._id || targetTeacher.id) === String(tItem._id || tItem.id) ||
                targetTeacher.email === tItem.email
              );
              const displayName = tItem.name || tItem.parentName || tItem.email?.split('@')[0];
              return (
                <button
                  key={tItem._id || tItem.id || tItem.email}
                  type="button"
                  onClick={() => setTargetTeacher(tItem)}
                  className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#4221b6] text-white shadow-md scale-105 border-2 border-[#8c90f6]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span className="text-base">👩‍🏫</span>
                  <span>{displayName}</span>
                  {isCurrent && <span className="material-symbols-outlined text-xs text-emerald-300">check_circle</span>}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Selected Teacher Banner */}
      {targetTeacher && (
        <div className="bg-gradient-to-r from-[#eef2ff] via-white to-[#f0fdf4] p-3.5 sm:p-4 rounded-2xl border-2 border-[#8c90f6]/40 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#4221b6] text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
              👩‍🏫
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                {lang === 'ar' ? 'المعلمة المختارة' : 'Maîtresse sélectionnée'}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-[#1c0576]">
                {targetTeacher.name || targetTeacher.parentName || targetTeacher.email?.split('@')[0]}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300">
            <span className="material-symbols-outlined text-sm">event_available</span>
            <span>{lang === 'ar' ? 'أوقات متوفرة للحجز' : 'Créneaux disponibles'}</span>
          </span>
        </div>
      )}


      {/* 2. Sleek & Professional Free Trial Offer Section */}
      <section className="bg-gradient-to-br from-[#f5f3ff] via-[#ffffff] to-[#eef9f2] rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border-2 border-[#8c90f6]/40 relative overflow-hidden transition-all duration-300">
        {/* Background Decorative Lighting Circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#8c90f6]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#78fd7d]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Bar for Section */}
        <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#4221b6] text-white font-black text-xs shadow-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">verified</span>
              {t.calendarPage?.packOffer?.badge || (lang === 'fr' ? 'OFFRE SANS ENGAGEMENT' : lang === 'ar' ? 'عرض التّجربة بدون التزام' : 'NO COMMITMENT OFFER')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#78fd7d] text-[#064e3b] font-black text-xs shadow-sm">
              <span className="material-symbols-outlined text-sm">card_giftcard</span>
              {t.calendarPage?.packOffer?.freeTag || (lang === 'fr' ? '100% Gratuite !' : lang === 'ar' ? '100% مجانية!' : '100% Free!')}
            </span>
          </div>

          {/* Admin Edit Button */}
          {isAdmin && (
            <button
              onClick={() => setEditingSectionModal({ key: 'calendarPack', title: lang === 'ar' ? 'قسم العرض التجريبي' : 'Offre Séance d\'essai' })}
              className="flex items-center gap-1.5 bg-[#4221b6] text-white px-3.5 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border border-white/40 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
            </button>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Offer Info & Features */}
          <div className="lg:col-span-7 space-y-5 text-left rtl:text-right">
            <h2 className="text-2xl sm:text-3xl md:text-4xl text-[#1c0576] font-black leading-tight tracking-tight">
              {t.calendarPage?.packOffer?.title}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
              {t.calendarPage?.packOffer?.subtitle}
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {t.calendarPage?.packOffer?.features?.map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-[#8c90f6] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base font-bold">check</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Floating Action Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#8c90f6]/50 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden group hover:border-[#4221b6] transition-all">
              {/* Gift Badge Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#EEF2FF] to-[#E0D7FF] text-[#4221b6] flex items-center justify-center text-3xl shadow-inner border border-[#8c90f6]/30 group-hover:scale-110 transition-transform">
                🎁
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {lang === 'fr' ? 'SÉANCE D\'ESSAI' : lang === 'ar' ? 'جلسة تجريبية' : 'TRIAL SESSION'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#1c0576]">
                  {lang === 'fr' ? '100% GRATUITE' : lang === 'ar' ? 'مجانية 100%' : '100% FREE'}
                </div>
                <p className="text-xs text-emerald-600 font-bold">
                  {lang === 'fr' ? 'Sans carte bancaire requise' : lang === 'ar' ? 'بدون الحاجة لبطاقة بنكية' : 'No credit card required'}
                </p>
              </div>

              {/* Interactive CTA Toggle Button */}
              <button
                type="button"
                onClick={() => setIsPackSelected(!isPackSelected)}
                className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                  isPackSelected
                    ? 'bg-[#059669] text-white hover:bg-[#047857] shadow-emerald-200'
                    : 'bg-[#4221b6] text-white hover:bg-[#341a99] shadow-indigo-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isPackSelected ? 'check_circle' : 'bolt'}
                </span>
                <span>
                  {isPackSelected
                    ? (t.calendarPage?.packOffer?.activeTag || (lang === 'fr' ? 'Séance d\'essai sélectionnée ✓' : lang === 'ar' ? 'تم اختيار الجلسة ✓' : 'Trial Selected ✓'))
                    : (t.calendarPage?.packOffer?.selectBtn || (lang === 'fr' ? 'Réserver ma séance gratuite' : lang === 'ar' ? 'احجز جلستك المجانية' : 'Book My Free Trial'))
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4-SESSIONS PACK SELECTOR BAR */}
      <section className="bg-gradient-to-br from-[#ffffff] to-[#f5f3ff] rounded-3xl p-5 sm:p-7 border-2 border-[#8c90f6]/50 shadow-lg space-y-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4221b6] text-white flex items-center justify-center font-black text-base shadow-md">
              4x
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1c0576]">
                {lang === 'ar' ? 'حدد مواعيد باقة الـ 4 حصص :' : 'Planifiez vos 4 séances du pack :'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? 'انقر على كل حصة لاختيار يوم وساعة مختلفة لكل منها'
                  : 'Cliquez sur chaque séance pour lui attribuer un jour et une heure uniques.'}
              </p>
            </div>
          </div>

          {/* Completion Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {lang === 'ar' ? 'التقدم :' : 'Progression :'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#e0d7ff] text-[#4221b6] border border-[#8c90f6]/40">
              {packSessions.filter(s => s.day && s.time).length} / 4 {lang === 'ar' ? 'حصص' : 'séances'}
            </span>
          </div>
        </div>

        {/* 4 Session Buttons (Cards) Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {packSessions.map((sess, idx) => {
            const isActive = activeSessionIndex === idx;
            const isConfigured = sess.day && sess.time;

            return (
              <button
                key={sess.id}
                type="button"
                onClick={() => setActiveSessionIndex(idx)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 text-left rtl:text-right relative ${
                  isActive
                    ? 'border-[#4221b6] bg-[#4221b6] text-white shadow-xl scale-[1.03] ring-4 ring-[#8c90f6]/30'
                    : isConfigured
                      ? 'border-emerald-300 bg-emerald-50/70 hover:border-emerald-500 text-slate-800'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                {/* Top: Session Number + Status Icon */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isConfigured
                        ? 'bg-emerald-200 text-emerald-900 font-bold'
                        : 'bg-slate-100 text-slate-600 font-bold'
                  }`}>
                    {lang === 'ar' ? `الحصة ${sess.id}` : `Séance ${sess.id}`}
                  </span>

                  {isConfigured ? (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                      isActive ? 'bg-white text-[#4221b6]' : 'bg-emerald-500 text-white'
                    }`}>
                      ✓
                    </span>
                  ) : (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-400 border border-slate-300'
                    }`}>
                      +
                    </span>
                  )}
                </div>

                {/* Bottom: Selected Day & Time Details */}
                <div className="space-y-0.5 min-h-[36px] flex flex-col justify-center">
                  {isConfigured ? (
                    <>
                      <span className={`text-xs font-black flex items-center gap-1 truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        <span>📅 {sess.day}</span>
                      </span>
                      <span className={`text-[11px] font-bold flex items-center gap-1 ${isActive ? 'text-emerald-200' : 'text-[#4221b6]'}`}>
                        <span>⏰ {sess.time}</span>
                      </span>
                    </>
                  ) : (
                    <span className={`text-[11px] font-bold italic ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                      {lang === 'ar' ? '👉 اضغط لتحديد الموعد' : '👉 Choisir l\'horaire'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Step 1: Select Day for Current Active Session */}
      <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#D1E1EC] relative">
        {/* Buttons top-right area */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
          {/* Maîtresse: Manage Days Button */}
          {isMaitresse && (
            <button
              onClick={() => openScheduleModal('days')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span>{lang === 'ar' ? 'إدارة الأيام' : 'Gérer les jours'}</span>
            </button>
          )}
          {/* Admin: Modifier Button */}
          {isAdmin && (
            <button
              onClick={() => setEditingSectionModal({ key: 'calendarStep1', title: lang === 'ar' ? 'عنوان الخطوة الأولى' : 'Étape 1 : Choisir un jour' })}
              className="flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
            </button>
          )}
        </div>

        <div className="absolute -top-4 -left-4 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline-md text-headline-md border-2 border-surface font-bold">
          1
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            <h2 className="text-headline-md font-headline-md text-on-surface">
              {lang === 'ar'
                ? `الخطوة 1 : اختر يوم الحصة رقم ${activeSessionIndex + 1}`
                : `Étape 1 : Choisir le jour pour la Séance ${activeSessionIndex + 1}`}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {lang === 'ar'
              ? `أنت الآن تضبط موعد [الحصة ${activeSessionIndex + 1} من 4]`
              : `Vous configurez actuellement la [Séance ${activeSessionIndex + 1} sur 4]`}
          </p>
        </div>

        {/* Available Day Buttons Side-by-Side */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {availableDays.map((dayName, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectDay(dayName)}
              className={`flex-1 min-w-[120px] sm:min-w-[140px] h-[56px] px-4 rounded-2xl border-2 font-headline-md text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all ${
                currentSession.day === dayName
                  ? 'bg-[#4221b6] text-white border-[#4221b6] font-extrabold shadow-lg scale-105'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-[#4221b6] hover:text-[#4221b6] font-bold shadow-sm'
              }`}
            >
              <span className="material-symbols-outlined text-lg">event</span>
              <span>{dayName}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Step 2: Select Time (With Duplicate Conflict Prevention) */}
      <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#D5E5D6] relative">
        {/* Buttons top-right area */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
          {/* Maîtresse: Manage Times Button */}
          {isMaitresse && (
            <button
              onClick={() => openScheduleModal('times')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
            >
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{lang === 'ar' ? 'إدارة الساعات' : 'Gérer les heures'}</span>
            </button>
          )}
          {/* Admin: Modifier Button */}
          {isAdmin && (
            <button
              onClick={() => setEditingSectionModal({ key: 'calendarStep2', title: lang === 'ar' ? 'عنوان الخطوة الثانية' : 'Étape 2 : Choisir l\'heure' })}
              className="flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
            </button>
          )}
        </div>

        <div className="absolute -top-4 -left-4 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline-md text-headline-md border-2 border-surface font-bold">
          2
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">schedule</span>
            <h2 className="text-headline-md font-headline-md text-on-surface">
              {lang === 'ar'
                ? `الخطوة 2 : اختر توقيت الحصة رقم ${activeSessionIndex + 1} (${currentSession.day || ''})`
                : `Étape 2 : Choisir l'heure de la Séance ${activeSessionIndex + 1} (${currentSession.day || ''})`}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {lang === 'ar'
              ? 'ملاحظة: الأوقات المحجوزة لحصة أخرى من باقتك تظهر مقفولة لمنع التكرار'
              : 'Remarque : Les créneaux déjà choisis pour une autre séance du pack sont verrouillés.'}
          </p>
        </div>

        {/* Available Time Slot Buttons Side-by-Side */}
        {!currentSession.day ? (
          <div className="p-6 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-200 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-2xl text-amber-600">touch_app</span>
            <span className="text-xs font-bold text-amber-800">
              {lang === 'ar'
                ? `يرجى اختيار يوم الحصة رقم ${activeSessionIndex + 1} في الخطوة 1 أولاً 👆`
                : `Veuillez d'abord choisir un jour pour la Séance ${activeSessionIndex + 1} à l'étape 1 ci-dessus 👆`}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {timeSlots.map((slot, idx) => {
              const isSelected = currentSession.time === slot;
              const takenBySessionId = isTimeSlotTaken(slot);

              if (takenBySessionId) {
                return (
                  <div
                    key={idx}
                    title={lang === 'ar' ? `محجوز للحصة ${takenBySessionId}` : `Déjà réservé pour la Séance ${takenBySessionId}`}
                    className="flex-1 min-w-[120px] sm:min-w-[140px] h-[56px] px-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60 line-through"
                  >
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>{slot}</span>
                    <span className="text-[10px] no-underline font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded ml-1">
                      {lang === 'ar' ? `حصة ${takenBySessionId}` : `S${takenBySessionId}`}
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTime(slot)}
                  className={`flex-1 min-w-[110px] sm:min-w-[130px] h-[56px] px-4 rounded-2xl border-2 font-headline-md text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#4221b6] text-white border-[#4221b6] font-extrabold shadow-lg scale-105'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-[#4221b6] hover:text-[#4221b6] font-bold shadow-sm'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  <span>{slot}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Nav to next session (Locked until day and time are selected) */}
        {activeSessionIndex < 3 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
            {(!currentSession.day || !currentSession.time) && (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-amber-600">lock</span>
                <span>
                  {lang === 'ar'
                    ? `يرجى تحديد اليوم والساعة للحصة ${activeSessionIndex + 1} أولاً`
                    : `Veuillez choisir le jour et l'heure de la séance ${activeSessionIndex + 1}`}
                </span>
              </span>
            )}

            <button
              type="button"
              disabled={!currentSession.day || !currentSession.time}
              onClick={() => {
                if (currentSession.day && currentSession.time) {
                  setActiveSessionIndex(activeSessionIndex + 1);
                }
              }}
              className={`px-6 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-2 ${
                currentSession.day && currentSession.time
                  ? 'bg-[#4221b6] text-white hover:scale-105 cursor-pointer shadow-md hover:bg-[#351996]'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60 shadow-none'
              }`}
            >
              <span>
                {lang === 'ar'
                  ? `الانتقال للحصة ${activeSessionIndex + 2}`
                  : `Passer à la Séance ${activeSessionIndex + 2}`}
              </span>
              <span className="material-symbols-outlined text-sm">
                {currentSession.day && currentSession.time ? 'arrow_forward' : 'lock'}
              </span>
            </button>
          </div>
        )}
      </section>

      {/* 6. Step 3: Payment Methods Section */}
      <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#C5CAE9] relative">
        {/* Admin Edit Button */}
        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'calendarStep3', title: lang === 'ar' ? 'عنوان وتأكيد الدفع' : 'Étape 3 : Paiement' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
          </button>
        )}

        <div className="absolute -top-4 -left-4 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline-md text-headline-md border-2 border-surface font-bold">
          3
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pr-24 rtl:pr-0 rtl:pl-24">
          <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4221b6]">credit_card</span>
            {t.calendarPage?.step3Title}
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-label-bold text-xs font-bold w-fit">
            <span className="material-symbols-outlined text-sm">lock</span>
            {lang === 'fr' ? 'Paiement Sécurisé 256-bit SSL' : lang === 'ar' ? 'دفع آمن ومشفر 256-bit SSL' : '256-bit SSL Secure Payment'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
          {t.calendarPage?.paymentMethods?.map((method) => {
            const isSelected = selectedPaymentMethod === method.id;
            return (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${isSelected
                  ? 'border-[#4221b6] bg-white shadow-md scale-[1.01]'
                  : 'border-surface-variant bg-surface/50 hover:bg-white hover:border-[#8c90f6]/50'
                  }`}
              >
                {method.badge && (
                  <span className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isSelected ? 'bg-[#4221b6] text-white' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                    {method.badge}
                  </span>
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#EEF2FF] text-[#4221b6]' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                    <span className="material-symbols-outlined text-2xl">{method.icon}</span>
                  </div>

                  <div className="space-y-1 pr-6 rtl:pr-0 rtl:pl-6">
                    <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                      {method.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {method.desc}
                    </p>
                  </div>
                </div>

                {method.id === 'fawran' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-variant/50">
                    <span className="text-[11px] font-bold text-tertiary">{lang === 'fr' ? 'Service:' : lang === 'ar' ? 'الخدمة:' : 'Service:'}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black">Fawran (فوراً)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">{lang === 'fr' ? 'Virement Instantané' : lang === 'ar' ? 'تحويل فوري' : 'Instant Wire Transfer'}</span>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#4221b6] bg-[#4221b6]' : 'border-outline-variant'
                    }`}>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-5 border-t border-surface-variant/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[#059669] text-base">verified_user</span>
            <span>{lang === 'fr' ? 'Garantie 100% Satisfait' : lang === 'ar' ? 'ضمان 100% رضا العملاء' : '100% Satisfaction Guaranteed'}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[#4221b6] text-base">bolt</span>
            <span>{lang === 'fr' ? 'Confirmation immédiate' : lang === 'ar' ? 'تأكيد فوري بعد الدفع' : 'Instant Confirmation'}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[#d946ef] text-base">headset_mic</span>
            <span>{lang === 'fr' ? 'Support client 7j/7' : lang === 'ar' ? 'دعم فني متاح 7 أيام' : '24/7 Support'}</span>
          </div>
        </div>
      </section>

      {/* Confirmation CTA Section (Locked until all 4 sessions are scheduled) */}
      <section className="flex flex-col items-center justify-center mt-4">
        {packSessions.every(s => s.day && s.time) ? (
          <button
            onClick={handleConfirmReservation}
            disabled={bookingLoading}
            className="bg-primary-container text-on-primary font-black text-headline-md px-12 py-4 h-[72px] w-full md:w-auto rounded-full chunky-shadow-primary transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-105 shadow-xl animate-pulse"
          >
            {bookingLoading ? (
              <>
                <span>{lang === 'ar' ? 'جاري تأكيد الباقة (4 حصص)...' : 'Confirmation du pack (4 séances)...'}</span>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              </>
            ) : (
              <>
                <span>{lang === 'ar' ? 'تأكيد حجز الباقة (4 حصص) ✓' : 'Confirmer la réservation du pack (4 séances) ✓'}</span>
                <span className="material-symbols-outlined text-2xl text-emerald-300">check_circle</span>
              </>
            )}
          </button>
        ) : (
          <button
            disabled
            className="bg-slate-100 border-2 border-slate-300 text-slate-400 font-extrabold text-sm sm:text-base px-8 sm:px-12 py-4 h-[68px] w-full md:w-auto rounded-full flex items-center justify-center gap-3 cursor-not-allowed shadow-none"
          >
            <span className="material-symbols-outlined text-xl text-slate-400">lock</span>
            <span>
              {lang === 'ar'
                ? `يرجى تحديد مواعيد الحصص الأربع أولاً (${packSessions.filter(s => s.day && s.time).length} / 4)`
                : `Veuillez planifier les 4 séances pour confirmer (${packSessions.filter(s => s.day && s.time).length} / 4)`}
            </span>
          </button>
        )}
        <p className="mt-4 text-on-surface-variant text-body-md font-body-md text-center">
          {packSessions.every(s => s.day && s.time)
            ? (lang === 'ar'
                ? '✅ اكتمل تحديد مواعيد الـ 4 حصص! يمكنك الآن النقر على زر التأكيد أعلاه.'
                : '✅ Les 4 séances sont prêtes ! Vous pouvez confirmer votre réservation.')
            : (lang === 'ar'
                ? '🔒 الزر مقفل حتى تنتهي من اختيار اليوم والساعة لكل حصة من الحصص الأربع.'
                : '🔒 Le bouton est verrouillé jusqu\'à ce que vous ayez choisi l\'horaire pour chacune des 4 séances.')}
        </p>
      </section>

      {/* Success Booking Modal Overlay */}
      {isSuccessOpen && (
        <div className="fixed inset-0 bg-surface/95 z-50 flex flex-col items-center justify-center p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="text-center space-y-6 max-w-lg bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#4221b6] shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl shadow-inner animate-bounce">
              ✓
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-[#1c0576]">
              {lang === 'ar' ? 'تم تأكيد حجز الباقة (4 حصص) بنجاح ! 🎉' : 'Réservation du Pack (4 séances) réussie ! 🎉'}
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {lang === 'ar'
                ? `تم تسجيل كافة مواعيد الحصص الأربع بنجاح مع المعلمة ${targetTeacher?.name || targetTeacher?.parentName || 'المعلمة'}:`
                : `Vos 4 séances ont été enregistrées avec succès auprès de ${targetTeacher?.name || targetTeacher?.parentName || 'votre maîtresse'} :`}
            </p>

            {/* 4 Sessions List Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left rtl:text-right pt-1">
              {packSessions.map((s, i) => (
                <div key={i} className="p-3 bg-[#faf9f5] border border-slate-200 rounded-xl flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#4221b6] text-white flex items-center justify-center text-xs font-black shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">{s.day}</span>
                    <span className="text-[11px] font-bold text-[#4221b6]">{s.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setIsSuccessOpen(false); navigate('/dashboard'); }}
              className="mt-4 w-full bg-[#4221b6] text-white font-black text-sm py-4 rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{lang === 'ar' ? 'الانتقال إلى لوحة الطالب (Dashboard)' : 'Accéder à mon espace Dashboard'}</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Section Edit Modal */}
      {editingSectionModal && (
        <EditSectionModal
          sectionKey={editingSectionModal.key}
          sectionTitle={editingSectionModal.title}
          onClose={() => setEditingSectionModal(null)}
        />
      )}

      {/* ====== Maîtresse: Manage Days Modal ====== */}
      {scheduleModal === 'days' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">calendar_month</span>
                {lang === 'ar' ? 'إدارة أيام الحجز' : 'Gérer les jours disponibles'}
              </h3>
              <button onClick={() => setScheduleModal(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100 transition cursor-pointer">
                <span className="material-symbols-outlined text-slate-600 text-sm">close</span>
              </button>
            </div>

            {/* Days List */}
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {schedDays.map((d, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                  <span className="material-symbols-outlined text-sm text-emerald-600">event</span>
                  <input
                    type="text"
                    value={d[lang] || d.fr || d.ar || d.en || ''}
                    onChange={e => {
                      const val = e.target.value;
                      const updated = [...schedDays];
                      updated[i] = {
                        ...updated[i],
                        fr: (!updated[i].fr || updated[i].fr === updated[i].ar) ? val : (lang === 'fr' ? val : updated[i].fr),
                        ar: (!updated[i].ar || updated[i].fr === updated[i].ar) ? val : (lang === 'ar' ? val : updated[i].ar),
                        en: (!updated[i].en || updated[i].fr === updated[i].en) ? val : (lang === 'en' ? val : updated[i].en),
                        [lang]: val,
                      };
                      setSchedDays(updated);
                    }}
                    className="flex-1 text-sm font-bold text-slate-700 bg-transparent outline-none border-none"
                    placeholder={lang === 'ar' ? 'اسم اليوم...' : 'Nom du jour...'}
                  />
                  <button
                    onClick={() => setSchedDays(schedDays.filter((_, j) => j !== i))}
                    className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-red-500 text-xs">delete</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Add Day */}
            <button
              onClick={() => setSchedDays([...schedDays, { id: String(Date.now()), fr: '', ar: '', en: '' }])}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-400 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {lang === 'ar' ? 'إضافة يوم جديد' : 'Ajouter un jour'}
            </button>

            {/* Save / Cancel */}
            <div className="flex gap-3">
              <button onClick={() => setScheduleModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition cursor-pointer">
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={saveScheduleDays}
                disabled={schedSaving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {schedSaving ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
                {lang === 'ar' ? 'حفظ' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Maîtresse: Manage Times Modal ====== */}
      {scheduleModal === 'times' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">schedule</span>
                {lang === 'ar' ? 'إدارة أوقات الحجز' : 'Gérer les horaires disponibles'}
              </h3>
              <button onClick={() => setScheduleModal(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100 transition cursor-pointer">
                <span className="material-symbols-outlined text-slate-600 text-sm">close</span>
              </button>
            </div>

            {/* Times List */}
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {schedTimes.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                  <span className="material-symbols-outlined text-sm text-emerald-600">schedule</span>
                  <input
                    type="time"
                    value={s.fr || s.ar || s.en || ''}
                    onChange={e => {
                      const val = e.target.value;
                      const updated = [...schedTimes];
                      updated[i] = { ...updated[i], fr: val, ar: val, en: val };
                      setSchedTimes(updated);
                    }}
                    className="flex-1 text-sm font-bold text-slate-700 bg-transparent outline-none border-none"
                  />
                  <button
                    onClick={() => setSchedTimes(schedTimes.filter((_, j) => j !== i))}
                    className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-red-500 text-xs">delete</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Add Time */}
            <button
              onClick={() => setSchedTimes([...schedTimes, { id: String(Date.now()), fr: '09:00', ar: '09:00', en: '09:00' }])}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-400 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {lang === 'ar' ? 'إضافة وقت جديد' : 'Ajouter un horaire'}
            </button>

            {/* Save / Cancel */}
            <div className="flex gap-3">
              <button onClick={() => setScheduleModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition cursor-pointer">
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={saveScheduleTimes}
                disabled={schedSaving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {schedSaving ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
                {lang === 'ar' ? 'حفظ' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
