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
  const email = String(valor || '').trim().toLowerCase();
  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
  if (!emailRegex.test(email) || email.includes('..')) {
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

function cpfDigitosValidos(cpf) {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calc(cpf.slice(0, 9));
  const d2 = calc(cpf.slice(0, 10));
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

function cnpjDigitosValidos(cnpj) {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (base) => {
    const pesos = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calc(cnpj.slice(0, 12));
  const d2 = calc(cnpj.slice(0, 13));
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

export function isCpf(valor, campo) {
  const cpf = String(valor).replace(/\D/g, '');
  if (!cpfDigitosValidos(cpf)) {
    return { campo, mensagem: `${campo} deve ser um CPF válido.` };
  }
  return null;
}

export function isCnpj(valor, campo) {
  const cnpj = String(valor).replace(/\D/g, '');
  if (!cnpjDigitosValidos(cnpj)) {
    return { campo, mensagem: `${campo} deve ser um CNPJ válido.` };
  }
  return null;
}

export function isCpfCnpj(valor, campo) {
  const doc = String(valor).replace(/\D/g, '');
  if (doc.length === 11) return cpfDigitosValidos(doc) ? null : { campo, mensagem: `${campo} deve ser um CPF válido.` };
  if (doc.length === 14) return cnpjDigitosValidos(doc) ? null : { campo, mensagem: `${campo} deve ser um CPF ou CNPJ válido.` };
  return { campo, mensagem: `${campo} deve ser um CPF ou CNPJ válido.` };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(valor, campo) {
  if (typeof valor !== 'string' || !UUID_REGEX.test(valor)) {
    return { campo, mensagem: `${campo} deve ser um UUID válido.` };
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

const validadores = {
  string: (valor, campo, regras) => {
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
    if (regras.cnpj) {
      const erroCnpj = isCnpj(valor, campo);
      if (erroCnpj) return erroCnpj;
    }
    if (regras.cpfCnpj) {
      const erroDoc = isCpfCnpj(valor, campo);
      if (erroDoc) return erroDoc;
    }
    return null;
  },
  email: (valor, campo) => isEmail(valor, campo),
  cep: (valor, campo) => isCep(valor, campo),
  cpf: (valor, campo) => isCpf(valor, campo),
  cnpj: (valor, campo) => isCnpj(valor, campo),
  cpfCnpj: (valor, campo) => isCpfCnpj(valor, campo),
  uuid: (valor, campo) => isUuid(valor, campo),
  positiveInteger: (valor, campo) => isPositiveInteger(valor, campo),
  nonNegativeInteger: (valor, campo) => isNonNegativeInteger(valor, campo),
  positiveNumber: (valor, campo) => isPositiveNumber(valor, campo),
  boolean: (valor, campo) => isBoolean(valor, campo),
  array: (valor, campo) => isArray(valor, campo),
};

export function validarCampo(valor, campo, regras) {
  if (regras.required && (valor === undefined || valor === null || valor === '')) {
    return { campo, mensagem: `${campo} é obrigatório.` };
  }

  if (valor === undefined || valor === null) {
    return null;
  }

  const validador = validadores[regras.type];
  if (validador) {
    return validador(valor, campo, regras);
  }

  return null;
}