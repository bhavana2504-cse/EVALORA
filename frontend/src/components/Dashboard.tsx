import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle,
  X,
  Sparkles,
  User,
  Briefcase,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  FileCheck2,
  Upload,
  Link as LinkIcon,
  Play
} from 'lucide-react';

export interface CandidateItem {
  filename: string;
  candidateName: string;
  candidateId: string;
  resumeText: string;
  role: string;
  fileSize?: number;
  profileData?: any;
}

export interface EvaluationPayload {
  candidates: CandidateItem[];
  jobDescription: string;
  role: string;
  resumeText: string;
  candidateName: string;
  candidateId: string;
}

interface DashboardProps {
  onUploadComplete: (payload: EvaluationPayload) => void;
  initialRole?: string;
}

interface UploadedFileRecord {
  id: string;
  file: File;
  name: string;
  size: number;
  text?: string;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
  candidateName?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md'];

const PRESET_ROLES = [
  {
    role: 'Senior Full Stack Engineer',
    jd: 'We are looking for a Senior Full Stack Engineer (4+ years experience) proficient in Python (FastAPI/Django), React, TypeScript, and modern relational/NoSQL databases. Requirements: Experience architecting and deploying scalable cloud microservices, containerization with Docker, CI/CD pipelines, and writing comprehensive test suites. Strong problem-solving and communication skills required.'
  },
  {
    role: 'Staff Machine Learning Engineer',
    jd: 'Seeking a Staff ML Engineer to lead deep learning and LLM agent architecture. Requirements: MS/PhD in CS or equivalent, 5+ years experience building production ML pipelines with PyTorch, distributed training, RAG pipelines, fine-tuning foundation models, and vector databases. Track record of peer-reviewed publications or measurable production impact.'
  },
  {
    role: 'DevOps & Cloud Infrastructure Engineer',
    jd: 'Seeking a DevOps Engineer with 3+ years experience managing Kubernetes clusters, Terraform infrastructure-as-code, and AWS/GCP cloud environments. Must demonstrate practical incident response, Prometheus/Grafana monitoring, and security compliance automation.'
  }
];

const TWO_CANDIDATE_PRESETS = [
  {
    name: 'Alex Johnson',
    resumeFilename: 'Alex_Johnson_Resume.pdf',
    transcriptFilename: 'Alex_Johnson_Interview_Transcript.txt',
    resumeText: `Alex Johnson
Email: alex.johnson@example.com | San Francisco, CA | GitHub: github.com/alexj

SUMMARY:
Senior Software Engineer with 5 years experience building high-performance web applications and distributed backend systems with Python, React, and FastAPI.

EXPERIENCE:
Senior Full Stack Engineer — CloudScale Technologies (2022 - Present)
- Architected and deployed microservices handling 25M+ daily requests using FastAPI, Python, and PostgreSQL.
- Re-architected frontend data management in React/TypeScript, reducing initial load latency by 35%.
- Maintained 99.98% uptime across AWS ECS clusters using Terraform and GitHub Actions.

Software Engineer — NovaByte Systems (2020 - 2022)
- Built internal analytics dashboards and REST APIs in Python/Django and React.
- Migrated legacy monolith services into Docker containers, accelerating team deployment cycles.

EDUCATION:
B.S. in Computer Science — University of Washington (2016 - 2020)

SKILLS:
Python, FastAPI, Django, React, TypeScript, Node.js, PostgreSQL, Redis, Docker, AWS, Git.`,
    transcriptText: `Interviewer: Hi Alex, thanks for joining us today. Can you tell us about your experience designing microservices for high throughput?
Alex Johnson: In my current role at CloudScale Technologies, our core service handles over 25 million requests daily. I designed our service partitioning using FastAPI and async PostgreSQL drivers. When we encountered database connection pool starvation under spike traffic, I introduced Redis caching layers with circuit breakers which prevented backend cascades.
Interviewer: How do you approach frontend state management in React?
Alex Johnson: I favor lightweight state containers like Zustand or React Query for remote server cache. We reduced initial paint times by 35% through route-based code-splitting and memoizing expensive tree renders.
Interviewer: How do you handle production outages?
Alex Johnson: First step is mitigation and rollback through GitHub Actions canary stages, followed by structured blameless post-mortems and automated regression tests.`
  },
  {
    name: 'Elena Rostova',
    resumeFilename: 'Elena_Rostova_Resume.pdf',
    transcriptFilename: 'Elena_Rostova_Interview_Transcript.txt',
    resumeText: `Dr. Elena Rostova
Email: elena.rostova@example.com | Boston, MA | Google Scholar: elena-rostova-ml

SUMMARY:
Full Stack and Applied ML Engineer with 6 years experience specializing in Python distributed systems, FastAPI microservices, and modern TypeScript frontend dashboards.

EXPERIENCE:
Lead Systems Engineer — Synapse AI (2021 - Present)
- Designed full stack web applications orchestrating distributed inference workers with Python, FastAPI, and React.
- Reduced end-to-end API latency by 45% using Redis caching, WebSocket streaming, and connection multiplexing.
- Authored 3 patents on high-efficiency data pipeline streaming and client synchronization.

Full Stack Engineer — Apex Labs (2019 - 2021)
- Developed responsive React and TypeScript administration portals used by 500k monthly active users.
- Automated CI/CD deployments on Kubernetes with zero-downtime rolling upgrades.

EDUCATION:
Ph.D. in Computer Science — Massachusetts Institute of Technology (2019)
B.S. in Computer Science & Math — Carnegie Mellon University (2015)

SKILLS:
Python, FastAPI, React, TypeScript, Docker, Kubernetes, PostgreSQL, Redis, Distributed Systems.`,
    transcriptText: `Interviewer: Welcome Elena. Tell us about a challenging architectural decision you made recently.
Elena Rostova: At Synapse AI, our inference orchestration required streaming token and status updates to thousands of connected clients. I designed a hybrid HTTP/2 and WebSocket gateway using FastAPI and Redis Pub/Sub, which brought latency down by 45% compared to our previous polling setup.
Interviewer: How do you verify code quality and team standards?
Elena Rostova: We enforce strict TypeScript compile boundaries, comprehensive Vitest unit suites, and end-to-end Playwright tests on each pull request. No code deploys without passing automated integration tests.
Interviewer: What is your philosophy on full stack engineering?
Elena Rostova: A strong engineer understands the whole cycle—from SQL query plans and network socket buffers to DOM reconciliation and CSS layout performance.`
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ onUploadComplete }) => {
  const [jdFiles, setJdFiles] = useState<UploadedFileRecord[]>([]);
  const [resumeFiles, setResumeFiles] = useState<UploadedFileRecord[]>([]);
  const [transcriptFiles, setTranscriptFiles] = useState<UploadedFileRecord[]>([]);

  const [openSections, setOpenSections] = useState<{
    jd: boolean;
    resumes: boolean;
    transcripts: boolean;
  }>({
    jd: true,
    resumes: true,
    transcripts: true
  });

  const [transcriptAssociations, setTranscriptAssociations] =
    useState<Record<string, string>>({});

  const [selectedRole, setSelectedRole] = useState(PRESET_ROLES[0].role);
  const [jobDescription, setJobDescription] = useState(PRESET_ROLES[0].jd);

  const [isDragging, setIsDragging] = useState(false);
  const [activeUploadTarget, setActiveUploadTarget] =
    useState<'jd' | 'resumes' | 'transcripts'>('resumes');

  const [animatingFiles, setAnimatingFiles] = useState<
    Array<{ id: string; name: string; isPdf: boolean }>
  >([]);

  const [isSwishing, setIsSwishing] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const toggleSection = (section: 'jd' | 'resumes' | 'transcripts') => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const guessCandidateName = (filename: string): string => {
    let base = filename;

    for (const ext of ['.pdf', '.txt', '.md', '.json']) {
      base = base.replace(new RegExp(`\\${ext}$`, 'i'), '');
    }

    base = base.replace(
      /[_\-.]*(resume|transcript|cv|interview|notes|final|v\d+)[_\-.]*/gi,
      ' '
    );

    base = base.replace(/[_\-]+/g, ' ').trim();

    if (!base) return 'Candidate';

    return base
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const triggerBasketballAnimation = (fileList: File[]) => {
    const newAnimations = fileList.map((f, idx) => ({
      id: `${f.name}-${Date.now()}-${idx}`,
      name: f.name,
      isPdf: f.name.toLowerCase().endsWith('.pdf')
    }));

    setAnimatingFiles(prev => [...prev, ...newAnimations]);

    setTimeout(() => {
      setIsSwishing(true);
      setTimeout(() => setIsSwishing(false), 600);
    }, 750);

    setTimeout(() => {
      setAnimatingFiles(prev =>
        prev.filter(item => !newAnimations.some(na => na.id === item.id))
      );
    }, 1100);
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('https://evalora-oxg9.vercel.app/api/v1/upload/extract-text', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        return data.extracted_text || '';
      }
    } catch {
      // Fall back to local text reading.
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  };

  const handleIncomingFiles = async (
    target: 'jd' | 'resumes' | 'transcripts',
    incomingList: FileList | File[]
  ) => {
    setErrorMessage(null);

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(incomingList).forEach((file) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`'${file.name}' is not supported. Use PDF, TXT, or MD.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`'${file.name}' exceeds the 10 MB limit.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setErrorMessage(errors.join(' '));
    }

    if (validFiles.length === 0) return;

    triggerBasketballAnimation(validFiles);

    const newRecords: UploadedFileRecord[] = validFiles.map((file, idx) => ({
      id: `${target}-${file.name}-${Date.now()}-${idx}`,
      file,
      name: file.name,
      size: file.size,
      status: 'uploading',
      candidateName: target !== 'jd' ? guessCandidateName(file.name) : undefined
    }));

    if (target === 'jd') {
      setJdFiles(prev => [...prev, ...newRecords]);
    } else if (target === 'resumes') {
      setResumeFiles(prev => [...prev, ...newRecords]);
    } else {
      setTranscriptFiles(prev => [...prev, ...newRecords]);
    }

    for (const record of newRecords) {
      try {
        const extractedText = await extractTextFromFile(record.file);

        if (target === 'jd') {
          setJdFiles(prev =>
            prev.map(r =>
              r.id === record.id
                ? { ...r, text: extractedText, status: 'success' }
                : r
            )
          );

          if (extractedText && extractedText.trim().length > 20) {
            setJobDescription(extractedText.trim());
          }
        } else if (target === 'resumes') {
          setResumeFiles(prev =>
            prev.map(r =>
              r.id === record.id
                ? { ...r, text: extractedText, status: 'success' }
                : r
            )
          );
        } else {
          setTranscriptFiles(prev =>
            prev.map(r =>
              r.id === record.id
                ? { ...r, text: extractedText, status: 'success' }
                : r
            )
          );
        }
      } catch {
        const updateError = (r: UploadedFileRecord) =>
          r.id === record.id
            ? { ...r, status: 'error' as const, errorMessage: 'Failed to extract text' }
            : r;

        if (target === 'jd') {
          setJdFiles(prev => prev.map(updateError));
        } else if (target === 'resumes') {
          setResumeFiles(prev => prev.map(updateError));
        } else {
          setTranscriptFiles(prev => prev.map(updateError));
        }
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(activeUploadTarget, e.dataTransfer.files);
    }
  };

  const openFilePickerFor = (
    target: 'jd' | 'resumes' | 'transcripts'
  ) => {
    setActiveUploadTarget(target);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const removeJdFile = (id: string) => {
    setJdFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeResumeFile = (id: string) => {
    setResumeFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeTranscriptFile = (id: string) => {
    setTranscriptFiles(prev => prev.filter(f => f.id !== id));

    setTranscriptAssociations(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleTranscriptAssociationChange = (
    transcriptId: string,
    candidateName: string
  ) => {
    setTranscriptAssociations(prev => ({
      ...prev,
      [transcriptId]: candidateName
    }));
  };

  const distinctCandidates = React.useMemo(() => {
    const list: Array<{ name: string; resumeFile: UploadedFileRecord }> = [];

    resumeFiles.forEach(rf => {
      const name = rf.candidateName || guessCandidateName(rf.name);
      list.push({ name, resumeFile: rf });
    });

    return list;
  }, [resumeFiles]);

  const candidateCount = distinctCandidates.length;
  const totalDocumentCount =
    jdFiles.length + resumeFiles.length + transcriptFiles.length;

  useEffect(() => {
    transcriptFiles.forEach(tf => {
      if (!transcriptAssociations[tf.id]) {
        const tfGuess = guessCandidateName(tf.name).toLowerCase();

        const matched = distinctCandidates.find(c => {
          const cName = c.name.toLowerCase();
          return tfGuess.includes(cName) || cName.includes(tfGuess);
        });

        if (matched) {
          setTranscriptAssociations(prev => ({
            ...prev,
            [tf.id]: matched.name
          }));
        } else if (distinctCandidates.length === 1) {
          setTranscriptAssociations(prev => ({
            ...prev,
            [tf.id]: distinctCandidates[0].name
          }));
        }
      }
    });
  }, [transcriptFiles, distinctCandidates, transcriptAssociations]);

  const loadTwoCandidatesTestCase = () => {
    setErrorMessage(null);
    setSelectedRole('Senior Full Stack Engineer');
    setJobDescription(PRESET_ROLES[0].jd);

    const jdBlob = new Blob([PRESET_ROLES[0].jd], {
      type: 'text/plain'
    });

    const jdFile = new File([jdBlob], 'Senior_Full_Stack_Engineer_JD.txt', {
      type: 'text/plain'
    });

    setJdFiles([
      {
        id: `jd-${Date.now()}`,
        file: jdFile,
        name: jdFile.name,
        size: jdFile.size,
        text: PRESET_ROLES[0].jd,
        status: 'success'
      }
    ]);

    const newResumes: UploadedFileRecord[] = TWO_CANDIDATE_PRESETS.map(
      (p, idx) => {
        const blob = new Blob([p.resumeText], {
          type: 'text/plain'
        });

        const f = new File([blob], p.resumeFilename, {
          type: 'text/plain'
        });

        return {
          id: `resume-${idx}-${Date.now()}`,
          file: f,
          name: p.resumeFilename,
          size: f.size,
          text: p.resumeText,
          status: 'success',
          candidateName: p.name
        };
      }
    );

    setResumeFiles(newResumes);

    const newTranscripts: UploadedFileRecord[] = TWO_CANDIDATE_PRESETS.map(
      (p, idx) => {
        const blob = new Blob([p.transcriptText], {
          type: 'text/plain'
        });

        const f = new File([blob], p.transcriptFilename, {
          type: 'text/plain'
        });

        return {
          id: `transcript-${idx}-${Date.now()}`,
          file: f,
          name: p.transcriptFilename,
          size: f.size,
          text: p.transcriptText,
          status: 'success',
          candidateName: p.name
        };
      }
    );

    setTranscriptFiles(newTranscripts);

    const initialMap: Record<string, string> = {};

    newTranscripts.forEach((t, i) => {
      initialMap[t.id] = TWO_CANDIDATE_PRESETS[i].name;
    });

    setTranscriptAssociations(initialMap);
    triggerBasketballAnimation([newResumes[0].file, newResumes[1].file]);
  };

  const handleStartEvaluation = async () => {
    setErrorMessage(null);

    if (!jobDescription.trim()) {
      setErrorMessage(
        'Please provide a Job Description so candidates can be evaluated against the role requirements.'
      );
      return;
    }

    if (candidateCount === 0) {
      setErrorMessage(
        'Please upload at least one candidate resume in Dropdown 2.'
      );
      return;
    }

    setEvaluating(true);

    try {
      const candidatePayloadItems = distinctCandidates.map((cand) => {
        const resumeText =
          cand.resumeFile.text || `Candidate Resume for ${cand.name}`;

        const assignedTranscripts = transcriptFiles.filter(
          tf => transcriptAssociations[tf.id] === cand.name
        );

        const transcriptText = assignedTranscripts
          .map(t => t.text || '')
          .join('\n\n');

        const transcriptFilenames = assignedTranscripts
          .map(t => t.name)
          .join(', ');

        return {
          name: cand.name,
          resume_text: resumeText,
          transcript_text: transcriptText,
          resume_filename: cand.resumeFile.name,
          transcript_filename: transcriptFilenames || undefined
        };
      });

      const response = await fetch('https://evalora-oxg9.vercel.app/api/v1/upload/process-structured-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          role: selectedRole,
          candidates: candidatePayloadItems
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.detail ||
            `Evaluation request failed with HTTP ${response.status}`
        );
      }

      const data = await response.json();

      const loadedCandidates: CandidateItem[] = data.candidates.map(
        (c: any) => ({
          filename: c.filename,
          candidateName: c.candidate_name,
          candidateId: c.candidate_id,
          resumeText: c.extracted_text,
          role: selectedRole,
          fileSize: c.file_size,
          profileData: c.profile_data
        })
      );

      if (loadedCandidates.length === 0) {
        throw new Error('The backend returned no evaluated candidates.');
      }

      onUploadComplete({
        candidates: loadedCandidates,
        jobDescription,
        role: selectedRole,
        resumeText: loadedCandidates[0].resumeText,
        candidateName: loadedCandidates[0].candidateName,
        candidateId: loadedCandidates[0].candidateId
      });
    } catch (err: any) {
      console.error('Evaluation start error:', err);
      setErrorMessage(
        err.message ||
          'Failed to start candidate evaluation. Please verify backend connection.'
      );
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 animate-fade-in mt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">
            Candidate Evaluation Setup
          </h2>
          <p className="text-evalora-muted text-sm max-w-2xl">
            Upload role requirements, resumes, and interview transcripts. Evalora pairs documents per applicant and debaters evaluate each candidate individually.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-evalora-card border border-evalora-border px-4 py-2.5 rounded-xl shadow-sm text-right">
            <span className="text-[11px] uppercase tracking-wider text-evalora-muted block font-semibold">
              Total Documents
            </span>
            <span className="text-lg font-bold text-slate-200">
              {totalDocumentCount}
            </span>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/30 px-5 py-2.5 rounded-xl shadow-sm text-right">
            <span className="text-[11px] uppercase tracking-wider text-indigo-400 block font-semibold">
              Candidates to Evaluate
            </span>
            <span className="text-2xl font-black text-indigo-400">
              {candidateCount}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-evalora-card/90 border border-evalora-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-evalora-accent/15 border border-evalora-accent/30 text-evalora-accent">
            <Sparkles className="w-5 h-5" />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">
              Quick Test Preset (2 Candidates, 5 Files)
            </h4>
            <p className="text-xs text-evalora-muted mt-0.5">
              Instantly loads 1 Job Description, 2 Resumes (Alex Johnson, Elena Rostova), and 2 Interview Transcripts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadTwoCandidatesTestCase}
          className="btn-primary text-xs py-2.5 px-4 flex items-center justify-center space-x-2 whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Load Test Case (2 Candidates)</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-evalora-danger/10 border border-evalora-danger/30 text-evalora-danger flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-[#EEF2F6] rounded-2xl p-5 text-slate-800 border border-slate-200/80 shadow-md relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Upload files
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-normal">
                  Drag and drop, or take the shot.
                </p>
              </div>

              <div className="bg-[#DCE3EC] text-slate-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center space-x-1">
                <span>Uploaded</span>
                <span className="font-bold text-slate-900 ml-0.5">
                  {totalDocumentCount}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Target Section for Drop:
              </label>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#DCE3EC] rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveUploadTarget('jd')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activeUploadTarget === 'jd'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1. JD ({jdFiles.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveUploadTarget('resumes')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activeUploadTarget === 'resumes'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2. Resumes ({resumeFiles.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveUploadTarget('transcripts')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activeUploadTarget === 'transcripts'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3. Transcripts ({transcriptFiles.length})
                </button>
              </div>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => openFilePickerFor(activeUploadTarget)}
              className={`relative mx-auto w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center pt-6 pb-20 px-4 bg-white ${
                isDragging
                  ? 'border-[#DE6226] bg-orange-50/50 scale-[1.01] shadow-inner'
                  : 'border-[#CBD5E1] hover:border-slate-400'
              }`}
              style={{ minHeight: '240px' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleIncomingFiles(activeUploadTarget, e.target.files);
                  }
                }}
                className="hidden"
              />

              <div className="text-slate-500 mb-1.5">
                <Upload className="w-6 h-6 stroke-2" />
              </div>

              <h4 className="text-base font-bold text-slate-900 tracking-tight">
                Drop files here
              </h4>

              <p className="text-xs text-slate-400 font-normal">
                or take the shot
              </p>

              <span className="text-[10px] text-indigo-600 font-semibold mt-1 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Depositing into:{' '}
                {activeUploadTarget === 'jd'
                  ? '1. Job Description'
                  : activeUploadTarget === 'resumes'
                    ? '2. Resumes'
                    : '3. Transcripts'}
              </span>

              {animatingFiles.map((item) => (
                <div
                  key={item.id}
                  className="absolute pointer-events-none z-30 flex flex-col items-center"
                  style={{
                    bottom: '40px',
                    left: '50%',
                    marginLeft: '-22px',
                    animation:
                      'basketballShot 1.05s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                  }}
                >
                  <div className="w-11 h-13 bg-white rounded-lg shadow-xl border border-slate-300 flex flex-col items-center justify-center p-1">
                    <FileText className="w-6 h-6 text-orange-500" />
                    <span className="text-[8px] font-bold text-slate-700 truncate max-w-[36px]">
                      {item.isPdf ? 'PDF' : 'DOC'}
                    </span>
                  </div>
                </div>
              ))}

              <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-20">
                <svg
                  width="150"
                  height="135"
                  viewBox="0 0 150 135"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="42"
                    y="4"
                    width="66"
                    height="52"
                    rx="4"
                    stroke="#DE6226"
                    strokeWidth="4.5"
                    fill="white"
                  />

                  <rect
                    x="69"
                    y="58"
                    width="12"
                    height="10"
                    fill="#DE6226"
                    rx="1"
                  />

                  <g
                    className={isSwishing ? 'animate-net-swish' : ''}
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.85"
                  >
                    <line x1="39" y1="72" x2="55" y2="132" />
                    <line x1="51" y1="73" x2="61" y2="132" />
                    <line x1="63" y1="74" x2="68" y2="132" />
                    <line x1="75" y1="74" x2="75" y2="132" />
                    <line x1="87" y1="74" x2="82" y2="132" />
                    <line x1="99" y1="73" x2="89" y2="132" />
                    <line x1="111" y1="72" x2="95" y2="132" />

                    <path
                      d="M 37 83 L 49 93 L 61 83 L 75 93 L 89 83 L 101 93 L 113 83"
                      fill="none"
                    />
                    <path
                      d="M 43 103 L 55 113 L 67 103 L 75 113 L 83 103 L 95 113 L 107 103"
                      fill="none"
                    />
                    <path
                      d="M 50 120 L 59 127 L 68 120 L 75 127 L 82 120 L 91 127 L 100 120"
                      fill="none"
                    />
                  </g>

                  <ellipse
                    cx="75"
                    cy="71"
                    rx="48"
                    ry="7"
                    stroke="#DE6226"
                    strokeWidth="5"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-400 mt-16 font-medium">
              Files animate into the hoop upon drop and register under their active category.
            </p>
          </div>

          <div className="bg-evalora-card border border-evalora-border rounded-xl p-4">
            <label className="text-xs font-semibold text-evalora-muted block mb-1.5 flex items-center space-x-1.5">
              <Briefcase className="w-3.5 h-3.5 text-evalora-accent" />
              <span>Target Role Profile</span>
            </label>

            <select
              value={selectedRole}
              onChange={(e) => {
                const roleName = e.target.value;
                setSelectedRole(roleName);

                const found = PRESET_ROLES.find(r => r.role === roleName);
                if (found) setJobDescription(found.jd);
              }}
              className="w-full bg-evalora-bg border border-evalora-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-evalora-accent"
            >
              {PRESET_ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.role}
                </option>
              ))}
              <option value="Custom Position">Custom Position...</option>
            </select>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col space-y-5">
          <div className="bg-evalora-card border border-evalora-border rounded-2xl overflow-hidden shadow-sm transition-all">
            <div
              onClick={() => toggleSection('jd')}
              className="p-4 bg-evalora-card/60 hover:bg-evalora-card-hover cursor-pointer flex items-center justify-between border-b border-evalora-border/60 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                  1
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Job Description</span>
                    <span className="text-[10px] font-normal text-evalora-muted bg-white/5 px-2 py-0.5 rounded-full border border-evalora-border">
                      Shared context • Not counted as candidate
                    </span>
                  </h3>

                  <p className="text-xs text-evalora-muted mt-0.5">
                    Target evaluation criteria applied equally to all candidates.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-evalora-bg border border-evalora-border text-slate-300">
                  {jdFiles.length} {jdFiles.length === 1 ? 'file' : 'files'}
                </span>

                {openSections.jd
                  ? <ChevronUp className="w-4 h-4 text-evalora-muted" />
                  : <ChevronDown className="w-4 h-4 text-evalora-muted" />}
              </div>
            </div>

            {openSections.jd && (
              <div className="p-4 space-y-3 bg-evalora-card">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-evalora-muted">
                    Upload role specification (PDF, TXT) or customize directly below:
                  </span>

                  <button
                    type="button"
                    onClick={() => openFilePickerFor('jd')}
                    className="text-xs text-evalora-accent hover:underline font-semibold flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload JD File</span>
                  </button>
                </div>

                {jdFiles.length > 0 && (
                  <div className="space-y-2">
                    {jdFiles.map(file => (
                      <div
                        key={file.id}
                        className="bg-evalora-bg/80 border border-evalora-border p-2.5 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden flex-1 mr-2">
                          <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />

                          <div className="truncate flex-1">
                            <span className="font-mono text-white text-xs truncate block">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-evalora-muted">
                              {formatFileSize(file.size)} • Role context
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeJdFile(file.id)}
                          className="text-evalora-muted hover:text-evalora-danger p-1 rounded transition"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Enter or paste target job description requirements and qualifications..."
                    className="w-full h-28 bg-evalora-bg border border-evalora-border rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-evalora-accent resize-none font-mono"
                  />

                  <div className="flex justify-between items-center text-[10px] text-evalora-muted mt-1 px-1">
                    <span>Active evaluation criteria</span>
                    <span>{jobDescription.length} characters</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-evalora-card border border-evalora-border rounded-2xl overflow-hidden shadow-sm transition-all">
            <div
              onClick={() => toggleSection('resumes')}
              className="p-4 bg-evalora-card/60 hover:bg-evalora-card-hover cursor-pointer flex items-center justify-between border-b border-evalora-border/60 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                  2
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Resumes</span>
                    <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {candidateCount} {candidateCount === 1 ? 'Candidate' : 'Candidates'} Identified
                    </span>
                  </h3>

                  <p className="text-xs text-evalora-muted mt-0.5">
                    Upload resumes for multiple candidates. Each distinct resume defines an individual candidate.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-evalora-bg border border-evalora-border text-slate-300">
                  {resumeFiles.length} {resumeFiles.length === 1 ? 'resume' : 'resumes'}
                </span>

                {openSections.resumes
                  ? <ChevronUp className="w-4 h-4 text-evalora-muted" />
                  : <ChevronDown className="w-4 h-4 text-evalora-muted" />}
              </div>
            </div>

            {openSections.resumes && (
              <div className="p-4 space-y-3 bg-evalora-card">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-evalora-muted">
                    Supports multiple resumes simultaneously (PDF or TXT):
                  </span>

                  <button
                    type="button"
                    onClick={() => openFilePickerFor('resumes')}
                    className="text-xs text-evalora-accent hover:underline font-semibold flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Resumes</span>
                  </button>
                </div>

                {resumeFiles.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-evalora-border text-center text-xs text-evalora-muted">
                    No resumes uploaded yet. Click above or drop files into the basketball dropzone to add candidates.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {resumeFiles.map((rf, idx) => {
                      const candName =
                        rf.candidateName || guessCandidateName(rf.name);
                      const isPdf = rf.name.toLowerCase().endsWith('.pdf');

                      return (
                        <div
                          key={rf.id}
                          className="bg-evalora-bg/90 border border-evalora-border p-3 rounded-xl flex items-center justify-between text-xs hover:border-evalora-border/80 transition"
                        >
                          <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-emerald-400" />
                            </div>

                            <div className="truncate flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-white text-xs">
                                  {candName}
                                </span>

                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  Candidate #{idx + 1}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 text-[10px] text-evalora-muted mt-0.5">
                                <span className="font-mono truncate">
                                  {rf.name}
                                </span>
                                <span>•</span>
                                <span>{formatFileSize(rf.size)}</span>
                                <span>•</span>
                                <span className={isPdf ? 'text-rose-400 font-semibold' : 'text-blue-400'}>
                                  {isPdf ? 'PDF' : 'TXT'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeResumeFile(rf.id)}
                            className="text-evalora-muted hover:text-evalora-danger p-1 rounded transition"
                            title="Remove resume"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-evalora-card border border-evalora-border rounded-2xl overflow-hidden shadow-sm transition-all">
            <div
              onClick={() => toggleSection('transcripts')}
              className="p-4 bg-evalora-card/60 hover:bg-evalora-card-hover cursor-pointer flex items-center justify-between border-b border-evalora-border/60 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">
                  3
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Interview Transcripts</span>
                    <span className="text-[10px] font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Paired with Resumes
                    </span>
                  </h3>

                  <p className="text-xs text-evalora-muted mt-0.5">
                    Upload transcripts and confirm which candidate each transcript belongs to.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-evalora-bg border border-evalora-border text-slate-300">
                  {transcriptFiles.length} {transcriptFiles.length === 1 ? 'transcript' : 'transcripts'}
                </span>

                {openSections.transcripts
                  ? <ChevronUp className="w-4 h-4 text-evalora-muted" />
                  : <ChevronDown className="w-4 h-4 text-evalora-muted" />}
              </div>
            </div>

            {openSections.transcripts && (
              <div className="p-4 space-y-3 bg-evalora-card">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-evalora-muted">
                    Transcripts provide verified interview answers, claims, and dialogue:
                  </span>

                  <button
                    type="button"
                    onClick={() => openFilePickerFor('transcripts')}
                    className="text-xs text-evalora-accent hover:underline font-semibold flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Transcripts</span>
                  </button>
                </div>

                {transcriptFiles.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-evalora-border text-center text-xs text-evalora-muted">
                    No transcripts uploaded yet. Upload interview transcripts to complement each candidate's resume.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transcriptFiles.map((tf) => {
                      const currentAssigned =
                        transcriptAssociations[tf.id] || '';

                      return (
                        <div
                          key={tf.id}
                          className="bg-evalora-bg/90 border border-evalora-border p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden flex-1">
                            <FileCheck2 className="w-4 h-4 text-amber-400 flex-shrink-0" />

                            <div className="truncate flex-1">
                              <span className="font-mono text-white text-xs truncate block">
                                {tf.name}
                              </span>
                              <span className="text-[10px] text-evalora-muted">
                                {formatFileSize(tf.size)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 bg-evalora-card px-2.5 py-1.5 rounded-lg border border-evalora-border">
                            <LinkIcon className="w-3.5 h-3.5 text-evalora-muted flex-shrink-0" />
                            <span className="text-[11px] text-evalora-muted whitespace-nowrap">
                              Assigned to:
                            </span>

                            <select
                              value={currentAssigned}
                              onChange={(e) =>
                                handleTranscriptAssociationChange(
                                  tf.id,
                                  e.target.value
                                )
                              }
                              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
                            >
                              <option
                                value=""
                                disabled
                                className="bg-evalora-card text-evalora-muted"
                              >
                                Select candidate...
                              </option>

                              {distinctCandidates.map(c => (
                                <option
                                  key={c.name}
                                  value={c.name}
                                  className="bg-evalora-card text-white"
                                >
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeTranscriptFile(tf.id)}
                            className="text-evalora-muted hover:text-evalora-danger p-1 rounded transition self-end sm:self-center"
                            title="Remove transcript"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-evalora-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5 text-xs text-evalora-muted">
          <CheckCircle className="w-4 h-4 text-evalora-success flex-shrink-0" />

          <span>
            {candidateCount > 0 ? (
              <>
                Ready: Evaluating{' '}
                <strong className="text-white font-semibold">
                  {candidateCount} distinct {candidateCount === 1 ? 'candidate' : 'candidates'}
                </strong>{' '}
                across{' '}
                <strong className="text-white font-semibold">
                  {totalDocumentCount} uploaded documents
                </strong>{' '}
                through the 4-agent panel.
              </>
            ) : (
              'Upload resumes to begin evaluation.'
            )}
          </span>
        </div>

        <button
          onClick={handleStartEvaluation}
          disabled={evaluating || candidateCount === 0}
          className="btn-primary w-full sm:w-auto px-8 py-3 text-base flex items-center justify-center space-x-2 min-w-[240px]"
        >
          {evaluating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Preparing Evaluation...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>
                {candidateCount > 1
                  ? `Evaluate ${candidateCount} Candidates`
                  : candidateCount === 1
                    ? 'Evaluate 1 Candidate'
                    : 'Add Resumes to Start'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
