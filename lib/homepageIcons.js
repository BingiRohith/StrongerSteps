import * as Icons from 'lucide-react';

/**
 * Curated icon set for homepage "Why It Matters" / "Our Vision" cards
 * (Sprint 15). Icons are stored on the Homepage doc as plain name strings
 * (e.g. "MoveUp") since Mongo can't persist a React component — `getIcon`
 * resolves the stored name back to the actual lucide-react component for
 * both the admin picker and the public page's server-side render.
 */
export const ICON_OPTIONS = [
  'MoveUp',
  'MapPin',
  'PersonStanding',
  'BatteryLow',
  'ShieldAlert',
  'Dumbbell',
  'Star',
  'Users',
  'HeartHandshake',
  'Heart',
  'Activity',
  'Smile',
  'Sun',
  'Leaf',
  'Footprints',
  'Home',
  'Sparkles',
  'CheckCircle',
];

export function getIcon(name) {
  return Icons[name] || Icons.Star;
}
