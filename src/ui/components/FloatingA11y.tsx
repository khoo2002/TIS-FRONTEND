import React, { useState } from 'react';
import FontSizeControl from './FontSizeControl';
import { useTheme } from 'next-themes'

export default function FloatingA11y() {
  const [open, setOpen] = useState(false);
  const [translateActive, setTranslateActive] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  const applyTheme = (isDark: boolean) => {
    setTheme(isDark ? 'dark' : 'light');
  };

  const toggleGoogleTranslate = () => {
    if (!translateActive) {
      if (window.google && window.google.translate && (window.google.translate.TranslateElement)) {
        try {
          // @ts-ignore
          new window.google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
        } catch (e) {
          const existing = document.getElementById('google-translate-script');
          if (existing) existing.remove();
          const script = document.createElement('script');
          script.id = 'google-translate-script';
          script.src = `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
          script.async = true;
          document.body.appendChild(script);

          // @ts-ignore
          window.googleTranslateElementInit = () => {
            // @ts-ignore
            new window.google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
          };
        }
      } else {
        if (!document.getElementById('google-translate-script')) {
          const script = document.createElement('script');
          script.id = 'google-translate-script';
          script.src = `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
          script.async = true;
          document.body.appendChild(script);

          // @ts-ignore
          window.googleTranslateElementInit = () => {
            // @ts-ignore
            new window.google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
          };
        }
      }
    } else {
      const translateElement = document.getElementById('google_translate_element');
      if (translateElement) {
        translateElement.innerHTML = '';
      }
      const script = document.getElementById('google-translate-script');
      if (script) script.remove();
      try {
        // @ts-ignore
        delete window.google;
        // @ts-ignore
        delete window.googleTranslateElementInit;
      } catch (e) {
        // ignore
      }
    }

    setTranslateActive((t) => !t);
  };

  return (
    <div
      className={`a11y-widget fixed z-50 left-0 ${open ? 'w-64' : 'w-12'} transition-all duration-300`}
    >
      <button
        aria-label="Accessibility toggler"
        onClick={() => setOpen((o) => !o)}
        className="bg-pink-500 text-white p-3 rounded-full shadow-lg hover:bg-pink-600 transition-colors"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M12 6V4m0 16v-2m6-6h2M4 12h2m13.66-6.34l-1.41 1.41M7.76 7.76L6.34 6.34m12.02 12.02l-1.41-1.41M7.76 16.24l-1.41 1.41M12 8v4l2 1"></path>
          </svg>
        )}
      </button>

      {open && (
        <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <strong className="text-gray-800 dark:text-gray-200">Accessibility</strong>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-300">Font size</label>
            <FontSizeControl />
          </div>

          <button
            onClick={() => applyTheme(resolvedTheme !== 'dark')}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm"
          >
            {resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>

          <button
            onClick={toggleGoogleTranslate}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm"
          >
            {translateActive ? 'Deactivate Google Translate' : 'Activate Google Translate'}
          </button>

          <div id="google_translate_element" className="mt-2"></div>
        </div>
      )}
    </div>
  );
}
