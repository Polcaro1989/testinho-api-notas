import request from 'supertest';
import app from '../src/app';

const buildPayload = () => ({
  cnpj: '12345678901234',
  municipio: 'Sao Paulo',
  estado: 'SP',
  valorServico: 1000,
  dataDesejadaEmissao: new Date().toISOString(),
  descricaoServico: 'Servico de consultoria'
});

describe('Invoices API', () => {
  it('cria uma solicitacao de nota fiscal', async () => {
    const response = await request(app).post('/invoices').send(buildPayload());

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.status).toBe('PENDENTE_EMISSAO');
    expect(response.body.createdAt).toBeDefined();
  });

  it('lista solicitacoes existentes', async () => {
    await request(app).post('/invoices').send(buildPayload());
    const listResponse = await request(app).get('/invoices');

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBeGreaterThanOrEqual(1);
  });

  it('busca uma solicitacao pelo id', async () => {
    const createResponse = await request(app).post('/invoices').send(buildPayload());
    const id = createResponse.body.id;

    const getResponse = await request(app).get(`/invoices/${id}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(id);
  });

  it('emite uma nota fiscal e atualiza o status', async () => {
    const createResponse = await request(app).post('/invoices').send(buildPayload());
    const id = createResponse.body.id;
    const dataEmissao = new Date().toISOString();

    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          numeroNF: 'NF-123',
          dataEmissao
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      ) as unknown as Response
    );

    const emitResponse = await request(app).post(`/invoices/${id}/emit`);

    expect(emitResponse.status).toBe(200);
    expect(emitResponse.body.status).toBe('EMITIDA');
    expect(emitResponse.body.numeroNF).toBe('NF-123');
  });

  it('retorna erro quando emissor externo responde 400', async () => {
    const createResponse = await request(app).post('/invoices').send(buildPayload());
    const id = createResponse.body.id;

    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 400
      }) as unknown as Response
    );

    const emitResponse = await request(app).post(`/invoices/${id}/emit`);

    expect(emitResponse.status).toBe(400);
    expect(emitResponse.body.message).toMatch(/dados invalidos/i);
  });

  it('cancela uma solicitacao pendente', async () => {
    const createResponse = await request(app).post('/invoices').send(buildPayload());
    const id = createResponse.body.id;

    const cancelResponse = await request(app).post(`/invoices/${id}/cancel`);

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.status).toBe('CANCELADA');
  });

  it('nao cancela uma solicitacao ja emitida', async () => {
    const createResponse = await request(app).post('/invoices').send(buildPayload());
    const id = createResponse.body.id;
    const dataEmissao = new Date().toISOString();

    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          numeroNF: 'NF-123',
          dataEmissao
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      ) as unknown as Response
    );

    await request(app).post(`/invoices/${id}/emit`);

    const cancelResponse = await request(app).post(`/invoices/${id}/cancel`);

    expect(cancelResponse.status).toBe(400);
    expect(cancelResponse.body.message).toMatch(/nao e possivel cancelar/i);
  });
});
