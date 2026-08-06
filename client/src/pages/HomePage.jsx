import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import VideoModal from '../components/VideoModal';

export default function HomePage() {
  const { lang, t, isRtl } = useLanguage();
  const { user, isLoggedIn, loginUser } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Form Fields State
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('5 ans');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = authMode === 'signup' 
      ? 'http://localhost:5000/api/auth/signup' 
      : 'http://localhost:5000/api/auth/login';

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

      // Login User in Auth Context & LocalStorage
      loginUser(data.user);

      // Redirect to Parent Workspace
      navigate('/parent');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Top Hero Section */}
      <section class="w-full bg-[#FAF8F5] py-10 md:py-16 px-container-margin overflow-hidden relative border-b border-surface-variant/40">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Side: Information & Tutors */}
          <div class="lg:col-span-7 flex flex-col gap-6 text-left rtl:text-right">
            {/* Tag Pill */}
            <div class="inline-flex items-center gap-2 bg-[#EAF5EA] text-[#3B5E35] px-4 py-1.5 rounded-full font-label-bold text-xs font-bold w-fit">
              <span class="w-2 h-2 rounded-full bg-[#3B5E35]"></span>
              {t.hero.tag}
            </div>

            {/* Title */}
            <h1 class="text-3xl md:text-5xl font-extrabold text-[#2C3E2E] leading-tight tracking-tight">
              {t.hero.title}
            </h1>

            {/* Subtitle */}
            <p class="text-body-lg font-body-lg text-[#5A6E5E] max-w-2xl leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* If Logged In: Welcome Action Banner */}
            {isLoggedIn && (
              <div class="bg-gradient-to-r from-[#e0d7ff] to-[#b0fdb5] p-5 rounded-3xl border-2 border-[#8c90f6] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 my-1">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-[#4221b6] text-white flex items-center justify-center text-xl font-black shadow-sm shrink-0">
                    👨‍👩‍👧
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-[#1c0576]">
                      {lang === 'ar' ? `مرحباً بك، ${user?.parentName || 'عزيزي الولي'}!` : `Bienvenue, ${user?.parentName || 'Cher Parent'} !`}
                    </h3>
                    <p class="text-xs text-[#0d4013] font-medium mt-0.5">
                      {lang === 'ar' ? `حساب طفلك: ${user?.childName || 'المتعلم'}` : `Espace de votre enfant: ${user?.childName || 'Élève'}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/parent')}
                  class="px-5 py-2.5 rounded-full bg-[#4221b6] text-white font-bold text-xs shadow-md hover:scale-105 transition-transform shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{lang === 'ar' ? 'فضاء الأولياء' : 'Espace Parent'}</span>
                  <span class="material-symbols-outlined text-sm">{isRtl ? 'arrow_back' : 'arrow_forward'}</span>
                </button>
              </div>
            )}

            {/* 3 Feature Badges */}
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {t.hero.features.map((feat, idx) => (
                <div key={idx} class="flex items-center gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-surface-variant/60">
                  <div class={`w-10 h-10 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center shrink-0`}>
                    <span class="material-symbols-outlined text-xl">{feat.icon}</span>
                  </div>
                  <span class="font-bold text-xs text-[#2C3E2E] leading-snug">{feat.text}</span>
                </div>
              ))}
            </div>

            {/* Nos Maîtresses Section */}
            <div class="pt-4 space-y-4">
              <div class="flex flex-col items-start gap-1">
                <h2 class="text-xl font-bold text-[#2C3E2E]">{t.hero.tutorsTitle}</h2>
                <div class="h-0.5 w-12 bg-[#3B5E35] rounded-full"></div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {t.hero.tutors.map((tutor, idx) => (
                  <div key={idx} class="bg-white p-4 rounded-2xl shadow-sm border border-surface-variant/60 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
                    <img
                      src={tutor.img}
                      alt={tutor.name}
                      class="w-20 h-24 object-cover rounded-xl shadow-inner"
                    />
                    <h3 class="font-bold text-sm text-[#2C3E2E] mt-1">{tutor.name}</h3>
                    <p class="text-[11px] text-[#5A6E5E] leading-relaxed line-clamp-3">
                      {tutor.desc}
                    </p>
                    <span class="material-symbols-outlined text-xs text-[#3B5E35] mt-auto" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Auth Card OR Video Card (WHEN LOGGED IN) */}
          <div class="lg:col-span-5 w-full">
            {isLoggedIn ? (
              /* Video Card replaces Auth Card when logged in */
              <div class="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-[#8c90f6] flex flex-col gap-4">
                <div class="flex items-center justify-between border-b border-surface-variant/60 pb-3">
                  <div class="inline-flex items-center gap-2 bg-[#E1F5FE] text-[#0288D1] px-3.5 py-1 rounded-full font-bold text-xs">
                    <span class="material-symbols-outlined text-base">play_circle</span>
                    {t.homePage?.videoTag || 'Démonstration vidéo'}
                  </div>
                  <span class="text-xs font-bold text-[#4221b6] bg-[#e0d7ff] px-3 py-1 rounded-full">
                    {lang === 'ar' ? 'عرض توضيحي' : 'Vidéo Démo'}
                  </span>
                </div>

                <div class="space-y-1 text-left rtl:text-right">
                  <h3 class="text-lg font-extrabold text-[#2C3E2E]">
                    {t.homePage?.videoTitle || 'Découvrez notre méthode en vidéo'}
                  </h3>
                  <p class="text-xs text-[#5A6E5E] leading-relaxed font-medium">
                    {t.homePage?.videoDesc || 'Regardez comment nos maîtresses certifiées accompagnent vos enfants vers le succès.'}
                  </p>
                </div>

                {/* Video Preview Card */}
                <div class="w-full relative rounded-2xl overflow-hidden border-2 border-surface-variant group cursor-pointer aspect-video shadow-md mt-1">
                  <img
                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80"
                    alt="Video Preview"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div class="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <button
                      onClick={() => setIsVideoOpen(true)}
                      class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#4221b6] text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer border-4 border-white"
                    >
                      <span class="material-symbols-outlined text-3xl sm:text-4xl ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsVideoOpen(true)}
                  class="w-full py-3 rounded-full bg-[#4221b6] text-white font-bold text-xs shadow-md hover:bg-[#341a99] transition-colors cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  <span class="material-symbols-outlined text-base">visibility</span>
                  <span>{lang === 'ar' ? 'شاهد الفيديو التوضيحي الآن' : 'Regarder la vidéo démo'}</span>
                </button>
              </div>
            ) : (
              /* Auth Card (When Not Logged In) */
              <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-surface-variant/80 flex flex-col gap-5">
                {/* Top Switcher Pill */}
                <div class="bg-[#F4F1EA] p-1.5 rounded-full border border-surface-variant/50 flex">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                    class={`flex-1 py-3 rounded-full font-bold text-xs transition-all cursor-pointer ${authMode === 'login'
                      ? 'bg-[#4221b6] text-white shadow-md'
                      : 'text-[#5A6E5E] hover:text-[#4221b6]'
                      }`}
                  >
                    {t.authPage.loginTab}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
                    class={`flex-1 py-3 rounded-full font-bold text-xs transition-all cursor-pointer ${authMode === 'signup'
                      ? 'bg-[#4221b6] text-white shadow-md'
                      : 'text-[#5A6E5E] hover:text-[#4221b6]'
                      }`}
                  >
                    {t.authPage.signupTab}
                  </button>
                </div>

                {errorMsg && (
                  <div class="p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-2xl font-bold text-center">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} class="space-y-4 text-left rtl:text-right">
                  {authMode === 'signup' && (
                    <>
                      <div>
                        <label class="block text-xs font-bold text-[#2C3E2E] mb-1.5">
                          {t.authPage.parentNameLabel}
                        </label>
                        <div class="relative">
                          <span class="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">person</span>
                          <input
                            type="text"
                            required
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            placeholder={t.authPage.parentNamePlaceholder}
                            class="w-full h-12 pl-11 pr-4 rtl:pl-4 rtl:pr-11 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none"
                          />
                        </div>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-bold text-[#2C3E2E] mb-1.5">
                            {t.authPage.childNameLabel}
                          </label>
                          <div class="relative">
                            <span class="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">mood</span>
                            <input
                              type="text"
                              required
                              value={childName}
                              onChange={(e) => setChildName(e.target.value)}
                              placeholder={t.authPage.childNamePlaceholder}
                              class="w-full h-12 pl-11 pr-4 rtl:pl-4 rtl:pr-11 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label class="block text-xs font-bold text-[#2C3E2E] mb-1.5">
                            {t.authPage.childAgeLabel}
                          </label>
                          <select
                            value={childAge}
                            onChange={(e) => setChildAge(e.target.value)}
                            class="w-full h-12 px-4 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none cursor-pointer"
                          >
                            {t.authPage.ageOptions.map((opt, idx) => (
                              <option key={idx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label class="block text-xs font-bold text-[#2C3E2E] mb-1.5">
                      {t.authPage.emailLabel}
                    </label>
                    <div class="relative">
                      <span class="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">mail</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.authPage.emailPlaceholder}
                        class="w-full h-12 pl-11 pr-4 rtl:pl-4 rtl:pr-11 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div class="flex justify-between items-center mb-1.5">
                      <label class="block text-xs font-bold text-[#2C3E2E]">
                        {t.authPage.passwordLabel}
                      </label>
                      {authMode === 'login' && (
                        <a href="#" class="text-[11px] text-[#4221b6] font-bold hover:underline">
                          {t.authPage.forgotPassword}
                        </a>
                      )}
                    </div>
                    <div class="relative">
                      <span class="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">lock</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.authPage.passwordPlaceholder}
                        class="w-full h-12 pl-11 pr-11 rtl:pl-11 rtl:pr-11 rounded-full border border-surface-variant/70 bg-[#F4F1EA] text-xs font-medium focus:border-[#4221b6] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        class="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-[#4221b6] transition-colors cursor-pointer"
                      >
                        <span class="material-symbols-outlined text-sm">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div class="flex items-center gap-2 pt-1">
                      <input type="checkbox" required id="hero-terms" class="w-4 h-4 rounded text-[#4221b6] focus:ring-[#4221b6] cursor-pointer" />
                      <label for="hero-terms" class="text-[11px] text-[#5A6E5E] cursor-pointer font-medium">
                        {t.authPage.acceptTerms}
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    class="w-full h-[45px] min-h-[40px] rounded-full bg-[#4221b6] hover:bg-[#341a99] text-white font-bold text-base shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:shadow-lg disabled:opacity-50"
                  >
                    <span>{loading ? 'Chargement...' : (authMode === 'login' ? t.authPage.submitLogin : t.authPage.submitSignup)}</span>
                    <span class="material-symbols-outlined">{isRtl ? 'arrow_back' : 'arrow_forward'}</span>
                  </button>

                  <div class="relative my-4 text-center">
                    <div class="absolute inset-0 flex items-center">
                      <div class="w-full border-t border-surface-variant/50"></div>
                    </div>
                    <span class="relative bg-white px-3 text-[11px] text-tertiary font-bold">OU</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/parent')}
                    class="w-full h-12 rounded-full border border-surface-variant/70 bg-[#F4F1EA] hover:bg-surface-container-low text-on-surface font-bold text-xs flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                    </svg>
                    <span>{t.authPage.googleAuth}</span>
                  </button>

                  <div class="text-center pt-2">
                    <p class="text-[11px] text-on-surface-variant">
                      {authMode === 'login' ? t.authPage.noAccountText : t.authPage.hasAccountText}{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setErrorMsg(''); }}
                        class="text-[#4221b6] font-bold underline cursor-pointer ml-1"
                      >
                        {authMode === 'login' ? t.authPage.switchToSignup : t.authPage.switchToLogin}
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Teaser Section — only for non-logged-in users */}
      {!isLoggedIn && (
        <section className="w-full bg-gradient-to-br from-[#1c0576] via-[#2d0f8a] to-[#4221b6] py-16 md:py-24 px-container-margin relative overflow-hidden">
          {/* Background blobs */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#78fd7d]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#8c90f6]/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center gap-10">
            {/* Section Header */}
            <div className="text-center space-y-4 max-w-2xl">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider border border-white/20">
                <span className="material-symbols-outlined text-sm text-[#78fd7d]">play_circle</span>
                {lang === 'ar' ? 'الفيديو التعريفي' : 'Présentation vidéo'}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {lang === 'ar'
                  ? 'اكتشف طريقتنا الفريدة في التعليم'
                  : 'Découvrez notre méthode unique en vidéo'}
              </h2>
              <p className="text-sm sm:text-base text-white/70 font-medium leading-relaxed">
                {lang === 'ar'
                  ? 'شاهد كيف تساعد مدرساتنا المعتمدات أطفالك على تعلم الفرنسية بأسلوب مميز وممتع.'
                  : 'Regardez comment nos maîtresses certifiées accompagnent vos enfants vers la maîtrise du français.'}
              </p>
            </div>

            {/* Video Card */}
            <div className="w-full max-w-3xl">
              <div
                className="relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl group cursor-pointer aspect-video"
                onClick={() => setIsVideoOpen(true)}
              >
                {/* Thumbnail */}
                <img
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80"
                  alt={lang === 'ar' ? 'فيديو تعريفي' : 'Vidéo de présentation'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent group-hover:from-black/40 transition-all duration-500"></div>

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Pulse ring */}
                    <div className="absolute inset-0 rounded-full bg-white/30 animate-ping scale-125"></div>
                    <button
                      onClick={() => setIsVideoOpen(true)}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white text-[#4221b6] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-3xl sm:text-4xl md:text-5xl ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </button>
                  </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                  2:45
                </div>
              </div>
            </div>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => setIsVideoOpen(true)}
                className="px-8 py-3.5 rounded-full bg-white text-[#4221b6] font-extrabold text-sm shadow-xl hover:shadow-white/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2.5"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                {lang === 'ar' ? 'شاهد الفيديو الآن' : 'Regarder maintenant'}
              </button>
              <button
                onClick={() => document.getElementById('hero-auth-card')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 rounded-full bg-transparent border-2 border-white/40 text-white font-bold text-sm hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2.5"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                {lang === 'ar' ? 'سجّل الآن مجاناً' : 'S\'inscrire gratuitement'}
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-white/60 text-xs font-medium mt-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#78fd7d] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {lang === 'ar' ? '٤.٩/٥ تقييم الأولياء' : '4.9/5 avis parents'}
              </div>
              <div className="w-1 h-1 rounded-full bg-white/30 hidden sm:block"></div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#78fd7d] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                {lang === 'ar' ? '+٢٠٠ طفل مشترك' : '+200 enfants inscrits'}
              </div>
              <div className="w-1 h-1 rounded-full bg-white/30 hidden sm:block"></div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#78fd7d] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                {lang === 'ar' ? 'مدرسات معتمدات' : 'Maîtresses certifiées'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Video Modal Overlay */}
      {isVideoOpen && <VideoModal onClose={() => setIsVideoOpen(false)} />}
    </>
  );
}
