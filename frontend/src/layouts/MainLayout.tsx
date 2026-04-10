import React from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { useTheme, useAccessibility } from '../hooks/useLocalStorage';
import { useApp } from '../context/AppContext';
import { languages, Language, translations } from '../constants/translations';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useApp();
  const { dyslexicFont, setDyslexicFont, highContrast, setHighContrast } = useAccessibility();
  const [showLanguageMenu, setShowLanguageMenu] = React.useState(false);
  const [showAccessibility, setShowAccessibility] = React.useState(false);

  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'dark bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center text-white font-bold`}>
                M
              </div>
              <h1 className="text-xl font-bold">{translations[language].appName}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowLanguageMenu(!showLanguageMenu);
                    setShowAccessibility(false);
                  }}
                  className={`p-2 rounded-lg flex items-center gap-2 hover:${isDark ? 'bg-slate-700' : 'bg-slate-100'} transition-colors`}
                  aria-label="Language selector"
                  title={`Current language: ${languages.find(l => l.value === language)?.label}`}
                >
                  <Globe size={20} />
                  <span className="text-sm font-medium hidden sm:inline">{language.toUpperCase()}</span>
                </button>

                {showLanguageMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'} overflow-hidden`}>
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => {
                          setLanguage(lang.value as Language);
                          setShowLanguageMenu(false);
                        }}
                        className={`block w-full text-left px-4 py-3 hover:${isDark ? 'bg-slate-700' : 'bg-slate-100'} transition-colors ${language === lang.value ? (isDark ? 'bg-blue-600' : 'bg-blue-50') : ''}`}
                      >
                        <span className="font-medium">{lang.label}</span>
                        {language === lang.value && <span className="text-sm ml-2">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Accessibility Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAccessibility(!showAccessibility);
                    setShowLanguageMenu(false);
                  }}
                  className={`p-2 rounded-lg hover:${isDark ? 'bg-slate-700' : 'bg-slate-100'} transition-colors`}
                  aria-label="Accessibility settings"
                  title="Accessibility options"
                >
                  <span className="text-lg">♿</span>
                </button>

                {showAccessibility && (
                  <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'} p-4 space-y-4 z-50`}>
                    <h3 className="font-semibold text-sm">{translations[language].accessibility.title}</h3>
                    
                    <label className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                      <input
                        type="checkbox"
                        checked={dyslexicFont}
                        onChange={(e) => setDyslexicFont(e.target.checked)}
                        className="w-4 h-4 rounded"
                        aria-label={translations[language].accessibility.dyslexicFont}
                      />
                      <span className="text-sm">{translations[language].accessibility.dyslexicFont}</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                      <input
                        type="checkbox"
                        checked={highContrast}
                        onChange={(e) => setHighContrast(e.target.checked)}
                        className="w-4 h-4 rounded"
                        aria-label={translations[language].accessibility.highContrast}
                      />
                      <span className="text-sm">{translations[language].accessibility.highContrast}</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-2 rounded-lg hover:${isDark ? 'bg-slate-700' : 'bg-slate-100'} transition-colors`}
                aria-label="Toggle dark mode"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
