'use strict';

// AI budget kill switch. Triggered by every Cloud Billing budget notification
// on the "ai-budget-alerts" topic (several per day). Idempotent: repeating the
// actions on an already-killed setup is harmless, which matters because
// Pub/Sub delivers at least once and out of order.
//
// Recovery (manual, deliberate): re-enable the Generative Language API in the
// Gemini project and set config/spend.aiEnabled back to true — see the PR /
// runbook. Nothing re-enables automatically, including at month start.

const functions = require('@google-cloud/functions-framework');
const { decide } = require('./decide');

const APP_PROJECT_ID = process.env.APP_PROJECT_ID;
const GEMINI_PROJECT_ID = process.env.GEMINI_PROJECT_ID;
const KILL_AT_RATIO = Number(process.env.KILL_AT_RATIO || '1');
const KILL_MODE = process.env.KILL_MODE || 'disable_api';

async function accessToken() {
  const res = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } }
  );
  if (!res.ok) throw new Error(`metadata token: ${res.status}`);
  return (await res.json()).access_token;
}

async function call(url, init, token) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method} ${url}: ${res.status} ${text}`);
  return text;
}

async function disableAppAi(token, reason) {
  const doc = `projects/${APP_PROJECT_ID}/databases/(default)/documents/config/spend`;
  const mask = ['aiEnabled', 'killedAt', 'killedReason'].map((f) => `updateMask.fieldPaths=${f}`).join('&');
  await call(
    `https://firestore.googleapis.com/v1/${doc}?${mask}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          aiEnabled: { booleanValue: false },
          killedAt: { stringValue: new Date().toISOString() },
          killedReason: { stringValue: `billing budget: ${reason}` },
        },
      }),
    },
    token
  );
  console.log('[kill-switch] set config/spend.aiEnabled=false');
}

async function disableGeminiApi(token) {
  await call(
    `https://serviceusage.googleapis.com/v1/projects/${GEMINI_PROJECT_ID}/services/generativelanguage.googleapis.com:disable`,
    { method: 'POST', body: JSON.stringify({ disableDependentServices: false }) },
    token
  );
  console.log(`[kill-switch] disabled generativelanguage.googleapis.com in ${GEMINI_PROJECT_ID}`);
}

functions.cloudEvent('budgetKillSwitch', async (cloudEvent) => {
  const raw = cloudEvent && cloudEvent.data && cloudEvent.data.message && cloudEvent.data.message.data;
  if (!raw) {
    console.warn('[kill-switch] no message data');
    return;
  }
  const msg = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  const { kill, reason } = decide(msg, KILL_AT_RATIO);
  console.log(`[kill-switch] ${msg.budgetDisplayName || 'budget'}: ${reason} (mode ${KILL_MODE})`);
  if (!kill) return;
  if (KILL_MODE === 'dry_run') {
    console.warn('[kill-switch] DRY RUN — would disable AI now');
    return;
  }

  const token = await accessToken();
  // App flag first: it is the cheapest, fully reversible step.
  await disableAppAi(token, reason);
  if (KILL_MODE === 'disable_api') await disableGeminiApi(token);
});
