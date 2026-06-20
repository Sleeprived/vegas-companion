/* Comp estimator (spec §6). Pure math, DOM-free, shared by the UI and tests.

   Model:
     theoretical loss = average bet x decisions-per-hour x hours x house edge
     estimated comps  = theoretical loss AT THE AVERAGE (rating) EDGE x comp rate

   The casino rates your comps off AVERAGE play, not how well you actually play —
   so comps are always figured at the game's average edge, while "your theoretical
   loss" uses the edge for the play style you selected (Average or Optimal), which
   you can also override. For no-skill games (slots/roulette/craps/baccarat) the
   average and optimal edges are the same, so the toggle barely moves.

   House edges are documented standard casino comp-rating assumptions; the optimal
   column matches casino-edge-companion's published optimal edges. Decisions-per-hour
   are typical comp-rating pace figures. ALL values are editable in the UI. */

export const COMP_RATE_DEFAULT_PCT = 33; // casinos typically reinvest ~10-40% of theo

export const GAMES = [
  { id: "blackjack", name: "Blackjack", avgEdgePct: 2.0, optimalEdgePct: 0.5, decisionsPerHour: 70, note: "" },
  { id: "baccarat", name: "Baccarat", avgEdgePct: 1.2, optimalEdgePct: 1.06, decisionsPerHour: 72, note: "" },
  {
    id: "craps",
    name: "Craps",
    avgEdgePct: 1.5,
    optimalEdgePct: 1.41,
    decisionsPerHour: 48,
    note: "Craps is the least precise here — bets, odds, and pace vary widely. Adjust the edge to match how you actually bet.",
  },
  { id: "roulette", name: "Roulette (American)", avgEdgePct: 5.26, optimalEdgePct: 5.26, decisionsPerHour: 38, note: "" },
  { id: "videopoker", name: "Video Poker (9/6 JoB)", avgEdgePct: 2.0, optimalEdgePct: 0.46, decisionsPerHour: 700, note: "" },
  { id: "slots", name: "Slots", avgEdgePct: 8.0, optimalEdgePct: 8.0, decisionsPerHour: 600, note: "" },
];

export const GAME_IDS = GAMES.map((g) => g.id);

export function gameById(id) {
  return GAMES.find((g) => g.id === id) || null;
}

/* Edge (percent) for a play-style basis. */
export function edgeForBasis(game, basis) {
  return basis === "optimal" ? game.optimalEdgePct : game.avgEdgePct;
}

/* theoretical loss = avgBet x decisionsPerHour x hours x (edgePct/100). */
export function theoreticalLoss({ avgBet, decisionsPerHour, hours, edgePct }) {
  const v = avgBet * decisionsPerHour * hours * (edgePct / 100);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/* The full estimate from raw (already-validated) inputs.
   basis: "average" | "optimal". edgePctUsed: optional editable override (percent);
   if null/undefined the basis preset is used. compRatePct: percent (default 33). */
export function estimate({ gameId, avgBet, hours, basis = "average", edgePctOverride = null, compRatePct = COMP_RATE_DEFAULT_PCT }) {
  const game = gameById(gameId);
  if (!game) return null;

  const useBasis = basis === "optimal" ? "optimal" : "average";
  const presetEdge = edgeForBasis(game, useBasis);
  const rawOverride = Number(edgePctOverride);
  const edgePctUsed =
    edgePctOverride == null || edgePctOverride === "" || !Number.isFinite(rawOverride)
      ? presetEdge
      : Math.min(100, Math.max(0, rawOverride)); // clamp to [0,100] (spec §8)

  const dph = game.decisionsPerHour;
  const safeBet = Number.isFinite(avgBet) && avgBet > 0 ? avgBet : 0;
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 0;
  const safeCompPct = Number.isFinite(compRatePct) ? Math.min(100, Math.max(0, compRatePct)) : 0;

  const decisions = dph * safeHours;
  const theoLoss = theoreticalLoss({ avgBet: safeBet, decisionsPerHour: dph, hours: safeHours, edgePct: edgePctUsed });
  const theoLossAvg = theoreticalLoss({ avgBet: safeBet, decisionsPerHour: dph, hours: safeHours, edgePct: game.avgEdgePct });
  const compValue = theoLossAvg * (safeCompPct / 100);

  return {
    game,
    basis: useBasis,
    edgePctUsed,
    decisionsPerHour: dph,
    decisions,
    theoLoss,
    theoLossAvg,
    compValue,
    compRatePct: safeCompPct,
  };
}
