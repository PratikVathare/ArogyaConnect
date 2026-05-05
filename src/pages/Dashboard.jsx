import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Activity, FileText, ChevronRight, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const [userName, setUserName] = useState('User');
  const [appointments, setAppointments] = useState([]);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [healthScore, setHealthScore] = useState(95);
  const [healthMessage, setHealthMessage] = useState("You are in great health. Keep up the good work!");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('arogya_auth_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch User Profile
        const userRes = await fetch('http://127.0.0.1:3001/api/users/profile', { headers });
        if (userRes.ok) {
          const userData = await userRes.json();
          const name = userData.user?.user_metadata?.full_name || userData.user?.email?.split('@')[0] || 'User';
          setUserName(name.split(' ')[0]); // Get first name
        }

        // Fetch Appointments
        const apptRes = await fetch('http://127.0.0.1:3001/api/appointments/my-appointments', { headers });
        if (apptRes.ok) {
          const apptData = await apptRes.json();
          
          const formattedAppts = apptData.map(a => {
            const date = new Date(a.appointment_date);
            let timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + 
                          date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            return {
              id: a.id,
              doc: "Hospital Visit",
              spec: a.hospitals?.name || "Medical Consultation",
              time: timeStr,
              status: a.status || "Upcoming",
              color: a.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
            };
          });
          setAppointments(formattedAppts);
        }

        // Calculate dynamic health score based on symptom history
        const historyStr = localStorage.getItem('arogya_symptom_history');
        if (historyStr) {
          const history = JSON.parse(historyStr);
          let score = 95; // Base healthy score
          history.forEach(entry => {
            if (entry.severity === 'High') score -= 10;
            else if (entry.severity === 'Medium') score -= 5;
            else score -= 2;
          });
          score = Math.max(40, score);
          setHealthScore(score);
          if (score >= 90) setHealthMessage("You are in the top 15% of healthy individuals your age. Keep up the good work!");
          else if (score >= 75) setHealthMessage("Your health is relatively stable, but keep monitoring your symptoms.");
          else setHealthMessage("Your recent symptoms suggest you should consult a doctor soon. Please book an appointment.");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-6 lg:px-12">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border-4 border-white shadow-sm">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Good morning, {userName}!</h1>
              <p className="text-slate-500">Your health is looking great today.</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Book Appointment", desc: "Schedule a doctor visit", icon: Calendar, gradient: "from-blue-500 to-blue-600", color: "text-blue-600", bg: "bg-blue-50", ring: "hover:ring-blue-500/20", link: "/hospitals" },
                { label: "Symptom Checker", desc: "AI health analysis", icon: Activity, gradient: "from-red-500 to-red-600", color: "text-red-500", bg: "bg-red-50", ring: "hover:ring-red-500/20", link: "/symptom-checker" },
                { label: "Find Hospital", desc: "Locate nearby centers", icon: MapPin, gradient: "from-green-500 to-green-600", color: "text-green-600", bg: "bg-green-50", ring: "hover:ring-green-500/20", link: "/hospitals" },
              ].map((action, i) => (
                <motion.button 
                  key={action.label} 
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.link)}
                  className={`relative overflow-hidden p-6 bg-white border border-slate-100 rounded-[2rem] flex flex-col items-start gap-4 shadow-sm hover:shadow-2xl transition-all duration-300 group hover:ring-4 ${action.ring}`}
                >
                  <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${action.gradient} rounded-full opacity-5 group-hover:opacity-15 transition-opacity duration-500 blur-3xl`}></div>
                  
                  <div className={`p-4 rounded-2xl ${action.bg} ${action.color} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-8 h-8" strokeWidth={2.5} />
                  </div>
                  
                  <div className="text-left mt-2">
                    <span className="block text-xl font-bold text-slate-800 mb-1.5">{action.label}</span>
                    <span className="block text-sm font-medium text-slate-500">{action.desc}</span>
                  </div>
                  
                  <div className={`mt-auto pt-4 flex items-center gap-1.5 text-sm font-bold ${action.color} opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300`}>
                    Start Now <ChevronRight className="w-4 h-4" strokeWidth={3} />
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Upcoming Appointments */}
            <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Your Appointments</h2>
                {appointments.length > 0 && (
                  <button 
                    onClick={() => setShowAllAppointments(!showAllAppointments)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {showAllAppointments ? 'Show Less' : 'View All'}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No upcoming appointments
                  </div>
                ) : (
                  (showAllAppointments ? appointments : appointments.slice(0, 3)).map(appt => (
                    <div key={appt.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-slate-500" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-bold text-slate-800">{appt.doc}</h3>
                        <p className="text-sm text-slate-500">{appt.spec}</p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1">
                        <span className="text-sm font-medium text-slate-700">{appt.time}</span>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold w-max mx-auto sm:mx-0 ${appt.color}`}>
                          {appt.status}
                        </span>
                      </div>
                      <button className="hidden sm:flex w-8 h-8 items-center justify-center text-slate-400 hover:text-blue-600">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl p-6 shadow-lg shadow-blue-500/20">
              <h3 className="font-bold text-lg mb-2 opacity-90">Health Score</h3>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-5xl font-extrabold tracking-tighter">{healthScore}</span>
                <span className="text-blue-200 mb-1 font-medium">/ 100</span>
              </div>
              <p className="text-sm text-blue-100 leading-relaxed">{healthMessage}</p>
              
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>Weekly Goal</span>
                  <span className="font-bold">60%</span>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full w-[60%]"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
