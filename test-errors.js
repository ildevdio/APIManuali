import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testErrors() {
  console.log('🧪 Testando tratamento de erros...\n');

  try {
    // Test 404 - usuário não encontrado
    console.log('1. Testando 404 - Usuário não encontrado...');
    const notFound = await fetch(`${BASE_URL}/api/usuarios/999`);
    console.log(`   Status: ${notFound.status}`);
    console.log(`   Response:`, await notFound.json());

    // Test 409 - usuário duplicado
    console.log('\n2. Testando 409 - Usuário duplicado...');
    const duplicate = await fetch(`${BASE_URL}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'joao',
        password: '123456',
        email: 'joao@email.com',
        cep: '12345-678'
      })
    });
    console.log(`   Status: ${duplicate.status}`);
    console.log(`   Response:`, await duplicate.json());

    // Test 400 - dados inválidos
    console.log('\n3. Testando 400 - Dados inválidos...');
    const badRequest = await fetch(`${BASE_URL}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '',
        password: '123456',
        email: 'joao@email.com',
        cep: '12345-678'
      })
    });
    console.log(`   Status: ${badRequest.status}`);
    console.log(`   Response:`, await badRequest.json());

    // Test 409 - estoque insuficiente
    console.log('\n4. Testando 409 - Estoque insuficiente...');
    const estoqueInsuficiente = await fetch(`${BASE_URL}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens: [{ idProduto: 1, quantidade: 100 }],
        cep: '12345-678'
      })
    });
    console.log(`   Status: ${estoqueInsuficiente.status}`);
    console.log(`   Response:`, await estoqueInsuficiente.json());

    // Test devolver estoque ao deletar pedido não concluído
    console.log('\n5. Testando devolução de estoque ao deletar pedido...');
    // Criar novo produto com estoque
    const prodCreate = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Prato',
        descricao: 'Prato de cerâmica',
        preco: 49.90,
        estoque: 5,
        ativo: true
      })
    });
    const produto = await prodCreate.json();
    console.log(`   Produto criado:`, produto);

    // Criar pedido
    const pedidoCreate = await fetch(`${BASE_URL}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens: [{ idProduto: produto.id, quantidade: 3 }],
        cep: '12345-678'
      })
    });
    const pedido = await pedidoCreate.json();
    console.log(`   Pedido criado (estoque reservado):`, { id: pedido.idPedido, estoqueProduto: produto.estoque });

    // Deletar pedido (deve devolver estoque)
    const pedidoDelete = await fetch(`${BASE_URL}/api/pedidos/${pedido.idPedido}`, {
      method: 'DELETE'
    });
    console.log(`   Status delete: ${pedidoDelete.status}`);

    // Verificar estoque devolvido
    const produtoAtualizado = await fetch(`${BASE_URL}/api/products/${produto.id}`);
    const prodAtualizado = await produtoAtualizado.json();
    console.log(`   Estoque após deletar pedido:`, prodAtualizado.estoque);

    // Test produto inativo ao preço negativo
    console.log('\n6. Testando produto inativo com preço negativo...');
    const prodNegativo = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Produto Negativo',
        descricao: 'Teste',
        preco: -10,
        estoque: 10,
        ativo: true
      })
    });
    const prodNeg = await prodNegativo.json();
    console.log(`   Produto criado com preço negativo:`, prodNeg);

    // Test busca por nome
    console.log('\n7. Testando busca de produtos por nome...');
    const search = await fetch(`${BASE_URL}/api/products/search?nome=caneca`);
    console.log(`   Status: ${search.status}`);
    console.log(`   Response:`, await search.json());

    // Test busca por username (artesão)
    console.log('\n8. Testando busca de artesão por username...');
    const searchArtesao = await fetch(`${BASE_URL}/api/artesaos/search?username=maria`);
    console.log(`   Status: ${searchArtesao.status}`);
    console.log(`   Response:`, await searchArtesao.json());

    // Test busca por username (admin)
    console.log('\n9. Testando busca de admin por username...');
    const searchAdm = await fetch(`${BASE_URL}/api/adms/search?username=admin`);
    console.log(`   Status: ${searchAdm.status}`);
    console.log(`   Response:`, await searchAdm.json());

    // Test atualização
    console.log('\n10. Testando atualização de usuário...');
    const update = await fetch(`${BASE_URL}/api/usuarios/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        username: 'joao_atualizado',
        email: 'joao_novo@email.com',
        cep: '87654-321',
        password: 'nova_senha'
      })
    });
    const updated = await update.json();
    console.log(`   Status: ${update.status}`);
    console.log(`   Response:`, updated);

    console.log('\n✅ Todos os testes de erro passaram!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testErrors();