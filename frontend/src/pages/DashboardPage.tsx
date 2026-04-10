import React, { useState } from 'react';
import { Send, Upload, RotateCcw, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../constants/translations';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AnalysisResult, samplePDFContent } from '../constants/mockData';
import { SummaryCard } from '../components/SummaryCard';
import { TriageIndicator } from '../components/TriageIndicator';

export function DashboardPage() {
  const { language, setCurrentPage } = useApp();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');
  const [input, setInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [medHistory, setMedHistory] = useLocalStorage<AnalysisResult[]>('medHistory', []);
  const [isDragActive, setIsDragActive] = useState(false);
  const isDark = document.documentElement.classList.contains('dark');

  const handleFileUpload = (file: File) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = `PDF Content: ${file.name}\n\nFile size: ${(file.size / 1024).toFixed(2)}KB\n\n[PDF content would be extracted here]\n\nPlease describe your symptoms based on the report or the system will analyze it when backend is connected.`;
        setInput(text);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!input.trim()) return;

    // Create a new analysis result
    const newResult: AnalysisResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: input.toLowerCase().includes('blood') ? 'bloodTest' : 'symptoms',
      summary: generatePlainLanguageSummary(input),
      triageLevel: calculateTriageLevel(input),
      fullReport: input
    };

    setAnalysisResult(newResult);
    
    // Add to history
    const updatedHistory = [newResult, ...medHistory];
    setMedHistory(updatedHistory);
    
    // Clear input after successful analysis
    setTimeout(() => setInput(''), 500);
  };

  const handleDemoMode = () => {
    const demoResult: AnalysisResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'bloodTest',
      summary: t.dashboard.sampleAnalysis,
      triageLevel: 'yellow',
      fullReport: samplePDFContent
    };

    setAnalysisResult(demoResult);
    const updatedHistory = [demoResult, ...medHistory];
    setMedHistory(updatedHistory);
    setInput(t.dashboard.sampleReport);
  };

  const handleReset = () => {
    setInput('');
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'analysis'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t.dashboard.newAnalysis}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t.dashboard.myHistory}
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'analysis' ? (
        <div className="space-y-6">
          {/* Input Section */}
          <div className={`rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-gray-200'} p-6`}>
            <h3 className="text-lg font-semibold mb-4">{t.dashboard.newAnalysis}</h3>

            {/* File Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors cursor-pointer ${
                isDragActive
                  ? isDark ? 'border-blue-400 bg-slate-700' : 'border-blue-400 bg-blue-50'
                  : isDark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="file"
                id="pdf-input"
                accept=".pdf"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <label htmlFor="pdf-input" className="cursor-pointer block">
                <Upload className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                <p className="font-semibold mb-2">{t.dashboard.uploadPdf}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Or drag and drop PDF files</p>
              </label>
            </div>

            {/* Text Input */}
            <div className="space-y-4 mb-4">
              <label className="block text-sm font-medium">Or describe your symptoms / paste lab results:</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.dashboard.enterSymptoms}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-slate-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition min-h-[120px]`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAnalyze}
                disabled={!input.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95"
              >
                <Send size={18} />
                {t.dashboard.analyze}
              </button>

              <button
                onClick={handleDemoMode}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-semibold rounded-lg transition-colors"
              >
                <Zap size={18} />
                {t.dashboard.demoMode}
              </button>

              {analysisResult && (
                <button
                  onClick={handleReset}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold rounded-lg transition-colors"
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Results Section */}
          {analysisResult && (
            <div className="space-y-6 animate-fade-in">
              <SummaryCard result={analysisResult} />
              <TriageIndicator level={analysisResult.triageLevel} />
            </div>
          )}
        </div>
      ) : (
        /* History Tab */
        <div className={`rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-gray-200'} p-6`}>
          <h3 className="text-lg font-semibold mb-4">{t.history.title}</h3>

          {medHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t.history.noHistory}</p>
              <button
                onClick={() => setActiveTab('analysis')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Start Your First Analysis
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {medHistory.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-lg border ${
                    isDark ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                  } transition-colors cursor-pointer`}
                  onClick={() => {
                    setAnalysisResult(result);
                    setActiveTab('analysis');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{result.date}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{result.summary}</p>
                    </div>
                    <div className="ml-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        result.triageLevel === 'red'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : result.triageLevel === 'yellow'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}>
                        {result.triageLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function generatePlainLanguageSummary(input: string): string {
  const inputLower = input.toLowerCase();
  
  if (inputLower.includes('hemoglobin')) {
    return 'Your hemoglobin levels are lower than normal, which may affect oxygen transport in your body. You should consult with your doctor for proper diagnosis.';
  }
  
  if (inputLower.includes('blood') || inputLower.includes('wbc') || inputLower.includes('white')) {
    return 'Your white blood cells are elevated, which might indicate an infection or inflammatory response. Monitor your symptoms and see a doctor if they persist.';
  }
  
  if (inputLower.includes('sugar') || inputLower.includes('glucose')) {
    return 'Your glucose levels are affected. Please follow your doctor\'s dietary and medication recommendations.';
  }
  
  if (inputLower.includes('fever') || inputLower.includes('cough') || inputLower.includes('pain')) {
    return 'Based on your symptoms, you should see a healthcare provider for proper evaluation and treatment.';
  }
  
  return 'Your medical data has been analyzed. Please consult with your healthcare provider for a complete diagnosis and treatment plan.';
}

function calculateTriageLevel(input: string): 'red' | 'yellow' | 'green' {
  const inputLower = input.toLowerCase();
  
  const emergencyKeywords = ['emergency', 'severe', 'chest pain', 'difficulty breathing', 'unconscious'];
  const urgentKeywords = ['fever', 'elevated', 'abnormal', 'high', 'low', 'infection'];
  
  if (emergencyKeywords.some(keyword => inputLower.includes(keyword))) {
    return 'red';
  }
  
  if (urgentKeywords.some(keyword => inputLower.includes(keyword))) {
    return 'yellow';
  }
  
  return 'green';
}
