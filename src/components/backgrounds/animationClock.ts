// A single reference point, captured once when the JS bundle loads, that
// every background animation phases itself against. Navigating between
// screens unmounts and remounts the background (each screen renders its own
// instance), which would normally snap every orb/particle back to its
// starting position. Deriving "where should this animation be right now"
// from this shared clock instead of from each component's own mount time
// makes the motion look continuous across those remounts.
export const ANIMATION_CLOCK_START = Date.now();
