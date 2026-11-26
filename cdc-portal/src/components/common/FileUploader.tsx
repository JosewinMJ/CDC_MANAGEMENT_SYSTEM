import React, { useState, useRef } from 'react';
import { UploadCloud, FileCheck, X, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  helperText?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileSelect: (fileName: string) => void;
  selectedFileName?: string;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  helperText = 'PDF, DOCX up to 5MB',
  accept = '.pdf,.doc,.docx',
  maxSizeMb = 5,
  onFileSelect,
  selectedFileName,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds maximum allowed size of ${maxSizeMb}MB`);
      return;
    }
    onFileSelect(file.name);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-[#142B4A] mb-1.5">{label}</label>

      {selectedFileName ? (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2.5 truncate">
            <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-emerald-900 truncate">{selectedFileName}</span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onFileSelect('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition ${
            isDragging
              ? 'border-[#2855A6] bg-[#EAF2FF]/60'
              : 'border-slate-300 hover:border-[#2855A6] bg-[#F5F7FA]/50 hover:bg-[#EAF2FF]/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#2855A6] mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-[#142B4A]">
            <span className="text-[#2855A6]">Click to upload</span> or drag and drop
          </p>
          <p className="text-[11px] text-[#78869A] mt-1">{helperText}</p>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};
