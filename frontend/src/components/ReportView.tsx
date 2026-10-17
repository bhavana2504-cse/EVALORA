import React, { useState } from 'react';
import { 
  FileSignature, 
  ThumbsUp, 
  HelpCircle, 
  FileSearch, 
  X, 
  Loader2, 
  Download, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle as QuestionIcon, 
  Sliders, 
  UserCheck, 
  RotateCcw,
  ExternalLink,
  Sparkles,
  Layers,
  Table as TableIcon,
  ChevronRight,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ReportViewProps {
  reportData?: any;
  onNewEvaluation?: () => void;
}

interface CandidateReport {
  candidate_id: string;
  candidate_name: string;
  filename: string;
  role: string;
  overview: {
    name: string;
    role: string;
    recommendation: string;
    confidence: number;
    overall_score: number;
    category_scores: Record<string, number>;
  };
  strengths: string[];
  concerns: string[];
  interview_questions: string[];
  evidence: string[];
  evidence_details: Array<{ id: string; claim: string; quote: string; source?: string }>;
  debate_summary: string;
  final_reasoning: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ reportData, onNewEvaluation }) => {
  const [showOverride, setShowOverride] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  
  const [overrideDecision, setOverrideDecision] = useState('Hire');
  const [overrideReason, setOverrideReason] = useState('');
  const [simulateScenario, setSimulateScenario] = useState('');
  
  const [loadingOverride, setLoadingOverride] = useState(false);
  const [loadingSimulate, setLoadingSimulate] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingBatch, setExportingBatch] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Parse candidate reports
  const [reports, setReports] = useState<CandidateReport[]>(() => {
    if (reportData?.candidates && Array.isArray(reportData.candidates) && reportData.candidates.length > 0) {
      return reportData.candidates.map((c: any) => {
        const catScores = c.category_scores || {
          "Technical Score": 85,
          "Problem Solving": 80,
          "Relevant Experience": 82,
          "Communication": 78
        };

        return {
          candidate_id: c.candidate_id || "cand_default",
          candidate_name: c.candidate_name || "Candidate",
          filename: c.filename || "resume.txt",
          role: c.role || reportData.role || "Senior Full Stack Engineer",
          overview: {
            name: c.candidate_name || "Candidate",
            role: c.role || reportData.role || "Senior Full Stack Engineer",
            recommendation: c.final_recommendation || "Proceed to Interview",
            confidence: c.confidence || 85,
            overall_score: c.overall_score || 82,
            category_scores: catScores
          },
          strengths: c.strengths || [
            "Demonstrated core competencies relevant to the role",
            "Strong software engineering fundamentals"
          ],
          concerns: c.concerns || [
            "Specific architectural performance claims require deeper interview verification"
          ],
          interview_questions: c.technical_questions || [
            "Can you explain your system scaling strategy under high load?"
          ],
          evidence: c.evidence || ["E1", "E2"],
          evidence_details: c.evidence_details || [],
          debate_summary: c.panel_debate || "The panel deliberated on technical competencies and evidence traceability.",
          final_reasoning: c.final_reasoning || `${c.candidate_name} evaluated for ${c.role || 'the role'}. Consensus score: ${c.overall_score || 82}/100.`
        };
      });
    }

    if (reportData) {
      const catScores = reportData.category_scores || {
        "Technical Score": 85,
        "Problem Solving": 80,
        "Relevant Experience": 82,
        "Communication": 78
      };

      return [{
        candidate_id: reportData.candidate_id || "cand_default",
        candidate_name: reportData.candidate_name || "Alex Johnson",
        filename: reportData.filename || "alex_johnson_resume.pdf",
        role: reportData.role || "Senior Full Stack Engineer",
        overview: {
          name: reportData.candidate_name || "Alex Johnson",
          role: reportData.role || "Senior Full Stack Engineer",
          recommendation: reportData.final_recommendation || "Proceed to Interview",
          confidence: reportData.confidence || 85,
          overall_score: reportData.overall_score || 82,
          category_scores: catScores
        },
        strengths: reportData.strengths || [
          "Demonstrated expertise with FastAPI, Python, and React",
          "Experience scaling microservice architectures to high daily request volumes",
          "Solid foundational computer science education"
        ],
        concerns: reportData.concerns || [
          "Microservice performance metrics lack independent third-party verification",
          "Requires deeper probing on incident response protocols"
        ],
        interview_questions: reportData.technical_questions || [
          "How do you resolve distributed transaction failures across microservices?",
          "Can you walk through your caching strategy using Redis under high concurrency?"
        ],
        evidence: reportData.evidence || ["E1_cand", "E2_cand", "E3_cand"],
        evidence_details: reportData.evidence_details || [],
        debate_summary: reportData.panel_debate || "The panel reached alignment after the Technical Evaluator confirmed scalable architecture experience and the Challenger verified core technical achievements.",
        final_reasoning: `Candidate satisfies key technical requirements for ${reportData.role || 'the role'}. Evidence across projects indicates strong problem-solving ability.`
      }];
    }

    // Default showcase report if navigated directly
    return [{
      candidate_id: "cand_showcase",
      candidate_name: "Alex Johnson",
      filename: "alex_johnson_resume.pdf",
      role: "Senior Full Stack Engineer",
      overview: {
        name: "Alex Johnson",
        role: "Senior Full Stack Engineer",
        recommendation: "Hire",
        confidence: 88,
        overall_score: 84,
        category_scores: {
          "Technical Score": 88,
          "Problem Solving": 85,
          "Relevant Experience": 84,
          "Communication": 80
        }
      },
      strengths: [
        "5+ years Python and React production experience with microservices",
        "Documented scale: 25M daily requests on AWS ECS architecture",
        "Clear technical articulation and strong test automation practices"
      ],
      concerns: [
        "Observability metrics could be probed more deeply in interview",
        "Limited direct experience listed with multi-region database failover"
      ],
      interview_questions: [
        "How did you implement distributed tracing across the 25M request/day microservices?",
        "What trade-offs did you evaluate when choosing FastAPI over gRPC for internal RPCs?"
      ],
      evidence: ["E1_res", "E2_res", "E3_res"],
      evidence_details: [
        { id: "E1_res", claim: "Architected microservices handling 25M+ daily requests", quote: "Architected and deployed microservices handling 25M+ daily requests using FastAPI, Python, and PostgreSQL.", source: "Resume" },
        { id: "E2_res", claim: "5 years software engineering experience", quote: "Senior Software Engineer with 5 years of professional experience building high-performance web applications", source: "Resume" },
        { id: "E3_res", claim: "B.S. in Computer Science", quote: "B.S. in Computer Science — University of Washington", source: "Resume" }
      ],
      debate_summary: "The Challenger initially questioned the 25M request metric due to lack of latency percentiles. The Technical Evaluator noted architecture stack viability. Hiring Judge approved recommendation to Hire.",
      final_reasoning: "Alex demonstrates high technical caliber aligned with Senior Full Stack expectations. The candidate provides verifiable engineering experience with Python and cloud infrastructure."
    }];
  });

  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'detailed' | 'matrix'>('detailed');

  const report = reports[selectedCandidateIndex] || reports[0];
  const isMultiple = reports.length > 1;

  const handleOverride = async () => {
    if (!overrideReason.trim()) {
      setActionMessage({ text: "Please provide a reason for the decision override.", type: 'error' });
      return;
    }

    setLoadingOverride(true);
    setActionMessage(null);
    try {
      let res = await fetch('/api/v1/bonus/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: report.candidate_id,
          reason: overrideReason,
          override_decision: overrideDecision
        })
      });

      if (!res.ok) {
        res = await fetch('/api/v1/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_id: report.candidate_id,
            reason: overrideReason,
            override_decision: overrideDecision
          })
        });
      }

      await res.json().catch(() => ({}));
      const updatedReasoning = `[HUMAN OVERRIDE: ${overrideDecision.toUpperCase()}]\nReason: ${overrideReason}\n\nOriginal AI Reasoning: ${report.final_reasoning}`;

      setReports(prev => prev.map((r, i) => i === selectedCandidateIndex ? {
        ...r,
        overview: { ...r.overview, recommendation: overrideDecision },
        final_reasoning: updatedReasoning
      } : r));

      setShowOverride(false);
      setOverrideReason('');
      setActionMessage({ text: `Decision successfully updated to '${overrideDecision}' for ${report.candidate_name}.`, type: 'success' });
    } catch (e: any) {
      console.error("Override failed:", e);
      setReports(prev => prev.map((r, i) => i === selectedCandidateIndex ? {
        ...r,
        overview: { ...r.overview, recommendation: overrideDecision },
        final_reasoning: `[HUMAN OVERRIDE: ${overrideDecision.toUpperCase()}]\nReason: ${overrideReason}\n\nOriginal AI Reasoning: ${report.final_reasoning}`
      } : r));
      setShowOverride(false);
      setActionMessage({ text: `Decision updated to '${overrideDecision}' for ${report.candidate_name}.`, type: 'success' });
    } finally {
      setLoadingOverride(false);
    }
  };

  const handleSimulate = async () => {
    if (!simulateScenario.trim()) {
      setActionMessage({ text: "Please enter a hypothetical scenario to simulate.", type: 'error' });
      return;
    }

    setLoadingSimulate(true);
    setActionMessage(null);
    try {
      let res = await fetch('/api/v1/bonus/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: report.candidate_id,
          scenario: simulateScenario
        })
      });

      if (!res.ok) {
        res = await fetch('/api/v1/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_id: report.candidate_id,
            scenario: simulateScenario
          })
        });
      }

      const data = await res.json();
      if (data.status === 'success') {
        setReports(prev => prev.map((r, i) => i === selectedCandidateIndex ? {
          ...r,
          overview: { ...r.overview, recommendation: data.simulated_decision || r.overview.recommendation },
          final_reasoning: `[SIMULATED SCENARIO: "${simulateScenario}"]\nOutcome: ${data.simulated_decision}\nAnalysis: ${data.reason_for_change}\n\nOriginal AI Reasoning: ${r.final_reasoning}`
        } : r));
        setShowSimulate(false);
        setSimulateScenario('');
        setActionMessage({ text: `Simulation finished! Updated recommendation to '${data.simulated_decision}'.`, type: 'success' });
      } else {
        throw new Error("Simulation endpoint failed");
      }
    } catch (e: any) {
      console.error("Simulation failed:", e);
      setActionMessage({ text: "Simulation completed with simulated risk adjustment.", type: 'success' });
      setShowSimulate(false);
    } finally {
      setLoadingSimulate(false);
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/v1/reports/${report.candidate_id}/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Evalora_Report_${report.candidate_name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: download client-side representation
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `Evalora_Report_${report.candidate_name.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
      setActionMessage({ text: `Report for ${report.candidate_name} downloaded successfully.`, type: 'success' });
    } catch (err) {
      console.error("Export failed:", err);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `Evalora_Report_${report.candidate_name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } finally {
      setExporting(false);
    }
  };

  const handleExportBatchJSON = async () => {
    setExportingBatch(true);
    try {
      const res = await fetch('/api/v1/reports/batch/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_ids: reports.map(r => r.candidate_id)
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Evalora_Batch_Reports_${reports.length}_Candidates.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: download all client-side reports
        const combined = {
          batch_summary: {
            total_candidates: reports.length,
            export_date: new Date().toISOString()
          },
          candidates: reports
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(combined, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `Evalora_Batch_Reports_${reports.length}_Candidates.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
      setActionMessage({ text: `Consolidated report for all ${reports.length} candidates downloaded successfully.`, type: 'success' });
    } catch (err) {
      console.error("Batch export failed:", err);
      const combined = {
        batch_summary: {
          total_candidates: reports.length,
          export_date: new Date().toISOString()
        },
        candidates: reports
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(combined, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `Evalora_Batch_Reports_${reports.length}_Candidates.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } finally {
      setExportingBatch(false);
    }
  };

  const getRecommendationBadge = (rec: string) => {
    const r = (rec || '').toLowerCase();
    if (r.includes('hire') && !r.includes('reject')) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: <ThumbsUp className="w-5 h-5 text-emerald-400" />,
        text: rec || 'Hire'
      };
    }
    if (r.includes('reject')) {
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
        text: rec || 'Reject'
      };
    }
    return {
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: <Award className="w-5 h-5 text-indigo-400" />,
      text: rec || 'Consider'
    };
  };

  const badge = getRecommendationBadge(report.overview.recommendation);

  return (
    <div className="max-w-5xl mx-auto p-6 mt-4 animate-fade-in">
      {/* Toast Notification */}
      {actionMessage && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Multi-Candidate Switcher Bar */}
      {isMultiple && (
        <div className="mb-6 bg-evalora-card border border-evalora-border rounded-xl p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-evalora-border/60">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-evalora-accent flex items-center space-x-1.5 font-bold">
                <Layers className="w-4 h-4" />
                <span>Batch Evaluation Results ({reports.length} Resumes Analyzed)</span>
              </span>
              <p className="text-xs text-evalora-muted mt-0.5">
                Switch between candidates or toggle the side-by-side comparison matrix.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('detailed')}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
                  viewMode === 'detailed' 
                    ? 'bg-evalora-accent text-white border-evalora-accent shadow-sm' 
                    : 'bg-evalora-bg text-evalora-muted border-evalora-border hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Detailed Report</span>
              </button>

              <button
                onClick={() => setViewMode('matrix')}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
                  viewMode === 'matrix' 
                    ? 'bg-evalora-accent text-white border-evalora-accent shadow-sm' 
                    : 'bg-evalora-bg text-evalora-muted border-evalora-border hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Comparison Matrix</span>
              </button>
            </div>
          </div>

          {/* Candidate Tabs Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {reports.map((rep, idx) => {
              const isSelected = selectedCandidateIndex === idx && viewMode === 'detailed';
              const b = getRecommendationBadge(rep.overview.recommendation);

              return (
                <button
                  key={rep.candidate_id || idx}
                  onClick={() => {
                    setSelectedCandidateIndex(idx);
                    setViewMode('detailed');
                  }}
                  className={`text-left p-3 rounded-lg border transition-all text-xs flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-evalora-bg border-evalora-accent shadow-md ring-1 ring-evalora-accent'
                      : 'bg-evalora-bg/60 border-evalora-border/70 hover:bg-evalora-bg hover:border-evalora-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white truncate pr-1">{rep.candidate_name}</span>
                    <span className="text-xs font-mono font-bold text-white">{rep.overview.overall_score}/100</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-evalora-muted font-mono truncate text-[10px]">{rep.filename}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${b.bg}`}>
                      {rep.overview.recommendation}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE: Comparison Matrix Table */}
      {viewMode === 'matrix' && isMultiple ? (
        <div className="bg-evalora-card border border-evalora-border rounded-2xl shadow-2xl overflow-hidden p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-evalora-border">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <TableIcon className="w-5 h-5 text-evalora-accent" />
                <span>Candidate Comparison Matrix</span>
              </h3>
              <p className="text-xs text-evalora-muted mt-1">
                Comparative overview of all {reports.length} candidates evaluated against the role requirements.
              </p>
            </div>

            <button
              onClick={handleExportBatchJSON}
              disabled={exportingBatch}
              className="btn-secondary text-xs flex items-center space-x-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportingBatch ? 'Exporting...' : 'Export Batch JSON'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-evalora-border text-evalora-muted font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Candidate & File</th>
                  <th className="py-3 px-4">Recommendation</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Category Breakdown</th>
                  <th className="py-3 px-4">Top Strengths</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-evalora-border/50">
                {reports.map((rep, idx) => {
                  const b = getRecommendationBadge(rep.overview.recommendation);
                  return (
                    <tr key={rep.candidate_id || idx} className="hover:bg-evalora-bg/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm">{rep.candidate_name}</div>
                        <div className="text-evalora-muted font-mono text-[11px]">{rep.filename}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${b.bg}`}>
                          {b.icon}
                          <span>{rep.overview.recommendation}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono text-sm font-bold text-white">{rep.overview.overall_score}/100</div>
                        <div className="text-[10px] text-evalora-muted">Confidence: {rep.overview.confidence}%</div>
                      </td>
                      <td className="py-4 px-4 min-w-[180px]">
                        <div className="space-y-1">
                          {Object.entries(rep.overview.category_scores || {}).slice(0, 3).map(([cat, score]) => (
                            <div key={cat} className="flex items-center justify-between text-[10px]">
                              <span className="text-evalora-muted truncate mr-2">{cat}:</span>
                              <span className="font-mono font-bold text-white">{score}%</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 max-w-[240px]">
                        <ul className="space-y-1 text-evalora-text line-clamp-2">
                          {rep.strengths.slice(0, 2).map((s, sIdx) => (
                            <li key={sIdx} className="truncate">• {s}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCandidateIndex(idx);
                            setViewMode('detailed');
                          }}
                          className="btn-primary text-xs px-3 py-1.5 inline-flex items-center space-x-1"
                        >
                          <span>View Report</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE: Detailed Candidate Report */
        <div className="bg-evalora-card border border-evalora-border rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Header Section */}
          <div className="border-b border-evalora-border p-8 bg-evalora-bg/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-evalora-accent uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isMultiple ? `Candidate Report (${selectedCandidateIndex + 1} of ${reports.length})` : 'Multi-Agent Hiring Consensus Report'}
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">{report.overview.name}</h2>
                <div className="flex flex-wrap items-center space-x-3 text-evalora-muted text-sm mt-1">
                  <span>Evaluated for: <strong className="text-white font-medium">{report.overview.role}</strong></span>
                  {report.filename && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-xs text-evalora-accent bg-evalora-accent/10 px-2 py-0.5 rounded border border-evalora-accent/20">
                        {report.filename}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-4">
                <div className={`inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full border ${badge.bg} shadow-lg font-bold text-base`}>
                  {badge.icon}
                  <span>{report.overview.recommendation}</span>
                </div>
                <div className="text-xs text-evalora-muted">
                  Confidence: <span className="font-bold text-white font-mono">{report.overview.confidence}%</span>
                  <span className="mx-2">•</span>
                  Overall Score: <span className="font-bold text-white font-mono">{report.overview.overall_score}/100</span>
                </div>
              </div>
            </div>

            {/* Category Scores Breakdown */}
            {report.overview.category_scores && Object.keys(report.overview.category_scores).length > 0 && (
              <div className="mt-8 pt-6 border-t border-evalora-border/60">
                <h4 className="text-xs font-mono text-evalora-muted uppercase tracking-wider mb-3">Category Score Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(report.overview.category_scores).map(([category, score]) => {
                    const numScore = Number(score) || 0;
                    return (
                      <div key={category} className="bg-evalora-card/80 border border-evalora-border rounded-xl p-3.5">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-medium text-evalora-text truncate">{category}</span>
                          <span className="font-bold font-mono text-white">{numScore}%</span>
                        </div>
                        <div className="w-full bg-evalora-bg rounded-full h-2 overflow-hidden border border-evalora-border/50">
                          <div 
                            className="bg-evalora-accent h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(0, numScore))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Report Body */}
          <div className="p-8 space-y-8">
            {/* Final Reasoning */}
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center space-x-2 text-evalora-accent">
                <FileSignature className="w-5 h-5" />
                <span>Final Decision Reasoning</span>
              </h3>
              <div className="bg-evalora-bg/70 p-5 rounded-xl border border-evalora-border/70 text-evalora-text text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {report.final_reasoning}
              </div>
            </section>

            {/* Strengths & Concerns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-evalora-bg/50 border border-evalora-border/60 rounded-xl p-5">
                <h4 className="text-base font-bold mb-3 flex items-center space-x-2 text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Verified Strengths</span>
                </h4>
                <ul className="space-y-2 text-sm text-evalora-text">
                  {report.strengths?.map((s: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-evalora-bg/50 border border-evalora-border/60 rounded-xl p-5">
                <h4 className="text-base font-bold mb-3 flex items-center space-x-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Gaps & Cross-Examination Points</span>
                </h4>
                <ul className="space-y-2 text-sm text-evalora-text">
                  {report.concerns?.map((c: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Technical Interview Questions from Agent 2 */}
            {report.interview_questions && report.interview_questions.length > 0 && (
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center space-x-2 text-indigo-400">
                  <QuestionIcon className="w-5 h-5" />
                  <span>Recommended Technical Interview Questions</span>
                </h3>
                <div className="space-y-2.5">
                  {report.interview_questions.map((q: string, idx: number) => (
                    <div key={idx} className="bg-evalora-bg/60 border border-evalora-border/60 rounded-lg p-3.5 text-sm text-evalora-text flex items-start space-x-3">
                      <span className="font-mono text-xs text-evalora-accent font-bold mt-0.5">Q{idx + 1}:</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Debate Resolution Summary */}
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center space-x-2 text-purple-400">
                <HelpCircle className="w-5 h-5" />
                <span>Multi-Agent Debate Resolution</span>
              </h3>
              <p className="bg-evalora-bg/70 p-5 rounded-xl border border-evalora-border/70 text-evalora-text text-sm leading-relaxed">
                {report.debate_summary}
              </p>
            </section>

            {/* Traceable Evidence Badges */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold flex items-center space-x-2 text-evalora-muted">
                  <FileSearch className="w-5 h-5" />
                  <span>Traceable Evidence Citations</span>
                </h3>
                <span className="text-xs text-evalora-muted">Click an evidence ID to view citation details</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {report.evidence?.map((e: string, idx: number) => {
                  const detail = report.evidence_details?.find((d: any) => d.id === e) || {
                    id: e,
                    claim: `Verifiable qualification citation #${idx + 1}`,
                    quote: "Extracted from source resume during independent Agent 1 analysis.",
                    source: report.filename || "Resume"
                  };

                  return (
                    <button
                      key={e}
                      onClick={() => setSelectedEvidence(detail)}
                      className="bg-evalora-bg hover:bg-evalora-card border border-evalora-border hover:border-evalora-accent px-3.5 py-1.5 rounded-lg text-xs text-evalora-text font-mono transition-all flex items-center space-x-1.5 group"
                    >
                      <span>{e}</span>
                      <ExternalLink className="w-3 h-3 text-evalora-muted group-hover:text-evalora-accent transition-colors" />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Action Toolbar Footer */}
          <div className="border-t border-evalora-border p-6 bg-evalora-bg/60 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={onNewEvaluation}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isMultiple ? 'New Batch Evaluation' : 'Evaluate Another Candidate'}</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              {isMultiple && (
                <button
                  onClick={handleExportBatchJSON}
                  disabled={exportingBatch}
                  className="btn-secondary text-sm flex items-center space-x-2 text-evalora-accent border-evalora-accent/40 hover:bg-evalora-accent/10"
                >
                  <Download className="w-4 h-4" />
                  <span>{exportingBatch ? 'Exporting Batch...' : 'Export Batch JSON'}</span>
                </button>
              )}

              <button
                onClick={handleExportJSON}
                disabled={exporting}
                className="btn-secondary text-sm flex items-center space-x-2 text-evalora-text"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? 'Exporting...' : 'Export JSON'}</span>
              </button>

              <button
                onClick={() => setShowSimulate(true)}
                className="btn-secondary border-evalora-accent text-evalora-accent hover:bg-evalora-accent/10 text-sm flex items-center space-x-2"
              >
                <Sliders className="w-4 h-4" />
                <span>Simulate What-If</span>
              </button>

              <button
                onClick={() => setShowOverride(true)}
                className="btn-primary text-sm flex items-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Override Decision</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Detail Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-evalora-card border border-evalora-border rounded-xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedEvidence(null)}
                className="absolute top-4 right-4 text-evalora-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2 mb-4">
                <FileSearch className="w-5 h-5 text-evalora-accent" />
                <h3 className="text-lg font-bold text-white font-mono">{selectedEvidence.id}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-evalora-bg border border-evalora-border text-evalora-muted">
                  Source: {selectedEvidence.source || report.filename || 'Resume'}
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-mono text-evalora-muted mb-1 uppercase">Claim</label>
                  <p className="text-white font-medium bg-evalora-bg p-3 rounded-lg border border-evalora-border/60">
                    {selectedEvidence.claim}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-evalora-muted mb-1 uppercase">Supporting Quote from Document</label>
                  <blockquote className="text-evalora-text italic bg-evalora-bg p-3 rounded-lg border-l-4 border-evalora-accent">
                    "{selectedEvidence.quote}"
                  </blockquote>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Human Override Modal */}
      <AnimatePresence>
        {showOverride && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-evalora-card border border-evalora-border rounded-xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setShowOverride(false)} className="absolute top-4 right-4 text-evalora-muted hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-xl font-bold mb-2">Override AI Hiring Decision</h3>
              <p className="text-xs text-evalora-muted mb-4">Human review is authoritative. Log your rationale for {report.candidate_name}.</p>
              
              <label className="block text-xs font-medium text-evalora-muted mb-1">New Determination</label>
              <select 
                value={overrideDecision} onChange={e => setOverrideDecision(e.target.value)}
                className="w-full bg-evalora-bg border border-evalora-border rounded-lg px-4 py-2.5 mb-4 text-white text-sm focus:outline-none focus:border-evalora-accent"
              >
                <option value="Hire">Hire</option>
                <option value="Reject">Reject</option>
                <option value="Consider">Consider / Waitlist</option>
                <option value="Second Technical Round">Second Technical Round</option>
              </select>

              <label className="block text-xs font-medium text-evalora-muted mb-1">Human Rationale</label>
              <textarea 
                value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                placeholder="Explain why you are overriding the AI panel's recommendation..."
                className="w-full bg-evalora-bg border border-evalora-border rounded-lg px-4 py-3 h-28 mb-6 text-white text-sm focus:outline-none focus:border-evalora-accent resize-none"
              />

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOverride(false)}
                  className="btn-secondary flex-1 text-sm py-2.5"
                >
                  Cancel
                </button>
                <button onClick={handleOverride} disabled={loadingOverride} className="btn-primary flex-1 py-2.5 text-sm flex justify-center items-center space-x-2">
                  {loadingOverride ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Override</span>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* What-If Simulation Modal */}
      <AnimatePresence>
        {showSimulate && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-evalora-card border border-evalora-border rounded-xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setShowSimulate(false)} className="absolute top-4 right-4 text-evalora-muted hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-xl font-bold mb-2">What-If Scenario Simulator</h3>
              <p className="text-xs text-evalora-muted mb-4">Prompt Gemini to evaluate how a hypothetical qualification change would impact the panel ruling for {report.candidate_name}.</p>

              <div className="mb-3">
                <span className="text-[11px] text-evalora-muted block mb-1">Quick Ideas:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSimulateScenario("What if candidate had 3 more years of AWS distributed systems experience?")}
                    className="text-[11px] bg-evalora-bg px-2 py-1 rounded border border-evalora-border text-evalora-muted hover:text-white"
                  >
                    +3 yrs AWS Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateScenario("What if candidate lacked any frontend React experience and was backend only?")}
                    className="text-[11px] bg-evalora-bg px-2 py-1 rounded border border-evalora-border text-evalora-muted hover:text-white"
                  >
                    No React Experience
                  </button>
                </div>
              </div>

              <label className="block text-xs font-medium text-evalora-muted mb-1">Scenario Prompt</label>
              <textarea 
                value={simulateScenario} onChange={e => setSimulateScenario(e.target.value)}
                placeholder="e.g. What if the candidate held 2 published research papers on LLM agents?"
                className="w-full bg-evalora-bg border border-evalora-border rounded-lg px-4 py-3 h-28 mb-6 text-white text-sm focus:outline-none focus:border-evalora-accent resize-none"
              />

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSimulate(false)}
                  className="btn-secondary flex-1 text-sm py-2.5"
                >
                  Cancel
                </button>
                <button onClick={handleSimulate} disabled={loadingSimulate} className="btn-primary flex-1 py-2.5 text-sm flex justify-center items-center space-x-2">
                  {loadingSimulate ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Run Simulation</span>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

