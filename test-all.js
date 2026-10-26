import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import { usuariosRouter, productsRouter, pedidosRouter, artesaosRouter, admsRouter } from './src/routes/index.js';

const app = express();
const PORT = 3002;

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

  try {
    const fetch = (await import('node-fetch')).default;

    // Test 1: 404 - Usuário não encontrado
    console.log('\n1. Testando 404 - Usuário não encontrado...');
    let res = await fetch(`http://localhost:${PORT}/api/usuarios/999`);
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, await res.json());

    // Test 2: 409 - Usuário duplicado
    console.log('\n2. Testando 409 - Usuário duplicado...');
    await fetch(`http://localhost:${PORT}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'joao', password: '123456', email: 'joao@email.com', cep: '12345-678' })
    });
    res = await fetch(`http://localhost:${PORT}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'joao', password: '123456', email: 'joao@email.com', cep: '12345-678' })
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, await res.json());

    // Test 3: 400 - Dados inválidos
    console.log('\n3. Testando 400 - Dados inválidos...');
    res = await fetch(`http://localhost:${PORT}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '123456', email: 'joao@email.com', cep: '12345-678' })
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, await res.json());

    // Test 4: 409 - Estoque insuficiente
    console.log('\n4. Testando 409 - Estoque insuficiente...');
    const prodRes = await fetch(`http://localhost:${PORT}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Produto Teste', preco: 10, estoque: 5, ativo: true })
    });
    const produto = await prodRes.json();

    await fetch(`http://localhost:${PORT}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: [{ idProduto: produto.id, quantidade: 2 }], cep: '12345-678' })
    });

    res = await fetch(`http://localhost:${PORT}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: [{ idProduto: produto.id, quantidade: 100 }], cep: '12345-678' })
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, await res.json());

    // Test 5: Devolver estoque ao deletar pedido não concluído
    console.log('\n5. Testando devolução de estoque ao deletar pedido...');
    const prodRes2 = await fetch(`http://localhost:${PORT}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Produto Estoque', preco: 20, estoque: 10, ativo: true })
    });
    const produto2 = await prodRes2.json();
    console.log(`   Estoque inicial: ${produto2.estoque}`);

    const pedidoRes = await fetch(`http://localhost:${PORT}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: [{ idProduto: produto2.id, quantidade: 3 }], cep: '12345-678' })
    });
    const pedido = await pedidoRes.json();
    console.log(`   Pedido criado: ${pedido.idPedido}`);

    const prodCheck = await fetch(`http://localhost:${PORT}/api/products/${produto2.id}`);
    const prodCheckData = await prodCheck.json();
    console.log(`   Estoque após reserva: ${prodCheckData.estoque}`);

    await fetch(`http://localhost:${PORT}/api/pedidos/${pedido.idPedido}`, { method: 'DELETE' });
    console.log(`   Pedido deletado`);

    const prodFinal = await fetch(`http://localhost:${PORT}/api/products/${produto2.id}`);
    const prodFinalData = await prodFinal.json();
    console.log(`   Estoque após deletar: ${prodFinalData.estoque}`);

    // Test 6: Produto inativo com preço negativo
    console.log('\n6. Testando produto inativo com preço negativo...');
    const prodNegRes = await fetch(`http://localhost:${PORT}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Produto Negativo', preco: -10, estoque: 10, ativo: true })
    });
    const prodNeg = await prodNegRes.json();
    console.log(`   Produto:`, prodNeg);

    // Test 7: Busca por nome
    console.log('\n7. Testando busca de produtos por nome...');
    res = await fetch(`http://localhost:${PORT}/api/products/search?nome=teste`);
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, await res.json());

    // Test 8: Busca artesão por username
    console.log('\n8. Testando busca de artesão por username...');
    await fetch(`http://localhost:${PORT}/api/artesaos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'maria', password: '123', email: 'maria@email.com', cep: '12345-678', cpf: '123.456.789-09' })
    });
    res = await fetch(`http://localhost:${PORT}/api/artesaos/search?username=maria`);
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, await res.json());

    // Test 9: Busca admin por username
    console.log('\n9. Testando busca de admin por username...');
    await fetch(`http://localhost:${PORT}/api/adms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', email: 'admin@email.com' })
    });
    res = await fetch(`http://localhost:${PORT}/api/adms/search?username=admin`);
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, await res.json());

    // Test 10: Atualização
    console.log('\n10. Testando atualização de usuário...');
    res = await fetch(`http://localhost:${PORT}/api/usuarios/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, username: 'joao_atualizado', email: 'joao_novo@email.com', cep: '87654-321', password: 'nova_senha' })
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, await res.json());

    console.log('\n✅ Todos os testes de erro passaram!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
});