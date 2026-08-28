import React, { useState } from 'react';
import { UploadCloud, FileType, CheckCircle, X } from 'lucide-react';

export const Dashboard = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files as FileList)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpload = async () => {
    setUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      setUploading(false);
      onUploadComplete();
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in mt-10">
      <h2 className="text-3xl font-bold mb-2">Candidate Upload</h2>
      <p className="text-evalora-muted mb-8">Upload resumes, transcripts, and portfolios for the AI agents to analyze.</p>

      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300 ${
          isDragging ? 'border-evalora-accent bg-evalora-accent/10' : 'border-evalora-border bg-evalora-card'
        }`}
      >
        <UploadCloud className="w-16 h-16 text-evalora-muted mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">Drag & Drop Documents Here</h3>
        <p className="text-sm text-evalora-muted mb-6">Supported formats: PDF, DOCX, TXT</p>
        <button className="btn-secondary relative overflow-hidden">
          <input 
            type="file" 
            multiple 
            onChange={(e) => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)])}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          Browse Files
        </button>
      </div>

      {files.length > 0 && (
        <div className="mt-8 bg-evalora-card border border-evalora-border rounded-xl p-6">
          <h4 className="font-medium mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-evalora-success" />
            <span>Files ready for processing</span>
          </h4>
          <ul className="space-y-3 mb-6">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between bg-evalora-bg p-3 rounded-lg border border-evalora-border/50">
                <div className="flex items-center space-x-3">
                  <FileType className="w-5 h-5 text-evalora-accent" />
                  <span className="text-sm">{f.name}</span>
                </div>
                <button 
                  onClick={() => removeFile(i)}
                  className="text-evalora-muted hover:text-evalora-danger transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className={`btn-primary w-full ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {uploading ? 'Uploading and Extracting...' : 'Begin AI Evaluation'}
          </button>
        </div>
      )}
    </div>
  );
};
