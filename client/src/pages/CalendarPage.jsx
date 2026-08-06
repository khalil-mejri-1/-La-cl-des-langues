import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function CalendarPage() {
  const { lang, t, isRtl } = useLanguage();
  const navigate = useNavigate();

  const [selectedDay, setSelectedDay] = useState(3);
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isPackSelected, setIsPackSelected] = useState(true);

  return (
    <div class="w-full max-w-3xl mx-auto px-container-margin py-8 md:py-16 flex flex-col gap-12 relative z-10 pb-32">
      <header className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-display-lg font-extrabold text-[#4221b6] tracking-tight title-calendar-responsive-441">{t.calendarPage.title}</h1>
        <p className="text-xs sm:text-sm md:text-body-lg text-on-surface-variant max-w-xl mx-auto font-medium">
          {t.calendarPage.subtitle}
        </p>
      </header>

      {/* Special Pack 4+1 Offer Section */}
      <section className="bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#FAF5FF] rounded-3xl p-4 sm:p-6 md:p-8 soft-card-shadow border-[3px] border-[#8c90f6] relative overflow-hidden transition-all duration-300 offer-section-responsive-375">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#8c90f6]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#78fd7d]/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-4 text-left rtl:text-right flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#4221b6] text-white font-label-bold text-xs font-bold shadow-sm uppercase tracking-wider animate-pulse">
                <span className="material-symbols-outlined text-sm">stars</span>
                {t.calendarPage.packOffer.badge}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#78fd7d] text-[#064e3b] font-label-bold text-xs font-bold shadow-sm">
                <span className="material-symbols-outlined text-sm">card_giftcard</span>
                {t.calendarPage.packOffer.freeTag}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl text-[#1c0576] font-extrabold leading-snug">
              {t.calendarPage.packOffer.title}
            </h2>

            <p className="text-xs sm:text-sm md:text-body-md font-body-md text-on-surface-variant leading-relaxed max-w-xl font-medium">
              {t.calendarPage.packOffer.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 bg-white/90 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-[#8c90f6]/40 shadow-sm offer-steps-box-375 w-full sm:w-auto">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#4221b6] text-white flex items-center justify-center font-extrabold text-[11px] sm:text-xs offer-step-circle-375">1</span>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#4221b6] text-white flex items-center justify-center font-extrabold text-[11px] sm:text-xs offer-step-circle-375">2</span>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#4221b6] text-white flex items-center justify-center font-extrabold text-[11px] sm:text-xs offer-step-circle-375">3</span>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#4221b6] text-white flex items-center justify-center font-extrabold text-[11px] sm:text-xs offer-step-circle-375">4</span>
                </div>
                <span className="text-sm sm:text-lg text-[#4221b6] font-bold">➔</span>
                <div className="relative flex items-center gap-1 bg-[#78fd7d] text-[#064e3b] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-extrabold text-xs shadow-md animate-bounce shrink-0">
                  <span>🎁</span>
                  <span>{lang === 'fr' ? '1 Gratuit' : '1 مجاناً'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs font-bold text-on-surface">
              {t.calendarPage.packOffer.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm px-2.5 py-2 rounded-xl border border-surface-variant/80">
                  <span className="material-symbols-outlined text-[#059669] text-base shrink-0">check_circle</span>
                  <span className="text-[11px] sm:text-xs">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-auto shrink-0 flex flex-col items-center justify-center gap-2.5 sm:gap-3 bg-white p-4 sm:p-6 rounded-2xl soft-card-shadow border-[2px] border-[#8c90f6] text-center shadow-lg">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#EEF2FF] text-[#4221b6] flex items-center justify-center text-2xl sm:text-3xl shadow-inner">
              🎁
            </div>
            <div className="text-[11px] sm:text-xs uppercase tracking-wider text-tertiary font-bold">{lang === 'fr' ? 'Offre Limitée' : 'عرض محدود'}</div>
            <div className="text-xl sm:text-2xl font-black text-[#1c0576]">4 + 1 <span className="text-[#059669]">{lang === 'fr' ? 'GRATUIT' : 'مجاناً'}</span></div>
            <button
              onClick={() => setIsPackSelected(!isPackSelected)}
              className={`w-full px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-label-bold text-xs sm:text-sm transition-all cursor-pointer font-bold flex items-center justify-center gap-2 shadow-md ${isPackSelected
                ? 'bg-[#059669] text-white hover:bg-[#047857]'
                : 'bg-[#78fd7d] text-[#064e3b] hover:brightness-95'
                }`}
            >
              <span className="material-symbols-outlined text-base sm:text-lg">
                {isPackSelected ? 'check_circle' : 'add_circle'}
              </span>
              {isPackSelected ? t.calendarPage.packOffer.activeTag : t.calendarPage.packOffer.selectBtn}
            </button>
          </div>
        </div>
      </section>

      {/* Step 1: Select Day */}
      <section class="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#D1E1EC] relative">
        <div class="absolute -top-4 -left-4 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline-md text-headline-md border-2 border-surface font-bold">
          1
        </div>
        <h2 class="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">calendar_today</span>
          {t.calendarPage.step1Title}
        </h2>

        <div class="grid grid-cols-7 gap-2 text-center mb-3">
          {t.calendarPage.daysOfWeek.map((dayName, idx) => (
            <div key={idx} class="text-label-bold font-label-bold text-on-surface-variant text-sm font-bold">
              {dayName}
            </div>
          ))}
        </div>

        <div class="grid grid-cols-7 gap-2 text-center">
          <div></div>
          <div></div>

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              class={`h-[48px] w-full rounded-full flex items-center justify-center text-body-md font-body-md transition-colors cursor-pointer font-bold ${selectedDay === d
                ? 'bg-primary-container text-on-primary shadow-md scale-105'
                : 'hover:bg-tertiary-fixed-dim text-on-surface'
                }`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Select Time */}
      <section class="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#D5E5D6] relative">
        <div class="absolute -top-4 -left-4 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline-md text-headline-md border-2 border-surface font-bold">
          2
        </div>
        <h2 class="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary">schedule</span>
          {t.calendarPage.step2Title}
        </h2>

        <div class="flex flex-wrap gap-4">
          {t.calendarPage.timeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTime(slot)}
              class={`flex-1 min-w-[100px] h-[56px] rounded-full border-2 font-label-bold text-label-bold flex items-center justify-center cursor-pointer transition-all ${selectedTime === slot
                ? 'bg-secondary-container text-on-secondary-container border-secondary font-bold shadow-sm'
                : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </section>

      {/* Step 3: Payment Methods Section */}
      <section class="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#C5CAE9] relative">
        <div class="absolute -top-4 -left-4 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline-md text-headline-md border-2 border-surface font-bold">
          3
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h2 class="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-[#4221b6]">credit_card</span>
            {t.calendarPage.step3Title}
          </h2>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-label-bold text-xs font-bold w-fit">
            <span class="material-symbols-outlined text-sm">lock</span>
            {lang === 'fr' ? 'Paiement Sécurisé 256-bit SSL' : 'دفع آمن ومشفر 256-bit SSL'}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.calendarPage.paymentMethods.map((method) => {
            const isSelected = selectedPaymentMethod === method.id;
            return (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                class={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${isSelected
                  ? 'border-[#4221b6] bg-white shadow-md scale-[1.01]'
                  : 'border-surface-variant bg-surface/50 hover:bg-white hover:border-[#8c90f6]/50'
                  }`}
              >
                {method.badge && (
                  <span class={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isSelected ? 'bg-[#4221b6] text-white' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                    {method.badge}
                  </span>
                )}

                <div class="flex items-start gap-4">
                  <div class={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#EEF2FF] text-[#4221b6]' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                    <span class="material-symbols-outlined text-2xl">{method.icon}</span>
                  </div>

                  <div class="space-y-1 pr-6 rtl:pr-0 rtl:pl-6">
                    <h3 class="font-bold text-base text-on-surface flex items-center gap-2">
                      {method.name}
                    </h3>
                    <p class="text-xs text-on-surface-variant leading-relaxed">
                      {method.desc}
                    </p>
                  </div>
                </div>

                {method.id === 'card' && (
                  <div class="flex items-center gap-2 pt-2 border-t border-surface-variant/50">
                    <span class="text-[11px] font-bold text-tertiary">Cartes:</span>
                    <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black">VISA</span>
                    <span class="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-black">Mastercard</span>
                    <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">E-Dinar</span>
                  </div>
                )}

                {method.id === 'fawran' && (
                  <div class="flex items-center gap-2 pt-2 border-t border-surface-variant/50">
                    <span class="text-[11px] font-bold text-tertiary">{lang === 'fr' ? 'Service:' : 'الخدمة:'}</span>
                    <span class="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black">Fawran (فوراً)</span>
                    <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">{lang === 'fr' ? 'Virement Instantané' : 'تحويل فوري'}</span>
                  </div>
                )}

                <div class="flex items-center justify-end">
                  <div class={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#4221b6] bg-[#4221b6]' : 'border-outline-variant'
                    }`}>
                    {isSelected && <span class="w-2 h-2 rounded-full bg-white"></span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div class="mt-6 pt-5 border-t border-surface-variant/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div class="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-medium">
            <span class="material-symbols-outlined text-[#059669] text-base">verified_user</span>
            <span>{lang === 'fr' ? 'Garantie 100% Satisfait' : 'ضمان 100% رضا العملاء'}</span>
          </div>
          <div class="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-medium">
            <span class="material-symbols-outlined text-[#4221b6] text-base">bolt</span>
            <span>{lang === 'fr' ? 'Confirmation immédiate' : 'تأكيد فوري بعد الدفع'}</span>
          </div>
          <div class="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-medium">
            <span class="material-symbols-outlined text-[#d946ef] text-base">headset_mic</span>
            <span>{lang === 'fr' ? 'Support client 7j/7' : 'دعم فني متاح 7 أيام'}</span>
          </div>
        </div>
      </section>

      <section class="flex flex-col items-center justify-center mt-4">
        <button
          onClick={() => setIsSuccessOpen(true)}
          class="bg-primary-container text-on-primary font-label-bold text-headline-md px-12 py-4 h-[72px] w-full md:w-auto rounded-full chunky-shadow-primary transition-transform flex items-center justify-center gap-2 cursor-pointer font-bold"
        >
          {t.calendarPage.confirmButton}
          <span class="material-symbols-outlined">check_circle</span>
        </button>
        <p class="mt-4 text-on-surface-variant text-body-md font-body-md">{t.calendarPage.eagerText}</p>
      </section>

      {/* Success Booking Modal Overlay */}
      {isSuccessOpen && (
        <div class="fixed inset-0 bg-surface/95 z-50 flex flex-col items-center justify-center p-container-margin backdrop-blur-sm">
          <div class="text-center space-y-6 max-w-lg">
            <div class="relative w-64 h-64 mx-auto animate-bounce">
              <img
                alt="Mascot celebrating"
                class="object-contain w-full h-full drop-shadow-xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF-VgHZWivqK0W6c5fa_VKkY0L-pIuXnMOONzEFytFG-zLHuG4tkUuGky5v-ViLjzhK1IX-z7ieazinQTvBAynhmrlnpD6QCbmytyBkxdwnQ1WZrIW6oIrpuci_8qWFnKEVCdQkpDJRWy0Z-4dU5bP9hYyYRnu2L48NivQ6aVab9Eetf-U8FK45VgF1t4JEeLEwVcHHkamYSu-Y5xJQ-cjWxsOeLn2Z1R2NmC-goe6GYnD1FtjC3PS"
              />
            </div>
            <h2 class="text-display-lg font-display-lg text-primary">{t.calendarPage.successTitle}</h2>
            <p class="text-headline-md font-headline-md text-on-surface">
              {t.calendarPage.successMsg.replace('{day}', selectedDay).replace('{time}', selectedTime)}
            </p>
            <button
              onClick={() => { setIsSuccessOpen(false); navigate('/parent'); }}
              class="mt-8 bg-secondary-container text-on-secondary-container font-label-bold text-label-bold px-8 h-[56px] rounded-full chunky-shadow-primary transition-transform inline-flex items-center gap-2 cursor-pointer font-bold"
            >
              {t.calendarPage.backHome}
              <span class="material-symbols-outlined">home</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
