import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export default function Eyebrow({ as: Comp = 'span', index, className, children, tone = 'muted', ...props }) {
  const tones = {
    muted: 'text-text-muted',
    acid: 'text-acid',
    ml: 'text-ml-soft',
    ink: 'text-ink-text-muted',
    paper: 'text-paper-3',
  };

  return (
    <Comp
      className={twMerge(
        clsx(
          'mono inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em]',
          tones[tone],
          className
        )
      )}
      {...props}
    >
      {index != null && (
        <span className="inline-block min-w-[2.2ch] border border-current px-1.5 py-0.5 text-[10px] leading-none">
          {String(index).padStart(2, '0')}
        </span>
      )}
      {children}
    </Comp>
  );
}
