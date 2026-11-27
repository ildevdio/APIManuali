import fs from 'fs';
import path from 'path';

const LOG_FILE = path.resolve(process.cwd(), 'logs', 'ia-uso-dados.jsonl');
const DATA_FILE = path.resolve(process.cwd(), 'src', 'data', 'produtos-ia.json');

function lerLinhas() {
  if (!fs.existsSync(LOG_FILE)) {
    console.error(`Arquivo de log não encontrado: ${LOG_FILE}`);
    console.error('Gere o log executando as chamadas do módulo de IA (veja README).');
    process.exit(1);
  }
  return fs.readFileSync(LOG_FILE, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((linha, i) => {
      try { return JSON.parse(linha); }
      catch { return { _erroParse: true, _linha: i + 1 }; }
    });
}

function lerCatalogo() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

const linhas = lerLinhas();
const catalogo = lerCatalogo();
const validas = linhas.filter(l => !l._erroParse);

const porFuncao = {};
let erros = 0;
const idsConsultados = new Map(); // id -> contagem
const idsNaoEncontrados = new Map();

for (const l of validas) {
  porFuncao[l.funcao] = (porFuncao[l.funcao] || 0) + 1;
  if (!l.sucesso) erros += 1;
  const id = l.parametros?.id;
  if (id) {
    idsConsultados.set(id, (idsConsultados.get(id) || 0) + 1);
    if (l.sucesso && l.quantidadeRetornada === 0) {
      idsNaoEncontrados.set(id, (idsNaoEncontrados.get(id) || 0) + 1);
    }
  }
}

const consultadosOrdenados = [...idsConsultados.entries()].sort((a, b) => b[1] - a[1]);
const nuncaConsultados = catalogo
  .map(p => p.id)
  .filter(id => !idsConsultados.has(id));

console.log('=== Resumo de uso de dados do módulo de IA ===\n');
console.log(`Arquivo de log: ${LOG_FILE}`);
console.log(`Total de chamadas registradas: ${validas.length}`);
console.log(`Total de erros: ${erros}\n`);

console.log('Chamadas por função:');
for (const [funcao, qtd] of Object.entries(porFuncao).sort((a, b) => b[1] - a[1])) {
  console.log(`- ${funcao}: ${qtd}`);
}

console.log('\nRegistros mais consultados (por ID em buscarProdutoPorIdIA):');
if (consultadosOrdenados.length === 0) {
  console.log('- Nenhum ID consultado diretamente.');
} else {
  for (const [id, qtd] of consultadosOrdenados.slice(0, 10)) {
    const nome = catalogo.find(p => p.id === id)?.nome || '(ID inexistente no catálogo)';
    const nf = idsNaoEncontrados.has(id) ? ' [não encontrado]' : '';
    console.log(`- ${id} (${nome}): ${qtd}${nf}`);
  }
}

console.log('\nRegistros nunca consultados diretamente por ID:');
if (nuncaConsultados.length === 0) {
  console.log('- Todos os registros do catálogo foram consultados por ID ao menos uma vez.');
} else {
  for (const id of nuncaConsultados) {
    const nome = catalogo.find(p => p.id === id)?.nome || id;
    console.log(`- ${id} (${nome})`);
  }
}

console.log('\n--- Respostas sugeridas (ajuste conforme seu log) ---');
const maisUsada = Object.entries(porFuncao).sort((a, b) => b[1] - a[1])[0];
const maisConsultado = consultadosOrdenados[0];
console.log(`(a) Dado/função mais usada: ${maisUsada ? `${maisUsada[0]} (${maisUsada[1]} chamadas)` : 'sem dados'}. ${maisConsultado ? `O registro mais consultado por ID foi ${maisConsultado[0]}.` : ''}`);
console.log(`(b) Registros nunca consultados por ID: ${nuncaConsultados.length ? nuncaConsultados.join(', ') : 'nenhum'}. ${nuncaConsultados.length ? 'Isso sugere que esses itens não foram alvo direto de recomendação/busca por ID nos testes, ou que o catálogo tem mais itens do que os cenários exercitados.' : 'Os cenários exercitaram todos os IDs do catálogo.'}`);
console.log(`(c) Erros: ${erros}. ${erros ? 'Verifique as linhas com sucesso=false no log para identificar a causa (ex.: arquivo ausente, JSON inválido, parâmetro inválido).' : 'Não houve erros nas chamadas registradas; as funções trataram casos vazios/inexistentes de forma controlada.'}`);
