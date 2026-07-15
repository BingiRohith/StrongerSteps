import Link from 'next/link';

const BUTTON_STYLES = {
  primary:
    'bg-primary text-white hover:bg-primary-dark',
  accent:
    'bg-accent text-primary-dark hover:bg-accent-dark hover:text-white',
  outline:
    'bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white',
  outlineLight:
    'bg-transparent text-white border-2 border-white/70 hover:bg-white hover:text-primary-dark',
};

const BUTTON_SIZES = {
  md: 'px-6 py-3 text-sm md:text-base',
  sm: 'px-5 py-2 text-sm',
};

export function Button({ href, children, variant = 'primary', size = 'md', className = '', ...props }) {
  const styles = `inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold transition-colors duration-200 ${BUTTON_SIZES[size]} ${BUTTON_STYLES[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={styles} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'accent', className = '' }) {
  const tones = {
    accent: 'bg-accent-soft text-accent-dark',
    sage: 'bg-sage text-primary-dark',
    primary: 'bg-primary-light/20 text-primary-dark',
    outline: 'border border-line text-muted',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children }) {
  return (
    <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-accent-dark">
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  const alignment = align === 'center' ? 'text-center mx-auto' : '';
  return (
    <div className={`max-w-2xl ${alignment} mb-10 md:mb-14`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-primary-dark">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-muted">{description}</p>
      )}
    </div>
  );
}
