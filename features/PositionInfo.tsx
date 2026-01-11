
import React, { useState } from 'react';
import { Position, Language } from '../../../求职小诸葛-(career-strategist)/types';

interface PositionInfoProps {
  position: Position;
  onUpdate: (updates: Partial<Position>) => void;
  onGenerateLogo: () => void;
  language: Language;
}

const PositionInfo: React.FC<PositionInfoProps> = ({ position, onUpdate, onGenerateLogo, language }) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isZh = language === 'zh';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ [type === 'logo' ? 'logoUrl' : 'bannerUrl']: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Banner Area - width now matches content width (max-w-4xl) */}
      <div className="relative group h-56 w-full bg-slate-200 rounded-3xl overflow-hidden shadow-sm border border-slate-100">
        {position.bannerUrl ? (
          <img src={position.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 italic">
            <span className="text-4xl mb-2">🖼️</span>
            {isZh ? '添加背景图片以增强面试氛围' : 'Add a banner to set the mood'}
          </div>
        )}
        <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          {isZh ? '更改封面' : 'Change Cover'}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
        </label>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 -mt-20 relative z-10 mx-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-xl border-4 border-white overflow-hidden">
                {position.logoUrl ? (
                  <img src={position.logoUrl} className="w-full h-full object-contain" alt="Logo" />
                ) : (
                  <span>🏢</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex space-x-1">
                <label className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-indigo-700">
                  <span className="text-lg">📷</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                </label>
                <button 
                   onClick={async () => {
                      setIsGenerating(true);
                      await onGenerateLogo();
                      setIsGenerating(false);
                   }}
                   disabled={isGenerating}
                   title={isZh ? "AI 生成 Logo" : "AI Logo Gen"}
                   className="bg-white text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 border border-slate-100 disabled:opacity-50"
                >
                  {isGenerating ? "..." : "🤖"}
                </button>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{position.title}</h2>
              <p className="text-indigo-600 font-medium text-lg">{position.company}</p>
            </div>
          </div>

          <div className="flex items-center bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
            <div className="mr-4">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {isZh ? '面试日期' : 'INTERVIEW DATE'}
              </div>
              <div className="text-indigo-800 font-bold">
                {position.interviewDate ? position.interviewDate : (isZh ? "未设置" : "TBD")}
              </div>
            </div>
            <button 
              onClick={() => setIsEditingDate(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-bold underline"
            >
              {isZh ? '更改' : 'Edit'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                {isZh ? '职位描述' : 'Job Description'}
              </h3>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-6 rounded-2xl border border-slate-100/50">
                {position.description || (isZh ? '暂无详细描述' : 'No description provided')}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                {isZh ? '核心备考要求' : 'Core Requirements'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {position.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-start p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 transition-colors">
                    <span className="text-indigo-500 mr-2 font-bold">✓</span>
                    <span className="text-slate-700 text-sm">{req}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h4 className="font-bold mb-4">{isZh ? '准备进度' : 'Prep Progress'}</h4>
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex-1 bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full transition-all duration-1000" style={{ width: '45%' }}></div>
                </div>
                <span className="text-xs font-bold">45%</span>
              </div>
              <p className="text-indigo-100 text-xs italic mt-4">
                  {isZh ? '"诸葛提示：简历已优化，接下来开始公司研究。"' : '"Tip: Resume optimized. Start researching the company next."'}
              </p>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
                <h4 className="font-bold mb-4">{isZh ? '今日锦囊' : 'Daily Tip'}</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                    {isZh ? '面试前 24 小时进行一次全流程模拟，有助于缓解紧张感。' : 'Conduct a full simulation 24 hours before the actual interview to reduce anxiety.'}
                </p>
            </div>
          </div>
        </div>
      </div>

      {isEditingDate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-4">{isZh ? '设置面试日期' : 'Set Interview Date'}</h3>
            <input 
              type="date" 
              className="w-full p-4 border rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => onUpdate({ interviewDate: e.target.value })}
            />
            <button 
              onClick={() => setIsEditingDate(false)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              {isZh ? '确定' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionInfo;
