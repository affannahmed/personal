/* =========================================================
   BEFORE YOU DEPLOY — read this
   =========================================================
   This site emails you the answers (time / food / movie) using
   Formspree, a free service that turns a form submission into
   an email. You need a form ID once, it takes 2 minutes:

   1. Go to https://formspree.io and sign up (free plan is fine).
   2. Create a new form, set the recipient email to
      affanahmed395@gmail.com, and confirm it via the email
      Formspree sends you.
   3. Copy the "Form ID" (it looks like "abcdwxyz") or the full
      endpoint they give you, e.g. https://formspree.io/f/abcdwxyz
   4. Paste it below, replacing YOUR_FORM_ID.

   If you skip this step, the page still works end-to-end, it
   just won't be able to email you — it will fall back to
   opening your email app with everything pre-filled instead.
   ========================================================= */
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvkonnyg";
const NOTIFY_EMAIL = "affanahmed395@gmail.com";

// ---------- state ----------
const state = {
  time: null,
  food: null,
  movie: null,
  movieTime: null,
};

// ---------- ambient background ----------
(function drift() {
  const sky = document.getElementById('sky');
  const count = 14;
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'drift';
    const size = 18 + Math.random() * 46;
    d.style.width = d.style.height = size + 'px';
    d.style.left = Math.random() * 100 + 'vw';
    d.style.setProperty('--drift-x', (Math.random() * 80 - 40) + 'px');
    d.style.animationDuration = (14 + Math.random() * 12) + 's';
    d.style.animationDelay = (Math.random() * 12) + 's';
    sky.appendChild(d);
  }
})();

// ---------- step navigation ----------
const panels = document.querySelectorAll('.panel');
const dots = document.querySelectorAll('.dot');

function goToStep(n) {
  panels.forEach(p => p.classList.toggle('active', Number(p.dataset.step) === n));
  dots.forEach(dot => {
    const i = Number(dot.dataset.dot);
    dot.classList.toggle('done', i < n);
    dot.classList.toggle('current', i === n);
  });
}

goToStep(0);

// ---------- step 0: the ask ----------
const askActions = document.getElementById('askActions');
const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const dodgeHint = document.getElementById('dodgeHint');

const dodgeLines = [
  "nice try.",
  "not happening.",
  "you can't catch this one.",
  "come on, the other button is right there.",
  "okay you're persistent, I respect it. still no.",
];
let dodgeCount = 0;

function dodgeNo() {
  const bounds = askActions.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();
  const maxX = Math.max(bounds.width - btnRect.width - 4, 0);
  const maxY = Math.max(bounds.height - btnRect.height - 4, 0);
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;
  noBtn.style.left = x + 'px';
  noBtn.style.top = y + 'px';
  dodgeCount++;
  dodgeHint.textContent = dodgeLines[Math.min(dodgeCount - 1, dodgeLines.length - 1)];
}

function placeNoButtonInitially() {
  const bounds = askActions.getBoundingClientRect();
  const yesRect = yesBtn.getBoundingClientRect();
  const noRect = noBtn.getBoundingClientRect();
  let left = yesRect.right - bounds.left + 14;
  const maxLeft = Math.max(bounds.width - noRect.width - 4, 0);
  left = Math.min(left, maxLeft);
  noBtn.style.left = left + 'px';
  noBtn.style.top = (yesRect.top - bounds.top) + 'px';
}

window.addEventListener('load', placeNoButtonInitially);
window.addEventListener('resize', placeNoButtonInitially);

noBtn.addEventListener('pointerenter', dodgeNo);
noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); dodgeNo(); }, { passive: false });
noBtn.addEventListener('click', (e) => { e.preventDefault(); dodgeNo(); });

yesBtn.addEventListener('click', () => goToStep(1));

// ---------- step 1: time ----------
const timeInput = document.getElementById('timeInput');
const timeConfirmBtn = document.getElementById('timeConfirmBtn');

timeConfirmBtn.addEventListener('click', () => {
  if (!timeInput.value) return;
  state.time = to12Hour(timeInput.value);
  goToStep(2);
});

function to12Hour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function minutesBefore(hhmm, minutesToSubtract) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m - minutesToSubtract;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(wrapped / 60);
  const mm = wrapped % 60;
  return to12Hour(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
}

// ---------- step 2: food ----------
const foodGrid = document.getElementById('foodGrid');
const foodContinueBtn = document.getElementById('foodContinueBtn');

foodGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.option-pill');
  if (!btn) return;
  foodGrid.querySelectorAll('.option-pill').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.food = btn.dataset.food;
  foodContinueBtn.classList.add('ready');
});

foodContinueBtn.addEventListener('click', () => {
  if (!state.food) return;
  goToStep(3);
});

// ---------- step 3: movie ----------
document.querySelectorAll('.showtime').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.showtime').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.movie = btn.dataset.movie;
    state.movieTime = btn.dataset.time;
    finish();
  });
});

// ---------- step 4: confirmation + send ----------
function finish() {
  document.getElementById('sumTime').textContent = state.time;
  document.getElementById('sumFood').textContent = state.food;
  document.getElementById('sumMovie').textContent = `${state.movie} — ${state.movieTime}`;

  const pickup = minutesBefore(timeInput.value, 20);
  document.getElementById('pickupLine').textContent =
    `I'll be there by ${pickup} — twenty minutes early, just in case.`;

  goToStep(4);
  sendDetails(pickup);
}

async function sendDetails(pickup) {
  const statusEl = document.getElementById('sendStatus');
  const payload = {
    _subject: "She said yes 🎉 — date details",
    date_time: state.time,
    pickup_time: pickup,
    food_choice: state.food,
    movie_choice: `${state.movie} (${state.movieTime})`,
  };

  if (FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
    statusEl.textContent = '';
    return;
  }

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      statusEl.textContent = '';
    } else {
      throw new Error('send failed');
    }
  } catch (err) {
    // fallback: open a pre-filled email as a backup delivery method
    const body = encodeURIComponent(
      `Time: ${state.time}\nPickup: ${pickup}\nFood: ${state.food}\nMovie: ${state.movie} (${state.movieTime})`
    );
    const mailto = `mailto:${NOTIFY_EMAIL}?subject=${encodeURIComponent('She said yes 🎉 — date details')}&body=${body}`;
    statusEl.innerHTML = `<a href="${mailto}">tap here to send the details</a>`;
  }
}