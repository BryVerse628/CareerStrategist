
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Position, Language } from '../../../求职小诸葛-(career-strategist)/types';

interface LiveInterviewProps {
  position: Position;
  language: Language;
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ position, language }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isZh = language === 'zh';
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const currentAiTurnRef = useRef('');
  const currentUserTurnRef = useRef('');

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    setTranscript([]);
    currentAiTurnRef.current = '';
    currentUserTurnRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputAudioContext = new AudioContext({ sampleRate: 16000 });
      const outputAudioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                if (session) session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentAiTurnRef.current += text;
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'AI') {
                  return [...prev.slice(0, -1), { role: 'AI', text: currentAiTurnRef.current }];
                }
                return [...prev, { role: 'AI', text: currentAiTurnRef.current }];
              });
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentUserTurnRef.current += text;
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'User') {
                  return [...prev.slice(0, -1), { role: 'User', text: currentUserTurnRef.current }];
                }
                return [...prev, { role: 'User', text: currentUserTurnRef.current }];
              });
            }

            if (message.serverContent?.turnComplete) {
              currentAiTurnRef.current = '';
              currentUserTurnRef.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Live Error:', e);
            const errStr = e?.message || '';
            if (errStr.includes('Region not supported') || errStr.includes('403')) {
              setErrorMessage(isZh 
                ? '错误：当前区域暂不支持实时语音 (Multimodal Live)。请尝试开启 VPN（选择美国或日本节点）后重试。' 
                : 'Error: Region not supported for Multimodal Live. Please try using a VPN (USA or Japan node) and reload.');
            } else {
              setErrorMessage(isZh ? '连接出现错误，请检查网络或 API Key。' : 'Connection error occurred. Check network or API key.');
            }
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `你是一位来自 ${position.company} 的资深面试官。你现在正在面试应聘者，目标职位是 ${position.title}。
            
            JD 描述如下：${position.description}
            
            流程：
            1. 首先礼貌欢迎面试者，确认他们是否准备好。
            2. 正式开始。首先请面试者做 1-2 分钟自我介绍。
            3. 根据简历或自我介绍，结合核心要求 ${position.requirements.join(', ')} 逐个深入提问。
            4. 保持专业、敏锐但友好。如果面试者回答含糊，追问细节。
            
            请以自然对话方式进行，不要一次性列出一堆问题。`,
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error(err);
      const errStr = err.message || '';
      if (errStr.includes('Region not supported') || errStr.includes('403')) {
        setErrorMessage(isZh 
          ? '启动失败：当前区域暂不支持实时语音。请尝试开启 VPN 并选择受支持的区域（如美国）。' 
          : 'Failed to start: Region not supported for Multimodal Live. Please try using a VPN.');
      } else {
        setErrorMessage(err.message || (isZh ? '启动失败' : 'Failed to start'));
      }
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-slate-900 via-slate-900/50 to-transparent">
        <div>
          <h2 className="text-white text-xl font-bold">{isZh ? '虚拟面试室' : 'Mock Interview'}</h2>
          <p className="text-slate-400 text-sm">{isZh ? '正在面试：' : 'Interviewing: '}{position.title}</p>
        </div>
        {isActive && (
          <div className="flex items-center px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span> REC
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative bg-slate-800">
        {!isActive ? (
          <div className="text-center space-y-8 p-10 max-w-md animate-in fade-in zoom-in-95">
            <div className="w-32 h-32 bg-indigo-600 rounded-full mx-auto flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/30">
              🎙️
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{isZh ? '准备好开始了吗？' : 'Ready to Start?'}</h3>
              <p className="text-slate-400">{isZh ? '你将进入一个全真模拟环境。AI 面试官会引导你完成流程。' : 'Enter a realistic environment. AI will guide you through the process.'}</p>
              {errorMessage && (
                <div className="mt-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm text-left leading-relaxed">
                  <div className="font-bold mb-1 flex items-center">
                    <span className="mr-2">⚠️</span> {isZh ? '连接受限' : 'Connection Restricted'}
                  </div>
                  {errorMessage}
                </div>
              )}
            </div>
            <button
              onClick={startSession}
              disabled={isConnecting}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${
                isConnecting ? 'bg-slate-700 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95'
              }`}
            >
              {isConnecting ? (isZh ? '正在连线...' : 'Connecting...') : (isZh ? '进入面试室' : 'Enter Interview Room')}
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="relative">
                <div className="w-48 h-48 rounded-full border-4 border-indigo-500/30 flex items-center justify-center">
                  <div className="w-40 h-40 bg-slate-900 rounded-full flex items-center justify-center text-6xl shadow-inner border border-slate-700">
                    🧔
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                  {isZh ? 'AI 面试官' : 'AI Interviewer'}
                </div>
              </div>
              
              <div className="mt-12 flex space-x-2 h-16 items-center">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-1.5 bg-indigo-400 rounded-full animate-pulse-bar" 
                       style={{ height: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>

            <div className="h-64 bg-slate-900/80 backdrop-blur p-6 overflow-y-auto border-t border-slate-700 mx-6 mb-24 rounded-3xl shadow-inner scroll-smooth">
              <div className="text-xs text-slate-500 mb-4 font-bold uppercase tracking-widest flex justify-between">
                <span>{isZh ? '实时对话回顾' : 'Real-time Transcript'}</span>
                <span className="text-indigo-400">{isZh ? '诸葛实时转录中' : 'Strategist Active'}</span>
              </div>
              <div className="space-y-4">
                {transcript.map((t, i) => (
                  <div key={i} className={`flex ${t.role === 'AI' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${t.role === 'AI' ? 'bg-slate-800 text-indigo-200 border border-slate-700' : 'bg-indigo-600 text-white shadow-lg'}`}>
                      <span className="font-bold mr-2 text-[10px] opacity-50">{t.role === 'AI' ? (isZh ? '面试官':'AI') : (isZh ? '应聘者':'You')}</span>
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isActive && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-4">
          <button
            onClick={stopSession}
            className="px-10 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-xl shadow-red-900/20 transition-all flex items-center space-x-2"
          >
            <span>⏹️</span>
            <span>{isZh ? '结束面试' : 'End Interview'}</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse-bar {
          0%, 100% { opacity: 0.3; transform: scaleY(0.7); }
          50% { opacity: 1; transform: scaleY(1.3); }
        }
        .animate-pulse-bar {
          animation: pulse-bar 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LiveInterview;
