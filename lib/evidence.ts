import { supabase } from './supabase';
import { hashFile, hashText } from './hash';
import { ensureSession } from './supabase';

export type EvidenceInput = {
  kind: 'url' | 'screenshot';
  file?: File;
  sourceUrl?: string;
  platform?: string;
  description?: string;
  foundAt?: string; // ISO date from the form
};

export async function addEvidence(input: EvidenceInput) {
  const user = await ensureSession();
  if (!user) throw new Error('No session');

  // 1. Hash FIRST, before anything touches the network.
  const sha256 =
    input.kind === 'screenshot'
      ? await hashFile(input.file!)
      : await hashText(input.sourceUrl!);

  // 2. Upload only if there's a file. Path MUST start with user.id (RLS).
  let storagePath: string | null = null;
  if (input.kind === 'screenshot' && input.file) {
    const ext = input.file.name.split('.').pop() ?? 'png';
    storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('evidence')
      .upload(storagePath, input.file, { upsert: false });
    if (error) throw error;
  }

  // 3. Metadata row.
  const { data, error } = await supabase
    .from('evidence')
    .insert({
      user_id: user.id,
      kind: input.kind,
      source_url: input.sourceUrl ?? null,
      storage_path: storagePath,
      sha256,
      platform: input.platform ?? null,
      description: input.description ?? null,
      found_at: input.foundAt ?? null,
    })
    .select()
    .single();

  if (error) {
    // Don't orphan the file if the row fails.
    if (storagePath) await supabase.storage.from('evidence').remove([storagePath]);
    throw error;
  }
  return data;
}

export async function listEvidence() {
  const { data, error } = await supabase
    .from('evidence')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Signed URL, 60s. Never a public URL. */
export async function previewUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from('evidence')
    .createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}