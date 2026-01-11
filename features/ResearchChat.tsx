
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
// Added Language to imports
import { Position, ChatMessage, Language } from '../../../求职小诸葛-(career-strategist)/types';

// Updated interface to include language prop
interface ResearchChatProps {
  position: Position;
  onSaveMessage: (msg: ChatMessage) => void;
  onClearHistory: () => void;
  language: Language;
}

const ResearchChat: React.FC<ResearchChatProps> = ({ position, onSaveMessage, onClearHistory, language }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isZh = language === 'zh';

  const messages = position.researchHistory || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    onSaveMessage(userMessage);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Added multi-language support to prompt and system instruction
      const prompt = isZh 
        ? `针对公司 ${position.company} 及其招聘的 ${position.title} 职位，回答我的问题：${currentInput}`
        : `Answer my question about the company ${position.company} and the ${position.title} position: ${currentInput}`;

      const systemInstruction = isZh 
        ? `你是一个资深求职顾问和公司研究专家。你需要利用搜索工具来获取 ${position.company} 的最新背景信息、财报、核心业务、企业文化以及其在 ${position.title} 相关的技术栈或业务流程。你的目标是帮助用户准备面试。请以专业、客观、具有洞察力的方式回答。`
        : `You are a senior job consultant and company research expert. Use search tools to get the latest background info, financial reports, core business, corporate culture, and tech stack or business processes related to ${position.title} for ${position.company}. Your goal is to help the user prepare for an interview. Answer in a professional, objective, and insightful manner. Please reply in ${isZh ? 'Chinese' : 'English'}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: systemInstruction,
        },
      });

      const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
        title: chunk.web?.title || (isZh ? '参考链接' : 'Reference'),
        uri: chunk.web?.uri || '#'
      })).filter(l => l.uri !== '#');

      const modelMessage: ChatMessage = {
        role: 'model',
        text: response.text || (isZh ? '对不起，我暂时无法获取相关信息。' : 'Sorry, I cannot get relevant information at the moment.'),
        links: (links as any) || []
      };

      onSaveMessage(modelMessage);
    } catch (error) {
      console.error(error);
      onSaveMessage({ role: 'model', text: isZh ? '网络请求失败，请检查你的 API 配置。' : 'Network request failed. Please check your API configuration.' });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = isZh 
    ? ['公司最近的新闻', '核心业务和营收', '技术面试常见问题', '企业文化和工作氛围']
    : ['Latest news of the company', 'Core business and revenue', 'Common technical questions', 'Company culture and vibe'];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🔭</div>
          <div>
            <h2 className="text-xl font-bold">{isZh ? '诸葛研究室' : 'Research Lab'}</h2>
            <p className="text-indigo-100 text-sm">{isZh ? '深度挖掘公司背景与面试情报' : 'Deep dive into company background & interview intel'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onClearHistory}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
          >
            {isZh ? '清除历史' : 'Clear History'}
          </button>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs animate-pulse">
            {isZh ? '联网模式已开启' : 'Online Mode Active'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
            <div className="text-6xl mb-2">🔍</div>
            <h3 className="text-xl font-medium text-slate-800">
              {isZh ? `关于 ${position.company}，你想研究什么？` : `What do you want to research about ${position.company}?`}
            </h3>
            <p className="text-slate-500 max-w-sm">
              {isZh ? '我会搜索最新的新闻、财报以及面试真题来回答你。' : 'I will search for the latest news, financial reports, and interview questions.'}
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-lg mt-4">
              {suggestions.map(q => (
                <button 
                  key={q} 
                  onClick={() => { setInput(q); }}
                  className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl text-sm text-slate-600 transition-all hover:border-indigo-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-800 border border-slate-100'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{m.text}</div>
              {m.links && m.links.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-tight">
                    {isZh ? '知识来源' : 'Sources'}
                  </div>
                  <div className="space-y-1">
                    {m.links.map((l, idx) => (
                      <a key={idx} href={l.uri} target="_blank" rel="noreferrer" className="block text-xs text-indigo-500 hover:text-indigo-700 truncate transition-colors">
                        🔗 {l.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center space-x-3 border border-slate-100 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
              <span className="text-xs font-medium text-slate-500 italic tracking-wider">
                {isZh ? '正在深度研读全网情报...' : 'Deeply reading online intelligence...'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex space-x-4">
          <input
            className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner transition-all"
            placeholder={isZh ? `搜索并提问关于 ${position.company} 的一切...` : `Search and ask anything about ${position.company}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-8 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center space-x-2"
          >
            <span>{isZh ? '发送' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResearchChat;
