import pedidoService from './src/services/PedidoService.js';
import productService from './src/services/ProductService.js';

async function test() {
  console.log('Testando PedidoService...');

  // Criar produto
  const produto = productService.criar({
    nome: 'Teste',
    descricao: 'Teste',
    preco: 10,
    estoque: 5,
    ativo: true
  });
  console.log('Produto criado:', produto);

  // Criar pedido com estoque suficiente
  const pedido1 = await pedidoService.criar({
    itens: [{ idProduto: produto.id, quantidade: 2 }],
    cep: '12345-678'
  });
  console.log('Pedido 1 (estoque suficiente):', pedido1);

  // Verificar estoque restante
  const prodAtualizado = productService.buscarPorId(produto.id);
  console.log('Estoque após pedido 1:', prodAtualizado.estoque);

  // Tentar criar pedido com estoque insuficiente
  try {
    const pedido2 = await pedidoService.criar({
      itens: [{ idProduto: produto.id, quantidade: 100 }],
      cep: '12345-678'
    });
    console.log('Pedido 2 (deveria falhar):', pedido2);
  } catch (error) {
    console.log('Erro esperado - Estoque insuficiente:', error.message);
  }

  // Deletar pedido não concluído (deve devolver estoque)
  await pedidoService.deletar(pedido1.idPedido);
  console.log('Pedido 1 deletado');

  const prodFinal = productService.buscarPorId(produto.id);
  console.log('Estoque após deletar pedido:', prodFinal.estoque);

  console.log('Teste concluído com sucesso!');
}

test().catch(console.error);