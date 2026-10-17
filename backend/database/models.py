from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database.database import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String, index=True, unique=True)
    name = Column(String)
    education = Column(Text)
    experience = Column(Text)
    skills = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    evidence_items = relationship("Evidence", back_populates="profile", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="profile", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(String, primary_key=True, index=True)
    candidate_id = Column(String, ForeignKey("candidate_profiles.candidate_id"))
    claim = Column(Text)
    quote = Column(Text)
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("CandidateProfile", back_populates="evidence_items")

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String, ForeignKey("candidate_profiles.candidate_id"), index=True)
    job_description = Column(Text)
    overall_score = Column(Integer)
    final_recommendation = Column(String)
    confidence = Column(Integer)
    category_scores = Column(Text)  # JSON-serialized category scores
    strengths = Column(Text)        # JSON-serialized list
    concerns = Column(Text)         # JSON-serialized list
    evidence_ids = Column(Text)     # JSON-serialized list of evidence IDs
    panel_debate = Column(Text)
    technical_questions = Column(Text)  # JSON-serialized list from agent 2
    agent_outputs = Column(Text)    # JSON-serialized full agents output
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("CandidateProfile", back_populates="evaluations")

class DecisionOverride(Base):
    __tablename__ = "decision_overrides"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String, index=True)
    override_decision = Column(String)
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

