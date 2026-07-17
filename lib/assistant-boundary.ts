import { detectCrisis, EMERGENCY, type CrisisKind } from './crisis';
import type { ReportStatus, TakedownTarget } from './reporting';

export type AssistantReportContext = {
  target: TakedownTarget;
  status: Exclude<ReportStatus, 'draft'>;
};

export type AssistantBoundaryResult =
  | {
      kind: 'crisis';
      crisis: Exclude<CrisisKind, null>;
      contacts: (typeof EMERGENCY)[Exclude<CrisisKind, null>];
    }
  | {
      kind: 'approved';
      disclosure: {
        message: string;
        reportContext: AssistantReportContext | null;
      };
    };

/**
 * Validates the only context the external assistant boundary may receive. It does not perform
 * the external effect; both the browser and server call it before the server starts streaming.
 */
export function reviewAssistantDisclosure(input: {
  message: string;
  consent: boolean;
  reportContext: AssistantReportContext | null;
}): AssistantBoundaryResult {
  const message = input.message.trim();
  const crisis = detectCrisis(message);
  if (crisis) return { kind: 'crisis', crisis, contacts: EMERGENCY[crisis] };
  if (!message || message.length > 1000) {
    throw new Error('Pesan harus berisi 1–1000 karakter.');
  }
  if (!input.consent) {
    throw new Error('Centang persetujuan sebelum mengirim pesan ke Gemini.');
  }
  return {
    kind: 'approved',
    disclosure: {
      message,
      reportContext: input.reportContext,
    },
  };
}
