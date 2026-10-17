import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Bot, 
  UserSearch, 
  AlertCircle, 
  ShieldCheck, 
  ChevronRight, 
  RefreshCw, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CandidateItem } from './Dashboard';

export interface DebatePanelProps {
  candidates?: CandidateItem[];
  resumeText?: string;
  jobDescription?: string;
  candidateName?: string;
  candidateId?: string;
  role?: string;
  onDebateComplete: (data: any) => void;
}

interface DebateLogItem {
  agent: string;
  role: string;
  message: string;
  type: 'analysis' | 'technical' | 'challenge' | 'decision' | 'system';
  timestamp: string;
}

interface CandidateEvaluationState {
  id: string;
  name: string;
  filename: string;
  resume_text: string;
  status: 'pending' | 'evaluating' | 'completed' | 'error';
  currentStep: number;
  error: string | null;
  agent1Out: any | null;
  agent2Out: any | null;
  agent3Out: any | null;
  agent4Out: any | null;
  debateLogs: DebateLogItem[];
}

export const DebatePanel: React.FC<DebatePanelProps> = ({
  candidates: propCandidates,
  resumeText: propResumeText,
  jobDescription: propJobDescription,
  candidateName = "Alex Johnson",
  candidateId = "cand_default",
  role = "Senior Full Stack Engineer",
  onDebateComplete
}) => {
  const job_description = propJobDescription || `Senior Full Stack Engineer (4+ years experience). Must have strong Python, React, and distributed systems expertise.`;

  // Initialize candidates list
  const [candidatesState, setCandidatesState] = useState<CandidateEvaluationState[]>(() => {
    if (propCandidates && propCandidates.length > 0) {
      return propCandidates.map(c => ({
        id: c.candidateId,
        name: c.candidateName,
        filename: c.filename || `${c.candidateName.toLowerCase().replace(/\s+/g, '_')}_resume.txt`,
        resume_text: c.resumeText,
        status: 'pending',
        currentStep: 1,
        error: null,
        agent1Out: null,
        agent2Out: null,
        agent3Out: null,
        agent4Out: null,
        debateLogs: []
      }));
    }
    return [{
      id: candidateId,
      name: candidateName,
      filename: 'resume.txt',
      resume_text: propResumeText || `Alex Johnson\nSenior Software Engineer with 5 years experience in Python, FastAPI, React, and cloud architectures.\nBuilt high-throughput distributed microservices handling 25M daily requests. Deployed on AWS ECS with Docker.\nEducation: B.S. in Computer Science.`,
      status: 'pending',
      currentStep: 1,
      error: null,
      agent1Out: null,
      agent2Out: null,
      agent3Out: null,
      agent4Out: null,
      debateLogs: []
    }];
  });

  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0);
  const [userSelectedTab, setUserSelectedTab] = useState(false);
  const [isOverallFinished, setIsOverallFinished] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const isRunningRef = useRef(false);

  const activeCandidate = candidatesState[activeCandidateIndex] || candidatesState[0];

  const agents = [
    { 
      name: 'Resume Analyst', 
      label: 'Agent 1',
      role: 'Skill & Evidence Extraction',
      icon: <Bot className="w-5 h-5" />, 
      color: 'text-blue-400',
      borderColor: 'border-blue-500/40',
      badgeBg: 'bg-blue-500/10 text-blue-400'
    },
    { 
      name: 'Technical Evaluator', 
      label: 'Agent 2',
      role: 'Deep Technical & Arch Probe',
      icon: <UserSearch className="w-5 h-5" />, 
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-500/10 text-emerald-400'
    },
    { 
      name: 'Challenger', 
      label: 'Agent 3',
      role: 'Skeptical Cross-Examiner',
      icon: <AlertCircle className="w-5 h-5" />, 
      color: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/10 text-amber-400'
    },
    { 
      name: 'Hiring Judge', 
      label: 'Agent 4',
      role: 'Transparent Synthesis & Ruling',
      icon: <ShieldCheck className="w-5 h-5" />, 
      color: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      badgeBg: 'bg-purple-500/10 text-purple-400'
    }
  ];

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeCandidate?.debateLogs]);

  const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Evaluate a specific candidate by index
  const evaluateCandidate = async (index: number): Promise<boolean> => {
    const candidate = candidatesState[index];
    if (!candidate) return false;

    // Set evaluating status
    setCandidatesState(prev => prev.map((c, i) => i === index ? {
      ...c,
      status: 'evaluating',
      currentStep: 1,
      error: null,
      debateLogs: [
        {
          agent: 'Evalora Orchestrator',
          role: 'System',
          message: `Initiating multi-agent consensus evaluation for ${candidate.name} (${candidate.filename}).`,
          type: 'system',
          timestamp: getTime()
        }
      ]
    } : c));

    try {
      // Step 1: Agent 1 — Resume Analyst
      const res1 = await fetch('https://evalora-oxg9.vercel.app/api/v1/pipeline/agent1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: candidate.resume_text,
          job_description,
          candidate_id: candidate.id,
          candidate_name: candidate.name
        })
      });
      if (!res1.ok) {
        const err = await res1.json().catch(() => ({}));
        throw new Error(`Agent 1 failed (${res1.status}): ${err.detail || 'Resume analysis error'}`);
      }
      const data1 = await res1.json();
      const a1Data = data1.data;

      setCandidatesState(prev => prev.map((c, i) => i === index ? {
        ...c,
        agent1Out: a1Data,
        currentStep: 2,
        debateLogs: [
          ...c.debateLogs,
          {
            agent: 'Resume Analyst',
            role: 'Extraction',
            message: a1Data.summary || `Extracted ${a1Data.strengths?.length || 0} core strengths and identified ${a1Data.gaps?.length || 0} missing criteria against requirements.`,
            type: 'analysis',
            timestamp: getTime()
          }
        ]
      } : c));

      // Step 2: Agent 2 — Technical Evaluator
      const res2 = await fetch('https://evalora-oxg9.vercel.app/api/v1/pipeline/agent2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: candidate.resume_text,
          job_description,
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          agent1_output: a1Data
        })
      });
      if (!res2.ok) {
        const err = await res2.json().catch(() => ({}));
        throw new Error(`Agent 2 failed (${res2.status}): ${err.detail || 'Technical evaluation error'}`);
      }
      const data2 = await res2.json();
      const a2Data = data2.data;

      setCandidatesState(prev => prev.map((c, i) => i === index ? {
        ...c,
        agent2Out: a2Data,
        currentStep: 3,
        debateLogs: [
          ...c.debateLogs,
          {
            agent: 'Technical Evaluator',
            role: 'Evaluation',
            message: a2Data.summary || `Assessed technical depth. Formulated ${a2Data.questions?.length || 0} targeted architecture questions.`,
            type: 'technical',
            timestamp: getTime()
          }
        ]
      } : c));

      // Step 3: Agent 3 — Challenger
      const res3 = await fetch('https://evalora-oxg9.vercel.app/api/v1/pipeline/agent3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: candidate.resume_text,
          job_description,
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          agent1_output: a1Data,
          agent2_output: a2Data
        })
      });
      if (!res3.ok) {
        const err = await res3.json().catch(() => ({}));
        throw new Error(`Agent 3 failed (${res3.status}): ${err.detail || 'Debate challenger error'}`);
      }
      const data3 = await res3.json();
      const a3Data = data3.data;

      const challenges = a3Data.challenges || [];
      const newLogs: DebateLogItem[] = [];
      if (challenges.length > 0) {
        challenges.forEach((ch: any) => {
          newLogs.push({
            agent: 'Challenger',
            role: 'Challenge',
            message: `Challenge on '${ch.claim}': ${ch.reason}`,
            type: 'challenge',
            timestamp: getTime()
          });
        });
      } else {
        newLogs.push({
          agent: 'Challenger',
          role: 'Challenge',
          message: a3Data.debate_summary || "Scrutinized candidate claims for unverifiable metrics and exaggerations.",
          type: 'challenge',
          timestamp: getTime()
        });
      }

      setCandidatesState(prev => prev.map((c, i) => i === index ? {
        ...c,
        agent3Out: a3Data,
        currentStep: 4,
        debateLogs: [...c.debateLogs, ...newLogs]
      } : c));

      // Step 4: Agent 4 — Hiring Judge
      const res4 = await fetch('https://evalora-oxg9.vercel.app/api/v1/pipeline/agent4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: candidate.resume_text,
          job_description,
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          agent1_output: a1Data,
          agent2_output: a2Data,
          agent3_output: a3Data
        })
      });
      if (!res4.ok) {
        const err = await res4.json().catch(() => ({}));
        throw new Error(`Agent 4 failed (${res4.status}): ${err.detail || 'Final judge synthesis error'}`);
      }
      const data4 = await res4.json();
      const a4Data = data4.data;

      setCandidatesState(prev => prev.map((c, i) => i === index ? {
        ...c,
        agent4Out: a4Data,
        status: 'completed',
        debateLogs: [
          ...c.debateLogs,
          {
            agent: 'Hiring Judge',
            role: 'Consensus',
            message: `Verdict: ${a4Data.final_recommendation} (Confidence: ${a4Data.confidence}%). Overall Score: ${a4Data.overall_score}/100. ${a4Data.panel_debate || ''}`,
            type: 'decision',
            timestamp: getTime()
          }
        ]
      } : c));

      return true;
    } catch (err: any) {
      console.error(`Evaluation failed for candidate ${candidate.name}:`, err);
      setCandidatesState(prev => prev.map((c, i) => i === index ? {
        ...c,
        status: 'error',
        error: err.message || 'An unexpected error occurred during evaluation.',
        debateLogs: [
          ...c.debateLogs,
          {
            agent: 'Evalora Orchestrator',
            role: 'System',
            message: `Evaluation halted with error: ${err.message || 'Pipeline execution failed'}`,
            type: 'system',
            timestamp: getTime()
          }
        ]
      } : c));
      return false;
    }
  };

  // Run all candidates sequentially
  const runBatchPipeline = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsOverallFinished(false);

    for (let i = 0; i < candidatesState.length; i++) {
      // Auto-switch to current candidate unless user explicitly chose a tab
      setActiveCandidateIndex(prev => {
        if (!userSelectedTab) return i;
        return prev;
      });

      await evaluateCandidate(i);
    }

    setIsOverallFinished(true);
    isRunningRef.current = false;
  }, [candidatesState.length, job_description, userSelectedTab]);

  useEffect(() => {
    runBatchPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetryCandidate = async (index: number) => {
    setIsRetrying(true);
    await evaluateCandidate(index);
    setIsRetrying(false);
  };

  const handleProceedToReport = () => {
    // Collect all candidate evaluation data
    const evaluatedResults = candidatesState.map(c => {
      const a1 = c.agent1Out || {};
      const a2 = c.agent2Out || {};
      const a3 = c.agent3Out || {};
      const a4 = c.agent4Out || {};

      return {
        candidate_id: c.id,
        candidate_name: c.name,
        filename: c.filename,
        role: role,
        final_recommendation: a4.final_recommendation || (c.status === 'completed' ? 'Proceed to Interview' : 'Pending Review'),
        overall_score: a4.overall_score || 75,
        confidence: a4.confidence || 80,
        category_scores: a4.category_scores || {
          "Technical Score": 80,
          "Problem Solving": 80,
          "Relevant Experience": 80,
          "Communication": 80
        },
        strengths: a4.strengths || a1.strengths || ["Core engineering qualifications demonstrated"],
        concerns: a4.concerns || a1.gaps || ["Specific performance claims warrant interview probing"],
        technical_questions: a2.questions || [],
        evidence: a4.evidence || [],
        evidence_details: a1.evidence || [],
        panel_debate: a4.panel_debate || "The 4-agent panel deliberated on candidate evidence.",
        final_reasoning: a4.final_reasoning || `${c.name} evaluated for ${role}. Overall score: ${a4.overall_score || 75}/100.`,
        agent1: a1,
        agent2: a2,
        agent3: a3,
        agent4: a4,
        status: c.status,
        error: c.error
      };
    });

    // Selected or first candidate
    const primaryCandidate = evaluatedResults[activeCandidateIndex] || evaluatedResults[0];

    const finalPayload = {
      ...primaryCandidate,
      total_candidates: evaluatedResults.length,
      candidates: evaluatedResults
    };

    onDebateComplete(finalPayload);
  };

  const completedCount = candidatesState.filter(c => c.status === 'completed').length;
  const isMultiple = candidatesState.length > 1;

  return (
    <div className="max-w-5xl mx-auto p-6 mt-4 animate-fade-in">
      {/* Top Banner / Progress Header */}
      <div className="bg-evalora-card border border-evalora-border rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-evalora-accent uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>
              {isMultiple ? `Batch AI Evaluation Session (${candidatesState.length} Resumes)` : 'Active Evaluation Session'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {isMultiple ? `Evaluating: ${activeCandidate?.name}` : activeCandidate?.name}
          </h2>
          <p className="text-xs text-evalora-muted flex items-center space-x-2 mt-0.5">
            <span>Evaluating for: <span className="text-white font-medium">{role}</span></span>
            {activeCandidate?.filename && (
              <>
                <span>•</span>
                <span className="font-mono text-evalora-accent/90">{activeCandidate.filename}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right text-xs">
            <div className="text-evalora-muted">
              {isMultiple ? (
                <span>Progress: <strong className="text-white font-mono">{completedCount}/{candidatesState.length}</strong> Completed</span>
              ) : (
                <span>Status: </span>
              )}
            </div>
            <div className={`font-semibold ${
              isOverallFinished 
                ? 'text-evalora-success' 
                : activeCandidate?.status === 'error' 
                ? 'text-evalora-danger' 
                : 'text-evalora-accent animate-pulse'
            }`}>
              {isOverallFinished 
                ? 'All Evaluations Complete' 
                : activeCandidate?.status === 'error'
                ? 'Evaluation Interrupted'
                : `Agent ${activeCandidate?.currentStep || 1} Active...`}
            </div>
          </div>

          {(isOverallFinished || completedCount > 0) && (
            <button
              onClick={handleProceedToReport}
              className="btn-primary flex items-center space-x-2 text-sm px-4 py-2"
            >
              <span>{isMultiple ? `View Reports (${completedCount})` : 'View Full Report'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Candidate Switcher Tabs */}
      {isMultiple && (
        <div className="mb-6 bg-evalora-bg/80 border border-evalora-border rounded-xl p-2.5">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-evalora-border/60">
            <span className="text-xs font-mono uppercase tracking-wider text-evalora-muted flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-evalora-accent" />
              <span>Uploaded Candidates ({candidatesState.length})</span>
            </span>
            <span className="text-[11px] text-evalora-muted">
              Click candidate tab to view live logs & perspective
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {candidatesState.map((cand, idx) => {
              const isSelected = activeCandidateIndex === idx;
              const isEvaluating = cand.status === 'evaluating';
              const isDone = cand.status === 'completed';
              const isErr = cand.status === 'error';

              return (
                <button
                  key={cand.id || idx}
                  onClick={() => {
                    setActiveCandidateIndex(idx);
                    setUserSelectedTab(true);
                  }}
                  className={`text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'bg-evalora-card border-evalora-accent shadow-md shadow-indigo-500/10 ring-1 ring-evalora-accent'
                      : 'bg-evalora-card/40 border-evalora-border/60 hover:bg-evalora-card/80 hover:border-evalora-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white truncate pr-2">{cand.name}</span>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-evalora-success flex-shrink-0" />}
                    {isEvaluating && <span className="w-2 h-2 rounded-full bg-evalora-accent animate-ping flex-shrink-0" />}
                    {isErr && <AlertTriangle className="w-3.5 h-3.5 text-evalora-danger flex-shrink-0" />}
                    {cand.status === 'pending' && <Clock className="w-3.5 h-3.5 text-evalora-muted flex-shrink-0" />}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-evalora-muted">
                    <span className="truncate font-mono text-[10px] opacity-80">{cand.filename}</span>
                    <span className={`font-mono text-[10px] font-medium ml-1 ${
                      isDone 
                        ? 'text-evalora-success' 
                        : isEvaluating 
                        ? 'text-evalora-accent' 
                        : isErr 
                        ? 'text-evalora-danger' 
                        : 'text-evalora-muted'
                    }`}>
                      {isDone 
                        ? `${cand.agent4Out?.overall_score || 75}/100` 
                        : isEvaluating 
                        ? `Agent ${cand.currentStep}` 
                        : isErr 
                        ? 'Error' 
                        : 'Queued'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Banner with Retry */}
      {activeCandidate?.status === 'error' && (
        <div className="mb-6 p-4 rounded-xl bg-evalora-danger/10 border border-evalora-danger/30 text-evalora-danger flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Evaluation Encountered An Issue for {activeCandidate.name}</p>
              <p className="text-xs text-evalora-muted mt-0.5">{activeCandidate.error || 'Server error'}</p>
            </div>
          </div>
          <button
            onClick={() => handleRetryCandidate(activeCandidateIndex)}
            disabled={isRetrying}
            className="btn-secondary text-xs flex items-center justify-center space-x-2 px-3 py-1.5 self-end sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Retry Candidate</span>
          </button>
        </div>
      )}

      {/* 4 Agent Cards Grid for Active Candidate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {agents.map((a, idx) => {
          const step = idx + 1;
          const isActive = activeCandidate?.status === 'evaluating' && activeCandidate?.currentStep === step;
          const isDone = (activeCandidate?.currentStep > step) || activeCandidate?.status === 'completed';

          let statusSnippet = 'Waiting in queue...';
          if (isActive) statusSnippet = 'Reviewing documents...';
          else if (step === 1 && activeCandidate?.agent1Out) statusSnippet = `Identified ${activeCandidate.agent1Out.strengths?.length || 0} strengths, ${activeCandidate.agent1Out.gaps?.length || 0} gaps.`;
          else if (step === 2 && activeCandidate?.agent2Out) statusSnippet = `Technical Depth: ${activeCandidate.agent2Out.technical_depth || 'Evaluated'}.`;
          else if (step === 3 && activeCandidate?.agent3Out) statusSnippet = `Raised ${activeCandidate.agent3Out.challenges?.length || 0} critical challenges.`;
          else if (step === 4 && activeCandidate?.agent4Out) statusSnippet = `Verdict: ${activeCandidate.agent4Out.final_recommendation} (${activeCandidate.agent4Out.overall_score}/100)`;

          return (
            <div
              key={a.name}
              className={`bg-evalora-card border rounded-xl p-4 flex flex-col transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'border-evalora-accent shadow-lg shadow-indigo-500/20 ring-1 ring-evalora-accent'
                  : isDone
                  ? 'border-evalora-border hover:border-evalora-border/80'
                  : 'border-evalora-border/50 opacity-60'
              }`}
            >
              {isDone && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-4 h-4 text-evalora-success" />
                </div>
              )}

              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2.5 rounded-lg bg-evalora-bg ${a.color} border border-evalora-border`}>
                  {a.icon}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-evalora-muted uppercase tracking-wider">{a.label}</span>
                  <h3 className="font-bold text-sm text-white leading-tight">{a.name}</h3>
                </div>
              </div>

              <div className="text-[11px] text-evalora-muted line-clamp-1 mb-2 font-mono">
                {a.role}
              </div>

              <div className="mt-auto pt-3 border-t border-evalora-border/50 text-xs text-evalora-text min-h-[48px] flex items-center">
                {isActive ? (
                  <div className="flex items-center space-x-2 text-evalora-accent animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-evalora-accent animate-ping" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <span className="leading-snug">{statusSnippet}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Debate & Analysis Stream */}
      <div className="bg-evalora-card border border-evalora-border rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-evalora-border">
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              activeCandidate?.status === 'completed' 
                ? 'bg-evalora-success' 
                : activeCandidate?.status === 'error'
                ? 'bg-evalora-danger'
                : 'bg-evalora-accent animate-pulse'
            }`} />
            <h3 className="font-bold text-base text-white">
              {activeCandidate?.status === 'completed'
                ? `Consensus Record: ${activeCandidate.name}`
                : activeCandidate?.currentStep <= 2 
                ? `Phase 1: Document Inspection — ${activeCandidate?.name}`
                : `Phase 2: Live Multi-Agent Debate — ${activeCandidate?.name}`}
            </h3>
          </div>
          <span className="text-xs text-evalora-muted font-mono">{activeCandidate?.debateLogs?.length || 0} updates logged</span>
        </div>

        <div className="h-[360px] overflow-y-auto space-y-4 pr-2 font-mono text-xs">
          <AnimatePresence>
            {activeCandidate?.debateLogs?.map((log, idx) => {
              const agentConfig = agents.find(a => a.name === log.agent);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-evalora-bg/80 border border-evalora-border/70 rounded-lg p-3.5 flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${agentConfig?.color || 'text-evalora-accent'}`}>
                        [{log.agent}]
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans uppercase font-medium ${agentConfig?.badgeBg || 'bg-white/10 text-white'}`}>
                        {log.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-evalora-muted">{log.timestamp}</span>
                  </div>
                  <p className="text-evalora-text leading-relaxed whitespace-pre-wrap pl-1 font-sans text-sm">
                    {log.message}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {activeCandidate?.status === 'evaluating' && (
            <div className="flex items-center space-x-3 text-evalora-muted py-4 px-2">
              <span className="animate-pulse">Agents deliberating on {activeCandidate.name}'s qualifications</span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-evalora-accent animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-evalora-accent animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-evalora-accent animate-bounce delay-200" />
              </span>
            </div>
          )}

          {activeCandidate?.status === 'pending' && (
            <div className="flex items-center space-x-2 text-evalora-muted py-6 px-2 italic">
              <Clock className="w-4 h-4" />
              <span>Queued for multi-agent evaluation. Reviewing preceding candidate...</span>
            </div>
          )}

          <div ref={logsEndRef} />
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-evalora-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-evalora-muted">
            {activeCandidate?.status === 'completed' ? (
              <span className="text-evalora-success flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Debate concluded for {activeCandidate.name}. Verdict: <strong>{activeCandidate.agent4Out?.final_recommendation}</strong> ({activeCandidate.agent4Out?.overall_score}/100)</span>
              </span>
            ) : (
              <span>Evaluation in progress. Transparent multi-agent deliberation active.</span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {isMultiple && activeCandidateIndex < candidatesState.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  setActiveCandidateIndex(prev => Math.min(candidatesState.length - 1, prev + 1));
                  setUserSelectedTab(true);
                }}
                className="btn-secondary text-xs px-3 py-2 flex items-center space-x-1"
              >
                <span>Next Candidate</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {(isOverallFinished || completedCount > 0) && (
              <button
                onClick={handleProceedToReport}
                className="btn-primary flex-1 sm:flex-none px-6 py-2.5 text-sm flex items-center justify-center space-x-2"
              >
                <span>{isMultiple ? `View Reports (${completedCount})` : 'View Comprehensive Report'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
