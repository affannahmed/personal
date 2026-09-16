/* =========================================================
   BEFORE YOU DEPLOY — read this
   =========================================================
   This site emails you the answers using Formspree, a free
   service that turns a form submission into an email.

   1. Go to https://formspree.io and sign up (free plan is fine).
   2. Create a new form, set the recipient email to
      affanahmed395@gmail.com, and confirm it via the email
      Formspree sends you.
   3. Copy the "Form ID" (it looks like "abcdwxyz") or the full
      endpoint they give you, e.g. https://formspree.io/f/abcdwxyz
   4. Paste it below, replacing the existing endpoint if needed.

   If it can't reach Formspree, the page still works end-to-end —
   it falls back to opening your email app with everything
   pre-filled instead.
   ========================================================= */
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvkonnyg";
const NOTIFY_EMAIL = "affanahmed395@gmail.com";

// ---------- state ----------
const state = {
  day: null,
  time: null,
  place: null,
  food: null,
  movieWanted: null, // true | false
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
const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const declineHint = document.getElementById('declineHint');

yesBtn.addEventListener('click', () => goToStep(1));

noBtn.addEventListener('click', () => {
  // No means no — button just registers the answer, nothing cute about it.
  yesBtn.disabled = true;
  noBtn.disabled = true;
  yesBtn.style.opacity = '0.4';
  noBtn.style.opacity = '0.4';
  declineHint.textContent = "Okay, no worries. Thanks for reading anyway.";
});

// ---------- step 1: day, time, place ----------
const dayGrid = document.getElementById('dayGrid');
const timeInput = document.getElementById('timeInput');
const placeInput = document.getElementById('placeInput');
const logisticsContinueBtn = document.getElementById('logisticsContinueBtn');

dayGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.option-pill');
  if (!btn) return;
  dayGrid.querySelectorAll('.option-pill').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.day = btn.dataset.day;
  updateLogisticsReady();
});

timeInput.addEventListener('change', updateLogisticsReady);

function updateLogisticsReady() {
  const ready = Boolean(state.day) && Boolean(timeInput.value);
  logisticsContinueBtn.classList.toggle('ready', ready);
}

logisticsContinueBtn.addEventListener('click', () => {
  if (!state.day || !timeInput.value) return;
  state.time = to12Hour(timeInput.value);
  state.place = placeInput.value.trim() || null;
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

// ---------- step 3: movie (optional) ----------
const movieAskGrid = document.getElementById('movieAskGrid');
const movieOptions = document.getElementById('movieOptions');
const movieContinueBtn = document.getElementById('movieContinueBtn');

movieAskGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.option-pill');
  if (!btn) return;
  movieAskGrid.querySelectorAll('.option-pill').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  const wantsMovie = btn.dataset.movieWanted === 'yes';
  state.movieWanted = wantsMovie;

  if (wantsMovie) {
    movieOptions.classList.remove('hidden');
    movieContinueBtn.classList.remove('ready'); // must pick a showtime instead
  } else {
    movieOptions.classList.add('hidden');
    state.movie = null;
    state.movieTime = null;
    movieContinueBtn.classList.add('ready');
  }
});

document.querySelectorAll('.showtime').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.showtime').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.movie = btn.dataset.movie;
    state.movieTime = btn.dataset.time;
    finish();
  });
});

movieContinueBtn.addEventListener('click', () => {
  if (state.movieWanted === null) return;
  if (state.movieWanted && !state.movie) return; // picking a showtime finishes automatically
  finish();
});

// ---------- step 4: confirmation + send ----------
function finish() {
  document.getElementById('sumDay').textContent = state.day;
  document.getElementById('sumTime').textContent = state.time;
  document.getElementById('sumPlace').textContent = state.place || "wherever I pick";
  document.getElementById('sumFood').textContent = state.food;
  document.getElementById('sumMovie').textContent = state.movie
    ? `${state.movie} — ${state.movieTime}`
    : "skipping the movie this time";

  const pickup = minutesBefore(timeInput.value, 20);
  document.getElementById('pickupLine').textContent =
    `I'll aim to be there by ${pickup}, a bit early just in case.`;

  goToStep(4);
  sendDetails(pickup);
}

async function sendDetails(pickup) {
  const statusEl = document.getElementById('sendStatus');
  const payload = {
    _subject: "She said yes — date details",
    day: state.day,
    time: state.time,
    pickup_time: pickup,
    place: state.place || "not specified — picking myself",
    food_choice: state.food,
    movie_choice: state.movie ? `${state.movie} (${state.movieTime})` : "no movie",
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
      `Day: ${state.day}\nTime: ${state.time}\nPickup: ${pickup}\nPlace: ${payload.place}\nFood: ${state.food}\nMovie: ${payload.movie_choice}`
    );
    const mailto = `mailto:${NOTIFY_EMAIL}?subject=${encodeURIComponent('She said yes — date details')}&body=${body}`;
    statusEl.innerHTML = `<a href="${mailto}">tap here to send the details</a>`;
  }
}
