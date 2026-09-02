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
  const [isSuccessOpen, setIsSuccessOpen] = useState(false); // false | true (pack) | 'trial'
  const [isPackSelected, setIsPackSelected] = useState(true);
  const [trialSession, setTrialSession] = useState({ day: '', time: '', isBooked: false });
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  // Mandatory Student Contact / Phone Number State
  const [studentPhone, setStudentPhone] = useState(() => {
    return user?.phone || user?.studentPhone || localStorage.getItem('last_student_phone') || '';
  });
  const [phoneError, setPhoneError] = useState('');
  const phoneInputRef = React.useRef(null);

  useEffect(() => {
    if (user?.phone && !studentPhone) {
      setStudentPhone(user.phone);
    }
  }, [user?.phone]);

  const handleCopyWhatsapp = (num) => {
    try {
      navigator.clipboard.writeText(num);
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 2500);
    } catch {}
  };

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

  // Load teacher from URL query params or API with real-time auto sync
  useEffect(() => {
    let isMounted = true;

    const fetchTargetTeacherAndList = async () => {
      let foundTeacher = null;

      try {
        const res = await fetch(`${API_BASE_URL}/api/teachers?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.teachers && Array.isArray(data.teachers) && isMounted) {
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
            } else {
              // Keep target teacher synchronized with the latest schedule from database
              setTargetTeacher(prev => {
                if (prev) {
                  const updated = data.teachers.find(t => String(t._id || t.id) === String(prev._id || prev.id) || t.email === prev.email);
                  return updated || prev;
                }
                return !isMaitresse && data.teachers.length > 0 ? data.teachers[0] : null;
              });
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement maîtresses:', err);
      }

      if (!foundTeacher && teacherIdParam) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/clients/${teacherIdParam}?_t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            if (data.user && isMounted) {
              foundTeacher = data.user;
            }
          }
        } catch {}
      }

      if (foundTeacher && isMounted) {
        setTargetTeacher(foundTeacher);
      }
      if (isMounted) setLoadingTeachers(false);
    };

    fetchTargetTeacherAndList();

    // Listen to real-time teacher schedule updates across components & browser tabs
    const handleScheduleUpdate = () => {
      fetchTargetTeacherAndList();
    };

    const handleStorage = (e) => {
      if (e.key === 'teacher_schedule_cache_sync') {
        fetchTargetTeacherAndList();
      }
    };

    window.addEventListener('teacher_schedule_updated', handleScheduleUpdate);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', fetchTargetTeacherAndList);

    // Auto-poll every 3 seconds for live schedule updates
    const interval = setInterval(fetchTargetTeacherAndList, 3000);

    return () => {
      isMounted = false;
      window.removeEventListener('teacher_schedule_updated', handleScheduleUpdate);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', fetchTargetTeacherAndList);
      clearInterval(interval);
    };
  }, [teacherIdParam, teacherNameParam, isMaitresse]);

  // Determine active schedule (from target teacher if selected, or logged in user, or fallbacks)
  const effectiveTeacher = targetTeacher || (isMaitresse || isAdmin ? user : (teachersList[0] || null));

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
  const [modalStep, setModalStep] = useState('date'); // 'date' | 'time' | 'phone'
  const [tempSelectedDate, setTempSelectedDate] = useState(''); // 'YYYY-MM-DD'
  const [tempSelectedTime, setTempSelectedTime] = useState(''); // '14:00'
  const [currentCalMonth, setCurrentCalMonth] = useState(new Date());

  // Phone Validation Helper
  const isPhoneValid = (phone) => {
    const digitsOnly = String(phone || '').replace(/\D/g, '');
    return digitsOnly.length >= 6;
  };

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

  // Open scheduling modal specifically for Free Trial session
  const openTrialModal = () => {
    setActiveSessionIndex(0);
    setModalSessionIndex('trial');
    setModalStep('date');
    setTempSelectedDate(trialSession.day || packSessions[0]?.day || '');
    setTempSelectedTime(trialSession.time || packSessions[0]?.time || '');
  };

  // Open scheduling modal for specific session index
  const openSessionModal = (index) => {
    setActiveSessionIndex(index);
    setModalSessionIndex(index);
    setModalStep('date');
    setTempSelectedDate(packSessions[index]?.day || '');
    setTempSelectedTime(packSessions[index]?.time || '');
  };

  // Select Date from Calendar Grid inside Modal
  const handleSelectModalDate = (dateStr) => {
    if (teacherBlockedDates.includes(dateStr)) return; // Locked date, cannot pick
    setTempSelectedDate(dateStr);
    setModalStep('time');
  };

  // Select Time inside Modal and finalize for this session
  const handleSelectModalTime = async (timeSlot) => {
    if (modalSessionIndex === null) return;

    if (modalSessionIndex === 'trial') {
      const selectedDay = tempSelectedDate;
      setTempSelectedTime(timeSlot);
      const cleanPhone = (studentPhone || '').trim();

      // If phone is missing, prompt directly in the modal step 'phone'
      if (!isPhoneValid(cleanPhone)) {
        setModalStep('phone');
        return;
      }

      setModalSessionIndex(null);
      setTrialSession({ day: selectedDay, time: timeSlot, isBooked: true });
      setPackSessions(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], day: selectedDay, time: timeSlot };
        return updated;
      });
      await handleConfirmTrialReservation(selectedDay, timeSlot, cleanPhone);
      return;
    }
    
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

  // Confirm Trial reservation when phone is submitted from modal
  const handleConfirmTrialWithPhone = async (dayToBook, timeToBook) => {
    const cleanPhone = (studentPhone || '').trim();
    if (!isPhoneValid(cleanPhone)) {
      setPhoneError(
        lang === 'ar'
          ? '⚠️ يرجى إدخال رقم هاتف صحيح (6 أرقام على الأقل).'
          : '⚠️ Veuillez saisir un numéro de téléphone valide.'
      );
      return;
    }
    setPhoneError('');
    setModalSessionIndex(null);
    setTrialSession({ day: dayToBook, time: timeToBook, isBooked: true });
    setPackSessions(prev => {
      const updated = [...prev];
      updated[0] = { ...updated[0], day: dayToBook, time: timeToBook };
      return updated;
    });
    await handleConfirmTrialReservation(dayToBook, timeToBook, cleanPhone);
  };

  // Helper: check if a time slot is already taken on tempSelectedDate by another session
  const isSlotTakenInModal = (timeSlot) => {
    if (modalSessionIndex === 'trial') return null;
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

  // Submit Free Trial reservation directly to MongoDB & notify teacher/admin
  const handleConfirmTrialReservation = async (chosenDay, chosenTime, phoneOverride) => {
    const rawPhone = (phoneOverride !== undefined ? phoneOverride : studentPhone) || '';
    const cleanPhone = rawPhone.trim();

    if (!isPhoneValid(cleanPhone)) {
      setPhoneError(
        lang === 'ar'
          ? '⚠️ يرجى إدخال رقم هاتف صحيح (6 أرقام على الأقل) لإرسال تفاصيل الحصة للأستاذ والإدارة.'
          : '⚠️ Veuillez saisir un numéro de téléphone valide pour transmettre la réservation.'
      );
      if (modalSessionIndex === 'trial') {
        setModalStep('phone');
      } else {
        phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneInputRef.current?.focus();
      }
      return;
    }
    setPhoneError('');

    try {
      localStorage.setItem('last_student_phone', cleanPhone);
      if (user) {
        updateCurrentUser?.({ phone: cleanPhone });
      }
    } catch {}

    setBookingLoading(true);

    const teacherObj = targetTeacher || (isMaitresse ? user : null) || (teachersList[0] || null);
    const teacherName = teacherObj?.name || teacherObj?.parentName || teacherObj?.email?.split('@')[0] || (lang === 'ar' ? 'معلمة' : 'Maîtresse');
    const teacherEmail = teacherObj?.email || '';
    const teacherId = teacherObj?.id || teacherObj?._id || '';
    const teacherSubject = teacherObj?.subject || teacherObj?.matiere || 'Français & Arabe';

    const dayVal = chosenDay || trialSession.day || packSessions[0]?.day;
    const timeVal = chosenTime || trialSession.time || packSessions[0]?.time;

    const trialPayload = {
      studentName: user?.childName || user?.parentName || (user?.email ? user.email.split('@')[0] : 'Élève'),
      parentName: user?.parentName || (user?.email ? user.email.split('@')[0] : 'Parent'),
      childName: user?.childName || '',
      studentEmail: user?.email || '',
      studentPhone: cleanPhone,
      phone: cleanPhone,
      studentId: user?.id || user?._id || '',
      teacherId: String(teacherId),
      teacherName: teacherName,
      teacherEmail: teacherEmail,
      day: dayVal,
      time: timeVal,
      datetime: `${getFormattedDayLabel(dayVal) || dayVal}, ${timeVal}`,
      subject: `${teacherSubject} (${lang === 'ar' ? 'حصة تجريبية مجانية 🎁' : 'Séance d\'essai 100% gratuite 🎁'})`,
      paymentMethod: 'free_trial',
      isTrial: true,
      status: 'pending',
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialPayload),
      });

      let savedSession = null;
      if (res.ok) {
        const data = await res.json();
        savedSession = data?.session;
      }
      if (!savedSession) {
        savedSession = {
          id: String(Date.now()),
          ...trialPayload,
          createdAt: new Date().toISOString(),
        };
      }

      window.dispatchEvent(new CustomEvent('session_created', { detail: savedSession }));

      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('app_sessions_channel');
          bc.postMessage({ type: 'NEW_SESSION_BOOKED', sessions: [savedSession], session: savedSession });
          bc.close();
        }
      } catch {}

      try {
        localStorage.setItem('admin_latest_booked_session', JSON.stringify({
          session: savedSession,
          sessions: [savedSession],
          timestamp: Date.now(),
        }));
      } catch {}

      try {
        const existing = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
        localStorage.setItem('admin_sessions_cache', JSON.stringify([savedSession, ...existing]));
      } catch {}

      const studentDisplayName = user?.childName || user?.parentName || (user?.email ? user.email.split('@')[0] : 'Élève');
      const phoneSuffixFr = cleanPhone ? ` (Tél: ${cleanPhone})` : '';
      const phoneSuffixAr = cleanPhone ? ` (الهاتف: ${cleanPhone})` : '';
      const phoneSuffixEn = cleanPhone ? ` (Phone: ${cleanPhone})` : '';

      createNotification({
        type: 'NEW_SESSION_REQUEST',
        targetRoles: ['admin', 'maitresse'],
        targetTeacherId: String(teacherId),
        targetTeacherEmail: teacherEmail,
        targetTeacherName: teacherName,
        targetStudentId: String(user?.id || user?._id || ''),
        targetStudentEmail: user?.email || '',
        title: {
          fr: `🎁 Nouvelle séance d'essai gratuite demandée !`,
          ar: `🎁 طلب حصة تجريبية مجانية جديد !`,
          en: `🎁 New Free Trial Session Request!`,
        },
        desc: {
          fr: `L'élève ${studentDisplayName}${phoneSuffixFr} a réservé sa séance d'essai gratuite pour le ${getFormattedDayLabel(dayVal) || dayVal} à ${timeVal} avec ${teacherName}. 📱 Tél: ${cleanPhone}`,
          ar: `قام التلميذ ${studentDisplayName}${phoneSuffixAr} بحجز حصته التجريبية المجانية ليوم ${getFormattedDayLabel(dayVal) || dayVal} الساعة ${timeVal} مع المعلمة ${teacherName}. 📱 الهاتف: ${cleanPhone}`,
          en: `Student ${studentDisplayName}${phoneSuffixEn} booked a free trial session for ${dayVal} at ${timeVal} with ${teacherName}. 📱 Phone: ${cleanPhone}`,
        },
        message: {
          fr: `L'élève ${studentDisplayName}${phoneSuffixFr} a réservé sa séance d'essai gratuite pour le ${getFormattedDayLabel(dayVal) || dayVal} à ${timeVal} avec ${teacherName}. 📱 Tél: ${cleanPhone}`,
          ar: `قام التلميذ ${studentDisplayName}${phoneSuffixAr} بحجز حصته التجريبية المجانية ليوم ${getFormattedDayLabel(dayVal) || dayVal} الساعة ${timeVal} مع المعلمة ${teacherName}. 📱 الهاتف: ${cleanPhone}`,
          en: `Student ${studentDisplayName}${phoneSuffixEn} booked a free trial session for ${dayVal} at ${timeVal} with ${teacherName}. 📱 Phone: ${cleanPhone}`,
        },
        icon: 'card_giftcard',
        iconBg: 'bg-emerald-100 text-emerald-700',
        link: '/admin',
        meta: {
          sessionId: savedSession?.id || savedSession?._id,
          studentName: studentDisplayName,
          teacherName: teacherName,
          studentPhone: cleanPhone,
          isTrial: true,
        },
      });

      setTrialSession({ day: dayVal, time: timeVal, isBooked: true });
      setIsSuccessOpen('trial');
    } catch (err) {
      console.error('Erreur réservation séance essai:', err);
    } finally {
      setBookingLoading(false);
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

    const cleanPhone = (studentPhone || '').trim();
    if (!isPhoneValid(cleanPhone)) {
      setPhoneError(
        lang === 'ar'
          ? '⚠️ يرجى إدخال رقم هاتف صحيح (6 أرقام على الأقل) لإرسال بيانات الحجز للأستاذ والإدارة.'
          : '⚠️ Veuillez saisir un numéro de téléphone valide pour transmettre la réservation.'
      );
      phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      phoneInputRef.current?.focus();
      return;
    }
    setPhoneError('');

    try {
      localStorage.setItem('last_student_phone', cleanPhone);
      if (user) {
        updateCurrentUser?.({ phone: cleanPhone });
      }
    } catch {}

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
      studentEmail: user?.email || '',
      studentPhone: cleanPhone,
      phone: cleanPhone,
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
        body: JSON.stringify({ sessions: sessionsPayload, packId: currentPackId, studentPhone: cleanPhone, phone: cleanPhone }),
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
      const phoneSuffixFr = cleanPhone ? ` (Tél: ${cleanPhone})` : '';
      const phoneSuffixAr = cleanPhone ? ` (الهاتف: ${cleanPhone})` : '';
      const phoneSuffixEn = cleanPhone ? ` (Phone: ${cleanPhone})` : '';

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
          fr: `${studentDisplayName}${phoneSuffixFr} a réservé 4 séances avec ${teacherName} (${sessionsPayload[0]?.day} à ${sessionsPayload[0]?.time}...). 📱 Tél: ${cleanPhone}`,
          ar: `قام التلميذ ${studentDisplayName}${phoneSuffixAr} بحجز 4 حصص مع ${teacherName} (${sessionsPayload[0]?.day} الساعة ${sessionsPayload[0]?.time}...). 📱 الهاتف: ${cleanPhone}`,
          en: `${studentDisplayName}${phoneSuffixEn} booked 4 sessions with ${teacherName} (${sessionsPayload[0]?.day} at ${sessionsPayload[0]?.time}...). 📱 Phone: ${cleanPhone}`,
        },
        icon: 'calendar_month',
        iconBg: 'bg-purple-100 text-purple-700',
        link: '/admin',
        meta: {
          studentName: studentDisplayName,
          teacherName,
          studentPhone: cleanPhone,
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

              {trialSession.day && trialSession.time && (
                <div className="w-full p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-left rtl:text-right flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">event_available</span>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">
                        {lang === 'ar' ? 'الموعد المحدد للحصة' : 'Rendez-vous choisi'}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        {getFormattedDayLabel(trialSession.day)} à {trialSession.time}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
                    ✓
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={openTrialModal}
                className="w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg bg-[#059669] hover:bg-[#047857] text-white shadow-emerald-200 hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">
                  calendar_month
                </span>
                <span>
                  {trialSession.day && trialSession.time
                    ? (lang === 'fr' ? 'Séance d\'essai sélectionnée ✓' : lang === 'ar' ? 'تم اختيار موعد الجلسة ✓' : 'Trial Selected ✓')
                    : (t.calendarPage?.packOffer?.selectBtn || (lang === 'fr' ? 'Séance d\'essai sélectionnée' : lang === 'ar' ? 'احجز جلستك المجانية' : 'Book My Free Trial'))}
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

      {/* 3.5 Pack Pricing Banner */}
      <section className="bg-gradient-to-r from-[#1c0576] via-[#4221b6] to-[#5d35e0] rounded-2xl p-5 sm:p-6 border-2 border-[#8c90f6]/60 shadow-xl relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#78fd7d]/15 rounded-full blur-2xl pointer-events-none"></div>

        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'calendarPack', title: lang === 'ar' ? 'تعديل سعر الباقة' : 'Modifier le tarif du pack' })}
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border border-white/40 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل السعر' : 'Modifier le tarif'}</span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
          {/* Left: Title & description */}
          <div className="flex items-center gap-4 text-left rtl:text-right">
            <div className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner border border-white/20 shrink-0">
              💳
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-extrabold text-base sm:text-lg leading-tight">
                  {t.calendarPage?.packOffer?.priceTitle || (lang === 'ar' ? 'سعر باقة الـ 4 حصص' : 'Tarif du Pack 4 Séances')}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#78fd7d] text-[#064e3b] text-[10px] font-black tracking-wide uppercase">
                  {t.calendarPage?.packOffer?.priceBadge || (lang === 'ar' ? 'عرض مناسب' : 'Tarif Avantageux')}
                </span>
              </div>
              <p className="text-white/80 text-xs font-medium leading-relaxed">
                {t.calendarPage?.packOffer?.priceDesc || (lang === 'ar' ? 'سعر باقة الـ 4 حصص : 80 ريال قطري (أو 19 يورو للحصة الواحدة)' : 'Le prix des 4 séances : 80 Riyals (soit 19€ la séance)')}
              </p>
            </div>
          </div>

          {/* Right: Price pills */}
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end shrink-0">
            {/* QAR Price */}
            <div className="flex flex-col items-center bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/25 shadow-lg min-w-[110px] text-center">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1">
                {lang === 'ar' ? 'إجمالي الباقة' : 'Total pack'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#78fd7d] leading-none" dir="ltr">
                {t.calendarPage?.packOffer?.packPriceQar || '80 Riyals'}
              </span>
              <span className="text-[10px] text-white/60 font-bold mt-1">
                {lang === 'ar' ? '4 حصص كاملة' : '4 séances incluses'}
              </span>
            </div>

            <div className="text-white/40 font-black text-xl hidden sm:block">/</div>

            {/* EUR Price per session */}
            <div className="flex flex-col items-center bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/25 shadow-lg min-w-[110px] text-center">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1">
                {lang === 'ar' ? 'سعر الحصة' : 'Par séance'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-yellow-300 leading-none" dir="ltr">
                {t.calendarPage?.packOffer?.packPriceEur || '19€'}
              </span>
              <span className="text-[10px] text-white/60 font-bold mt-1">
                {lang === 'ar' ? 'بالتحويل البنكي' : 'par virement'}
              </span>
            </div>
          </div>
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

      {/* 4.5. Section Assistance & Confirmation WhatsApp sous Mode de paiement */}
      <section className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white rounded-2xl p-6 md:p-7 border-2 border-emerald-300 shadow-md relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none"></div>

        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'calendarStep3', title: lang === 'ar' ? 'تعديل قسم الواتساب والدفع' : 'Modifier WhatsApp & Paiement' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/50"
            title={lang === 'ar' ? 'تعديل رقم ومعلومات الواتساب' : 'Modifier les infos WhatsApp'}
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل الواتساب' : 'Modifier WhatsApp'}</span>
          </button>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.71 4.29 3.8 2.52 1.08 2.52.72 2.97.68.46-.05 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
              </svg>
            </div>

            <div className="space-y-1.5 pr-6 rtl:pr-0 rtl:pl-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  {t.calendarPage?.whatsappTitle || (lang === 'ar' ? 'تأكيد الدفع والمساعدة الفورية عبر الواتساب' : 'Confirmation & Assistance WhatsApp')}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>WhatsApp Direct</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xl">
                {t.calendarPage?.whatsappDesc || (lang === 'ar' ? 'لتأكيد عملية الدفع أو إرسال إيصال التحويل أو لأي استفسار، تواصل معنا مباشرة عبر الواتساب:' : 'Pour confirmer votre paiement, envoyer votre reçu de virement ou pour toute question, contactez-nous directement sur WhatsApp :')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            {/* Phone Number Pill with Copy */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-emerald-200 shadow-sm">
              <span className="material-symbols-outlined text-emerald-600 text-base">phone_iphone</span>
              <span className="font-black text-slate-900 text-xs sm:text-sm tracking-wider select-all font-mono" dir="ltr">
                {t.calendarPage?.whatsappNumber || '00974 33069770'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyWhatsapp(t.calendarPage?.whatsappNumber || '00974 33069770')}
                className="p-1 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-700 transition cursor-pointer flex items-center gap-1"
                title={lang === 'ar' ? 'نسخ الرقم' : 'Copier le numéro'}
              >
                <span className="material-symbols-outlined text-sm text-emerald-600">
                  {copiedWhatsapp ? 'check' : 'content_copy'}
                </span>
                {copiedWhatsapp && (
                  <span className="text-[10px] font-bold text-emerald-600">
                    {lang === 'ar' ? 'تم النسخ' : 'Copié !'}
                  </span>
                )}
              </button>
            </div>

            {/* Direct WhatsApp Action Link */}
            <a
              href={`https://wa.me/${(t.calendarPage?.whatsappNumber || '00974 33069770').replace(/\D/g, '').replace(/^00/, '')}?text=${encodeURIComponent(
                lang === 'ar'
                  ? 'مرحباً، أود تأكيد الحجز وإرسال إيصال الدفع.'
                  : 'Bonjour, je souhaite confirmer ma réservation et envoyer le reçu de paiement.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs shadow-md hover:shadow-emerald-200 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.71 4.29 3.8 2.52 1.08 2.52.72 2.97.68.46-.05 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
              </svg>
              <span>{t.calendarPage?.whatsappButton || (lang === 'ar' ? 'مراسلة عبر الواتساب' : 'Contacter sur WhatsApp')}</span>
            </a>
          </div>
        </div>
      </section>

      {/* 4.8. SECTION COORDONNÉES ÉLÈVE & TÉLÉPHONE OBLIGATOIRE */}
      <section className="bg-gradient-to-br from-[#fbfaff] via-white to-[#f0fdf4] rounded-3xl p-6 sm:p-8 border-2 border-[#8c90f6]/60 shadow-lg space-y-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              <span className="material-symbols-outlined text-2xl">phone_iphone</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#1c0576]">
                  {lang === 'ar' ? 'رقم الهاتف للتواصل والتأكيد *' : 'Numéro de téléphone / WhatsApp *'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-wider">
                  {lang === 'ar' ? 'إجباري' : 'Obligatoire'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {lang === 'ar'
                  ? 'سيتم إرسال هذا الرقم وبيانات الحجز مباشرةً إلى المعلمة والإدارة لتأكيد الحصص والتواصل معك.'
                  : 'Ce numéro sera transmis directement à la maîtresse et à l\'admin pour la confirmation du cours.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{lang === 'ar' ? 'إرسال فوري للأستاذ والأدمن' : 'Notification instantanée'}</span>
          </div>
        </div>

        <div className="max-w-xl space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-emerald-600">
              <span className="material-symbols-outlined text-xl">contact_phone</span>
            </div>
            <input
              ref={phoneInputRef}
              type="tel"
              value={studentPhone}
              onChange={(e) => {
                setStudentPhone(e.target.value);
                setPhoneError('');
              }}
              placeholder={lang === 'ar' ? 'أدخل رقم هاتفك (مثال: 33069770 أو +974...)' : 'Entrez votre numéro (ex: +974... ou 06...)'}
              className={`w-full h-13 pl-12 pr-4 rtl:pl-4 rtl:pr-12 rounded-2xl border-2 font-mono font-bold text-sm sm:text-base outline-none transition-all shadow-xs ${
                phoneError
                  ? 'border-red-500 bg-red-50/50 text-red-900 focus:ring-4 focus:ring-red-100'
                  : 'border-emerald-300 bg-white text-slate-900 focus:border-[#4221b6] focus:ring-4 focus:ring-[#8c90f6]/20'
              }`}
              dir="ltr"
            />
          </div>

          {phoneError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-in fade-in">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{phoneError}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 font-medium">
            {lang === 'ar'
              ? '💡 يرجى كتابة رقم الهاتف مع مفتاح الدولة إذا كنت خارج قطر لتسهيل التواصل عبر الواتساب.'
              : '💡 Vous pouvez inclure l\'indicatif de votre pays pour faciliter l\'échange via WhatsApp.'}
          </p>
        </div>
      </section>

      {/* 5. CONFIRMATION BUTTON - SHOWN WHEN ALL 4 SESSIONS ARE SCHEDULED */}
      <section className="flex flex-col items-center justify-center mt-4 w-full max-w-xl mx-auto px-3">
        {packSessions.every(s => s.day && s.time) ? (
          <button
            onClick={handleConfirmReservation}
            disabled={bookingLoading}
            className="w-full sm:w-auto min-h-[56px] sm:min-h-[64px] px-6 sm:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-full bg-gradient-to-r from-[#4221b6] via-[#4f27d8] to-[#5a2ee6] hover:from-[#351996] hover:to-[#4a22c4] text-white font-black text-sm sm:text-base md:text-lg transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer shadow-xl hover:scale-102 active:scale-98 border-2 border-emerald-400 text-center leading-snug"
          >
            {bookingLoading ? (
              <>
                <span className="truncate">{lang === 'ar' ? 'جاري إرسال الطلب للمعلمة...' : 'Envoi de la demande...'}</span>
                <span className="material-symbols-outlined animate-spin text-lg sm:text-xl shrink-0">progress_activity</span>
              </>
            ) : (
              <>
                <span>{lang === 'ar' ? 'تأكيد حجز الباقة وإرسال الطلب للأستاذ ✓' : 'Confirmer et envoyer la demande ✓'}</span>
                <span className="material-symbols-outlined text-lg sm:text-2xl text-emerald-300 shrink-0">send</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2.5 w-full max-w-md">
            <button
              disabled
              className="w-full min-h-[52px] sm:min-h-[58px] px-5 sm:px-8 py-3 rounded-2xl sm:rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 font-extrabold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2.5 cursor-not-allowed shadow-none text-center leading-snug"
            >
              <span className="material-symbols-outlined text-base sm:text-xl text-slate-400 shrink-0">lock</span>
              <span>
                {lang === 'ar'
                  ? `يرجى تحديد تواريخ الحصص الأربع أولاً (${packSessions.filter(s => s.day && s.time).length} / 4)`
                  : `Veuillez planifier les 4 séances (${packSessions.filter(s => s.day && s.time).length} / 4)`}
              </span>
            </button>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium text-center leading-relaxed">
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
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg p-4 sm:p-6 flex flex-col gap-3.5 sm:gap-5 relative border-2 border-[#8c90f6]/40 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#4221b6] text-white flex items-center justify-center font-black text-xs sm:text-base shadow-sm shrink-0">
                  {modalSessionIndex === 'trial' ? '🎁' : modalSessionIndex + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-[#1c0576] truncate">
                    {modalSessionIndex === 'trial'
                      ? (lang === 'ar' ? 'حجز موعد الحصة التجريبية المجانية' : 'Séance d\'Essai Gratuite')
                      : (lang === 'ar' ? `تحديد موعد الحصة ${modalSessionIndex + 1}` : `Planifier la Séance ${modalSessionIndex + 1}`)}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                    {modalStep === 'date'
                      ? (lang === 'ar' ? 'الخطوة 1: اختر يوماً من تقويم المعلمة' : 'Étape 1 : Choisissez une date')
                      : (lang === 'ar' ? `الخطوة 2: اختر الساعة ليوم (${getFormattedDayLabel(tempSelectedDate)})` : `Étape 2 : Choisissez l'heure (${getFormattedDayLabel(tempSelectedDate)})`)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalSessionIndex(null)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-50 text-slate-500 hover:text-red-600 transition cursor-pointer shrink-0 ml-1"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* STEP 1: MONTH CALENDAR GRID */}
            {modalStep === 'date' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between bg-slate-50/90 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = new Date(currentCalMonth);
                      prev.setMonth(prev.getMonth() - 1);
                      setCurrentCalMonth(prev);
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-xs transition cursor-pointer flex items-center justify-center border border-slate-200"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">{isRtl ? 'chevron_right' : 'chevron_left'}</span>
                  </button>

                  <h4 className="text-xs sm:text-sm font-black text-[#1c0576] capitalize">
                    {currentCalMonth.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'long', year: 'numeric' })}
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(currentCalMonth);
                      next.setMonth(next.getMonth() + 1);
                      setCurrentCalMonth(next);
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-xs transition cursor-pointer flex items-center justify-center border border-slate-200"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">{isRtl ? 'chevron_left' : 'chevron_right'}</span>
                  </button>
                </div>

                {/* Calendar Days Header */}
                <div className="grid grid-cols-7 text-center gap-1">
                  {(lang === 'ar' ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']).map((d, idx) => (
                    <span key={idx} className="text-[10px] sm:text-[11px] font-black text-slate-400 py-0.5 uppercase tracking-wider">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar Days Cells */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {(() => {
                    const year = currentCalMonth.getFullYear();
                    const month = currentCalMonth.getMonth();
                    const firstDayOfMonth = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const cells = [];

                    // Empty slots before month start
                    for (let i = 0; i < firstDayOfMonth; i++) {
                      cells.push(<div key={`empty-${i}`} className="h-8 sm:h-9 md:h-10 rounded-lg sm:rounded-xl bg-transparent"></div>);
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
                          className={`h-8 sm:h-9 md:h-10 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all relative cursor-pointer ${
                            isBlocked
                              ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed line-through'
                              : isSelected
                                ? 'bg-[#4221b6] text-white shadow-md font-black scale-105 ring-2 ring-[#8c90f6]/40'
                                : isToday
                                  ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-400 font-extrabold'
                                  : 'bg-slate-50/80 hover:bg-white text-slate-800 border border-slate-200 hover:border-[#4221b6]'
                          }`}
                        >
                          <span>{dayNum}</span>
                          {isBlocked && (
                            <span className="material-symbols-outlined text-[8px] sm:text-[9px] text-red-400 absolute top-0.5 right-0.5">lock</span>
                          )}
                        </button>
                      );
                    }

                    return cells;
                  })()}
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold pt-2 text-slate-400 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300 inline-block"></span>
                    <span>{lang === 'ar' ? 'مقفول 🔒' : 'Bloqué 🔒'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4221b6] inline-block"></span>
                    <span>{lang === 'ar' ? 'المحدد' : 'Sélectionné'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: TIME SELECTOR GRID */}
            {modalStep === 'time' && (
              <div className="space-y-3 sm:space-y-4">
                <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold truncate">
                    <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">event_available</span>
                    <span className="truncate">{lang === 'ar' ? 'اليوم المختار :' : 'Date choisie :'} {getFormattedDayLabel(tempSelectedDate)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalStep('date')}
                    className="text-xs text-[#4221b6] font-black underline cursor-pointer shrink-0 ml-2"
                  >
                    {lang === 'ar' ? 'تغيير' : 'Changer'}
                  </button>
                </div>

                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                  {lang === 'ar' ? 'اختر الساعة المناسبة:' : 'Choisissez l\'horaire :'}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {(() => {
                    // Combine global shared slots + day-specific slots for this exact date
                    const daySpecificSlots = teacherCustomDaySlots[tempSelectedDate] || [];
                    const combinedSlots = Array.from(new Set([...timeSlots, ...daySpecificSlots]));

                    if (combinedSlots.length === 0) {
                      return (
                        <div className="col-span-2 sm:col-span-3 py-6 text-center">
                          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-xl text-slate-400">schedule_off</span>
                          </div>
                          <p className="text-xs font-bold text-slate-500">
                            {lang === 'ar' ? 'لا يوجد توقيت متاح لهذا اليوم' : 'Aucun horaire disponible'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
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
                            className="py-2 px-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-100 text-slate-400 font-bold text-[11px] flex items-center justify-center gap-1 cursor-not-allowed opacity-60 line-through"
                          >
                            <span className="material-symbols-outlined text-xs text-red-500">lock</span>
                            <span>{slot}</span>
                            <span className="text-[9px] no-underline font-black bg-slate-200 text-slate-600 px-1 rounded">
                              {isTeacherBlocked
                                ? (lang === 'ar' ? 'مقفول' : 'Bloqué')
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
                          className="py-2.5 sm:py-3 px-3 rounded-xl border-2 border-slate-200 bg-white hover:border-[#4221b6] hover:bg-[#4221b6] hover:text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs hover:scale-102 text-slate-800"
                        >
                          <span className="material-symbols-outlined text-sm sm:text-base">schedule</span>
                          <span>{slot}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* STEP 3: PHONE NUMBER INPUT (MANDATORY FOR CONFIRMING SESSION) */}
            {modalStep === 'phone' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold truncate">
                    <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">event_available</span>
                    <span className="truncate">
                      {getFormattedDayLabel(tempSelectedDate)} {tempSelectedTime ? `à ${tempSelectedTime}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalStep('time')}
                    className="text-xs text-[#4221b6] font-black underline cursor-pointer shrink-0 ml-2"
                  >
                    {lang === 'ar' ? 'تغيير التوقيت' : 'Changer l\'heure'}
                  </button>
                </div>

                <div className="space-y-2 text-left rtl:text-right">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-base">phone_iphone</span>
                    <span>{lang === 'ar' ? 'رقم الهاتف (واتساب للتواصل والتأكيد) *' : 'Numéro de téléphone WhatsApp *'}</span>
                  </label>
                  <input
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => {
                      setStudentPhone(e.target.value);
                      setPhoneError('');
                    }}
                    placeholder={lang === 'ar' ? 'مثال: 33069770 أو +974...' : 'Ex: +974... ou 06...'}
                    className={`w-full h-12 px-4 rounded-xl border-2 font-mono font-bold text-sm outline-none transition-all ${
                      phoneError
                        ? 'border-red-500 bg-red-50/60 text-red-900'
                        : 'border-emerald-300 bg-emerald-50/30 text-slate-900 focus:border-[#4221b6] focus:bg-white'
                    }`}
                    dir="ltr"
                    autoFocus
                  />
                  {phoneError && (
                    <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      <span>{phoneError}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 font-medium">
                    {lang === 'ar'
                      ? '📱 سيتم إرسال هذا الرقم وتفاصيل الحجز فوراً للأستاذة ولإدارة المنصة.'
                      : '📱 Vos coordonnées seront transmises immédiatement à la maîtresse et à l\'admin.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleConfirmTrialWithPhone(tempSelectedDate, tempSelectedTime)}
                  disabled={bookingLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-lg transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/40"
                >
                  {bookingLoading ? (
                    <>
                      <span>{lang === 'ar' ? 'جاري إرسال الطلب للمعلمة...' : 'Envoi en cours...'}</span>
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    </>
                  ) : (
                    <>
                      <span>{lang === 'ar' ? 'تأكيد الحجز وإرسال الطلب للأستاذ والإدارة ✓' : 'Confirmer et envoyer la demande ✓'}</span>
                      <span className="material-symbols-outlined text-base">send</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Booking Modal Overlay */}
      {isSuccessOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 flex flex-col items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="text-center max-w-sm sm:max-w-md w-full bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center text-xl sm:text-2xl shadow-xs">
              {isSuccessOpen === 'trial' ? '🎁' : '✓'}
            </div>
            
            <h2 className="text-lg sm:text-xl font-black text-[#1c0576] mt-3">
              {isSuccessOpen === 'trial'
                ? (lang === 'ar' ? 'تم إرسال طلب الحصة التجريبية بنجاح ! 🎉' : 'Demande de Séance d\'Essai Envoyée ! 🎉')
                : (lang === 'ar' ? 'تم تأكيد حجز الباقة (4 حصص) بنجاح ! 🎉' : 'Réservation du Pack (4 séances) réussie ! 🎉')}
            </h2>
            
            <p className="text-xs text-slate-500 font-medium mt-1">
              {isSuccessOpen === 'trial'
                ? (lang === 'ar'
                    ? `تم إرسال طلب موعد حصتك التجريبية المجانية بنجاح للأستاذة ${targetTeacher?.name || targetTeacher?.parentName || 'المعلمة'}:`
                    : `Votre demande de séance d'essai 100% gratuite a été transmise avec succès à ${targetTeacher?.name || targetTeacher?.parentName || 'votre maîtresse'} :`)
                : (lang === 'ar'
                    ? `تم تسجيل كافة مواعيد الحصص الأربع بنجاح مع المعلمة ${targetTeacher?.name || targetTeacher?.parentName || 'المعلمة'}:`
                    : `Vos 4 séances ont été enregistrées avec succès auprès de ${targetTeacher?.name || targetTeacher?.parentName || 'votre maîtresse'} :`)}
            </p>

            {isSuccessOpen === 'trial' ? (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-center gap-2.5 my-3.5">
                <span className="material-symbols-outlined text-emerald-600 text-xl">event_available</span>
                <div className="text-left rtl:text-right">
                  <span className="text-xs font-bold text-emerald-950 block">
                    {getFormattedDayLabel(trialSession.day) || trialSession.day}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {lang === 'ar' ? `الساعة ${trialSession.time} • مجانية 100%` : `À ${trialSession.time} • 100% Gratuite`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-left rtl:text-right my-3.5">
                {packSessions.map((s, i) => (
                  <div key={i} className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200/70 hover:border-[#4221b6]/30 rounded-xl flex items-center gap-2 transition-colors">
                    <span className="w-5 h-5 rounded-full bg-[#4221b6] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-800 block truncate">{getFormattedDayLabel(s.day) || s.day}</span>
                      <span className="text-[10px] font-semibold text-[#4221b6]">{s.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { setIsSuccessOpen(false); navigate('/dashboard'); }}
              className="w-full bg-[#4221b6] hover:bg-[#35189b] text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md shadow-[#4221b6]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>{lang === 'ar' ? 'الانتقال إلى لوحة الطالب (Dashboard)' : 'Accéder à mon espace Dashboard'}</span>
              <span className="material-symbols-outlined text-base rtl:rotate-180">arrow_forward</span>
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
