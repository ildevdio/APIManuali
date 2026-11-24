import UsuarioService from './UsuarioService.js';
import ArtesaoService from './ArtesaoService.js';
import AdmService from './AdmService.js';
import { BadRequestError } from '../utils/errors.js';

const tokens = new Map();

class AuthService {
  async login({ username, password, tipo = 'usuario' }) {
    if (!username || !password) {
      throw new BadRequestError('Username e senha são obrigatórios.');
    }

    let usuario = null;
    let papel = '';

    if (tipo === 'artesao') {
      usuario = await ArtesaoService.autenticar(username, password);
      papel = 'artesao';
    } else if (tipo === 'adm') {
      usuario = await AdmService.autenticar(username, password);
      papel = 'adm';
    } else {
      usuario = await UsuarioService.autenticar(username, password);
      papel = 'comprador';
    }

    if (!usuario) {
      throw new BadRequestError('Credenciais inválidas.');
    }

    const token = `token_${papel}_${usuario.id}_${Date.now()}`;
    tokens.set(token, { id: usuario.id, papel, username: usuario.username });

    return {
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        papel
      }
    };
  }

  validarToken(token) {
    if (!token || !tokens.has(token)) {
      throw new BadRequestError('Token inválido ou expirado.');
    }
    return tokens.get(token);
  }

  logout(token) {
    tokens.delete(token);
  }
}

export default new AuthService();
