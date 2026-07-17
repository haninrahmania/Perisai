import { supabase, ensureSession } from './supabase';
import type { TakedownTarget } from './takedown-prompts';

export type ReportStatus = 'draft' | 'sent' | 'in_review' | 'taken_down' | 'rejected';

export type ReportRow = {
  id: string;
  user_id: string;
  target: TakedownTarget;
  status: ReportStatus;
  content: string | null;
  evidence_ids: string[];
  created_at: string;
  updated_at: string;
};

/** Save a generated letter. Re-generating the same target overwrites, never duplicates. */
export async function saveReport(
  target: TakedownTarget,
  content: string,
  evidenceIds: string[]
) {
  const user = await ensureSession();
  if (!user) throw new Error('No session');

  const { data, error } = await supabase
    .from('reports')
    .upsert(
      {
        user_id: user.id,
        target,
        content,
        evidence_ids: evidenceIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,target' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as ReportRow;
}

export async function listReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ReportRow[];
}

export async function updateReportStatus(id: string, status: ReportStatus) {
  const { data, error } = await supabase
    .from('reports')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ReportRow;
}

export async function deleteReport(id: string) {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw error;
}