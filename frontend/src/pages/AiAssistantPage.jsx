import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Send, Bot, User, AlertTriangle, ShieldCheck,
  Pill, RefreshCw, ArrowRight, ArrowLeft, CheckCircle2, ClipboardList,
  MessageSquare
} from 'lucide-react';
import api from '../api/client';
import BackButton from '../components/common/BackButton';

const SUGGESTIONS = [
  "What is Amoxicillin used for and what are its side effects?",
  "What is the recommended dosage for Paracetamol (Dolo 650)?",
  "How does prescription verification work at MediCare?",
  "What OTC medicines help with seasonal allergies?",
  "Explain what statin medications like Atorvastatin do."
];

const QUESTIONNAIRE_CATEGORIES = [
  { id: 'fever_pain', label: 'Fever, Cold & Body Pain', desc: 'Headaches, high temperature, throat irritation' },
  { id: 'digestion', label: 'Digestive & Acidity', desc: 'Gas, heartburn, indigestion, reflux' },
  { id: 'allergies', label: 'Allergies & Respiratory', desc: 'Sneezing, congestion, seasonal runny nose' },
  { id: 'skin', label: 'Skin & Dermatology', desc: 'Rashes, dryness, minor fungal itching' },
  { id: 'wellness', label: 'Vitamins & Daily Energy', desc: 'Fatigue, immunity boosters, supplements' }
];

export default function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'questionnaire'

  // Chat States
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: (
        "Hello! I am **MediAI**, your intelligent pharmaceutical assistant at MediCare.\n\n" +
        "I can answer questions regarding active pharmaceutical ingredients, general dosage timing, common indications, side effect profiles, and how our online pharmacy works.\n\n" +
        "How can I assist your health and medicine questions today?"
      ),
      disclaimer: "⚠️ Medical Disclaimer: MediAI provides general informational guidance only. Always consult a licensed physician or pharmacist for medical diagnosis, treatment, or specific prescription advice."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Questionnaire States (Multi-step form)
  const [qStep, setQStep] = useState(1);
  const [qData, setQData] = useState({
    category: '',
    duration: '1-2 days',
    severity: 'Mild',
    details: '',
    hasAllergies: 'No',
    allergyNotes: '',
    isPregnantOrNursing: 'No'
  });
  const [qAnalysis, setQAnalysis] = useState(null);
  const [qLoading, setQLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, activeTab]);

  const handleSend = async (textToSend = input) => {
    const query = textToSend.trim();
    if (!query || loading) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat/', {
        prompt: query,
        history: messages
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: res.data.response,
          disclaimer: res.data.disclaimer,
          matched_medicine: res.data.matched_medicine
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: "I apologize, but I am having trouble connecting to the healthcare database right now. Please try again shortly.",
          disclaimer: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'model',
        content: "Chat cleared! How can MediAI assist you today?",
        disclaimer: "⚠️ Medical Disclaimer: MediAI provides general informational guidance only."
      }
    ]);
  };

  const handleCompleteQuestionnaire = async () => {
    try {
      setQLoading(true);
      const prompt = `Patient Questionnaire Assessment:\n- Category: ${qData.category}\n- Duration: ${qData.duration}\n- Severity: ${qData.severity}\n- Specific details: ${qData.details}\n- Known Allergies: ${qData.hasAllergies} ${qData.allergyNotes ? `(${qData.allergyNotes})` : ''}\n- Pregnant/Nursing: ${qData.isPregnantOrNursing}\n\nPlease provide a clear summary of recommended OTC care, active ingredients to look for, lifestyle hydration tips, and red flags when to see an in-person doctor.`;
      
      const res = await api.post('/ai/chat/', {
        prompt,
        history: []
      });

      setQAnalysis({
        summary: res.data.response,
        matched_medicine: res.data.matched_medicine,
        disclaimer: res.data.disclaimer
      });
      setQStep(4);
    } catch (err) {
      console.error(err);
    } finally {
      setQLoading(false);
    }
  };

  const handleResetQuestionnaire = () => {
    setQStep(1);
    setQData({
      category: '',
      duration: '1-2 days',
      severity: 'Mild',
      details: '',
      hasAllergies: 'No',
      allergyNotes: '',
      isPregnantOrNursing: 'No'
    });
    setQAnalysis(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <BackButton fallbackUrl="/" label="Back to Home" />
        
        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Live Chat
          </button>
          <button
            onClick={() => setActiveTab('questionnaire')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'questionnaire'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Guided Questionnaire
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            MediAI Health & Medicine Guide
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {activeTab === 'chat' ? 'Ask Questions About Medications & Health' : 'Guided Symptom & Medicine Questionnaire'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {activeTab === 'chat'
              ? 'Instant insights on pharmaceutical ingredients, dosage safety, OTC relief, and online prescription requirements.'
              : 'Answer simple step-by-step health questions to receive personalized OTC medication insights.'}
          </p>
        </div>
      </div>

      {/* Statutory Medical Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="font-bold text-amber-950 block">Important Healthcare Notice:</strong>
          MediAI is designed for educational information only. It does not provide medical diagnosis, treatment regimens, or clinical prescriptions. Always verify health decisions with your licensed medical practitioner.
        </div>
      </div>

      {/* MODE 1: LIVE CHAT */}
      {activeTab === 'chat' && (
        <div className="space-y-6 animate-fade-in">
          {/* Suggested Quick Prompt Pills */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suggested Questions:</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  disabled={loading}
                  className="text-xs text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 px-3.5 py-2 rounded-xl font-medium transition-all shadow-2xs text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col h-[520px] overflow-hidden">
            
            {/* Chat Top bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900">MediAI Assistant</h3>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online & Ready
                  </span>
                </div>
              </div>

              <button
                onClick={handleClearChat}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {messages.map((msg, index) => {
                const isModel = msg.role === 'model';
                return (
                  <div
                    key={index}
                    className={`flex gap-3 ${isModel ? 'items-start' : 'items-start flex-row-reverse'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isModel ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                      }`}
                    >
                      {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className="space-y-3 max-w-[85%] sm:max-w-[75%]">
                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                          isModel
                            ? 'bg-slate-100 text-slate-900 border border-slate-200'
                            : 'bg-emerald-600 text-white font-medium shadow-xs'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Matched Medicine Card */}
                      {msg.matched_medicine && (
                        <div className="p-3 bg-white border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <img
                              src={msg.matched_medicine.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                              alt={msg.matched_medicine.name}
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-xs text-slate-900">{msg.matched_medicine.name}</p>
                              <p className="text-[11px] text-slate-500">₹{msg.matched_medicine.selling_price} • {msg.matched_medicine.brand}</p>
                            </div>
                          </div>
                          <Link
                            to={`/medicines/${msg.matched_medicine.id || msg.matched_medicine._id}`}
                            className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 shrink-0"
                          >
                            View Medicine →
                          </Link>
                        </div>
                      )}

                      {/* Disclaimer banner */}
                      {msg.disclaimer && (
                        <p className="text-[10px] text-slate-400 italic px-2">
                          {msg.disclaimer}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3 items-center text-xs text-slate-500 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="bg-slate-100 px-4 py-2 rounded-2xl">MediAI is researching clinical data...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your medicine or health question..."
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-600/20 disabled:opacity-40 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODE 2: GUIDED QUESTIONNAIRE WITH PREVIOUS AND NEXT NAVIGATION */}
      {activeTab === 'questionnaire' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 animate-fade-in">
          
          {/* Stepper Header */}
          <div className="max-w-2xl mx-auto border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
              {[
                { s: 1, label: 'Area of Care' },
                { s: 2, label: 'Symptoms' },
                { s: 3, label: 'Health Profile' },
                { s: 4, label: 'Assessment' }
              ].map(st => (
                <div key={st.s} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                      qStep >= st.s ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {st.s}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 mt-1.5 text-center">
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: Select Primary Health Area */}
          {qStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 1: What area of health or symptom would you like guidance on?</h3>
                <p className="text-xs text-slate-500">Select the primary condition category to begin</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUESTIONNAIRE_CATEGORIES.map((cat) => {
                  const isSelected = qData.category === cat.label;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setQData({ ...qData, category: cat.label })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                      }`}
                    >
                      <h4 className="font-bold text-xs text-slate-900">{cat.label}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{cat.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Step 1 Navigation */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={true}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
                </button>
                <button
                  type="button"
                  onClick={() => setQStep(2)}
                  disabled={!qData.category}
                  className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <span>Next: Symptoms Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Symptoms & Duration */}
          {qStep === 2 && (
            <div className="space-y-5 animate-fade-in text-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 2: Describe Symptoms & Duration</h3>
                <p className="text-xs text-slate-500">Selected area: <strong>{qData.category}</strong></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">How long have you noticed these symptoms? *</label>
                  <select
                    value={qData.duration}
                    onChange={(e) => setQData({ ...qData, duration: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
                  >
                    <option value="Less than 24 hours">Less than 24 hours</option>
                    <option value="1-2 days">1 to 2 days</option>
                    <option value="3-5 days">3 to 5 days</option>
                    <option value="More than a week">More than a week</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity Level</label>
                  <select
                    value={qData.severity}
                    onChange={(e) => setQData({ ...qData, severity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
                  >
                    <option value="Mild (manageable daily)">Mild (manageable daily)</option>
                    <option value="Moderate (disrupting sleep/work)">Moderate (disrupting sleep/work)</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Additional description of symptoms (Optional)</label>
                <textarea
                  value={qData.details}
                  onChange={(e) => setQData({ ...qData, details: e.target.value })}
                  rows={3}
                  placeholder="e.g. Mild headache with sore throat after cold weather exposure..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {/* Step 2 Navigation */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setQStep(1)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous: Area of Care
                </button>
                <button
                  type="button"
                  onClick={() => setQStep(3)}
                  className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Next: Health Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Health Profile & Allergies */}
          {qStep === 3 && (
            <div className="space-y-5 animate-fade-in text-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 3: Health Profile & Known Allergies</h3>
                <p className="text-xs text-slate-500">Helps MediAI check for drug contraindications and safe ingredients</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Do you have any drug allergies (e.g. Penicillin, NSAIDs)?</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="allergies"
                        checked={qData.hasAllergies === 'No'}
                        onChange={() => setQData({ ...qData, hasAllergies: 'No', allergyNotes: '' })}
                        className="text-emerald-600"
                      />
                      <span>No Known Allergies</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="allergies"
                        checked={qData.hasAllergies === 'Yes'}
                        onChange={() => setQData({ ...qData, hasAllergies: 'Yes' })}
                        className="text-emerald-600"
                      />
                      <span>Yes, I have allergies</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Are you currently pregnant or nursing?</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="preg"
                        checked={qData.isPregnantOrNursing === 'No'}
                        onChange={() => setQData({ ...qData, isPregnantOrNursing: 'No' })}
                        className="text-emerald-600"
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="preg"
                        checked={qData.isPregnantOrNursing === 'Yes'}
                        onChange={() => setQData({ ...qData, isPregnantOrNursing: 'Yes' })}
                        className="text-emerald-600"
                      />
                      <span>Yes</span>
                    </label>
                  </div>
                </div>
              </div>

              {qData.hasAllergies === 'Yes' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">List allergic drugs or food compounds:</label>
                  <input
                    type="text"
                    value={qData.allergyNotes}
                    onChange={(e) => setQData({ ...qData, allergyNotes: e.target.value })}
                    placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              )}

              {/* Step 3 Navigation */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setQStep(2)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous: Symptoms
                </button>
                <button
                  type="button"
                  onClick={handleCompleteQuestionnaire}
                  disabled={qLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{qLoading ? 'Generating Clinical Assessment...' : 'Get MediAI Assessment'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Assessment & Recommendations */}
          {qStep === 4 && qAnalysis && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">MediAI Clinical Assessment</h3>
                </div>
                <button
                  onClick={handleResetQuestionnaire}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retake Questionnaire
                </button>
              </div>

              {/* Summary Guidance */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {qAnalysis.summary}
              </div>

              {/* Matched Medicine Suggestion */}
              {qAnalysis.matched_medicine && (
                <div className="p-4 bg-emerald-50/60 border-2 border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={qAnalysis.matched_medicine.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                      alt={qAnalysis.matched_medicine.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                    />
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Suggested Catalog Medicine
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5">{qAnalysis.matched_medicine.name}</h4>
                      <p className="text-xs text-slate-600">{qAnalysis.matched_medicine.generic_name} • ₹{qAnalysis.matched_medicine.selling_price}</p>
                    </div>
                  </div>

                  <Link
                    to={`/medicines/${qAnalysis.matched_medicine.id || qAnalysis.matched_medicine._id}`}
                    className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all shadow-xs text-center shrink-0"
                  >
                    View Medicine Details →
                  </Link>
                </div>
              )}

              {/* Step 4 Navigation */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setQStep(3)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous: Health Profile
                </button>
                <Link
                  to="/medicines"
                  className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md text-center"
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
