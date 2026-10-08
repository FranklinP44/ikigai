import { ORDER, isZoneKey, type CircleKey, type ZoneKey } from "./data";

export const R = 200;

export const CENTERS: Record<CircleKey, readonly [number, number]> = {
  L: [400, 270],
  G: [270, 400],
  N: [530, 400],
  P: [400, 530],
};

export function zoneAt(x: number, y: number): ZoneKey | null {
  let key = "";
  for (const k of ORDER) if (Math.hypot(x - CENTERS[k][0], y - CENTERS[k][1]) <= R) key += k;
  return isZoneKey(key) ? key : null;
}
