"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { isAcceptedFileType } from "@/lib/files";

export interface FileDropProps {
  onFilesSelected: (files: File[]) => void;
  acceptedExtensionsText?: string;
  className?: string;
}

export function FileDrop({
  onFilesSelected,
  acceptedExtensionsText = "PDF, DOCX, or TXT (Max 10MB)",
  className = "",
}: FileDropProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    validateAndEmit(files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setError(null);
      const files = Array.from(e.target.files);
      validateAndEmit(files);
    }
  };

  const validateAndEmit = (files: File[]) => {
    const validFiles: File[] = [];
    for (const f of files) {
      if (isAcceptedFileType(f.name)) {
        validFiles.push(f);
      } else {
        setError(`"${f.name}" has an unsupported format. Please upload PDF, DOCX, or TXT.`);
        return;
      }
    }
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-card p-6 text-center cursor-pointer transition-colors duration-180 flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? "border-accent bg-accent-soft/30"
            : "border-border bg-surface-soft/40 hover:bg-surface-soft hover:border-ink-muted/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="w-10 h-10 rounded-sm bg-accent-soft flex items-center justify-center text-accent">
          <UploadCloud className="w-5 h-5" />
        </div>

        <div className="space-y-0.5">
          <p className="text-sm font-medium text-ink">
            Drag & drop files here, or <span className="text-accent underline">browse</span>
          </p>
          <p className="text-xs text-ink-muted">{acceptedExtensionsText}</p>
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-brandRed">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
