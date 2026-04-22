import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

const base =
  'inline-flex items-center justify-center gap-2 font-sans font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-acid disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  acid:
    'bg-acid text-ink hover:bg-acid-hot shadow-[0_12px_40px_-12px_rgba(208,255,0,0.55)] active:translate-y-[1px]',
  paper:
    'bg-paper text-ink-text hover:bg-paper-2 shadow-[0_12px_40px_-16px_rgba(245,241,232,0.4)] active:translate-y-[1px]',
  ink:
    'bg-ink-4 text-text hover:bg-ink-3 border border-rule active:translate-y-[1px]',
  ghost:
    'bg-transparent text-text hover:bg-white/[0.06] active:translate-y-[1px]',
  outline:
    'bg-transparent text-text border border-rule-strong hover:border-text hover:bg-white/[0.04] active:translate-y-[1px]',
  'outline-paper':
    'bg-transparent text-ink-text border border-[color:var(--color-rule-paper)] hover:border-ink-text hover:bg-black/[0.04]',
  link:
    'bg-transparent text-acid underline-offset-4 hover:underline decoration-acid',
};

const sizes = {
  xs: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
  sm: 'h-10 px-4 text-sm rounded-[var(--radius-sm)]',
  md: 'h-12 px-5 text-sm rounded-[var(--radius-md)]',
  lg: 'h-14 px-7 text-base rounded-[var(--radius-md)]',
  xl: 'h-16 px-9 text-lg rounded-[var(--radius-lg)]',
  pill: 'h-11 px-6 text-sm rounded-full',
};

const Button = forwardRef(function Button(
  { as, to, href, variant = 'acid', size = 'md', className, children, ...props },
  ref
) {
  const cls = twMerge(clsx(base, variants[variant], sizes[size], className));

  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }

  const Comp = as || 'button';
  return (
    <Comp ref={ref} className={cls} {...props}>
      {children}
    </Comp>
  );
});

export default Button;
