import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * T119-T123 / US-34 "หลักการร่วม: Reduce Motion" (docs/design-spec.md): central
 * hook every animation added in รอบ 14 (screen transition, list entrance,
 * enhanced press feedback) must consult before playing motion. Reads the
 * current OS-level "reduce motion" accessibility setting once on mount, then
 * stays in sync via the `reduceMotionChanged` event so a mid-session toggle
 * (Settings app) takes effect without needing to remount/restart the app.
 *
 * Defaults to `false` on the very first render (before the async check
 * resolves) — the same "safe assume-motion-is-fine" default every screen in
 * this app already effectively had before this hook existed, so it never
 * regresses behavior for the common case where reduce motion is off.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Wrapped in `Promise.resolve().then(...)` (rather than calling
    // `.then()` directly on the return value) so this is safe even if
    // `isReduceMotionEnabled` synchronously throws OR returns something that
    // isn't a real Promise at all — both observed in some Jest test setups
    // where `jest.resetAllMocks()`/`jest.clearAllMocks()` strips the
    // react-native-preset's own mock implementation of this native method
    // down to a bare `jest.fn()` (returns `undefined`, not a Promise). A
    // component tree using this hook must never crash because of that.
    Promise.resolve()
      .then(() => AccessibilityInfo.isReduceMotionEnabled())
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {
        // Defensive: some test/RN environments may not implement this API at
        // all — never let a rejected promise here break the caller's render.
      });

    let subscription: { remove?: () => void } | undefined;
    try {
      subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled: boolean) => {
        setReduceMotion(Boolean(enabled));
      });
    } catch {
      // Same defensive rationale as above — a broken/mocked-out
      // addEventListener must never crash the render.
    }

    return () => {
      mounted = false;
      try {
        subscription?.remove?.();
      } catch {
        // Ignore — cleanup must never throw.
      }
    };
  }, []);

  return reduceMotion;
}
