'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type TriageAnswers = {
  incident?: 'deepfake' | 'ncii' | 'ancaman' | 'lainnya';
  platform?: 'telegram' | 'instagram' | 'x' | 'tiktok' | 'other';
  firstSeen?: string;
  relationship?: string;
};

export type TakedownTargetKey = string;
export type ReportStatus = 'belum' | 'terkirim' | 'menunggu' | 'ditakedown';

type Ctx = {
  triage: TriageAnswers;
  setTriage: (patch: TriageAnswers) => void;

  fieldValues: Record<string, string>;
  setField: (key: string, value: string) => void;
  clearFields: () => void;

  letters: Record<TakedownTargetKey, string>;
  setLetter: (target: TakedownTargetKey, text: string) => void;

  reportStatus: Record<TakedownTargetKey, ReportStatus>;
  setReportStatus: (target: TakedownTargetKey, status: ReportStatus) => void;

  relationship: string;
  setRelationship: (v: string) => void;
};

const SessionCtx = createContext<Ctx>({
  triage: {},
  setTriage: () => {},
  fieldValues: {},
  setField: () => {},
  clearFields: () => {},
  letters: {},
  setLetter: () => {},
  reportStatus: {},
  setReportStatus: () => {},
  relationship: '',
  setRelationship: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [triage, setTriageState] = useState<TriageAnswers>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [reportStatus, setReportStatusState] = useState<Record<string, ReportStatus>>({});
  const [relationship, setRelationship] = useState('');

  const setTriage = useCallback((patch: TriageAnswers) => {
    setTriageState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setField = useCallback((key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFields = useCallback(() => setFieldValues({}), []);

  const setLetter = useCallback((target: string, text: string) => {
    setLetters((prev) => ({ ...prev, [target]: text }));
  }, []);

  const setReportStatus = useCallback((target: string, status: ReportStatus) => {
    setReportStatusState((prev) => ({ ...prev, [target]: status }));
  }, []);

  return (
    <SessionCtx.Provider
      value={{
        triage,
        setTriage,
        fieldValues,
        setField,
        clearFields,
        letters,
        setLetter,
        reportStatus,
        setReportStatus,
        relationship,
        setRelationship,
      }}
    >
      {children}
    </SessionCtx.Provider>
  );
}

export const useSession = () => useContext(SessionCtx);