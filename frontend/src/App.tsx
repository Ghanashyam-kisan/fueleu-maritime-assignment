import { useState } from 'react';
import { RoutesTab } from './adapters/ui/components/RoutesTab';
import { CompareTab } from './adapters/ui/components/CompareTab';
import { BankingTab } from './adapters/ui/components/BankingTab';
import { PoolingTab } from './adapters/ui/components/PoolingTab';

type Tab = 'routes' | 'compare' | 'banking' | 'pooling';

const TABS: { id: Tab; label: string; icon: string; article?: string }[] = [
  { id: 'routes', label: 'Routes', icon: '🛳' },
  { id: 'compare', label: 'Compare', icon: '📊' },
  { id: 'banking', label: 'Banking', icon: '🏦', article: 'Art. 20' },
  { id: 'pooling', label: 'Pooling', icon: '🔗', article: 'Art. 21' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-display">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-ocean-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-ocean-950/30 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ocean-600 flex items-center justify-center text-sm">⚓</div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">FuelEU Maritime</h1>
              <p className="text-slate-500 text-xs mt-0.5">Compliance Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-slate-400">Target: 89.3368 gCO₂e/MJ</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1" aria-label="Dashboard tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-150
                  border-b-2 -mb-px
                  ${activeTab === tab.id
                    ? 'text-ocean-300 border-ocean-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'}
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.article && (
                  <span className="hidden sm:inline text-xs text-slate-600 font-normal">{tab.article}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'routes' && <RoutesTab />}
        {activeTab === 'compare' && <CompareTab />}
        {activeTab === 'banking' && <BankingTab />}
        {activeTab === 'pooling' && <PoolingTab />}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 mt-16 py-6 text-center text-xs text-slate-600">
        FuelEU Maritime Regulation (EU) 2023/1805 · Compliance Dashboard
      </footer>
    </div>
  );
}
