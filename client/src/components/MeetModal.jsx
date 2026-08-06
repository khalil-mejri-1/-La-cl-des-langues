import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function MeetModal({ session, onClose, onSave }) {
  const { t } = useLanguage();
  const [meetInput, setMeetInput] = useState(session?.meetUrl || 'https://meet.google.com/');

  const handleSave = () => {
    onSave(session.id, meetInput);
  };

  if (!session) return null;

  return (
    <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-surface rounded-3xl p-6 max-w-md w-full relative soft-card-shadow flex flex-col gap-4">
        <div class="flex justify-between items-center border-b border-surface-variant pb-3">
          <h3 class="text-headline-md font-headline-md text-on-surface">{t.adminPage.modalTitle}</h3>
          <button
            onClick={onClose}
            class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <p class="text-body-md font-body-md text-on-surface-variant">
          {t.adminPage.modalSessionFor} <strong class="text-on-surface">{session.name}</strong><br />
          <span class="text-xs text-tertiary">{session.datetime} - {session.subject}</span>
        </p>

        <div>
          <label class="block text-label-bold font-label-bold text-on-surface mb-2 text-sm">{t.adminPage.modalLabel}</label>
          <input
            type="url"
            value={meetInput}
            onChange={(e) => setMeetInput(e.target.value)}
            placeholder="https://meet.google.com/..."
            class="w-full h-12 px-4 rounded-xl border-2 border-surface-variant bg-surface focus:border-primary-container outline-none font-body-md"
          />
        </div>

        <div class="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            class="px-5 py-2.5 rounded-full border-2 border-primary text-primary font-label-bold hover:bg-primary-fixed transition-colors cursor-pointer font-bold text-sm"
          >
            {t.adminPage.cancelBtn}
          </button>
          <button
            onClick={handleSave}
            class="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-bold chunky-shadow-primary flex items-center gap-2 cursor-pointer font-bold text-sm"
          >
            <span class="material-symbols-outlined text-sm">save</span>
            {t.adminPage.saveBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
