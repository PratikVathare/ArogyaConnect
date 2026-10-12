import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Trash2,
  Activity,
  Building2,
  Calendar,
  Scale,
  HelpCircle,
  Stethoscope,
  HeartPulse,
  PhoneCall
} from 'lucide-react';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hello! I am **ArogyaConnect AI**, your dedicated healthcare navigator assistant.\n\nI am specially built to help you with:\n1. 🩺 **Basic Triage Support** (assess symptoms & suggest specialists)\n2. 🏥 **Hospital Navigation** (find nearby facilities with ICU/trauma)\n3. 📅 **Appointment Guidance** (step-by-step booking support)\n4. 💡 **Health Recommendations** (safe wellness & preventive tips)\n5. ❓ **FAQ Automation** (insurance, cashless TPA & platform help)\n\nHow can I help you today?`,
      triage_level: 'NORMAL',
      suggested_actions: [
        { label: 'Check Symptoms', path: '/symptom-checker', icon: 'activity' },
        { label: 'Compare Hospitals', path: '/compare-hospitals', icon: 'scale' },
        { label: 'Find Nearby Hospitals', path: '/hospitals', icon: 'hospital' }
      ],
      follow_ups: [
        'I have a fever and cough',
        'Which hospital has the shortest wait time?',
        'How do I book an appointment?',
        'Does ArogyaConnect support Ayushman Bharat?'
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  // Don't render floating widget if user is already on the dedicated /ai-assistant page
  if (location.pathname === '/ai-assistant' || location.pathname === '/chat') {
    return null;
  }

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

      if (!res.ok) {
        throw new Error('Chat API returned an error.');
      }

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
      if (!isOpen) setHasUnread(true);
    } catch (err) {
      console.error('AIChatWidget error:', err);
      // Friendly fallback
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I'm having a brief connection delay, but I can still guide you:\n\n- 🩺 For symptom analysis: visit our [Symptom Checker](/symptom-checker)\n- 🏥 To find nearby facilities: check [Network Hospitals](/hospitals)\n- ⚖️ To compare costs & wait times: open [Compare Hospitals](/compare-hospitals)\n- 🚨 In a medical emergency: please dial **108 / 112** immediately.`,
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
        id: 'welcome-reset',
        role: 'assistant',
        content: `Chat history cleared. How can I assist you with triage, hospital navigation, or appointments?`,
        triage_level: 'NORMAL',
        suggested_actions: [
          { label: 'Compare Hospitals', path: '/compare-hospitals', icon: 'scale' },
          { label: 'Find Nearby Hospitals', path: '/hospitals', icon: 'hospital' }
        ],
        follow_ups: [
          'I have a headache and fatigue',
          'Find nearest emergency hospital',
          'Is booking free on ArogyaConnect?'
        ]
      }
    ]);
  };

  const renderActionIcon = (actionLabel = '') => {
    const l = actionLabel.toLowerCase();
    if (l.includes('compare') || l.includes('scale')) return <Scale className="w-3.5 h-3.5" />;
    if (l.includes('hospital') || l.includes('doctor')) return <Building2 className="w-3.5 h-3.5" />;
    if (l.includes('book') || l.includes('appointment')) return <Calendar className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-4 bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-600 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] border border-white/20 flex items-center justify-center transition-all"
          aria-label="Open ArogyaConnect AI Chatbot"
        >
          {/* Animated pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-blue-500/30 animate-ping pointer-events-none"></span>

          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <Bot className="w-6 h-6" />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-2 right-2 animate-pulse" />
            </>
          )}

          {/* Unread badge */}
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>
          )}

          {/* Tooltip on hover */}
          {!isOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-3.5 py-1.5 bg-slate-900/90 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl backdrop-blur-sm pointer-events-none border border-slate-700">
              Arogya AI: Triage & Hospital Help
            </div>
          )}
        </motion.button>
      </div>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900"></span>
                </div>
                <div>
                  <h3 className="text-sm font-black flex items-center gap-1.5">
                    ArogyaConnect AI
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-400/20 text-blue-300 text-[9px] font-extrabold uppercase">
                      Online
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">Triage, Hospitals & Healthcare Navigator</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/ai-assistant');
                  }}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Expand to Full Page"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={clearChat}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Emergency Ribbon */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-amber-900 font-semibold shrink-0">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Life-threatening emergency? Call <strong>108 / 112</strong> immediately.</span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div className={`rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      {/* Emergency Warning Banner if flagged */}
                      {msg.triage_level === 'EMERGENCY' && (
                        <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold flex items-center gap-2">
                          <PhoneCall className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                          <span>Emergency Detected: Call 108 / 112 immediately!</span>
                        </div>
                      )}

                      {/* Message Content formatted */}
                      <div className="whitespace-pre-line space-y-1">
                        {msg.content}
                      </div>

                      {/* Suggested Navigation Actions */}
                      {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {msg.suggested_actions.map((act, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setIsOpen(false);
                                navigate(act.path);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-all border border-blue-200 shadow-xs"
                            >
                              {renderActionIcon(act.label)}
                              <span>{act.label}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Follow-up Quick Chips */}
                  {msg.follow_ups && msg.follow_ups.length > 0 && (
                    <div className="mt-2 ml-9 flex flex-wrap gap-1.5">
                      {msg.follow_ups.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(fu)}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-indigo-200 rounded-full text-[10px] font-bold transition-all shadow-2xs hover:scale-102"
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
                <div className="flex items-center gap-2 ml-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask symptoms, hospitals, wait times, FAQs..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-slate-400 text-center mt-1.5 font-medium">
                AI assistance for triage & guidance. Consult registered physicians for formal diagnoses.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
