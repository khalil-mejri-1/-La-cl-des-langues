import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function VideoModal({ onClose }) {
  const { lang } = useLanguage();

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-surface rounded-3xl p-6 max-w-5xl w-full relative soft-card-shadow flex flex-col items-center gap-4">
        <button
          onClick={onClose}
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
        <h3 class="text-headline-md font-headline-md text-primary mt-2">
          {lang === 'fr' ? 'Démo de l\'application' : 'العرض التوضيحي للتطبيق'}
        </h3>
        <div class="w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center relative">
          <iframe
            class="w-full h-full"
            src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
            title="Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}
