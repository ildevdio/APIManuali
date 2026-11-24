# ADR-006: Adotar arquitetura em camadas com observabilidade transversal na camada de apresentação

- **Status:** Proposta
- **Data:** 2026-11-24
- **Autor:** JÚLIA OLIVEIRA VERÍSSIMO (jov@cesar.school)
- **Turma:** Regular (terças)
- **Projeto:** Origem · marketplace da economia criativa e do artesanato de Pernambuco

## Contexto

O Origem é um marketplace de artesanato de Pernambuco com três perfis (comprador, artesão e administrador). Hoje a API não deixa rastro do que acontece em operação: o `errorHandler` responde 500 sem registrar o erro, não há log de requisições, não há identificador que ligue uma requisição às operações que ela provocou, e o único registro existente são mensagens de inicialização com `console.log`. O endpoint `/health` confirma apenas que o processo está de pé, sem verificar o banco. Se o fechamento de um pedido falhar em produção, ninguém consegue dizer qual rota, qual usuário, em que etapa e por quê. Os ADRs de confidencialidade e de tolerância a falhas ainda dependem de "registro em log" nos seus testes de verificação, e hoje não há onde registrar. A equipe é pequena, formada por estudantes que cursam outras disciplinas, com prazo de um semestre, stack e modelo de dados acordados com outras disciplinas e hospedagem sem orçamento de infraestrutura.

## Preocupações

analisabilidade, observabilidade, privacidade dos dados pessoais, prazo, simplicidade, custo de infraestrutura, testabilidade

## Decisão

Estruturar o sistema em camadas (apresentação, aplicação, domínio e persistência), com dependência apenas de cima para baixo, e tratar a observabilidade como uma responsabilidade transversal concentrada na camada de apresentação. Um middleware gera um identificador de correlação por requisição e registra método, rota, status, duração e esse identificador. O `errorHandler` passa a registrar todo erro, com causa e identificador, antes de responder, e devolve o identificador ao cliente nas respostas de erro. Os registros usam um único logger em formato JSON, escrito na saída padrão. O `/health` passa a verificar também a conexão com o banco. Senhas, tokens e dados pessoais além do identificador do usuário não entram nos registros.

## Justificativa

Toda requisição entra pela camada de apresentação, então um único middleware e um único tratador de erros cobrem todas as rotas, sem exigir que cada service lembre de registrar algo. Isso sustenta a medida do cenário: 100% das requisições e 100% dos erros 5xx registrados, com identificador de correlação e causa. O formato estruturado permite buscar um pedido pelo identificador em vez de ler texto solto. Escrever na saída padrão cabe na hospedagem sem orçamento, porque usa o que a plataforma já oferece para coletar logs e não exige serviço extra. A regra de não registrar dados sensíveis fica em um único lugar, o que facilita a revisão.

## Consequências

Ganha: diagnóstico de falhas sem precisar reproduzi-las, base para os registros em log que os ADRs de confidencialidade e de tolerância a falhas já prometem, e estrutura previsível para quem entra na equipe. Perde: latência marginal em cada requisição, volume de logs que cresce com o tráfego, sem retenção definida na hospedagem atual, e mais uma dependência a manter. Há risco de vazar dado pessoal nos registros, o que exige uma regra de mascaramento conferida em revisão de código e por teste automatizado, em respeito à LGPD. O padrão sozinho não garante observabilidade em operações internas: o middleware enxerga a requisição, mas não as etapas dentro dos services, então o identificador de correlação precisa ser repassado a eles quando se quiser registrar uma etapa, e a equipe aceita esse custo de desenvolvimento.

## Alternativas consideradas

Serviço externo de monitoramento de erros e APM: resolve rápido, mas cria custo recorrente e dependência de terceiro, e a hospedagem não tem orçamento. Pilha completa de métricas e rastreamento distribuído (OpenTelemetry, Prometheus e Grafana): exige processos e infraestrutura que a hospedagem não comporta e é grande demais para o prazo e a equipe. `console.log` espalhado pelos services: é barato, mas sem estrutura e sem identificador de correlação não permite ligar os eventos de uma mesma requisição. Auditoria orientada a eventos: exige broker de mensagens, que a hospedagem não comporta, e já foi descartada nas outras decisões do projeto.

## Rastreabilidade

**Atributo de qualidade:** Manutenibilidade · Analisabilidade (observabilidade)

**Cenário que originou a decisão:**

> Em produção, em operação normal, um comprador envia a criação de um pedido à API de pedidos e recebe erro 500 por falha na reserva de estoque. Quem está de plantão identifica a rota, o usuário, a etapa e a causa da falha em até 10 minutos, sem reproduzir o erro, a partir de registros estruturados ligados por um identificador de correlação. Em 100% das requisições há registro com método, rota, status, duração e identificador. Em 100% dos erros 5xx há registro com causa e identificador, e o identificador é devolvido na resposta. Nenhuma senha ou token aparece nos registros.

**Padrão arquitetural adotado:** Camadas

**Táticas empacotadas:** Encapsular responsabilidades por faixa; Restringir dependências a uma direção; Usar intermediário entre camadas

Módulos: middleware de registro e correlação (a criar em `src/middleware/`), tratamento de erros (`middleware/errorHandler.js`), montagem do app (`app.js`) e verificação de saúde (`/health`). Requisitos: fechar pedido, controlar estoque e autenticar usuários.

## Verificação

- **Teste do cenário:** Teste automatizado de integração que força um erro no fechamento de um pedido, por exemplo com falha simulada na reserva de estoque, e captura a saída do logger. Passa se, para a requisição, houver um registro com método, rota, status, duração e identificador, se o erro tiver registro com causa e o mesmo identificador, se o identificador vier na resposta de erro e se, a partir dele, for possível localizar a rota e a causa em até 10 minutos por busca nos registros. Falha se qualquer rota deixar uma requisição ou um erro 5xx sem registro. Repete o teste em todas as rotas de pedido e de login.
- **Teste de privacidade:** Teste automatizado que envia login com senha e requisições com token e confere que nenhum desses valores aparece na saída do logger. Falha se qualquer um aparecer.
- **Teste de saúde:** Teste que derruba a conexão com o banco e confere que `/health` deixa de responder como saudável.

---

_Gerado pelo estudo dirigido de Arquitetura de Software · ADS020 · 2026.2._
