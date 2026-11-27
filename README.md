# Manuali API — Node.js

API REST em Node.js para gerenciamento de usuários, artesãos, produtos, pedidos e administradores.

## Tecnologias

- [Node.js](https://nodejs.org/) (ES Modules)
- [Express](https://expressjs.com/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/) — documentação interativa em `/api-docs`
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — hash de senhas
- [cors](https://github.com/expressjs/cors)
- [node-fetch](https://github.com/node-fetch/node-fetch)
- [Vitest](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest) — testes automatizados
- [GitHub Actions](https://github.com/features/actions) — pipeline de CI

## Estrutura

```
src/
├── index.js              # Entrada da aplicação (listen)
├── app.js                # Montagem do app Express (usada também nos testes)
├── swagger.yaml          # Especificação OpenAPI 3.0
├── models/               # Modelos de domínio (memória)
│   ├── Adm.js
│   ├── Artesao.js
│   ├── ItemPedido.js
│   ├── Pedido.js
│   ├── Product.js
│   ├── User.js
│   └── index.js
├── routes/               # Rotas da API
│   ├── index.js
│   ├── adms.js
│   ├── artesaos.js
│   ├── pedidos.js
│   ├── products.js
│   └── usuarios.js
├── services/             # Regras de negócio
│   ├── index.js
│   ├── AdmService.js
│   ├── ArtesaoService.js
│   ├── PedidoService.js
│   ├── ProductService.js
│   └── UsuarioService.js
├── middleware/           # Middlewares
│   └── errorHandler.js
└── utils/                # Utilitários
    ├── asyncHandler.js
    └── errors.js

tests/                    # Testes automatizados (Vitest + Supertest)
├── api/                  # Integração HTTP (casos TC01–TC15)
├── unit/                 # Unitários (validator, errors, services)
└── helpers/              # Helpers de API e massa de dados

.github/workflows/ci.yml  # Pipeline de CI (GitHub Actions)
```

## Recursos (Endpoints)

| Recurso | Base |
|---------|------|
| Usuários | `GET/POST /api/usuarios` |
| Buscar usuário | `GET /api/usuarios/search?username=` |
| Usuário por ID | `GET/PUT/DELETE /api/usuarios/:id` |
| Produtos | `GET/POST /api/products` |
| Buscar produtos | `GET /api/products/search?nome=` |
| Produto por ID | `GET/PUT/DELETE /api/products/:id` |
| Pedidos | `GET/POST /api/pedidos` |
| Pedido por ID | `GET/PUT/DELETE /api/pedidos/:id` |
| Artesãos | `GET/POST /api/artesaos` |
| Buscar artesão | `GET /api/artesaos/search?username=` |
| Artesão por ID | `GET/PUT/DELETE /api/artesaos/:id` |
| Administradores | `GET/POST /api/adms` |
| Buscar admin | `GET /api/adms/search?username=` |
| Admin por ID | `GET/PUT/DELETE /api/adms/:id` |
| Health check | `GET /health` |
| Swagger | `GET /api-docs` |

## Como rodar

### Pré-requisitos
Node.js 18+ (recomendado)

### Instalação

```bash
npm install
```

### Scripts

| Script | Comando | Descrição |
|--------|---------|-----------|
| `start` | `node src/index.js` | Inicia em produção |
| `dev` | `node --watch src/index.js` | Inicia em modo desenvolvimento com recarga automática |
| `test` | `vitest run` | Executa a suíte uma vez |
| `test:watch` | `vitest` | Executa em modo watch |
| `test:coverage` | `vitest run --coverage` | Executa com cobertura |
| `test:ci` | `vitest run --coverage` | Cobertura + JUnit (usado no CI) |

### Executar

```bash
# Produção
npm start

# Desenvolvimento
npm run dev
```

O servidor ficará disponível em: `http://localhost:3000`

Documentação interativa (Swagger): `http://localhost:3000/api-docs`

Health check: `http://localhost:3000/health`

## Testes

A suíte automatizada cobre os casos **TC01–TC15** do Relatório de Execução e
roda contra o app Express real (sem abrir porta), via Vitest + Supertest.

```bash
npm test              # execução única
npm run test:watch    # modo watch
npm run test:coverage # cobertura
npm run test:ci       # cobertura + relatório JUnit
```

O mapeamento caso a caso (TC → teste), o tratamento de defeitos conhecidos
(`expected-fail`) e o funcionamento do pipeline estão em
[`TESTING.md`](./TESTING.md).

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3000` | Porta do servidor |

Exemplo:
```bash
PORT=4000 npm start
```

## Módulo de IA — Entrega AV2

Módulo de recomendação/busca inteligente de produtos artesanais do Manuali. O módulo recebe uma entrada (ID de produto ou consulta textual), consulta os dados do catálogo **apenas por funções de acesso** e devolve recomendações. Quando um provedor LLM OpenAI-compatible está configurado, a IA gera a justificativa; sem LLM, o módulo usa fallback local por regra simples (similaridade de categoria/busca textual), garantindo repetibilidade.

### 1) Como instalar e rodar

Pré-requisitos: Node.js 20+.

```bash
npm install
npm run dev
```

Servidor padrão: `http://localhost:3001` (ou `PORT` definido no `.env`).  
Swagger: `http://localhost:3001/api-docs`.  
Health: `http://localhost:3001/health`.

> O módulo de IA funciona sem banco externo e sem chave de LLM: os dados estão mockados em `src/data/produtos-ia.json` e o serviço usa fallback local quando a IA externa não está disponível.

### 2) Mini dicionário de dados

Arquivo: `src/data/produtos-ia.json` (12 registros, sem dados pessoais reais).

| Campo | Tipo | Significado no negócio |
|---|---|---|
| `id` | string | Identificador único do produto no catálogo. Usado para buscar/recomendar um item específico. |
| `nome` | string | Nome comercial do produto exibido ao cliente. |
| `descricao` | string | Descrição curta do produto; ajuda a identificar material, uso e apelo comercial. |
| `preco` | number | Preço unitário do produto em reais (R$). |
| `categoria` | string | Categoria artesanal do produto (ex.: Cerâmica, Biojoias). Usada para similaridade/recomendação. |
| `estoque` | number | Quantidade disponível para venda; indica disponibilidade do item. |
| `ativo` | boolean | Indica se o produto está ativo no catálogo e pode ser recomendado. |
| `artesaoId` | string | Identificador interno do artesão responsável pela peça (sem dado pessoal). |
| `historia` | string | Contexto/história da peça; agrega valor e pode ser usado na justificativa da recomendação. |

**Caso difícil incluído:** `prod-012` ("Miniatura de Barco em Escama de Peixe") está na categoria `Arte Pesqueira`, única no catálogo, sem itens semelhantes da mesma categoria. Também há o caso de identificador inexistente (`prod-999`) tratado pelas funções/serviço.

### 3) Funções de acesso

Arquivo: `src/services/IADataAccess.js`. O módulo de IA (`IARecomendacaoService`) chega aos dados **somente** por essas funções; rotas/ferramentas não abrem o JSON diretamente.

| Função | Parâmetros | Retorno | Tratamento de não encontrado/erro | Valor ao cliente |
|---|---|---|---|---|
| `buscarProdutoPorIdIA(id, origem)` | `id`, `origem` | Objeto do produto ou `null` | Se ID não existe, retorna `null` e registra log com `quantidadeRetornada: 0`. Erros de leitura/parse geram log com `sucesso:false` e exceção clara. | Permite localizar o produto base para recomendação por item. |
| `listarProdutosAtivosIA(origem)` | `origem` | Array de produtos ativos (pode ser vazio) | Retorna `[]` quando não há ativos; erros são logados com `sucesso:false`. | Fornece candidatos do catálogo para recomendação/busca. |
| `buscarProdutosPorCategoriaIA(categoria, origem)` | `categoria`, `origem` | Array de produtos ativos da categoria (pode ser vazio) | Categoria vazia/sem match retorna `[]`; erros são logados com `sucesso:false`. | Permite filtrar candidatos por categoria artesanal. |

**Experiência simples (dado alterado muda resposta):**
1. Chame `GET /api/recomendacoes/ia/produto/prod-001?limite=2` e observe as recomendações.
2. Edite `src/data/produtos-ia.json`, alterando a `categoria` de `prod-002` de `"Cerâmica"` para `"Decoração"`.
3. Chame o mesmo endpoint novamente: `prod-002` deixa de ser priorizado como "mesma categoria" no fallback local (ou muda o contexto enviado à IA).
4. Revertar a alteração após o teste.

### 4) Como gerar o log com três chamadas repetíveis

O log é gravado em `logs/ia-uso-dados.jsonl` (uma linha JSON por chamada de função de acesso, sem apagar anteriores). Para começar limpo, apague o arquivo antes do teste.

#### Opção A — via API (professor pode repetir)

Com o servidor rodando (`npm run dev`):

```bash
# Limpar log (Linux/macOS/Git Bash)
rm -f logs/ia-uso-dados.jsonl

# 1) Produto existente (gera buscarProdutoPorIdIA + listarProdutosAtivosIA)
curl "http://localhost:3001/api/recomendacoes/ia/produto/prod-001?limite=2"

# 2) Caso difícil: produto sem similares da mesma categoria (Arte Pesqueira)
curl "http://localhost:3001/api/recomendacoes/ia/produto/prod-012?limite=2"

# 3) Caso difícil: identificador inexistente (tratamento claro de não encontrado)
curl "http://localhost:3001/api/recomendacoes/ia/produto/prod-999?limite=2"
```

PowerShell (alternativa):

```powershell
Remove-Item logs\ia-uso-dados.jsonl -ErrorAction SilentlyContinue
Invoke-RestMethod "http://localhost:3001/api/recomendacoes/ia/produto/prod-001?limite=2"
Invoke-RestMethod "http://localhost:3001/api/recomendacoes/ia/produto/prod-012?limite=2"
try { Invoke-RestMethod "http://localhost:3001/api/recomendacoes/ia/produto/prod-999?limite=2" } catch { $_.Exception.Message }
```

#### Opção B — sem subir servidor (repete o mesmo módulo/funções)

```bash
node --input-type=module -e "import fs from 'fs'; fs.rmSync('logs/ia-uso-dados.jsonl',{force:true}); import svc from './src/services/IARecomendacaoService.js'; const o='rota:GET /api/recomendacoes/ia/produto/:id'; console.log(await svc.recomendarPorProduto('prod-001',2,o)); console.log(await svc.recomendarPorProduto('prod-012',2,o)); try{await svc.recomendarPorProduto('prod-999',2,o)}catch(e){console.log(e.message)}"
```

### 5) Como ver o resumo

```bash
node scripts/ia-resumo-log.js
```

O script lê `logs/ia-uso-dados.jsonl` e mostra: total de chamadas, erros, chamadas por função, registros mais consultados por ID, registros nunca consultados por ID e respostas sugeridas para (a)(b)(c).

### 6) Respostas (a), (b), (c)

Com base no log gerado pelas 3 chamadas acima (5 linhas de acesso a dados):

- **(a) Qual dado o módulo mais usa?** A função mais usada foi `buscarProdutoPorIdIA` (3 chamadas), seguida de `listarProdutosAtivosIA` (2 chamadas). Isso mostra que o módulo consulta primeiro o produto base por ID e depois carrega o catálogo ativo para montar os candidatos de recomendação.
- **(b) Algum dado nunca foi usado — o que isso sugere?** Os registros `prod-002` a `prod-011` não foram consultados diretamente por ID (apenas `prod-001`, `prod-012` e `prod-999` foram passados como ID). Isso sugere que os cenários de teste focaram em casos específicos; os demais itens só entraram indiretamente como candidatos no `listarProdutosAtivosIA`, não como alvo direto da busca por ID.
- **(c) Houve erro — por quê?** Não houve erro nas funções de acesso (`sucesso:true` em todas as 5 linhas). O caso `prod-999` (ID inexistente) foi tratado de forma controlada: `buscarProdutoPorIdIA` retornou `quantidadeRetornada: 0` e o serviço respondeu com erro claro `Produto com Id prod-999 não foi encontrado.`.

### 7) Declaração de uso de IA generativa

Foi utilizada IA generativa (assistente de codificação/modelo de linguagem) para apoiar a implementação do módulo, estruturação do logger/resumo e redação desta documentação. O código, os dados mockados, os testes manuais e a validação do comportamento foram revisados pela equipe.

## Licença

MIT
