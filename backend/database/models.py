from sqlalchemy import Column, Integer, String, Text, ForeignKey
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

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(String, primary_key=True, index=True)
    candidate_id = Column(String, ForeignKey("candidate_profiles.candidate_id"))
    claim = Column(Text)
    quote = Column(Text)
    source = Column(String)
    
    profile = relationship("CandidateProfile")
