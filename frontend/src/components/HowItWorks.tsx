import { Bot, CheckCircle, ArrowRight, Upload, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export const HowItWorks = ({ onStart }: { onStart: () => void }) => {
  const steps = [
    {
      title: '1. Document Parsing',
      description: 'Upload candidate resumes, transcripts, and portfolios. Our system extracts structured text, work history, skills, and metrics.',
      icon: <Upload className="w-8 h-8 text-evalora-accent" />,
      color: 'bg-evalora-accent/10 border-evalora-accent/50'
    },
    {
      title: '2. Independent AI Review',
      description: 'Four specialized AI agents (HR, Technical, Hiring Manager, Skeptic) analyze the documents independently without influencing one another.',
      icon: <Bot className="w-8 h-8 text-blue-400" />,
      color: 'bg-blue-400/10 border-blue-400/50'
    },
    {
      title: '3. Multi-Agent Debate',
      description: 'The agents enter a live debate, challenging each other\'s findings. The Skeptic looks for missing evidence while others defend their evaluations.',
      icon: <Layers className="w-8 h-8 text-purple-400" />,
      color: 'bg-purple-400/10 border-purple-400/50'
    },
    {
      title: '4. Evidence-Backed Decision',
      description: 'A final comprehensive report is generated, providing a clear hiring decision, risk factors, and traceable evidence linking back to the original documents.',
      icon: <CheckCircle className="w-8 h-8 text-evalora-success" />,
      color: 'bg-evalora-success/10 border-evalora-success/50'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 mt-10 animate-fade-in">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">How Evalora Works</h2>
        <p className="text-xl text-evalora-muted max-w-2xl mx-auto">
          Evalora mimics a real-world hiring panel using specialized AI agents to ensure thorough, unbiased, and explainable decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative">
        {/* Connection lines for desktop */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-evalora-border -z-10 transform -translate-y-1/2"></div>
        <div className="hidden md:block absolute top-0 left-1/2 w-0.5 h-full bg-evalora-border -z-10 transform -translate-x-1/2"></div>

        {steps.map((step, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.2 }}
            className={`bg-evalora-card border rounded-2xl p-8 flex flex-col ${step.color} transition-transform hover:-translate-y-2`}
          >
            <div className="bg-evalora-bg w-16 h-16 rounded-full flex items-center justify-center border border-[inherit] mb-6 shadow-lg">
              {step.icon}
            </div>
            <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
            <p className="text-evalora-muted leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="text-center bg-evalora-card border border-evalora-border p-10 rounded-2xl">
        <h3 className="text-2xl font-bold mb-4">Ready to try it out?</h3>
        <p className="text-evalora-muted mb-8">Upload a test resume and watch the AI panel debate the candidate in real-time.</p>
        <button onClick={onStart} className="btn-primary inline-flex items-center space-x-2 px-8 py-4 text-lg">
          <span>Start Your First Evaluation</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
