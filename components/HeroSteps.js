import { Footprints, HeartHandshake, Leaf } from 'lucide-react';

const STEPS = [
  { h: 60, fill: '#E6EEE4' },
  { h: 102, fill: '#D6E7DB' },
  { h: 144, fill: '#BFE0CB' },
  { h: 186, fill: '#9CCCAF' },
  { h: 228, fill: '#5E9678' },
  { h: 270, fill: '#E59530' },
];

const STEP_W = 64;
const GAP = 10;
const VIEW_W = STEPS.length * STEP_W + (STEPS.length - 1) * GAP + 20;
const VIEW_H = 320;

export default function HeroSteps() {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-md" role="img" aria-label="Illustration of ascending steps, representing small steps leading to stronger years">
      {/* soft background blob */}
      <div className="absolute inset-0 -z-10 rounded-full bg-accent-soft/70 blur-2xl" />

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full" aria-hidden="true">
        {STEPS.map((step, i) => {
          const x = 10 + i * (STEP_W + GAP);
          const y = VIEW_H - step.h;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={STEP_W}
              height={step.h}
              rx={10}
              fill={step.fill}
            />
          );
        })}
      </svg>

      {/* Trail of small footprints climbing the steps */}
      <Footprints
        size={20}
        className="absolute text-primary-dark/40"
        style={{ left: '14%', bottom: '24%', transform: 'rotate(-8deg)' }}
        aria-hidden="true"
      />
      <Footprints
        size={22}
        className="absolute text-primary-dark/50"
        style={{ left: '40%', bottom: '46%', transform: 'rotate(-6deg)' }}
        aria-hidden="true"
      />
      <Footprints
        size={24}
        className="absolute text-primary-dark/60"
        style={{ left: '62%', bottom: '64%', transform: 'rotate(-4deg)' }}
        aria-hidden="true"
      />

      {/* Badge at the top step */}
      <div
        className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-accent-soft"
        style={{ right: '4%', top: '4%' }}
      >
        <HeartHandshake size={28} className="text-primary" aria-hidden="true" />
      </div>

      {/* Decorative leaf */}
      <div
        className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-sage"
        style={{ left: '2%', top: '10%' }}
      >
        <Leaf size={18} className="text-primary" aria-hidden="true" />
      </div>
    </div>
  );
}
