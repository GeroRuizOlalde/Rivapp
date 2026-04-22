import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export default function Rule({ label, tone = 'dark', className }) {
  const line = tone === 'paper' ? 'bg-[color:var(--color-rule-paper)]' : 'bg-rule-strong';
  const text = tone === 'paper' ? 'text-ink-text-muted' : 'text-text-subtle';

  if (!label) {
    return <div className={twMerge(clsx('h-px w-full', line, className))} />;
  }

  return (
    <div className={twMerge(clsx('flex items-center gap-4', className))}>
      <span className={clsx('mono text-[10px] font-medium uppercase tracking-[0.24em] whitespace-nowrap', text)}>
        {label}
      </span>
      <div className={clsx('h-px flex-1', line)} />
    </div>
  );
}
