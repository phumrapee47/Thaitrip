# Prompt: Thailand Travel Journal (unlock-map app)

Copy everything below into Claude Code to start the project.

---

Build a mobile app called **"Travel Journal ไทย"** — a personal travel journal where the user pins provinces they've visited on a gamified 3D map that "unlocks" as they go. Scope for v1: Thailand's 76 provinces only (no other countries yet).

## Tech stack
- React Native + Expo (managed workflow) for fast iteration and testing via Expo Go
- TypeScript
- react-native-svg for the map
- react-native-reanimated for the 3D tilt / unlock animation
- expo-sqlite (or AsyncStorage for the very first pass) for local persistence — no backend/sync in v1
- expo-image-picker for attaching trip photos

## Province data
I have a ready-made data file with all 76 provinces already converted from GeoJSON into flat SVG path coordinates, with English + Thai names and a 6-region tag (north/northeast/central/east/west/south) and a centroid point per province:

- `thailand-provinces.ts` — typed array, ready to `import { PROVINCES, MAP_WIDTH, MAP_HEIGHT } from './thailand-provinces'`
- `thailand-provinces.json` — same data as plain JSON

Drop `thailand-provinces.ts` straight into the project (e.g. `src/data/thailand-provinces.ts`) and use it as the source of truth for rendering the map — don't regenerate or re-derive the path data. Note: Bueng Kan province is missing from the source dataset (76 of 77 provinces); it's fine to ship without it for v1.

## Feature 1 — 3D unlock map (home screen)
- Render all provinces as SVG paths inside a tilted (isometric-ish) 3D container using `react-native-reanimated`'s transform matrix (rotateX around 30–40°), so the whole map reads like a diorama sitting on a base surface.
- Each province is a "tile" with two overlapping paths: a `top` face and a `side` face (same path data, side rendered underneath/behind).
  - **Locked** (no journal entries yet): `top` sits flat, gray fill, no visible side.
  - **Unlocked** (≥1 journal entry): `top` is translated up a few units and filled teal/green; the `side` face becomes visible underneath in a darker shade, creating a "popped-up block" look. Animate the transition with a spring/bounce easing.
- Progress header above the map: "ปลดล็อกแล้ว X / 76 จังหวัด" with a thin progress bar.
- Small legend (locked vs unlocked) below the map.
- Tapping a province opens its detail screen (see Feature 2). Tapping a locked province with no entries yet should let the user add the first entry, which unlocks it.

## Feature 2 — Journal entries per province
- Each province can have multiple entries: date visited, title/place name, free-text notes, one or more photos, tags (e.g. ทะเล, ภูเขา, วัด, คาเฟ่).
- Province detail screen: show the province's Thai name, list all entries for it (most recent first), a "+ เพิ่มบันทึกใหม่" button to add one.
- Adding the first entry for a province flips it to "unlocked" and should feel rewarding (return to the map with the unlock animation playing on that tile).

## Feature 3 — Stats / overview screen
- Total provinces unlocked, total number of entries, and which region (ภาคเหนือ/อีสาน/กลาง/ตะวันออก/ตะวันตก/ใต้ — use the `region` field already in the data) the user has visited the most of.
- A simple reverse-chronological timeline of all entries across every province.

## Data model
```ts
interface JournalEntry {
  id: string;
  provinceId: string;   // matches Province.id from thailand-provinces.ts
  title: string;
  date: string;         // ISO date
  notes: string;
  photoUris: string[];
  tags: string[];
}
// Province.isVisited is derived: entries.some(e => e.provinceId === province.id)
```

## Design direction
- Locked = light gray, flat. Unlocked = teal/green (#1D9E75 top face, #0F6E56 side face), elevated.
- Clean, minimal UI — the map is the star. Avoid clutter; keep per-province labels for on tap/detail screen only, not on the map itself (76 tiny labels would be unreadable).
- Sentence case, simple Thai copy throughout.

## Build order
1. Scaffold the Expo + TypeScript project, drop in `thailand-provinces.ts`.
2. Get the flat 2D map rendering first (all provinces as plain gray SVG paths, tap to toggle a local "visited" boolean in memory) — validates the path data and tap targets before adding any 3D/animation complexity.
3. Add the 3D tilt container and the unlock (flat → elevated block) animation.
4. Wire up local storage (expo-sqlite) and the journal entry data model; replace the in-memory toggle with "unlocked if entries.length > 0."
5. Build the province detail screen (list entries, add entry form with photo picker).
6. Build the stats/overview screen last.

Start with step 1 and show me the running result before moving on.
