import { z } from 'zod';

export const invoiceStatuses = ['PENDENTE_EMISSAO', 'EMITIDA', 'CANCELADA'] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];

export const invoicePayloadSchema = z.object({
  cnpj: z.string().trim().min(1, 'CNPJ e obrigatorio'),
  municipio: z.string().trim().min(1, 'Municipio e obrigatorio'),
  estado: z.string().trim().min(1, 'Estado e obrigatorio'),
  valorServico: z.number().positive('Valor do servico deve ser positivo'),
  dataDesejadaEmissao: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Data desejada invalida'),
  descricaoServico: z.string().trim().min(1, 'Descricao e obrigatoria')
});

export type InvoicePayload = z.infer<typeof invoicePayloadSchema>;

export interface Invoice extends InvoicePayload {
  id: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  numeroNF?: string;
  dataEmissao?: string;
}
