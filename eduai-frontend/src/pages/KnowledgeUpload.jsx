import { useState, useRef, useCallback } from "react";
import { api } from "../Api";
import "./KnowledgeUpload.css";

const STATUS = {
  IDLE: "idle",
  UPLOADING: "uploading",
  SUCCESS: "success",
  ERROR: "error",
};

// Map HTTP status codes to friendly guidance
function getErrorGuidance(status, detail) {
  if (status === 400) return { title: "Wrong file type", hint: "Only PDF files are accepted. Rename or re-export your document as a .pdf and try again." };
  if (status === 422) return { title: "No extractable text", hint: "This PDF appears to be scanned or image-only. Try running it through OCR software (e.g. Adobe Acrobat, Tesseract) or export a text-based version." };
  if (status >= 500) return { title: "Server error", hint: "The server encountered an issue processing this file. Check your backend logs for details." };
  return { title: "Upload failed", hint: detail || "An unexpected error occurred." };
}

export default function KnowledgeUpload() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);   // success response
  const [error, setError] = useState(null);      // { title, hint, detail }
  const [uploadHistory, setUploadHistory] = useState([]); // session log
  const fileInputRef = useRef(null);

  function validateFile(file) {
    if (!file) return "No file selected.";
    if (!file.name.toLowerCase().endsWith(".pdf")) return "Only .pdf files are supported.";
    if (file.size > 50 * 1024 * 1024) return "File exceeds 50 MB limit.";
    return null;
  }

  function pickFile(file) {
    const err = validateFile(file);
    if (err) {
      setError({ title: "Invalid file", hint: err });
      setStatus(STATUS.ERROR);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setStatus(STATUS.IDLE);
    setError(null);
    setResult(null);
  }

  async function upload() {
    if (!selectedFile || status === STATUS.UPLOADING) return;
    setStatus(STATUS.UPLOADING);
    setError(null);
    setResult(null);

    try {
      const data = await api.uploadPdf(selectedFile);
      setResult(data);
      setStatus(STATUS.SUCCESS);
      setUploadHistory((prev) => [
        { filename: data.filename, chunks: data.chunks_indexed, ts: new Date() },
        ...prev.slice(0, 9),
      ]);
    } catch (e) {
      const guidance = getErrorGuidance(e.status, e.detail);
      setError(guidance);
      setStatus(STATUS.ERROR);
    }
  }

  function reset() {
    setStatus(STATUS.IDLE);
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Drag-and-drop handlers
  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  }, []);

  const isUploading = status === STATUS.UPLOADING;

  return (
    <div>
      <div className="page-header">
        <h1>Knowledge Base</h1>
        <p>Upload PDF documents to expand the RAG knowledge base for the AI assistant</p>
      </div>

      <div className="ku-layout">
        {/* Upload panel */}
        <div className="ku-main">

          {/* Drop zone */}
          <div
            className={`drop-zone ${dragOver ? "drop-zone--over" : ""} ${selectedFile ? "drop-zone--has-file" : ""} ${isUploading ? "drop-zone--uploading" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
            />

            {isUploading ? (
              <div className="dz-uploading">
                <div className="dz-upload-ring">
                  <svg viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="20" stroke="var(--ivory-dark)" strokeWidth="3" />
                    <circle cx="24" cy="24" r="20" stroke="var(--navy)" strokeWidth="3"
                      strokeDasharray="126" strokeDashoffset="32" strokeLinecap="round"
                      className="dz-ring-spin" />
                  </svg>
                  <PdfIcon size={20} />
                </div>
                <p className="dz-upload-label">Uploading <strong>{selectedFile.name}</strong>…</p>
                <p className="dz-upload-sub">Chunking and indexing into vector store</p>
              </div>
            ) : selectedFile ? (
              <div className="dz-selected">
                <div className="dz-file-icon"><PdfIcon size={28} /></div>
                <div className="dz-file-info">
                  <p className="dz-file-name">{selectedFile.name}</p>
                  <p className="dz-file-size">{formatSize(selectedFile.size)}</p>
                </div>
                <button
                  className="dz-remove"
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  title="Remove file"
                >
                  <XIcon />
                </button>
              </div>
            ) : (
              <div className="dz-empty">
                <div className="dz-icon"><UploadIcon /></div>
                <p className="dz-title">Drop a PDF here</p>
                <p className="dz-sub">or click to browse your files</p>
                <span className="dz-hint-pill">PDF only · max 50 MB</span>
              </div>
            )}
          </div>

          {/* Upload button */}
          {selectedFile && !isUploading && status !== STATUS.SUCCESS && (
            <button className="btn btn-primary ku-upload-btn" onClick={upload}>
              <UploadIcon size={15} />
              Upload to Knowledge Base
            </button>
          )}

          {/* Success state */}
          {status === STATUS.SUCCESS && result && (
            <div className="ku-result ku-result--success">
              <div className="ku-result-icon">
                <CheckIcon />
              </div>
              <div className="ku-result-body">
                <p className="ku-result-title">Successfully indexed</p>
                <p className="ku-result-file">{result.filename}</p>
                <div className="ku-result-stats">
                  <div className="ku-stat">
                    <span className="ku-stat-value">{result.chunks_indexed}</span>
                    <span className="ku-stat-label">chunks indexed</span>
                  </div>
                </div>
                <p className="ku-result-msg">{result.message}</p>
              </div>
              <button className="btn btn-outline ku-upload-another" onClick={reset}>
                Upload another
              </button>
            </div>
          )}

          {/* Error state */}
          {status === STATUS.ERROR && error && (
            <div className="ku-result ku-result--error">
              <div className="ku-result-icon ku-result-icon--error">
                <AlertIcon />
              </div>
              <div className="ku-result-body">
                <p className="ku-result-title">{error.title}</p>
                <p className="ku-error-hint">{error.hint}</p>
              </div>
              <button className="btn btn-outline ku-upload-another" onClick={reset}>
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Right panel — info + history */}
        <div className="ku-side">
          {/* How it works */}
          <div className="card">
            <div className="card-title">How it works</div>
            <ol className="ku-steps">
              <li><span className="ku-step-num">1</span><span>Upload a text-based PDF (lecture notes, textbook chapters, syllabus).</span></li>
              <li><span className="ku-step-num">2</span><span>The backend extracts text and splits it into overlapping chunks (~1000 chars each).</span></li>
              <li><span className="ku-step-num">3</span><span>Each chunk is embedded and stored in the Chroma vector database.</span></li>
              <li><span className="ku-step-num">4</span><span>The AI Assistant, Summarizer, and Quiz now use this content to ground their responses.</span></li>
            </ol>
            <hr className="divider" />
            <div className="ku-tips">
              <p className="ku-tips-title">Tips for best results</p>
              <ul>
                <li>Use text-exported PDFs, not scanned images</li>
                <li>Smaller, focused documents index better than huge files</li>
                <li>Upload each module or chapter separately</li>
                <li>If scanned, run OCR first (e.g. Adobe Acrobat, Tesseract)</li>
              </ul>
            </div>
          </div>

          {/* Upload history */}
          {uploadHistory.length > 0 && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <div className="card-title">This session</div>
              <div className="ku-history">
                {uploadHistory.map((item, i) => (
                  <div key={i} className="ku-history-row">
                    <div className="ku-history-icon"><PdfIcon size={14} /></div>
                    <div className="ku-history-info">
                      <p className="ku-history-name">{item.filename}</p>
                      <p className="ku-history-meta">{item.chunks} chunks · {formatTime(item.ts)}</p>
                    </div>
                    <span className="badge badge-success">Done</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function UploadIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function PdfIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}