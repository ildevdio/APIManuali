export function agruparItens(itens) {
  const agrupados = new Map();

  for (const { idProduto, quantidade } of itens) {
    const atual = agrupados.get(idProduto) || 0;
    agrupados.set(idProduto, atual + quantidade);
  }

  return Array.from(agrupados.entries()).map(([idProduto, quantidade]) => ({
    idProduto,
    quantidade
  }));
}
