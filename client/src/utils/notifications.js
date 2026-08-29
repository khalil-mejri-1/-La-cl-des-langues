// Notification sound removed per user request
export const playNotificationSound = () => {};

/**
 * Creates and broadcasts a real-time notification across tabs and components
 */
export const createNotification = (notif) => {
  try {
    const id = notif.id || `notif_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const timestamp = notif.timestamp || new Date().toISOString();

    const fullNotif = {
      id,
      timestamp,
      type: notif.type, // 'NEW_SESSION_REQUEST' | 'MEET_LINK_ADDED' | 'NEW_USER_REGISTERED'
      targetRoles: notif.targetRoles || [], // ['admin', 'maitresse'] etc.
      targetTeacherId: notif.targetTeacherId ? String(notif.targetTeacherId) : '',
      targetTeacherEmail: (notif.targetTeacherEmail || '').toLowerCase().trim(),
      targetTeacherName: notif.targetTeacherName || '',
      targetStudentId: notif.targetStudentId ? String(notif.targetStudentId) : '',
      targetStudentEmail: (notif.targetStudentEmail || '').toLowerCase().trim(),
      title: notif.title || { fr: 'Notification', ar: 'إشعار', en: 'Notification' },
      desc: notif.desc || { fr: '', ar: '', en: '' },
      icon: notif.icon || 'notifications',
      iconBg: notif.iconBg || 'bg-purple-100 text-purple-700',
      link: notif.link || '',
      meta: notif.meta || {},
    };

    // 1. Store in localStorage
    const existing = JSON.parse(localStorage.getItem('app_unified_notifications') || '[]');
    const updated = [fullNotif, ...existing.filter(item => item.id !== id)].slice(0, 80);
    localStorage.setItem('app_unified_notifications', JSON.stringify(updated));

    // 2. BroadcastChannel for cross-tab real-time sync
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('app_sessions_channel');
        bc.postMessage({ type: 'NOTIFICATION_CREATED', notification: fullNotif });
        bc.close();
      }
    } catch {}

    // 3. Dispatch CustomEvent & StorageEvent for same-tab & cross-tab immediate updates
    window.dispatchEvent(new CustomEvent('app_notification', { detail: fullNotif }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'app_unified_notifications',
      newValue: JSON.stringify(updated),
    }));

    return fullNotif;
  } catch (err) {
    console.error('Erreur createNotification:', err);
  }
};

/**
 * Synthesizes database sessions into structured notifications for teachers, admins, and students
 */
export const syncSessionsToNotifications = (sessions = [], user = null) => {
  if (!user || !Array.isArray(sessions) || sessions.length === 0) return [];

  const userId = String(user.id || user._id || '').trim();
  const userEmail = (user.email || '').toLowerCase().trim();
  const userName = (user.parentName || user.name || userEmail.split('@')[0] || '').toLowerCase().trim();

  const roleVal = user.role || user.roles || '';
  const roleStr = Array.isArray(roleVal) ? roleVal.join(' ').toLowerCase() : String(roleVal).toLowerCase();
  const isAdmin = user.isAdmin === true || roleStr.includes('admin');
  const isMaitresse = roleStr.includes('maitresse') || roleStr.includes('teacher') || roleStr.includes('maître');

  const synthesized = [];

  sessions.forEach((s, idx) => {
    const sId = String(s._id || s.id || `sess_${idx}`);
    const sTeacherId = String(s.teacherId || '').trim();
    const sTeacherEmail = (s.teacherEmail || '').toLowerCase().trim();
    const sTeacherName = (s.teacherName || '').toLowerCase().trim();
    const sStudentId = String(s.studentId || '').trim();
    const sStudentEmail = (s.studentEmail || '').toLowerCase().trim();
    const studentDisplayName = s.studentName || s.childName || s.parentName || 'Élève';
    const teacherDisplayName = s.teacherName || 'Maîtresse';
    const timeInfo = s.day ? `${s.day} à ${s.time || '14:00'}` : (s.datetime || 'Date prévue');

    const isMyTeacherSession = isMaitresse && (
      (sTeacherId && userId && sTeacherId === userId) ||
      (sTeacherEmail && userEmail && sTeacherEmail === userEmail) ||
      (sTeacherName && userName && (sTeacherName.includes(userName) || userName.includes(sTeacherName)))
    );

    const isMyStudentSession = (
      (sStudentId && userId && sStudentId === userId) ||
      (sStudentEmail && userEmail && sStudentEmail === userEmail)
    );

    // 1. If teacher or admin -> course request notification
    if (isAdmin || isMyTeacherSession) {
      synthesized.push({
        id: `sess_req_${sId}`,
        type: 'NEW_SESSION_REQUEST',
        targetRoles: ['admin', 'maitresse'],
        targetTeacherId: sTeacherId,
        targetTeacherEmail: sTeacherEmail,
        targetTeacherName: teacherDisplayName,
        targetStudentId: sStudentId,
        targetStudentEmail: sStudentEmail,
        title: {
          fr: `📩 Demande de cours`,
          ar: `📩 طلب حجز حصة`,
          en: `📩 Session Booking Request`,
        },
        desc: {
          fr: `L'élève ${studentDisplayName} a réservé pour le ${timeInfo} avec ${teacherDisplayName}.`,
          ar: `طلب التلميذ ${studentDisplayName} حصة ليوم ${timeInfo} مع ${teacherDisplayName}.`,
          en: `Student ${studentDisplayName} booked for ${timeInfo} with ${teacherDisplayName}.`,
        },
        icon: 'calendar_month',
        iconBg: 'bg-[#e0d7ff] text-[#4221b6]',
        link: '/admin',
        timestamp: s.createdAt || s.updatedAt || new Date().toISOString(),
        meta: {
          sessionId: sId,
          studentName: studentDisplayName,
          teacherName: teacherDisplayName,
        },
      });
    }

    // 2. If student -> meet link notification when link is ready
    if (isMyStudentSession && (s.meetUrl || s.status === 'meet_added')) {
      synthesized.push({
        id: `meet_link_${sId}`,
        type: 'MEET_LINK_ADDED',
        targetStudentId: sStudentId,
        targetStudentEmail: sStudentEmail,
        targetTeacherName: teacherDisplayName,
        title: {
          fr: `🔗 Lien Google Meet prêt !`,
          ar: `🔗 رابط Google Meet جاهز !`,
          en: `🔗 Google Meet link ready!`,
        },
        desc: {
          fr: `La maîtresse ${teacherDisplayName} a ajouté le lien pour votre séance du ${timeInfo}.`,
          ar: `أضافت المعلمة ${teacherDisplayName} رابط حصتك ليوم ${timeInfo}.`,
          en: `${teacherDisplayName} added the link for your session on ${timeInfo}.`,
        },
        icon: 'videocam',
        iconBg: 'bg-emerald-100 text-emerald-700',
        link: '/dashboard',
        timestamp: s.updatedAt || s.createdAt || new Date().toISOString(),
        meta: {
          sessionId: sId,
          meetUrl: s.meetUrl,
        },
      });
    }
  });

  return synthesized;
};

/**
 * Filters all notifications to only those relevant to the currently logged in user
 */
export const filterNotificationsForUser = (allNotifs = [], user = null) => {
  if (!user || !Array.isArray(allNotifs)) return [];

  const userId = String(user.id || user._id || '').trim();
  const userEmail = (user.email || '').toLowerCase().trim();
  const userName = (user.parentName || user.name || userEmail.split('@')[0] || '').toLowerCase().trim();

  // Role detection
  const roleVal = user.role || user.roles || '';
  const roleStr = Array.isArray(roleVal) ? roleVal.join(' ').toLowerCase() : String(roleVal).toLowerCase();
  const isAdmin = user.isAdmin === true || roleStr.includes('admin');
  const isMaitresse = roleStr.includes('maitresse') || roleStr.includes('teacher') || roleStr.includes('maître');

  return allNotifs.filter(n => {
    // 1. Admin receives all new user registrations and all session bookings
    if (isAdmin) {
      if (n.type === 'NEW_USER_REGISTERED') return true;
      if (n.type === 'NEW_SESSION_REQUEST') return true;
      if (n.targetRoles && n.targetRoles.includes('admin')) return true;
    }

    // 2. Maitresse (Teacher) receives session bookings requested specifically for her
    if (isMaitresse && n.type === 'NEW_SESSION_REQUEST') {
      const targetTId = String(n.targetTeacherId || '').trim();
      const targetTEmail = (n.targetTeacherEmail || '').toLowerCase().trim();
      const targetTName = (n.targetTeacherName || '').toLowerCase().trim();

      if (targetTId && userId && targetTId === userId) return true;
      if (targetTEmail && userEmail && targetTEmail === userEmail) return true;
      if (targetTName && userName && (targetTName === userName || userName.includes(targetTName) || targetTName.includes(userName))) return true;
      return false;
    }

    // 3. Student receives ONLY notifications meant for students (e.g. Meet links added for their sessions)
    if (n.type === 'MEET_LINK_ADDED') {
      const targetSId = String(n.targetStudentId || '').trim();
      const targetSEmail = (n.targetStudentEmail || '').toLowerCase().trim();

      if (targetSId && userId && targetSId === userId) return true;
      if (targetSEmail && userEmail && targetSEmail === userEmail) return true;
      return false;
    }

    return false;
  });
};
