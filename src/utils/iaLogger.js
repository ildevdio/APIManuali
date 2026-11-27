import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ia-uso-dados.jsonl');

function garantirDiretorio() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function registrarUsoDados({ funcao, origem, parametros, quantidadeRetornada, sucesso, erro }) {
  garantirDiretorio();
  const linha = {
    timestamp: new Date().toISOString(),
    funcao,
    origem,
    parametros,
    quantidadeRetornada,
    sucesso: Boolean(sucesso),
    ...(erro ? { erro: String(erro).slice(0, 300) } : {}),
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(linha) + '\n', 'utf8');
  return linha;
}

export function getLogFilePath() {
  return LOG_FILE;
}
