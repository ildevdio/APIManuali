# Revisão do Models — *Primitive Obsession*

## Trechos Analisados
* `src/models/Carrinho.js` (`Carrinho` e `CarrinhoItem`)
* `src/models/ItemPedido.js` (`ItemPedido`)

## *Code Smell* Avaliado e Impactos Potenciais
Avaliou-se a ocorrência de **Primitive Obsession** (uso excessivo de primitivos ou estruturas soltas em vez de objetos de domínio). Se estivesse presente, haveria perda de coesão, duplicação de validações de quantidade e cálculo de subtotal, além de maior risco de inconsistência e mudanças espalhadas.

## Decisão: Não Refatorar
Manter o código atual sem alterações.

### Por que não houve necessidade de mudança
* **Abstração de domínio já consolidada:** Em vez de lidar com arrays crus de IDs e valores soltos, o código já estrutura `CarrinhoItem` e `ItemPedido` como entidades/objetos próprios com campos privados (`#`) e `toGetDto()` para serialização. Além disso, `Carrinho` encapsula internamente um `Map` (`#itens`) e métodos como `adicionarOuAtualizar`, `remover` e `limpar`, escondendo das camadas externas como os itens são armazenados e atualizados.
* **Invariantes protegidas na criação e alteração do estado:** Tanto `CarrinhoItem` quanto `ItemPedido` exigem `quantidade > 0` na construção (e `CarrinhoItem` também no setter de `quantidade`), impedindo que instâncias inválidas entrem no fluxo. Já `ItemPedido` centraliza o cálculo de `subtotal` (`#precoUnitario * #quantidade`), evitando que cada consumidor recalcule esse valor por conta própria e sujeito a divergências.
* **Respeito à separação de responsabilidades:** Manter essas regras dentro dos modelos evita vazar validações e contas básicas para serviços e rotas, preservando a clareza da arquitetura em camadas do projeto.
* **Custo-benefício desfavorável à alteração:** Como o problema investigado não existe de fato nesses modelos, refatorar agora não resolveria um *code smell* real — apenas introduziria risco de regressão em um ponto central de carrinho e pedidos sem ganho estrutural equivalente.