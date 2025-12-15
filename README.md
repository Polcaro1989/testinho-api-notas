# API de Solicitacoes de Notas Fiscais

API HTTP em Node.js/TypeScript (Express) para criar, listar, buscar, emitir e cancelar solicitacoes de Nota Fiscal. Persistencia em SQLite (arquivo), sem servidor de banco externo.

## Requisitos
- Node.js >= 20
- npm

## Instalacao
```bash
npm install
```

## Execucao
- Desenvolvimento (hot reload): `npm run dev`
- Producao: `npm run build && npm start`
- Porta padrao: `3000` (ajuste `PORT` se quiser)
- Banco: arquivo SQLite em `data/invoices.db` (padrao). Para customizar: `INVOICE_DB_PATH`.

## Testes
```bash
npm test
```
- Suite `tests/invoice.spec.ts`: cria, lista, busca, emite (sucesso e erro 400 simulado), cancela pendente e bloqueia cancelamento de emitidas.
- Rodar teste especifico: `npm test -- --testNamePattern "texto do teste"` ou `npx jest tests/invoice.spec.ts -t "texto do teste"`.

## Endpoints
Base: `http://localhost:3000`

- `POST /invoices`  
  Corpo:
  ```json
  {
    "cnpj": "12345678901234",
    "municipio": "Sao Paulo",
    "estado": "SP",
    "valorServico": 1000,
    "dataDesejadaEmissao": "2025-12-31T10:00:00.000Z",
    "descricaoServico": "Servico de consultoria"
  }
  ```
  Retorna 201 com status inicial `PENDENTE_EMISSAO`.

- `GET /invoices`  
  Lista todas as solicitacoes persistidas.

- `GET /invoices/:id`  
  Busca uma solicitacao.

- `POST /invoices/:id/emit`  
  Chama a API externa `https://api.drfinancas.com/testes/notas-fiscais` com header `Authorization: 87451e7c-48bc-48d1-a038-c16783dd404c`.  
  Sucesso (200): salva `numeroNF`, `dataEmissao`, status `EMITIDA`.  
  Erros 400/401/500 retornam mensagens adequadas.

- `POST /invoices/:id/cancel`  
  Cancela solicitacoes pendentes (bloqueia se emitida).

### Exemplos com curl
- Criar
```bash
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -d '{"cnpj":"12345678901234","municipio":"Sao Paulo","estado":"SP","valorServico":1000,"dataDesejadaEmissao":"2025-12-31T10:00:00.000Z","descricaoServico":"Servico de consultoria"}'
```
- Listar
```bash
curl http://localhost:3000/invoices
```
- Buscar
```bash
curl http://localhost:3000/invoices/{id}
```
- Emitir
```bash
curl -X POST http://localhost:3000/invoices/{id}/emit
```
- Cancelar
```bash
curl -X POST http://localhost:3000/invoices/{id}/cancel
```

## Status suportados
- `PENDENTE_EMISSAO` (inicial)
- `EMITIDA`
- `CANCELADA`

## Notas
- A API externa e usada apenas no fluxo de emissao; demais operacoes sao locais.
- Para resetar dados: pare o servidor e apague `data/invoices.db` (ou o caminho de `INVOICE_DB_PATH`); sera recriado ao subir.
- Logs/erros: console do servidor.
- Retornos esperados:
  - Criar: 201
  - Listar/Buscar: 200 (404 se id inexistente)
  - Emitir: 200 com `numeroNF`/`dataEmissao`/`EMITIDA`, ou 400/401/500 conforme externo; 400 se tentar emitir cancelada/ja emitida
  - Cancelar: 200 se pendente, 400 se emitida ou ja cancelada, 404 se id inexistente

## Variaveis de ambiente
- `PORT`: porta (padrao 3000).
- `INVOICE_DB_PATH`: caminho do arquivo SQLite (padrao `./data/invoices.db` relativo ao cwd).

## Passo a passo rapido (Thunder/Postman)
- GET `http://localhost:3000/invoices` (Headers: `Content-Type: application/json` opcional)
- POST `http://localhost:3000/invoices` (Headers: `Content-Type: application/json`, Body conforme exemplo)
- GET `http://localhost:3000/invoices/{id}`
- POST `http://localhost:3000/invoices/{id}/emit` (sem body)
- POST `http://localhost:3000/invoices/{id}/cancel` (sem body)

## Para testar com dados existentes
- `GET /invoices` para pegar ids.
- `GET /invoices/{id}` para detalhar.
- `POST /invoices/{id}/emit` para emitir.
- `POST /invoices/{id}/cancel` para cancelar se pendente.

## Diagrama de arquitetura (processo assincrono com status em tempo real)
```
[Cliente SPA/Mobile]
      | (POST /acao-lenta) -> jobId
      v
[API Gateway/Orquestrador] -- grava status inicial --> [Status Store (Redis/DB)]
      | (enqueue job)                                        ^
      v                                                      |
 [Fila/Mensageria] --> [Workers A | B | C] -- atualiza --> [Status Store]
                                  |                         |
                  [Status Streamer WS/SSE] ---- push ------>|
                         (fallback: GET /status/{jobId})
```
- Cliente assina WS/SSE (ou polling) com o jobId para ver o ultimo status.
- Workers atualizam a Status Store a cada passo; TTL limpa registros antigos.
- Autenticacao/autorizacao nos canais de status.
