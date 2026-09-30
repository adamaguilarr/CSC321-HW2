const FALLBACK_WORDS = `which there their about would these other words could write first water after where right think three years place sound great again still every small found those never under might while house world below asked going large until along shall being often earth began since study night light above paper parts young story point times heard whole white given means music miles thing today later using money lines order group among learn known space table early trees short hands state black shown stood front voice kinds makes comes close power lived vowel taken built heart ready quite class bring round horse shows piece green stand birds start river tried least field whose girls leave added color third hours moved plant doing names forms heavy ideas cried check floor begin woman alone plane spell watch carry wrote clear named books child glass human takes party seems blood sides seven mouth solve north value death maybe happy tells gives looks shape lives steps areas sense speak force ocean speed women metal south grass scale cells lower sleep wrong pages ships needs rocks eight major level total ahead reach stars store sight terms catch works board cover songs equal stone waves guess dance spoke break cause radio weeks lands basic liked trade fresh final fight meant drive spent local train bread homes teeth coast thick brown clean quiet sugar facts steel forth rules notes units peace month verbs seeds helps sharp visit woods chief walls cross wings grown cases foods crops fruit stick wants stage sheep nouns plain drink bones apart turns moves touch angle based range marks tired older farms spend shoes goods chair twice cents empty alike style broke pairs count enjoy score shore roots paint heads shook serve angry crowd wheel quick dress share alive noise solid cloth signs hills types drawn worth truck piano upper loved usual faces drove cabin boats towns proud court model prime fifty plans yards prove tools price sheet smell boxes raise match truth roads threw enemy lunch chart scene graph doubt guide winds block grain smoke mixed games wagon sweet topic extra plate title knife fence falls cloud wheat plays enter broad steam atoms press lying basis clock taste grows thank agree brain track smile funny beach stock hurry saved sorry giant trail offer ought rough daily avoid keeps throw allow cream laugh edges teach frame bells dream magic occur ended chord false skill holes dozen brave apple climb outer pitch ruler holds fixed costs calls blank staff labor eaten youth tones honor globe gases doors poles loose apply tears exact brush chest layer whale minor faith tests judge items worry waste hoped strip begun aside lakes bound depth candy event worse aware shell rooms ranch image snake aloud dried likes motor pound knees refer fully chain shirt flour drops spite orbit banks shoot curve tribe tight blind slept shade claim flies theme queen fifth union straw entry issue birth feels anger brief rhyme glory guard flows flesh owned trick yours sizes noted width burst route lungs uncle bears royal kings forty trial cards brass opera chose owner vapor beats mouse tough wires meter tower finds inner stuck arrow poems label swing solar truly tense beans split rises weigh hotel stems pride swung grade digit badly boots pilot sales swept lucky prize stove tubes acres wound steep slide trunk error porch slave exist faced mines marry juice raced waved goose trust fewer favor mills views joint eager spots blend rings adult index nails horns balls flame rates drill trace skins waxed seats stuff ratio minds dirty silly coins hello trips leads rifle hopes bases shine bench moral fires meals shake shops cycle movie slope canoe teams folks fired bands thumb shout canal habit reply ruled fever crust shelf walks midst crack print tales coach stiff flood verse awake rocky march fault swift faint civil ghost feast blade limit germs reads ducks dairy worst gifts lists stops rapid brick claws beads beast skirt cakes lions frogs tries nerve grand armed treat honey moist legal penny crown shock taxes sixty altar pulls sport drums talks dying dates drank blows lever wages proof drugs tanks sings tails pause herds arose hated clues novel shame burnt races flash weary heels token coats spare shiny alarm dimes sixth clerk mercy sunny guest float shone pipes worms bills sweat suits smart upset rains sandy rainy parks sadly fancy rider unity bunch rolls crash craft newly gates hatch paths funds wider grace grave tides admit shift sails pupil tiger angel cruel agent drama urged patch nests vital sword blame weeds screw vocal bacon chalk cargo crazy acted goats arise witch loves queer dwell backs ropes shots merry phone cheek peaks ideal beard eagle creek cries ashes stall yield mayor opens input fleet tooth wives burns poets apron spear organ cliff stamp paste rural baked chase slice slant knock noisy sorts stays wiped blown twist tenth hides comma sweep spoon stern crept maple deeds rides muddy crime jelly ridge drift dusty devil tempo humor sends steal tents waist roses reign noble cheap dense linen geese woven posts hired wrath salad bowed tires shark belts grasp blast polar fungi pearl loads jokes veins frost hears loses hosts diver phase toads alert tasks seams coral focus naked puppy jumps spoil quart macro fears flung spark vivid brook steer spray decay ports socks urban goals grant minus films tunes shaft firms skies bride wreck flock stare hobby bonds dared faded thief crude pants flute votes tonal radar wells skull hairs argue wears dolls voted caves cared broom scent panel fairy olive bends prism lamps cable peach ruins rally purse rigid crawl toast soils sauce basin ponds twins wrist fluid pools brand stalk robot reeds hoofs buses sheer grief bloom dwelt melts risen flags knelt fiber roofs freed armor aimed algae twigs lemon ditch drunk rests chill slain panic cords tuned crisp ledge dived swamp molds yarns liver gauge breed stool gulls awoke gross diary rails belly trend flask stake fried draws actor handy bowls haste scope deals knots moons essay thump hangs bliss dealt gains bombs clown palms cones roast tidal bored chant acids dough camps swore lover cocoa punch award rinsed nine?}`;
const REMOTE_WORDS_URL = "https://raw.githubusercontent.com/Morgenstern2573/wordle_clone/master/build/words.js";
const STORAGE_KEY = "five-letter-club-v1";
const STATS_KEY = "five-letter-club-stats-v1";
const ROWS = 6;
const COLS = 5;
const FALLBACK_SET = new Set(FALLBACK_WORDS.split(/\s+/).filter((word) => /^[a-z]{5}$/.test(word)));
const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const boardElement = document.querySelector("#game-board");
const keyboardElement = document.querySelector("#keyboard");
const toastRegion = document.querySelector("#toast-region");
const helpModal = document.querySelector("#help-modal");
const statsModal = document.querySelector("#stats-modal");
let answerWords = [...FALLBACK_SET];
let acceptedWords = FALLBACK_SET;
let game;
let toastTimer;

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dailyWord(words) {
  const seed = [...todayKey()].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return words[seed % words.length];
}

async function loadWords() {
  try {
    const response = await fetch(REMOTE_WORDS_URL, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return;
    const source = await response.text();
    const arraySource = source.match(/export\s+const\s+WORDS\s*=\s*\[([\s\S]*?)\]/)?.[1];
    if (!arraySource) return;
    const words = [...arraySource.matchAll(/'([a-z]{5})'/g)].map((match) => match[1]);
    if (!words.length) return;
    acceptedWords = new Set([...FALLBACK_SET, ...words]);
    answerWords = words;
  } catch {
    // Keep the local word list available when offline.
  }
}

function readGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.date === todayKey() && typeof saved.answer === "string" && saved.answer.length === COLS) {
      return { answer: saved.answer, date: saved.date, guesses: Array.isArray(saved.guesses) ? saved.guesses.slice(0, ROWS) : [], current: typeof saved.current === "string" ? saved.current.slice(0, COLS) : "", over: Boolean(saved.over) };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { answer: dailyWord(answerWords), date: todayKey(), guesses: [], current: "", over: false };
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
}

function scoreGuess(guess, answer) {
  const result = Array(COLS).fill("absent");
  const remaining = [...answer];
  for (let index = 0; index < COLS; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = "correct";
      remaining[index] = null;
    }
  }
  for (let index = 0; index < COLS; index += 1) {
    if (result[index] !== "correct") {
      const matchIndex = remaining.indexOf(guess[index]);
      if (matchIndex !== -1) {
        result[index] = "present";
        remaining[matchIndex] = null;
      }
    }
  }
  return result;
}

function renderBoard() {
  boardElement.replaceChildren();
  for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "board-row";
    row.setAttribute("role", "row");
    const guess = game.guesses[rowIndex];
    const letters = guess ?? (rowIndex === game.guesses.length ? game.current : "");
    const feedback = guess ? scoreGuess(guess, game.answer) : [];
    for (let columnIndex = 0; columnIndex < COLS; columnIndex += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("role", "gridcell");
      tile.setAttribute("aria-label", letters[columnIndex] ? `${letters[columnIndex].toUpperCase()}${feedback[columnIndex] ? `, ${feedback[columnIndex]}` : ""}` : "Empty");
      if (letters[columnIndex]) {
        tile.textContent = letters[columnIndex];
        if (!guess) tile.classList.add("filled");
      }
      if (guess) {
        tile.classList.add("revealed", feedback[columnIndex]);
        tile.style.animationDelay = `${columnIndex * 120}ms`;
      }
      row.append(tile);
    }
    boardElement.append(row);
  }
  renderKeyboard();
}

function renderKeyboard() {
  keyboardElement.replaceChildren();
  KEY_ROWS.forEach((letters, rowIndex) => {
    const row = document.createElement("div");
    row.className = "key-row";
    if (rowIndex === 2) addKey(row, "Enter", "wide");
    for (const letter of letters) addKey(row, letter);
    if (rowIndex === 2) addKey(row, "Backspace", "wide");
    keyboardElement.append(row);
  });
}

function keyStatuses() {
  const priority = { absent: 1, present: 2, correct: 3 };
  const statuses = new Map();
  for (const guess of game.guesses) {
    scoreGuess(guess, game.answer).forEach((status, index) => {
      const letter = guess[index];
      if (!statuses.has(letter) || priority[status] > priority[statuses.get(letter)]) statuses.set(letter, status);
    });
  }
  return statuses;
}

function addKey(row, value, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `key ${extraClass}`.trim();
  button.textContent = value === "Backspace" ? "Delete" : value;
  button.setAttribute("aria-label", value === "Backspace" ? "Delete letter" : value === "Enter" ? "Submit guess" : value);
  if (value.length === 1) {
    const status = keyStatuses().get(value);
    if (status) button.classList.add(status);
  }
  button.addEventListener("click", () => handleKey(value));
  row.append(button);
}

function showToast(message) {
  toastRegion.replaceChildren();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.append(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 1900);
}

function handleKey(key) {
  if (game.over || helpModal.open || statsModal.open) return;
  if (key === "Enter") {
    submitGuess();
  } else if (key === "Backspace") {
    game.current = game.current.slice(0, -1);
    saveGame();
    renderBoard();
  } else if (/^[a-z]$/i.test(key) && game.current.length < COLS) {
    game.current += key.toLowerCase();
    saveGame();
    renderBoard();
  }
}

function submitGuess() {
  if (game.current.length < COLS) {
    const row = boardElement.children[game.guesses.length];
    row.classList.remove("shake");
    void row.offsetWidth;
    row.classList.add("shake");
    showToast("Five letters make a word.");
    return;
  }
  if (!acceptedWords.has(game.current)) {
    const row = boardElement.children[game.guesses.length];
    row.classList.remove("shake");
    void row.offsetWidth;
    row.classList.add("shake");
    showToast("Not in the word list.");
    return;
  }
  const guess = game.current;
  game.guesses.push(guess);
  game.current = "";
  game.over = guess === game.answer || game.guesses.length === ROWS;
  saveGame();
  renderBoard();
  const finalRow = boardElement.children[game.guesses.length - 1];
  if (guess === game.answer) {
    finalRow.classList.add("bounce");
    recordResult(true);
    setTimeout(() => showToast("Lovely work. You found it!"), 750);
  } else if (game.over) {
    recordResult(false);
    setTimeout(() => showToast(`The word was ${game.answer.toUpperCase()}.`), 650);
  }
}

function readStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATS_KEY));
    return { played: 0, wins: 0, streak: 0, bestStreak: 0, distribution: [0, 0, 0, 0, 0, 0], ...(saved ?? {}) };
  } catch {
    return { played: 0, wins: 0, streak: 0, bestStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };
  }
}

function recordResult(won) {
  const stats = readStats();
  stats.played += 1;
  if (won) {
    stats.wins += 1;
    stats.streak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
    stats.distribution[game.guesses.length - 1] += 1;
  } else {
    stats.streak = 0;
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function renderStats() {
  const stats = readStats();
  document.querySelector("#games-played").textContent = stats.played;
  document.querySelector("#win-rate").textContent = stats.played ? `${Math.round((stats.wins / stats.played) * 100)}%` : "0%";
  document.querySelector("#current-streak").textContent = stats.streak;
  document.querySelector("#best-streak").textContent = stats.bestStreak;
  const distribution = document.querySelector("#guess-distribution");
  distribution.replaceChildren();
  stats.distribution.forEach((count, index) => {
    const row = document.createElement("div");
    row.className = "distribution-row";
    const bar = document.createElement("span");
    bar.className = `distribution-bar${game.guesses.length === index + 1 && game.over && game.guesses.at(-1) === game.answer ? " active" : ""}`;
    bar.style.width = `${Math.max(23, count * 23)}px`;
    bar.textContent = count;
    row.append(`${index + 1}`, bar);
    distribution.append(row);
  });
}

function startNewGame() {
  const candidate = answerWords[Math.floor(Math.random() * answerWords.length)];
  const answer = answerWords.length > 1 && candidate === game.answer ? answerWords[(answerWords.indexOf(candidate) + 1) % answerWords.length] : candidate;
  game = { answer, date: todayKey(), guesses: [], current: "", over: false };
  saveGame();
  renderBoard();
  showToast("A fresh word, just for you.");
}

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === "Escape") {
    if (helpModal.open) helpModal.close();
    if (statsModal.open) statsModal.close();
    return;
  }
  if (helpModal.open || statsModal.open) return;
  if (/^[a-z]$/i.test(event.key) || event.key === "Enter" || event.key === "Backspace") {
    event.preventDefault();
    handleKey(event.key);
  }
});

document.querySelector("#help-button").addEventListener("click", () => helpModal.showModal());
document.querySelector("#stats-button").addEventListener("click", () => { renderStats(); statsModal.showModal(); });
document.querySelector("#new-game-button").addEventListener("click", startNewGame);
document.querySelector("#puzzle-date").textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date());

await loadWords();
game = readGame();
renderBoard();
saveGame();