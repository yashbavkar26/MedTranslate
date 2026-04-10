import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { translations } from '../constants/translations';
import { useApp } from '../context/AppContext';
import { useAccessibility } from '../hooks/useLocalStorage';

interface TriageIndicatorProps {
  level: 'red' | 'yellow' | 'green';
}

export function TriageIndicator({ level }: TriageIndicatorProps) {
  const { language } = useApp();
  const { highContrast } = useAccessibility();
  const t = translations[language];
  const isDark = document.documentElement.classList.contains('dark');

  const config = {
    red: {
      icon: AlertTriangle,
      emoji: '⚠️',
      label: t.dashboard.erAlert,
      bgClass: highContrast 
        ? 'bg-black border-white' 
        : isDark ? 'bg-red-900/30 border-red-600/50' : 'bg-red-50 border-red-200',
      textClass: highContrast 
        ? 'text-white' 
        : isDark ? 'text-red-600 dark:text-red-400' : 'text-red-600 dark:text-red-400',
      badgeClass: highContrast 
        ? 'bg-white' 
        : isDark ? 'bg-red-600' : 'bg-red-500',
      badgeIconClass: highContrast ? 'text-black' : 'text-white',
      description: 'Seek emergency medical care immediately. This is a medical emergency.'
    },
    yellow: {
      icon: AlertCircle,
      emoji: '🔔',
      label: t.dashboard.doctorAlert,
      bgClass: highContrast 
        ? 'bg-black border-white' 
        : isDark ? 'bg-yellow-900/30 border-yellow-600/50' : 'bg-yellow-50 border-yellow-200',
      textClass: highContrast 
        ? 'text-white' 
        : isDark ? 'text-yellow-600 dark:text-yellow-400' : 'text-yellow-600 dark:text-yellow-400',
      badgeClass: highContrast 
        ? 'bg-white' 
        : isDark ? 'bg-yellow-600' : 'bg-yellow-500',
      badgeIconClass: highContrast ? 'text-black' : 'text-white',
      description: 'Schedule an appointment with your doctor within 24 hours. Do not delay.'
    },
    green: {
      icon: CheckCircle,
      emoji: '✅',
      label: t.dashboard.homeAlert,
      bgClass: highContrast 
        ? 'bg-black border-white' 
        : isDark ? 'bg-green-900/30 border-green-600/50' : 'bg-green-50 border-green-200',
      textClass: highContrast 
        ? 'text-white' 
        : isDark ? 'text-green-600 dark:text-green-400' : 'text-green-600 dark:text-green-400',
      badgeClass: highContrast 
        ? 'bg-white' 
        : isDark ? 'bg-green-600' : 'bg-green-500',
      badgeIconClass: highContrast ? 'text-black' : 'text-white',
      description: 'You can care for yourself at home. If symptoms worsen, contact a doctor.'
    }
  };

  const { icon: Icon, emoji, label, bgClass, textClass, badgeClass, badgeIconClass, description } = config[level];

  return (
    <div className={`rounded-xl border-2 ${bgClass} p-6 shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${badgeClass} rounded-full p-3 flex items-center justify-center relative`}>
          {highContrast ? (
            <span className="text-3xl">{emoji}</span>
          ) : (
            <Icon size={28} className={badgeIconClass} />
          )}
        </div>

        <div className="flex-1">
          <h3 className={`text-lg font-bold ${textClass} mb-2`}>
            {highContrast ? emoji : ''} {t.dashboard.triageStatus}: {label}
          </h3>
          <p className={`${highContrast ? 'text-white' : 'text-gray-600 dark:text-gray-300'} text-base`}>
            {description}
          </p>

          {level === 'red' && (
            <div className={`mt-4 p-3 rounded-lg border-2 ${
              highContrast 
                ? 'bg-white border-white' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <p className={`text-sm font-semibold ${
                highContrast 
                  ? 'text-black' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                🚨 Call emergency services or go to the nearest hospital immediately.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
