import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function EditNavModal({ onClose }) {
  const { lang, isRtl, customNav, updateNavTitles } = useLanguage();
  const [activeTab, setActiveTab] = useState(lang); // 'fr' | 'ar' | 'en'
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Initial state for nav titles across 3 languages
  const [navData, setNavData] = useState(() => {
    return {
      fr: {
        home: customNav?.fr?.home || 'Accueil',
        dashboard: customNav?.fr?.dashboard || 'Espace Élève',
        parent: customNav?.fr?.parent || 'Espace Parent',
        calendar: customNav?.fr?.calendar || 'Calendrier',
        admin: customNav?.fr?.admin || 'Admin',
      },
      ar: {
        home: customNav?.ar?.home || 'الرئيسية',
        dashboard: customNav?.ar?.dashboard || 'لوحة الطالب',
        parent: customNav?.ar?.parent || 'فضاء الوليّ',
        calendar: customNav?.ar?.calendar || 'التقويم',
        admin: customNav?.ar?.admin || 'الإدارة',
      },
      en: {
        home: customNav?.en?.home || 'Home',
        dashboard: customNav?.en?.dashboard || 'Student Space',
        parent: customNav?.en?.parent || 'Parent Space',
        calendar: customNav?.en?.calendar || 'Schedule',
        admin: customNav?.en?.admin || 'Admin',
      },
    };
  });

  const handleChange = (language, key, value) => {
    setNavData(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        [key]: value,
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    const success = await updateNavTitles(navData);
    setSaving(false);
    if (success !== false) {
      setSuccessMsg(
        lang === 'ar'
          ? 'تم حفظ التعديلات بنجاح في قاعدة البيانات!'
          : 'Modifications enregistrées avec succès dans MongoDB !'
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const navKeys = [
    { key: 'home', icon: 'home', titleFr: 'Bouton Accueil', titleAr: 'زر الرئيسية', placeholder: 'Accueil' },
    { key: 'dashboard', icon: 'face', titleFr: 'Bouton Espace Élève', titleAr: 'زر فضاء الطالب', placeholder: 'Espace Élève' },
    { key: 'parent', icon: 'supervisor_account', titleFr: 'Bouton Espace Parent', titleAr: 'زر فضاء الولي', placeholder: 'Espace Parent' },
    { key: 'calendar', icon: 'calendar_month', titleFr: 'Bouton Calendrier', titleAr: 'زر التقويم', placeholder: 'Calendrier' },
    { key: 'admin', icon: 'admin_panel_settings', titleFr: 'Bouton Admin', titleAr: 'زر الإدارة', placeholder: 'Admin' },
  ];

  return (
    <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex items-center justify-center min-h-screen">
      <div
        className="relative bg-white rounded-3xl max-w-xl w-full flex flex-col max-h-[85vh] border-2 border-[#8c90f6] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header - Fixed Top */}
        <div className="p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center font-bold shadow-inner shrink-0">
              <span className="material-symbols-outlined text-2xl">edit_note</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#1c0576] leading-tight">
                {lang === 'ar' ? 'تعديل أسماء أزرار القائمة (3 لغات)' : 'Modifier les boutons du Header'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar' ? 'حفظ تلقائي في قاعدة البيانات MongoDB' : 'Persistance automatique dans MongoDB'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Banner Notification */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2 justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-5 px-6 overflow-y-auto space-y-4 flex-1">
          {/* Language Selector Bar */}
          <div className="flex items-center gap-2 bg-[#f4f1ea] p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('fr')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'fr'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 hover:text-[#4221b6]'
              }`}
            >
              <span>🇫🇷 Français</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ar')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ar'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 hover:text-[#4221b6]'
              }`}
            >
              <span>🇹🇳 العربية</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'en'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 hover:text-[#4221b6]'
              }`}
            >
              <span>🇬🇧 English</span>
            </button>
          </div>

          {/* Input Fields */}
          <div className="space-y-3 bg-[#faf9f5] p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-1 pb-2 border-b border-slate-200/60">
              <span className="text-xs font-black text-[#1c0576]">
                {activeTab === 'fr'
                  ? 'Langue : Français (FR)'
                  : activeTab === 'ar'
                  ? 'اللغة الحالية: العربية (AR)'
                  : 'Language: English (EN)'}
              </span>
              <span className="uppercase text-[10px] bg-[#e0d7ff] text-[#4221b6] px-2.5 py-0.5 rounded-full font-black">
                {activeTab}
              </span>
            </div>

            {navKeys.map((item) => (
              <div key={item.key} className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#4221b6]">{item.icon}</span>
                  <span>{activeTab === 'ar' ? item.titleAr : item.titleFr}</span>
                </label>
                <input
                  type="text"
                  required
                  value={navData[activeTab][item.key] || ''}
                  onChange={(e) => handleChange(activeTab, item.key, e.target.value)}
                  placeholder={item.placeholder}
                  className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs text-slate-800 transition-colors shadow-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Fixed Bottom */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 rounded-full border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'إلغاء' : 'Annuler'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-[#4221b6] hover:bg-[#341a99] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <span>
              {saving
                ? 'Sauvegarde...'
                : lang === 'ar'
                ? 'حفظ في قاعدة البيانات'
                : 'Enregistrer dans la BD'}
            </span>
            <span className="material-symbols-outlined text-sm">cloud_upload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
