import type { EmergencyContact } from '@/lib/crisis';

export function EmergencyContacts({ contacts }: { contacts: readonly EmergencyContact[] }) {
  return (
    <div className="space-y-3">
      {contacts.map((contact) => {
        const content = (
          <>
            <div className="flex items-start justify-between gap-4">
              <p className="text-[15px] font-medium text-[color:var(--warm)]">{contact.name}</p>
              {contact.href && <span aria-hidden="true" className="text-[color:var(--muted)]">↗</span>}
            </div>
            <p className="mt-1 font-mono text-[12px] text-[color:var(--mist)]">{contact.contact}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">{contact.note}</p>
            {contact.actionLabel && (
              <p className="mt-3 text-[12px] font-medium text-[color:var(--warm)]">{contact.actionLabel}</p>
            )}
          </>
        );

        if (!contact.href) {
          return <div key={contact.name} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">{content}</div>;
        }

        const external = contact.href.startsWith('http');
        return (
          <a
            key={contact.name}
            href={contact.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className="block rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5 transition-colors hover:border-[color:var(--mist)]"
            aria-label={contact.actionLabel}
          >
            {content}
          </a>
        );
      })}
    </div>
  );
}
