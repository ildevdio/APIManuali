# ADR-004: Desacoplar

- **Status:** Proposta
- **Data:** 2026-11-24
- **Autor:** DIOGO SILAS WOOLLEY DO CARMO (dswc@cesar.school)
- **Turma:** Regular (terças)
- **Projeto:** Origem · marketplace da economia criativa e do artesanato de Pernambuco

## Contexto

Desacoplar a persistência das regras de negócio da API com Portas e Adaptadores, para permitir a migração de memória para PostgreSQL (Prisma) sem alterar rotas nem services.

Por que esse verbo: o problema do contexto é o acoplamento entre as regras de produtos e pedidos e o armazenamento em memória. A decisão é justamente quebrar essa dependência, então "Desacoplar" descreve o que a decisão faz.

Versão curta, caso o campo tenha limite de tamanho: Desacoplar a persistência das regras de negócio com Portas e Adaptadores

## Preocupações

Adaptabilidade: migrar de memória para PostgreSQL (Prisma) sem alterar routes/ nem as regras dos services. Risco de regressão: proteger os fluxos de produto e pedido, com a suíte TC01-TC15 como rede de segurança. Testabilidade e trabalho em paralelo: testar sem banco e reduzir conflitos entre os devs. Restrições: um semestre, equipe pequena, stack e modelo de dados já acordados, sem orçamento de infraestrutura.

## Decisão

Adotar Portas e Adaptadores na API, com repositórios como contrato entre os services e a persistência: uma implementação em memória e outra com Prisma/PostgreSQL, injetadas nos services e escolhidas por configuração. A migração começa por Product e Pedido, sem alterar routes/.

## Justificativa

A decisão atende aos três drivers do projeto. Para os requisitos funcionais, mantém as regras de publicação de peças e fechamento de pedido no centro, sem depender do armazenamento. Para a adaptabilidade, a porta de persistência permite trocar memória por Prisma/PostgreSQL com 0 arquivos alterados em routes/, que é o que o cenário mede. Para as restrições, não exige infraestrutura nova nem processos adicionais, e convive com a stack e o modelo de dados já acordados.

Além disso, a migração pode ser feita recurso por recurso, com a suíte TC01-TC15 como rede de segurança, e os testes continuam rodando sem banco. As Camadas seguem como base, e as portas protegem a fronteira com o que muda.

## Consequências

Positivas: a migração para PostgreSQL fica localizada e reversível, os services são testáveis sem banco (TC01-TC15 como rede de segurança) e há menos conflitos entre os devs.

Negativas: complexidade inicial, mais arquivos (duas implementações por agregado), mapeamento entre o modelo do domínio e o do Prisma, e contrato verificado só por testes e revisão, já que é JavaScript.

Mitigação: testes de contrato nas duas implementações e checagem no CI para os services não importarem o Prisma.

## Alternativas consideradas

Não houve uma comparação real entre padrões. A decisão partiu de um problema específico, o acoplamento entre as regras de negócio e o armazenamento em memória, e Portas e Adaptadores respondia a ele de forma direta.

O único que cheguei a olhar foi o Microkernel, e o descartei de forma superficial: ele exige projetar e versionar um contrato de extensão para o que ainda não existe, e no Origem a variação é pequena e conhecida (persistência e, depois, pagamento). O Orientado a Eventos e o CQRS eu li no catálogo, mas não avaliei a fundo. As Camadas já existem no projeto e continuam como base.

## Rastreabilidade

**Atributo de qualidade:** Flexibilidade · Adaptabilidade

**Cenário que originou a decisão:**

> Em ambiente de desenvolvimento, com a suíte de testes TC01–TC15 rodando no CI, um desenvolvedor da equipe recebe a demanda de substituir o armazenamento em memória por PostgreSQL via Prisma na camada de persistência (repositórios) e nos services de produtos e pedidos. O sistema conclui a migração de um recurso sem modificar as rotas nem as regras de negócio dos services, alterando 0 arquivos em routes/, tocando no máximo 2 módulos (repositório e configuração), com os testes TC01–TC15 passando sem mudança de comportamento e em até 2 dias-pessoa por recurso.

**Padrão arquitetural adotado:** Orientado a Eventos

**Táticas empacotadas:** Processamento assíncrono; Usar intermediário (barramento ou fila); Degradação graciosa do consumidor; Replicar consumidores para escalar

Atributo e cenário: Adaptabilidade, migração de memória para PostgreSQL (Prisma).
Testes: suíte TC01-TC15 e testes de contrato dos repositórios.
Código afetado: src/services/, src/models/, src/repositories/ (novo), src/app.js e prisma/.
Repositórios: ildevdio/APIManuali (back) e ildevdio/origem (front).
ADRs, issues e PRs relacionados: [preencher].

## Verificação

- **Teste do cenário:** Teste do cenário

A medida do cenário é verificada por um teste de contrato mais a suíte TC01-TC15 rodando contra as duas implementações.

Teste de contrato dos repositórios (tests/contract/): o mesmo conjunto de casos (criar, buscar por ID, atualizar, remover, buscar por username/nome, erro de não encontrado) executa contra InMemoryRepository e PrismaRepository. Os dois precisam passar sem alterar o teste.
Suíte TC01-TC15 com PERSISTENCE=prisma: o CI roda os testes de integração (Vitest + Supertest) duas vezes, uma em memória e outra com Prisma. O critério é passar nas duas sem mudança de comportamento.

Como cada parte da medida é comprovada

0 arquivos alterados em routes/: verificação no PR com git diff --stat main -- src/routes/, que deve vir vazio.
No máximo 2 módulos tocados: o mesmo diff deve mostrar mudanças apenas no repositório e na configuração.
Até 2 dias-pessoa por recurso: registrado no PR ou na issue da migração do recurso.

---

_Gerado pelo estudo dirigido de Arquitetura de Software · ADS020 · 2026.2._
