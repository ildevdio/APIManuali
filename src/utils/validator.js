export function isRequired(valor, campo) {
  if (valor === undefined || valor === null || valor === '') {
    return { campo, mensagem: `${campo} é obrigatório.` };
  }
  return null;
}

export function isString(valor, campo, { min, max } = {}) {
  if (typeof valor !== 'string') {
    return { campo, mensagem: `${campo} deve ser uma string.` };
  }
  if (min !== undefined && valor.trim().length < min) {
    return { campo, mensagem: `${campo} deve ter pelo menos ${min} caractere(s).` };
  }
  if (max !== undefined && valor.trim().length > max) {
    return { campo, mensagem: `${campo} deve ter no máximo ${max} caractere(s).` };
  }
  return null;
}

export function isEmail(valor, campo) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(valor)) {
    return { campo, mensagem: `${campo} deve ser um e-mail válido.` };
  }
  return null;
}

export function isCep(valor, campo) {
  const cepRegex = /^\d{5}-?\d{3}$/;
  if (!cepRegex.test(String(valor))) {
    return { campo, mensagem: `${campo} deve ser um CEP válido (ex: 00000-000).` };
  }
  return null;
}

export function isCpf(valor, campo) {
  const cpf = String(valor).replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return { campo, mensagem: `${campo} deve ser um CPF válido.` };
  }
  return null;
}

export function isPositiveInteger(valor, campo) {
  const num = Number(valor);
  if (!Number.isInteger(num) || num <= 0) {
    return { campo, mensagem: `${campo} deve ser um número inteiro positivo.` };
  }
  return null;
}

export function isNonNegativeInteger(valor, campo) {
  const num = Number(valor);
  if (!Number.isInteger(num) || num < 0) {
    return { campo, mensagem: `${campo} deve ser um número inteiro não negativo.` };
  }
  return null;
}

export function isPositiveNumber(valor, campo) {
  const num = Number(valor);
  if (!Number.isFinite(num) || num <= 0) {
    return { campo, mensagem: `${campo} deve ser um número maior que zero.` };
  }
  return null;
}

export function isBoolean(valor, campo) {
  if (typeof valor !== 'boolean') {
    return { campo, mensagem: `${campo} deve ser um booleano.` };
  }
  return null;
}

export function isArray(valor, campo) {
  if (!Array.isArray(valor)) {
    return { campo, mensagem: `${campo} deve ser um array.` };
  }
  return null;
}

export function validarCampo(valor, campo, regras) {
  if (regras.required && (valor === undefined || valor === null || valor === '')) {
    return { campo, mensagem: `${campo} é obrigatório.` };
  }

  if (valor === undefined || valor === null) {
    return null;
  }

  if (regras.type === 'string') {
    const erro = isString(valor, campo, regras);
    if (erro) return erro;
    if (regras.email) {
      const erroEmail = isEmail(valor, campo);
      if (erroEmail) return erroEmail;
    }
    if (regras.cep) {
      const erroCep = isCep(valor, campo);
      if (erroCep) return erroCep;
    }
    if (regras.cpf) {
      const erroCpf = isCpf(valor, campo);
      if (erroCpf) return erroCpf;
    }
    return null;
  }

  if (regras.type === 'email') {
    return isEmail(valor, campo);
  }

  if (regras.type === 'cep') {
    return isCep(valor, campo);
  }

  if (regras.type === 'cpf') {
    return isCpf(valor, campo);
  }

  if (regras.type === 'positiveInteger') {
    return isPositiveInteger(valor, campo);
  }

  if (regras.type === 'nonNegativeInteger') {
    return isNonNegativeInteger(valor, campo);
  }

  if (regras.type === 'positiveNumber') {
    return isPositiveNumber(valor, campo);
  }

  if (regras.type === 'boolean') {
    return isBoolean(valor, campo);
  }

  if (regras.type === 'array') {
    return isArray(valor, campo);
  }

  return null;
}
