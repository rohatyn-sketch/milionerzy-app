import { storage } from '../state/storage';
import { scheduleSave } from '../state/sync';
import { GAME_CONFIG, formatMoney } from '@milionerzy/shared';
import type { Question } from '@milionerzy/shared';
import { isTrueFalse } from '@milionerzy/shared';
import { applyTheme } from '../ui/theme';
import { initKeyboard, setAnswerCallback, setNextCallback, setEscapeCallback } from '../features/keyboard';
import { initStreak, resetStreak, incrementStreak, getMultiplier, isNewLevel, getDisplayInfo } from '../features/streak';
import { getTimerForQuestion, getMoneyMultiplier, getLevelName, getLevelColor, calculateReward, getFiftyRemoves } from '../features/difficulty';
import { getDailyQuestions, isCompletedToday, markCompleted, DAILY_MONEY_MULTIPLIER } from '../features/daily';
import { playCorrect, playIncorrect, playTimerWarning, playClick, playStreak, initSound } from '../features/sound';
import { checkAll as checkAllAchievements, check as checkAchievement } from '../features/achievements';
import { addScore as addLeaderboardScore } from '../features/leaderboard';
import { loadCachedQuestions, getRandomQuestions, shuffleAnswers, getQuestions } from '../features/questions';
import { isLoggedIn } from '../auth/auth';

// State
let questions: Question[] = [];
let currentQuestionIndex = 0;
let currentMoney = 0;
let gameStartMoney = 0;
let timeLeft = 0;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let isAnswered = false;
let fiftyUsedThisQuestion = false;
let isPracticeMode = false;
let isDailyChallenge = false;
let questionStartTime: number | null = null;
let lifelinesUsedThisGame = 0;
let incorrectAnswersThisGame = 0;
let timerWarningPlayed = false;
let currentMaxTime = 60;

// DOM Elements
let els: Record<string, HTMLElement | null> = {};

function cacheElements(): void {
  els = {
    timerFill: document.getElementById('timer-fill'),
    timerText: document.getElementById('timer-text'),
    currentMoney: document.getElementById('current-money'),
    questionNumber: document.getElementById('question-number'),
    questionText: document.getElementById('question-text'),
    answersContainer: document.getElementById('answers-container'),
    explanationOverlay: document.getElementById('explanation-overlay'),
    explanationResult: document.getElementById('explanation-result'),
    explanationMoney: document.getElementById('explanation-money'),
    explanationText: document.getElementById('explanation-text'),
    correctAnswerText: document.getElementById('correct-answer-text'),
    nextBtn: document.getElementById('next-btn'),
    endScreen: document.getElementById('end-screen'),
    endTitle: document.getElementById('end-title'),
    endMoney: document.getElementById('end-money'),
    lifelineFifty: document.getElementById('lifeline-fifty'),
    lifelineSkip: document.getElementById('lifeline-skip'),
    lifelineTime: document.getElementById('lifeline-time'),
    fiftyCount: document.getElementById('fifty-count'),
    skipCount: document.getElementById('skip-count'),
    timeCount: document.getElementById('time-count'),
    streakCounter: document.getElementById('streak-counter'),
    difficultyIndicator: document.getElementById('difficulty-indicator'),
  };
}

function getAnswerBtns(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('.answer-btn')) as HTMLButtonElement[];
}

function updateLifelineCounts(): void {
  const lifelines = storage.getLifelines();
  if (!lifelines) return;
  if (els.fiftyCount) els.fiftyCount.textContent = `x${lifelines.fifty}`;
  if (els.skipCount) els.skipCount.textContent = `x${lifelines.skip}`;
  if (els.timeCount) els.timeCount.textContent = `x${lifelines.time}`;

  if (els.lifelineFifty) (els.lifelineFifty as HTMLButtonElement).disabled = lifelines.fifty <= 0;
  if (els.lifelineSkip) (els.lifelineSkip as HTMLButtonElement).disabled = lifelines.skip <= 0;
  if (els.lifelineTime) (els.lifelineTime as HTMLButtonElement).disabled = lifelines.time <= 0;
}

function stopTimer(): void {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTimerDisplay(): void {
  const percentage = (timeLeft / currentMaxTime) * 100;
  if (els.timerFill) {
    (els.timerFill as HTMLElement).style.width = `${percentage}%`;
    els.timerFill.classList.remove('warning', 'danger');
    if (timeLeft <= 10) els.timerFill.classList.add('danger');
    else if (timeLeft <= 20) els.timerFill.classList.add('warning');
  }
  if (els.timerText) els.timerText.textContent = `${timeLeft}s`;
}

function startTimer(): void {
  stopTimer();
  const questionNum = currentQuestionIndex + 1;
  timeLeft = getTimerForQuestion(questionNum);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft === 10 && !timerWarningPlayed) {
      timerWarningPlayed = true;
      playTimerWarning();
    }
    if (timeLeft <= 0) {
      stopTimer();
      handleTimeOut();
    }
  }, 1000);
}

function updateDifficultyIndicator(questionNum: number): void {
  if (els.difficultyIndicator) {
    const name = getLevelName(questionNum);
    const color = getLevelColor(questionNum);
    const mult = getMoneyMultiplier(questionNum);
    els.difficultyIndicator.innerHTML = `
      <span style="color: ${color}">${name}</span>
      <span class="multiplier">x${mult} PLN</span>
    `;
  }
}

function updateStreakDisplay(): void {
  if (els.streakCounter) {
    const info = getDisplayInfo();
    if (info.isActive) {
      els.streakCounter.innerHTML = `
        <span class="streak-fire">${info.fire}</span>
        <span class="streak-count">${info.streak}</span>
        <span class="streak-multiplier">x${info.multiplier}</span>
      `;
      els.streakCounter.classList.add('active');
    } else {
      els.streakCounter.classList.remove('active');
      els.streakCounter.innerHTML = '';
    }
  }
}

function formatExplanation(text: string): string {
  let f = text;
  f = f.replace(/\[([^\]]+)\]/g, '<span class="formula">$1</span>');
  f = f.replace(/\{([^}]+)\}/g, '<span class="example">$1</span>');
  f = f.replace(/\*([^*]+)\*/g, '<span class="highlight">$1</span>');
  return f;
}

function showFloatingMoney(amount: number, positive: boolean): void {
  const el = document.createElement('div');
  el.className = `floating-money ${positive ? 'positive' : 'negative'}`;
  el.textContent = positive ? `+${formatMoney(amount)}` : formatMoney(amount);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function showExplanation(correct: boolean, explanation: string, customTitle: string | null = null, reward: number | null = null): void {
  const question = questions[currentQuestionIndex];
  let correctAnswerText: string;
  if (isTrueFalse(question)) {
    correctAnswerText = question.correctAnswer ? 'Prawda' : 'Falsz';
  } else {
    correctAnswerText = question.answers.find(a => a.correct)!.text;
  }

  const moneyChange = correct ? (reward || GAME_CONFIG.moneyPerCorrect) : GAME_CONFIG.moneyPerWrong;

  if (els.explanationResult) {
    els.explanationResult.textContent = customTitle || (correct ? 'Poprawna odpowiedz!' : 'Bledna odpowiedz!');
    els.explanationResult.className = `explanation-result ${correct ? 'correct' : 'incorrect'}`;
  }

  if (els.explanationMoney) {
    const moneyText = moneyChange >= 0 ? `+${formatMoney(moneyChange)}` : formatMoney(moneyChange);
    if (correct) {
      const info = getDisplayInfo();
      if (info.isActive) {
        els.explanationMoney.innerHTML = `${moneyText} <span class="streak-bonus">${info.fire} x${info.multiplier}</span>`;
      } else {
        els.explanationMoney.textContent = moneyText;
      }
    } else {
      els.explanationMoney.textContent = moneyChange >= 0 ? `+${formatMoney(moneyChange)}` : formatMoney(moneyChange);
    }
  }

  if (els.correctAnswerText) els.correctAnswerText.textContent = correctAnswerText;

  const body = document.querySelector('.explanation-body');
  if (body) body.innerHTML = formatExplanation(explanation);

  if (els.nextBtn) {
    els.nextBtn.textContent = currentQuestionIndex >= questions.length - 1 ? 'Zobacz wynik' : 'Nastepne pytanie';
  }

  els.explanationOverlay?.classList.add('active');
}

function handleTimeOut(): void {
  if (isAnswered) return;
  isAnswered = true;
  resetStreak();
  incorrectAnswersThisGame++;

  const question = questions[currentQuestionIndex];
  let correctIndex: number;
  if (isTrueFalse(question)) {
    correctIndex = question.correctAnswer ? 0 : 1;
  } else {
    correctIndex = question.answers.findIndex(a => a.correct);
  }
  getAnswerBtns()[correctIndex]?.classList.add('correct');

  currentMoney = Math.max(-gameStartMoney, currentMoney + GAME_CONFIG.moneyPerWrong);
  storage.setMoney(gameStartMoney + currentMoney);
  if (question.id) storage.addIncorrectQuestion(question.id);
  playIncorrect();
  showExplanation(false, question.explanation || '', 'Czas minal!');
}

function handleAnswer(selectedIndex: number): void {
  if (isAnswered) return;
  isAnswered = true;
  stopTimer();

  const btns = getAnswerBtns();
  const question = questions[currentQuestionIndex];
  const questionNum = currentQuestionIndex + 1;
  const answerTime = (Date.now() - (questionStartTime || Date.now())) / 1000;

  let isCorrect: boolean;
  let correctIndex: number;
  if (isTrueFalse(question)) {
    const userTrue = selectedIndex === 0;
    isCorrect = userTrue === question.correctAnswer;
    correctIndex = question.correctAnswer ? 0 : 1;
  } else {
    isCorrect = question.answers[selectedIndex].correct;
    correctIndex = question.answers.findIndex(a => a.correct);
  }

  btns.forEach(b => b.disabled = true);
  btns[selectedIndex]?.classList.add('selected');
  playClick();

  setTimeout(() => {
    if (isCorrect) {
      btns[selectedIndex]?.classList.remove('selected');
      btns[selectedIndex]?.classList.add('correct');
      incrementStreak();
      if (isNewLevel()) playStreak();

      let reward = GAME_CONFIG.moneyPerCorrect;
      const sm = getMultiplier();
      reward = calculateReward(GAME_CONFIG.moneyPerCorrect, questionNum, sm);
      if (isDailyChallenge) reward = Math.round(reward * DAILY_MONEY_MULTIPLIER);

      currentMoney += reward;
      storage.setMoney(gameStartMoney + currentMoney);
      storage.setFastestAnswer(answerTime);

      if (question.category) {
        storage.incrementCategoryCorrect(question.category);
      }

      if (question.id) storage.removeIncorrectQuestion(question.id);
      playCorrect();
      showFloatingMoney(reward, true);
      showExplanation(true, question.explanation || '', null, reward);
    } else {
      btns[selectedIndex]?.classList.remove('selected');
      btns[selectedIndex]?.classList.add('incorrect');
      resetStreak();
      incorrectAnswersThisGame++;
      btns[correctIndex]?.classList.add('correct');

      currentMoney = Math.max(-gameStartMoney, currentMoney + GAME_CONFIG.moneyPerWrong);
      storage.setMoney(gameStartMoney + currentMoney);
      if (question.id) storage.addIncorrectQuestion(question.id);
      playIncorrect();
      showFloatingMoney(GAME_CONFIG.moneyPerWrong, false);
      showExplanation(false, question.explanation || '');
    }

    checkAllAchievements();
  }, 1500);
}

function loadQuestion(): void {
  if (currentQuestionIndex >= questions.length) {
    endGame();
    return;
  }

  isAnswered = false;
  fiftyUsedThisQuestion = false;
  timerWarningPlayed = false;
  questionStartTime = Date.now();

  const question = questions[currentQuestionIndex];
  const questionNum = currentQuestionIndex + 1;

  if (els.questionNumber) {
    if (isDailyChallenge) els.questionNumber.textContent = `Wyzwanie dnia ${questionNum}/${questions.length}`;
    else if (isPracticeMode) els.questionNumber.textContent = `Cwiczenie ${questionNum}/${questions.length}`;
    else els.questionNumber.textContent = `Pytanie ${questionNum}/${questions.length}`;
  }

  if (els.questionText) els.questionText.textContent = question.question;
  if (els.currentMoney) els.currentMoney.textContent = formatMoney(Math.max(0, currentMoney));

  updateDifficultyIndicator(questionNum);
  updateStreakDisplay();

  const btns = getAnswerBtns();
  if (isTrueFalse(question)) {
    const labels = ['Prawda', 'Falsz'];
    btns.forEach((btn, i) => {
      btn.classList.remove('selected', 'correct', 'incorrect', 'hidden');
      if (i < 2) {
        btn.disabled = false;
        btn.style.display = '';
        btn.querySelector('.answer-letter')!.textContent = '';
        btn.querySelector('.answer-text')!.textContent = labels[i];
      } else {
        btn.style.display = 'none';
        btn.disabled = true;
      }
    });
  } else {
    const letters = ['A', 'B', 'C', 'D'];
    btns.forEach((btn, i) => {
      btn.classList.remove('selected', 'correct', 'incorrect', 'hidden');
      btn.style.display = '';
      btn.disabled = false;
      btn.querySelector('.answer-letter')!.textContent = `${letters[i]}:`;
      btn.querySelector('.answer-text')!.textContent = question.answers[i].text;
    });
  }

  updateLifelineCounts();

  if (isTrueFalse(question) && els.lifelineFifty) {
    (els.lifelineFifty as HTMLButtonElement).disabled = true;
  }

  startTimer();
}

function nextQuestion(): void {
  els.explanationOverlay?.classList.remove('active');
  currentQuestionIndex++;
  loadQuestion();
}

function endGame(): void {
  stopTimer();
  els.explanationOverlay?.classList.remove('active');

  const earned = currentMoney;
  const isPerfect = incorrectAnswersThisGame === 0 && !isPracticeMode;
  const noLifelines = lifelinesUsedThisGame === 0;

  if (isDailyChallenge) {
    markCompleted();
    if (els.endTitle) { els.endTitle.textContent = 'Wyzwanie dnia ukonczone!'; els.endTitle.className = 'end-title win'; }
    checkAchievement('daily_champion');
  } else if (isPracticeMode) {
    const remaining = storage.getIncorrectCount();
    if (els.endTitle) { els.endTitle.textContent = 'Cwiczenie zakonczone!'; els.endTitle.className = 'end-title win'; }
    if (els.endMoney) {
      els.endMoney.textContent = remaining === 0 ? 'Swietnie! Opanowales wszystkie pytania!' : `Pozostalo ${remaining} pytan do powtorki.`;
    }
  } else {
    if (earned > 0) {
      if (els.endTitle) { els.endTitle.textContent = 'Gratulacje!'; els.endTitle.className = 'end-title win'; }
      storage.incrementGamesWon();
      checkAchievement('first_win');
      if (isPerfect) { storage.incrementPerfectGames(); checkAchievement('perfect_game'); }
      if (noLifelines && isPerfect) { storage.incrementGamesWonNoLifelines(); checkAchievement('no_lifelines'); }
    } else {
      if (els.endTitle) { els.endTitle.textContent = 'Koniec gry!'; els.endTitle.className = 'end-title lose'; }
    }

    const earnedText = earned >= 0 ? `+${formatMoney(earned)}` : formatMoney(earned);
    if (els.endMoney) {
      els.endMoney.textContent = `Zarobiles w tej grze: ${earnedText}`;
      if (earned > 0) {
        const pos = addLeaderboardScore(earned, 'Gracz');
        if (pos && pos <= 10) {
          els.endMoney.innerHTML += `<br><span class="leaderboard-position">Miejsce #${pos} na tablicy wynikow!</span>`;
        }
      }
    }
  }

  checkAllAchievements();
  els.endScreen?.classList.add('active');
  scheduleSave();
}

function useFiftyFifty(): void {
  if (isAnswered || fiftyUsedThisQuestion) return;
  if (!storage.useLifeline('fifty')) return;

  fiftyUsedThisQuestion = true;
  lifelinesUsedThisGame++;
  updateLifelineCounts();

  const question = questions[currentQuestionIndex];
  if (isTrueFalse(question)) return;

  const questionNum = currentQuestionIndex + 1;
  const wrongIndices: number[] = [];
  question.answers.forEach((a, i) => { if (!a.correct) wrongIndices.push(i); });

  const toRemoveCount = getFiftyRemoves(questionNum);
  const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
  const toHide = shuffled.slice(0, toRemoveCount);
  const btns = getAnswerBtns();
  toHide.forEach(i => { btns[i]?.classList.add('hidden'); btns[i].disabled = true; });
  playClick();
}

function useSkip(): void {
  if (isAnswered) return;
  if (!storage.useLifeline('skip')) return;
  stopTimer();
  lifelinesUsedThisGame++;
  updateLifelineCounts();
  playClick();
  currentQuestionIndex++;
  loadQuestion();
}

function useExtraTime(): void {
  if (isAnswered) return;
  if (!storage.useLifeline('time')) return;
  timeLeft += 30;
  lifelinesUsedThisGame++;
  updateLifelineCounts();
  updateTimerDisplay();
  playClick();
}

function confirmExit(): void {
  if (els.endScreen?.classList.contains('active')) {
    // Game is already over, just go back
    window.location.href = 'index.html';
    return;
  }
  if (confirm('Czy na pewno chcesz wyjsc? Postep nie zostanie zapisany.')) {
    window.location.href = 'index.html';
  }
}

export function initGame(): void {
  cacheElements();
  initSound();
  applyTheme();
  updateLifelineCounts();
  initKeyboard();

  // Bind answer buttons
  getAnswerBtns().forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index || '0');
      handleAnswer(idx);
    });
  });

  els.nextBtn?.addEventListener('click', () => nextQuestion());
  els.lifelineFifty?.addEventListener('click', () => useFiftyFifty());
  els.lifelineSkip?.addEventListener('click', () => useSkip());
  els.lifelineTime?.addEventListener('click', () => useExtraTime());

  setAnswerCallback((index) => {
    if (isAnswered) return;
    const question = questions[currentQuestionIndex];
    const maxAnswers = isTrueFalse(question) ? 2 : 4;
    if (index < maxAnswers) {
      const btns = getAnswerBtns();
      if (btns[index] && !btns[index].disabled && !btns[index].classList.contains('hidden')) {
        btns[index].click();
      }
    }
  });

  setNextCallback(() => {
    if (els.explanationOverlay?.classList.contains('active')) {
      nextQuestion();
    }
  });

  setEscapeCallback(() => {
    confirmExit();
  });

  // Back to menu button with confirmation
  const backBtn = document.getElementById('back-to-menu');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      confirmExit();
    });
  }

  // Also intercept browser back/refresh during active game
  window.addEventListener('beforeunload', (e) => {
    if (!els.endScreen?.classList.contains('active')) {
      e.preventDefault();
    }
  });

  initStreak();
  startGame();
}

function startGame(): void {
  loadCachedQuestions();

  const urlParams = new URLSearchParams(window.location.search);
  isPracticeMode = urlParams.get('practice') === 'true';
  isDailyChallenge = urlParams.get('daily') === 'true';

  lifelinesUsedThisGame = 0;
  incorrectAnswersThisGame = 0;

  if (isDailyChallenge) {
    if (isCompletedToday()) {
      alert('Dzisiejsze wyzwanie zostalo juz ukonczone! Wroc jutro.');
      window.location.href = 'index.html';
      return;
    }
    questions = getDailyQuestions(getQuestions()).map(q => shuffleAnswers(q));
  } else if (isPracticeMode) {
    if (!isLoggedIn()) {
      alert('Zaloguj sie, aby korzystac z trybu cwiczen.');
      window.location.href = 'index.html';
      return;
    }

    const incorrectIds = storage.getIncorrectQuestions();
    const allQ = getQuestions();
    const incorrectQuestions = allQ.filter(q => q.id && incorrectIds.includes(q.id));
    questions = incorrectQuestions.map(q => shuffleAnswers(q));

    if (questions.length === 0) {
      alert('Nie masz zadnych blednych pytan do cwiczenia!');
      window.location.href = 'index.html';
      return;
    }
  } else {
    questions = getRandomQuestions(GAME_CONFIG.questionsPerGame).map(q => shuffleAnswers(q));
    storage.incrementGamesPlayed();
  }

  currentQuestionIndex = 0;
  gameStartMoney = storage.getMoney() || 0;
  currentMoney = 0;
  resetStreak();
  loadQuestion();
}
