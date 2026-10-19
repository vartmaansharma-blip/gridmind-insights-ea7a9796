import { supabase } from "@/integrations/supabase/client";
import { commandSchema, type Command, type Evidence } from "./contract";
export async function electricityCall<T>(command: Command): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Sign in to your team workspace first.");
  const response = await fetch("/api/electricity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify(commandSchema.parse(command)),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Case request failed");
  return result;
}
export async function uploadBill(caseId: string, file: File, id: string) {
  // Documents remain unverified. MIME/header checks are not malware scanning or authenticity checks.
  const command = commandSchema.parse({
    action: "reserve",
    caseId,
    id,
    filename: file.name,
    mime: file.type,
    bytes: file.size,
  });
  const evidence = await electricityCall<Evidence>(command);
  if (evidence.state === "uploaded") return;
  const { error } = await supabase.storage
    .from("electricity-bills")
    .upload(evidence.object_path, file, { contentType: file.type, upsert: false });
  // A lost response may leave the object committed. Finalize verifies stored size/MIME;
  // it cannot mark a missing object uploaded, and retries never overwrite evidence.
  if (error && !["409", "400"].includes(String(error.statusCode)))
    throw new Error("Upload failed. Retry this file; the evidence reference is retained.");
  await electricityCall({ action: "finalize", caseId, id });
}
export async function downloadBill(evidence: Evidence) {
  const { data, error } = await supabase.storage
    .from("electricity-bills")
    .download(evidence.object_path);
  if (error || !data) throw new Error("Document unavailable or access revoked.");
  const url = URL.createObjectURL(data),
    a = document.createElement("a");
  a.href = url;
  a.download = evidence.filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
