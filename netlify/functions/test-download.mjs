import { createClient } from "@supabase/supabase-js";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  },
  body: JSON.stringify(body)
});

export async function handler() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || "digital-deliveries";
  const objectPath = process.env.SUPABASE_OBJECT_PATH;

  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!objectPath) missing.push("SUPABASE_OBJECT_PATH");

  if (missing.length) {
    return json(500, {
      ok: false,
      stage: "environment",
      error: "Missing required Netlify environment variable(s).",
      missing
    });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // First verify the exact object is accessible, then create a 5-minute URL.
    const { data: file, error: fileError } = await supabase.storage
      .from(bucket)
      .info(objectPath);

    if (fileError) {
      return json(502, {
        ok: false,
        stage: "storage-object-check",
        bucket,
        objectPath,
        error: fileError.message,
        hint: "Check bucket name, exact object path, file existence, and Supabase credentials."
      });
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, 300, { download: true });

    if (error || !data?.signedUrl) {
      return json(502, {
        ok: false,
        stage: "signed-url-generation",
        bucket,
        objectPath,
        error: error?.message || "Supabase returned no signed URL."
      });
    }

    return json(200, {
      ok: true,
      stage: "complete",
      message: "Supabase object found and signed URL generated.",
      bucket,
      objectPath,
      fileMetadata: file,
      expiresInSeconds: 300,
      downloadUrl: data.signedUrl
    });
  } catch (e) {
    return json(500, {
      ok: false,
      stage: "unexpected-exception",
      error: e?.message || String(e)
    });
  }
}
