import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Stethoscope,
  Building2,
  Calendar,
  HeartPulse,
  HelpCircle,
  AlertTriangle,
  PhoneCall,
  Scale,
  Activity,
  Trash2,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

export default function AIAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 'welcome-page',
      role: 'assistant',
      content: `### 👋 Welcome to ArogyaConnect AI Healthcare Navigator\n\nI am specially designed to support patients with 5 core healthcare capabilities:\n\n1. 🩺 **Basic Triage Support**: Describe symptoms to evaluate severity, detect red-flag emergencies, and determine the right medical department.\n2. 🏥 **Hospital Navigation**: Find real-time nearby hospitals with ICU, 3T MRI, Blood Banks, and shortest wait times.\n3. 📅 **Appointment Guidance**: Step-by-step assistance to schedule consultations and select specialists.\n4. 💡 **Health Recommendations**: Physician-aligned preventive care, daily hydration, sleep, and lifestyle guidance.\n5. ❓ **FAQ Automation**: Instant clarity on cashless TPA insurance, Ayushman Bharat PM-JAY, and platform tools.\n\nType your question below or click any of the 5 quick starters on the left to begin!`,
      triage_level: 'NORMAL',
      suggested_actions: [
        { label: 'Check in Symptom Checker', path: '/symptom-checker', icon: 'activity' },
        { label: 'Compare Hospital Facilities', path: '/compare-hospitals', icon: 'scale' },
        { label: 'Find Nearby Hospitals', path: '/hospitals', icon: 'hospital' }
      ],
      follow_ups: [
        'Check symptoms: Fever, body ache & sore throat',
        'Find nearest hospital with 24/7 ICU',
        'How to book an appointment with a cardiologist?',
        'Does ArogyaConnect support Ayushman Bharat?'
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('http://127.0.0.1:3001/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: historyPayload
        })
      });

      if (!res.ok) throw new Error('Chat API error');

      const data = await res.json();
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'I am here to help you navigate healthcare.',
        triage_level: data.triage_level || 'NORMAL',
        suggested_actions: data.suggested_actions || [],
        follow_ups: data.follow_ups || []
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AIAssistant error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `### 🩺 Helpful Healthcare Guidance\n\nI am experiencing a momentary network delay, but here are quick actions for your care:\n\n- **Check Symptoms**: Use our AI [Symptom Checker](/symptom-checker)\n- **Compare Hospitals**: Review live metrics in [Compare Hospitals](/compare-hospitals)\n- **Browse Facilities**: View network centers in [Network Hospitals](/hospitals)\n\n🚨 **For life-threatening emergencies, call 108 / 112 immediately.**`,
          triage_level: 'NORMAL',
          suggested_actions: [
            { label: 'Find Nearby Hospitals', path: '/hospitals', icon: 'hospital' },
            { label: 'Compare Hospitals', path: '/compare-hospitals', icon: 'scale' }
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: `Chat history cleared. How can I assist you with triage, hospital navigation, or appointments?`,
        triage_level: 'NORMAL',
        suggested_actions: [
          { label: 'Compare Hospitals', path: '/compare-hospitals', icon: 'scale' },
          { label: 'Find Nearby Hospitals', path: '/hospitals', icon: 'hospital' }
        ],
        follow_ups: [
          'What are common symptoms of seasonal flu?',
          'Which nearby hospital has shortest wait time?',
          'How do I schedule an appointment?'
        ]
      }
    ]);
  };

  const featureStarters = [
    {
      title: '1. Basic Triage Support',
      desc: 'Assess symptoms & get specialist recommendations',
      icon: <Stethoscope className="w-5 h-5 text-blue-600" />,
      color: 'blue',
      prompt: 'I have a high fever with chills and severe headache for 2 days. What should I do?'
    },
    {
      title: '2. Hospital Navigation',
      desc: 'Find facilities with ICU, 3T MRI & shortest wait times',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />,
      color: 'indigo',
      prompt: 'Which nearby hospitals have a 24/7 ICU, trauma center, and shortest emergency wait time?'
    },
    {
      title: '3. Appointment Guidance',
      desc: 'Step-by-step appointment booking & slot management',
      icon: <Calendar className="w-5 h-5 text-emerald-600" />,
      color: 'emerald',
      prompt: 'How do I book an appointment with a specialist doctor on ArogyaConnect?'
    },
    {
      title: '4. Health Recommendations',
      desc: 'Safe, doctor-aligned preventive wellness & lifestyle',
      icon: <HeartPulse className="w-5 h-5 text-rose-600" />,
      color: 'rose',
      prompt: 'What are essential daily health habits for cardiovascular wellness and hydration?'
    },
    {
      title: '5. FAQ Automation',
      desc: 'Cashless insurance, Ayushman Bharat & platform support',
      icon: <HelpCircle className="w-5 h-5 text-amber-600" />,
      color: 'amber',
      prompt: 'Does ArogyaConnect support Cashless Insurance, Ayushman Bharat PM-JAY, and free booking?'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 lg:px-8">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold tracking-wider uppercase mb-2 border border-blue-400/20">
                <Bot className="w-4 h-4" /> 24/7 AI Healthcare Navigator
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                ArogyaConnect AI Help & Triage Assistant
              </h1>
              <p className="text-slate-300 text-xs lg:text-sm mt-1 max-w-2xl">
                Specially built for triage assistance, hospital navigation, appointment guidance, health recommendations, and automated FAQs.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={clearChat}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Sidebar + Chat Window */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar: 5 Core Capabilities & Emergency Dispatch */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* 5 Core Capabilities Box */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-800">5 Specially Built Capabilities</h3>
              </div>

              <div className="space-y-2">
                {featureStarters.map((feat, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSendMessage(feat.prompt)}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-start gap-3 shadow-2xs hover:shadow-sm"
                  >
                    <div className="p-2 bg-slate-50 group-hover:bg-white rounded-xl shrink-0 transition-colors">
                      {feat.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-800 group-hover:text-blue-700 transition-colors">
                          {feat.title}
                        </h4>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Hotline Alert */}
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" /> Emergency Direct Contacts
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-medium">
                If experiencing severe chest pain, breathlessness, or trauma, bypass online chat and call immediately:
              </p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-white/90 rounded-xl border border-rose-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">National Ambulance</span>
                  <span className="text-base font-black text-rose-600">108 / 112</span>
                </div>
                <div className="p-2.5 bg-white/90 rounded-xl border border-rose-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Health Helpline</span>
                  <span className="text-base font-black text-blue-700">1075</span>
                </div>
              </div>
            </div>

            {/* Platform Quick Links */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Quick Tools</span>
              <button
                onClick={() => navigate('/compare-hospitals')}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold flex items-center justify-between transition-colors border border-slate-200"
              >
                <span className="flex items-center gap-2"><Scale className="w-4 h-4 text-blue-600" /> Multi-Hospital Comparison</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/hospitals')}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold flex items-center justify-between transition-colors border border-slate-200"
              >
                <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-600" /> Network Hospitals</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/symptom-checker')}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold flex items-center justify-between transition-colors border border-slate-200"
              >
                <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /> Dedicated Symptom Checker</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Area: Interactive Conversational Screen */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[750px] overflow-hidden">
            
            {/* Chat Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/40">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gradient-to-tr from-blue-700 to-indigo-700 text-white'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`rounded-3xl p-5 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      {/* Emergency Callout */}
                      {msg.triage_level === 'EMERGENCY' && (
                        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-bold flex items-center gap-2.5">
                          <PhoneCall className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
                          <span>Emergency Alert: Please call 108 / 112 immediately or proceed to the nearest ER.</span>
                        </div>
                      )}

                      <div className="whitespace-pre-line space-y-1.5 text-xs sm:text-sm">
                        {msg.content}
                      </div>

                      {/* Action Links */}
                      {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                          {msg.suggested_actions.map((act, i) => (
                            <button
                              key={i}
                              onClick={() => navigate(act.path)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 shadow-2xs"
                            >
                              <span>{act.label}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Follow-up Prompts */}
                  {msg.follow_ups && msg.follow_ups.length > 0 && (
                    <div className="mt-2.5 ml-11 flex flex-wrap gap-1.5">
                      {msg.follow_ups.map((fu, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(fu)}
                          className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-indigo-200 rounded-full text-xs font-bold transition-all shadow-2xs hover:scale-102"
                        >
                          💬 {fu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-8 h-8 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce"></span>
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-xs text-slate-400 font-bold ml-1">Analyzing healthcare data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Bar */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  placeholder="Describe your symptoms, ask for hospital navigation, or inquire about appointments..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-xs uppercase tracking-wider shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1 font-medium">
                <span>Supports basic triage, navigation, appointments, wellness & FAQs.</span>
                <span className="text-slate-400">Not a replacement for emergency medical personnel.</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
