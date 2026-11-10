import { describe, it, expect } from 'vitest';
import {
  isRequired,
  isEmail,
  isCep,
  isCpf,
  isPositiveInteger,
  isNonNegativeInteger,
  isPositiveNumber,
  isBoolean,
  isArray,
  validarCampo
} from '../../src/utils/validator.js';

describe('validator.js', () => {
  describe('isRequired', () => {
    it('rejeita undefined, null e string vazia', () => {
      expect(isRequired(undefined, 'campo')).toMatchObject({ campo: 'campo' });
      expect(isRequired(null, 'campo')).toMatchObject({ campo: 'campo' });
      expect(isRequired('', 'campo')).toMatchObject({ campo: 'campo' });
    });

    it('aceita valores preenchidos', () => {
      expect(isRequired('x', 'campo')).toBeNull();
      expect(isRequired(0, 'campo')).toBeNull();
    });
  });

  describe('isEmail', () => {
    it('aceita e-mail válido e rejeita inválido', () => {
      expect(isEmail('a@b.com', 'email')).toBeNull();
      expect(isEmail('invalido', 'email')).toMatchObject({ campo: 'email' });
      expect(isEmail('a@b', 'email')).toMatchObject({ campo: 'email' });
    });
  });

  describe('isCep', () => {
    it('aceita CEP com e sem hífen', () => {
      expect(isCep('12345-678', 'cep')).toBeNull();
      expect(isCep('12345678', 'cep')).toBeNull();
    });

    it('rejeita CEP inválido', () => {
      expect(isCep('1234', 'cep')).toMatchObject({ campo: 'cep' });
      expect(isCep('abcde-fgh', 'cep')).toMatchObject({ campo: 'cep' });
    });
  });

  describe('isCpf', () => {
    it('aceita CPF com 11 dígitos', () => {
      expect(isCpf('123.456.789-09', 'cpf')).toBeNull();
      expect(isCpf('90000000001', 'cpf')).toBeNull();
    });

    it('rejeita CPF curto ou com todos os dígitos iguais', () => {
      expect(isCpf('123', 'cpf')).toMatchObject({ campo: 'cpf' });
      expect(isCpf('111.111.111-11', 'cpf')).toMatchObject({ campo: 'cpf' });
    });
  });

  describe('números', () => {
    it('isPositiveInteger', () => {
      expect(isPositiveInteger(1, 'n')).toBeNull();
      expect(isPositiveInteger('2', 'n')).toBeNull();
      expect(isPositiveInteger(0, 'n')).toMatchObject({ campo: 'n' });
      expect(isPositiveInteger(1.5, 'n')).toMatchObject({ campo: 'n' });
    });

    it('isNonNegativeInteger', () => {
      expect(isNonNegativeInteger(0, 'n')).toBeNull();
      expect(isNonNegativeInteger(3, 'n')).toBeNull();
      expect(isNonNegativeInteger(-1, 'n')).toMatchObject({ campo: 'n' });
    });

    it('isPositiveNumber', () => {
      expect(isPositiveNumber(0.5, 'n')).toBeNull();
      expect(isPositiveNumber(0, 'n')).toMatchObject({ campo: 'n' });
      expect(isPositiveNumber('abc', 'n')).toMatchObject({ campo: 'n' });
    });
  });

  describe('boolean e array', () => {
    it('isBoolean', () => {
      expect(isBoolean(true, 'b')).toBeNull();
      expect(isBoolean('true', 'b')).toMatchObject({ campo: 'b' });
    });

    it('isArray', () => {
      expect(isArray([], 'a')).toBeNull();
      expect(isArray('x', 'a')).toMatchObject({ campo: 'a' });
    });
  });

  describe('validarCampo', () => {
    it('respeita required antes do tipo', () => {
      expect(validarCampo(undefined, 'nome', { type: 'string', required: true })).toMatchObject({
        campo: 'nome',
        mensagem: 'nome é obrigatório.'
      });
    });

    it('valida tipos compostos', () => {
      expect(validarCampo('abc', 'nome', { type: 'string', min: 5 })).toMatchObject({ campo: 'nome' });
      expect(validarCampo('abcdef', 'nome', { type: 'string', min: 5 })).toBeNull();
      expect(validarCampo('a@b.com', 'email', { type: 'email' })).toBeNull();
      expect(validarCampo(10, 'preco', { type: 'positiveNumber' })).toBeNull();
      expect(validarCampo(-1, 'preco', { type: 'positiveNumber' })).toMatchObject({ campo: 'preco' });
    });
  });
});
