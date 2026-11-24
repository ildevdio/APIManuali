import { asyncHandler } from './asyncHandler.js';
import AuthService from '../services/AuthService.js';

const exigirAuth = (papel) => asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  const dadosToken = AuthService.validarToken(token);

  if (dadosToken.papel !== papel) {
    return res.status(403).json({ erro: `Acesso negado. Este recurso requer o papel '${papel}'.` });
  }

  req.usuario = {
    id: dadosToken.id,
    username: dadosToken.username,
    papel: dadosToken.papel
  };

  next();
});

export default exigirAuth;