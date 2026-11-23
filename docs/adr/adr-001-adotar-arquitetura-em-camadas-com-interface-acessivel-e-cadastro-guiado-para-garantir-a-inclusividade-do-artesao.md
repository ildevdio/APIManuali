# ADR-001: Adotar arquitetura em camadas com interface acessível e cadastro guiado para garantir a inclusividade do artesão

- **Status:** Aceita
- **Data:** 2026-11-23
- **Autor:** RAFAEL AIMBERE DOS SANTOS VICENTE (rasv@cesar.school)
- **Turma:** Regular (terças)
- **Projeto:** Origem · marketplace da economia criativa e do artesanato de Pernambuco

## Contexto

O Origem é um marketplace para artesãos, muitos com pouca familiaridade digital e que acessam só pelo celular. A equipe é pequena, formada por estudantes que cursam outras disciplinas em paralelo, e o prazo é de um semestre. A stack foi acordada com Desenvolvimento Web e o modelo de dados com Banco de Dados, e não há orçamento de infraestrutura. Hoje o cadastro de produto tem formulário longo e técnico, envio de fotos pesadas e mensagens de erro vagas, o que faz o artesão desistir. A prioridade do projeto é a capacidade de interação, com foco em inclusividade

## Preocupações

inclusividade, usabilidade no celular, clareza das mensagens de erro, conexão instável, prazo, equipe pequena, custo de mudança

## Decisão

Adotar o padrão de camadas (apresentação, aplicação, domínio e persistência), concentrando na camada de apresentação uma interface mobile-first e acessível (WCAG 2.1 nível AA) com cadastro guiado em etapas e rascunho, e na API a padronização das mensagens de erro e a compressão de imagens no envio

## Justificativa

O cenário da etapa 2 exige que a artesã conclua o cadastro sem ajuda externa, em conexão lenta, em até dez minutos. As camadas isolam a interface acessível da regra de negócio, então a equipe pode melhorar o fluxo de cadastro, as mensagens e o envio de fotos sem alterar o domínio. É um padrão simples de entender para quem chega ao projeto e cabe no prazo de um semestre, na equipe pequena, na stack acordada e sem custo de infraestrutura. A estrutura em camadas já existe na API (rotas, serviços e modelos), então a decisão evolui o que está pronto em vez de recomeçar

## Consequências

Ganha-se um cadastro mais simples e mais acessível, menos desistência de artesãos, menos suporte manual para o administrador, um catálogo mais diverso para o comprador, e uma estrutura previsível para novos integrantes. Perde-se um pouco de tempo de resposta, porque cada requisição passa por mais de uma camada, e há risco de camadas que só repassam chamadas sem agregar valor. Há também mais esforço de design e desenvolvimento no início, a necessidade de testes de usabilidade com usuários reais, a obrigação de manter o padrão de acessibilidade em todas as telas futuras e a disciplina da equipe em respeitar a dependência em uma só direção

## Alternativas consideradas

O CQRS foi descartado porque separa leitura e escrita para resolver problemas de escala, o que não ajuda a inclusividade e exige manter dois modelos sincronizados, complexo demais para o prazo e a equipe. O padrão Orientado a Eventos foi descartado por exigir mensageria e tratamento de consistência eventual, sem benefício direto para o atributo escolhido. Portas e Adaptadores é uma evolução futura possível, mas acrescenta abstrações que a equipe não consegue sustentar neste semestre. Também foram descartados manter a interface atual com suporte manual, por não escalar e manter a dependência do artesão, e o cadastro assistido pelo administrador, por tirar a autonomia do artesão sobre o próprio negócio

## Rastreabilidade

**Atributo de qualidade:** Capacidade de interação · Inclusividade

**Cenário que originou a decisão:**

> Em operação normal, com conexão móvel lenta e instável, uma artesã com pouca familiaridade digital, que usa apenas o celular, cadastra seu primeiro produto no fluxo de cadastro do artesão. O sistema guia o cadastro em etapas curtas, salva o rascunho automaticamente, comprime as fotos no envio e exibe mensagens de erro claras, permitindo que ela conclua o cadastro sem ajuda externa. Em teste de usabilidade com cinco artesãos desse perfil, pelo menos quatro devem concluir o cadastro em até dez minutos, com as telas atendendo ao nível AA do WCAG 2.

**Padrão arquitetural adotado:** Camadas

**Táticas empacotadas:** Encapsular responsabilidades por faixa

Requisito funcional "Publicar peça, com fotos, técnica e região de origem". Módulos afetados: rota e serviço de produtos (routes/products.js e services/ProductService.js), middleware/validate.js, middleware/errorHandler.js e utils/validator.js. Casos de teste relacionados: tests/api/products.test.js e tests/unit/validator.test.js

## Verificação

- **Teste do cenário:** Teste de usabilidade com cinco artesãos do perfil descrito, cada um cadastrando um produto pelo celular em conexão móvel lenta, medindo a taxa e o tempo de conclusão, com a meta de pelo menos quatro conclusões em até dez minutos. Complementa-se com auditoria automática de acessibilidade das telas de cadastro (Lighthouse ou axe, integrada à pipeline de CI) para confirmar o nível AA do WCAG 2.1, e com testes automatizados da API que verificam se os erros de validação retornam o campo afetado e uma mensagem em linguagem simples

---

_Gerado pelo estudo dirigido de Arquitetura de Software · ADS020 · 2026.2._
