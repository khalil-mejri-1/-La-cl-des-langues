import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import EditSectionModal from '../components/EditSectionModal';

export default function DashboardPage() {
  const { lang, t, isRtl } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [editingSectionModal, setEditingSectionModal] = useState(null); // { key, title }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-6 md:py-8 pb-24 md:pb-16 flex flex-col gap-6 relative">
      
      {/* 1. Welcome Header */}
      <header className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 bg-gradient-to-br from-[#e8f5e9] to-[#d5e5d6] rounded-3xl p-5 sm:p-6 border-2 border-[#8ee294]/60 shadow-md relative">
        {/* Admin Edit Button */}
        {user?.role?.toLowerCase() === 'admin' && (
          <button
            onClick={() => setEditingSectionModal({ key: 'dashboardHeader', title: lang === 'ar' ? 'قسم الترحيب والإحصائيات' : 'En-tête de bienvenue' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}

        <div className="flex items-center gap-4 text-center sm:text-left rtl:sm:text-right w-full sm:w-auto flex-col sm:flex-row">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center shrink-0">
            <img
              alt="Mascot waving"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF-VgHZWivqK0W6c5fa_VKkY0L-pIuXnMOONzEFytFG-zLHuG4tkUuGky5v-ViLjzhK1IX-z7ieazinQTvBAynhmrlnpD6QCbmytyBkxdwnQ1WZrIW6oIrpuci_8qWFnKEVCdQkpDJRWy0Z-4dU5bP9hYyYRnu2L48NivQ6aVab9Eetf-U8FK45VgF1t4JEeLEwVcHHkamYSu-Y5xJQ-cjWxsOeLn2Z1R2NmC-goe6GYnD1FtjC3PS"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c0576] mb-1">{t.dashboardPage?.welcome}</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-600">{t.dashboardPage?.welcomeSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
          <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-200 shadow-sm min-w-[95px]">
            <span className="material-symbols-outlined text-[#fdd34d] text-2xl mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-extrabold text-lg text-slate-800">128</span>
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">{t.dashboardPage?.starsLabel}</span>
          </div>
          <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-200 shadow-sm min-w-[95px]">
            <span className="material-symbols-outlined text-[#4221b6] text-2xl mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="font-extrabold text-lg text-slate-800">5</span>
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">{t.dashboardPage?.daysLabel}</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 2. Next Session Section */}
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

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
              </div>
              <h2 className="text-lg font-extrabold text-[#1c0576]">{t.dashboardPage?.nextSession}</h2>
            </div>

            <div className="bg-[#faf9f5] rounded-2xl p-4 border border-slate-200/80 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black text-[#4221b6] uppercase tracking-wider">{t.dashboardPage?.today}</span>
                <span className="text-lg sm:text-xl font-black text-slate-800">{t.dashboardPage?.time}</span>
                <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-sm text-[#4221b6]">person</span>
                  {t.dashboardPage?.teacher}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-3 bg-[#e8f5e9] rounded-2xl border border-[#8ee294] min-w-[120px] w-full sm:w-auto">
                <span className="text-xl font-black text-[#2e7d32]">{t.dashboardPage?.countdown}</span>
                <span className="text-[11px] font-bold text-slate-600">{t.dashboardPage?.countdownSub}</span>
              </div>
            </div>

            <button className="w-full h-[52px] rounded-2xl bg-slate-300 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200">
              <span className="material-symbols-outlined text-lg">lock</span>
              {t.dashboardPage?.joinButton}
            </button>
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

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>extension</span>
              </div>
              <h2 className="text-lg font-extrabold text-[#1c0576]">{t.dashboardPage?.favGames}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#faf9f5] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="bg-cover bg-center w-full h-28 bg-mint-light flex items-center justify-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDzuRs0pFbGVwxTt3j5riDMCsuB1x3srf18xEDGCz-SSMi5zdm7SojyIVdFaFUG9F-_X2HEEPrU3S-vkdhtT3FA4QutZ2qA6gZfuWsKo5gnah2V96C2LiQkB_sBX90HFNK3ZFslBnYqCElPTW19WHWWshdMrqVInxUpTylwEqHxabVlY61Eu7qS2MO0LgwfG-RYFJ-J7QRuNQDKuW_CPxHgpTd2MOdr1MZaEtQ3aj9QG2KJuo7H9byR')" }}
                ></div>
                <div className="p-3">
                  <h3 className="font-bold text-slate-800 text-center text-xs">{t.dashboardPage?.game1}</h3>
                </div>
              </div>

              <div className="bg-[#faf9f5] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="bg-cover bg-center w-full h-28 bg-primary-fixed flex items-center justify-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC9IzifuNKYW8_mSzhIjofm7CfVbELS2s_zKIupOEGi-zvyT2x2pfeLkqEkKYp9JHcSE4wlHxEfE7iET-Oi0ucNYCIK7nHHqOUj2iuqxA2aJDtt5zeM3p1AtXYfBfyxNsEd-ph8o8Iz6CZ3DIzjo4dex8E6RPORhSOx-79iaXCWoMkf_TGp1SxwZGdk5iUo6M9tn_emfX53R0tjPx-bet8RSo6tpv-635bRWDTY9C_FesRa0cavxdaB')" }}
                ></div>
                <div className="p-3">
                  <h3 className="font-bold text-slate-800 text-center text-xs">{t.dashboardPage?.game2}</h3>
                </div>
              </div>

              <div className="bg-[#faf9f5] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
                <div
                  className="bg-cover bg-center w-full h-28 bg-secondary-fixed flex items-center justify-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDJBHHnF9BYNgScgIcFM6Q30rnhIRUTqdlB2djG2ChbqV3x79iEv07-M4aKYCB_0SsdDIUiZ9Yg3IXC3K90cJUhVqf2cAQQ5YWMxCYoZ4Xo64_PD0To5fyrQuAlGYwDoRB8D_yaySOK6CCfuUGLMD7a1ClS6nFZfFvZQLC_NbRBYShb1kbJCjljjM_AoYL1i64_XN1MX4rSt9fL1dJKpKbTnRRwodz-Qt7qjQUyGJ0XJuPqcCJGXe9w')" }}
                ></div>
                <div className="p-3">
                  <h3 className="font-bold text-slate-800 text-center text-xs">{t.dashboardPage?.game3}</h3>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 4. Sidebar / Reminder Banner Section */}
        <aside className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-[#fff3e0] to-[#ffe0b2] rounded-3xl p-5 border-2 border-[#ffb74d]/60 shadow-md flex items-center gap-4 relative">
            {/* Admin Edit Button */}
            {user?.role?.toLowerCase() === 'admin' && (
              <button
                onClick={() => setEditingSectionModal({ key: 'reminderBanner', title: lang === 'ar' ? 'قسم التذكير الهام' : 'Bannière de rappel' })}
                className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[#f57c00] text-white px-2.5 py-1 rounded-full font-black text-[11px] shadow-md hover:scale-105 transition-all cursor-pointer border border-white/40"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
                <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
              </button>
            )}

            <div className="w-12 h-12 rounded-2xl bg-[#f57c00] text-white flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-xs font-black text-[#e65100] uppercase tracking-wider">{t.dashboardPage?.reminderTag}</h3>
              <p className="text-sm text-slate-800 font-extrabold leading-snug">{t.dashboardPage?.reminderText}</p>
            </div>
          </div>
        </aside>
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
