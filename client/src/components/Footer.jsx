import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import EditSectionModal from './EditSectionModal';

export default function Footer() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [editingSectionModal, setEditingSectionModal] = useState(null);

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

  return (
    <footer className="bg-surface-container-low dark:bg-surface-container-lowest w-full rounded-t-lg pb-24 md:pb-0 relative border-t border-slate-200/60">
      {/* Admin Edit Button */}
      {isAdmin && (

        <div className="absolute top-2 right-4 sm:top-3 sm:right-6 z-20">
          <button
            onClick={() => setEditingSectionModal({ key: 'footerSection', title: lang === 'ar' ? 'قسم أسفل الصفحة (Footer)' : 'Pied de page (Footer)' })}
            className="flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل الفوتر' : 'Modifier le Footer'}</span>
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center px-container-margin py-12 gap-gutter w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-3">
            <img
              alt="Logo La clé des langues"
              className="w-14 h-14 object-contain rounded-2xl shadow-sm"
              src="/logo.png"
            />
            <div className="text-xl sm:text-2xl font-black text-[#1c0576]">{t.brand}</div>
          </div>
        </div>

        <div className="text-tertiary dark:text-tertiary-fixed text-body-md font-body-md text-center">
          {t.footer?.copy}
        </div>

        <div className="flex gap-6">
          <a className="text-on-surface-variant hover:underline hover:text-primary font-label-bold text-sm" href="#">
            {t.footer?.parents}
          </a>
          <a className="text-on-surface-variant hover:underline hover:text-primary font-label-bold text-sm" href="#">
            {t.footer?.help}
          </a>
          <a className="text-on-surface-variant hover:underline hover:text-primary font-label-bold text-sm" href="#">
            {t.footer?.privacy}
          </a>
        </div>
      </div>

      {/* Admin Section Edit Modal */}
      {editingSectionModal && (
        <EditSectionModal
          sectionKey={editingSectionModal.key}
          sectionTitle={editingSectionModal.title}
          onClose={() => setEditingSectionModal(null)}
        />
      )}
    </footer>
  );
}
