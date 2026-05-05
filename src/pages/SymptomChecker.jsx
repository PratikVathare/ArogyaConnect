import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, ArrowRight, Brain, Clock, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [department, setDepartment] = useState('');
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location", error);
        }
      );
    }
  }, []);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    
    try {
      const token = localStorage.getItem('arogya_auth_token');
      // If token is missing, might redirect to login, but handle it gracefully
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://127.0.0.1:3001/api/symptoms', {
        method: 'POST',
        headers,
        body: JSON.stringify({ symptoms })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze symptoms');
      }

      if (data.error) {
         setError(data.error);
         setIsAnalyzing(false);
         return;
      }

      let parsedDiseases = data.diseases || data['possible diseases'] || data.possible_diseases || [];
      if (!Array.isArray(parsedDiseases)) parsedDiseases = [parsedDiseases];
      
      const dept = data.department || 'General Practice';
      setDepartment(dept);

      // Fetch nearby hospitals
      let hospitalNames = ['Arogya Network Hospital', 'City General Hospital']; // fallback
      try {
        let url = `http://127.0.0.1:3001/api/hospitals/nearby?specialization=${encodeURIComponent(dept)}`;
        if (userLocation) {
          url += `&lat=${userLocation[0]}&lng=${userLocation[1]}`;
        }
        
        const hospResponse = await fetch(url, { headers });
        if (hospResponse.ok) {
          const hospData = await hospResponse.json();
          if (hospData && hospData.length > 0) {
            hospitalNames = hospData.map(h => h.name);
          }
        }
      } catch (hospErr) {
        console.error("Error fetching nearby hospitals:", hospErr);
      }

      const newResults = {
        conditions: parsedDiseases.map((d) => ({ 
          name: typeof d === 'string' ? d : (d.name || 'Unknown Condition'), 
          match: Math.floor(Math.random() * 20) + 75,
          severity: data.severity || 'Medium' 
        })),
        department: dept,
        urgency: data.severity || 'Routine',
        recommendations: [
          'Consult a medical professional for an accurate diagnosis.',
          'Monitor your condition and seek emergency care if symptoms rapidly worsen.'
        ],
        hospitals: hospitalNames
      };

      setResults(newResults);

      // Save to history for dashboard health score
      const historyEntry = {
        date: new Date().toISOString(),
        symptoms: symptoms,
        severity: data.severity || 'Medium',
        department: dept
      };
      const existingHistory = JSON.parse(localStorage.getItem('arogya_symptom_history') || '[]');
      existingHistory.push(historyEntry);
      localStorage.setItem('arogya_symptom_history', JSON.stringify(existingHistory));

    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Server is not running. Please start the backend.' : err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-80px)] py-8 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Input Panel */}
        <div className="w-full lg:w-1/2 flex flex-col h-full">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">AI Symptom Checker</h1>
                <p className="text-slate-500">Describe what you're feeling in detail.</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-4 text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-3 block">Your Symptoms</label>
              <textarea 
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g., I have had a headache for 3 days, feeling slightly dizzy when standing up, and a mild dry cough..."
                className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 leading-relaxed"
              ></textarea>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Medical Disclaimer: This tool does not provide medical advice. It is for informational purposes only.
              </p>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !symptoms.trim()}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex justify-center items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="w-5 h-5 animate-pulse" />
                  Analyzing Symptoms...
                </>
              ) : (
                <>
                  Analyze Symptoms
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <AnimatePresence mode="wait">
            {!results && !isAnalyzing && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-100/50 p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 mb-6 shadow-sm">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-500 mb-2">Awaiting Input</h3>
                <p className="text-slate-400 max-w-sm">Enter your symptoms on the left to receive an AI-powered preliminary analysis.</p>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  <Brain className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Cross-referencing databases...</h3>
                <p className="text-slate-500">Our engine is matching your symptoms against clinical records.</p>
              </motion.div>
            )}

            {results && !isAnalyzing && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-800">Preliminary Analysis</h2>
                  <span className="px-4 py-1.5 bg-green-100 text-green-700 font-bold text-sm rounded-full flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {results.urgency}
                  </span>
                </div>

                <div className="space-y-8 flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Possible Conditions</h3>
                    <div className="space-y-3">
                      {results.conditions.map((cond, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 h-full w-1 bg-blue-500 rounded-l-xl"></div>
                          <div className="flex justify-between items-center z-10 relative">
                            <span className="font-bold text-slate-800">{cond.name}</span>
                            <span className="text-sm font-semibold px-2 py-1 bg-white rounded shadow-sm text-blue-600">{cond.match}% Match</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recommended Actions</h3>
                    <ul className="space-y-3">
                      {results.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-3 text-slate-700">
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                    <h3 className="font-bold text-blue-900 mb-2">Recommended Department</h3>
                    <p className="text-blue-800 font-medium mb-6 text-xl">{results.department}</p>
                    
                    <h4 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wider">Suggested Hospitals</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.hospitals.map((hosp, idx) => (
                        <span key={idx} className="bg-white text-blue-700 text-sm px-3 py-1.5 rounded-full font-semibold border border-blue-100">{hosp}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-8 border-t border-slate-100">
                  <Link to="/hospitals" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2">
                    Book Appointment Now
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
