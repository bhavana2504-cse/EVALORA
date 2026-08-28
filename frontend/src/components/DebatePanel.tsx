import { useEffect, useState } from 'react';
import { Bot, UserSearch, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const DebatePanel = ({ onDebateComplete }: { onDebateComplete: (data: any) => void }) => {
  const [phase, setPhase] = useState<'analysis' | 'debate'>('analysis');
  const [debateLogs, setDebateLogs] = useState<{agent: string, message: string}[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);

  // We will store the outputs here
  const [agent1Out, setAgent1Out] = useState<any>(null);
  const [agent2Out, setAgent2Out] = useState<any>(null);
  const [agent3Out, setAgent3Out] = useState<any>(null);
  const [agent4Out, setAgent4Out] = useState<any>(null);

  const agents = [
    { name: 'Resume Analyst', icon: <Bot className="w-5 h-5" />, color: 'text-blue-400' },
    { name: 'Technical Evaluator', icon: <UserSearch className="w-5 h-5" />, color: 'text-green-400' },
    { name: 'Challenger', icon: <AlertCircle className="w-5 h-5" />, color: 'text-red-400' },
    { name: 'Hiring Judge', icon: <ShieldCheck className="w-5 h-5" />, color: 'text-purple-400' }
  ];

  // Dummy data for testing. Changing this will change the result.
  const resume_text = "Candidate Name: Alex Johnson\nExperience: 5 years software engineer using Python, React, and FastAPI. Built highly scalable microservices but no explicit metrics mentioned. \nEducation: BS Computer Science.";
  const job_description = "We are looking for a Senior Full Stack Engineer. Must have 4+ years of Python and React experience. Must know how to build and monitor scalable microservices.";

  useEffect(() => {
    let isCancelled = false;

    const runPipeline = async () => {
      try {
        // Step 1: Agent 1
        setLoadingStep(1);
        const res1 = await fetch('http://localhost:8000/api/v1/pipeline/agent1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_text, job_description })
        });
        const data1 = await res1.json();
        if (isCancelled) return;
        setAgent1Out(data1.data);
        
        // Step 2: Agent 2
        setLoadingStep(2);
        const res2 = await fetch('http://localhost:8000/api/v1/pipeline/agent2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_text, job_description, agent1_output: data1.data })
        });
        const data2 = await res2.json();
        if (isCancelled) return;
        setAgent2Out(data2.data);

        // Step 3: Agent 3 (Debate/Challenge)
        setPhase('debate');
        setLoadingStep(3);
        const res3 = await fetch('http://localhost:8000/api/v1/pipeline/agent3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_text, job_description, agent1_output: data1.data, agent2_output: data2.data })
        });
        const data3 = await res3.json();
        if (isCancelled) return;
        setAgent3Out(data3.data);

        // Populate some debate logs from Agent 3's challenges
        const challenges = data3.data.challenges || [];
        setDebateLogs(challenges.map((c: any) => ({
          agent: 'Challenger',
          message: `I challenge the claim '${c.claim}': ${c.reason}`
        })));

        // Step 4: Agent 4 (Judge)
        setLoadingStep(4);
        const res4 = await fetch('http://localhost:8000/api/v1/pipeline/agent4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_text, job_description, agent1_output: data1.data, agent2_output: data2.data, agent3_output: data3.data })
        });
        const data4 = await res4.json();
        if (isCancelled) return;
        setAgent4Out(data4.data);

        setDebateLogs(prev => [...prev, {
          agent: 'Hiring Judge',
          message: `Final Decision: ${data4.data.final_recommendation}. Overall score: ${data4.data.overall_score}/100.`
        }]);

        setIsFinished(true);

      } catch (err) {
        console.error("Pipeline failed", err);
      }
    };

    runPipeline();
    return () => { isCancelled = true; };
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {phase === 'analysis' ? 'Phase 1: Independent Analysis' : 'Phase 2: Live AI Debate'}
        </h2>
        {isFinished && (
          <button onClick={() => onDebateComplete(agent4Out)} className="btn-primary flex items-center space-x-2 animate-fade-in">
            <span>View Final Decision</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {agents.map((a, idx) => {
          const step = idx + 1;
          const isActive = loadingStep === step;
          // const isDone = loadingStep > step;
          
          let opinionText = 'Waiting...';
          if (isActive) opinionText = 'Analyzing document...';
          else if (step === 1 && agent1Out) opinionText = agent1Out.summary?.substring(0, 80) + '...';
          else if (step === 2 && agent2Out) opinionText = agent2Out.summary?.substring(0, 80) + '...';
          else if (step === 3 && agent3Out) opinionText = agent3Out.debate_summary?.substring(0, 80) + '...';
          else if (step === 4 && agent4Out) opinionText = agent4Out.final_recommendation;

          return (
            <div key={a.name} className={`bg-evalora-card border rounded-lg p-4 flex flex-col items-center text-center space-y-3 transition-colors duration-300 ${
              isActive ? 'border-evalora-accent shadow-lg shadow-evalora-accent/20' : 'border-evalora-border'
            }`}>
              <div className={`p-3 rounded-full bg-evalora-bg ${a.color}`}>
                {a.icon}
              </div>
              <span className="font-bold text-sm">{a.name}</span>
              
              <div className="h-24 w-full flex items-center justify-center text-xs text-evalora-muted italic">
                {isActive ? <span className="animate-pulse">{opinionText}</span> : opinionText}
              </div>
            </div>
          );
        })}
      </div>

      {phase === 'debate' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-evalora-card border border-evalora-border rounded-xl p-6 h-[300px] overflow-y-auto font-mono text-sm space-y-4"
        >
          {debateLogs.map((log, idx) => {
            const agentConfig = agents.find(a => a.name === log.agent);
            return (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex space-x-4 items-start"
              >
                <span className={`font-bold whitespace-nowrap ${agentConfig?.color || 'text-evalora-text'}`}>
                  [{log.agent}]
                </span>
                <span className="text-evalora-text leading-relaxed">
                  {log.message}
                </span>
              </motion.div>
            );
          })}
          {!isFinished && (
            <div className="flex space-x-2 text-evalora-muted items-center pt-4">
              <span className="animate-pulse">Agents debating</span>
              <span className="flex space-x-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
