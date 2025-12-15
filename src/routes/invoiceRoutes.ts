import { Router } from 'express';
import {
  createInvoice,
  emitInvoice,
  cancelInvoice,
  getInvoice,
  listInvoices
} from '../controllers/invoiceController';

const router = Router();

router.post('/', createInvoice);
router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.post('/:id/emit', emitInvoice);
router.post('/:id/cancel', cancelInvoice);

export default router;
