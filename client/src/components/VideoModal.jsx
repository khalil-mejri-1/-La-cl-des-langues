import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export function getEmbedUrl(url) {
  if (!url) return 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1';
  if (url.includes('embed/')) return url.includes('autoplay=1') ? url : `${url}?autoplay=1`;
  if (url.includes('v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }
  return url;
}

export default function VideoModal({ videoUrl, onClose }) {
  const { lang, t } = useLanguage();
  const rawUrl = videoUrl || t.homePage?.videoUrl || 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1';
  const finalEmbedUrl = getEmbedUrl(rawUrl);

  return (
    <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-5xl w-full relative soft-card-shadow flex flex-col items-center gap-4 border-2 border-[#8c90f6] animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h3 className="text-xl font-extrabold text-[#1c0576] mt-2">
          {lang === 'fr' ? 'Démo de l\'application' : lang === 'ar' ? 'العرض التوضيحي للتطبيق' : 'App Demo'}
        </h3>
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center relative shadow-2xl">
          <iframe
            className="w-full h-full"
            src={finalEmbedUrl}
            title="Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}
