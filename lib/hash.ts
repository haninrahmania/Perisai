/** SHA-256 over raw bytes, computed on the victim's device. */
export async function sha256(data: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashFile(file: Blob): Promise<string> {
  return sha256(await file.arrayBuffer());
}

/** For URL-only evidence: hash the normalized URL string itself. */
export async function hashText(text: string): Promise<string> {
  return sha256(new TextEncoder().encode(text.trim()));
}
