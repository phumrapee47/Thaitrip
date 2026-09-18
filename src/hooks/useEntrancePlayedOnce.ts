import { useRef } from 'react';

/**
 * T120 / US-34 AC2 (docs/design-spec.md §2 "เล่นเฉพาะตอน initial render ครั้งแรก
 * หลังข้อมูลโหลดเสร็จ..."): returns `true` starting from the render pass where
 * `hasData` first becomes true, and keeps returning `true` for as long as
 * `hasData` stays true — including across unrelated re-renders that happen to
 * fire moments later (e.g. `LandmarkList`'s own `setLandmarks(getLandmarksForProvince(id))`
 * effect, whose `.filter()` always returns a fresh array reference even when
 * the data hasn't actually changed; or `NewsScreen`'s `writeNewsCache` ->
 * `setCacheTimestamp`). Only resets to `false` once `hasData` itself goes
 * back to `false` (e.g. the list becomes genuinely empty again), so the next
 * time real data shows up is treated as a fresh "epoch" and gets its own
 * entrance play-through.
 *
 * Bug-fix round 2 (US-34, qa-result.md รอบ 9 บั๊ก 1 / AC2): a previous version
 * derived this from a `useRef` flipped inside a `useEffect`, so the flag
 * flipped to `true` — and this hook's return value flipped to `false` — the
 * moment ANY re-render happened after the first one, even one wholly
 * unrelated to the list's own data. Callers (`LandmarkList`, `NewsScreen`,
 * the Stats timeline) use the return value to decide whether to wrap each
 * item in `EntranceFadeItem`; flipping it to `false` mid-flight swapped the
 * animated wrapper out for a plain, static item BEFORE the fade/slide
 * animation (260-580ms incl. stagger) had any real chance to play, since
 * that swap is a type change React tears down and remounts, not a prop
 * update. Computing purely from `hasData`'s own true/false transitions (not
 * "did a render happen") fixes this without needing an effect at all — the
 * arm/disarm decision is made synchronously during render, in the same
 * render pass where the transition is observed, so the very first paint
 * where data is ready already renders entrance-wrapped, exactly like before.
 */
export function useEntrancePlayedOnce(hasData: boolean): boolean {
  const armedRef = useRef(false);
  const prevHasDataRef = useRef(false);

  if (hasData !== prevHasDataRef.current) {
    armedRef.current = hasData;
    prevHasDataRef.current = hasData;
  }

  return armedRef.current;
}
