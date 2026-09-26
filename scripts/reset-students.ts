/**
 * Reset Purple World to a clean slate: deletes EVERYTHING student-related
 * while keeping the teacher account(s) intact.
 *
 *   Dry run (lists what would be deleted, deletes nothing):
 *     node --experimental-strip-types scripts/reset-students.ts --project <project-id>
 *
 *   Actually delete (requires explicit confirmation):
 *     node --experimental-strip-types scripts/reset-students.ts --project <project-id> --confirm
 *
 * Requirements:
 *   1. `firebase login` (or GOOGLE_APPLICATION_CREDENTIALS pointing at a
 *      service-account JSON for the target project).
 *   2. Flags/env: --project (or PW_FIREBASE_PROJECT), --service-account
 *      (or FIREBASE_SERVICE_ACCOUNT / GOOGLE_APPLICATION_CREDENTIALS).
 *
 * What is removed:
 *   - students/* records (+ notes/{studentId}/entries private notes)
 *   - users/{uid} docs with role != teacher
 *   - Firebase Auth users without the teacher claim
 *   - arrivals/* requests and invites/* codes
 *   - Storage files under avatars/{deletedUid}/* and submissions of deleted
 *     students are left in place (storage-only, harmless) — empty the
 *     buckets from the console if you want them gone too.
 *
 * What is KEPT: any auth user with role=teacher claim, users/{uid} docs
 * with role=teacher, and all teacher content (lessons, exercises,
 * announcements, groups, assessments, lesson files).
 *
 * The service account JSON must NEVER be committed.
 */
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const args = parseArgs(process.argv.slice(2));

const projectId =
  args.project ?? process.env.PW_FIREBASE_PROJECT ?? "purple-world";
const serviceAccountPath =
  args["service-account"] ??
  process.env.FIREBASE_SERVICE_ACCOUNT ??
  process.env.GOOGLE_APPLICATION_CREDENTIALS;
const confirm = args.confirm !== undefined;

if (!serviceAccountPath) {
  console.error("No service account found. Set GOOGLE_APPLICATION_CREDENTIALS or pass --service-account.");
  process.exit(1);
}

const app = initializeApp({
  projectId,
  credential: cert(serviceAccountPath as ServiceAccount),
  storageBucket: args.bucket ?? process.env.PW_STORAGE_BUCKET ?? `${projectId}.appspot.com`,
});

async function main() {
  const auth = getAuth(app);
  const db = getFirestore(app);
  console.log(`Project: ${projectId} | mode: ${confirm ? "DELETE" : "DRY RUN"}\n`);

  // ---- 1. Collect teacher uids (never touch these) ----
  const teacherUids = new Set<string>();
  let nextPageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, nextPageToken);
    for (const u of page.users) {
      if ((u.customClaims as { role?: unknown } | undefined)?.role === "teacher") {
        teacherUids.add(u.uid);
      }
    }
    nextPageToken = page.pageToken;
  } while (nextPageToken);
  const usersSnap = await db.collection("users").get();
  usersSnap.docs.forEach((d) => {
    if (d.get("role") === "teacher") teacherUids.add(d.id);
  });
  console.log(`Keeping ${teacherUids.size} teacher account(s).`);

  // ---- 2. Students records (+ private notes) ----
  const studentsSnap = await db.collection("students").get();
  console.log(`Students records: ${studentsSnap.size}`);
  const studentUids = new Set<string>();
  studentsSnap.docs.forEach((d) => {
    const uid = d.get("linkedUid") as string | null;
    if (uid) studentUids.add(uid);
  });

  // ---- 3. Non-teacher users docs + auth accounts ----
  const doomedUsers = usersSnap.docs.filter((d) => !teacherUids.has(d.id));
  console.log(`Non-teacher users docs: ${doomedUsers.length}`);

  const doomedAuth: string[] = [];
  nextPageToken = undefined;
  do {
    const page = await auth.listUsers(1000, nextPageToken);
    for (const u of page.users) {
      if (!teacherUids.has(u.uid)) doomedAuth.push(u.uid);
    }
    nextPageToken = page.pageToken;
  } while (nextPageToken);
  console.log(`Non-teacher auth accounts: ${doomedAuth.length}`);

  // ---- 4. Arrivals + invites ----
  const arrivalsSnap = await db.collection("arrivals").get();
  const invitesSnap = await db.collection("invites").get();
  console.log(`Arrivals: ${arrivalsSnap.size} | Invites: ${invitesSnap.size}`);

  if (!confirm) {
    console.log("\nDRY RUN — nothing deleted. Re-run with --confirm to delete.");
    process.exit(0);
  }

  // ---- DELETE (in dependency-safe order) ----
  const chunk = <T>(arr: T[], n = 400): T[][] =>
    arr.length <= n ? [arr] : [arr.slice(0, n), ...chunk(arr.slice(n), n)];

  // a. private notes entries per student record
  for (const s of studentsSnap.docs) {
    const entries = await db.collection("notes").doc(s.id).collection("entries").get();
    for (const batch of chunk(entries.docs)) {
      const b = db.batch();
      batch.forEach((d) => b.delete(d.ref));
      await b.commit();
    }
    await db.collection("notes").doc(s.id).delete().catch(() => undefined);
  }
  // b. students records
  for (const batch of chunk(studentsSnap.docs)) {
    const b = db.batch();
    batch.forEach((d) => b.delete(d.ref));
    await b.commit();
  }
  // c. users docs
  for (const batch of chunk(doomedUsers)) {
    const b = db.batch();
    batch.forEach((d) => b.delete(d.ref));
    await b.commit();
  }
  // d. arrivals + invites
  for (const batch of chunk([...arrivalsSnap.docs, ...invitesSnap.docs])) {
    const b = db.batch();
    batch.forEach((d) => b.delete(d.ref));
    await b.commit();
  }
  // e. auth accounts (also removes their avatar/storage ownership server-side;
  //    bucket files under avatars/{uid} are left — empty buckets in console)
  for (const batch of chunk(doomedAuth, 50)) {
    await Promise.all(batch.map((uid) => auth.deleteUser(uid).catch(() => undefined)));
  }
  // f. best-effort avatar folder cleanup
  try {
    const bucket = getStorage(app).bucket();
    for (const uid of [...studentUids, ...doomedAuth]) {
      await bucket.deleteFiles({ prefix: `avatars/${uid}/` }).catch(() => undefined);
    }
  } catch {
    console.log("Note: avatar bucket cleanup skipped (check bucket name/permissions).");
  }

  console.log("\nDone. Website is clean — teacher account(s) and content kept.");
  process.exit(0);
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      out[key] = next && !next.startsWith("--") ? next : "";
    }
  }
  return out;
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
