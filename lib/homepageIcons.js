import {
  MoveUp,
  MapPin,
  PersonStanding,
  BatteryLow,
  ShieldAlert,
  Dumbbell,
  Star,
  Users,
  HeartHandshake,
  Heart,
  Activity,
  Smile,
  Sun,
  Leaf,
  Footprints,
  Home,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

/**
 * Curated icon set for homepage "Why It Matters" / "Our Vision" cards
 * (Sprint 15). Icons are stored on the Homepage doc as plain name strings
 * (e.g. "MoveUp") since Mongo can't persist a React component — `getIcon`
 * resolves the stored name back to the actual lucide-react component for
 * both the admin picker and the public page's server-side render.
 *
 * Named imports (not `import * as Icons from 'lucide-react'` + a dynamic
 * `Icons[name]` lookup) so bundlers can resolve each icon statically —
 * a namespace import forces the entire ~1600-icon package into the shared
 * lucide-react chunk that every route pulls in via Header/Footer.
 */
const ICON_MAP = {
  MoveUp,
  MapPin,
  PersonStanding,
  BatteryLow,
  ShieldAlert,
  Dumbbell,
  Star,
  Users,
  HeartHandshake,
  Heart,
  Activity,
  Smile,
  Sun,
  Leaf,
  Footprints,
  Home,
  Sparkles,
  CheckCircle,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export function getIcon(name) {
  return ICON_MAP[name] || ICON_MAP.Star;
}
