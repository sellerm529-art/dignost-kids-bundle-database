# Kids Bundle Download Diagnostic (temporary)

This project isolates the Supabase Storage download-link step. It does **not** check payment records or replace your production payment-verification flow.

## Netlify deploy

1. Extract this ZIP.
2. Put the folder in a private GitHub repository, or deploy the folder using Netlify's supported manual/Git deployment flow.
3. In Netlify, open **Site configuration → Environment variables** (wording may vary) and add:

   - `SUPABASE_URL` — your Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — your project's service-role key (secret; server-side only)
   - `SUPABASE_BUCKET` — `digital-deliveries` (or your actual bucket name)
   - `SUPABASE_OBJECT_PATH` — exact object path **inside the bucket**, for example `KidsBundle.zip` if the ZIP is at the bucket root

4. Set the variables for the deploy context you use, then trigger a fresh deploy.
5. Open the deployed site and click **Test download link**.
6. A successful result says `ok: true` and includes a signed URL valid for 300 seconds. Click the generated link to test the file download.

## Interpreting errors

- `stage: environment`: one or more environment variables are missing. Check variable names and redeploy.
- `stage: storage-object-check`: Supabase could not find/read the exact object. Verify bucket name and exact path/capitalization, and confirm the ZIP exists in that bucket.
- `stage: signed-url-generation`: object check succeeded but signed URL creation failed; inspect the returned Supabase error.
- Netlify 404 for `/.netlify/functions/test-download`: function did not deploy; check the deploy log and `netlify.toml`.
- Netlify 500/502: read the JSON response and the function logs in Netlify.

## Security

- Never put `SUPABASE_SERVICE_ROLE_KEY` in `index.html`, browser JavaScript, a public repository, or a `VITE_`/`NEXT_PUBLIC_` variable.
- This diagnostic endpoint intentionally creates a signed link for anyone who can reach the temporary site. Use it only briefly, do not advertise/share the URL, and delete the temporary site after testing.
- The signed URL expires after five minutes. Do not share the URL publicly.
- Do not use this endpoint as your live customer download endpoint; production delivery should verify the order/payment server-side before generating a URL.
- If the Supabase project uses a custom storage policy or SDK version with no `.info()` method, remove the `.info(objectPath)` check and test `createSignedUrl` directly, or use the Storage list API to verify the object. The signed URL result remains the main test.
