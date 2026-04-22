import { forwardRef, useId } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

const Field = forwardRef(function Field(
  { label, icon: Icon, hint, error, className, inputClassName, id: idProp, tone = 'dark', ...props },
  ref
) {
  const generatedId = useId();
  const id = idProp || generatedId;

  const wrap =
    tone === 'paper'
      ? 'bg-paper-2 border-[color:var(--color-rule-paper)] focus-within:border-ink-text'
      : 'bg-ink-2 border-rule focus-within:border-acid';

  const textColor =
    tone === 'paper' ? 'text-ink-text placeholder:text-ink-text-muted' : 'text-text placeholder:text-text-subtle';

  const labelColor = tone === 'paper' ? 'text-ink-text-muted' : 'text-text-muted';

  return (
    <div className={twMerge(clsx('flex flex-col gap-2', className))}>
      {label && (
        <label htmlFor={id} className={clsx('eyebrow', labelColor)}>
          {label}
        </label>
      )}
      <div
        className={twMerge(
          clsx(
            'group relative flex items-center border transition-colors rounded-[var(--radius-md)]',
            wrap,
            error && 'border-signal focus-within:border-signal'
          )
        )}
      >
        {Icon && <Icon className={clsx('ml-4 h-4 w-4', tone === 'paper' ? 'text-ink-text-muted' : 'text-text-muted')} />}
        <input
          ref={ref}
          id={id}
          className={twMerge(
            clsx(
              'w-full bg-transparent px-4 py-4 text-base font-sans outline-none',
              Icon && 'pl-3',
              textColor,
              inputClassName
            )
          )}
          {...props}
        />
      </div>
      {(hint || error) && (
        <p className={clsx('mono text-[11px] leading-4', error ? 'text-signal' : 'text-text-subtle')}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default Field;
