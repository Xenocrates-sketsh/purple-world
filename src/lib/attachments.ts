/** Shared attachment helpers (exercises + lessons). */

export const ATTACHMENT_ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip";

export function attachmentName(url: string): string {
  try {
    const name = decodeURIComponent(url.split("/").pop() ?? "");
    return name.replace(/^[0-9]+-[a-z0-9]{6}-/, "");
  } catch {
    return url.split("/").pop() ?? "Attachment";
  }
}
