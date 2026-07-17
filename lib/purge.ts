import { supabase, ensureSession } from './supabase';

/** Permanently delete everything this user has stored. No recovery. */
export async function purgeEverything() {
  const user = await ensureSession();
  if (!user) throw new Error('No session');

  // Storage first — deleting rows orphans the files otherwise.
  const { data: files } = await supabase.storage.from('evidence').list(user.id);
  if (files?.length) {
    await supabase.storage
      .from('evidence')
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error: e1 } = await supabase.from('reports').delete().eq('user_id', user.id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from('evidence').delete().eq('user_id', user.id);
  if (e2) throw e2;

  await supabase.auth.signOut();  // burns the anon session — the data is unreachable anyway
}