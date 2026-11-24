import { ValidationError } from '../utils/errors.js';
import { validarCampo } from '../utils/validator.js';

export function validate(schema) {
  return (req, res, next) => {
    const erros = [];

    const validarObjeto = (origem, nomeOrigem, campos) => {
      for (const [campo, regras] of Object.entries(campos)) {
        const valor = origem[campo];
        const erro = validarCampo(valor, campo, regras);
        if (erro) {
          erros.push({ ...erro, origem: nomeOrigem });
        }
      }
    };

    if (schema.params) validarObjeto(req.params, 'params', schema.params);
    if (schema.query) validarObjeto(req.query, 'query', schema.query);
    if (schema.body) validarObjeto(req.body, 'body', schema.body);

    if (erros.length > 0) {
      return next(new ValidationError(erros));
    }

    next();
  };
}
