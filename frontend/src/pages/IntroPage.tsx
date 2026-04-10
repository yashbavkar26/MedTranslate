import React from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../constants/translations';

export function IntroPage() {
  const { setCurrentPage, language } = useApp();
  const t = translations[language];

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl">
              <Activity size={48} className="text-white" />
            </div>
          </div>

          <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t.intro.title}
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t.intro.description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
          <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="font-semibold text-lg mb-2">Plain Language Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Convert complex medical jargon into easy-to-understand summaries
            </p>
          </div>

          <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="text-3xl mb-3">🚨</div>
            <h3 className="font-semibold text-lg mb-2">Emergency Triage</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get color-coded guidance on when to seek immediate medical care
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setCurrentPage('login')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 active:scale-95 group"
        >
          {t.intro.getStarted}
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Tagline */}
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          {t.tagline}
        </p>
      </div>
    </div>
  );
}
