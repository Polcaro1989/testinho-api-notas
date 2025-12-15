import express from 'express';
import invoiceRoutes from './routes/invoiceRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());
app.use('/invoices', invoiceRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Rota nao encontrada' });
});

app.use(errorHandler);

export default app;
