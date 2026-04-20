import { useEffect, useRef, useState } from "react";
import { Download, ShieldCheck, Upload, X } from "lucide-react";
import { useLocation } from "wouter";

import { useBudget } from "@/contexts/BudgetContext";
import { useCalculator } from "@/contexts/CalculatorContext";
import { exportToFile, importFromFile } from "@/lib/persistence";

export function SaveFileModal() {
  const { inputs, replaceInputs } = useCalculator();
  const { replaceAllData } = useBudget();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [importPassword, setImportPassword] = useState("");
  const [exportPassword, setExportPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen]);

  function openModal() {
    setIsOpen(true);
    setErrorMessage(null);
    setStatusMessage(null);
  }

  function closeModal() {
    setIsOpen(false);
    setErrorMessage(null);
    setStatusMessage(null);
  }

  async function handleImport() {
    if (!selectedFile) {
      setErrorMessage("Choose a .fire save file first.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);

    try {
      const payload = await importFromFile(selectedFile, importPassword);
      replaceInputs(payload.calculatorInputs);
      await replaceAllData(payload.budgetData);
      setSelectedFile(null);
      setSelectedFileName("");
      setImportPassword("");
      setStatusMessage(`Loaded backup from ${new Date(payload.exportedAt).toLocaleString()}.`);
      setIsOpen(false);
      navigate("/fire");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleExport() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);

    try {
      await exportToFile(inputs, exportPassword);
      setStatusMessage("Encrypted save file created.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <button
        aria-label="Open save and upload menu"
        className="corner-vault-button"
        onClick={openModal}
        type="button"
      >
        <ShieldCheck size={20} />
      </button>

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

      {isOpen ? (
        <div
          aria-hidden="true"
          className="save-modal-backdrop"
          onClick={closeModal}
        >
          <div
            aria-label="Save and upload"
            aria-modal="true"
            className="save-modal panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="save-modal-header">
              <div>
                <p className="eyebrow">Save And Upload</p>
                <h2>Move your plan safely between sessions.</h2>
                <p className="muted">
                  Export an encrypted `.fire` file or import one to resume from another device or browser.
                </p>
              </div>
              <button
                aria-label="Close save and upload menu"
                className="modal-icon-button"
                onClick={closeModal}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="save-modal-grid">
              <section className="save-modal-card">
                <div className="save-modal-card-head">
                  <Download size={18} />
                  <strong>Download save file</strong>
                </div>
                <p className="muted">
                  Your current local draft can be exported at any time, including during onboarding.
                </p>
                <input
                  className="editor-input"
                  onChange={(event) => setExportPassword(event.target.value)}
                  placeholder="Save file password"
                  type="password"
                  value={exportPassword}
                />
                <button className="action-button" disabled={isBusy} onClick={() => void handleExport()} type="button">
                  Download encrypted file
                </button>
              </section>

              <section className="save-modal-card">
                <div className="save-modal-card-head">
                  <Upload size={18} />
                  <strong>Upload save file</strong>
                </div>
                <p className="muted">
                  Import a `.fire` file and replace the current local draft with the backup contents.
                </p>
                <button className="secondary-action-button" onClick={() => fileInputRef.current?.click()} type="button">
                  {selectedFileName || "Choose .fire file"}
                </button>
                <input
                  className="editor-input"
                  onChange={(event) => setImportPassword(event.target.value)}
                  placeholder="Import password"
                  type="password"
                  value={importPassword}
                />
                <button className="action-button" disabled={isBusy} onClick={() => void handleImport()} type="button">
                  Load save file
                </button>
              </section>
            </div>

            {statusMessage ? <p className="status-message compact-status">{statusMessage}</p> : null}
            {errorMessage ? <p className="error-message compact-status">{errorMessage}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
