# Manuali API — Node.js

API REST em Node.js para gerenciamento de usuários, artesãos, produtos, pedidos e administradores.

## Tecnologias

- [Node.js](https://nodejs.org/) (ES Modules)
- [Express](https://expressjs.com/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/) — documentação interativa em `/api-docs`
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — hash de senhas
- [cors](https://github.com/expressjs/cors)
- [node-fetch](https://github.com/node-fetch/node-fetch)

## Estrutura

```
src/
├── index.js              # Entrada da aplicação
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

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3000` | Porta do servidor |

Exemplo:
```bash
PORT=4000 npm start
```

## Licença

MIT
