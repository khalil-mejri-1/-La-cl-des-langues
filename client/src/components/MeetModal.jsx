import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function MeetModal({ session, onClose, onSave }) {
  const { lang, t, isRtl } = useLanguage();
  const [meetInput, setMeetInput] = useState(session?.meetUrl || 'https://meet.google.com/');
  const [statusInput, setStatusInput] = useState(session?.status || (session?.meetUrl ? 'meet_added' : 'pending'));

  const studentDisplayName = session?.studentName || session?.name || session?.childName || session?.parentName || 'Élève';

  const handleSave = () => {
    onSave(session._id || session.id, meetInput, statusInput);
  };

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full relative soft-card-shadow flex flex-col gap-4 border-2 border-[#8c90f6] animate-in fade-in zoom-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-xl">videocam</span>
            </div>
            <h3 className="text-base font-extrabold text-[#1c0576]">{t.adminPage.modalTitle || 'Modifier la session'}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <p className="text-xs text-slate-500 font-semibold mb-1">
            {t.adminPage.modalSessionFor} <strong className="text-slate-800 text-sm font-black">{studentDisplayName}</strong>
          </p>
          <p className="text-xs text-[#4221b6] font-extrabold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">event</span>
            <span>{session.datetime || `${session.day}, ${session.time}`}</span>
            <span>•</span>
            <span>{session.subject}</span>
          </p>
        </div>

        {/* Google Meet Link Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold text-slate-700">{t.adminPage.modalLabel || 'Lien Google Meet :'}</label>
          <input
            type="url"
            value={meetInput}
            onChange={(e) => setMeetInput(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-[#4221b6] focus:outline-none"
          />
        </div>

        {/* Status / Nature of the Session Selector */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-extrabold text-slate-700">
            {lang === 'ar' ? 'حالة / طبيعة الحصة :' : 'Statut / Nature de la séance :'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Pending */}
            <button
              type="button"
              onClick={() => setStatusInput('pending')}
              className={`p-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                statusInput === 'pending'
                  ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm scale-[1.02]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg text-amber-600">hourglass_top</span>
              <span>{lang === 'ar' ? 'في الانتظار' : 'Pending'}</span>
            </button>

            {/* 2. Meet Added */}
            <button
              type="button"
              onClick={() => setStatusInput('meet_added')}
              className={`p-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                statusInput === 'meet_added'
                  ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm scale-[1.02]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg text-blue-600">videocam</span>
              <span>{lang === 'ar' ? 'تمت إضافة الرابط' : 'Lien Ajouté'}</span>
            </button>

            {/* 3. Complété / Completed */}
            <button
              type="button"
              onClick={() => setStatusInput('completed')}
              className={`p-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                statusInput === 'completed' || statusInput === 'done'
                  ? 'border-emerald-600 bg-emerald-100 text-emerald-900 shadow-sm scale-[1.02]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg text-emerald-600">check_circle</span>
              <span>{lang === 'ar' ? 'مكتملة' : 'Complété'}</span>
            </button>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {t.adminPage.cancelBtn || 'Annuler'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-full bg-[#4221b6] hover:bg-[#341a99] text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>{t.adminPage.saveBtn || 'Enregistrer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
