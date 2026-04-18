import type { CalculatorInputs } from "@/lib/calculator";
import {
  db,
  initDefaultCategories,
  type BudgetCategory,
  type Goal,
  type Loan,
  type RecurringTemplate,
  type SavedScenario,
  type Transaction,
} from "@/lib/db";

const MAGIC_HEADER = "FIRECALC_V1";
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 310_000;

export interface FireExportPayload {
  version: 1;
  exportedAt: string;
  calculatorInputs: CalculatorInputs;
  budgetData: {
    categories: BudgetCategory[];
    goals: Goal[];
    transactions: Transaction[];
    recurringTemplates: RecurringTemplate[];
    savedScenarios: SavedScenario[];
    loans: Loan[];
  };
}

function textEncoder() {
  return new TextEncoder();
}

function textDecoder() {
  return new TextDecoder();
}

function concatUint8Arrays(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return combined;
}

async function deriveKey(password: string, salt: Uint8Array) {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    textEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: ITERATIONS,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptPayload(payload: FireExportPayload, password: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  const plaintext = textEncoder().encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      plaintext,
    ),
  );

  return concatUint8Arrays([textEncoder().encode(MAGIC_HEADER), salt, iv, ciphertext]);
}

async function decryptPayload(fileBytes: Uint8Array, password: string) {
  const headerBytes = textEncoder().encode(MAGIC_HEADER);
  const header = fileBytes.slice(0, headerBytes.length);

  if (textDecoder().decode(header) !== MAGIC_HEADER) {
    throw new Error("Invalid backup file format.");
  }

  const saltOffset = headerBytes.length;
  const ivOffset = saltOffset + SALT_LENGTH;
  const ciphertextOffset = ivOffset + IV_LENGTH;
  const salt = fileBytes.slice(saltOffset, ivOffset);
  const iv = fileBytes.slice(ivOffset, ciphertextOffset);
  const ciphertext = fileBytes.slice(ciphertextOffset);
  const key = await deriveKey(password, salt);

  try {
    const plaintext = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext,
    );

    return JSON.parse(textDecoder().decode(new Uint8Array(plaintext))) as FireExportPayload;
  } catch {
    throw new Error("Could not decrypt the backup. Check the password and try again.");
  }
}

export async function exportBudgetData() {
  const [categories, goals, transactions, recurringTemplates, savedScenarios, loans] = await Promise.all([
    db.budgetCategories.toArray(),
    db.goals.toArray(),
    db.transactions.toArray(),
    db.recurringTemplates.toArray(),
    db.savedScenarios.toArray(),
    db.loans.toArray(),
  ]);

  return {
    categories,
    goals,
    transactions,
    recurringTemplates,
    savedScenarios,
    loans,
  };
}

export async function importBudgetData(
  data: FireExportPayload["budgetData"],
  options?: { replaceExisting?: boolean },
) {
  if (options?.replaceExisting !== false) {
    await clearAllBudgetData();
  }

  await db.transaction(
    "rw",
    db.budgetCategories,
    db.goals,
    db.transactions,
    db.recurringTemplates,
    db.savedScenarios,
    db.loans,
    async () => {
    if (data.categories.length > 0) {
      await db.budgetCategories.bulkPut(data.categories);
    }
    if (data.goals.length > 0) {
      await db.goals.bulkPut(data.goals);
    }
    if (data.transactions.length > 0) {
      await db.transactions.bulkPut(data.transactions);
    }
      if ((data.recurringTemplates ?? []).length > 0) {
        await db.recurringTemplates.bulkPut(data.recurringTemplates);
      }
      if ((data.savedScenarios ?? []).length > 0) {
        await db.savedScenarios.bulkPut(data.savedScenarios);
      }
      if ((data.loans ?? []).length > 0) {
        await db.loans.bulkPut(data.loans);
      }
    },
  );

  if (data.categories.length === 0) {
    await initDefaultCategories();
  }
}

export async function clearAllBudgetData() {
  await db.transaction(
    "rw",
    db.budgetCategories,
    db.goals,
    db.transactions,
    db.recurringTemplates,
    db.savedScenarios,
    db.loans,
    async () => {
      await Promise.all([
        db.budgetCategories.clear(),
        db.goals.clear(),
        db.transactions.clear(),
        db.recurringTemplates.clear(),
        db.savedScenarios.clear(),
        db.loans.clear(),
      ]);
    },
  );
}

export async function exportToFile(calculatorInputs: CalculatorInputs, password: string) {
  if (!password.trim()) {
    throw new Error("A password is required to create an encrypted backup.");
  }

  const payload: FireExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    calculatorInputs,
    budgetData: await exportBudgetData(),
  };

  const bytes = await encryptPayload(payload, password);
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = payload.exportedAt.slice(0, 10);

  link.href = url;
  link.download = `retirement-plan-${timestamp}.fire`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function importFromFile(file: File, password: string) {
  if (!password.trim()) {
    throw new Error("A password is required to load an encrypted backup.");
  }

  const buffer = await file.arrayBuffer();
  return decryptPayload(new Uint8Array(buffer), password);
}
