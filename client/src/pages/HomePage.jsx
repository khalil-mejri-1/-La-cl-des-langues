import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import VideoModal from '../components/VideoModal';
import EditSectionModal from '../components/EditSectionModal';
import ManageTutorsModal from '../components/ManageTutorsModal';
import { API_BASE_URL } from '../config';
import { createNotification } from '../utils/notifications';
import useGoogleAuth from '../hooks/useGoogleAuth';

export default function HomePage() {
  const { lang, t, isRtl } = useLanguage();
  const { user, isLoggedIn, loginUser } = useAuth();
  const navigate = useNavigate();

  // Check if user role contains 'admin' (e.g. 'admin', 'admin, maitresse', ['admin', 'maitresse'])
  const isAdmin = (() => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const r = user.role || user.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('admin');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('admin'));
    return false;
  })();

  const [authMode, setAuthMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [editingSectionModal, setEditingSectionModal] = useState(null); // { key, title }
  const [isManageTutorsOpen, setIsManageTutorsOpen] = useState(false);

  // Form Fields State
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('5 ans');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { triggerGoogleSignIn } = useGoogleAuth({
    loginUser,
    onSuccess: (userObj) => {
      setGoogleLoading(false);
      if (userObj?.role?.toLowerCase()?.includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    },
    onError: (msg) => {
      setGoogleLoading(false);
      setErrorMsg(msg);
    },
  });

  const handleGoogleClick = () => {
    setGoogleLoading(true);
    setErrorMsg('');
    triggerGoogleSignIn();
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = authMode === 'signup'
      ? `${API_BASE_URL}/api/auth/signup`
      : `${API_BASE_URL}/api/auth/login`;

    const payload = authMode === 'signup'
      ? { parentName, childName, childAge, email, password }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l’authentification.');
      }

      loginUser(data.user);
      if (authMode === 'signup') {
        createNotification({
          type: 'NEW_USER_REGISTERED',
          targetRoles: ['admin'],
          title: {
            fr: `👤 Nouveau compte client inscrit !`,
            ar: `👤 تسجيل حساب مستخدم جديد !`,
            en: `👤 New user account registered!`,
          },
          desc: {
            fr: `${payload.parentName || payload.email} vient de créer son compte (Enfant: ${payload.childName || 'Non spécifié'}).`,
            ar: `قام ${payload.parentName || payload.email} بإنشاء حسابه الآن (الطفل: ${payload.childName || 'غير محدد'}).`,
            en: `${payload.parentName || payload.email} just registered (Child: ${payload.childName || 'Not specified'}).`,
          },
          icon: 'person_add',
          iconBg: 'bg-blue-100 text-blue-700',
          link: '/admin',
          meta: {
            email: payload.email,
            parentName: payload.parentName,
            childName: payload.childName,
          },
        });
        navigate('/');
      } else if (checkIsAdminUser(data.user)) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  function checkIsAdminUser(userObj) {
    if (!userObj) return false;
    if (userObj.isAdmin === true) return true;
    const r = userObj.role || userObj.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('admin');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('admin'));
    return false;
  }

  return (
    <>
      {/* 1. Top Hero Section */}
      <section className="w-full bg-[#FAF8F5] py-10 md:py-16 px-container-margin overflow-hidden relative border-b border-surface-variant/40">
        {/* Admin Edit Button for Hero Section */}
        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'hero', title: lang === 'ar' ? 'قسم الهيرو والترحيب' : 'Section Hero' })}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-1.5 bg-[#4221b6] text-white px-3.5 py-2 rounded-full font-black text-xs shadow-xl hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}


        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Side: Information & Tutors */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left rtl:text-right">
            {/* Tag Pill */}
            <div className="inline-flex items-center gap-2 bg-[#EAF5EA] text-[#3B5E35] px-4 py-1.5 rounded-full font-label-bold text-xs font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-[#3B5E35]"></span>
              {t.hero?.tag}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#2C3E2E] leading-tight tracking-tight">
              {t.hero?.title}
            </h1>

            {/* Subtitle */}
            <p className="text-body-lg font-body-lg text-[#5A6E5E] max-w-2xl leading-relaxed">
              {t.hero?.subtitle}
            </p>

            {/* If Logged In: Welcome Action Banner */}
            {isLoggedIn && (
              <div className="bg-gradient-to-r from-[#e0d7ff] to-[#b0fdb5] p-5 rounded-3xl border-2 border-[#8c90f6] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 my-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#4221b6] text-white flex items-center justify-center text-xl font-black shadow-sm shrink-0">
                    {t.hero?.welcomeEmoji || '👨‍👩‍👧'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1c0576]">
                      {(t.hero?.welcomePrefix !== undefined ? t.hero.welcomePrefix : (lang === 'ar' ? 'مرحباً بك، ' : lang === 'en' ? 'Welcome, ' : 'Bienvenue, '))}
                      {user?.parentName || (lang === 'ar' ? 'عزيزي الولي' : lang === 'en' ? 'Dear Parent' : 'Cher Parent')} !
                    </h3>
                    <p className="text-xs text-[#0d4013] font-medium mt-0.5">
                      {(t.hero?.childSpacePrefix !== undefined ? t.hero.childSpacePrefix : (lang === 'ar' ? 'حساب طفلك: ' : lang === 'en' ? "Child's space: " : 'Espace de votre enfant: '))}
                      {user?.childName || (lang === 'ar' ? 'المتعلم' : lang === 'en' ? 'Learner' : 'Élève')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/parent')}
                  className="px-5 py-2.5 rounded-full bg-[#4221b6] text-white font-bold text-xs shadow-md hover:scale-105 transition-transform shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{t.hero?.welcomeBtn || t.nav?.parent || (lang === 'ar' ? 'فضاء الولي' : 'Espace Parent')}</span>
                  <span className="material-symbols-outlined text-sm">{isRtl ? 'arrow_back' : 'arrow_forward'}</span>
                </button>
              </div>
            )}


            {/* 3 Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {t.hero?.features?.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-surface-variant/60">
                  <div className={`w-10 h-10 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined text-xl">{feat.icon}</span>
                  </div>
                  <span className="font-bold text-xs text-[#2C3E2E] leading-snug">{feat.text}</span>
                </div>
              ))}
            </div>

            {/* Nos Maîtresses Section */}
            <div className="pt-4 space-y-4 relative">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col items-start gap-1">
                  <h2 className="text-xl font-bold text-[#2C3E2E]">{t.hero?.tutorsTitle}</h2>
                  <div className="h-0.5 w-12 bg-[#3B5E35] rounded-full"></div>
                </div>

                {/* Admin Manage Tutors Button */}
                {isAdmin && (
                  <button
                    onClick={() => setIsManageTutorsOpen(true)}
                    className="flex items-center gap-1.5 bg-[#4221b6] text-white px-3.5 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border border-white/40 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                    <span>{lang === 'ar' ? 'إدارة كروت المعلمات' : 'Gérer les maîtresses'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {t.hero?.tutors?.map((tutor, idx) => {
                  const targetQuery = tutor.teacherId
                    ? `teacherId=${tutor.teacherId}&teacher=${encodeURIComponent(tutor.name || '')}`
                    : `teacher=${encodeURIComponent(tutor.name || '')}`;
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(`/calendar?${targetQuery}`)}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-surface-variant/60 flex flex-col items-center text-center gap-2 hover:shadow-xl hover:border-[#4221b6] hover:scale-[1.03] transition-all cursor-pointer group relative overflow-hidden"
                      title={lang === 'ar' ? `حجز حصة مع ${tutor.name}` : `Réserver avec ${tutor.name}`}
                    >
                      <div className="relative">
                        <img
                          src={tutor.img}
                          alt={tutor.name}
                          className="w-20 h-24 object-cover rounded-xl shadow-inner group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#4221b6] text-white flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-xs">calendar_month</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#2C3E2E] group-hover:text-[#4221b6] transition-colors mt-1">
                        {tutor.name}
                      </h3>
                      <p className="text-[11px] text-[#5A6E5E] leading-relaxed line-clamp-3">
                        {tutor.desc}
                      </p>
                      
                      {/* Booking CTA chip */}
                      <div className="mt-auto pt-2 w-full flex items-center justify-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4221b6] bg-[#e0d7ff]/60 group-hover:bg-[#4221b6] group-hover:text-white px-3 py-1 rounded-full transition-all">
                          <span className="material-symbols-outlined text-xs">event_available</span>
                          <span>{lang === 'ar' ? 'عرض المواعيد والحجز' : 'Voir les créneaux'}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Auth Card OR Video Card (WHEN LOGGED IN) */}
          <div className="lg:col-span-5 w-full">
            {isLoggedIn ? (
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-[#8c90f6] flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3">
                  <div className="inline-flex items-center gap-2 bg-[#E1F5FE] text-[#0288D1] px-3.5 py-1 rounded-full font-bold text-xs">
                    <span className="material-symbols-outlined text-base">play_circle</span>
                    {t.homePage?.videoTag || 'Démonstration vidéo'}
                  </div>
                  <span className="text-xs font-bold text-[#4221b6] bg-[#e0d7ff] px-3 py-1 rounded-full">
                    {lang === 'ar' ? 'عرض توضيحي' : 'Vidéo Démo'}
                  </span>
                </div>

                <div className="space-y-1 text-left rtl:text-right">
                  <h3 className="text-lg font-extrabold text-[#2C3E2E]">
                    {t.homePage?.videoTitle || 'Découvrez notre méthode en vidéo'}
                  </h3>
                  <p className="text-xs text-[#5A6E5E] leading-relaxed font-medium">
                    {t.homePage?.videoDesc || 'Regardez comment nos maîtresses certifiées accompagnent vos enfants vers le succès.'}
                  </p>
                </div>

                <div className="w-full relative rounded-2xl overflow-hidden border-2 border-surface-variant group cursor-pointer aspect-video shadow-md mt-1">
                  <img
                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80"
                    alt="Video Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <button
                      onClick={() => setIsVideoOpen(true)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#4221b6] text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer border-4 border-white"
                    >
                      <span className="material-symbols-outlined text-3xl sm:text-4xl ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsVideoOpen(true)}
                  className="w-full py-3 rounded-full bg-[#4221b6] text-white font-bold text-xs shadow-md hover:bg-[#341a99] transition-colors cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  <span>{lang === 'ar' ? 'شاهد الفيديو التوضيحي الآن' : 'Regarder la vidéo démo'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-surface-variant/80 flex flex-col gap-5">
                <div className="bg-[#F4F1EA] p-1.5 rounded-full border border-surface-variant/50 flex">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                    className={`flex-1 py-3 rounded-full font-bold text-xs transition-all cursor-pointer ${authMode === 'login'
                      ? 'bg-[#4221b6] text-white shadow-md'
                      : 'text-[#5A6E5E] hover:text-[#4221b6]'
                      }`}
                  >
                    {t.authPage?.loginTab}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
                    className={`flex-1 py-3 rounded-full font-bold text-xs transition-all cursor-pointer ${authMode === 'signup'
                      ? 'bg-[#4221b6] text-white shadow-md'
                      : 'text-[#5A6E5E] hover:text-[#4221b6]'
                      }`}
                  >
                    {t.authPage?.signupTab}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-2xl font-bold text-center">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4 text-left rtl:text-right">
                  {authMode === 'signup' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#2C3E2E] mb-1.5">
                          {t.authPage?.parentNameLabel}
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">person</span>
                          <input
                            type="text"
                            required
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            placeholder={t.authPage?.parentNamePlaceholder}
                            className="w-full h-12 pl-11 pr-4 rtl:pl-4 rtl:pr-11 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#2C3E2E] mb-1.5">
                            {t.authPage?.childNameLabel}
                          </label>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">mood</span>
                            <input
                              type="text"
                              required
                              value={childName}
                              onChange={(e) => setChildName(e.target.value)}
                              placeholder={t.authPage?.childNamePlaceholder}
                              className="w-full h-12 pl-11 pr-4 rtl:pl-4 rtl:pr-11 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#2C3E2E] mb-1.5">
                            {t.authPage?.childAgeLabel}
                          </label>
                          <select
                            value={childAge}
                            onChange={(e) => setChildAge(e.target.value)}
                            className="w-full h-12 px-4 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none cursor-pointer"
                          >
                            {t.authPage?.ageOptions?.map((opt, idx) => (
                              <option key={idx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#2C3E2E] mb-1.5">
                      {t.authPage?.emailLabel}
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">mail</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.authPage?.emailPlaceholder}
                        className="w-full h-12 pl-11 pr-4 rtl:pl-4 rtl:pr-11 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-[#2C3E2E]">
                        {t.authPage?.passwordLabel}
                      </label>
                      {authMode === 'login' && (
                        <a href="#" className="text-[11px] text-[#4221b6] font-bold hover:underline">
                          {t.authPage?.forgotPassword}
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">lock</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.authPage?.passwordPlaceholder}
                        className="w-full h-12 pl-11 pr-11 rtl:pl-11 rtl:pr-11 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-[#4221b6] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input type="checkbox" required id="hero-terms" className="w-4 h-4 rounded text-[#4221b6] focus:ring-[#4221b6] cursor-pointer" />
                      <label htmlFor="hero-terms" className="text-[11px] text-[#5A6E5E] cursor-pointer font-medium">
                        {t.authPage?.acceptTerms}
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[45px] min-h-[40px] rounded-full bg-[#4221b6] hover:bg-[#341a99] text-white font-bold text-base shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:shadow-lg disabled:opacity-50"
                  >
                    <span>{loading ? 'Chargement...' : (authMode === 'login' ? t.authPage?.submitLogin : t.authPage?.submitSignup)}</span>
                    <span className="material-symbols-outlined">{isRtl ? 'arrow_back' : 'arrow_forward'}</span>
                  </button>

                  <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-surface-variant/50"></div>
                    </div>
                    <span className="relative bg-white px-3 text-[11px] text-tertiary font-bold">OU</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={googleLoading}
                    className="w-full h-12 rounded-full border border-surface-variant/70 bg-[#F4F1EA] hover:bg-surface-container-low text-on-surface font-bold text-xs flex items-center justify-center gap-2.5 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait"
                  >
                    {googleLoading ? (
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-[#4285F4] rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                      </svg>
                    )}
                    <span>{googleLoading ? (t.authPage?.googleLoading || 'Connexion...') : t.authPage?.googleAuth}</span>
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-[11px] text-on-surface-variant">
                      {authMode === 'login' ? t.authPage?.noAccountText : t.authPage?.hasAccountText}{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setErrorMsg(''); }}
                        className="text-[#4221b6] font-bold underline cursor-pointer ml-1"
                      >
                        {authMode === 'login' ? t.authPage?.switchToSignup : t.authPage?.switchToLogin}
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Video Teaser Section */}
      <section className="w-full bg-gradient-to-br from-[#1c0576] via-[#2d0f8a] to-[#4221b6] py-16 md:py-24 px-container-margin relative overflow-hidden">
        {/* Admin Edit Button for Video Section */}
        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'videoSection', title: lang === 'ar' ? 'قسم الفيديو التوضيحي' : 'Section Vidéo Démo' })}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-1.5 bg-white text-[#4221b6] px-3.5 py-2 rounded-full font-black text-xs shadow-xl hover:scale-105 transition-all cursor-pointer border-2 border-[#4221b6]"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}

        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#78fd7d]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center gap-10">
          <div className="text-center space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider border border-white/20">
              <span className="material-symbols-outlined text-sm text-[#78fd7d]">play_circle</span>
              {t.homePage?.videoTag || (lang === 'ar' ? 'الفيديو التعريفي' : 'Présentation vidéo')}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {t.homePage?.videoTitle || (lang === 'ar' ? 'اكتشف طريقتنا الفريدة في التعليم' : 'Découvrez notre méthode unique en vidéo')}
            </h2>
            <p className="text-sm sm:text-base text-white/70 font-medium leading-relaxed">
              {t.homePage?.videoDesc || (lang === 'ar' ? 'شاهد كيف تساعد مدرساتنا المعتمدات أطفالك على تعلم الفرنسية بأسلوب مميز وممتع.' : 'Regardez comment nos maîtresses certifiées accompagnent vos enfants vers la maîtrise du français.')}
            </p>
          </div>

          <div className="w-full max-w-3xl">
            <div
              className="relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl group cursor-pointer aspect-video"
              onClick={() => setIsVideoOpen(true)}
            >
              <img
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80"
                alt="Video Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent group-hover:from-black/40 transition-all duration-500"></div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-white/30 animate-ping scale-125"></div>
                  <button
                    onClick={() => setIsVideoOpen(true)}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white text-[#4221b6] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-3xl sm:text-4xl md:text-5xl ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </button>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                2:45
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => setIsVideoOpen(true)}
              className="px-8 py-3.5 rounded-full bg-white text-[#4221b6] font-extrabold text-sm shadow-xl hover:shadow-white/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2.5"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              {t.homePage?.videoBtn || (lang === 'ar' ? 'شاهد الفيديو الآن' : lang === 'en' ? 'Watch now' : 'Regarder maintenant')}
            </button>

          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section className="w-full bg-white py-16 md:py-20 px-container-margin relative border-b border-surface-variant/40">
        {/* Admin Edit Button for How It Works Section */}
        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'howItWorks', title: lang === 'ar' ? 'قسم كيف تعمل المنصة' : 'Section Comment ça marche' })}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-1.5 bg-[#4221b6] text-white px-3.5 py-2 rounded-full font-black text-xs shadow-xl hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}

        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12 text-center">
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2C3E2E]">
              {t.howItWorks?.title || 'Comment ça marche ?'}
            </h2>
            <p className="text-sm sm:text-base text-[#5A6E5E] font-medium">
              {t.howItWorks?.subtitle || 'Un parcours simple pour commencer à apprendre.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {t.howItWorks?.steps?.map((step, idx) => (
              <div key={idx} className="bg-[#FAF8F5] p-6 rounded-3xl border border-surface-variant/60 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all duration-300 relative group">
                <div className="w-10 h-10 rounded-full bg-[#4221b6] text-white flex items-center justify-center font-black text-sm absolute -top-3 left-6 shadow-md">
                  {step.stepNum}
                </div>
                <div className={`w-16 h-16 rounded-2xl ${step.bgIcon} ${step.iconColor} flex items-center justify-center mt-3 shadow-inner`}>
                  <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                </div>
                <h3 className="font-extrabold text-lg text-[#2C3E2E]">{step.title}</h3>
                <p className="text-xs text-[#5A6E5E] leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Testimonials Section */}
      <section className="w-full bg-[#FAF8F5] py-16 md:py-20 px-container-margin relative border-b border-surface-variant/40">
        {/* Admin Edit Button for Testimonials Section */}
        {isAdmin && (
          <button
            onClick={() => setEditingSectionModal({ key: 'testimonials', title: lang === 'ar' ? 'قسم آراء الأولياء' : 'Section Témoignages' })}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-1.5 bg-[#4221b6] text-white px-3.5 py-2 rounded-full font-black text-xs shadow-xl hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}

        <div className="max-w-7xl mx-auto flex flex-col items-center gap-10 text-center">
          <div className="space-y-2 max-w-xl">
            <span className="material-symbols-outlined text-4xl text-[#FFD54F]">format_quote</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2C3E2E]">
              {t.Testimonials?.title || 'Ce que disent les parents'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {t.Testimonials?.list?.map((item) => (
              <div key={item.id} className="bg-white p-6 sm:p-7 rounded-3xl border border-surface-variant/60 shadow-sm flex flex-col justify-between gap-4 text-left rtl:text-right hover:shadow-md transition-shadow">
                <div className="flex gap-1 text-[#FFB300]">
                  {[...Array(item.stars)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#2C3E2E] font-semibold italic leading-relaxed">
                  {item.quote}
                </p>
                <span className="text-xs font-bold text-[#4221b6]">{item.author}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Trust Bar Section */}
      <section className="w-full bg-white py-10 px-container-margin border-b border-surface-variant/40">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-around items-center gap-6">
          {t.trustBar?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${item.color}`}>{item.icon}</span>
              <span className="font-extrabold text-xs sm:text-sm text-[#2C3E2E]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Video Modal */}
      {isVideoOpen && <VideoModal videoUrl={t.homePage?.videoUrl} onClose={() => setIsVideoOpen(false)} />}

      {/* Admin Section Edit Modal */}
      {editingSectionModal && (
        <EditSectionModal
          sectionKey={editingSectionModal.key}
          sectionTitle={editingSectionModal.title}
          onClose={() => setEditingSectionModal(null)}
        />
      )}

      {/* Admin Manage Tutors Cards Modal */}
      {isManageTutorsOpen && (
        <ManageTutorsModal onClose={() => setIsManageTutorsOpen(false)} />
      )}
    </>
  );
}
