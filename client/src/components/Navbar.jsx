import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import EditNavModal from './EditNavModal';

export default function Navbar() {
  const { lang, setLang, t, isRtl } = useLanguage();
  const { user, isLoggedIn, logoutUser } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditNavOpen, setIsEditNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin');

  const navLinks = [
    { to: '/', label: t.nav.home, icon: 'home', end: true },
    { to: '/dashboard', label: t.nav.dashboard, icon: 'face' },
    { to: '/parent', label: t.nav.parent, icon: 'supervisor_account' },
    { to: '/calendar', label: t.nav.calendar, icon: 'calendar_month' },
    ...(user?.role?.toLowerCase() === 'admin' ? [{ to: '/admin', label: t.nav.admin || 'Admin', icon: 'admin_panel_settings' }] : []),
  ];

  return (
    <header className={`bg-surface/95 dark:bg-surface-dim/95 backdrop-blur-lg top-0 border-b border-surface-variant/80 shadow-sm z-50 sticky transition-all${!isLoggedIn ? ' guest-nav' : ''}`}>
      <div className="flex justify-between items-center w-full px-4 sm:px-8 md:px-12 h-[80px]">
        {/* Left: Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="text-xl md:text-2xl font-black text-[#1c0576] flex items-center gap-2.5 cursor-pointer text-left hover:scale-105 transition-transform"
          >
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#78fd7d] to-[#b0fdb5] flex items-center justify-center text-[#0d4013] text-xl font-black shadow-md hide-on-357">🦊</span>
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
          {user?.role?.toLowerCase() === 'admin' && (
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

          {/* Language Switcher (Desktop) */}
          <div className="hidden md:flex hide-on-471 items-center gap-1 bg-surface-container-low/90 backdrop-blur-md p-1 rounded-full border border-surface-variant shadow-inner">
            <button
              onClick={() => setLang('fr')}
              className={`font-label-bold rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer ${lang === 'fr'
                ? 'bg-[#b0fdb5] text-[#0d4013] font-black shadow-sm scale-105'
                : 'text-on-surface-variant hover:text-[#4221b6]'
                }`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`font-label-bold rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer ${lang === 'ar'
                ? 'bg-[#b0fdb5] text-[#0d4013] font-black shadow-sm scale-105'
                : 'text-on-surface-variant hover:text-[#4221b6]'
                }`}
            >
              AR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`font-label-bold rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer ${lang === 'en'
                ? 'bg-[#b0fdb5] text-[#0d4013] font-black shadow-sm scale-105'
                : 'text-on-surface-variant hover:text-[#4221b6]'
                }`}
            >
              EN
            </button>
          </div>

          {/* Notifications Bell */}
          <div className="flex items-center gap-2 text-on-surface-variant">
            <div className="relative">
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

              {/* Notifications Popover */}
              {isNotificationsOpen && (
                <>
                  <div
                    onClick={() => setIsNotificationsOpen(false)}
                    className="fixed inset-0 z-40"
                  ></div>

                  <div className={`absolute top-full mt-3 ${isRtl ? 'left-0' : 'right-0'} w-80 sm:w-96 bg-surface-container-lowest rounded-3xl soft-card-shadow border border-surface-variant z-50 overflow-hidden transform transition-all duration-200 notif-popover-responsive`}>
                    <div className="p-4 px-5 bg-surface-container-low border-b border-surface-variant flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-md text-headline-md text-on-surface text-base font-bold hide-notif-title-640">{t.notificationsPopover.title}</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#e0d7ff] text-[#4221b6]">
                            {t.notificationsPopover.unreadBadge}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setUnreadCount(0)}
                        className="text-xs font-label-bold text-[#4221b6] hover:underline font-bold cursor-pointer"
                      >
                        {t.notificationsPopover.markAllRead}
                      </button>
                    </div>

                    <div className="divide-y divide-surface-variant max-h-[360px] overflow-y-auto">
                      {t.notificationsPopover.items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 flex gap-3 hover:bg-surface-container-low transition-colors cursor-pointer ${item.unread && unreadCount > 0 ? 'bg-[#F5F3FF]' : ''
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}>
                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {item.icon}
                            </span>
                          </div>
                          <div className="flex-grow space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-label-bold text-on-surface text-sm font-bold leading-tight">
                                {item.title}
                              </h4>
                              <span className="text-[11px] text-tertiary whitespace-nowrap ml-2">
                                {item.time}
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-surface-container-low border-t border-surface-variant text-center">
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-xs font-label-bold text-on-surface-variant hover:text-primary transition-colors font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>{t.notificationsPopover.viewAll}</span>
                        <span className="material-symbols-outlined text-sm">{isRtl ? 'arrow_back' : 'arrow_forward'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setLang(lang === 'fr' ? 'ar' : lang === 'ar' ? 'en' : 'fr')}
              aria-label="language"
              className="w-touch-target h-touch-target hide-on-471 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors hover:text-primary-container md:hidden"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>language</span>
            </button>
          </div>

          {/* Account Badge / Auth buttons (Top Bar) */}
          {user ? (
            <div className="flex items-center gap-2 hide-on-471">
              <div className="hidden sm:flex flex-col text-right rtl:text-left">
                <span className="text-xs font-bold text-on-surface leading-tight">{user.parentName || user.email}</span>
                <span className="text-[10px] text-on-surface-variant">{user.childName ? `Parent de ${user.childName}` : 'Parent'}</span>
              </div>
              <button
                onClick={logoutUser}
                title="Déconnexion"
                className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center cursor-pointer font-bold"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
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
          {/* Global Backdrop attached directly to body */}
          <div
            onClick={() => setIsMenuOpen(false)}
            style={{ zIndex: 999998 }}
            className="creative-menu-overlay fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Floating Glassmorphic Menu Card */}
          <div
            style={{ zIndex: 999999 }}
            className={`creative-menu-card fixed top-[88px] ${isRtl ? 'left-4 sm:left-8' : 'right-4 sm:right-8'} w-[calc(100vw-32px)] sm:w-[400px] bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_25px_60px_-15px_rgba(28,5,118,0.3)] overflow-hidden`}
          >
            {/* Header banner */}
            <div className="flex items-center justify-between p-4 mb-4 rounded-2xl bg-gradient-to-r from-[#4221b6] to-[#5d35e0] text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                  🦊
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight tracking-tight">{t.brand}</h3>
                  <p className="text-xs text-white/80 font-medium">Navigation rapide</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Nav links */}
            <div className="space-y-2 mb-5">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `creative-menu-item flex items-center justify-between px-4 py-3 rounded-2xl text-base font-bold transition-all border ${isActive
                      ? 'bg-gradient-to-r from-[#4221b6] to-[#5d35e0] text-white border-[#4221b6] shadow-md scale-[1.01]'
                      : 'bg-[#faf9f5] text-[#1c0576] hover:bg-[#e0d7ff]/50 hover:text-[#4221b6] border-slate-200/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-white/20 text-[#b0fdb5]' : 'bg-[#e0d7ff] text-[#4221b6]'}`}>
                          <span className="material-symbols-outlined text-2xl">{link.icon}</span>
                        </div>
                        <span className="text-sm font-extrabold tracking-tight">{link.label}</span>
                      </div>
                      <span className={`material-symbols-outlined text-xl shrink-0 ${isActive ? 'text-white' : 'text-[#4221b6]/60'}`}>
                        {isRtl ? 'chevron_left' : 'chevron_right'}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Quick Actions (Language & User Profile / Logout) */}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              {/* Language Selector in Menu */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf9f5] border border-slate-200/60">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-[#4221b6]">language</span>
                  {lang === 'ar' ? 'اللغة' : lang === 'en' ? 'Language' : 'Langue'}
                </span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  <button
                    onClick={() => setLang('fr')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-black transition-all cursor-pointer ${lang === 'fr' ? 'bg-[#b0fdb5] text-[#0d4013] shadow-sm scale-105' : 'text-slate-600 hover:text-[#4221b6]'}`}
                  >
                    FR
                  </button>
                  <button
                    onClick={() => setLang('ar')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-black transition-all cursor-pointer ${lang === 'ar' ? 'bg-[#b0fdb5] text-[#0d4013] shadow-sm scale-105' : 'text-slate-600 hover:text-[#4221b6]'}`}
                  >
                    AR
                  </button>
                  <button
                    onClick={() => setLang('en')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-black transition-all cursor-pointer ${lang === 'en' ? 'bg-[#b0fdb5] text-[#0d4013] shadow-sm scale-105' : 'text-slate-600 hover:text-[#4221b6]'}`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* User Profile & Logout Section in Menu */}
              {user ? (
                <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-[#faf9f5] border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4221b6] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      {user.parentName ? user.parentName.charAt(0).toUpperCase() : '👨‍👩‍👧'}
                    </div>
                    <div className="flex flex-col overflow-hidden text-left rtl:text-right">
                      <span className="text-sm font-bold text-[#1c0576] truncate">{user.parentName || user.email}</span>
                      <span className="text-xs text-slate-500 truncate">{user.childName ? `Parent de ${user.childName}` : 'Parent'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logoutUser();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors border border-red-200 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>{lang === 'ar' ? 'تسجيل الخروج' : lang === 'en' ? 'Log out' : 'Déconnexion'}</span>
                  </button>
                </div>
              ) : !isAdminPath ? (
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Link
                    to="/auth?mode=login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-[#4221b6] text-[#4221b6] font-bold text-sm hover:bg-[#4221b6] hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">login</span>
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/auth?mode=signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#78fd7d] text-[#064e3b] font-bold text-sm hover:brightness-95 transition-all shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    {t.nav.signup}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Edit Nav Titles Modal */}
      {isEditNavOpen && (
        <EditNavModal onClose={() => setIsEditNavOpen(false)} />
      )}
    </header>
  );
}
