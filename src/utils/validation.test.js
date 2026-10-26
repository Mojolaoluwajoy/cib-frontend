import { describe, expect, it } from 'vitest';
import {
  checkAccountNumber,
  checkAmount,
  checkEmail,
  checkNin,
  checkPassword,
  firstError,
  submitErrorMessage,
} from './validation';

describe('validation checks', () => {
  it('checks emails', () => {
    expect(checkEmail('jane@corp.com')).toBe('');
    expect(checkEmail('jane@corp', 'Admin email')).toBe(
      'Admin email must be a valid email address.',
    );
  });

  it('checks passwords are 8 to 72 characters', () => {
    expect(checkPassword('1234567')).toBe('Password must be at least 8 characters.');
    expect(checkPassword('12345678')).toBe('');
    expect(checkPassword('x'.repeat(73))).toBe('Password must be at most 72 characters.');
  });

  it('checks NIN is 11 digits', () => {
    expect(checkNin('12345678901')).toBe('');
    expect(checkNin('1234567890a')).toBe('NIN must be exactly 11 digits.');
  });

  it('checks account numbers are 10 digits', () => {
    expect(checkAccountNumber('0123456789')).toBe('');
    expect(checkAccountNumber('123456789')).toBe('Account number must be exactly 10 digits.');
  });

  it('checks amounts are positive with at most 2 decimals', () => {
    expect(checkAmount('100.50')).toBe('');
    expect(checkAmount('0')).toBe('Amount must be greater than zero.');
    expect(checkAmount('-5')).toBe('Amount must be greater than zero.');
    expect(checkAmount('1.234')).toBe('Amount can have at most 2 decimal places.');
  });

  it('returns the first failing message', () => {
    expect(firstError('', 'second', 'third')).toBe('second');
    expect(firstError('', '')).toBe('');
  });
});

describe('submitErrorMessage', () => {
  it('names backend validation failures with the form labels', () => {
    const err = {
      response: {
        status: 400,
        data: {
          message: 'Validation failed: nin must be 11 digits',
          data: { nin: 'must be 11 digits' },
        },
      },
    };
    expect(submitErrorMessage(err, { nin: 'Admin NIN' }, 'Failed.')).toBe(
      'Admin NIN must be 11 digits.',
    );
  });

  it('falls back to the backend message, then the default', () => {
    expect(
      submitErrorMessage({ response: { status: 409, data: { message: 'Email taken' } } }, {}, 'x'),
    ).toBe('Email taken');
    expect(submitErrorMessage(new Error('Network Error'), {}, 'Registration failed.')).toBe(
      'Registration failed.',
    );
  });
});
