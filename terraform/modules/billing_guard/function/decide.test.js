'use strict';
// Run with: node --test terraform/modules/billing_guard/function/decide.test.js
const test = require('node:test');
const assert = require('node:assert');
const { decide } = require('./decide');

test('fires at or above the ratio', () => {
  assert.equal(decide({ costAmount: 300, budgetAmount: 300 }, 1).kill, true);
  assert.equal(decide({ costAmount: 310.5, budgetAmount: 300 }, 1).kill, true);
});

test('does not fire below the ratio', () => {
  assert.equal(decide({ costAmount: 299.99, budgetAmount: 300 }, 1).kill, false);
  assert.equal(decide({ costAmount: 280, budgetAmount: 300 }, 0.95).kill, false);
});

test('ignores malformed notifications', () => {
  assert.equal(decide({}, 1).kill, false);
  assert.equal(decide({ costAmount: 5, budgetAmount: 0 }, 1).kill, false);
  assert.equal(decide(null, 1).kill, false);
});
