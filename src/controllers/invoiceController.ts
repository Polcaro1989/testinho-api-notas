import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoiceService';

export async function createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function listInvoices(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoices = await invoiceService.listInvoices();
    res.json(invoices);
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function emitInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.emitInvoice(req.params.id);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function cancelInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.cancelInvoice(req.params.id);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}
