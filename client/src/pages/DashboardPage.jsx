import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import EditSectionModal from '../components/EditSectionModal';
import ChangeStudentAvatarModal, { DEFAULT_STUDENT_AVATAR } from '../components/ChangeStudentAvatarModal';
import { API_BASE_URL } from '../config';
import { createNotification } from '../utils/notifications';
import { SessionCardSkeleton, TeacherCardsSkeleton } from '../components/Skeletons';

export default function DashboardPage() {
  const { lang, t, isRtl, customSections } = useLanguage();
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

  // Check if user role contains 'maitresse' / teacher
  const isMaitresse = (() => {
    if (!user) return false;
    const r = user.role || user.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('maitresse') || r.toLowerCase().includes('teacher') || r.toLowerCase().includes('maître');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('maitresse') || String(item).toLowerCase().includes('teacher') || String(item).toLowerCase().includes('maître'));
    return false;
  })();

  const canEditStudentAvatar = isAdmin || isMaitresse;

  const [editingSectionModal, setEditingSectionModal] = useState(null); // { key, title }
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Real Sessions State
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Lundi');
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [selectedSubject, setSelectedSubject] = useState("Français & Arabe (Séance d'essai)");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fallback default teachers matching Our Teachers section
  const defaultTutors = [
    {
      id: '1',
      name: 'Olfa',
      desc: lang === 'ar' ? 'أستاذة لغة عربية بخبرة تتجاوز 15 عاماً في التدريس.' : "Enseignante d'arabe avec plus de 15 ans d'expérience.",
      img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: '2',
      name: 'Feten',
      desc: lang === 'ar' ? 'مختصة في اللغة الفرنسية وشغوفة بالتعليم والبيداغوجيا الحديثة.' : "Spécialiste en FLE, passionnée par l'enseignement et la pédagogie.",
      img: 'https://images.unsplash.com/photo-1580894732413-801648a37947?auto=format&fit=crop&q=80&w=400',
    },
  ];

  // Fetch real sessions for current student/parent
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
            
            // If logged in as admin or general user without specific name match, return true only if admin
            if (isAdmin) return true;

            return false;
          });

          // Sort by session pack number (extracted from subject like "Séance 2/4" → 2), then by createdAt
          const getSessionPackNum = (s) => {
            // Try sessionNumber field first
            if (s.sessionNumber) return Number(s.sessionNumber);
            // Try extracting from subject e.g. "Français (Séance 2/4)"
            const match = (s.subject || s.matiere || '').match(/[ée]ance\s+(\d+)\s*\//i);
            if (match) return parseInt(match[1], 10);
            return 9999;
          };

          const sorted = [...myFiltered].sort((a, b) => {
            const numA = getSessionPackNum(a);
            const numB = getSessionPackNum(b);
            if (numA !== numB) return numA - numB;
            // Secondary sort: by creation date
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          });

          setSessions(sorted);
          try {
            localStorage.setItem('admin_sessions_cache', JSON.stringify(data.sessions));
          } catch {}
        }
      } else {
        const cached = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
        if (cached.length > 0 && sessions.length === 0) {
          setSessions(cached);
        }
      }
    } catch (err) {
      console.log('Erreur chargement sessions dashboard:', err);
      const cached = JSON.parse(localStorage.getItem('admin_sessions_cache') || '[]');
      if (cached.length > 0 && sessions.length === 0) {
        setSessions(cached);
      }
    } finally {
      if (!isBackground) {
        setLoadingSessions(false);
      }
    }
  };

  // Fetch teachers — ALWAYS include all real teachers from MongoDB
  const fetchTeachers = async () => {
    let apiTeachers = [];

    // Step 1: Load all teachers from MongoDB API (/api/teachers)
    try {
      const res = await fetch(`${API_BASE_URL}/api/teachers`);
      if (res.ok) {
        const data = await res.json();
        if (data.teachers && Array.isArray(data.teachers)) {
          apiTeachers = data.teachers.map((t) => ({
            id: String(t.id || t._id || t.teacherId),
            teacherId: String(t.teacherId || t.id || t._id),
            name: t.name || t.parentName || (t.email ? t.email.split('@')[0] : 'Maîtresse'),
            subject: t.subject || 'Français',
            desc: lang === 'ar' ? 'معلمة لغات معتمدة ومتخصصة' : 'Enseignante certifiée et expérimentée',
            email: t.email || '',
            img: t.avatar || t.img || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
            availableDays: t.availableDays?.length > 0 ? t.availableDays : ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
            timeSlots: t.timeSlots?.length > 0 ? t.timeSlots : ['10:00', '14:00', '16:30'],
          }));
        }
      }
    } catch {}

    // Step 2: Combine with custom hero tutors without dropping MongoDB teachers
    const merged = [...apiTeachers];
    if (customSections?.hero?.tutors && Array.isArray(customSections.hero.tutors)) {
      customSections.hero.tutors.forEach((ct) => {
        const ctName = (ct[lang]?.name || ct.name || ct.fr?.name || '').toLowerCase().trim();
        const exists = merged.some((m) => (m.name || '').toLowerCase().trim() === ctName);
        if (!exists && ct.visible !== false && ct.hidden !== true) {
          merged.push({
            id: ct.id || ct.teacherId || ctName,
            teacherId: ct.teacherId || ct.id || ctName,
            name: ct[lang]?.name || ct.name || ct.fr?.name || 'Maîtresse',
            subject: ct.subject || 'Français',
            desc: ct[lang]?.desc || ct.desc || ct.fr?.desc || 'Enseignante qualifiée',
            img: ct.img || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
            email: ct.email || '',
            availableDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
            timeSlots: ['10:00', '14:00', '16:30'],
          });
        }
      });
    }

    const finalList = merged.length > 0 ? merged : defaultTutors;
    setAvailableTeachers(finalList);
    if (finalList.length > 0) {
      const first = finalList[0];
      setSelectedTeacher(first);
      const firstDay = first.availableDays?.[0] || 'Lundi';
      const firstTime = first.timeSlots?.[0] || '14:00';
      setSelectedDay(firstDay);
      setSelectedTime(firstTime);
    }
  };

  useEffect(() => {
    fetchUserSessions(false);
    fetchTeachers();

    const handleSessionCreated = () => fetchUserSessions(true);
    const handleSessionDeleted = () => fetchUserSessions(true);
    const handleSessionUpdated = () => fetchUserSessions(true);
    const handleAppNotif = () => fetchUserSessions(true);

    window.addEventListener('session_created', handleSessionCreated);
    window.addEventListener('session_deleted', handleSessionDeleted);
    window.addEventListener('session_updated', handleSessionUpdated);
    window.addEventListener('app_notification', handleAppNotif);

    // Cross-tab broadcast listener
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('app_sessions_channel');
        bc.onmessage = (e) => {
          if (
            e.data?.type === 'NEW_SESSION_BOOKED' ||
            e.data?.type === 'SESSION_DELETED' ||
            e.data?.type === 'MEET_LINK_ADDED' ||
            e.data?.type === 'NOTIFICATION_CREATED'
          ) {
            fetchUserSessions(true);
          }
        };
      }
    } catch {}

    // Storage event for fallback
    const handleStorage = (e) => {
      if (
        e.key === 'app_unified_notifications' ||
        e.key === 'student_notifications' ||
        e.key === 'admin_sessions_cache'
      ) {
        fetchUserSessions(true);
      }
    };
    window.addEventListener('storage', handleStorage);

    // Periodic live background poll (every 2.5s) to guarantee real-time update across different browsers/profiles
    const livePoll = setInterval(() => {
      fetchUserSessions(true);
    }, 2500);

    return () => {
      window.removeEventListener('session_created', handleSessionCreated);
      window.removeEventListener('session_deleted', handleSessionDeleted);
      window.removeEventListener('session_updated', handleSessionUpdated);
      window.removeEventListener('app_notification', handleAppNotif);
      window.removeEventListener('storage', handleStorage);
      clearInterval(livePoll);
      if (bc) bc.close();
    };
  }, [user, lang, customSections]);

  // Read target session from sessionStorage or URL query
  useEffect(() => {
    try {
      const storedSessId = sessionStorage.getItem('student_target_session_id');
      if (storedSessId) {
        setHighlightedSessionId(String(storedSessId));
        sessionStorage.removeItem('student_target_session_id');
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
    window.addEventListener('student_focus_session', handleFocus);
    return () => window.removeEventListener('student_focus_session', handleFocus);
  }, []);

  // Auto-scroll to highlighted session card
  useEffect(() => {
    if (!highlightedSessionId || sessions.length === 0) return;

    const targetId = String(highlightedSessionId);
    setTimeout(() => {
      const el = document.getElementById(`student_session_${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);

    const timer = setTimeout(() => {
      setHighlightedSessionId(null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [highlightedSessionId, sessions]);

  // Dynamically resolve teacher's configured subject from MongoDB for the session
  const getTeacherSubjectForSession = (sessionItem, index) => {
    if (!sessionItem) return '';

    // 1. Direct real subject from the database session document (matches ParentPage logic)
    if (sessionItem.subject && typeof sessionItem.subject === 'string' && sessionItem.subject.trim()) {
      return sessionItem.subject;
    }

    // 2. Fallback: match from availableTeachers list
    const sTeacherId = String(sessionItem.teacherId || '').trim();
    const sTeacherEmail = (sessionItem.teacherEmail || '').toLowerCase().trim();
    const sTeacherName = (sessionItem.teacherName || '').toLowerCase().trim();

    const matchedTeacher = availableTeachers.find((t) => {
      const tId = String(t.teacherId || t.id || t._id || '').trim();
      const tEmail = (t.email || '').toLowerCase().trim();
      const tName = (t.name || t.parentName || '').toLowerCase().trim();

      if (sTeacherId && tId && sTeacherId === tId) return true;
      if (sTeacherEmail && tEmail && sTeacherEmail === tEmail) return true;
      if (sTeacherName && tName && (sTeacherName === tName)) return true;
      return false;
    });

    const teacherSubject = matchedTeacher?.subject;

    // Check if session has pack number suffix (Séance X/4) or (الحصة X من 4)
    const match = String(sessionItem.subject || '').match(/(\(Séance \d+\/4\)|\(الحصة \d+ من 4\))/);
    const suffix = match ? ` ${match[1]}` : ` (${lang === 'ar' ? `الحصة ${index + 1} من 4` : `Séance ${index + 1}/4`})`;

    if (teacherSubject) {
      return `${teacherSubject}${suffix}`;
    }

    return lang === 'ar' ? `جلسة تعليمية (الحصة ${index + 1})` : `Séance ${index + 1}`;
  };

  // Handle confirming a new session booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setBookingLoading(true);

    const teacherSubject = selectedTeacher.subject || selectedTeacher.matiere || selectedSubject || 'Français & Arabe';

    const effectivePhone = (user?.phone || user?.studentPhone || localStorage.getItem('last_student_phone') || '').trim();

    const sessionPayload = {
      studentName: user?.childName || user?.parentName || (user?.email ? user.email.split('@')[0] : 'Élève'),
      parentName: user?.parentName || (user?.email ? user.email.split('@')[0] : 'Parent'),
      childName: user?.childName || '',
      studentEmail: user?.email || '',
      studentPhone: effectivePhone,
      phone: effectivePhone,
      studentId: user?.id || user?._id || '',
      teacherId: String(selectedTeacher.teacherId || selectedTeacher.id || ''),
      teacherName: selectedTeacher.name || 'Maîtresse',
      teacherEmail: selectedTeacher.email || '',
      day: selectedDay,
      time: selectedTime,
      datetime: `${selectedDay}, ${selectedTime}`,
      subject: teacherSubject,
      paymentMethod: 'fawran',
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload),
      });
      const data = await res.json();
      const newEntry = data?.session || {
        id: String(Date.now()),
        ...sessionPayload,
        status: 'pending',
        meetUrl: '',
        createdAt: new Date().toISOString(),
      };

      // Broadcast and notify
      window.dispatchEvent(new CustomEvent('session_created', { detail: newEntry }));

      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('app_sessions_channel');
          bc.postMessage({ type: 'NEW_SESSION_BOOKED', session: newEntry });
          bc.close();
        }
      } catch {}

      try {
        localStorage.setItem('admin_latest_booked_session', JSON.stringify({
          session: newEntry,
          timestamp: Date.now(),
        }));
      } catch {}

      // Dispatch Real-time Notification
      const studentDisplayName = user?.childName || user?.parentName || (user?.email ? user.email.split('@')[0] : 'Élève');
      const phoneSuffixFr = effectivePhone ? ` (Tél: ${effectivePhone})` : '';
      const phoneSuffixAr = effectivePhone ? ` (الهاتف: ${effectivePhone})` : '';
      const phoneSuffixEn = effectivePhone ? ` (Phone: ${effectivePhone})` : '';

      createNotification({
        type: 'NEW_SESSION_REQUEST',
        targetRoles: ['admin', 'maitresse'],
        targetTeacherId: String(selectedTeacher.teacherId || selectedTeacher.id || ''),
        targetTeacherEmail: selectedTeacher.email || '',
        targetTeacherName: selectedTeacher.name || 'Maîtresse',
        targetStudentId: String(user?.id || user?._id || ''),
        targetStudentEmail: user?.email || '',
        title: {
          fr: `📩 Nouvelle demande de cours (${sessionPayload.day})`,
          ar: `📩 طلب حجز حصة جديدة (${sessionPayload.day})`,
          en: `📩 New course booking (${sessionPayload.day})`,
        },
        desc: {
          fr: `${studentDisplayName}${phoneSuffixFr} a demandé une séance avec ${selectedTeacher.name} le ${sessionPayload.day} à ${sessionPayload.time}. 📱 Tél: ${effectivePhone}`,
          ar: `طلب التلميذ ${studentDisplayName}${phoneSuffixAr} حصة مع المعلمة ${selectedTeacher.name} يوم ${sessionPayload.day} الساعة ${sessionPayload.time}. 📱 الهاتف: ${effectivePhone}`,
          en: `${studentDisplayName}${phoneSuffixEn} booked a session with ${selectedTeacher.name} on ${sessionPayload.day} at ${sessionPayload.time}. 📱 Phone: ${effectivePhone}`,
        },
        icon: 'calendar_month',
        iconBg: 'bg-purple-100 text-purple-700',
        link: '/admin',
        meta: {
          sessionId: newEntry?.id || newEntry?._id,
          studentName: studentDisplayName,
          teacherName: selectedTeacher.name,
          studentPhone: effectivePhone,
        },
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setIsBookModalOpen(false);
        fetchUserSessions();
      }, 1200);

    } catch (err) {
      console.error('Erreur réservation session:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to check whether the session date & time has arrived (EXACTLY at or after start time, not before)
  const isSessionActive = (session) => {
    if (!session || !session.meetUrl) return false;

    const now = currentTime;
    const nowTime = now.getTime();

    // 1. Check if session has a specific date YYYY-MM-DD or DD/MM/YYYY
    const dayStr = String(session.day || session.datetime || '').trim();
    const timeStr = String(session.time || session.datetime || '').trim();

    const isoDateMatch = dayStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    const frDateMatch = dayStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);

    let sessionDate = null;

    if (isoDateMatch && timeMatch) {
      const year = parseInt(isoDateMatch[1], 10);
      const month = parseInt(isoDateMatch[2], 10) - 1;
      const date = parseInt(isoDateMatch[3], 10);
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      sessionDate = new Date(year, month, date, hours, minutes, 0, 0);
    } else if (frDateMatch && timeMatch) {
      const date = parseInt(frDateMatch[1], 10);
      const month = parseInt(frDateMatch[2], 10) - 1;
      const year = parseInt(frDateMatch[3], 10);
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      sessionDate = new Date(year, month, date, hours, minutes, 0, 0);
    }

    if (sessionDate) {
      const sessionStart = sessionDate.getTime();
      const sessionEnd = sessionStart + 90 * 60 * 1000; // Active for 90 minutes from exact start time
      // EXACTLY when time arrives: nowTime >= sessionStart
      return nowTime >= sessionStart && nowTime <= sessionEnd;
    }

    // 2. Fallback: Day of week comparison (e.g. "Lundi", "Mardi", "الإثنين")
    const currentDayIdx = now.getDay();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentSec = now.getSeconds();
    const currentTotalSec = currentHour * 3600 + currentMin * 60 + currentSec;

    let sessionTotalSec = null;
    if (timeMatch) {
      const h = parseInt(timeMatch[1], 10);
      const m = parseInt(timeMatch[2], 10);
      sessionTotalSec = h * 3600 + m * 60;
    }

    const dayMap = {
      'dimanche': 0, 'الأحد': 0, 'الاحد': 0, 'sunday': 0,
      'lundi': 1, 'الإثنين': 1, 'الاثنين': 1, 'monday': 1,
      'mardi': 2, 'الثلاثاء': 2, 'tuesday': 2,
      'mercredi': 3, 'الأربعاء': 3, 'الاربعاء': 3, 'wednesday': 3,
      'jeudi': 4, 'الخميس': 4, 'thursday': 4,
      'vendredi': 5, 'الجمعة': 5, 'friday': 5,
      'samedi': 6, 'السبت': 6, 'saturday': 6,
    };

    let isToday = false;
    const lowerDay = dayStr.toLowerCase();

    if (lowerDay.includes("aujourd'hui") || lowerDay.includes("اليوم") || lowerDay.includes("today")) {
      isToday = true;
    } else {
      for (const [name, idx] of Object.entries(dayMap)) {
        if (lowerDay.includes(name)) {
          if (currentDayIdx === idx) {
            isToday = true;
          }
          break;
        }
      }
    }

    if (isToday) {
      if (sessionTotalSec !== null) {
        // Active EXACTLY at start time (>= sessionTotalSec) until 90 mins after (sessionTotalSec + 5400s)
        return currentTotalSec >= sessionTotalSec && currentTotalSec <= sessionTotalSec + 5400;
      }
      return true;
    }

    return false;
  };

  const nextSession = sessions.length > 0 ? sessions[0] : null;

  // Dynamic days & time from the selected teacher's own schedule
  const daysOptions = selectedTeacher?.availableDays && selectedTeacher.availableDays.length > 0
    ? selectedTeacher.availableDays
    : (lang === 'ar'
        ? ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
        : ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']);

  const timeOptions = selectedTeacher?.timeSlots && selectedTeacher.timeSlots.length > 0
    ? selectedTeacher.timeSlots
    : ['10:00', '14:00', '16:30'];

  // When teacher changes → update day/time to teacher's first available slot
  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    const days = teacher.availableDays && teacher.availableDays.length > 0
      ? teacher.availableDays
      : ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const times = teacher.timeSlots && teacher.timeSlots.length > 0
      ? teacher.timeSlots
      : ['10:00', '14:00', '16:30'];
    setSelectedDay(days[0]);
    setSelectedTime(times[0]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-6 md:py-8 pb-24 md:pb-16 flex flex-col gap-6 relative">
      
      {/* 1. Welcome Header */}
      <header className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 bg-gradient-to-br from-[#e8f5e9] to-[#d5e5d6] rounded-3xl p-5 sm:p-6 border-2 border-[#8ee294]/60 shadow-md relative">
        {/* Admin Edit Button */}
        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'dashboardHeader', title: lang === 'ar' ? 'قسم الترحيب والإحصائيات' : 'En-tête de bienvenue' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}

        <div className="flex items-center gap-4 text-center sm:text-left rtl:sm:text-right w-full sm:w-auto flex-col sm:flex-row">
          <div className="relative group shrink-0">
            <div
              onClick={() => {
                if (canEditStudentAvatar) setIsAvatarModalOpen(true);
              }}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center relative ${
                canEditStudentAvatar ? 'cursor-pointer hover:ring-4 hover:ring-[#4221b6]/40 transition-all' : ''
              }`}
              title={
                canEditStudentAvatar
                  ? (lang === 'ar' ? 'تغيير صورة هذا التلميذ (خاص بالمعلمة والإدارة)' : "Changer l'avatar de cet élève (Admin & Maîtresse)")
                  : undefined
              }
            >
              <img
                alt={user?.childName || "Avatar de l'élève"}
                className="w-full h-full object-cover"
                src={user?.picture || DEFAULT_STUDENT_AVATAR}
                onError={(e) => {
                  e.target.src = DEFAULT_STUDENT_AVATAR;
                }}
              />
              {canEditStudentAvatar && (
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl">photo_camera</span>
                  <span className="text-[9px] font-black text-center leading-tight">
                    {lang === 'ar' ? 'تعديل' : 'Modifier'}
                  </span>
                </div>
              )}
            </div>

            {canEditStudentAvatar && (
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                title={lang === 'ar' ? 'تغيير صورة هذا التلميذ' : 'Changer la photo de cet élève'}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#4221b6] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer border border-white"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
              </button>
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c0576] mb-1">
              {user?.childName
                ? (lang === 'ar' ? `مرحباً بك يا ${user.childName} ! 🌟` : `Bienvenue, ${user.childName} ! 🌟`)
                : (t.dashboardPage?.welcome || 'Bienvenue sur votre espace !')}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              {lang === 'ar' ? 'واصل التعلم وحضور الحصص التفاعلية واجمع النجوم !' : (t.dashboardPage?.welcomeSub || 'Prêt pour une nouvelle aventure d\'apprentissage ?')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
          <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-200 shadow-sm min-w-[95px]">
            <span className="material-symbols-outlined text-[#fdd34d] text-2xl mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-extrabold text-lg text-slate-800">128</span>
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">{t.dashboardPage?.starsLabel || 'Étoiles'}</span>
          </div>
          <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-200 shadow-sm min-w-[95px]">
            <span className="material-symbols-outlined text-[#4221b6] text-2xl mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="font-extrabold text-lg text-slate-800">{sessions.length}</span>
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">{lang === 'ar' ? 'حصص' : 'Séances'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 2. Next Session Section (With REAL Dynamic Data & Booking CTA) */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#8c90f6]/40 shadow-md relative overflow-hidden">
            {/* Admin Edit Button */}
            {user?.role?.toLowerCase() === 'admin' && (
              <button
                onClick={() => setEditingSectionModal({ key: 'nextSession', title: lang === 'ar' ? 'قسم الجلسة القادمة' : 'Prochaine session' })}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
              </button>
            )}

            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#1c0576]">
                    {lang === 'ar' ? 'الحصص المحجوزة' : (t.dashboardPage?.nextSession || 'Mes séances programmées')}
                  </h2>
                  {sessions.filter(s => s.status !== 'completed' && s.status !== 'done').length > 0 && (
                    <span className="text-xs text-slate-500 font-bold">
                      {lang === 'ar'
                        ? `${sessions.filter(s => s.status !== 'completed' && s.status !== 'done').length} حصص مسجلة`
                        : `${sessions.filter(s => s.status !== 'completed' && s.status !== 'done').length} séance(s) enregistrée(s)`}
                    </span>
                  )}
                </div>
              </div>

              {/* Book session button */}
              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#4221b6] to-[#5d35e0] text-white px-4 py-2 rounded-full font-bold text-xs shadow-md hover:scale-105 transition-all cursor-pointer border border-white/20"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>{lang === 'ar' ? 'طلب باقة حصص' : 'Demander des séances'}</span>
              </button>
            </div>

            {loadingSessions ? (
              <div className="flex flex-col gap-4">
                <SessionCardSkeleton />
                <SessionCardSkeleton />
              </div>
            ) : sessions.length > 0 ? (
              /* REAL Sessions List Stacked Vertically */
              <div className="flex flex-col gap-4">
                {sessions
                  .filter(s => s.status !== 'completed' && s.status !== 'done')
                  .map((sessionItem, index) => {
                  const isActive = isSessionActive(sessionItem);
                  const sessionIdStr = String(sessionItem._id || sessionItem.id || index);
                  const isHighlighted = highlightedSessionId && (
                    sessionIdStr === String(highlightedSessionId) ||
                    String(sessionItem._id) === String(highlightedSessionId) ||
                    String(sessionItem.id) === String(highlightedSessionId)
                  );

                  return (
                    <div
                      id={`student_session_${sessionIdStr}`}
                      key={sessionItem._id || sessionItem.id || index}
                      className={`rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex flex-col gap-4 ${
                        isHighlighted
                          ? 'bg-gradient-to-br from-[#e8f5e9] via-[#f0fdf4] to-[#f5f3ff] border-emerald-500 ring-1 ring-emerald-400 shadow-md'
                          : 'bg-[#faf9f5] border-slate-200/80 hover:border-[#8c90f6]/60 shadow-sm'
                      }`}
                    >
                      {/* Highlight Notification Badge */}
                      {isHighlighted && (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black w-fit animate-pulse shadow-md border-2 border-white">
                          <span className="material-symbols-outlined text-base">videocam</span>
                          <span>{lang === 'ar' ? 'تمت إضافة رابط الحصة حديثاً ! جاهز للدخول 🟢' : 'Lien Google Meet prêt pour cette séance ! 🟢'}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-col gap-1.5">
                          {/* Session Number & Status Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black bg-[#4221b6] text-white px-3 py-0.5 rounded-full shadow-sm">
                              {lang === 'ar' ? `الحصة ${index + 1}` : `Séance ${index + 1}`}
                            </span>

                            <span className="text-xs font-black text-[#4221b6] uppercase tracking-wider bg-[#e0d7ff] px-2.5 py-0.5 rounded-full">
                              {sessionItem.day || (lang === 'ar' ? 'موعد الحصة' : 'Date séance')}
                            </span>

                            {sessionItem.status === 'completed' || sessionItem.status === 'done' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                <span>{lang === 'ar' ? 'الحصة مكتملة ✅' : 'Séance Complétée ✅'}</span>
                              </span>
                            ) : sessionItem.meetUrl ? (
                              isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full animate-pulse border border-emerald-300">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                  <span>{lang === 'ar' ? 'الحصة جارية الآن 🔴' : 'En direct • Prêt !'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4221b6] bg-[#e0d7ff] px-2.5 py-0.5 rounded-full border border-[#8c90f6]/30">
                                  <span className="material-symbols-outlined text-xs">lock</span>
                                  <span>{lang === 'ar' ? 'رابط الحصة جاهز (مقفل)' : 'Lien prêt (Verrouillé)'}</span>
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                <span>{lang === 'ar' ? 'في انتظار الرابط' : 'En attente du lien'}</span>
                              </span>
                            )}
                          </div>

                          <span className="text-lg sm:text-xl font-black text-slate-800 pt-1">
                            {sessionItem.time || sessionItem.datetime || '14:00'}
                          </span>

                          <span className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-[#4221b6]">school</span>
                            <span>{getTeacherSubjectForSession(sessionItem, index)}</span>
                          </span>

                          <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-emerald-600">person</span>
                            <span>{lang === 'ar' ? 'المعلمة:' : 'Maîtresse :'} <strong>{sessionItem.teacherName || 'Olfa'}</strong></span>
                          </span>
                        </div>

                        {/* Right Date Card */}
                        <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-[#e8f5e9] rounded-2xl border border-[#8ee294] min-w-[140px] w-full sm:w-auto text-center shrink-0">
                          <span className="text-sm font-black text-[#2e7d32]">{sessionItem.day || 'Jour'}</span>
                          <span className="text-lg font-black text-slate-800">{sessionItem.time || '14:00'}</span>
                          <span className="text-[10px] font-bold text-slate-600 mt-0.5">
                            {sessionItem.meetUrl
                              ? (isActive
                                  ? (lang === 'ar' ? 'الحصة بدأت 🔴' : 'En direct')
                                  : (lang === 'ar' ? 'الرابط مضاف (مغلق)' : 'Lien prêt (Verrouillé)'))
                              : (lang === 'ar' ? 'طلب مسجل' : 'Demande enregistrée')}
                          </span>
                        </div>
                      </div>

                      {/* Google Meet Button for this specific session */}
                      {sessionItem.meetUrl ? (
                        isActive ? (
                          <a
                            href={sessionItem.meetUrl.startsWith('http') ? sessionItem.meetUrl : `https://${sessionItem.meetUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-[50px] rounded-2xl bg-gradient-to-r from-[#4221b6] via-[#5d35e0] to-[#2e7d32] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-95 transition-transform cursor-pointer border-2 border-white/40 animate-pulse"
                          >
                            <span className="material-symbols-outlined text-xl text-[#78fd7d]">videocam</span>
                            <span>{lang === 'ar' ? `الحصة ${index + 1} بدأت الآن ! الدخول عبر Google Meet 🔴` : `Séance ${index + 1} en direct ! Rejoindre Google Meet 🔴`}</span>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="w-full h-[50px] rounded-2xl bg-[#ede7f6] border-2 border-[#8c90f6]/60 text-[#1c0576] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-sm px-4 text-center"
                          >
                            <span className="material-symbols-outlined text-base text-[#4221b6]">lock_clock</span>
                            <span>
                              {lang === 'ar'
                                ? `رابط الحصة ${index + 1} مضاف 🔒 يفتح في موعد الحصة (${sessionItem.day || ''} الساعة ${sessionItem.time || ''})`
                                : `Lien Séance ${index + 1} prêt 🔒 Accessible à l'heure du cours (${sessionItem.day || ''} à ${sessionItem.time || ''})`}
                            </span>
                          </button>
                        )
                      ) : (
                        <button
                          disabled
                          className="w-full h-[50px] rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200"
                        >
                          <span className="material-symbols-outlined text-base">hourglass_top</span>
                          <span>{lang === 'ar' ? `سيتم إضافة رابط الحصة ${index + 1} قريباً من طرف المعلمة` : `Le lien Google Meet de la séance ${index + 1} sera ajouté par la maîtresse`}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* EMPTY STATE: When NO session exists */
              <div className="bg-[#faf9f5] rounded-3xl p-6 sm:p-8 border-2 border-dashed border-[#8c90f6]/50 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-3xl">event_available</span>
                </div>

                <div className="max-w-md space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1c0576]">
                    {lang === 'ar' ? 'لا توجد لديك أي حصص محجوزة حالياً' : 'Aucune séance réservée pour le moment'}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {lang === 'ar'
                      ? 'يمكنك حجز حصة مخصصة لطفلك مع إحدى معلماتنا المتميزات لاختيار اليوم والتوقيت المناسب !'
                      : 'Réservez dès maintenant une séance personnalisée en direct avec l\'une de nos maîtresses qualifiées !'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(true)}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#4221b6] to-[#5d35e0] text-white font-extrabold text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-white/20"
                >
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  <span>{lang === 'ar' ? 'طلب حصة الآن' : 'Demander une séance maintenant'}</span>
                </button>
              </div>
            )}
          </section>

          {/* 3. Favorite Games Section */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200/80 shadow-md relative">
            {/* Admin Edit Button */}
            {user?.role?.toLowerCase() === 'admin' && (
              <button
                onClick={() => setEditingSectionModal({ key: 'favGames', title: lang === 'ar' ? 'قسم الألعاب المفضلة' : 'Jeux préférés' })}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
              </button>
            )}

            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>extension</span>
                </div>
                <h2 className="text-lg font-extrabold text-[#1c0576]">{t.dashboardPage?.favGames || 'Jeux préférés'}</h2>
              </div>

              <button
                type="button"
                onClick={() => navigate('/games')}
                className="text-xs font-bold text-[#4221b6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{lang === 'ar' ? 'عرض كل الألعاب' : 'Tous les jeux'}</span>
                <span className="material-symbols-outlined text-sm">{isRtl ? 'chevron_left' : 'chevron_right'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div
                onClick={() => navigate('/games')}
                className="bg-[#faf9f5] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group"
              >
                <div
                  className="bg-cover bg-center w-full h-28 bg-mint-light flex items-center justify-center group-hover:scale-105 transition-transform"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDzuRs0pFbGVwxTt3j5riDMCsuB1x3srf18xEDGCz-SSMi5zdm7SojyIVdFaFUG9F-_X2HEEPrU3S-vkdhtT3FA4QutZ2qA6gZfuWsKo5gnah2V96C2LiQkB_sBX90HFNK3ZFslBnYqCElPTW19WHWWshdMrqVInxUpTylwEqHxabVlY61Eu7qS2MO0LgwfG-RYFJ-J7QRuNQDKuW_CPxHgpTd2MOdr1MZaEtQ3aj9QG2KJuo7H9byR')" }}
                ></div>
                <div className="p-3">
                  <h3 className="font-bold text-slate-800 text-center text-xs group-hover:text-[#4221b6] transition-colors">{t.dashboardPage?.game1 || 'Mots Magiques'}</h3>
                </div>
              </div>

              <div
                onClick={() => navigate('/games')}
                className="bg-[#faf9f5] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group"
              >
                <div
                  className="bg-cover bg-center w-full h-28 bg-primary-fixed flex items-center justify-center group-hover:scale-105 transition-transform"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC9IzifuNKYW8_mSzhIjofm7CfVbELS2s_zKIupOEGi-zvyT2x2pfeLkqEkKYp9JHcSE4wlHxEfE7iET-Oi0ucNYCIK7nHHqOUj2iuqxA2aJDtt5zeM3p1AtXYfBfyxNsEd-ph8o8Iz6CZ3DIzjo4dex8E6RPORhSOx-79iaXCWoMkf_TGp1SxwZGdk5iUo6M9tn_emfX53R0tjPx-bet8RSo6tpv-635bRWDTY9C_FesRa0cavxdaB')" }}
                ></div>
                <div className="p-3">
                  <h3 className="font-bold text-slate-800 text-center text-xs group-hover:text-[#4221b6] transition-colors">{t.dashboardPage?.game2 || 'La Phrase Folle'}</h3>
                </div>
              </div>

              <div
                onClick={() => navigate('/games')}
                className="bg-[#faf9f5] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group sm:col-span-2 md:col-span-1"
              >
                <div
                  className="bg-cover bg-center w-full h-28 bg-secondary-fixed flex items-center justify-center group-hover:scale-105 transition-transform"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDJBHHnF9BYNgScgIcFM6Q30rnhIRUTqdlB2djG2ChbqV3x79iEv07-M4aKYCB_0SsdDIUiZ9Yg3IXC3K90cJUhVqf2cAQQ5YWMxCYoZ4Xo64_PD0To5fyrQuAlGYwDoRB8D_yaySOK6CCfuUGLMD7a1ClS6nFZfFvZQLC_NbRBYShb1kbJCjljjM_AoYL1i64_XN1MX4rSt9fL1dJKpKbTnRRwodz-Qt7qjQUyGJ0XJuPqcCJGXe9w')" }}
                ></div>
                <div className="p-3">
                  <h3 className="font-bold text-slate-800 text-center text-xs group-hover:text-[#4221b6] transition-colors">{t.dashboardPage?.game3 || 'Quiz Images'}</h3>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 4. Sidebar Section */}
        <aside className="flex flex-col gap-6">


        </aside>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: BOOK A SESSION WITH AVAILABLE TEACHERS                          */}
      {/* ========================================================================= */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto border-2 border-[#4221b6]">

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-2xl">school</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1c0576]">
                    {lang === 'ar' ? 'اختر معلمتك المفضلة' : 'Choisissez votre maîtresse'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === 'ar'
                      ? 'انقر على المعلمة لعرض مواعيدها وحجز حصتك مباشرةً'
                      : 'Cliquez sur une maîtresse pour voir ses créneaux et réserver votre séance.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Teacher Cards Grid */}
            {availableTeachers.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-bold">
                {lang === 'ar' ? 'لا توجد معلمات متاحة حالياً' : 'Aucune maîtresse disponible pour le moment.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableTeachers.map((teacher, tIdx) => (
                  <div
                    key={teacher.id || tIdx}
                    onClick={() => {
                      setIsBookModalOpen(false);
                      navigate(`/calendar?teacherId=${encodeURIComponent(teacher.teacherId || teacher.id || '')}&teacher=${encodeURIComponent(teacher.name || '')}`);
                    }}
                    className="group p-4 rounded-2xl border-2 border-slate-200 bg-[#faf9f5] hover:border-[#4221b6] hover:bg-[#e0d7ff]/30 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-4"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={teacher.img}
                        alt={teacher.name}
                        className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white group-hover:border-[#4221b6]/30 transition-all"
                      />
                      <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#4221b6] transition-colors truncate">
                        {teacher.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug mt-0.5">
                        {teacher.desc}
                      </p>


                    </div>

                    {/* Arrow */}
                    <span className="material-symbols-outlined text-[#4221b6] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0">
                      {isRtl ? 'chevron_left' : 'chevron_right'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer hint */}
            <p className="text-center text-[11px] text-slate-400 font-medium border-t border-slate-100 pt-3">
              {lang === 'ar'
                ? '📅 ستنتقل إلى صفحة تقويم المعلمة لاختيار موعدك والتأكيد'
                : '📅 Vous serez redirigé vers le calendrier de la maîtresse pour finaliser votre réservation.'}
            </p>

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

      {/* Change Student Avatar Modal (Admin & Maîtresse privilege) */}
      {isAvatarModalOpen && user && (
        <ChangeStudentAvatarModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          student={user}
        />
      )}
    </div>
  );
}

