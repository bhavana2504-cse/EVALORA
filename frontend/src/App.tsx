import { useState } from 'react'
import { Upload, FileText, CheckCircle, ShieldAlert, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { Dashboard } from './components/Dashboard'
import { DebatePanel } from './components/DebatePanel'
import { ReportView } from './components/ReportView'
import { HowItWorks } from './components/HowItWorks'

type ViewState = 'landing' | 'upload' | 'debate' | 'report' | 'how-it-works';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [reportData, setReportData] = useState<any>(null);

  return (
    <div className="min-h-screen bg-evalora-bg text-evalora-text flex flex-col font-sans selection:bg-evalora-accent selection:text-white">
      {/* Navigation */}
      <nav className="w-full border-b border-evalora-border bg-evalora-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setCurrentView('landing')}
          >
            <Cpu className="w-6 h-6 text-evalora-accent" />
            <span className="text-xl font-bold tracking-wider">EVALORA</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-evalora-muted">
            <button onClick={() => setCurrentView('how-it-works')} className="hover:text-evalora-text transition">How it Works</button>
            <button onClick={() => setCurrentView('upload')} className="hover:text-evalora-text transition">Upload</button>
            <button onClick={() => setCurrentView('debate')} className="hover:text-evalora-text transition">Live Debate</button>
            <button onClick={() => setCurrentView('report')} className="hover:text-evalora-text transition">Report</button>
            <button onClick={() => setCurrentView('upload')} className="text-evalora-accent">Start Evaluation</button>
          </div>
        </div>
      </nav>

      <div className="flex-1">
        {currentView === 'landing' && (
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
                Evidence. Debate. Decisions.
              </h1>
              <h2 className="text-2xl md:text-3xl font-medium text-evalora-muted mb-8">
                Evaluate beyond the resume.
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-evalora-muted mb-10 leading-relaxed">
                Four independent AI perspectives analyze candidates, challenge each other's reasoning, and reach evidence-backed hiring decisions.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button 
                  onClick={() => setCurrentView('upload')}
                  className="btn-primary flex items-center space-x-2 px-8 py-3 text-lg w-full sm:w-auto justify-center"
                >
                  <Upload className="w-5 h-5" />
                  <span>Start Evaluation</span>
                </button>
                <button 
                  onClick={() => setCurrentView('how-it-works')}
                  className="btn-secondary px-8 py-3 text-lg w-full sm:w-auto"
                >
                  See How It Works
                </button>
              </div>
            </motion.div>

            {/* Feature Cards */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-32 w-full"
            >
              <div className="card text-left hover:-translate-y-2 transition-transform duration-300">
                <ShieldAlert className="w-10 h-10 text-evalora-warning mb-4" />
                <h3 className="text-xl font-bold mb-2">Multi-Agent Debate</h3>
                <p className="text-evalora-muted">Agents challenge and respond to one another to uncover hidden red flags and validate claims.</p>
              </div>
              <div className="card text-left hover:-translate-y-2 transition-transform duration-300 border-evalora-accent/50 bg-evalora-accent/5">
                <FileText className="w-10 h-10 text-evalora-accent mb-4" />
                <h3 className="text-xl font-bold mb-2">Evidence Traceability</h3>
                <p className="text-evalora-muted">Every important claim and decision is inextricably linked to source evidence from resumes and transcripts.</p>
              </div>
              <div className="card text-left hover:-translate-y-2 transition-transform duration-300">
                <CheckCircle className="w-10 h-10 text-evalora-success mb-4" />
                <h3 className="text-xl font-bold mb-2">Explainable Decisions</h3>
                <p className="text-evalora-muted">Understand exactly why the final recommendation was made, seeing beyond arbitrary numerical scores.</p>
              </div>
            </motion.div>
          </main>
        )}

        {currentView === 'how-it-works' && <HowItWorks onStart={() => setCurrentView('upload')} />}
        {currentView === 'upload' && <Dashboard onUploadComplete={() => setCurrentView('debate')} />}
        {currentView === 'debate' && <DebatePanel onDebateComplete={(finalData) => {
          setReportData(finalData);
          setCurrentView('report');
        }} />}
        {currentView === 'report' && <ReportView reportData={reportData} />}
      </div>
    </div>
  )
}

export default App
