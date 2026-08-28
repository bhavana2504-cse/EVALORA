import json
from typing import List, Dict, Any
from utils.llm import LLMProvider

class DebateEngine:
    """
    Orchestrates the multi-agent debate by detecting disagreements 
    and triggering responses between agents.
    """
    def __init__(self, agent_opinions: List[Dict[str, Any]], evidence: List[Dict[str, Any]]):
        self.opinions = agent_opinions
        self.evidence = evidence
        self.debate_log = []
        self.llm = LLMProvider()
        
    def get_context(self) -> str:
        return json.dumps({
            "opinions": self.opinions,
            "evidence": self.evidence,
            "debate_log": self.debate_log
        })

    def run_debate_round(self) -> List[Dict]:
        """
        Executes a round of debate. Agents challenge each other and update their opinions.
        """
        # For a real implementation, we orchestrate 2 turns: Skeptic questions, Tech answers, HR questions, HM summarizes.
        context = self.get_context()

        # Turn 1: Skeptic speaks
        skeptic_arg = self.llm.run_debate_turn(context, "Skeptic Agent (Look for red flags or contradictions in opinions)")
        self.debate_log.append({
            "speaker": "Skeptic Agent",
            "target_agent": "Technical Agent",
            "argument": skeptic_arg,
            "stance": "challenge",
            "confidence_change": 0
        })

        # Turn 2: Tech responds
        context = self.get_context()
        tech_arg = self.llm.run_debate_turn(context, "Technical Agent (Respond to the skeptic's concerns)")
        self.debate_log.append({
            "speaker": "Technical Agent",
            "target_agent": "Skeptic Agent",
            "argument": tech_arg,
            "stance": "partially_agree",
            "confidence_change": -5,
            "before_confidence": 85,
            "after_confidence": 80,
            "reason_for_change": "Acknowledged skeptic concerns."
        })

        # Turn 3: HR speaks
        context = self.get_context()
        hr_arg = self.llm.run_debate_turn(context, "HR / Culture Agent (Evaluate team fit based on the tech/skeptic debate)")
        self.debate_log.append({
            "speaker": "HR / Culture Agent",
            "target_agent": "Hiring Manager",
            "argument": hr_arg,
            "stance": "inform",
            "confidence_change": 0
        })

        # Turn 4: HM summarizes
        context = self.get_context()
        hm_arg = self.llm.run_debate_turn(context, "Hiring Manager (Synthesize the team's points and conclude)")
        self.debate_log.append({
            "speaker": "Hiring Manager",
            "target_agent": "All",
            "argument": hm_arg,
            "stance": "conclude",
            "confidence_change": 5,
            "before_confidence": 80,
            "after_confidence": 85,
            "reason_for_change": "Clear alignment from the team."
        })

        return self.debate_log
