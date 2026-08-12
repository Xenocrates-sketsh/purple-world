import { db } from "@/db";
import { notifications } from "@/db/schema";

export type NotificationType =
  | "message"
  | "new_exercise"
  | "new_announcement"
  | "upcoming_lesson"
  | "payment_due"
  | "new_grade"
  | "schedule_change";

export async function notify(
  profileId: string,
  type: NotificationType,
  title: string,
  body?: string | null,
  link?: string | null
) {
  try {
    await db.insert(notifications).values({
      profileId,
      type,
      title,
      body: body ?? null,
      link: link ?? null,
    });
  } catch {
    /* notifications must never break the primary action */
  }
}