
import React, { useState } from 'react';
import { Position, Language } from '../../../求职小诸葛-(career-strategist)/types';

interface DashboardProps {
  positions: Position[];
  onAdd: (pos: Omit<Position, 'id' | 'createdAt'>) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  language: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ positions, onAdd, onSelect, onDelete, language }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', company: '', description: '', requirements: '' });
  const isZh = language === 'zh';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      title: formData.title,
      company: formData.company,
      description: formData.description,
      requirements: formData.requirements.split('\n').filter(r => r.trim() !== ''),
    });
    setFormData({ title: '', company: '', description: '', requirements: '' });
    setIsAdding(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">
          {isZh ? '欢迎回来，备考者' : 'Welcome Back, Prep Master'}
        </h1>
        <p className="text-slate-500 text-lg">
          {isZh ? '今天你想准备哪一个面试？' : 'Which interview are we crushing today?'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => setIsAdding(true)}
          className="border-2 border-dashed border-indigo-200 rounded-3xl p-8 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-white/50 transition-all group h-[260px]"
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <span className="text-3xl text-indigo-600">+</span>
          </div>
          <span className="text-lg font-semibold text-indigo-700">{isZh ? '添加新职位' : 'Add New Position'}</span>
          <p className="text-sm text-indigo-400 mt-2">{isZh ? '开始你的备考之旅' : 'Start your journey'}</p>
        </button>

        {positions.map(pos => (
          <div key={pos.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all flex flex-col group relative overflow-hidden h-[260px]">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); if(confirm(isZh ? '确定删除吗？':'Delete?')) onDelete(pos.id); }} className="text-red-400 hover:text-red-600">
                <span className="text-xl">🗑️</span>
              </button>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-800 truncate">{pos.title}</h3>
              <p className="text-slate-500 truncate">{pos.company}</p>
            </div>
            <div className="flex-1 mb-6 overflow-hidden">
              <div className="text-sm text-slate-400 mb-2">{isZh ? '主要需求：' : 'Key Req:'}</div>
              <div className="flex flex-wrap gap-2">
                {pos.requirements.slice(0, 2).map((r, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs truncate max-w-full">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onSelect(pos.id)}
              className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
            >
              {isZh ? '开始备考' : 'Start Prep'}
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{isZh ? '添加新考位' : 'Add New Project'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{isZh ? '职位名称' : 'Job Title'}</label>
                <input
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder={isZh ? "例如：高级前端开发工程师" : "e.g. Senior Frontend Engineer"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{isZh ? '公司名称' : 'Company'}</label>
                <input
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  placeholder={isZh ? "例如：阿里巴巴" : "e.g. Google"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{isZh ? '职位描述 (JD)' : 'Job Description'}</label>
                <textarea
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isZh ? "粘贴职位描述..." : "Paste JD here..."}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{isZh ? '核心要求 (每行一个)' : 'Core Requirements (one per line)'}</label>
                <textarea
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.requirements}
                  onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder={isZh ? "例如：3年React经验..." : "e.g. 3+ years React..."}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                  {isZh ? '创建项目' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
