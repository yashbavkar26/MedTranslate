import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../constants/translations';

export function LoginPage() {
  const { setCurrentPage, setIsLoggedIn, language } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const t = translations[language];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-blue-500 p-3 rounded-lg">
              <LogIn size={32} className="text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center mb-2">{t.login.title}</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Welcome back to MedTranslate
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {t.login.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {t.login.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 active:scale-95"
            >
              {t.login.signin}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t.login.signupPrompt}{' '}
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="text-blue-500 hover:text-blue-600 font-semibold"
              >
                {t.login.signup}
              </button>
            </p>
          </div>

          {/* Demo Note */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Demo Credentials: any email + any password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
