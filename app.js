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

    button.addEventListener("click", () => selectAnswer(choice.value));
    button.addEventListener("keydown", handleAnswerKeys);
    elements.answers.appendChild(button);
  });

  elements.backQuestion.hidden = current === 0;
  saveProgress();
}

function selectAnswer(value) {
  if (isTransitioning || isAnswerAdvancing) return;
  answers[current] = value;
  [...elements.answers.children].forEach((button) => {
    const selected = Number(button.dataset.value) === value;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-checked", String(selected));
    button.disabled = true;
  });
  elements.answers.classList.add("is-locked");
  isAnswerAdvancing = true;
  saveProgress();

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

function showProcessing() {
  showScreen("processing");
  processingTimer = window.setTimeout(showResult, reducedMotion ? 350 : 1750);
}

function showResult() {
  const score = answers.reduce((sum, value) => sum + value, 0);
  const outcome = outcomes.find(({ min, max }) => score >= min && score <= max);
  if (!outcome) return;

  elements.scoreNumber.textContent = score;
  elements.personalMessage.textContent = outcome.message;
  elements.personalTip.textContent = outcome.tip;
  showScreen("result");
  saveProgress();
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
    if (stored.activeScreen === "quiz" && !answers.every((value) => value !== null)) {
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

class AmbientSoundscape {
  constructor() {
    this.context = null;
    this.master = null;
    this.nodes = [];
    this.isPlaying = false;
  }

  async toggle() {
    if (!this.context) this.create();
    if (this.context.state === "suspended") await this.context.resume();
    this.isPlaying ? this.stop() : this.play();
  }

  create() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);

    [174.61, 220, 261.63].forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      oscillator.type = index === 1 ? "sine" : "triangle";
      oscillator.frequency.value = frequency / 2;
      oscillator.detune.value = index * 4 - 4;
      filter.type = "lowpass";
      filter.frequency.value = 380;
      gain.gain.value = index === 1 ? 0.16 : 0.08;
      oscillator.connect(filter).connect(gain).connect(this.master);
      oscillator.start();
      this.nodes.push({ oscillator, gain });
    });
  }

  play() {
    if (!this.master) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.045, now + 1.8);
    this.isPlaying = true;
    this.updateButton();
  }

  stop() {
    if (!this.master) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.8);
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

const soundscape = new AmbientSoundscape();

document.getElementById("startQuiz").addEventListener("click", startQuiz);
elements.backQuestion.addEventListener("click", previousQuestion);
document.getElementById("continueResult").addEventListener("click", showGuidance);
elements.soundToggle.addEventListener("click", () => soundscape.toggle());

document.addEventListener("visibilitychange", () => {
  if (document.hidden && soundscape.isPlaying) soundscape.stop();
});

configureExternalLinks();
restoreProgress();
