import crypto from 'crypto';
import { ApiError } from '../errors/ApiError';
import {
  Invoice,
  InvoicePayload,
  InvoiceStatus,
  invoicePayloadSchema
} from '../models/invoice';
import * as invoiceRepository from '../repositories/invoiceRepository';

const EXTERNAL_EMISSION_URL = 'https://api.drfinancas.com/testes/notas-fiscais';
const AUTHORIZATION_KEY = '87451e7c-48bc-48d1-a038-c16783dd404c';

function nowIso(): string {
  return new Date().toISOString();
}

export async function createInvoice(rawPayload: unknown): Promise<Invoice> {
  const payload = invoicePayloadSchema.parse(rawPayload);
  const timestamp = nowIso();

  const invoice: Invoice = {
    id: crypto.randomUUID(),
    ...payload,
    status: 'PENDENTE_EMISSAO',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await invoiceRepository.create(invoice);
  return invoice;
}

export async function listInvoices(): Promise<Invoice[]> {
  return invoiceRepository.list();
}

export async function getInvoice(id: string): Promise<Invoice> {
  const invoice = await invoiceRepository.findById(id);
  if (!invoice) {
    throw new ApiError(404, 'Solicitacao nao encontrada');
  }
  return invoice;
}

export async function emitInvoice(id: string): Promise<Invoice> {
  const invoice = await getInvoice(id);

  if (invoice.status === 'EMITIDA') {
    throw new ApiError(400, 'A solicitacao ja foi emitida');
  }
  if (invoice.status === 'CANCELADA') {
    throw new ApiError(400, 'A solicitacao esta cancelada');
  }

  const payload: InvoicePayload = {
    cnpj: invoice.cnpj,
    municipio: invoice.municipio,
    estado: invoice.estado,
    valorServico: invoice.valorServico,
    dataDesejadaEmissao: invoice.dataDesejadaEmissao,
    descricaoServico: invoice.descricaoServico
  };

  const response = await fetch(EXTERNAL_EMISSION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTHORIZATION_KEY
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 200) {
    const { numeroNF, dataEmissao } = (await response.json()) as {
      numeroNF: string;
      dataEmissao: string;
    };

    const updatedInvoice: Partial<Invoice> = {
      numeroNF,
      dataEmissao,
      status: 'EMITIDA',
      updatedAt: nowIso()
    };

    const saved = await invoiceRepository.update(id, updatedInvoice);
    if (!saved) {
      throw new ApiError(404, 'Solicitacao nao encontrada apos emissao');
    }
    return saved;
  }

  if (response.status === 400) {
    throw new ApiError(400, 'Erro ao emitir nota fiscal: dados invalidos');
  }
  if (response.status === 401) {
    throw new ApiError(401, 'Erro ao emitir nota fiscal: nao autorizado');
  }
  if (response.status === 500) {
    throw new ApiError(502, 'Erro ao emitir nota fiscal: servico externo indisponivel');
  }

  throw new ApiError(response.status, 'Falha ao emitir nota fiscal');
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  const invoice = await getInvoice(id);

  if (invoice.status === 'EMITIDA') {
    throw new ApiError(400, 'Nao e possivel cancelar uma solicitacao ja emitida');
  }
  if (invoice.status === 'CANCELADA') {
    throw new ApiError(400, 'A solicitacao ja esta cancelada');
  }

  const updated = await invoiceRepository.update(id, {
    status: 'CANCELADA',
    updatedAt: nowIso()
  });

  if (!updated) {
    throw new ApiError(404, 'Solicitacao nao encontrada');
  }

  return updated;
}
