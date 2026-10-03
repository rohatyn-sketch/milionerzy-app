import { storage, type Lang } from '../state/storage';

// Lightweight UI translation.
//
// Design: the app's source language is Polish. The dictionary below holds only
// the ENGLISH strings, keyed by a stable id. Every lookup also receives the
// Polish text as a fallback, so:
//   - nothing is duplicated (Polish lives at the call site / in the HTML),
//   - a missing key degrades gracefully to Polish,
//   - Polish rendering is a no-op (we only ever *replace* text when lang==='en').
//
// Static markup is tagged with data-i18n / data-i18n-* attributes and rewritten
// by applyI18n() on load. Dynamically built text calls t(key, polishFallback).
//
// Course content (quiz questions and the Fizyka formula sheet) stays Polish by
// design — only the interface chrome is translated. Switching language reloads
// the page so every already-rendered surface is rebuilt cleanly.

export type { Lang };

export function getLang(): Lang {
  return storage.getLang();
}

export function setLang(lang: Lang): void {
  storage.setLang(lang);
}

/** Toggle PL<->EN and reload so the whole UI re-renders in the new language. */
export function toggleLang(): void {
  setLang(getLang() === 'pl' ? 'en' : 'pl');
  window.location.reload();
}

/** BCP-47 tag for Intl/`toLocaleDateString` etc. */
export function localeTag(): string {
  return getLang() === 'en' ? 'en-GB' : 'pl-PL';
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

/**
 * Translate `key` to the current language. `pl` is the Polish source text, used
 * as-is when the language is Polish or when the key has no English entry.
 */
export function t(key: string, pl: string, params?: Record<string, string | number>): string {
  const en = getLang() === 'en' ? EN[key] : undefined;
  return interpolate(en ?? pl, params);
}

/**
 * Rewrite tagged static markup under `root` into the current language.
 * No-op in Polish (the markup is already Polish).
 *   data-i18n           -> textContent
 *   data-i18n-html      -> innerHTML
 *   data-i18n-placeholder -> placeholder attribute
 *   data-i18n-title     -> title attribute
 */
export function applyI18n(root: ParentNode = document): void {
  document.documentElement.lang = getLang();
  if (getLang() !== 'en') return;

  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const v = EN[el.dataset.i18n!];
    if (v !== undefined) el.textContent = v;
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const v = EN[el.dataset.i18nHtml!];
    if (v !== undefined) el.innerHTML = v;
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const v = EN[el.dataset.i18nPlaceholder!];
    if (v !== undefined) el.setAttribute('placeholder', v);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const v = EN[el.dataset.i18nTitle!];
    if (v !== undefined) el.setAttribute('title', v);
  });
}

/** Call once per page, early, to apply the chosen language to static markup. */
export function initI18n(): void {
  applyI18n();
}

// --- English dictionary ----------------------------------------------------
// Keys are grouped by area. Polish originals live at the call sites.
const EN: Record<string, string> = {
  // Shared / navigation
  'nav.back': '← Back to menu',
  'money.label': 'Your money:',

  // Main menu
  'menu.subtitle': 'Pick a class and play!',
  'menu.play': 'Play',
  'menu.practice': 'Practice',
  'menu.shop': 'Shop',
  'menu.formulas': 'Formulas',
  'stats.played': 'Games played:',
  'stats.won': 'Won:',
  'stats.bestStreak': 'Best streak:',
  'lb.title': 'Best scores',
  'lb.empty': 'No scores yet',
  'lb.emptyFull': 'No scores yet. Play a game to appear on the board!',
  'lb.defaultName': 'Player',
  'code.placeholder': 'Enter a code...',
  'code.use': 'Use code',
  'code.ok': 'Correct code! You receive 1,000,000 PLN!',
  'code.bad': 'Invalid code!',

  // Sound + language toggles
  'sfx.on': 'SFX: ON',
  'sfx.off': 'SFX: OFF',
  'music.on': 'Music: ON',
  'music.off': 'Music: OFF',
  'lang.toggleTitle': 'Change language',

  // Question-count slider
  'qc.label': 'Questions',
  'qc.hint': 'How many questions per game',

  // Daily challenge
  'daily.title': 'Daily challenge',
  'daily.done': 'Completed!',
  'daily.completedMsg': 'Challenge completed! Next one in:',
  'daily.playN': 'Play ({n} questions)',
  'daily.bonus': 'Bonus:',
  'daily.alreadyDone': "Today's challenge is already completed! Come back tomorrow.",

  // Setup / add-class panel
  'setup.title': 'Add a new class',
  'setup.nameLabel': 'Subject / class name',
  'setup.namePh': 'e.g. Biology - Grade 8',
  'setup.contextLabel': 'Scope of material (optional)',
  'setup.contextPh': 'e.g. Chapter 3: Circulatory system, heart, blood...',
  'setup.imageLabel': 'Photo of the success criteria (optional)',
  'setup.authNotice': 'Sign in with a Google account to generate questions.',
  'setup.generate': 'Generate questions',
  'setup.toggleTitle': 'AI question settings',
  'setup.enterName': 'Enter a subject / class name',
  'setup.generatedN': 'Generated {n} questions!',
  'setup.genLoginTitle': 'Sign in to generate questions',
  'upload.text': 'Click or drag an image',
  'upload.hint': 'Max 4MB - JPG, PNG',
  'upload.formats': 'Allowed formats: JPG, PNG',
  'upload.maxSize': 'Maximum file size: 4MB',
  'upload.remove': 'Remove image',
  'upload.previewAlt': 'Preview',
  'loading.text': 'Generating questions...',
  'loading.subtext': 'This can take up to 30 seconds',

  // Class cards
  'class.default': 'Default',
  'class.questions': '{n} questions',
  'class.add': 'Add class',
  'class.deleteTitle': 'Delete class',
  'class.deleteConfirm': 'Are you sure you want to delete the class "{name}"?',

  // Auth
  'auth.signIn': 'Sign in with Google',
  'auth.logout': 'Log out',
  'auth.hint': 'Sign in to save your progress and create new classes',
  'auth.loginError': 'Sign-in error: ',
  'practice.loginReq': 'Sign in to use practice mode',
  'practice.loginAlert': 'Sign in to use practice mode.',
  'practice.noneAlert': "You don't have any incorrect questions to practice!",

  // Game screen
  'game.loading': 'Loading question...',
  'game.qNum': 'Question {n}/{total}',
  'game.qPractice': 'Practice {n}/{total}',
  'game.qDaily': 'Daily challenge {n}/{total}',
  'game.perQuestion': '{money} / question',
  'game.confirmExit': 'Are you sure you want to leave?',
  'tf.true': 'True',
  'tf.false': 'False',
  'll.skip': 'Skip',
  'll.time': '+Time',
  'll.fiftyTitle': 'Removes 2 wrong answers',
  'll.skipTitle': 'Skips the question',
  'll.timeTitle': '+30 seconds',
  'kb.select': 'A/B/C/D or 1/2/3/4 - choose',
  'kb.next': 'Space - next',
  'kb.exit': 'Esc - exit',

  // Explanation overlay
  'exp.correct': 'Correct answer!',
  'exp.wrong': 'Wrong answer!',
  'exp.timeUp': "Time's up!",
  'exp.correctLabel': 'Correct answer:',
  'exp.title': 'Explanation:',
  'exp.nextQuestion': 'Next question',
  'exp.seeResult': 'See result',
  'podcast.listen': '\u{1F3A7} Listen to the podcast',

  // End screen
  'end.playAgain': 'Play again',
  'end.mainMenu': 'Main menu',
  'end.win': 'Congratulations!',
  'end.gameOver': 'Game over!',
  'end.dailyDone': 'Daily challenge completed!',
  'end.practiceDone': 'Practice finished!',
  'end.practiceAll': "Great! You've mastered all the questions!",
  'end.practiceLeft': '{n} questions left to review.',
  'end.earned': 'Earned this game: {amount}',
  'end.leaderboardPos': 'Rank #{pos} on the leaderboard!',

  // Login prompt (class selector)
  'login.title': 'Sign-in required',
  'login.text': 'To add new classes and generate questions, you must sign in with a Google account.',

  // Shop
  'shop.title': 'Shop',
  'shop.themes': 'Visual themes',
  'shop.backgrounds': 'Backgrounds',
  'shop.lifelines': 'Lifelines',
  'shop.defaultTheme': 'Default theme',
  'shop.defaultThemeDesc': 'The classic blue Milionerzy theme.',
  'shop.defaultBg': 'Default background',
  'shop.defaultBgDesc': 'The classic dark Milionerzy background.',
  'shop.free': 'Free',
  'shop.owned': 'Owned',
  'shop.buy': 'Buy',
  'shop.active': 'Active',
  'shop.activate': 'Activate',
  'shop.youHave': 'You have: {n}',
  'shop.boughtActivated': 'Bought and activated: {name}',
  'shop.bought': 'Bought: {name}',

  // Achievements
  'ach.title': 'Achievements',
  'ach.subtitle': 'Unlock them all to become a true master!',
  'ach.unlocked': 'Unlocked:',
  'ach.unlockedNotif': 'Achievement unlocked!',

  // Achievement names + descriptions (keyed by id)
  'ach.first_game.name': 'First game',
  'ach.first_game.desc': 'Play your first game',
  'ach.first_win.name': 'First win',
  'ach.first_win.desc': 'Win your first game',
  'ach.millionaire.name': 'Millionaire',
  'ach.millionaire.desc': 'Earn 1,000,000 PLN',
  'ach.streak_3.name': 'Streak 3',
  'ach.streak_3.desc': 'Answer correctly 3 times in a row',
  'ach.streak_5.name': 'Streak 5',
  'ach.streak_5.desc': 'Answer correctly 5 times in a row',
  'ach.streak_10.name': 'Streak 10',
  'ach.streak_10.desc': 'Answer correctly 10 times in a row',
  'ach.perfect_game.name': 'Perfect game',
  'ach.perfect_game.desc': 'Answer every question correctly',
  'ach.no_lifelines.name': 'No help',
  'ach.no_lifelines.desc': 'Win a game without using any lifelines',
  'ach.games_10.name': '10 games',
  'ach.games_10.desc': 'Play 10 games',
  'ach.games_50.name': '50 games',
  'ach.games_50.desc': 'Play 50 games',
  'ach.fast_answer.name': 'Lightning',
  'ach.fast_answer.desc': 'Answer in less than 3 seconds',
  'ach.daily_challenge.name': 'Daily challenge',
  'ach.daily_challenge.desc': 'Complete the daily challenge',
  'ach.rich.name': 'Tycoon',
  'ach.rich.desc': 'Earn 10,000,000 PLN in total',

  // Shop item names + descriptions (keyed by id)
  'theme.gold.name': 'Gold',
  'theme.gold.desc': 'An elegant gold theme',
  'theme.cosmic.name': 'Cosmic',
  'theme.cosmic.desc': 'A cosmic theme with stars',
  'theme.neon.name': 'Neon',
  'theme.neon.desc': 'A bright neon theme',
  'bg.gradient1.name': 'Sunset',
  'bg.gradient1.desc': 'Warm shades of orange and pink',
  'bg.gradient2.name': 'Ocean',
  'bg.gradient2.desc': 'Deep sea blue',
  'bg.gradient3.name': 'Forest',
  'bg.gradient3.desc': 'Natural forest green',
  'bg.gradient4.name': 'Aurora',
  'bg.gradient4.desc': 'Magical northern lights',
  'bg.gradient5.name': 'Galaxy',
  'bg.gradient5.desc': 'Deep outer space',
  'bg.gradient6.name': 'Flame',
  'bg.gradient6.desc': 'Intense shades of red and gold',
  'll.fifty.name': '50:50',
  'll.fifty.desc': 'Remove 2 wrong answers',
  'll.skip.name': 'Skip',
  'll.skip.desc': 'Skip the question',
  'll.time.name': 'Extra time',
  'll.time.desc': '+30 seconds',

  // Difficulty level names (keyed by level)
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',

  // First-time onboarding tour
  'onb.welcome.title': 'Welcome to Milionerzy!',
  'onb.welcome.text': "It's a game where you answer questions and earn money. We'll show you how to play in a few steps.",
  'onb.class.title': 'Pick a subject',
  'onb.class.text': 'Here you choose the class or subject you want to play. Once signed in, you can also add your own question set.',
  'onb.count.title': 'Number of questions',
  'onb.count.text': 'Use the slider to set how many questions you want per game. Fewer questions means a quicker game.',
  'onb.play.title': 'Play',
  'onb.play.text': 'The "Play" button starts a game with questions from the chosen subject.',
  'onb.money.title': 'Your money',
  'onb.money.text': 'Correct answers earn you money. You can spend it in the shop on lifelines and themes.',
  'onb.practice.title': 'Practice mode',
  'onb.practice.text': 'Questions you get wrong land here so you can practice them later (once signed in).',
  'onb.final.title': "Let's play!",
  'onb.final.text': "That's everything you need to start. Click below to begin your first game — we'll finish the tutorial as you go.",
  'onb.final.cta': 'Play now',
  'onb.skip': 'Skip tutorial',
  'onb.g.question.title': 'Question',
  'onb.g.question.text': 'The question appears here. Read it carefully — you’ll choose an answer next.',
  'onb.g.answers.title': 'Answers',
  'onb.g.answers.text': 'Click one of the answers. You can also use the A/B/C/D or 1/2/3/4 keys.',
  'onb.g.timer.title': 'Time',
  'onb.g.timer.text': 'Each question has a time limit. When the bar runs out, the question is lost.',
  'onb.g.lifelines.title': 'Lifelines',
  'onb.g.lifelines.text': '50:50 removes wrong answers, "Skip" jumps the question, and "+Time" adds seconds. Buy them in the shop.',
  'onb.g.money.title': 'Earnings',
  'onb.g.money.text': 'Here you can see how much you’ve earned this game, live.',
  'onb.g.final.title': 'Good luck!',
  'onb.g.final.text': "Now it's your turn. Answer all the questions — finishing the game ends the tutorial.",
  'onb.g.final.cta': "Let's start",
  'onb.done.title': 'Tutorial complete!',
  'onb.done.text': "Congratulations — you finished your first game! You know the basics now. Keep playing, earn money and unlock achievements.",
  'onb.done.cta': 'Great!',
  'onb.next': 'Next',
  'onb.finish': 'Finish',

  // Learn-more / podcast toast (practice mode)
  'learn.stickyTopic': "This topic won't let you go!",
  'learn.againTopic': 'This topic again?',
  'learn.thisTopic': 'this topic',
  'learn.offer': 'Generate a podcast about {topic}?',
  'learn.yes': 'Yes!',
  'learn.no': 'No',
  'learn.stop': "Don't ask",
  'learn.yesTitle': 'Generate podcast',
  'learn.noTitle': 'Not now',
  'learn.stopTitle': "Don't show again this session",
  'learn.closeTitle': 'Close',
  'learn.cancel': 'Cancel',
  'learn.failed': 'Could not generate the podcast.',
  'learn.msg1': 'Looking for sources on this topic...',
  'learn.msg2': 'Preparing educational material...',
  'learn.msg3': 'Writing the podcast script...',
  'learn.msg4': 'Recording the podcast...',
  'learn.msg5': 'Almost ready...',

  // Audio player (podcast)
  'audio.playPause': 'Play/Pause',
  'audio.speed': 'Playback speed',
  'audio.showTranscript': 'Show transcript',
  'audio.hideTranscript': 'Hide transcript',
  'audio.back': 'Back to practice',
};
