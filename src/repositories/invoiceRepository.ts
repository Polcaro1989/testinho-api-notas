import { db } from '../db';
import { Invoice } from '../models/invoice';

const columns = [
  'id',
  'cnpj',
  'municipio',
  'estado',
  'valorServico',
  'dataDesejadaEmissao',
  'descricaoServico',
  'status',
  'createdAt',
  'updatedAt',
  'numeroNF',
  'dataEmissao'
] as const;

type Column = (typeof columns)[number];

const selectAllColumns = columns.join(', ');

function toDbRow(invoice: Invoice): Record<Column, unknown> {
  return {
    ...invoice,
    numeroNF: invoice.numeroNF ?? null,
    dataEmissao: invoice.dataEmissao ?? null
  };
}

export async function create(invoice: Invoice): Promise<Invoice> {
  const stmt = db.prepare(
    `INSERT INTO invoices (${columns.join(', ')})
     VALUES (@id, @cnpj, @municipio, @estado, @valorServico, @dataDesejadaEmissao,
             @descricaoServico, @status, @createdAt, @updatedAt, @numeroNF, @dataEmissao)`
  );
  stmt.run(toDbRow(invoice));
  return invoice;
}

export async function list(): Promise<Invoice[]> {
  const stmt = db.prepare(`SELECT ${selectAllColumns} FROM invoices`);
  return stmt.all() as Invoice[];
}

export async function findById(id: string): Promise<Invoice | null> {
  const stmt = db.prepare(`SELECT ${selectAllColumns} FROM invoices WHERE id = ?`);
  const row = stmt.get(id);
  return (row as Invoice | undefined) ?? null;
}

export async function update(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  const current = await findById(id);
  if (!current) {
    return null;
  }

  const merged = { ...current, ...updates };

  const setters = columns
    .filter((col) => col !== 'id')
    .map((col) => `${col} = @${col}`)
    .join(', ');

  const stmt = db.prepare(`UPDATE invoices SET ${setters} WHERE id = @id`);
  stmt.run(toDbRow(merged as Invoice));

  return merged as Invoice;
}

export async function clearAll(): Promise<void> {
  db.exec('DELETE FROM invoices');
}
