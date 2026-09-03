// One-time roll number capture for students & candidates.
// Stored per (role, email) so each user is asked only once per browser.
const STORAGE_KEY = "campusvote_roll_numbers";

type RollMap = Record<string, string>;

function loadMap(): RollMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RollMap) : {};
  } catch {
    return {};
  }
}

function saveMap(map: RollMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors (private mode / quota).
  }
}

function keyFor(role: string, email: string): string {
  return `${role.toLowerCase()}:${email.trim().toLowerCase()}`;
}

export function getRollNumber(role: string, email: string): string | null {
  return loadMap()[keyFor(role, email)] || null;
}

export function hasRollNumber(role: string, email: string): boolean {
  return Boolean(getRollNumber(role, email));
}

export function saveRollNumber(
  role: string,
  email: string,
  rollNumber: string
) {
  const map = loadMap();
  map[keyFor(role, email)] = rollNumber.trim();
  saveMap(map);
}
