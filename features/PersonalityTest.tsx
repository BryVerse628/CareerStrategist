
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Language } from '../../../求职小诸葛-(career-strategist)/types';

interface PersonalityTestProps {
  language: Language;
}

const QUESTIONS = [
  { id: 1, text: "在处理复杂项目时，你更倾向于：", options: [{label:"先制定详尽计划", value:"A", trait:"Logic"}, {label:"边做边调整", value:"B", trait:"Action"}] },
  { id: 2, text: "在团队合作中，你通常扮演：", options: [{label:"协调者/润滑剂", value:"A", trait:"Social"}, {label:"主导者/决策者", value:"B", trait:"Leadership"}] },
  { id: 3, text: "面对突发的技术难题，你会：", options: [{label:"独立钻研直至解决", value:"A", trait:"Independent"}, {label:"寻求他人协助共同攻克", value:"B", trait:"Collab"}] },
  { id: 4, text: "你更喜欢的工作环境是：", options: [{label:"高压、快节奏且充满竞争", value:"A", trait:"Drive"}, {label:"稳定、有条理且注重协作", value:"B", trait:"Order"}] },
  { id: 5, text: "当你的观点被挑战时：", options: [{label:"据理力争到底", value:"A", trait:"Confident"}, {label:"先反思并寻找折中方案", value:"B", trait:"Flexible"}] },
  { id: 6, text: "做决策时，你更依赖：", options: [{label:"客观数据和逻辑分析", value:"A", trait:"Data"}, {label:"直觉和过往经验", value:"B", trait:"Intuition"}] },
  { id: 7, text: "你如何看待重复性的工作？", options: [{label:"能找到优化的乐趣", value:"A", trait:"Detail"}, {label:"觉得枯燥，更爱挑战新鲜事物", value:"B", trait:"Creative"}] },
  { id: 8, text: "在交流中，你属于：", options: [{label:"倾听者多于表达者", value:"A", trait:"Listen"}, {label:"表达者多于倾听者", value:"B", trait:"Speak"}] },
  { id: 9, text: "你对新技术的态度：", options: [{label:"总是第一时间尝试", value:"A", trait:"EarlyAdopter"}, {label:"等待技术成熟后再应用", value:"B", trait:"Pragmatic"}] },
  { id: 10, text: "如果任务未按期完成：", options: [{label:"感到极度焦虑并自责", value:"A", trait:"Perfect"}, {label:"分析原因并申请延期", value:"B", trait:"Realistic"}] },
  // ... adding placeholders to reach 20 as requested by user logic
  { id: 11, text: "你更喜欢：", options: [{label:"深度专研一个领域", value:"A", trait:"Specialist"}, {label:"跨领域广泛涉猎", value:"B", trait:"Generalist"}] },
  { id: 12, text: "在聚会中你：", options: [{label:"主动认识陌生人", value:"A", trait:"Extravert"}, {label:"和熟人待在一起", value:"B", trait:"Introvert"}] },
  { id: 13, text: "你的工位通常：", options: [{label:"一尘不染整整齐齐", value:"A", trait:"Organized"}, {label:"虽然乱但找得到东西", value:"B", trait:"Messy"}] },
  { id: 14, text: "遇到分歧时：", options: [{label:"对事不对人", value:"A", trait:"Objective"}, {label:"顾及对方感受", value:"B", trait:"Empathetic"}] },
  { id: 15, text: "工作时被打断：", options: [{label:"很快能切回状态", value:"A", trait:"Multi"}, {label:"需要很长时间找回节奏", value:"B", trait:"Focus"}] },
  { id: 16, text: "长期目标：", options: [{label:"有清晰的 5 年规划", value:"A", trait:"Strategist"}, {label:"看当下的机会而定", value:"B", trait:"Opportunist"}] },
  { id: 17, text: "面对失败：", options: [{label:"把它看作学习的机会", value:"A", trait:"Growth"}, {label:"会沮丧一段时间", value:"B", trait:"Sensitive"}] },
  { id: 18, text: "沟通习惯：", options: [{label:"喜欢文字交流", value:"A", trait:"Text"}, {label:"喜欢当面/语音沟通", value:"B", trait:"Oral"}] },
  { id: 19, text: "面对规则：", options: [{label:"严格遵守现有标准", value:"A", trait:"Compliant"}, {label:"寻找打破规则的方法", value:"B", trait:"Radical"}] },
  { id: 20, text: "最后的总结：", options: [{label:"我觉得我是实干家", value:"A", trait:"Doer"}, {label:"我觉得我是思考者", value:"B", trait:"Thinker"}] },
];

const PersonalityTest: React.FC<PersonalityTestProps> = ({ language }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const isZh = language === 'zh';

  const handleAnswer = (val: string) => {
    const nextAnswers = [...answers, val];
    setAnswers(nextAnswers);
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateReport(nextAnswers);
    }
  };

  const generateReport = async (finalAnswers: string[]) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `根据用户在职业风格测试中的 20 个回答：${finalAnswers.join(',')}。
      每个回答对应一个职业特质。请分析用户的性格特征、核心优势、职业风格（如领导型、分析型、协作型等）以及适合的职业建议。用 ${isZh ? '中文' : '英文'} 回答。`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: '你是一位资深职业测评专家和心理分析师。' }
      });
      setReport(response.text);
    } catch (err) {
      console.error(err);
      alert('分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (report) {
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">{isZh ? '个人特质分析报告' : 'Trait Analysis Report'}</h2>
          <div className="prose prose-indigo max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
            {report}
          </div>
          <button 
            onClick={() => { setReport(null); setCurrentStep(0); setAnswers([]); }}
            className="mt-8 px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all"
          >
            {isZh ? '重新测试' : 'Retest'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-160px)] flex flex-col justify-center animate-in fade-in duration-500">
      {isAnalyzing ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-bold">{isZh ? '诸葛正在解读你的特质...' : 'Interpreting your traits...'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 text-center">
          <div className="mb-8">
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest">
              {isZh ? `问题 ${currentStep + 1} / 20` : `Question ${currentStep + 1} / 20`}
            </span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
               <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${((currentStep + 1) / 20) * 100}%` }}></div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 mb-10">{QUESTIONS[currentStep].text}</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {QUESTIONS[currentStep].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt.value)}
                className="w-full py-5 px-6 border-2 border-slate-100 rounded-2xl text-lg font-medium text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
              >
                <span className="inline-block w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white mr-4 text-center leading-8 font-bold text-sm">
                  {idx === 0 ? 'A' : 'B'}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalityTest;
