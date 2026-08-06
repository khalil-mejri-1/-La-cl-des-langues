import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function ParentPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div class="w-full max-w-7xl mx-auto px-container-margin py-8 md:py-12 space-y-12 pb-32 md:pb-16">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-display-lg font-extrabold text-[#4221b6] tracking-tight title-parent-responsive">{t.parentPage.title}</h1>
          <p className="text-sm sm:text-base md:text-body-lg text-on-surface-variant mt-2 font-medium">{t.parentPage.subtitle}</p>
        </div>

        <div class="flex items-center gap-4 bg-surface-container-low py-3 px-5 rounded-full border border-surface-variant shadow-sm">
          <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container flex-shrink-0">
            <img
              class="w-full h-full object-cover"
              alt="Parent profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsYrFVHxYGB5DTFF6Vt8NMnvUybBzPs13vQDZsROgn5IwHPVdvlUc_y1tCCpuVnNS_XDyAYTZOVg6AS8casZMYZmr_lIoTiqrQF0LKeKcN0VrCs6e6tSZOgwFx2EhHwzUICzKBV9tMsLjAwWFZfzbGniXEttVF9FXUY_OpoSgHqo797hXzkRa-uOWTFMhQckejrn0yh9JJwoJC43PkMRTDAxLwRAOPRU9fEtdvJcwOdZOi24NLFKKg"
            />
          </div>
          <div>
            <div class="font-label-bold text-label-bold text-on-surface font-bold">{t.parentPage.accountType}</div>
            <div class="text-sm text-tertiary font-bold">{t.parentPage.accountBadge}</div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <section className="bg-surface rounded-3xl p-4 sm:p-6 md:p-8 card-padding-515 soft-card-shadow border border-surface-variant card-hover-effect">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="material-symbols-outlined text-tertiary text-xl sm:text-[28px]">history</span>
                <h2 className="text-base sm:text-lg md:text-headline-md font-headline-md font-bold text-on-surface">{t.parentPage.historyTitle}</h2>
              </div>
              <button className="text-primary text-xs sm:text-sm font-label-bold hover:underline cursor-pointer font-bold">{t.parentPage.seeAll}</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-responsive-515">
                <thead>
                  <tr class="border-b border-outline-variant text-tertiary font-label-bold uppercase tracking-wider text-xs">
                    <th class="pb-4">{t.parentPage.thDate}</th>
                    <th class="pb-4">{t.parentPage.thSubject}</th>
                    <th class="pb-4">{t.parentPage.thTutor}</th>
                    <th class="pb-4">{t.parentPage.thStatus}</th>
                  </tr>
                </thead>
                <tbody class="text-on-surface">
                  <tr class="border-b border-surface-variant hover:bg-surface-container-low transition-colors">
                    <td class="py-4 font-label-bold font-bold">Hier, 16:00</td>
                    <td class="py-4">Français (Lecture)</td>
                    <td class="py-4 flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed">S</div>
                      Sophie M.
                    </td>
                    <td class="py-4">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-label-bold bg-[#E8F5E9] text-[#2E7D32] font-bold">
                        {t.parentPage.statusCompleted}
                      </span>
                    </td>
                  </tr>

                  <tr class="border-b border-surface-variant hover:bg-surface-container-low transition-colors">
                    <td class="py-4 font-label-bold font-bold">12 Mai, 17:30</td>
                    <td class="py-4">Arabe (Oral)</td>
                    <td class="py-4 flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-xs font-bold text-on-secondary-fixed">K</div>
                      Karim A.
                    </td>
                    <td class="py-4">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-label-bold bg-[#E8F5E9] text-[#2E7D32] font-bold">
                        {t.parentPage.statusCompleted}
                      </span>
                    </td>
                  </tr>

                  <tr class="hover:bg-surface-container-low transition-colors">
                    <td class="py-4 font-label-bold font-bold">08 Mai, 16:00</td>
                    <td class="py-4">Français (Écriture)</td>
                    <td class="py-4 flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed">S</div>
                      Sophie M.
                    </td>
                    <td class="py-4">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-label-bold bg-surface-variant text-on-surface-variant font-bold">
                        {t.parentPage.statusCancelled}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div class="lg:col-span-1">
          <section class="bg-surface-bright rounded-3xl p-6 soft-card-shadow border border-secondary-fixed/50 h-full flex flex-col card-hover-effect">
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-secondary text-[28px]">calendar_month</span>
              <h2 class="text-headline-md font-headline-md text-on-surface">{t.parentPage.upcomingTitle}</h2>
            </div>

            <div class="space-y-4 flex-grow">
              <div class="bg-surface rounded-2xl p-5 border border-outline-variant shadow-sm relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1.5 h-full bg-primary-container"></div>
                <div class="flex justify-between items-start mb-2">
                  <span class="bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold px-2.5 py-1 rounded-md uppercase">
                    {t.parentPage.todayTag}
                  </span>
                  <span class="text-tertiary font-label-bold text-xs font-bold">17:00 - 17:45</span>
                </div>
                <h3 class="font-label-bold text-lg text-on-surface mb-1 font-bold">Français - Lecture contée</h3>
                <p class="text-sm text-tertiary mb-4 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">person</span> Avec Sophie M.
                </p>
                <button className="w-full bg-[#4221b6] text-white min-h-[48px] px-4 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-[#341a99] transition-all flex items-center justify-center gap-2 cursor-pointer btn-join-responsive-336">
                  <span className="material-symbols-outlined text-xl">videocam</span>
                  <span>{t.parentPage.joinVideo}</span>
                </button>
              </div>

              <div class="bg-surface rounded-2xl p-5 border border-surface-variant shadow-sm">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-sm font-bold text-on-surface-variant">Mercredi 17 Mai</span>
                  <span class="text-tertiary font-label-bold text-xs font-bold">16:30 - 17:15</span>
                </div>
                <h3 class="font-label-bold text-base text-on-surface mb-1 font-bold">Arabe - Chansons</h3>
                <p class="text-sm text-tertiary mb-4 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">person</span> Avec Karim A.
                </p>
                <button class="w-full border-2 border-primary text-primary min-h-[48px] rounded-full font-label-bold hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold">
                  {t.parentPage.manageBtn}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/calendar')}
              class="mt-6 w-full py-4 text-primary font-label-bold flex items-center justify-center gap-2 hover:bg-surface-variant rounded-xl transition-colors cursor-pointer font-bold"
            >
              <span class="material-symbols-outlined">add_circle</span>
              {t.parentPage.planNew}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
