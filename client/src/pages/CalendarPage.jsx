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

  // Only use teacher-defined slots - no fallback defaults shown to students
  const effectiveTimes = effectiveTeacher?.timeSlots
    ? effectiveTeacher.timeSlots
    : (user?.timeSlots || []);

  const timeSlots = effectiveTimes.map(s => typeof s === 'object' ? (s[lang] || s.fr || s.ar || s.en || '') : s).filter(Boolean);

  // Day-specific custom slots for the teacher
  const teacherCustomDaySlots = effectiveTeacher?.customDaySlots || {};

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

  // Modal & Date Picker state for session scheduling
  const [modalSessionIndex, setModalSessionIndex] = useState(null); // null or session index 0,1,2,3
  const [modalStep, setModalStep] = useState('date'); // 'date' | 'time'
  const [tempSelectedDate, setTempSelectedDate] = useState(''); // 'YYYY-MM-DD'
  const [currentCalMonth, setCurrentCalMonth] = useState(new Date());

  // Blocked dates from target teacher / user
  const teacherBlockedDates = effectiveTeacher?.blockedDates || user?.blockedDates || [];
  const teacherBlockedSlots = effectiveTeacher?.blockedSlots || [];

  // Helper to format date string YYYY-MM-DD
  const formatDateStr = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper to get formatted display name of day and date
  const getFormattedDayLabel = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'جوان', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const dayNamesFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const monthNamesFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    if (lang === 'ar') {
      return `${dayNamesAr[dateObj.getDay()]} ${d} ${monthNamesAr[dateObj.getMonth()]} ${y}`;
    }
    return `${dayNamesFr[dateObj.getDay()]} ${d} ${monthNamesFr[dateObj.getMonth()]} ${y}`;
  };

  // Open scheduling modal for specific session index
  const openSessionModal = (index) => {
    setActiveSessionIndex(index);
    setModalSessionIndex(index);
    setModalStep('date');
    setTempSelectedDate(packSessions[index]?.day || '');
  };

  // Select Date from Calendar Grid inside Modal
  const handleSelectModalDate = (dateStr) => {
    if (teacherBlockedDates.includes(dateStr)) return; // Locked date, cannot pick
    setTempSelectedDate(dateStr);
    setModalStep('time');
  };

  // Select Time inside Modal and finalize for this session
  const handleSelectModalTime = (timeSlot) => {
    if (!modalSessionIndex && modalSessionIndex !== 0) return;
    
    // Check if slot taken on same date by another session in current pack
    const isTakenByOther = packSessions.some(
      (s, idx) => idx !== modalSessionIndex && s.day === tempSelectedDate && s.time === timeSlot
    );
    if (isTakenByOther) return;

    setPackSessions(prev => {
      const updated = [...prev];
      updated[modalSessionIndex] = {
        ...updated[modalSessionIndex],
        day: tempSelectedDate,
        time: timeSlot,
      };
      return updated;
    });

    // Close modal
    setModalSessionIndex(null);
  };

  // Helper: check if a time slot is already taken on tempSelectedDate by another session
  const isSlotTakenInModal = (timeSlot) => {
    return packSessions.find(
      (s, idx) => idx !== modalSessionIndex && s.day === tempSelectedDate && s.time === timeSlot
    );
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
      openSessionModal(incompleteIdx);
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
      datetime: `${getFormattedDayLabel(ps.day) || ps.day}, ${ps.time}`,
      subject: `${teacherSubject} (${lang === 'ar' ? `الحصة ${idx + 1} من 4` : `Séance ${idx + 1}/4`})`,
      paymentMethod: selectedPaymentMethod,
      packId: currentPackId,
    }));

    try {
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

      try {
        const existing = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
        localStorage.setItem('admin_sessions_cache', JSON.stringify([...savedSessions, ...existing]));
      } catch {}

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

      {/* 2. Free Trial Offer Section */}
      <section className="bg-gradient-to-br from-[#f5f3ff] via-[#ffffff] to-[#eef9f2] rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border-2 border-[#8c90f6]/40 relative overflow-hidden transition-all duration-300">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#8c90f6]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#78fd7d]/20 rounded-full blur-3xl pointer-events-none"></div>

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5 text-left rtl:text-right">
            <h2 className="text-2xl sm:text-3xl md:text-4xl text-[#1c0576] font-black leading-tight tracking-tight">
              {t.calendarPage?.packOffer?.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
              {t.calendarPage?.packOffer?.subtitle}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {t.calendarPage?.packOffer?.features?.map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-[#8c90f6] transition-colors">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base font-bold">check</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#8c90f6]/50 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden group hover:border-[#4221b6] transition-all">
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

      {/* 3. NEW 4-SESSIONS PACK INTERACTIVE CARDS */}
      <section className="bg-gradient-to-br from-[#ffffff] to-[#f5f3ff] rounded-3xl p-6 sm:p-8 border-2 border-[#8c90f6]/50 shadow-xl space-y-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#4221b6] text-white flex items-center justify-center font-black text-xl shadow-lg">
              4x
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1c0576]">
                {lang === 'ar' ? 'حصص الباقة الـ 4 :' : 'Planifiez vos 4 séances du pack :'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? 'انقر على أي حصة لفتح تقويم المواعيد واختيار اليوم والساعة المناسبة'
                  : 'Cliquez sur n\'importe quelle séance pour ouvrir le calendrier et choisir la date et l\'heure.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {lang === 'ar' ? 'الحصص المكتملة :' : 'Progression :'}
            </span>
            <span className="px-4 py-1.5 rounded-full text-xs font-black bg-[#e0d7ff] text-[#4221b6] border border-[#8c90f6]/40 shadow-sm">
              {packSessions.filter(s => s.day && s.time).length} / 4 {lang === 'ar' ? 'حصص' : 'séances'}
            </span>
          </div>
        </div>

        {/* 4 Cards Grid - Clicking opens Modal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packSessions.map((sess, idx) => {
            const isConfigured = sess.day && sess.time;

            return (
              <div
                key={sess.id}
                onClick={() => openSessionModal(idx)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 text-left rtl:text-right relative group hover:scale-[1.03] shadow-sm ${
                  isConfigured
                    ? 'border-emerald-400 bg-gradient-to-b from-emerald-50/80 to-white text-slate-800 shadow-md hover:border-emerald-600'
                    : 'border-[#8c90f6]/40 bg-white hover:border-[#4221b6] text-slate-700 hover:shadow-xl'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                    isConfigured ? 'bg-emerald-200 text-emerald-900' : 'bg-[#e0d7ff] text-[#4221b6]'
                  }`}>
                    {lang === 'ar' ? `الحصة ${sess.id}` : `Séance ${sess.id}`}
                  </span>

                  {isConfigured ? (
                    <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black shadow-sm">
                      ✓
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-[#e0d7ff] text-[#4221b6] group-hover:bg-[#4221b6] group-hover:text-white flex items-center justify-center text-sm font-black transition-colors">
                      +
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 min-h-[50px] flex flex-col justify-center">
                  {isConfigured ? (
                    <>
                      <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-emerald-600 text-base">calendar_month</span>
                        <span>{getFormattedDayLabel(sess.day) || sess.day}</span>
                      </span>
                      <span className="text-xs font-extrabold text-[#4221b6] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        <span>{sess.time}</span>
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-500 group-hover:text-[#4221b6] transition-colors">
                        {lang === 'ar' ? '👉 اضغط لاختيار موعد الحصة' : '👉 Cliquez pour choisir la date'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {lang === 'ar' ? 'تقويم تفاعلي' : 'Calendrier interactif'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>{isConfigured ? (lang === 'ar' ? 'تعديل الموعد' : 'Modifier') : (lang === 'ar' ? 'حدد الآن' : 'Planifier')}</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    {isRtl ? 'arrow_back' : 'arrow_forward'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Payment Method Section */}
      <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#C5CAE9] relative">
        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'calendarStep3', title: lang === 'ar' ? 'عنوان وتأكيد الدفع' : 'Étape 3 : Paiement' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4221b6]">credit_card</span>
            {t.calendarPage?.step3Title || (lang === 'ar' ? 'طريقة الدفع' : 'Mode de paiement')}
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
      </section>

      {/* 5. CONFIRMATION BUTTON - SHOWN WHEN ALL 4 SESSIONS ARE SCHEDULED */}
      <section className="flex flex-col items-center justify-center mt-4">
        {packSessions.every(s => s.day && s.time) ? (
          <button
            onClick={handleConfirmReservation}
            disabled={bookingLoading}
            className="bg-[#4221b6] hover:bg-[#351996] text-white font-black text-headline-md px-12 py-4 h-[72px] w-full md:w-auto rounded-full transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl hover:scale-105 border-2 border-emerald-400 animate-bounce"
          >
            {bookingLoading ? (
              <>
                <span>{lang === 'ar' ? 'جاري إرسال الطلب للمعلمة...' : 'Envoi de la demande...'}</span>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              </>
            ) : (
              <>
                <span>{lang === 'ar' ? 'تأكيد حجز الباقة وإرسال الطلب للأستاذ ✓' : 'Confirmer et envoyer la demande ✓'}</span>
                <span className="material-symbols-outlined text-2xl text-emerald-300">send</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            <button
              disabled
              className="bg-slate-100 border-2 border-slate-300 text-slate-400 font-extrabold text-sm sm:text-base px-8 py-4 h-[64px] w-full rounded-full flex items-center justify-center gap-3 cursor-not-allowed shadow-none"
            >
              <span className="material-symbols-outlined text-xl text-slate-400">lock</span>
              <span>
                {lang === 'ar'
                  ? `يرجى تحديد تواريخ الحصص الأربع أولاً (${packSessions.filter(s => s.day && s.time).length} / 4)`
                  : `Veuillez planifier les 4 séances (${packSessions.filter(s => s.day && s.time).length} / 4)`}
              </span>
            </button>
            <p className="text-xs text-slate-500 font-medium text-center">
              {lang === 'ar'
                ? '🔒 ينفتح زر التأكيد وتأكيد الحجز فور الانتهاء من اختيار يوم وساعة لكل حصة.'
                : '🔒 Le bouton de confirmation s\'activera après la sélection des 4 dates.'}
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. POPUP MODAL: CALENDAR & TIME SELECTOR FOR SINGLE SESSION */}
      {/* ========================================================================= */}
      {modalSessionIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 sm:p-8 flex flex-col gap-6 relative border-2 border-[#8c90f6]/50 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#4221b6] text-white flex items-center justify-center font-black text-lg shadow-md">
                  {modalSessionIndex + 1}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1c0576]">
                    {lang === 'ar' ? `تحديد موعد الحصة رقم ${modalSessionIndex + 1}` : `Planifier la Séance ${modalSessionIndex + 1}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {modalStep === 'date'
                      ? (lang === 'ar' ? 'الخطوة 1: اختر يوماً من تقويم الشهر' : 'Étape 1 : Choisissez une date du calendrier')
                      : (lang === 'ar' ? `الخطوة 2: اختر الساعة ليوم (${getFormattedDayLabel(tempSelectedDate)})` : `Étape 2 : Choisissez l'heure (${tempSelectedDate})`)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalSessionIndex(null)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100 text-slate-600 hover:text-red-600 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* STEP 1: MONTH CALENDAR GRID */}
            {modalStep === 'date' && (
              <div className="space-y-5">
                {/* Month Navigation */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = new Date(currentCalMonth);
                      prev.setMonth(prev.getMonth() - 1);
                      setCurrentCalMonth(prev);
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-base">{isRtl ? 'chevron_right' : 'chevron_left'}</span>
                  </button>

                  <h4 className="text-base font-black text-[#1c0576]">
                    {currentCalMonth.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'long', year: 'numeric' })}
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(currentCalMonth);
                      next.setMonth(next.getMonth() + 1);
                      setCurrentCalMonth(next);
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 shadow-sm transition cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-base">{isRtl ? 'chevron_left' : 'chevron_right'}</span>
                  </button>
                </div>

                {/* Calendar Days Header */}
                <div className="grid grid-cols-7 text-center gap-1">
                  {(lang === 'ar' ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']).map((d, idx) => (
                    <span key={idx} className="text-xs font-black text-slate-400 py-1 uppercase tracking-wider">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar Days Cells */}
                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const year = currentCalMonth.getFullYear();
                    const month = currentCalMonth.getMonth();
                    const firstDayOfMonth = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const cells = [];

                    // Empty slots before month start
                    for (let i = 0; i < firstDayOfMonth; i++) {
                      cells.push(<div key={`empty-${i}`} className="h-11 rounded-xl bg-transparent"></div>);
                    }

                    // Month Days
                    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
                      const dateObj = new Date(year, month, dayNum);
                      const dateStr = formatDateStr(dateObj);
                      const isBlocked = teacherBlockedDates.includes(dateStr);
                      const isSelected = tempSelectedDate === dateStr;
                      const isToday = formatDateStr(new Date()) === dateStr;

                      cells.push(
                        <button
                          key={dateStr}
                          type="button"
                          disabled={isBlocked}
                          onClick={() => handleSelectModalDate(dateStr)}
                          className={`h-12 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center transition-all relative cursor-pointer ${
                            isBlocked
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 line-through'
                              : isSelected
                                ? 'bg-[#4221b6] text-white shadow-lg scale-105 ring-4 ring-[#8c90f6]/30'
                                : isToday
                                  ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-400 font-extrabold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-[#4221b6]'
                          }`}
                        >
                          <span>{dayNum}</span>
                          {isBlocked && (
                            <span className="material-symbols-outlined text-[10px] text-red-500 absolute top-1 right-1">lock</span>
                          )}
                        </button>
                      );
                    }

                    return cells;
                  })()}
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300 inline-block"></span>
                    <span>{lang === 'ar' ? 'أيام مقفولة من الأستاذ 🔒' : 'Jours bloqués 🔒'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#4221b6] inline-block"></span>
                    <span>{lang === 'ar' ? 'اليوم المحدد' : 'Sélectionné'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: TIME SELECTOR GRID */}
            {modalStep === 'time' && (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                    <span className="material-symbols-outlined text-emerald-600">event_available</span>
                    <span>{lang === 'ar' ? 'اليوم المختار :' : 'Date choisie :'} {getFormattedDayLabel(tempSelectedDate)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalStep('date')}
                    className="text-xs text-[#4221b6] font-black underline cursor-pointer"
                  >
                    {lang === 'ar' ? 'تغيير اليوم' : 'Changer de date'}
                  </button>
                </div>

                <h4 className="text-sm font-black text-slate-800">
                  {lang === 'ar' ? 'اختر الساعة المناسبة:' : 'Choisissez l\'horaire :'}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(() => {
                    // Combine global shared slots + day-specific slots for this exact date
                    const daySpecificSlots = teacherCustomDaySlots[tempSelectedDate] || [];
                    const combinedSlots = Array.from(new Set([...timeSlots, ...daySpecificSlots]));

                    if (combinedSlots.length === 0) {
                      return (
                        <div className="col-span-3 py-8 text-center">
                          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-2xl text-slate-400">schedule_off</span>
                          </div>
                          <p className="text-sm font-bold text-slate-500">
                            {lang === 'ar' ? 'لا يوجد توقيت متاح لهذا اليوم' : 'Aucun horaire disponible pour ce jour'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {lang === 'ar' ? 'يرجى اختيار يوم آخر' : 'Veuillez choisir une autre date'}
                          </p>
                        </div>
                      );
                    }

                    return combinedSlots.map((slot, idx) => {
                      const isTaken = isSlotTakenInModal(slot);
                      const slotKey = `${tempSelectedDate}_${slot}`;
                      const isTeacherBlocked = teacherBlockedSlots.includes(slotKey);

                      if (isTaken || isTeacherBlocked) {
                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60 line-through"
                          >
                            <span className="material-symbols-outlined text-xs text-red-500">lock</span>
                            <span>{slot}</span>
                            <span className="text-[10px] no-underline font-black bg-slate-200 text-slate-600 px-1 rounded">
                              {isTeacherBlocked
                                ? (lang === 'ar' ? 'مقفول 🔒' : 'Bloqué 🔒')
                                : (lang === 'ar' ? `حصة ${isTaken.id}` : `S${isTaken.id}`)}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectModalTime(slot)}
                          className="p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#4221b6] hover:bg-[#4221b6] hover:text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm hover:scale-105 text-slate-800"
                        >
                          <span className="material-symbols-outlined text-base">schedule</span>
                          <span>{slot}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left rtl:text-right pt-1">
              {packSessions.map((s, i) => (
                <div key={i} className="p-3 bg-[#faf9f5] border border-slate-200 rounded-xl flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#4221b6] text-white flex items-center justify-center text-xs font-black shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">{getFormattedDayLabel(s.day) || s.day}</span>
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

      {/* Schedule Modals for Maitresse fallback */}
      {scheduleModal === 'days' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">calendar_month</span>
                {lang === 'ar' ? 'إدارة أيام الحجز' : 'Gérer les jours disponibles'}
              </h3>
              <button onClick={() => setScheduleModal(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100 transition cursor-pointer">
                <span className="material-symbols-outlined text-slate-600 text-sm">close</span>
              </button>
            </div>
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
            <button
              onClick={() => setSchedDays([...schedDays, { id: String(Date.now()), fr: '', ar: '', en: '' }])}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-400 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {lang === 'ar' ? 'إضافة يوم جديد' : 'Ajouter un jour'}
            </button>
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

      {scheduleModal === 'times' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">schedule</span>
                {lang === 'ar' ? 'إدارة أوقات الحجز' : 'Gérer les horaires disponibles'}
              </h3>
              <button onClick={() => setScheduleModal(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-100 transition cursor-pointer">
                <span className="material-symbols-outlined text-slate-600 text-sm">close</span>
              </button>
            </div>
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
