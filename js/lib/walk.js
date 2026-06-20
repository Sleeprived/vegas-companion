/* Strip walk-time helper (spec §6). Pure, DOM-free, shared by UI and tests.

   APPROXIMATE BY DESIGN. The Strip is roughly linear north-south, so each landmark
   gets a position in miles from a southern anchor (Mandalay Bay = 0). Walk time is
   derived from the distance between two positions at a slow tourist pace plus a
   fixed overhead for getting in/out of the giant properties and crossing streets.
   This guarantees a consistent, symmetric "matrix" without hand-authoring hundreds
   of cells. It does NOT know about live routing, construction, closures, weather,
   or which side of the street you're on. Treat every number as a ballpark.

   Positions are approximate and editable here only (not user-facing). */

export const WALK_MPH = 2.8; // slow, crowded, hot tourist pace
export const OVERHEAD_MIN = 3; // entering/exiting properties + crossings; you're never 0 min apart

/* Free resort trams (no charge). The east-side Monorail is paid and not modeled. */
export const TRAM_LINES = [
  { id: "aria-express", name: "Aria Express Tram (free)", free: true, stops: ["bellagio", "aria", "parkmgm"] },
  { id: "mirage-ti", name: "Mirage–TI Tram (free)", free: true, stops: ["mirage", "ti"] },
  { id: "mandalay", name: "Mandalay Bay Tram (free)", free: true, stops: ["mandalay", "luxor", "excalibur"] },
];

export const MONORAIL_NOTE =
  "The Las Vegas Monorail (east side: MGM Grand to Sahara via Bally's, Flamingo/Caesars, Harrah's/LINQ, and the Convention Center) is fast but PAID and separate from the free resort trams.";

/* id, display name, position in miles (south -> north), and free-tram membership. */
export const LANDMARKS = [
  { id: "mandalay", name: "Mandalay Bay", mile: 0.0, tram: "mandalay" },
  { id: "luxor", name: "Luxor", mile: 0.3, tram: "mandalay" },
  { id: "excalibur", name: "Excalibur", mile: 0.55, tram: "mandalay" },
  { id: "tropicana", name: "Tropicana corner", mile: 0.6, tram: null },
  { id: "mgm", name: "MGM Grand", mile: 0.7, tram: null },
  { id: "nyny", name: "New York-New York", mile: 0.75, tram: null },
  { id: "parkmgm", name: "Park MGM", mile: 0.9, tram: "aria-express" },
  { id: "tmobile", name: "T-Mobile Arena", mile: 0.95, tram: null },
  { id: "aria", name: "Aria / CityCenter", mile: 1.1, tram: "aria-express" },
  { id: "cosmopolitan", name: "The Cosmopolitan", mile: 1.2, tram: null },
  { id: "planethollywood", name: "Planet Hollywood", mile: 1.3, tram: null },
  { id: "paris", name: "Paris Las Vegas", mile: 1.4, tram: null },
  { id: "bellagio", name: "Bellagio", mile: 1.5, tram: "aria-express" },
  { id: "ballys", name: "Horseshoe (Bally's)", mile: 1.55, tram: null },
  { id: "caesars", name: "Caesars Palace", mile: 1.7, tram: null },
  { id: "flamingo", name: "Flamingo", mile: 1.75, tram: null },
  { id: "linq", name: "The LINQ / High Roller", mile: 1.85, tram: null },
  { id: "harrahs", name: "Harrah's", mile: 1.9, tram: null },
  { id: "mirage", name: "The Mirage", mile: 2.0, tram: "mirage-ti" },
  { id: "venetian", name: "Venetian / Palazzo", mile: 2.2, tram: null },
  { id: "ti", name: "Treasure Island", mile: 2.25, tram: "mirage-ti" },
  { id: "wynn", name: "Wynn / Encore", mile: 2.5, tram: null },
  { id: "fashionshow", name: "Fashion Show Mall", mile: 2.6, tram: null },
  { id: "resortsworld", name: "Resorts World", mile: 2.9, tram: null },
  { id: "strat", name: "The STRAT", mile: 3.6, tram: null },
];

export const LANDMARK_IDS = LANDMARKS.map((l) => l.id);

export function landmarkById(id) {
  return LANDMARKS.find((l) => l.id === id) || null;
}

export function tramLineById(id) {
  return TRAM_LINES.find((t) => t.id === id) || null;
}

/* The free tram line shared by both landmarks, or null. */
export function sharedTram(aId, bId) {
  const a = landmarkById(aId);
  const b = landmarkById(bId);
  if (!a || !b || !a.tram || a.tram !== b.tram) return null;
  return tramLineById(a.tram);
}

function verdictFor(minutes, sameTram) {
  if (minutes <= 12) return "walk";
  if (sameTram) return "maybe"; // a free tram connects them — easy ride
  if (minutes <= 25) return "maybe";
  return "ride";
}

/* The walk between two landmark ids. Returns null if either id is unknown. */
export function walkBetween(originId, destId) {
  const a = landmarkById(originId);
  const b = landmarkById(destId);
  if (!a || !b) return null;

  const miles = Math.abs(a.mile - b.mile);
  const tram = sharedTram(originId, destId);

  if (originId === destId) {
    return { originId, destId, miles: 0, minutes: 0, verdict: "same", sameTram: false, tram: null };
  }

  const minutes = Math.round((miles / WALK_MPH) * 60 + OVERHEAD_MIN);
  return {
    originId,
    destId,
    miles: Math.round(miles * 10) / 10,
    minutes,
    verdict: verdictFor(minutes, !!tram),
    sameTram: !!tram,
    tram,
  };
}

export const VERDICT_TEXT = {
  same: "Same place.",
  walk: "Easy walk.",
  maybe: "Walkable, but a tram or the Monorail may be quicker.",
  ride: "Long walk — consider the Monorail or a rideshare.",
};
