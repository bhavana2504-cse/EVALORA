import json
from typing import Dict, List, Any
from utils.llm import LLMProvider

class FinalDecisionAgent:
    """
    Evaluates the debate outcomes, independent agent opinions, and evidence
    to formulate a final, transparent hiring recommendation.
    """
    def __init__(self):
        self.agent_name = "Evalora Final Reasoning"
        self.llm = LLMProvider()

    def make_decision(self, profile: Dict, opinions: List[Dict], debate_log: List[Dict]) -> Dict:
        """
        Aggregates all context and prompts the LLM to provide a nuanced hiring decision.
        """
        context = json.dumps({
            "profile": profile,
            "opinions": opinions,
            "debate": debate_log
        })
        
        decision = self.llm.generate_final_decision(context)
        return decision
