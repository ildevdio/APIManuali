import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
  usuariosRouter,
  productsRouter,
  pedidosRouter,
  artesaosRouter,
  admsRouter,
  authRouter,
  carrinhoRouter,
  avaliacoesRouter,
  recomendacoesRouter,
  adminRouter
} from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monta a aplicação Express sem abrir porta. Assim os testes usam o mesmo app
// de produção via supertest, e o src/index.js só é responsável por escutar.
export function createApp() {
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());

  // Swagger documentation
  try {
    const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (e) {
    console.warn('Swagger documentation not available:', e.message);
  }

  // Routes
  app.use('/api/usuarios', usuariosRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/pedidos', pedidosRouter);
  app.use('/api/artesaos', artesaosRouter);
  app.use('/api/adms', admsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/carrinho', carrinhoRouter);
  app.use('/api/avaliacoes', avaliacoesRouter);
  app.use('/api/recomendacoes', recomendacoesRouter);
  app.use('/api/admin', adminRouter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
