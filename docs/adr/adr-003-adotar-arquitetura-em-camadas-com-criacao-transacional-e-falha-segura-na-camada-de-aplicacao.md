# ADR-003: Adotar arquitetura em camadas com criação transacional e falha segura na camada de aplicação

- **Status:** Proposta
- **Data:** 2026-11-24
- **Autor:** GABRIEL BARBOSA ARAÚJO (gba4@cesar.school)
- **Turma:** Regular (terças)
- **Projeto:** Origem · marketplace da economia criativa e do artesanato de Pernambuco

## Contexto

O Origem é um marketplace de artesanato de Pernambuco com três perfis (comprador, artesão e administrador). A publicação de uma peça grava mais de um registro: o produto, a categoria, quando ainda não existe, e o vínculo com o artesão. O fechamento de um pedido também grava o pedido e os seus itens. Se a API cair no meio de uma dessas gravações, o banco pode ficar com dados parciais, como uma categoria criada sem produto, um produto sem os dados completos ou um pedido com itens faltando ou repetidos. Isso prejudica o artesão e o comprador. A equipe é pequena, formada por estudantes que cursam outras disciplinas, com prazo de um semestre, stack e modelo de dados acordados com outras disciplinas e hospedagem sem orçamento de infraestrutura.

## Preocupações

falha segura, integridade dos dados, prazo, simplicidade, custo de infraestrutura, testabilidade

## Decisão

Estruturar o sistema em camadas, com dependência apenas de cima para baixo. Cada operação de escrita com mais de um registro, como a criação de produto, roda na camada de aplicação dentro de uma única transação do banco (`prisma.$transaction`). Ou tudo é confirmado, ou nada é gravado.

## Justificativa

Nenhuma rota grava no banco sem passar pela camada de aplicação, então o limite da transação fica em um único lugar e não existe caminho que o contorne. Se a API perde comunicação antes da confirmação, o banco descarta a transação inteira, e o estado volta a ser o de antes da tentativa. Isso sustenta a medida do cenário: 0 registros parciais em 100% dos testes, com o estado consistente em até 5 segundos após a API voltar. A regra concentrada é fácil de testar com injeção de falha. O padrão cabe no prazo e na hospedagem disponíveis, porque usa só a transação do próprio banco, sem nenhum serviço extra.

## Consequências

Ganha: escrita atômica centralizada, testável e auditável, com estrutura previsível para quem entra na equipe. Perde: latência marginal em cada requisição, código repetitivo e risco de sumidouro, quando uma camada só repassa chamadas. Exige disciplina para não pular camadas e para não gravar fora da transação, o que será conferido em revisão de código. O padrão sozinho não garante falha segura: cada fluxo de escrita, a começar por `ProductService.criar`, que hoje grava a categoria e o produto em chamadas separadas, precisa ser reescrito dentro de uma transação, e a equipe aceita esse custo de desenvolvimento.

## Alternativas consideradas

Microsserviços: separar produto, categoria e artesão em serviços com bancos próprios tiraria a transação única do banco. Garantir o "tudo ou nada" exigiria sagas e compensações, além de hospedar vários serviços, o que o prazo, a equipe e a hospedagem não aguentam.

## Rastreabilidade

**Atributo de qualidade:** Segurança (safety) · Falha segura

**Cenário que originou a decisão:**

> Um artesão envia a criação de um novo produto, a API perde comunicação durante o processo, afetando o domínio de cadastro de produtos e o banco de dados. Em operação normal e com o processo ainda em andamento, o sistema faz um rollback, sem salvar nenhum dado parcial. Esse cenário deve se repetir em 100% dos testes, em até 5 segundos após a API estar de pé novamente

**Padrão arquitetural adotado:** Camadas

**Táticas empacotadas:** Encapsular responsabilidades por faixa; Restringir dependências a uma direção; Usar intermediário entre camadas



## Verificação

- **Teste do cenário:** Teste automatizado de integração que dispara a criação de um produto com categoria nova e derruba a conexão com o banco, ou encerra o processo da API, depois da primeira gravação e antes da confirmação. Depois de reiniciar a API, confere em até 5 segundos se não há produto parcial nem categoria órfã e se a contagem de registros é igual à de antes da tentativa. Passa se nenhum dado parcial for encontrado em 100% das repetições. Falha se qualquer registro da tentativa interrompida permanecer no banco.

---

_Gerado pelo estudo dirigido de Arquitetura de Software · ADS020 · 2026.2._
