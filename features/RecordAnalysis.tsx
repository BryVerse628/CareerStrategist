
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Position, AnalysisRecord, Language } from '../../../求职小诸葛-(career-strategist)/types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface RecordAnalysisProps {
  position: Position;
  onSaveRecord: (rec: Omit<AnalysisRecord, 'id' | 'timestamp'>) => void;
  onDeleteRecord: (id: string) => void;
  language: Language;
}

const RecordAnalysis: React.FC<RecordAnalysisProps> = ({ position, onSaveRecord, onDeleteRecord, language }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeRecord, setActiveRecord] = useState<AnalysisRecord | null>(null);
  const [transcript, setTranscript] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isZh = language === 'zh';

  const analysisHistory = position.analysisHistory || [];

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalyze = async () => {
    if (!transcript.trim() && !selectedFile) return;
    setIsAnalyzing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let contents: any = `针对 ${position.company} 的 ${position.title} 职位，分析以下面试对话并给出详细反馈：\n\n${transcript}`;
      
      if (selectedFile) {
        const base64Data = await blobToBase64(selectedFile);
        contents = {
          parts: [
            { inlineData: { data: base64Data, mimeType: selectedFile.type } },
            { text: `这是我在 ${position.company} 面试 ${position.title} 职位的录音。请先根据录音内容转录面试过程，然后从专业技能、表达能力、逻辑性、自信心、情商表现、JD 匹配度等 6 个维度进行评分和分析反馈。` }
          ]
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              transcript: { type: Type.STRING, description: "面试对话的全程转录" },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING },
                    A: { type: Type.NUMBER },
                    fullMark: { type: Type.NUMBER }
                  },
                  required: ['subject', 'A', 'fullMark']
                }
              }
            },
            required: ['score', 'feedback', 'strengths', 'weaknesses', 'metrics', 'transcript']
          },
          systemInstruction: '你是一位资深面试复盘专家。你需要根据提供的文字记录或音频录音，深度复原面试现场并提供建设性评分。',
        }
      });

      const data = JSON.parse(response.text);
      onSaveRecord({ ...data, transcript: data.transcript || transcript });
      setActiveRecord({ ...data, id: 'temp', timestamp: Date.now() });
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert(isZh ? "分析失败，请稍后重试。" : "Analysis failed, please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = (record: AnalysisRecord) => {
    const content = `
面试复盘报告 - 求职小诸葛
职位: ${position.title} | 公司: ${position.company}
时间: ${new Date(record.timestamp).toLocaleString()}
得分: ${record.score}

【综合评价】
${record.feedback}

【表现亮点】
${record.strengths.join('\n')}

【改进建议】
${record.weaknesses.join('\n')}

【能力维度】
${record.metrics.map(m => `${m.subject}: ${m.A}/${m.fullMark}`).join(' | ')}
    `;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Interview_Report_${position.title}_${record.id}.doc`;
    link.click();
  };

  const downloadTranscript = (record: AnalysisRecord) => {
    const blob = new Blob([record.transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Interview_Transcript_${position.title}_${record.id}.txt`;
    link.click();
  };

  const renderReport = (record: AnalysisRecord) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {record.score}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{isZh ? '复盘报告详情' : 'Analysis Report'}</h2>
            <p className="text-slate-500 text-sm">{isZh ? '面试时间' : 'Date'}: {new Date(record.timestamp).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => downloadReport(record)} 
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all flex items-center"
          >
            <span className="mr-1">📄</span> {isZh ? '下载报告 (Word)' : 'Download Report'}
          </button>
          <button 
            onClick={() => { setActiveRecord(null); setTranscript(''); setSelectedFile(null); }} 
            className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors"
          >
            {isZh ? '新复盘' : 'New Analysis'}
          </button>
          <button 
            onClick={() => setShowHistory(true)} 
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            {isZh ? '查看历史' : 'History'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>{isZh ? '综合评价' : 'Overall Evaluation'}
            </h3>
            <div className="text-slate-700 leading-relaxed text-lg italic bg-slate-50 p-6 rounded-2xl border border-slate-100">
              "{record.feedback}"
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 shadow-sm">
              <h4 className="font-bold text-emerald-800 mb-4 flex items-center">
                <span className="text-xl mr-2">🌟</span> {isZh ? '表现亮点' : 'Strengths'}
              </h4>
              <ul className="space-y-3">
                {record.strengths.map((s, i) => (
                  <li key={i} className="text-emerald-700 text-sm flex items-start bg-white/50 p-2 rounded-lg">
                    <span className="mr-2 text-emerald-500">✔</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 shadow-sm">
              <h4 className="font-bold text-amber-800 mb-4 flex items-center">
                <span className="text-xl mr-2">💡</span> {isZh ? '改进建议' : 'Weaknesses'}
              </h4>
              <ul className="space-y-3">
                {record.weaknesses.map((w, i) => (
                  <li key={i} className="text-amber-700 text-sm flex items-start bg-white/50 p-2 rounded-lg">
                    <span className="mr-2 text-amber-500">○</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-slate-800">{isZh ? '转录对话文本回顾' : 'Full Transcript'}</h4>
                <button onClick={() => downloadTranscript(record)} className="text-xs text-indigo-600 font-bold hover:underline">
                    {isZh ? '📥 下载转录文本' : 'Download Transcript'}
                </button>
             </div>
             <div className="bg-slate-50 p-6 rounded-2xl text-slate-600 text-sm max-h-96 overflow-y-auto whitespace-pre-wrap font-mono border border-slate-100">
               {record.transcript}
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[380px] flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4">{isZh ? '多维能力雷达' : 'Competency Radar'}</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={record.metrics}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={({ x, y, payload }) => (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={4} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="bold">
                          {payload.value}
                        </text>
                        {/* Adding the specific score label to the axis */}
                        <text x={0} y={14} dy={4} textAnchor="middle" fill="#4f46e5" fontSize={9} fontWeight="bold">
                          {record.metrics.find(m => m.subject === payload.value)?.A}
                        </text>
                      </g>
                    )}
                  />
                  <Radar
                    name="得分"
                    dataKey="A"
                    stroke="#4f46e5"
                    fill="#4f46e5"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden group">
            <h4 className="font-bold text-xl mb-4 flex items-center">
              <span className="mr-2">🎴</span> {isZh ? '诸葛锦囊' : 'Strategy Box'}
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {isZh 
                ? "复盘不仅是为了看到不足，更是为了总结经验。建议下次面试前，针对亮点部分做更深度的案例挖掘。"
                : "Reflection is about summarizing experience. Deep dive into your highlights for your next interview case study."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (showHistory) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">{isZh ? '历史复盘记录' : 'Analysis History'}</h2>
          <button onClick={() => setShowHistory(false)} className="text-indigo-600 font-bold hover:underline">{isZh ? '返回' : 'Back'}</button>
        </div>
        
        {analysisHistory.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-400">{isZh ? '暂无历史记录。' : 'No history found.'}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {analysisHistory.map((rec) => (
              <div 
                key={rec.id} 
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group cursor-pointer"
                onClick={() => { setActiveRecord(rec); setShowHistory(false); }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-xl font-bold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {rec.score}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{isZh ? '面试分' : 'Score'}: {rec.score}</div>
                    <div className="text-xs text-slate-400">{new Date(rec.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                   <div className="text-indigo-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{isZh ? '查看详情 →' : 'View →'}</div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); if(confirm(isZh?'确定删除吗？':'Delete?')) onDeleteRecord(rec.id); }}
                     className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     🗑️
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {!activeRecord ? (
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-6">
          <div className="flex justify-between items-start mb-6">
             <div className="flex-1"></div>
             {analysisHistory.length > 0 && (
               <button 
                 onClick={() => setShowHistory(true)}
                 className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center font-bold"
               >
                 <span className="mr-1">📋</span> {isZh ? '历史复盘' : 'History'} ({analysisHistory.length})
               </button>
             )}
          </div>
          <div className="text-6xl mb-6">🎙️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{isZh ? '深度面试分析' : 'Deep Interview Analysis'}</h2>
          <p className="text-slate-500 mb-8 leading-relaxed px-10 text-sm">
            {isZh 
                ? '支持 文本粘贴 或 音频文件 (MP3/M4A) 上传。AI 将为您深度复盘面试表现并保存。' 
                : 'Supports text paste or Audio (MP3/M4A) upload. AI will deep dive into your performance.'}
          </p>
          
          <div className="space-y-4 mb-8">
             <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-100 rounded-3xl bg-slate-50 hover:bg-indigo-50 transition-all group relative cursor-pointer">
                <input 
                  type="file" 
                  accept="audio/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📁</div>
                <div className="text-sm font-bold text-slate-600">
                  {selectedFile ? selectedFile.name : (isZh ? "点击或拖拽上传音频文件" : "Click or drag audio file")}
                </div>
                <div className="text-xs text-slate-400 mt-1">支持 MP3, M4A, WAV 等格式</div>
             </div>

             <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">{isZh ? '或者粘贴文本' : 'OR PASTE TEXT'}</span></div>
             </div>

             <textarea
               className="w-full h-48 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 shadow-inner resize-none text-sm"
               placeholder={isZh ? "在此粘贴面试对话..." : "Paste transcript here..."}
               value={transcript}
               onChange={e => setTranscript(e.target.value)}
               disabled={!!selectedFile}
             />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!transcript.trim() && !selectedFile)}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center space-x-3 transition-all active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{isZh ? '诸葛神算中... (请耐心等待)' : 'Strategist calculating...'}</span>
              </>
            ) : (
              <span>{isZh ? '开始智能复盘分析' : 'Start AI Analysis'}</span>
            )}
          </button>
        </div>
      ) : (
        renderReport(activeRecord)
      )}
    </div>
  );
};

export default RecordAnalysis;
