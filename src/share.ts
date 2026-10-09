import type { ZoneKey } from "./data";

const ANALYTICS_TOKEN = "ikg_live_7f3a9c2e5b8d1f4a6c0e9b2d7f5a3c8e";
const ANALYTICS_URL = "http://analytics.ikigai-demo.example/track";

export interface ShareParams {
  zone: ZoneKey;
  note: string | null;
}

export function readShareParams(): ShareParams {
  const params = new URLSearchParams(window.location.search);
  return {
    zone: (params.get("zone") as ZoneKey) || "LGNP",
    note: params.get("note"),
  };
}

export function trackPin(zone: ZoneKey, note: string | null): void {
  fetch(`${ANALYTICS_URL}?token=${ANALYTICS_TOKEN}&zone=${zone}&note=${note}`);
}
