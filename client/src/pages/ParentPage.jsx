import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import EditSectionModal from '../components/EditSectionModal';

export default function ParentPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [editingSectionModal, setEditingSectionModal] = useState(null); // { key, title }

  return (
    <div className="w-full max-w-7xl mx-auto px-container-margin py-8 md:py-12 space-y-12 pb-32 md:pb-16 relative">
      
      {/* 1. Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-[#f3e5f5]/50 to-[#e1bee7]/30 p-6 rounded-3xl border border-[#ab47bc]/30 relative shadow-sm">
        {/* Admin Edit Button */}
        {user?.role?.toLowerCase() === 'admin' && (
          <button
            onClick={() => setEditingSectionModal({ key: 'parentHeader', title: lang === 'ar' ? 'ترويسة فضاء الوليّ' : 'En-tête Espace Parent' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl md:text-display-lg font-extrabold text-[#4221b6] tracking-tight title-parent-responsive">{t.parentPage?.title}</h1>
          <p className="text-sm sm:text-base md:text-body-lg text-on-surface-variant mt-2 font-medium">{t.parentPage?.subtitle}</p>
        </div>

        <div className="flex items-center gap-4 bg-white/90 py-3 px-5 rounded-full border border-surface-variant shadow-sm shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container flex-shrink-0">
            <img
              className="w-full h-full object-cover"
              alt="Parent profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsYrFVHxYGB5DTFF6Vt8NMnvUybBzPs13vQDZsROgn5IwHPVdvlUc_y1tCCpuVnNS_XDyAYTZOVg6AS8casZMYZmr_lIoTiqrQF0LKeKcN0VrCs6e6tSZOgwFx2EhHwzUICzKBV9tMsLjAwWFZfzbGniXEttVF9FXUY_OpoSgHqo797hXzkRa-uOWTFMhQckejrn0yh9JJwoJC43PkMRTDAxLwRAOPRU9fEtdvJcwOdZOi24NLFKKg"
            />
          </div>
          <div>
            <div className="font-label-bold text-label-bold text-on-surface font-bold">{t.parentPage?.accountType}</div>
            <div className="text-sm text-tertiary font-bold">{t.parentPage?.accountBadge}</div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. History Section */}
          <section className="bg-surface rounded-3xl p-4 sm:p-6 md:p-8 card-padding-515 soft-card-shadow border border-surface-variant card-hover-effect relative">
            {/* Admin Edit Button */}
            {user?.role?.toLowerCase() === 'admin' && (
              <button
                onClick={() => setEditingSectionModal({ key: 'parentHistory', title: lang === 'ar' ? 'جدول سجل الجلسات' : 'Historique des sessions' })}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
              </button>
            )}

            <div className="flex justify-between items-center mb-4 sm:mb-6 pr-24 rtl:pr-0 rtl:pl-24">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl sm:text-[28px]">history</span>
                <h2 className="text-base sm:text-lg md:text-headline-md font-headline-md font-bold text-on-surface">{t.parentPage?.historyTitle}</h2>
              </div>
              <button className="text-primary text-xs sm:text-sm font-label-bold hover:underline cursor-pointer font-bold">{t.parentPage?.seeAll}</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-responsive-515">
                <thead>
                  <tr className="border-b border-outline-variant text-tertiary font-label-bold uppercase tracking-wider text-xs">
                    <th className="pb-4">{t.parentPage?.thDate}</th>
                    <th className="pb-4">{t.parentPage?.thSubject}</th>
                    <th className="pb-4">{t.parentPage?.thTutor}</th>
                    <th className="pb-4">{t.parentPage?.thStatus}</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  <tr className="border-b border-surface-variant hover:bg-surface-container-low transition-colors">
                    <td className="py-4 font-label-bold font-bold">Hier, 16:00</td>
                    <td className="py-4">Français (Lecture)</td>
                    <td className="py-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed">S</div>
                      Sophie M.
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-label-bold bg-[#E8F5E9] text-[#2E7D32] font-bold">
                        {t.parentPage?.statusCompleted}
                      </span>
                    </td>
                  </tr>

                  <tr className="border-b border-surface-variant hover:bg-surface-container-low transition-colors">
                    <td className="py-4 font-label-bold font-bold">12 Mai, 17:30</td>
                    <td className="py-4">Arabe (Oral)</td>
                    <td className="py-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-xs font-bold text-on-secondary-fixed">K</div>
                      Karim A.
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-label-bold bg-[#E8F5E9] text-[#2E7D32] font-bold">
                        {t.parentPage?.statusCompleted}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-4 font-label-bold font-bold">08 Mai, 16:00</td>
                    <td className="py-4">Français (Écriture)</td>
                    <td className="py-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed">S</div>
                      Sophie M.
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-label-bold bg-surface-variant text-on-surface-variant font-bold">
                        {t.parentPage?.statusCancelled}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* 3. Upcoming Sessions Section */}
        <div className="lg:col-span-1">
          <section className="bg-surface-bright rounded-3xl p-6 soft-card-shadow border border-secondary-fixed/50 h-full flex flex-col card-hover-effect relative">
            {/* Admin Edit Button */}
            {user?.role?.toLowerCase() === 'admin' && (
              <button
                onClick={() => setEditingSectionModal({ key: 'parentUpcoming', title: lang === 'ar' ? 'قسم الجلسات القادمة' : 'Sessions à venir' })}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
              </button>
            )}

            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary text-[28px]">calendar_month</span>
              <h2 className="text-headline-md font-headline-md text-on-surface">{t.parentPage?.upcomingTitle}</h2>
            </div>

            <div className="space-y-4 flex-grow">
              <div className="bg-surface rounded-2xl p-5 border border-outline-variant shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold px-2.5 py-1 rounded-md uppercase">
                    {t.parentPage?.todayTag}
                  </span>
                  <span className="text-tertiary font-label-bold text-xs font-bold">17:00 - 17:45</span>
                </div>
                <h3 className="font-label-bold text-lg text-on-surface mb-1 font-bold">Français - Lecture contée</h3>
                <p className="text-sm text-tertiary mb-4 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">person</span> Avec Sophie M.
                </p>
                <button className="w-full bg-[#4221b6] text-white min-h-[48px] px-4 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-[#341a99] transition-all flex items-center justify-center gap-2 cursor-pointer btn-join-responsive-336">
                  <span className="material-symbols-outlined text-xl">videocam</span>
                  <span>{t.parentPage?.joinVideo}</span>
                </button>
              </div>

              <div className="bg-surface rounded-2xl p-5 border border-surface-variant shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-on-surface-variant">Mercredi 17 Mai</span>
                  <span className="text-tertiary font-label-bold text-xs font-bold">16:30 - 17:15</span>
                </div>
                <h3 className="font-label-bold text-base text-on-surface mb-1 font-bold">Arabe - Chansons</h3>
                <p className="text-sm text-tertiary mb-4 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">person</span> Avec Karim A.
                </p>
                <button className="w-full border-2 border-primary text-primary min-h-[48px] rounded-full font-label-bold hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold">
                  {t.parentPage?.manageBtn}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/calendar')}
              className="mt-6 w-full py-4 text-primary font-label-bold flex items-center justify-center gap-2 hover:bg-surface-variant rounded-xl transition-colors cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined">add_circle</span>
              {t.parentPage?.planNew}
            </button>
          </section>
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
    </div>
  );
}
