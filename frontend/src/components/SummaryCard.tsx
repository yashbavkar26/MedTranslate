import React from 'react';
import { AnalysisResult } from '../constants/mockData';
import { translations } from '../constants/translations';
import { useApp } from '../context/AppContext';

interface SummaryCardProps {
  result: AnalysisResult;
}

export function SummaryCard({ result }: SummaryCardProps) {
  const { language } = useApp();
  const t = translations[language];
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-slate-800 border-blue-600/30' : 'bg-blue-50 border-blue-200'} p-6 shadow-lg`}>
      <h3 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">
        {t.dashboard.plainLanguageSummary}
      </h3>
      
      <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-white'} border ${isDark ? 'border-slate-600' : 'border-blue-100'}`}>
        <p className="text-base leading-relaxed">
          {result.summary}
        </p>
      </div>

      {result.fullReport && (
        <details className="mt-4">
          <summary className="cursor-pointer font-medium text-blue-600 dark:text-blue-400 hover:underline">
            View Full Report
          </summary>
          <pre className={`mt-3 p-4 rounded-lg text-sm overflow-auto ${isDark ? 'bg-slate-700' : 'bg-gray-100'} whitespace-pre-wrap break-words max-h-64`}>
            {result.fullReport}
          </pre>
        </details>
      )}
    </div>
  );
}
