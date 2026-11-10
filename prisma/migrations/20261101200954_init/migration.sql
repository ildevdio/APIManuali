ALTER TABLE produto     ADD CONSTRAINT chk_produto_preco    CHECK (preco >= 0);
ALTER TABLE pedido      ADD CONSTRAINT chk_pedido_total     CHECK (valor_total >= 0);
ALTER TABLE item_pedido ADD CONSTRAINT chk_item_qtd         CHECK (quantidade > 0);
ALTER TABLE item_pedido ADD CONSTRAINT chk_item_preco       CHECK (preco_unitario >= 0);
ALTER TABLE pagamento   ADD CONSTRAINT chk_pagamento_valor  CHECK (valor >= 0);
ALTER TABLE entrega     ADD CONSTRAINT chk_entrega_frete    CHECK (valor_frete >= 0);
ALTER TABLE avaliacao   ADD CONSTRAINT chk_avaliacao_nota   CHECK (nota BETWEEN 1 AND 5);