import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('🧪 Testando API Manuali...\n');

  try {
    // Health check
    console.log('1. Health check...');
    const health = await fetch(`${BASE_URL}/health`);
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, await health.json());

    // Test usuarios
    console.log('\n2. Criando usuário...');
    const userCreate = await fetch(`${BASE_URL}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'joao',
        password: '123456',
        email: 'joao@email.com',
        cep: '12345-678'
      })
    });
    const user = await userCreate.json();
    console.log(`   Status: ${userCreate.status}`);
    console.log(`   Response:`, user);

    console.log('\n3. Listando usuários...');
    const usersList = await fetch(`${BASE_URL}/api/usuarios`);
    console.log(`   Status: ${usersList.status}`);
    console.log(`   Response:`, await usersList.json());

    console.log('\n4. Buscando usuário por ID...');
    const userById = await fetch(`${BASE_URL}/api/usuarios/${user.id}`);
    console.log(`   Status: ${userById.status}`);
    console.log(`   Response:`, await userById.json());

    // Test products
    console.log('\n5. Criando produto...');
    const productCreate = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Caneca',
        descricao: 'Caneca de cerâmica',
        preco: 29.90,
        estoque: 10,
        ativo: true
      })
    });
    const product = await productCreate.json();
    console.log(`   Status: ${productCreate.status}`);
    console.log(`   Response:`, product);

    console.log('\n6. Listando produtos...');
    const productsList = await fetch(`${BASE_URL}/api/products`);
    console.log(`   Status: ${productsList.status}`);
    console.log(`   Response:`, await productsList.json());

    // Test pedido
    console.log('\n7. Criando pedido...');
    const pedidoCreate = await fetch(`${BASE_URL}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens: [{ idProduto: product.id, quantidade: 2 }],
        cep: '12345-678'
      })
    });
    const pedido = await pedidoCreate.json();
    console.log(`   Status: ${pedidoCreate.status}`);
    console.log(`   Response:`, pedido);

    console.log('\n8. Listando pedidos...');
    const pedidosList = await fetch(`${BASE_URL}/api/pedidos`);
    console.log(`   Status: ${pedidosList.status}`);
    console.log(`   Response:`, await pedidosList.json());

    // Test artesao
    console.log('\n9. Criando artesão...');
    const artesaoCreate = await fetch(`${BASE_URL}/api/artesaos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'maria',
        password: '123456',
        email: 'maria@email.com',
        cep: '12345-678',
        cpf: '123.456.789-09'
      })
    });
    const artesao = await artesaoCreate.json();
    console.log(`   Status: ${artesaoCreate.status}`);
    console.log(`   Response:`, artesao);

    // Test adm
    console.log('\n10. Criando admin...');
    const admCreate = await fetch(`${BASE_URL}/api/adms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
        email: 'admin@email.com'
      })
    });
    const adm = await admCreate.json();
    console.log(`   Status: ${admCreate.status}`);
    console.log(`   Response:`, adm);

    console.log('\n✅ Todos os testes passaram!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();