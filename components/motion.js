'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Shared one-time reveal-on-scroll wrapper for homepage sections (Sprint 18
 * Module 5). Centralizes the `prefers-reduced-motion` check so every section
 * doesn't repeat it — when reduced motion is requested, renders with the
 * final state immediately (no animation) instead of skipping the wrapper
 * entirely, so layout stays identical either way.
 *
 * Deliberately only two motion categories exist in this app: this
 * one-time reveal (`viewport={{ once: true }}` — never re-triggers on
 * scroll-back-up) and hover effects (defined inline where used, e.g.
 * ProductCard.js). No continuous/looping animation is used anywhere.
 */
export function Reveal({ children, className = '', delay = 0, y = 24 }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * One-time fade-in + rise on mount (not scroll-triggered) — for above-the-
 * fold content like the Hero, which is visible immediately so a
 * viewport-triggered reveal would never actually get to play.
 */
export function FadeIn({ children, className = '', delay = 0, y = 16 }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hover-only lift, used for cards. No idle/auto animation. `as` picks the
 * rendered tag (e.g. `motion.figure` for a testimonial card that needs a
 * `<figcaption>` child to stay valid semantic HTML) — defaults to `div`.
 */
export function HoverLift({ children, className = '', lift = 6, as = 'div' }) {
  const shouldReduceMotion = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (shouldReduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      whileHover={{ y: -lift }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </MotionTag>
  );
}

/** Hover-only gentle scale, used for icons/images. No idle/auto animation. */
export function HoverScale({ children, className = '', scale = 1.06 }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
