'use client';

import type { UIMessage } from 'ai';
import type { HTMLAttributes } from 'react';

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

export function Message({ className = '', from, ...props }: MessageProps) {
  return (
    <div
      className={`group flex w-full max-w-[90%] flex-col gap-2 ${
        from === 'user' ? 'is-user ml-auto items-end' : 'is-assistant items-start'
      } ${className}`}
      {...props}
    />
  );
}

export function MessageContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`w-fit min-w-0 max-w-full overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[color:var(--warm)] group-[.is-user]:border-transparent group-[.is-user]:bg-[color:var(--mist)] group-[.is-user]:text-white ${className}`}
      {...props}
    />
  );
}

export function MessageResponse({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`size-full whitespace-pre-wrap ${className}`}
      {...props}
    />
  );
}
