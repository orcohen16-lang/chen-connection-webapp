const questions = [
  "כשהילד שלי מספר לי משהו, אני מצליחה להקשיב לו בלי לקטוע אותו או למהר לתת עצות.",
  "הילד שלי מרגיש בנוח לספר לי גם דברים שהוא חושש שאכעס עליהם.",
  "כשאני מציבה גבול והילד מתנגד, אני מצליחה לעמוד בהחלטה שלי.",
  "רוב השיחות שלי עם הילד לא מסתכמות בלבקש ממנו לסדר, להתקלח, להכין שיעורים או להפסיק משהו.",
  "כשהילד שלי מתנהג בצורה שמכעיסה אותי, אני מנסה להבין מה גרם לו להתנהג ככה ולא רק לכעוס על ההתנהגות.",
  "אני מצליחה לתת לילד מקום לכעוס, להתאכזב או לא להסכים איתי בלי להרגיש שאני חייבת לשנות את ההרגשה שלו.",
  "גם כשאני כועסת על הילד, אני מצליחה להימנע מצעקות, העלבות או משפטים שפוגעים בו.",
  "אני אומרת לילד שלי מה אני מעריכה בו, ולא רק מעירה לו על מה שהוא עושה לא נכון.",
  "אני יודעת מה באמת מעסיק את הילד שלי בתקופה האחרונה, מה קשה לו ומה משמח אותו.",
  "גם בתקופות שבהן קשה לנו, אני מרגישה שהילד יודע שאני כתובת עבורו.",
];

const choices = [
  { value: 1, label: "כמעט אף פעם" },
  { value: 2, label: "לפעמים" },
  { value: 3, label: "בדרך כלל" },
  { value: 4, label: "כמעט תמיד" },
];

const outcomes = [
  {
    min: 10,
    max: 19,
    message: "יכול להיות שבתקופה האחרונה הקשר שלכם מתנהל סביב הרבה מתחים, ויכוחים וחוסר הסכמה.",
    tip: "השבוע נסי לייצר 10 דקות ביום שהן רק שלך ושל הילד. בלי טלפון, בלי משימות ובלי הערות. פשוט להיות יחד.",
  },
  {
    min: 20,
    max: 27,
    message: "נראה שיש ביניכם רגעים טובים, יחד עם זאת יש גם מצבים שבהם התקשורת מתפספסת. לפעמים את יודעת מה נכון לעשות ודווקא ברגע האמת קשה ליישם.",
    tip: "בחרי סיטואציה אחת שחוזרת על עצמה בבית ונסי להגיב אליה אחרת השבוע. לא צריך לשנות הכול בבת אחת.",
  },
  {
    min: 28,
    max: 34,
    message: "נראה שיש לך מודעות למערכת היחסים שלכם ורצון להיות שם עבור הילד. יחד עם זאת, גם בקשר טוב יש דברים שאפשר לחזק ולשפר.",
    tip: "שאלי את הילד שלך: ״יש משהו שהיית רוצה שאעשה אחרת כשאנחנו ביחד?״ והפעם, נסי רק להקשיב לתשובה.",
  },
  {
    min: 35,
    max: 40,
    message: "התשובות שלך מצביעות על קשר שיש בו הקשבה, נוכחות ואמון. זה נהדר.",
    tip: "אל תחכי לרגעים קשים כדי לדבר על הקשר ביניכם. המשיכי להתעניין, לשאול, להקשיב ולתת לילד מקום להביא את עצמו.",
  },
];

const config = window.CHEN_APP_CONFIG || {};
const storageKey = "chen-connection-journey-v2";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let current = 0;
let answers = Array(questions.length).fill(null);
let activeScreen = "instructions";
let processingTimer;
let answerAdvanceTimer;
let isTransitioning = false;
let isAnswerAdvancing = false;

const elements = {
  screens: [...document.querySelectorAll(".screen")],
  questionCounter: document.getElementById("questionCounter"),
  questionText: document.getElementById("questionText"),
  answers: document.getElementById("answers"),
  backQuestion: document.getElementById("backQuestion"),
  calculateResult: document.getElementById("calculateResult"),
  progressFill: document.getElementById("progressFill"),
  scoreNumber: document.getElementById("scoreNumber"),
  personalMessage: document.getElementById("personalMessage"),
  personalTip: document.getElementById("personalTip"),
  soundToggle: document.getElementById("soundToggle"),
  soundLabel: document.getElementById("soundLabel"),
};

function showScreen(id, direction = "forward") {
  const next = document.getElementById(id);
  const previous = document.getElementById(activeScreen);
  if (!next || next === previous) return;

  clearTimeout(processingTimer);
  next.hidden = false;
  next.dataset.direction = direction;

  requestAnimationFrame(() => {
    previous?.classList.remove("is-active");
    previous?.classList.add("is-leaving");
    next.classList.add("is-active");
  });

  window.setTimeout(() => {
    if (previous) {
      previous.hidden = true;
      previous.classList.remove("is-leaving");
    }
    next.removeAttribute("data-direction");
    next.querySelector("h1, h2, button, [tabindex]")?.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 460);

  activeScreen = id;
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  saveProgress();
}

function startQuiz() {
  current = 0;
  answers = Array(questions.length).fill(null);
  renderQuestion();
  showScreen("quiz");
}

function renderQuestion() {
  clearTimeout(answerAdvanceTimer);
  isAnswerAdvancing = false;
  const number = current + 1;
  elements.questionText.textContent = questions[current];
  elements.questionCounter.textContent = `שאלה ${number} מתוך ${questions.length}`;
  if (elements.progressFill) {
    elements.progressFill.style.width = `${(number / questions.length) * 100}%`;
  }
  elements.answers.classList.remove("is-locked");
  elements.answers.replaceChildren();

  choices.forEach((choice, index) => {
    const button = document.createElement("button");
    const isSelected = answers[current] === choice.value;
    button.type = "button";
    button.className = `answer${isSelected ? " is-selected" : ""}`;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(isSelected));
    button.dataset.value = choice.value;
    button.style.setProperty("--delay", `${index * 55}ms`);

    const indicator = document.createElement("span");
    indicator.className = "answer-indicator";
    indicator.textContent = choice.value;
    const label = document.createElement("span");
    label.textContent = choice.label;
    button.append(indicator, label);

    button.addEventListener("click", (e) => {
      if (!reducedMotion && !isTransitioning && !isAnswerAdvancing) createRipple(button, e);
      selectAnswer(choice.value);
    });
    button.addEventListener("keydown", handleAnswerKeys);
    elements.answers.appendChild(button);
  });

  elements.backQuestion.hidden = current === 0;
  const isLastQuestion = current === questions.length - 1;
  elements.calculateResult.hidden = !isLastQuestion;
  elements.calculateResult.disabled = !isLastQuestion || answers[current] === null;
  saveProgress();
}

function selectAnswer(value) {
  if (isTransitioning || isAnswerAdvancing) return;
  answers[current] = value;
  const isLastQuestion = current === questions.length - 1;
  [...elements.answers.children].forEach((button) => {
    const selected = Number(button.dataset.value) === value;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-checked", String(selected));
    button.disabled = !isLastQuestion;
  });
  elements.answers.classList.toggle("is-locked", !isLastQuestion);
  elements.calculateResult.disabled = !isLastQuestion;
  saveProgress();

  if (isLastQuestion) return;

  isAnswerAdvancing = true;

  answerAdvanceTimer = window.setTimeout(() => {
    isAnswerAdvancing = false;
    nextQuestion();
  }, reducedMotion ? 0 : 360);
}

function handleAnswerKeys(event) {
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const buttons = [...elements.answers.children];
  const step = ["ArrowDown", "ArrowLeft"].includes(event.key) ? 1 : -1;
  const nextIndex = (buttons.indexOf(event.currentTarget) + step + buttons.length) % buttons.length;
  buttons[nextIndex].focus();
  buttons[nextIndex].click();
}

function nextQuestion() {
  if (answers[current] === null || isTransitioning) return;
  if (current < questions.length - 1) {
    transitionToQuestion(1);
    return;
  }
  showProcessing();
}

function previousQuestion() {
  if (current === 0 || isTransitioning || isAnswerAdvancing) return;
  transitionToQuestion(-1);
}

function transitionToQuestion(step) {
  isTransitioning = true;
  const content = document.querySelector("#quiz .screen-content");
  content.classList.remove("is-switching");
  void content.offsetWidth;
  content.classList.add("is-switching");

  window.setTimeout(() => {
    current += step;
    renderQuestion();
    animateQuestionChange();
  }, reducedMotion ? 0 : 260);

  window.setTimeout(() => {
    content.classList.remove("is-switching");
    isTransitioning = false;
  }, reducedMotion ? 0 : 620);
}

function animateQuestionChange() {
  const content = document.querySelector("#quiz .screen-content");
  content.classList.remove("question-refresh");
  requestAnimationFrame(() => content.classList.add("question-refresh"));
}

function createRipple(button, event) {
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  const size = Math.max(rect.width, rect.height);
  const x = (event ? event.clientX - rect.left : rect.width / 2) - size / 2;
  const y = (event ? event.clientY - rect.top : rect.height / 2) - size / 2;
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  button.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

function animateCountUp(element, target, duration) {
  if (reducedMotion) { element.textContent = target; return; }
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function showProcessing() {
  showScreen("processing");
  processingTimer = window.setTimeout(showResult, reducedMotion ? 350 : 3800);
}

function showResult() {
  const score = answers.reduce((sum, value) => sum + value, 0);
  const outcome = outcomes.find(({ min, max }) => score >= min && score <= max);
  if (!outcome) return;

  elements.scoreNumber.textContent = "0";
  elements.personalMessage.textContent = outcome.message;
  elements.personalTip.textContent = outcome.tip;
  showScreen("result");
  saveProgress();
  window.setTimeout(() => animateCountUp(elements.scoreNumber, score, 950), reducedMotion ? 0 : 500);
}

function showGuidance() {
  showScreen("guidance");
}

function configureExternalLinks() {
  const phone = String(config.whatsappPhone || "").replace(/\D/g, "");
  const message = encodeURIComponent(config.whatsappMessage || "");
  const instagramUrl = String(config.instagramUrl || "").trim();
  document.getElementById("openWhatsApp").href = `https://wa.me/${phone}${message ? `?text=${message}` : ""}`;
  document.getElementById("openInstagram").href = instagramUrl;
}

function saveProgress() {
  if (!config.preserveProgress) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify({ current, answers, activeScreen }));
  } catch (_) {
    // The experience still works when storage is unavailable.
  }
}

function restoreProgress() {
  if (!config.preserveProgress) return false;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (!stored || !Array.isArray(stored.answers) || stored.answers.length !== questions.length) return false;
    answers = stored.answers.map((value) => (choices.some((choice) => choice.value === value) ? value : null));
    current = Math.min(Math.max(Number(stored.current) || 0, 0), questions.length - 1);
    if (stored.activeScreen === "quiz") {
      renderQuestion();
      showScreen("quiz");
      return true;
    }
    clearStoredProgress();
  } catch (_) {
    clearStoredProgress();
  }
  return false;
}

function clearStoredProgress() {
  try {
    localStorage.removeItem(storageKey);
  } catch (_) {
    // No action needed.
  }
}

class BackgroundMusic {
  constructor(audioElement) {
    this.audio = audioElement;
    this.audio.volume = 0.28;
    this.isPlaying = false;
  }

  async toggle() {
    if (this.isPlaying) {
      this.stop();
      return;
    }
    await this.play();
  }

  async play() {
    try {
      await this.audio.play();
      this.isPlaying = true;
      this.updateButton();
    } catch (_) {
      this.isPlaying = false;
      this.updateButton();
    }
  }

  stop() {
    this.audio.pause();
    this.isPlaying = false;
    this.updateButton();
  }

  updateButton() {
    elements.soundToggle.classList.toggle("is-playing", this.isPlaying);
    elements.soundToggle.setAttribute("aria-pressed", String(this.isPlaying));
    elements.soundToggle.setAttribute("aria-label", this.isPlaying ? "השתקת מוזיקת רקע" : "הפעלת מוזיקת רקע");
    elements.soundLabel.textContent = this.isPlaying ? "מוזיקה פועלת" : "מוזיקה";
  }
}

const backgroundMusic = new BackgroundMusic(document.getElementById("backgroundMusic"));

document.getElementById("startQuiz").addEventListener("click", startQuiz);
elements.backQuestion.addEventListener("click", previousQuestion);
elements.calculateResult.addEventListener("click", nextQuestion);
document.getElementById("continueResult").addEventListener("click", showGuidance);
elements.soundToggle.addEventListener("click", () => backgroundMusic.toggle());

document.addEventListener("visibilitychange", () => {
  if (document.hidden && backgroundMusic.isPlaying) backgroundMusic.stop();
});

configureExternalLinks();
restoreProgress();
