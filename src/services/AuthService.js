import UsuarioService from './UsuarioService.js';
import ArtesaoService from './ArtesaoService.js';
import AdmService from './AdmService.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';

const tokens = new Map();

class AuthService {
  login({ username, password, tipo = 'usuario' }) {
    if (!username || !password) {
      throw new BadRequestError('Username e senha são obrigatórios.');
    }

    const handlers = {
      artesao: { service: ArtesaoService, papel: 'artesao' },
      adm: { service: AdmService, papel: 'adm' },
      usuario: { service: UsuarioService, papel: 'comprador' },
    };

    const handler = handlers[tipo];
    if (!handler) {
      usuario = null;
      papel = 'comprador';
    } else {
      usuario = handler.service.autenticar(username, password);
      papel = handler.papel;
    }

    if (!usuario) {
      throw new BadRequestError('Credenciais inválidas.');
    }

    const token = `token_${papel}_${usuario.id ?? usuario.idAdm}_${Date.now()}`;
    tokens.set(token, { id: usuario.id ?? usuario.idAdm, papel, username: usuario.username });

    return {
      token,
      usuario: {
        id: usuario.id ?? usuario.idAdm,
        username: usuario.username,
        email: usuario.email,
        papel
      }
    };
  }

  validarToken(token) {
    if (!token || !tokens.has(token)) {
      throw new UnauthorizedError('Token inválido ou expirado.');
    }
    return tokens.get(token);
  }

  logout(token) {
    tokens.delete(token);
  }
}

export default new AuthService();