# Testes automatizados — Manuali API

Automação dos casos de teste do **Relatório de Execução** (rodada 08/11–09/11)
usando **Vitest** + **Supertest**. Os testes exercitam o app Express real
(`src/app.js`) sem abrir porta, então rodam rápido e de forma determinística no
CI.

## Como rodar

```bash
npm install
npm test              # execução única
npm run test:watch    # modo watch
npm run test:coverage # cobertura (texto + lcov)
npm run test:ci       # cobertura + relatório JUnit (usado no CI)
```

Relatórios gerados:

- `reports/junit.xml` — resultado por teste (consumido pelo GitHub Actions)
- `coverage/` — `lcov-report/`, `lcov.info`, `coverage-summary.json`

## Estrutura

```
tests/
├── helpers/api.js          # app real, dados únicos e helpers de criação
├── api/                    # integração HTTP (mapeada aos TCs)
│   ├── health.test.js
│   ├── usuarios.test.js    # TC01, TC02/DEF04
│   ├── auth.test.js        # TC03, TC04
│   ├── artesaos.test.js    # TC05
│   ├── products.test.js    # TC06, TC08, TC09
│   ├── adms.test.js        # TC07/DEF01
│   ├── carrinho.test.js    # TC10/DEF02
│   ├── pedidos.test.js     # TC11, TC13, TC14
│   └── avaliacoes.test.js  # TC15/DEF03
└── unit/
    ├── validator.test.js
    ├── errors.test.js
    └── services/AdmService.test.js
```

## Rastreabilidade: relatório → automação

| Caso | Cenário do relatório | Teste automatizado | Resultado |
|------|----------------------|--------------------|-----------|
| TC01 | Criar usuário (201 + dados) | `api/usuarios.test.js` | ✅ |
| TC02 | Validação de obrigatórios + duplicidade | `api/usuarios.test.js` | ✅ (duplicidade hoje retorna 409) |
| TC03 | Login válido (200 + token + papel) | `api/auth.test.js` | ✅ |
| TC04 | Senha incorreta (400) | `api/auth.test.js` | ✅ |
| TC05 | Cadastro de artesão (201 + CPF) | `api/artesaos.test.js` | ✅ |
| TC06 | Cadastro de produto (categoria/fotos/história) | `api/products.test.js` | ✅ |
| TC07 | Admin sem autenticação | `api/adms.test.js` | ⚠️ expected-fail (DEF01) |
| TC08 | Listar produtos | `api/products.test.js` | ✅ |
| TC09 | Produto por ID | `api/products.test.js` | ✅ |
| TC10 | Operações de carrinho | `api/carrinho.test.js` | ✅ (com massa própria) |
| TC11 | Checkout com estoque insuficiente | `api/pedidos.test.js` | ✅ |
| TC12 | (sem registro no relatório) | — | — |
| TC13 | Regra de estoque (baixa + bloqueio) | `api/pedidos.test.js` | ✅ |
| TC14 | Listar/consultar pedidos | `api/pedidos.test.js` | ✅ (com massa própria) |
| TC15 | Avaliações por produto | `api/avaliacoes.test.js` | ✅ (com massa própria) |

> Observação: no relatório, TC10/TC14/TC15 falharam por **ausência de massa**
> (produto/pedido/avaliação inexistentes). A automação cria a massa necessária
> antes de cada cenário, então valida o comportamento real da API.

## Defeitos conhecidos (expected-fail)

Para manter o pipeline **verde** sem esconder problemas, defeitos abertos são
documentados com `it.fails(...)` e comentário com o ID do defeito:

| Defeito | Caso | Teste | Estado |
|---------|------|-------|--------|
| DEF01 | TC07 — admin sem autenticação | `api/adms.test.js` | expected-fail |
| DEF02 | TC10/TC11 — carrinho/estoque | coberto com massa própria | — |
| DEF03 | TC14/TC15 — pedidos/avaliações vazios | coberto com massa própria | — |
| DEF04 | TC02 — cadastro duplicado | `api/usuarios.test.js` | ✅ corrigido no código atual |

Quando um defeito for corrigido, o `it.fails` correspondente **falhará** de
propósito. Nesse momento, troque `it.fails` por `it` para transformá-lo em
teste de regressão normal.

### Defeito adicional encontrado pela automação

Durante a execução, a automação revelou um bug de **lock envenenado** em
`AdmService`, `UsuarioService`, `ArtesaoService` e `PedidoService`: após uma
operação que falhava (ex.: duplicidade), a fila (`#cadastroLock`/`#pedidoLock`)
ficava rejeitada e contaminava todas as operações seguintes. O padrão foi
corrigido para manter a fila utilizável (`operacao.catch(() => {})`).

## Pipeline (GitHub Actions)

`.github/workflows/ci.yml` executa em `push`/`pull_request` para `main`,
`master` e `dio`:

1. **Matriz Node 20 e 22** — `npm ci` + `npm run test:ci`.
2. **Cobertura** com gate mínimo: 70% statements/functions/lines e 60% branches.
3. **Relatório JUnit** publicado no PR (dorny/test-reporter) e artefatos
   (`coverage/`, `reports/`) enviados por job.
4. **Smoke test** — sobe `node src/index.js`, aguarda e valida `GET /health`.

## Como adicionar novos casos

1. Crie `tests/api/<recurso>.test.js`.
2. Use `api`, `dadosUnicos`, `criarUsuario`, `criarProduto`, etc. de
   `tests/helpers/api.js`.
3. Nomeie o `it` com o ID do caso (ex.: `TC16: ...`) para manter a
   rastreabilidade com o relatório.
4. Rode `npm test` e depois `npm run test:ci`.
