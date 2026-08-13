import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import EditSectionModal from '../components/EditSectionModal';

export default function CalendarPage() {
  const { lang, t, isRtl } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedDay, setSelectedDay] = useState(3);
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isPackSelected, setIsPackSelected] = useState(true);

  const [editingSectionModal, setEditingSectionModal] = useState(null); // { key, title }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 flex flex-col gap-10 relative z-10 pb-32">
      
      {/* 1. Header Section */}
      <header className="text-center space-y-3 relative p-4 rounded-3xl">
        {/* Admin Edit Button */}
        {user?.role?.toLowerCase() === 'admin' && (
          <button
            onClick={() => setEditingSectionModal({ key: 'calendarHeader', title: lang === 'ar' ? 'عنوان صفحة الحجز' : 'En-tête de réservation' })}
            className="absolute top-0 right-0 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
          </button>
        )}

        <h1 className="text-2xl sm:text-3xl md:text-display-lg font-extrabold text-[#4221b6] tracking-tight title-calendar-responsive-441">{t.calendarPage?.title}</h1>
        <p className="text-xs sm:text-sm md:text-body-lg text-on-surface-variant max-w-xl mx-auto font-medium">
          {t.calendarPage?.subtitle}
        </p>
      </header>

      {/* 2. Sleek & Professional Free Trial Offer Section */}
      <section className="bg-gradient-to-br from-[#f5f3ff] via-[#ffffff] to-[#eef9f2] rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border-2 border-[#8c90f6]/40 relative overflow-hidden transition-all duration-300">
        
        {/* Background Decorative Lighting Circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#8c90f6]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#78fd7d]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Bar for Section */}
        <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#4221b6] text-white font-black text-xs shadow-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">verified</span>
              {t.calendarPage?.packOffer?.badge || (lang === 'fr' ? 'OFFRE SANS ENGAGEMENT' : lang === 'ar' ? 'عرض التّجربة بدون التزام' : 'NO COMMITMENT OFFER')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#78fd7d] text-[#064e3b] font-black text-xs shadow-sm">
              <span className="material-symbols-outlined text-sm">card_giftcard</span>
              {t.calendarPage?.packOffer?.freeTag || (lang === 'fr' ? '100% Gratuite !' : lang === 'ar' ? '100% مجانية!' : '100% Free!')}
            </span>
          </div>

          {/* Admin Edit Button */}
          {user?.role?.toLowerCase() === 'admin' && (
            <button
              onClick={() => setEditingSectionModal({ key: 'calendarPack', title: lang === 'ar' ? 'قسم العرض التجريبي' : 'Offre Séance d\'essai' })}
              className="flex items-center gap-1.5 bg-[#4221b6] text-white px-3.5 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border border-white/40 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>{lang === 'ar' ? 'تعديل هذا القسم' : 'Modifier la section'}</span>
            </button>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Offer Info & Features */}
          <div className="lg:col-span-7 space-y-5 text-left rtl:text-right">
            <h2 className="text-2xl sm:text-3xl md:text-4xl text-[#1c0576] font-black leading-tight tracking-tight">
              {t.calendarPage?.packOffer?.title}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
              {t.calendarPage?.packOffer?.subtitle}
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {t.calendarPage?.packOffer?.features?.map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-[#8c90f6] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base font-bold">check</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Floating Action Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#8c90f6]/50 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden group hover:border-[#4221b6] transition-all">
              
              {/* Gift Badge Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#EEF2FF] to-[#E0D7FF] text-[#4221b6] flex items-center justify-center text-3xl shadow-inner border border-[#8c90f6]/30 group-hover:scale-110 transition-transform">
                🎁
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {lang === 'fr' ? 'SÉANCE D\'ESSAI' : lang === 'ar' ? 'جلسة تجريبية' : 'TRIAL SESSION'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#1c0576]">
                  {lang === 'fr' ? '100% GRATUITE' : lang === 'ar' ? 'مجانية 100%' : '100% FREE'}
                </div>
                <p className="text-xs text-emerald-600 font-bold">
                  {lang === 'fr' ? 'Sans carte bancaire requise' : lang === 'ar' ? 'بدون الحاجة لبطاقة بنكية' : 'No credit card required'}
                </p>
              </div>

              {/* Interactive CTA Toggle Button */}
              <button
                type="button"
                onClick={() => setIsPackSelected(!isPackSelected)}
                className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                  isPackSelected
                    ? 'bg-[#059669] text-white hover:bg-[#047857] shadow-emerald-200'
                    : 'bg-[#4221b6] text-white hover:bg-[#341a99] shadow-indigo-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isPackSelected ? 'check_circle' : 'bolt'}
                </span>
                <span>
                  {isPackSelected
                    ? (t.calendarPage?.packOffer?.activeTag || (lang === 'fr' ? 'Séance d\'essai sélectionnée ✓' : lang === 'ar' ? 'تم اختيار الجلسة ✓' : 'Trial Selected ✓'))
                    : (t.calendarPage?.packOffer?.selectBtn || (lang === 'fr' ? 'Réserver ma séance gratuite' : lang === 'ar' ? 'احجز جلستك المجانية' : 'Book My Free Trial'))
                  }
                </span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Step 1: Select Day */}
      <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#D1E1EC] relative">
        {/* Admin Edit Button */}
        {user?.role?.toLowerCase() === 'admin' && (
          <button
            onClick={() => setEditingSectionModal({ key: 'calendarStep1', title: lang === 'ar' ? 'عنوان الخطوة الأولى' : 'Étape 1 : Choisir un jour' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
          </button>
        )}

        <div className="absolute -top-4 -left-4 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline-md text-headline-md border-2 border-surface font-bold">
          1
        </div>
        <h2 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">calendar_today</span>
          {t.calendarPage?.step1Title}
        </h2>

        <div className="grid grid-cols-7 gap-2 text-center mb-3">
          {t.calendarPage?.daysOfWeek?.map((dayName, idx) => (
            <div key={idx} className="text-label-bold font-label-bold text-on-surface-variant text-sm font-bold">
              {dayName}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          <div></div>
          <div></div>

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`h-[48px] w-full rounded-full flex items-center justify-center text-body-md font-body-md transition-colors cursor-pointer font-bold ${selectedDay === d
                ? 'bg-primary-container text-on-primary shadow-md scale-105'
                : 'hover:bg-tertiary-fixed-dim text-on-surface'
                }`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Step 2: Select Time */}
      <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#D5E5D6] relative">
        {/* Admin Edit Button */}
        {user?.role?.toLowerCase() === 'admin' && (
          <button
            onClick={() => setEditingSectionModal({ key: 'calendarStep2', title: lang === 'ar' ? 'عنوان الخطوة الثانية' : 'Étape 2 : Choisir l\'heure' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
          </button>
        )}

        <div className="absolute -top-4 -left-4 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline-md text-headline-md border-2 border-surface font-bold">
          2
        </div>
        <h2 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">schedule</span>
          {t.calendarPage?.step2Title}
        </h2>

        <div className="flex flex-wrap gap-4">
          {t.calendarPage?.timeSlots?.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTime(slot)}
              className={`flex-1 min-w-[100px] h-[56px] rounded-full border-2 font-label-bold text-label-bold flex items-center justify-center cursor-pointer transition-all ${selectedTime === slot
                ? 'bg-secondary-container text-on-secondary-container border-secondary font-bold shadow-sm'
                : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary'
                }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </section>

      {/* 5. Step 3: Payment Methods Section */}
      <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 soft-card-shadow border border-[#C5CAE9] relative">
        {/* Admin Edit Button */}
        {user?.role?.toLowerCase() === 'admin' && (
          <button
            onClick={() => setEditingSectionModal({ key: 'calendarStep3', title: lang === 'ar' ? 'عنوان وتأكيد الدفع' : 'Étape 3 : Paiement' })}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-[#4221b6] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer border-2 border-white/40"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{lang === 'ar' ? 'تعديل' : 'Modifier'}</span>
          </button>
        )}

        <div className="absolute -top-4 -left-4 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-headline-md text-headline-md border-2 border-surface font-bold">
          3
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pr-24 rtl:pr-0 rtl:pl-24">
          <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4221b6]">credit_card</span>
            {t.calendarPage?.step3Title}
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-label-bold text-xs font-bold w-fit">
            <span className="material-symbols-outlined text-sm">lock</span>
            {lang === 'fr' ? 'Paiement Sécurisé 256-bit SSL' : lang === 'ar' ? 'دفع آمن ومشفر 256-bit SSL' : '256-bit SSL Secure Payment'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.calendarPage?.paymentMethods?.map((method) => {
            const isSelected = selectedPaymentMethod === method.id;
            return (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${isSelected
                  ? 'border-[#4221b6] bg-white shadow-md scale-[1.01]'
                  : 'border-surface-variant bg-surface/50 hover:bg-white hover:border-[#8c90f6]/50'
                  }`}
              >
                {method.badge && (
                  <span className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isSelected ? 'bg-[#4221b6] text-white' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                    {method.badge}
                  </span>
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#EEF2FF] text-[#4221b6]' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                    <span className="material-symbols-outlined text-2xl">{method.icon}</span>
                  </div>

                  <div className="space-y-1 pr-6 rtl:pr-0 rtl:pl-6">
                    <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                      {method.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {method.desc}
                    </p>
                  </div>
                </div>

                {method.id === 'card' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-variant/50">
                    <span className="text-[11px] font-bold text-tertiary">Cartes:</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black">VISA</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-black">Mastercard</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">E-Dinar</span>
                  </div>
                )}

                {method.id === 'fawran' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-variant/50">
                    <span className="text-[11px] font-bold text-tertiary">{lang === 'fr' ? 'Service:' : lang === 'ar' ? 'الخدمة:' : 'Service:'}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black">Fawran (فوراً)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">{lang === 'fr' ? 'Virement Instantané' : lang === 'ar' ? 'تحويل فوري' : 'Instant Wire Transfer'}</span>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#4221b6] bg-[#4221b6]' : 'border-outline-variant'
                    }`}>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-5 border-t border-surface-variant/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[#059669] text-base">verified_user</span>
            <span>{lang === 'fr' ? 'Garantie 100% Satisfait' : lang === 'ar' ? 'ضمان 100% رضا العملاء' : '100% Satisfaction Guaranteed'}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[#4221b6] text-base">bolt</span>
            <span>{lang === 'fr' ? 'Confirmation immédiate' : lang === 'ar' ? 'تأكيد فوري بعد الدفع' : 'Instant Confirmation'}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[#d946ef] text-base">headset_mic</span>
            <span>{lang === 'fr' ? 'Support client 7j/7' : lang === 'ar' ? 'دعم فني متاح 7 أيام' : '24/7 Support'}</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center justify-center mt-4">
        <button
          onClick={() => setIsSuccessOpen(true)}
          className="bg-primary-container text-on-primary font-label-bold text-headline-md px-12 py-4 h-[72px] w-full md:w-auto rounded-full chunky-shadow-primary transition-transform flex items-center justify-center gap-2 cursor-pointer font-bold"
        >
          {t.calendarPage?.confirmButton}
          <span className="material-symbols-outlined">check_circle</span>
        </button>
        <p className="mt-4 text-on-surface-variant text-body-md font-body-md">{t.calendarPage?.eagerText}</p>
      </section>

      {/* Success Booking Modal Overlay */}
      {isSuccessOpen && (
        <div className="fixed inset-0 bg-surface/95 z-50 flex flex-col items-center justify-center p-container-margin backdrop-blur-sm">
          <div className="text-center space-y-6 max-w-lg">
            <div className="relative w-64 h-64 mx-auto animate-bounce">
              <img
                alt="Mascot celebrating"
                className="object-contain w-full h-full drop-shadow-xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF-VgHZWivqK0W6c5fa_VKkY0L-pIuXnMOONzEFytFG-zLHuG4tkUuGky5v-ViLjzhK1IX-z7ieazinQTvBAynhmrlnpD6QCbmytyBkxdwnQ1WZrIW6oIrpuci_8qWFnKEVCdQkpDJRWy0Z-4dU5bP9hYyYRnu2L48NivQ6aVab9Eetf-U8FK45VgF1t4JEeLEwVcHHkamYSu-Y5xJQ-cjWxsOeLn2Z1R2NmC-goe6GYnD1FtjC3PS"
              />
            </div>
            <h2 className="text-display-lg font-display-lg text-primary">{t.calendarPage?.successTitle}</h2>
            <p className="text-headline-md font-headline-md text-on-surface">
              {t.calendarPage?.successMsg?.replace('{day}', selectedDay).replace('{time}', selectedTime)}
            </p>
            <button
              onClick={() => { setIsSuccessOpen(false); navigate('/parent'); }}
              className="mt-8 bg-secondary-container text-on-secondary-container font-label-bold text-label-bold px-8 h-[56px] rounded-full chunky-shadow-primary transition-transform inline-flex items-center gap-2 cursor-pointer font-bold"
            >
              {t.calendarPage?.backHome}
              <span className="material-symbols-outlined">home</span>
            </button>
          </div>
        </div>
      )}

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
