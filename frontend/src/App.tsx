import { useState } from 'react';
import { Upload, FileText, CheckCircle, ShieldAlert, Cpu, Menu, X, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dashboard } from './components/Dashboard';
import type { EvaluationPayload } from './components/Dashboard';
import { DebatePanel } from './components/DebatePanel';

import { ReportView } from './components/ReportView';
import { HowItWorks } from './components/HowItWorks';

type ViewState = 'landing' | 'upload' | 'debate' | 'report' | 'how-it-works';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [reportData, setReportData] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shared evaluation context
  const [evaluationContext, setEvaluationContext] = useState<EvaluationPayload>({
    candidates: [],
    resumeText: '',
    jobDescription: '',
    candidateName: 'Alex Johnson',
    candidateId: 'cand_init',
    role: 'Senior Full Stack Engineer'
  });

  const handleUploadComplete = (payload: EvaluationPayload) => {
    setEvaluationContext(payload);
    setCurrentView('debate');
  };

  const navItems: { label: string; view: ViewState }[] = [
    { label: 'How it Works', view: 'how-it-works' },
    { label: 'Upload & Setup', view: 'upload' },
    { label: 'Live Debate', view: 'debate' },
    { label: 'Consensus Report', view: 'report' },
  ];

  return (
    <div className="min-h-screen bg-evalora-bg text-evalora-text flex flex-col font-sans selection:bg-evalora-accent selection:text-white">
      {/* Navigation */}
      <nav className="w-full border-b border-evalora-border bg-evalora-card/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer group"
            onClick={() => {
              setCurrentView('landing');
              setMobileMenuOpen(false);
            }}
          >
            <div className="p-1.5 rounded-lg bg-evalora-accent/10 border border-evalora-accent/30 group-hover:bg-evalora-accent/20 transition-all">
              <Cpu className="w-5 h-5 text-evalora-accent" />
            </div>
            <span className="text-xl font-bold tracking-wider text-white">EVALORA</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`transition-colors py-1 px-2.5 rounded-md ${
                  currentView === item.view
                    ? 'text-white bg-white/5 font-semibold'
                    : 'text-evalora-muted hover:text-evalora-text'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={() => setCurrentView('upload')}
              className="btn-primary text-xs flex items-center space-x-1.5 px-4 py-2"
            >
              <span>Start Evaluation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-evalora-muted hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-evalora-border bg-evalora-card px-6 py-4 space-y-3"
            >
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => {
                    setCurrentView(item.view);
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left py-2 px-3 rounded-lg text-sm ${
                    currentView === item.view
                      ? 'bg-evalora-accent/10 text-evalora-accent font-semibold'
                      : 'text-evalora-muted hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setCurrentView('upload');
                    setMobileMenuOpen(false);
                  }}
                  className="btn-primary w-full text-sm py-2.5 flex items-center justify-center space-x-2"
                >
                  <span>Start Evaluation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {currentView === 'landing' && (
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-12 md:mt-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-evalora-card border border-evalora-border text-xs text-evalora-accent font-mono mb-6">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Multi-Agent Hiring Consensus Engine</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-white">
                Evidence. Debate. Decisions.
              </h1>
              <h2 className="text-2xl md:text-3xl font-medium text-evalora-muted mb-6">
                Evaluate beyond the resume.
              </h2>
              <p className="max-w-2xl mx-auto text-base md:text-lg text-evalora-muted mb-10 leading-relaxed">
                Four specialized AI agents analyze candidate profiles independently, challenge unsupported claims in a live cross-examination, and reconcile disagreements into an explainable hiring decision.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5">
                <button 
                  onClick={() => setCurrentView('upload')}
                  className="btn-primary flex items-center space-x-2 px-8 py-3.5 text-base w-full sm:w-auto justify-center shadow-lg shadow-indigo-500/25"
                >
                  <Upload className="w-5 h-5" />
                  <span>Start New Evaluation</span>
                </button>
                <button 
                  onClick={() => setCurrentView('how-it-works')}
                  className="btn-secondary px-8 py-3.5 text-base w-full sm:w-auto"
                >
                  See How It Works
                </button>
              </div>
            </motion.div>

            {/* Feature Cards */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-24 w-full"
            >
              <div className="card text-left hover:-translate-y-1.5 transition-transform duration-300">
                <ShieldAlert className="w-10 h-10 text-evalora-warning mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">Multi-Agent Debate</h3>
                <p className="text-evalora-muted text-sm leading-relaxed">The Challenger scrutinizes exaggerated claims and missing metrics while specialists defend verifiable technical accomplishments.</p>
              </div>
              <div className="card text-left hover:-translate-y-1.5 transition-transform duration-300 border-evalora-accent/40 bg-evalora-accent/5">
                <FileText className="w-10 h-10 text-evalora-accent mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">Evidence Traceability</h3>
                <p className="text-evalora-muted text-sm leading-relaxed">Every claim, score, and recommendation links directly back to exact quotes and source documents from the candidate's history.</p>
              </div>
              <div className="card text-left hover:-translate-y-1.5 transition-transform duration-300">
                <CheckCircle className="w-10 h-10 text-evalora-success mb-4" />
                <h3 className="text-xl font-bold mb-2 text-white">Explainable Decisions</h3>
                <p className="text-evalora-muted text-sm leading-relaxed">Gain transparency into category scores, interview probing questions, and human override controls with What-If simulations.</p>
              </div>
            </motion.div>
          </main>
        )}

        {currentView === 'how-it-works' && (
          <HowItWorks onStart={() => setCurrentView('upload')} />
        )}

        {currentView === 'upload' && (
          <Dashboard 
            onUploadComplete={handleUploadComplete} 
            initialRole={evaluationContext.role}
          />
        )}

        {currentView === 'debate' && (
          <DebatePanel 
            candidates={evaluationContext.candidates}
            resumeText={evaluationContext.resumeText}
            jobDescription={evaluationContext.jobDescription}
            candidateName={evaluationContext.candidateName}
            candidateId={evaluationContext.candidateId}
            role={evaluationContext.role}
            onDebateComplete={(finalData) => {
              setReportData(finalData);
              setCurrentView('report');
            }} 
          />
        )}

        {currentView === 'report' && (
          <ReportView 
            reportData={reportData} 
            onNewEvaluation={() => setCurrentView('upload')}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-evalora-border/60 bg-evalora-card/30 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-evalora-muted gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-evalora-accent" />
            <span>Evalora AI Candidate Evaluation Platform</span>
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={() => setCurrentView('how-it-works')} className="hover:text-white transition">Methodology</button>
            <button onClick={() => setCurrentView('upload')} className="hover:text-white transition">New Session</button>
            <span className="flex items-center space-x-1.5 text-evalora-success">
              <span className="w-2 h-2 rounded-full bg-evalora-success animate-pulse" />
              <span>System Operational</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
