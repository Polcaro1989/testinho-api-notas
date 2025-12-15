"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
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
        const response = await (0, supertest_1.default)(app_1.default).post('/invoices').send(buildPayload());
        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.status).toBe('PENDENTE_EMISSAO');
        expect(response.body.createdAt).toBeDefined();
    });
    it('lista solicitacoes existentes', async () => {
        await (0, supertest_1.default)(app_1.default).post('/invoices').send(buildPayload());
        const listResponse = await (0, supertest_1.default)(app_1.default).get('/invoices');
        expect(listResponse.status).toBe(200);
        expect(Array.isArray(listResponse.body)).toBe(true);
        expect(listResponse.body.length).toBeGreaterThanOrEqual(1);
    });
    it('busca uma solicitacao pelo id', async () => {
        const createResponse = await (0, supertest_1.default)(app_1.default).post('/invoices').send(buildPayload());
        const id = createResponse.body.id;
        const getResponse = await (0, supertest_1.default)(app_1.default).get(`/invoices/${id}`);
        expect(getResponse.status).toBe(200);
        expect(getResponse.body.id).toBe(id);
    });
    it('emite uma nota fiscal e atualiza o status', async () => {
        const createResponse = await (0, supertest_1.default)(app_1.default).post('/invoices').send(buildPayload());
        const id = createResponse.body.id;
        const dataEmissao = new Date().toISOString();
        jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
            numeroNF: 'NF-123',
            dataEmissao
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        const emitResponse = await (0, supertest_1.default)(app_1.default).post(`/invoices/${id}/emit`);
        expect(emitResponse.status).toBe(200);
        expect(emitResponse.body.status).toBe('EMITIDA');
        expect(emitResponse.body.numeroNF).toBe('NF-123');
    });
    it('retorna erro quando emissor externo responde 400', async () => {
        const createResponse = await (0, supertest_1.default)(app_1.default).post('/invoices').send(buildPayload());
        const id = createResponse.body.id;
        jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, {
            status: 400
        }));
        const emitResponse = await (0, supertest_1.default)(app_1.default).post(`/invoices/${id}/emit`);
        expect(emitResponse.status).toBe(400);
        expect(emitResponse.body.message).toMatch(/dados invalidos/i);
    });
});
//# sourceMappingURL=invoice.spec.js.map