"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, File, FileText, Image, Trash2, Download, HardDrive } from "lucide-react";
import GlassCard from "../GlassCard";

interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  createdAt: string;
}

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const MAX_FILES = 10;
const STORAGE_KEY = "dashboard-files";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf") || type.includes("text") || type.includes("document")) return FileText;
  return File;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function FileWidget() {
  const [mounted, setMounted] = useState(false);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setFiles(JSON.parse(saved)); } catch { /* */ }
    }
  }, []);

  function save(updated: StoredFile[]) {
    setFiles(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);

    const currentFiles = [...files];
    const newFiles: StoredFile[] = [];

    Array.from(fileList).forEach((file) => {
      if (currentFiles.length + newFiles.length >= MAX_FILES) {
        setError(`Max ${MAX_FILES} filer tillatet.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" ar for stor (max 500KB).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const storedFile: StoredFile = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          dataUrl: reader.result as string,
          createdAt: new Date().toISOString(),
        };
        setFiles((prev) => {
          const updated = [...prev, storedFile];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  }, [files]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  }

  function handleDelete(id: string) {
    save(files.filter((f) => f.id !== id));
  }

  function handleDownload(file: StoredFile) {
    const a = document.createElement("a");
    a.href = file.dataUrl;
    a.download = file.name;
    a.click();
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (!mounted) {
    return (
      <GlassCard className="flex items-center justify-center">
        <div className="h-32 w-full rounded bg-separator animate-pulse" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="flex flex-col" hover3d={false}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Upload size={13} className="text-accent" />
          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Filer</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-fg-tertiary">
          <HardDrive size={10} />
          {formatSize(totalSize)} / ~5 MB
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl cursor-pointer
          border-2 border-dashed transition-all
          ${dragging
            ? "border-accent bg-accent/10 scale-[1.02]"
            : "border-fg-tertiary/20 hover:border-accent/40 hover:bg-surface/20"
          }
        `}
      >
        <Upload size={24} className={`${dragging ? "text-accent" : "text-fg-tertiary"} transition-colors`} />
        <p className={`text-xs ${dragging ? "text-accent" : "text-fg-tertiary"} transition-colors`}>
          Dra filer hit
        </p>
        <p className="text-[10px] text-fg-tertiary">eller klicka for att valja (max 500KB/fil)</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-[11px] text-red-400 mt-2">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-1 max-h-[200px] overflow-y-auto -mr-1 pr-1">
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface/30 group transition-colors"
              >
                <Icon size={14} className="text-accent shrink-0" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                  className="text-xs text-foreground truncate flex-1 text-left hover:text-accent transition-colors"
                  title={file.name}
                >
                  {file.name}
                </button>
                <span className="text-[10px] text-fg-tertiary shrink-0">{formatSize(file.size)}</span>
                <span className="text-[10px] text-fg-tertiary shrink-0 hidden sm:inline">{formatDate(file.createdAt)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                  className="opacity-0 group-hover:opacity-100 btn-ghost !p-0.5 text-fg-tertiary hover:text-accent transition-opacity shrink-0"
                >
                  <Download size={11} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                  className="opacity-0 group-hover:opacity-100 btn-ghost !p-0.5 text-fg-tertiary hover:text-accent-warm transition-opacity shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {files.length === 0 && (
        <p className="text-xs text-fg-tertiary text-center py-2 mt-2">Inga uppladdade filer</p>
      )}
    </GlassCard>
  );
}
