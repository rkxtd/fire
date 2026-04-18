import { useRef, useState } from "react";
import { Download, FolderUp, RotateCcw, ShieldCheck } from "lucide-react";

import { useBudget } from "@/contexts/BudgetContext";
import { useCalculator } from "@/contexts/CalculatorContext";
import { exportToFile, importFromFile } from "@/lib/persistence";

interface SaveLoadPanelProps {
  className?: string;
}

export function SaveLoadPanel({ className }: SaveLoadPanelProps) {
  const { inputs, replaceInputs, reset } = useCalculator();
  const { replaceAllData, clearAll } = useBudget();
  const [exportPassword, setExportPassword] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleExport() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsWorking(true);

    try {
      await exportToFile(inputs, exportPassword);
      setStatusMessage("Encrypted backup created.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Backup export failed.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleImport() {
    if (!selectedFile) {
      setErrorMessage("Choose a .fire backup file first.");
      setStatusMessage(null);
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsWorking(true);

    try {
      const payload = await importFromFile(selectedFile, importPassword);
      replaceInputs(payload.calculatorInputs);
      await replaceAllData(payload.budgetData);
      setStatusMessage(`Loaded backup from ${new Date(payload.exportedAt).toLocaleString()}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Backup import failed.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleResetAll() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsWorking(true);

    try {
      reset();
      await clearAll();
      setStatusMessage("Calculator inputs and budget data were reset.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Reset failed.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section className={`panel save-load-panel ${className ?? ""}`.trim()} id="save-load">
      <div className="section-head">
        <div>
          <p className="eyebrow">Save and Load</p>
          <h2>Encrypted backup</h2>
        </div>
        <div className="security-chip">
          <ShieldCheck size={16} />
          <span>AES-256-GCM</span>
        </div>
      </div>

      <div className="save-load-grid">
        <div className="storage-card">
          <div className="mini-head">
            <h3>Export</h3>
            <p className="muted">Package calculator inputs and budget data into a password-protected file.</p>
          </div>
          <input
            className="editor-input"
            onChange={(event) => setExportPassword(event.target.value)}
            placeholder="Export password"
            type="password"
            value={exportPassword}
          />
          <button className="action-button" disabled={isWorking} onClick={() => void handleExport()} type="button">
            <Download size={16} />
            <span>Create backup</span>
          </button>
        </div>

        <div className="storage-card">
          <div className="mini-head">
            <h3>Import</h3>
            <p className="muted">Load a prior `.fire` file and replace the current browser data.</p>
          </div>
          <input
            ref={fileInputRef}
            accept=".fire"
            className="hidden-file-input"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setSelectedFileName(file?.name ?? "");
            }}
            type="file"
          />
          <button className="secondary-action-button" onClick={() => fileInputRef.current?.click()} type="button">
            <FolderUp size={16} />
            <span>{selectedFileName || "Choose backup file"}</span>
          </button>
          <input
            className="editor-input"
            onChange={(event) => setImportPassword(event.target.value)}
            placeholder="Import password"
            type="password"
            value={importPassword}
          />
          <button className="action-button" disabled={isWorking} onClick={() => void handleImport()} type="button">
            <FolderUp size={16} />
            <span>Load backup</span>
          </button>
        </div>

        <div className="storage-card">
          <div className="mini-head">
            <h3>Reset</h3>
            <p className="muted">Clear the current calculator and budget data, then restore the starter defaults.</p>
          </div>
          <button className="danger-button" disabled={isWorking} onClick={() => void handleResetAll()} type="button">
            <RotateCcw size={16} />
            <span>Reset all local data</span>
          </button>
        </div>
      </div>

      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </section>
  );
}
