import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = import.meta.env;

export const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY ?? "";
export const AVATAR_BUCKET = "avatars";
export const LESSON_FILES_BUCKET = "lesson-files";

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;

/** Public bucket used for profile avatars. */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  return client;
}

/** Upload an avatar to the public `avatars` bucket and return its public URL. */
export async function uploadAvatar(
  uid: string,
  file: File
): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${uid}/avatar.${ext}`;
  const { error } = await getSupabase()
    .storage.from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  const { data } = getSupabase().storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a lesson attachment (PDF, image, Word/Excel/PowerPoint, text…) to the
 * public `lesson-files` bucket and return its public URL. The name is unique so
 * re-uploading the same filename never overwrites an existing file.
 */
export async function uploadLessonFile(file: File): Promise<string> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `lessons/${stamp}-${file.name.replace(/[^A-Za-z0-9._-]/g, "_")}`;
  const { error } = await getSupabase()
    .storage.from(LESSON_FILES_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = getSupabase()
    .storage.from(LESSON_FILES_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}