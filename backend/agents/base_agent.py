import json
from utils.llm import LLMProvider

class BaseAgent:
    def __init__(self, agent_name: str, persona: str):
        self.agent_name = agent_name
        self.persona = persona
        self.llm = LLMProvider()

    def analyze_candidate(self, candidate_profile: dict, job_description: dict) -> dict:
        """
        Runs the independent analysis for the candidate.
        """
        data = {
            "candidate": candidate_profile,
            "job": job_description
        }
        review = self.llm.generate_independent_review(
            agent_persona=self.persona, 
            candidate_data=json.dumps(data)
        )
        
        # Merge the agent name into the dict so the frontend knows who it is
        review["agent"] = self.agent_name
        return review
