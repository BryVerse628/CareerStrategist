
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Language } from '../../../求职小诸葛-(career-strategist)/types';

interface ResumeOptimizerProps {
  language: Language;
}

const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({ language }) => {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const isZh = language === 'zh';

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

  const handleOptimize = async () => {
    if (!file && !resumeText.trim()) return;
    setIsAnalyzing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let contents: any;

      if (file && file.type === 'application/pdf') {
        const base64Data = await blobToBase64(file);
        contents = {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
            { text: `请分析这份简历并提供优化建议。请给出：1. 整体打分；2. 简洁精炼建议；3. 专业深度建议；4. 排版视觉建议；5. 关键词增强。请用 ${isZh ? '中文' : '英文'} 回答。` }
          ]
        };
      } else {
        contents = `这是我的简历文本：\n\n${resumeText}\n\n请针对这份简历提供详细的优化建议，包括简洁精炼、专业深度、逻辑结构和关键词优化。`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
        config: {
          systemInstruction: '你是一位资深猎头和简历优化专家。你需要从招聘官的角度提供极其具体、可操作的建议。'
        }
      });

      setSuggestions(response.text);
    } catch (err) {
      console.error(err);
      alert(isZh ? '分析失败' : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{isZh ? '简历专家优化' : 'Resume Optimizer'}</h1>
        <p className="text-slate-500">{isZh ? '让你的简历在 6 秒内脱颖而出' : 'Make your resume stand out in 6 seconds'}</p>
      </header>

      {!suggestions ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto">
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-indigo-100 rounded-3xl bg-slate-50 hover:bg-indigo-50 transition-all group relative cursor-pointer">
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className="text-4xl mb-3">📄</div>
                <div className="text-sm font-bold text-slate-700">
                  {file ? file.name : (isZh ? "上传 PDF 简历" : "Upload PDF Resume")}
                </div>
                <p className="text-xs text-slate-400 mt-2">{isZh ? "目前仅支持 PDF (Word 建议先转为 PDF 或粘贴文本)" : "PDF only (Convert Word or paste text)"}</p>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">{isZh ? '或者粘贴内容' : 'OR PASTE TEXT'}</span></div>
            </div>

            <textarea 
              className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
              placeholder={isZh ? "粘贴简历内容进行文本分析..." : "Paste resume content..."}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={!!file}
            />

            <button 
              onClick={handleOptimize}
              disabled={isAnalyzing || (!file && !resumeText.trim())}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {isAnalyzing ? (isZh ? '正在分析...' : 'Analyzing...') : (isZh ? '获取优化建议' : 'Get Optimization Advice')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">{isZh ? '诸葛优化建议' : 'Optimization Advice'}</h2>
                <button 
                  onClick={() => { setSuggestions(null); setFile(null); setResumeText(''); }}
                  className="text-indigo-600 text-sm font-bold hover:underline"
                >
                  {isZh ? '重新上传' : 'Restart'}
                </button>
            </div>
            <div className="prose prose-indigo max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
              {suggestions}
            </div>
          </div>
          <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-xl flex items-center space-x-6">
              <div className="text-4xl">💡</div>
              <div>
                  <h4 className="font-bold mb-1">{isZh ? '简历黄金法则' : 'Resume Golden Rule'}</h4>
                  <p className="text-sm text-indigo-100">{isZh ? '简历不是你做过什么的清单，而是你如何胜任这份工作的证明。' : 'Your resume is not a list of what you did, but proof of why you fit the job.'}</p>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeOptimizer;
