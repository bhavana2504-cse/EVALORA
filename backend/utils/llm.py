import os
import json
import time
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

load_dotenv()

class Claim(BaseModel):
    claim: str = Field(description="A specific claim made by the candidate.")
    quote: str = Field(description="The exact quote from the text supporting the claim.")
    source: str = Field(description="The inferred source document type, e.g., Resume or Transcript.")

class CandidateProfile(BaseModel):
    name: str
    education: str
    experience: str
    skills: str
    claims: list[Claim]

class LLMProvider:
    """
    LLM provider to interact with Google Gemini API using google-genai.
    """
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv("LLM_MODEL", "gemini-3.7-flash")
        self.client = genai.Client(api_key=self.api_key)

    def _generate_with_retry(self, prompt: str, schema=None, max_retries=3):
        config_kwargs = {}
        if schema:
            config_kwargs = {
                "response_mime_type": "application/json",
                "response_schema": schema,
            }
        
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(**config_kwargs) if config_kwargs else None
                )
                if schema:
                    return json.loads(response.text)
                return response.text
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                time.sleep(2 ** attempt) # Exponential backoff: 1s, 2s

    def extract_profile(self, text: str) -> dict:
        """
        Extracts structured profile information from raw text.
        """
        return self._generate_with_retry(
            f"Extract structured candidate information from the following text:\n\n{text}",
            schema=CandidateProfile
        )

    def run_agent_1_resume_analyst(self, resume_text: str, job_description: str) -> dict:
        class ScoreItem(BaseModel):
            skill: str
            score: int
            
        class Agent1Output(BaseModel):
            agent: str = Field(default="resume_analyst")
            summary: str
            strengths: list[str]
            gaps: list[str]
            evidence: list[str]
            scores: list[ScoreItem] = Field(description="List of skills and their scores (0-100)")

        prompt = f"""You are AGENT 1 — RESUME ANALYST.
Extract relevant skills, education, projects, and experience from the candidate's resume based on the job description.
Identify evidence supporting each skill and note any missing requirements.

Resume:
{resume_text}

Job Description:
{job_description}"""
        
        return self._generate_with_retry(prompt, schema=Agent1Output)

    def run_agent_2_technical_evaluator(self, resume_text: str, job_description: str, agent1_output: dict) -> dict:
        class TechScoreItem(BaseModel):
            category: str
            score: int
            
        class Agent2Output(BaseModel):
            agent: str = Field(default="technical_evaluator")
            summary: str
            technical_depth: str
            questions: list[str] = Field(description="Technical questions for the interview")
            scores: list[TechScoreItem] = Field(description="List of technical skill categories and scores (0-100)")

        prompt = f"""You are AGENT 2 — TECHNICAL EVALUATOR.
Evaluate technical skills relevant to the job based on the resume, job description, and Agent 1's output.
Assess technical depth and project experience. Generate technical questions and evidence-based scores.

Resume:
{resume_text}

Job Description:
{job_description}

Agent 1 Output:
{json.dumps(agent1_output)}"""

        return self._generate_with_retry(prompt, schema=Agent2Output)

    def run_agent_3_challenger(self, resume_text: str, job_description: str, agent1_output: dict, agent2_output: dict) -> dict:
        class Challenge(BaseModel):
            claim: str
            reason: str

        class Agent3Output(BaseModel):
            agent: str = Field(default="challenger")
            challenges: list[Challenge]
            weak_evidence: list[str]
            debate_summary: str

        prompt = f"""You are AGENT 3 — DEBATE / CHALLENGER.
Act as a skeptical hiring-panel member. Challenge unsupported claims, identify contradictions, identify weak evidence, and question unusually high or low scores from the other agents. Explain whether their conclusions are justified.

Resume:
{resume_text}

Job Description:
{job_description}

Agent 1 Output:
{json.dumps(agent1_output)}

Agent 2 Output:
{json.dumps(agent2_output)}"""

        return self._generate_with_retry(prompt, schema=Agent3Output)

    def run_agent_4_hiring_judge(self, resume_text: str, job_description: str, agent1_output: dict, agent2_output: dict, agent3_output: dict) -> dict:
        class CategoryScores(BaseModel):
            Technical_Score: int = Field(alias="Technical Score")
            Problem_Solving: int = Field(alias="Problem Solving")
            Relevant_Experience: int = Field(alias="Relevant Experience")
            Communication: int = Field(alias="Communication")

        class Agent4Output(BaseModel):
            agent: str = Field(default="hiring_judge")
            overall_score: int
            category_scores: CategoryScores
            strengths: list[str]
            concerns: list[str]
            evidence: list[str]
            panel_debate: str
            final_recommendation: str
            confidence: int

        prompt = f"""You are AGENT 4 — HIRING JUDGE.
Review all evidence and arguments from the previous agents. Resolve disagreements. Produce the final evaluation including category scores, overall score, strengths, concerns, evidence, confidence level, and a final recommendation based ONLY on job-relevant evidence.

Resume:
{resume_text}

Job Description:
{job_description}

Agent 1 Output:
{json.dumps(agent1_output)}

Agent 2 Output:
{json.dumps(agent2_output)}

Agent 3 Output:
{json.dumps(agent3_output)}"""

        result = self._generate_with_retry(prompt, schema=Agent4Output)
        
        # Fix the alias mapping for CategoryScores back to standard dict
        if "category_scores" in result:
            scores = result["category_scores"]
            result["category_scores"] = {
                "Technical Score": scores.get("Technical Score", scores.get("Technical_Score", 0)),
                "Problem Solving": scores.get("Problem Solving", scores.get("Problem_Solving", 0)),
                "Relevant Experience": scores.get("Relevant Experience", scores.get("Relevant_Experience", 0)),
                "Communication": scores.get("Communication", scores.get("Communication", 0))
            }
        return result

    def simulate_what_if(self, scenario: str) -> dict:
        class SimulationResult(BaseModel):
            simulated_decision: str = Field(description="Hire, Reject, or Consider")
            reason_for_change: str

        prompt = f"You are a Hiring Manager evaluating a what-if scenario. Given the scenario: '{scenario}', how would this change your evaluation? Output the new decision and a brief reason."
        return self._generate_with_retry(prompt, schema=SimulationResult)
