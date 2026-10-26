import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import { usuariosRouter, productsRouter, pedidosRouter, artesaosRouter, admsRouter } from './src/routes/index.js';

const app = express();
const PORT = 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/usuarios', usuariosRouter);
app.use('/api/products', productsRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/artesaos', artesaosRouter);
app.use('/api/adms', admsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);

  // Testar endpoint de pedidos
  try {
    const fetch = (await import('node-fetch')).default;

    // Criar produto
    const prodRes = await fetch(`http://localhost:${PORT}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Teste', preco: 10, estoque: 5, ativo: true })
    });
    const produto = await prodRes.json();
    console.log('Produto criado:', produto);

    // Criar pedido
    const pedidoRes = await fetch(`http://localhost:${PORT}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: [{ idProduto: produto.id, quantidade: 2 }], cep: '12345-678' })
    });
    const pedido = await pedidoRes.json();
    console.log('Pedido criado:', pedido);

    console.log('✅ Teste bem-sucedido!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
});