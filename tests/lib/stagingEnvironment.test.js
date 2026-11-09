import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createStagingEnvironment } from '../../scripts/prepareStagingEnv.mjs';

const source = {
  MONGODB_URI: 'mongodb+srv://example:dummy@cluster.example.invalid/test?retryWrites=true',
  JWT_SECRET: 'local-only', RAZORPAY_KEY_ID: 'rzp_test_fixture', RAZORPAY_KEY_SECRET: 'dummy',
  TWILIO_AUTH_TOKEN: 'must-not-copy', ADMIN_PASSWORD: 'must-not-copy',
};

describe('private staging configuration', () => {
  it('selects a different database without changing source settings', () => {
    const result = createStagingEnvironment(source);
    const uri = new URL(result.MONGODB_URI);
    assert.equal(uri.pathname, '/strongersteps_staging');
    assert.equal(uri.searchParams.get('retryWrites'), 'true');
    assert.equal(new URL(source.MONGODB_URI).pathname, '/test');
  });
  it('creates independent secrets, excludes staff/SMS credentials and disables SMS', () => {
    const a = createStagingEnvironment(source), b = createStagingEnvironment(source);
    assert.notEqual(a.JWT_SECRET, source.JWT_SECRET);
    assert.notEqual(a.JWT_SECRET, b.JWT_SECRET);
    assert.notEqual(a.RAZORPAY_WEBHOOK_SECRET, b.RAZORPAY_WEBHOOK_SECRET);
    assert.equal(a.JWT_SECRET.length, 128);
    assert.equal(a.OTP_SMS_PROVIDER, 'mock');
    assert.equal(a.TWILIO_AUTH_TOKEN, undefined);
    assert.equal(a.ADMIN_PASSWORD, undefined);
  });
  it('rejects live Razorpay keys and reusing the source database', () => {
    assert.throws(() => createStagingEnvironment({ ...source, RAZORPAY_KEY_ID: 'rzp_live_fixture' }));
    assert.throws(() => createStagingEnvironment({ ...source, MONGODB_URI: 'mongodb://localhost/strongersteps_staging' }));
  });
  it('preserves an explicitly configured authentication database', () => {
    const result = createStagingEnvironment({ ...source, MONGODB_URI: 'mongodb://a:b@localhost/test?authSource=admin' });
    assert.equal(new URL(result.MONGODB_URI).searchParams.get('authSource'), 'admin');
  });
  it('preserves local MongoDB implicit authentication database while changing the data database', () => {
    const result = createStagingEnvironment({ ...source, MONGODB_URI: 'mongodb://a:b@localhost/test' });
    assert.equal(new URL(result.MONGODB_URI).searchParams.get('authSource'), 'test');
  });
});
