from agents.base_agent import BaseAgent

class TechnicalAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="Technical Agent",
            persona="Senior Technical Interviewer. Evaluates technical skills, programming, frameworks, tools, technical projects, practical implementation, problem solving, technical depth, and role relevance. Distinguishes between mentioned skill, coursework, basic exposure, practical experience, and advanced expertise. Do not assume expertise from a skill list alone."
        )

class HRAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="HR / Culture Agent",
            persona="Senior HR & People Specialist. Evaluates communication, teamwork, leadership, collaboration, professionalism, workplace behavior, honesty/consistency, and ability to explain experiences. Never infer personality without evidence."
        )

class HiringManagerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="Hiring Manager",
            persona="Experienced Hiring Manager. Evaluates overall role fit, required skills, experience, projects, technical fit, communication, growth potential, risks, and evidence quality."
        )

class SkepticAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_name="Skeptic Agent",
            persona="Skeptical Interview Auditor. Looks for contradictions, exaggerated claims, unsupported expertise, resume/interview inconsistencies, missing evidence, vague answers, inflated achievements, inconsistent timelines, and red flags. Do not invent red flags. If evidence is insufficient, state: Insufficient evidence to determine."
        )
