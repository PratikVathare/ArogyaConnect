import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Activity, Brain, Shield, Info, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full relative overflow-hidden bg-white">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-20 pb-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <motion.div 
          className="w-full md:w-1/2 z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-6 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Clinical Grade AI Analysis Available
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
            Intelligent Health <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">Navigation</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">
            Experience the future of medical triage. Our AI symptom checker evaluates your condition instantly and connects you with the right specialists in our certified hospital network.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/symptom-checker" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-600/20 transition-all text-lg">
              <Brain className="w-5 h-5" />
              Check Symptoms
            </Link>
            <Link to="/hospitals" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-lg hover:bg-slate-50">
              <MapPin className="w-5 h-5" />
              Find Hospitals
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating Image Hero */}
        <motion.div 
          className="w-full md:w-1/2 relative"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="absolute -inset-4 bg-blue-50 rounded-[2.5rem] rotate-3 -z-10"></div>
          <div className="p-4 rounded-[2rem] shadow-2xl overflow-hidden bg-white/50 backdrop-blur border border-white">
            <img 
              src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200&h=800" 
              alt="Medical Professionals" 
              className="w-full h-auto rounded-[1.5rem] object-cover shadow-inner"
            />
          </div>
          
          <motion.div 
            className="absolute -bottom-6 left-10 lg:-left-12 bg-white/90 backdrop-blur p-6 rounded-2xl shadow-xl border border-white/60"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Status</p>
                <p className="text-sm font-semibold text-slate-800">Verified Networks Online</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section className="bg-slate-50 py-24 px-6 lg:px-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Smart Health Services</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">Providing data-driven solutions to simplify your healthcare decision-making process.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                title: "AI Symptom Checker",
                description: "Our proprietary clinical engine analyzes your symptoms in real-time to provide immediate risk assessment and guidance based on medical databases.",
                icon: Brain,
                color: "bg-blue-100 text-blue-600"
              },
              {
                title: "Hospital Discovery",
                description: "Personalized matches based on specialist availability, proximity, insurance coverage, and verified patient quality ratings.",
                icon: MapPin,
                color: "bg-green-100 text-green-600"
              },
              {
                title: "Trusted Care",
                description: "Access our validated network of premium healthcare institutions. Reliable, secure, and professional medical services.",
                icon: Shield,
                color: "bg-orange-100 text-orange-600"
              }
            ].map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer CTA */}
      <section className="bg-blue-600 py-16 text-center text-white px-6">
        <h2 className="text-3xl font-bold mb-6">Ready to prioritize your health?</h2>
        <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
          Join ArogyaConnect Today
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
