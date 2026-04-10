import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { translations } from '../constants/translations';
import { useApp } from '../context/AppContext';

interface TriageIndicatorProps {
  level: 'red' | 'yellow' | 'green';
}

export function TriageIndicator({ level }: TriageIndicatorProps) {
  const { language } = useApp();
  const t = translations[language];
  const isDark = document.documentElement.classList.contains('dark');

  const config = {
    red: {
      icon: AlertTriangle,
      label: t.dashboard.erAlert,
      bgClass: isDark ? 'bg-red-900/30 border-red-600/50' : 'bg-red-50 border-red-200',
      textClass: 'text-red-600 dark:text-red-400',
      badgeClass: isDark ? 'bg-red-600' : 'bg-red-500',
      description: 'Seek emergency medical care immediately. This is a medical emergency.'
    },
    yellow: {
      icon: AlertCircle,
      label: t.dashboard.doctorAlert,
      bgClass: isDark ? 'bg-yellow-900/30 border-yellow-600/50' : 'bg-yellow-50 border-yellow-200',
      textClass: 'text-yellow-600 dark:text-yellow-400',
      badgeClass: isDark ? 'bg-yellow-600' : 'bg-yellow-500',
      description: 'Schedule an appointment with your doctor within 24 hours. Do not delay.'
    },
    green: {
      icon: CheckCircle,
      label: t.dashboard.homeAlert,
      bgClass: isDark ? 'bg-green-900/30 border-green-600/50' : 'bg-green-50 border-green-200',
      textClass: 'text-green-600 dark:text-green-400',
      badgeClass: isDark ? 'bg-green-600' : 'bg-green-500',
      description: 'You can care for yourself at home. If symptoms worsen, contact a doctor.'
    }
  };

  const { icon: Icon, label, bgClass, textClass, badgeClass, description } = config[level];

  return (
    <div className={`rounded-xl border ${bgClass} p-6 shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${badgeClass} rounded-full p-3`}>
          <Icon size={28} className="text-white" />
        </div>

        <div className="flex-1">
          <h3 className={`text-lg font-bold ${textClass} mb-2`}>
            {t.dashboard.triageStatus}: {label}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-base">
            {description}
          </p>

          {level === 'red' && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                🚨 Call emergency services or go to the nearest hospital immediately.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
