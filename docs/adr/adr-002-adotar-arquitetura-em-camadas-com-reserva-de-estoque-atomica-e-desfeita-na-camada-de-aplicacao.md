# ADR-002: Adotar arquitetura em camadas com reserva de estoque atômica e desfeita na camada de aplicação

- **Status:** Aceita
- **Data:** 2026-11-23
- **Autor:** JOÃO VINÍCIUS TEODORO SILVA (jvts@cesar.school)
- **Turma:** Regular (terças)
- **Projeto:** Origem · marketplace da economia criativa e do artesanato de Pernambuco

## Contexto

O Origem é um marketplace de artesanato de Pernambuco com três perfis (comprador, artesão e administrador). Muitas peças existem em uma ou poucas unidades, e o fechamento do pedido reserva o estoque e registra o pedido em duas etapas. A equipe é pequena, formada por estudantes que cursam outras disciplinas, com prazo de um semestre, stack e modelo de dados acordados com outras disciplinas e hospedagem sem orçamento para redundância. Falhas de banco ou de pagamento no meio do fechamento do pedido vão acontecer.

## Preocupações

tolerância a falhas, consistência de estoque, prazo, simplicidade, custo de infraestrutura, testabilidade

## Decisão

Estruturar o sistema em camadas (apresentação, aplicação, domínio e persistência), com dependência apenas de cima para baixo. A reserva de estoque, o desfazer da reserva e a proteção contra pedido duplicado ficam na camada de aplicação, em uma única operação atômica.

## Justificativa

Nenhuma rota alcança o estoque sem passar pela camada de aplicação, então a regra de desfazer a reserva fica em um único lugar e não há caminho que a contorne. Isso sustenta a medida do cenário: estoque restaurado em até 30s, com zero reservas órfãs e zero pedidos duplicados. A regra concentrada é fácil de testar com injeção de falha. O padrão cabe no prazo e na hospedagem disponíveis.

## Consequências

Ganha: tratamento de falha centralizado, testável e auditável, com estrutura previsível para quem entra na equipe. Perde: latência marginal em cada requisição, código repetitivo e risco de sumidouro, quando uma camada só repassa chamadas. Exige disciplina para não pular camadas, o que será conferido em revisão de código. O padrão sozinho não garante tolerância a falhas: a transação na reserva de estoque e a idempotência do pedido precisam ser implementadas dentro da camada de aplicação, e a equipe aceita esse custo de desenvolvimento.

## Alternativas consideradas

Orientado a Eventos: exige um broker de mensagens que a hospedagem não comporta, e a consistência eventual dificultaria garantir a reserva correta de peças que existem em poucas unidades. CQRS: exige dois modelos de dados e é complexo demais para o prazo e a equipe.

## Rastreabilidade

**Atributo de qualidade:** Confiabilidade · Tolerância a falhas

**Cenário que originou a decisão:**

> Em operação normal, em produção, banco de dados ou serviço de pagamento fica indisponível durante o fechamento de um pedido, depois da reserva de estoque na API de pedidos e no módulo de estoque. O sistema desfaz a reserva, não cria pedido parcial e permite ao comprador tentar de novo sem duplicar o pedido, restaurando o estoque em até 30 segundos, com zero reservas órfãs e zero pedidos duplicados.

**Padrão arquitetural adotado:** Camadas

**Táticas empacotadas:** Encapsular responsabilidades por faixa; Restringir dependências a uma direção; Usar intermediário entre camadas

Módulos: API de pedidos (routes/pedidos.js, PedidoService), reserva e devolução de estoque (ProductService) e tratamento de erros (middleware/errorHandler.js). Requisitos: fechar pedido e controlar estoque.

## Verificação

- **Teste do cenário:** Teste automatizado de integração que, no fechamento de um pedido, derruba a conexão com o banco ou simula o timeout do pagamento depois da reserva de estoque. Passa se o estoque voltar ao valor anterior em até 30s, sem reserva órfã e sem pedido parcial, se uma nova tentativa não gerar pedido duplicado e se a falha ficar registrada em log. Falha se qualquer uma dessas condições não for cumprida. Repete a injeção com falha do banco e com falha do pagamento.

---

_Gerado pelo estudo dirigido de Arquitetura de Software · ADS020 · 2026.2._
