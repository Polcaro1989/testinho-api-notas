import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbFile =
  process.env.INVOICE_DB_PATH || path.resolve(process.cwd(), 'data', 'invoices.db');

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const createTableSQL = `
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    cnpj TEXT NOT NULL,
    municipio TEXT NOT NULL,
    estado TEXT NOT NULL,
    valorServico REAL NOT NULL,
    dataDesejadaEmissao TEXT NOT NULL,
    descricaoServico TEXT NOT NULL,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    numeroNF TEXT,
    dataEmissao TEXT
  );
`;

function initDatabase(filePath: string): DatabaseType {
  let instance: DatabaseType | null = null;
  try {
    instance = new Database(filePath);
    instance.exec(createTableSQL);
    return instance;
  } catch (error) {
    if (instance) {
      try {
        instance.close();
      } catch {
        /* ignore */
      }
    }

    if (error instanceof Error && error.message.includes('file is not a database')) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        /* ignore unlink errors */
      }
      instance = new Database(filePath);
      instance.exec(createTableSQL);
      return instance;
    }
    throw error;
  }
}

export const db: DatabaseType = initDatabase(dbFile);
