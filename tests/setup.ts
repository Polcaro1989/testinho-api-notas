import fs from 'fs';
import path from 'path';

const testDbPath = path.resolve(__dirname, 'tmp', 'invoices.test.db');

process.env.INVOICE_DB_PATH = testDbPath;

fs.mkdirSync(path.dirname(testDbPath), { recursive: true });

try {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
} catch {
  /* ignore initial cleanup errors */
}

beforeEach(async () => {
  const repository = await import('../src/repositories/invoiceRepository');
  await repository.clearAll();
});

afterEach(() => {
  jest.restoreAllMocks();
});
