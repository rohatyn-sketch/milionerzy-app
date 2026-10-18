// Owner tool: show AI spend and change the caps, without touching code.
//
//   pnpm spend-report                       # this period's spend, caps, top users
//   pnpm spend-report --top 25              # show more users
//   pnpm spend-report --global-cap 80 --user-cap 10 --period monthly
//   pnpm spend-report --ai off              # emergency stop for all AI features
//   pnpm spend-report --ai on
//
// Prerequisite (once): `gcloud auth application-default login` with an account
// that can read/write Firestore in milionerzy-487910.
//
// All figures are the app's own ledger (tokens x published price), which is
// real-time but excludes Google free tiers/credits. The Cloud Billing console
// is the authoritative bill; it lags by hours.

import type { LedgerDb } from '../spend/ledger';

interface Args {
  top: number;
  globalCap?: number;
  userCap?: number;
  period?: string;
  ai?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { top: 10 };
  for (let i = 0; i < argv.length; i++) {
    const [flag, value] = [argv[i], argv[i + 1]];
    const take = (): string => {
      if (value === undefined) throw new Error(`Missing value for ${flag}`);
      i++;
      return value;
    };
    switch (flag) {
      case '--top': args.top = Number(take()); break;
      case '--global-cap': args.globalCap = Number(take()); break;
      case '--user-cap': args.userCap = Number(take()); break;
      case '--period': args.period = take(); break;
      case '--ai': args.ai = take(); break;
      case '--help': case '-h':
        console.log('Usage: spend-report [--top N] [--global-cap USD] [--user-cap USD] [--period monthly|lifetime] [--ai on|off]');
        process.exit(0);
      default: throw new Error(`Unknown flag ${flag}`);
    }
  }
  for (const [k, v] of [['--global-cap', args.globalCap], ['--user-cap', args.userCap]] as const) {
    if (v !== undefined && !(Number.isFinite(v) && v >= 0)) throw new Error(`${k} must be a number >= 0`);
  }
  if (args.period && !['monthly', 'lifetime'].includes(args.period)) throw new Error('--period must be monthly or lifetime');
  if (args.ai && !['on', 'off'].includes(args.ai)) throw new Error('--ai must be on or off');
  return args;
}

const usd = (n: number): string => `$${n.toFixed(4)}`;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  process.env.GOOGLE_CLOUD_PROJECT ||= 'milionerzy-487910';

  const { db } = await import('../config');
  const { firestoreLedgerDb } = await import('../spend/firestore-ledger');
  const { readBudget, exposureUsd, pendingUsd, LEDGER_COLLECTION } = await import('../spend/ledger');
  const { SPEND_CONFIG_DOC } = await import('../spend/config');
  const ledger: LedgerDb = firestoreLedgerDb(db);

  const update: Record<string, unknown> = {};
  if (args.globalCap !== undefined) update.globalCapUsd = args.globalCap;
  if (args.userCap !== undefined) update.userCapUsd = args.userCap;
  if (args.period) update.period = args.period;
  if (args.ai) update.aiEnabled = args.ai === 'on';
  if (Object.keys(update).length > 0) {
    update.updatedAt = new Date().toISOString();
    await db.doc(SPEND_CONFIG_DOC).set(update, { merge: true });
    console.log(`Updated ${SPEND_CONFIG_DOC}:`, update);
  }

  const view = await readBudget(ledger);
  const g = view.global;
  const c = view.config;
  console.log(`\nAI spend — period ${view.periodKey}${view.resetsAt ? ` (resets ${view.resetsAt})` : ' (no automatic reset)'}`);
  console.log(`  AI enabled:     ${c.aiEnabled ? 'yes' : 'NO (kill switch on)'}`);
  console.log(`  Global:         ${usd(g.spentUsd)} spent + ${usd(pendingUsd(g))} in flight of ${usd(c.globalCapUsd)} cap (${((exposureUsd(g) / (c.globalCapUsd || 1)) * 100).toFixed(1)}%)`);
  console.log(`  Per-user cap:   ${usd(c.userCapUsd)}`);
  console.log(`  Paid calls:     ${g.calls}`);
  for (const [feature, amount] of Object.entries(g.byFeature).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${feature.padEnd(16)} ${usd(amount)}`);
  }

  const users = await db
    .collection(`${LEDGER_COLLECTION}/${view.periodKey}/users`)
    .orderBy('spentUsd', 'desc')
    .limit(args.top)
    .get();
  console.log(`\nTop ${args.top} users this period:`);
  if (users.empty) console.log('  (none)');
  for (const doc of users.docs) {
    const d = doc.data();
    let email = '';
    try {
      const { auth } = await import('../config');
      email = (await auth.getUser(doc.id)).email || '';
    } catch {
      /* user lookup is best-effort */
    }
    console.log(`  ${usd(Number(d.spentUsd) || 0).padStart(10)}  ${String(d.calls || 0).padStart(4)} calls  ${doc.id}  ${email}`);
  }
}

main().catch((err) => {
  console.error('spend-report failed:', err?.message || err);
  process.exit(1);
});
