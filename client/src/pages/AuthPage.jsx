import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { createNotification } from '../utils/notifications';
import useGoogleAuth from '../hooks/useGoogleAuth';

export default function AuthPage() {
  const { t, isRtl } = useLanguage();
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [authMode, setAuthMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);

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

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup' || mode === 'login') {
      setAuthMode(mode);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
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

      // Login User
      loginUser(data.user);

      // Redirect directly to Home Page on signup
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
      } else if (data.user?.role?.toLowerCase()?.includes('admin')) {
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

  return (
    <div class="w-full min-h-[calc(100vh-140px)] bg-gradient-to-b from-[#FFF5F2] via-surface to-[#F0F4F8] py-12 md:py-20 px-container-margin flex items-center justify-center relative overflow-hidden">
      {/* Background Floating Blobs & Stars */}
      <div class="absolute top-10 left-10 w-72 h-72 bg-[#FFE0B2] rounded-full blur-3xl opacity-40 -z-10 animate-pulse"></div>
      <div class="absolute bottom-10 right-10 w-96 h-96 bg-[#E1F5FE] rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
      <div class="absolute top-20 right-1/4 text-secondary-container animate-bounce">
        <span class="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      </div>

      <div class="w-full max-w-5xl bg-surface-container-lowest rounded-3xl soft-card-shadow border border-surface-variant overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Left Side: Features */}
        <div
          class="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between items-center text-center relative bg-cover bg-center bg-no-repeat overflow-hidden min-h-[480px]"
          style={{ backgroundImage: `url('/auth-bg.png')` }}
        >
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60 z-0"></div>

          <div class="w-full flex flex-col items-center relative z-10">
            <h2 class="text-headline-md md:text-display-lg font-display-lg text-white mb-3 font-bold drop-shadow-md">
              {authMode === 'login' ? t.authPage.welcomeLoginTitle : t.authPage.welcomeSignupTitle}
            </h2>
            <p class="text-body-md font-body-md text-white/90 max-w-sm mb-8 drop-shadow font-medium">
              {authMode === 'login' ? t.authPage.welcomeLoginSub : t.authPage.welcomeSignupSub}
            </p>

            <div class={`w-full space-y-4 font-body-md text-sm text-white bg-black/30 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-lg ${isRtl ? 'text-right' : 'text-left'}`}>
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[#FFD54F] text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span class="font-bold drop-shadow-sm">{t.authPage.feature1}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[#FFD54F] text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span class="font-bold drop-shadow-sm">{t.authPage.feature2}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[#FFD54F] text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span class="font-bold drop-shadow-sm">{t.authPage.feature3}</span>
              </div>
            </div>
          </div>

          <div class="mt-8 text-xs text-white/80 font-bold drop-shadow relative z-10">
            © 2026 La clé des langues - Apprendre en s'amusant
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div class="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-surface">
          <div class="bg-surface-container-low p-1.5 rounded-full border border-surface-variant flex mb-6">
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
              class={`flex-1 py-3 rounded-full font-label-bold text-sm transition-all cursor-pointer font-bold ${authMode === 'login'
                ? 'bg-primary-container text-on-primary-container shadow-md'
                : 'text-on-surface-variant hover:text-primary'
                }`}
            >
              {t.authPage.loginTab}
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
              class={`flex-1 py-3 rounded-full font-label-bold text-sm transition-all cursor-pointer font-bold ${authMode === 'signup'
                ? 'bg-primary-container text-on-primary-container shadow-md'
                : 'text-on-surface-variant hover:text-primary'
                }`}
            >
              {t.authPage.signupTab}
            </button>
          </div>

          {errorMsg && (
            <div class="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 text-xs rounded-2xl font-bold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-5">
            {authMode === 'signup' && (
              <>
                <div>
                  <label class="block text-label-bold font-label-bold text-on-surface mb-2 text-sm font-bold">
                    {t.authPage.parentNameLabel}
                  </label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder={t.authPage.parentNamePlaceholder}
                      class="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-surface-variant bg-surface-container-low focus:border-primary-container outline-none font-body-md"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-label-bold font-label-bold text-on-surface mb-2 text-sm font-bold">
                      {t.authPage.childNameLabel}
                    </label>
                    <div class="relative">
                      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">child_care</span>
                      <input
                        type="text"
                        required
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder={t.authPage.childNamePlaceholder}
                        class="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-surface-variant bg-surface-container-low focus:border-primary-container outline-none font-body-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-label-bold font-label-bold text-on-surface mb-2 text-sm font-bold">
                      {t.authPage.childAgeLabel}
                    </label>
                    <select
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      class="w-full h-12 px-3 rounded-xl border-2 border-surface-variant bg-surface-container-low focus:border-primary-container outline-none font-body-md cursor-pointer text-sm font-medium"
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
              <label class="block text-label-bold font-label-bold text-on-surface mb-2 text-sm font-bold">
                {t.authPage.emailLabel}
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.authPage.emailPlaceholder}
                  class="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-surface-variant bg-surface-container-low focus:border-primary-container outline-none font-body-md"
                />
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-2">
                <label class="block text-label-bold font-label-bold text-on-surface text-sm font-bold">
                  {t.authPage.passwordLabel}
                </label>
                {authMode === 'login' && (
                  <a href="#" class="text-xs text-primary font-label-bold hover:underline font-bold">
                    {t.authPage.forgotPassword}
                  </a>
                )}
              </div>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.authPage.passwordPlaceholder}
                  class="w-full h-12 pl-10 pr-10 rounded-xl border-2 border-surface-variant bg-surface-container-low focus:border-primary-container outline-none font-body-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  <span class="material-symbols-outlined text-sm">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {authMode === 'signup' && (
              <div class="flex items-center gap-2 pt-1">
                <input type="checkbox" required id="terms" class="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" />
                <label for="terms" class="text-xs text-on-surface-variant cursor-pointer">
                  {t.authPage.acceptTerms}
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              class="w-full h-[54px] rounded-full bg-primary-container text-on-primary-container font-label-bold text-lg chunky-shadow-primary transition-transform cursor-pointer font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              <span>{loading ? 'Chargement...' : (authMode === 'login' ? t.authPage.submitLogin : t.authPage.submitSignup)}</span>
              <span class="material-symbols-outlined">{isRtl ? 'arrow_back' : 'arrow_forward'}</span>
            </button>

            <div class="relative my-6 text-center">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-surface-variant"></div>
              </div>
              <span class="relative bg-surface px-4 text-xs text-tertiary font-bold">OU</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={googleLoading}
              class="w-full h-12 rounded-full border-2 border-surface-variant bg-surface-container-low hover:bg-surface-container text-on-surface font-label-bold flex items-center justify-center gap-3 cursor-pointer text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {googleLoading ? (
                <span className="w-5 h-5 border-2 border-slate-300 border-t-[#4285F4] rounded-full animate-spin" />
              ) : (
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                </svg>
              )}
              <span>{googleLoading ? (t.authPage?.googleLoading || 'Connexion...') : t.authPage.googleAuth}</span>
            </button>

            <div class="text-center pt-4">
              <p class="text-xs text-on-surface-variant">
                {authMode === 'login' ? t.authPage.noAccountText : t.authPage.hasAccountText}{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setErrorMsg(''); }}
                  class="text-primary font-label-bold underline font-bold cursor-pointer ml-1"
                >
                  {authMode === 'login' ? t.authPage.switchToSignup : t.authPage.switchToLogin}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
