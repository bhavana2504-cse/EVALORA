import { useState } from 'react';
import { FileSignature, ThumbsUp, HelpCircle, FileSearch, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReportView = ({ reportData }: { reportData?: any }) => {
  const [showOverride, setShowOverride] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);
  
  const [overrideDecision, setOverrideDecision] = useState('Hire');
  const [overrideReason, setOverrideReason] = useState('');
  const [simulateScenario, setSimulateScenario] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  const [report, setReport] = useState(() => {
    if (reportData) {
      return {
        candidate_id: "cand_12345",
        overview: {
          name: "Alex Johnson",
          role: "Senior Full Stack Engineer",
          recommendation: reportData.final_recommendation,
          confidence: reportData.confidence
        },
        evidence: reportData.evidence || [],
        debate_summary: reportData.panel_debate,
        final_reasoning: `Strengths:\n- ${reportData.strengths?.join('\n- ')}\n\nConcerns:\n- ${reportData.concerns?.join('\n- ')}\n\nOverall Score: ${reportData.overall_score}`
      };
    }
    return {
      candidate_id: "cand_12345",
      overview: {
        name: "Candidate A",
        role: "Software Engineer",
        recommendation: "Proceed to Interview",
        confidence: 82
      },
      evidence: ["E12", "E17"],
      debate_summary: "Skeptic and Tech debated ML depth; Tech adjusted confidence based on missing metrics.",
      final_reasoning: "Candidate shows strong python skills and meets core requirements. Scalability claims require further probing in the interview."
    };
  });

  const handleOverride = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/bonus/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: report.candidate_id,
          reason: overrideReason,
          override_decision: overrideDecision
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setReport(prev => ({
          ...prev,
          overview: { ...prev.overview, recommendation: overrideDecision },
          final_reasoning: `[HUMAN OVERRIDE] ${overrideReason}\n\nOriginal Reasoning: ${prev.final_reasoning}`
        }));
        setShowOverride(false);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/bonus/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: report.candidate_id,
          scenario: simulateScenario
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setReport(prev => ({
          ...prev,
          overview: { ...prev.overview, recommendation: data.simulated_decision },
          final_reasoning: `[SIMULATED: ${simulateScenario}]\n${data.reason_for_change}\n\nOriginal Reasoning: ${prev.final_reasoning}`
        }));
        setShowSimulate(false);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-evalora-card border border-evalora-border rounded-xl shadow-xl overflow-hidden relative"
      >
        <div className="border-b border-evalora-border p-8 bg-evalora-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{report.overview.name}</h2>
              <p className="text-evalora-muted text-lg">{report.overview.role}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${
                report.overview.recommendation === 'Hire' ? 'bg-evalora-success/10 text-evalora-success border-evalora-success/20' :
                report.overview.recommendation === 'Reject' ? 'bg-evalora-danger/10 text-evalora-danger border-evalora-danger/20' :
                'bg-evalora-accent/10 text-evalora-accent border-evalora-accent/20'
              }`}>
                <ThumbsUp className="w-5 h-5" />
                <span className="font-bold">{report.overview.recommendation}</span>
              </div>
              <p className="text-sm text-evalora-muted mt-3">Overall Confidence: <span className="font-bold text-white">{report.overview.confidence}%</span></p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2 text-evalora-accent">
              <FileSignature className="w-5 h-5" />
              <span>Final Decision Reasoning</span>
            </h3>
            <p className="text-evalora-text leading-relaxed bg-evalora-bg p-4 rounded-lg border border-evalora-border/50 whitespace-pre-wrap">
              {report.final_reasoning}
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2 text-evalora-warning">
              <HelpCircle className="w-5 h-5" />
              <span>Debate Resolution</span>
            </h3>
            <p className="text-evalora-text leading-relaxed bg-evalora-bg p-4 rounded-lg border border-evalora-border/50">
              {report.debate_summary}
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2 text-evalora-muted">
              <FileSearch className="w-5 h-5" />
              <span>Traceable Evidence IDs</span>
            </h3>
            <div className="flex space-x-2">
              {report.evidence.map((e: string) => (
                <span key={e} className="bg-evalora-bg border border-evalora-border px-3 py-1 rounded text-sm text-evalora-muted font-mono hover:text-white cursor-pointer transition">
                  {e}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-evalora-border p-6 bg-evalora-bg/50 flex justify-end space-x-4">
          <button onClick={() => setShowSimulate(true)} className="btn-secondary border-evalora-accent text-evalora-accent hover:bg-evalora-accent/10">Simulate What-If</button>
          <button onClick={() => setShowOverride(true)} className="btn-primary">Override Decision</button>
        </div>

        {/* Override Modal */}
        <AnimatePresence>
          {showOverride && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            >
              <motion.div 
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-evalora-card border border-evalora-border rounded-xl p-6 w-full max-w-md shadow-2xl relative"
              >
                <button onClick={() => setShowOverride(false)} className="absolute top-4 right-4 text-evalora-muted hover:text-white"><X className="w-5 h-5" /></button>
                <h3 className="text-xl font-bold mb-4">Override AI Decision</h3>
                
                <label className="block text-sm text-evalora-muted mb-2">New Decision</label>
                <select 
                  value={overrideDecision} onChange={e => setOverrideDecision(e.target.value)}
                  className="w-full bg-evalora-bg border border-evalora-border rounded-lg px-4 py-2 mb-4 text-white focus:outline-none focus:border-evalora-accent"
                >
                  <option value="Hire">Hire</option>
                  <option value="Reject">Reject</option>
                  <option value="Waitlist">Waitlist</option>
                </select>

                <label className="block text-sm text-evalora-muted mb-2">Human Reasoning</label>
                <textarea 
                  value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                  placeholder="Explain why you are overriding the AI's decision..."
                  className="w-full bg-evalora-bg border border-evalora-border rounded-lg px-4 py-3 h-32 mb-6 text-white focus:outline-none focus:border-evalora-accent resize-none"
                />

                <button onClick={handleOverride} disabled={loading} className="btn-primary w-full flex justify-center items-center">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Override'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simulate Modal */}
        <AnimatePresence>
          {showSimulate && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            >
              <motion.div 
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-evalora-card border border-evalora-border rounded-xl p-6 w-full max-w-md shadow-2xl relative"
              >
                <button onClick={() => setShowSimulate(false)} className="absolute top-4 right-4 text-evalora-muted hover:text-white"><X className="w-5 h-5" /></button>
                <h3 className="text-xl font-bold mb-4">What-If Simulator</h3>
                
                <p className="text-sm text-evalora-muted mb-4">Test hypothetical scenarios to see how the AI panel would react.</p>

                <label className="block text-sm text-evalora-muted mb-2">Scenario Prompt</label>
                <textarea 
                  value={simulateScenario} onChange={e => setSimulateScenario(e.target.value)}
                  placeholder="e.g., What if the candidate actually had 5 years of experience instead of 2?"
                  className="w-full bg-evalora-bg border border-evalora-border rounded-lg px-4 py-3 h-32 mb-6 text-white focus:outline-none focus:border-evalora-accent resize-none"
                />

                <button onClick={handleSimulate} disabled={loading} className="btn-primary w-full flex justify-center items-center">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Simulation'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
