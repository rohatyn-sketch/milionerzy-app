'use strict';

/**
 * Pure decision logic for the kill switch, kept separate so it can be tested
 * without GCP. `msg` is the decoded Cloud Billing budget notification
 * (https://cloud.google.com/billing/docs/how-to/budgets-programmatic-notifications).
 *
 * Returns { kill: boolean, reason: string }.
 */
function decide(msg, killAtRatio) {
  const cost = Number(msg && msg.costAmount);
  const budget = Number(msg && msg.budgetAmount);
  if (!Number.isFinite(cost) || !Number.isFinite(budget) || budget <= 0) {
    return { kill: false, reason: 'malformed notification' };
  }
  const ratio = cost / budget;
  if (ratio >= killAtRatio) {
    return { kill: true, reason: `cost ${cost} >= ${killAtRatio} x budget ${budget} (${(ratio * 100).toFixed(1)}%)` };
  }
  return { kill: false, reason: `cost ${cost} is ${(ratio * 100).toFixed(1)}% of budget ${budget}` };
}

module.exports = { decide };
