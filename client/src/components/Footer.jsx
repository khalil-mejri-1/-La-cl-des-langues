import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer class="bg-surface-container-low dark:bg-surface-container-lowest w-full rounded-t-lg pb-24 md:pb-0">
      <div class="flex flex-col md:flex-row justify-between items-center px-container-margin py-12 gap-gutter w-full max-w-7xl mx-auto">
        <div class="flex flex-col items-center md:items-start gap-4">
          <div class="text-headline-md font-headline-md text-secondary">{t.brand}</div>
          <div class="w-16 h-16">
            <img
              alt="Mascotte miniature"
              class="w-full h-full object-contain opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF-VgHZWivqK0W6c5fa_VKkY0L-pIuXnMOONzEFytFG-zLHuG4tkUuGky5v-ViLjzhK1IX-z7ieazinQTvBAynhmrlnpD6QCbmytyBkxdwnQ1WZrIW6oIrpuci_8qWFnKEVCdQkpDJRWy0Z-4dU5bP9hYyYRnu2L48NivQ6aVab9Eetf-U8FK45VgF1t4JEeLEwVcHHkamYSu-Y5xJQ-cjWxsOeLn2Z1R2NmC-goe6GYnD1FtjC3PS"
            />
          </div>
        </div>

        <div class="text-tertiary dark:text-tertiary-fixed text-body-md font-body-md text-center">
          {t.footer.copy}
        </div>

        <div class="flex gap-6">
          <a class="text-on-surface-variant hover:underline hover:text-primary font-label-bold text-sm" href="#">
            {t.footer.parents}
          </a>
          <a class="text-on-surface-variant hover:underline hover:text-primary font-label-bold text-sm" href="#">
            {t.footer.help}
          </a>
          <a class="text-on-surface-variant hover:underline hover:text-primary font-label-bold text-sm" href="#">
            {t.footer.privacy}
          </a>
        </div>
      </div>
    </footer>
  );
}
