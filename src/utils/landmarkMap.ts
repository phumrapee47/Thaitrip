// T67 / US-18: pure geometry helpers for the Landmark Map component.
// See docs/design-spec.md "Landmark Map (T67)" for the exact normalize
// formula and padding this implements.
import type { Landmark } from '../data/thailand-landmarks';

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface Point {
  x: number;
  y: number;
}

/** A landmark with both coordinates present (design-spec "has-points" filter). */
export type LandmarkWithCoords = Landmark & { lat: number; lng: number };

/** US-18 AC2 / design-spec step 2: only landmarks with BOTH lat and lng, as
 * finite numbers (guards against accidental NaN/undefined slipping through
 * the optional T62 fields), are eligible for the map. Everything else still
 * shows up in the ordinary LandmarkList (T43) — this filter never removes
 * anything from that list, only from what the map draws. */
export function landmarksWithCoords(landmarks: Landmark[]): LandmarkWithCoords[] {
  return landmarks.filter(
    (l): l is LandmarkWithCoords =>
      typeof l.lat === 'number' && typeof l.lng === 'number' && Number.isFinite(l.lat) && Number.isFinite(l.lng)
  );
}

/** Bounding box of a set of already-coordinate-filtered landmarks (design-spec
 * "ที่มาของพิกัด" — computed from THIS province's landmarks only, never from
 * thailand-provinces.ts, which uses an unrelated SVG coordinate space). Caller
 * must ensure `points` is non-empty (LandmarkMap only calls this in the
 * has-points state). */
export function computeBoundingBox(points: LandmarkWithCoords[]): BoundingBox {
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Normalize one (lat, lng) into SVG (x, y) inside a width x height box with
 * `padding` on every side (design-spec formula, US-18). Degenerate bounding
 * box (a single landmark, or every landmark sharing the exact same
 * coordinate — maxLat-minLat === 0 or maxLng-minLng === 0) places the point
 * dead-center instead of dividing by zero / producing NaN.
 */
export function normalizePoint(
  lat: number,
  lng: number,
  bbox: BoundingBox,
  width: number,
  height: number,
  padding: number
): Point {
  const latSpan = bbox.maxLat - bbox.minLat;
  const lngSpan = bbox.maxLng - bbox.minLng;
  const degenerate = latSpan === 0 || lngSpan === 0;

  if (degenerate) {
    return { x: width / 2, y: height / 2 };
  }

  const x = padding + ((lng - bbox.minLng) / lngSpan) * (width - 2 * padding);
  // y is flipped: higher lat (north) must render nearer the top of the image.
  const y = padding + (1 - (lat - bbox.minLat) / latSpan) * (height - 2 * padding);
  return { x, y };
}
