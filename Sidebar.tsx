
import React from 'react';
import { AppTab, Position, Language } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  activePosition: Position | null;
  onBackToDashboard: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, activePosition, onBackToDashboard, language, setLanguage }) => {
  const isZh = language === 'zh';
  
  const mainMenuItems = [
    { id: AppTab.DASHBOARD, label: isZh ? '主面板' : 'Dashboard', icon: '🏠' },
    { id: AppTab.RESUME_OPTIMIZE, label: isZh ? '简历优化' : 'Resume Fix', icon: '📝' },
    { id: AppTab.PERSONALITY_TEST, label: isZh ? '个人特质分析' : 'Trait Analysis', icon: '🧬' },
  ];

  const positionMenuItems = [
    { id: AppTab.POSITION_INFO, label: isZh ? '职位概览' : 'Position Info', icon: '📋' },
    { id: AppTab.RESEARCH_CHAT, label: isZh ? '公司研究' : 'Co. Research', icon: '🔍' },
    { id: AppTab.LIVE_INTERVIEW, label: isZh ? '模拟面试' : 'Mock Interview', icon: '🎙️' },
    { id: AppTab.ANALYSIS, label: isZh ? '面试复盘' : 'Analysis', icon: '📊' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white h-full flex flex-col transition-all duration-300">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex items-center space-x-2 mb-8 cursor-pointer group" onClick={onBackToDashboard}>
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/50 group-hover:bg-indigo-500 transition-colors">
            {isZh ? '诸' : 'C'}
          </div>
          <span className="text-xl font-bold tracking-tight">{isZh ? '求职小诸葛' : 'Strategist'}</span>
        </div>

        <nav className="space-y-1 mb-8">
          {mainMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === AppTab.DASHBOARD) onBackToDashboard();
                else setActiveTab(item.id);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 transition-all ${
                activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {activePosition && (
          <div className="mb-6 animate-in fade-in slide-in-from-left-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {isZh ? '当前备考' : 'CURRENT PREP'}
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-slate-700 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                {activePosition.logoUrl ? (
                   <img src={activePosition.logoUrl} className="w-full h-full object-contain" alt="Logo" />
                ) : (
                   <span className="text-sm">🏢</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-xs">{activePosition.title}</div>
              </div>
            </div>

            <nav className="space-y-1">
              {positionMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-3 transition-all ${
                    activeTab === item.id ? 'bg-indigo-500/50 text-white border border-indigo-400/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
      
      {/* Bottom Section with Language Toggle */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/50">
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
            {isZh ? '界面语言' : 'INTERFACE LANGUAGE'}
          </div>
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button 
              onClick={() => setLanguage('zh')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'zh' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              中文
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              English
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 italic leading-tight">
            {isZh ? '"运筹帷幄之中，决胜千里之外"' : '"Plan in the tent, win 1000 miles away"'}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
