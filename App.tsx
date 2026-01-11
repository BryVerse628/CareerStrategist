
import React, { useState, useEffect } from 'react';
import { AppTab, Position, ChatMessage, AnalysisRecord, Language } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './features/Dashboard';
import PositionInfo from './features/PositionInfo';
import ResearchChat from './features/ResearchChat';
import LiveInterview from './features/LiveInterview';
import RecordAnalysis from './features/RecordAnalysis';
import ResumeOptimizer from './features/ResumeOptimizer';
import PersonalityTest from './features/PersonalityTest';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved) return saved as Language;
    // Default to system language, fallback to Chinese
    return navigator.language.startsWith('en') ? 'en' : 'zh';
  });
  
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('positions_v3');
    return saved ? JSON.parse(saved) : [];
  });
  const [activePositionId, setActivePositionId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('positions_v3', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('app_lang', language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  const activePosition = positions.find(p => p.id === activePositionId);

  const handleAddPosition = (pos: Omit<Position, 'id' | 'createdAt'>) => {
    const newPos: Position = {
      ...pos,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      researchHistory: [],
      analysisHistory: [],
    };
    setPositions([newPos, ...positions]);
    setActivePositionId(newPos.id);
    setActiveTab(AppTab.POSITION_INFO);
  };

  const handleDeletePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
    if (activePositionId === id) setActivePositionId(null);
  };

  const updatePositionData = (id: string, updates: Partial<Position>) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const saveResearchMessage = (id: string, message: ChatMessage) => {
    setPositions(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, researchHistory: [...(p.researchHistory || []), message] };
      }
      return p;
    }));
  };

  const clearResearchHistory = (id: string) => {
    updatePositionData(id, { researchHistory: [] });
  };

  const saveAnalysisRecord = (id: string, record: Omit<AnalysisRecord, 'id' | 'timestamp'>) => {
    const fullRecord: AnalysisRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setPositions(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, analysisHistory: [fullRecord, ...(p.analysisHistory || [])] };
      }
      return p;
    }));
  };

  const generateLogo = async (id: string, companyName: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A professional, minimalist corporate logo for a company named "${companyName}". Clean lines, modern typography, suitable for a tech or professional business environment. Solid background, centered.` }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });
      
      const part = response.candidates[0].content.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        const url = `data:image/png;base64,${part.inlineData.data}`;
        updatePositionData(id, { logoUrl: url });
      }
    } catch (error) {
      console.error("Logo generation failed", error);
    }
  };

  const renderContent = () => {
    if (activeTab === AppTab.RESUME_OPTIMIZE) {
        return <ResumeOptimizer language={language} />;
    }
    if (activeTab === AppTab.PERSONALITY_TEST) {
        return <PersonalityTest language={language} />;
    }

    if (activeTab === AppTab.DASHBOARD || !activePositionId) {
      return (
        <Dashboard 
          positions={positions} 
          onAdd={handleAddPosition} 
          onSelect={(id) => { setActivePositionId(id); setActiveTab(AppTab.POSITION_INFO); }}
          onDelete={handleDeletePosition}
          language={language}
        />
      );
    }

    if (!activePosition) return <div className="p-8">职位不存在</div>;

    switch (activeTab) {
      case AppTab.POSITION_INFO:
        return (
          <PositionInfo 
            position={activePosition} 
            onUpdate={(updates) => updatePositionData(activePosition.id, updates)}
            onGenerateLogo={() => generateLogo(activePosition.id, activePosition.company)}
            language={language}
          />
        );
      case AppTab.RESEARCH_CHAT:
        return (
          <ResearchChat 
            position={activePosition} 
            onSaveMessage={(msg) => saveResearchMessage(activePosition.id, msg)} 
            onClearHistory={() => clearResearchHistory(activePosition.id)}
            language={language}
          />
        );
      case AppTab.LIVE_INTERVIEW:
        return <LiveInterview position={activePosition} language={language} />;
      case AppTab.ANALYSIS:
        return (
          <RecordAnalysis 
            position={activePosition} 
            onSaveRecord={(rec) => saveAnalysisRecord(activePosition.id, rec)}
            onDeleteRecord={(rid) => {
                const newHistory = (activePosition.analysisHistory || []).filter(r => r.id !== rid);
                updatePositionData(activePosition.id, { analysisHistory: newHistory });
            }}
            language={language}
          />
        );
      default:
        return <Dashboard positions={positions} onAdd={handleAddPosition} onSelect={setActivePositionId} onDelete={handleDeletePosition} language={language} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activePosition={activePosition || null}
        onBackToDashboard={() => { setActivePositionId(null); setActiveTab(AppTab.DASHBOARD); }}
        language={language}
        setLanguage={setLanguage}
      />
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
