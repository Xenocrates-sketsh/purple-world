/**
 * One-time/ongoing bootstrap that creates a STUDENT account.
 *
 * The student does NOT self-register — the teacher provisions the account
 * (auth user + role=student claim + users/{uid} doc + students/{id} record).
 *
 *   node --experimental-strip-types scripts/create-student.ts \
 *     --name "Ahmed Benali" --email ahmed@example.com --password 'TempPass123' \
 *     --student-no "2025-014" [--group <groupId>] [--project purple-world-dev-ae9e6]
 *
 * Requirements:
 *   1. `firebase login` (or GOOGLE_APPLICATION_CREDENTIALS pointing at a
 *      service-account JSON for the target project).
 *   2. Env vars or flags: --name, --email, --password, --project.
 *
 * The service account JSON must NEVER be committed. It is loaded from the
 * FIREBASE_SERVICE_ACCOUNT path / GOOGLE_APPLICATION_CREDENTIALS env var or
 * the `--service-account` flag.
 */
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const args = parseArgs(process.argv.slice(2));

const name = args.name ?? process.env.PW_STUDENT_NAME;
const email = args.email ?? process.env.PW_STUDENT_EMAIL;
const password = args.password ?? process.env.PW_STUDENT_PASSWORD;
const studentNo = args["student-no"] ?? process.env.PW_STUDENT_NO;
const groupId = args.group ?? process.env.PW_STUDENT_GROUP ?? null;
const studentId = args["student-id"] ?? null; // optional pre-known id
const projectId =
  args.project ?? process.env.PW_FIREBASE_PROJECT ?? "purple-world";
const serviceAccountPath =
  args["service-account"] ??
  process.env.FIREBASE_SERVICE_ACCOUNT ??
  process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!name || !email || !password) {
  console.error(
    "Usage: node scripts/create-student.ts --name 'Ahmed Benali' --email ahmed@example.com --password '...' [--student-no 2025-014] [--group <groupId>]"
  );
  console.error("  optional: --project <project-id> --service-account <path> --student-id <id>");
  process.exit(1);
}
if (!serviceAccountPath) {
  console.error("No service account found. Set GOOGLE_APPLICATION_CREDENTIALS or pass --service-account.");
  process.exit(1);
}

const app = initializeApp({
  projectId,
  credential: cert(serviceAccountPath as ServiceAccount),
});

async function main() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  // 1. Create (or reuse) the auth user. Role is ALWAYS student — never chosen
  //    by the user, never settable by them.
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`Auth user already exists: ${uid}`);
  } catch {
    const created = await auth.createUser({
      email,
      password,
      displayName: name,
    });
    uid = created.uid;
    console.log(`Created auth user: ${uid}`);
  }

  // 2. Custom claim — defense-in-depth, matches users/{uid}.role.
  await auth.setCustomUserClaims(uid, { role: "student" });
  console.log("Set custom claim role=student");

  // 3. students/{id} record.
  const sid = studentId ?? db.collection("students").doc().id;
  const studentRef = db.collection("students").doc(sid);
  await studentRef.set(
    {
      name,
      studentNo: studentNo ?? sid.slice(0, 8).toUpperCase(),
      phone: null,
      parentPhone: null,
      school: null,
      stream: null,
      groupId,
      active: true,
      bacInfo: { year: null, targetScore: null },
      avatarUrl: null,
      registeredAt: new Date(),
      createdAt: new Date(),
      linkedUid: uid,
      inviteCode: null,
    },
    { merge: true }
  );
  console.log(`Wrote students/${sid}`);

  // 4. users/{uid} doc — role FORCED to student server-side.
  await db.collection("users").doc(uid).set({
    role: "student",
    email,
    displayName: name,
    avatarUrl: null,
    studentId: sid,
    groupId,
    createdAt: FieldValue.serverTimestamp(),
    prefs: { notifications: true, language: "eng" },
  });
  console.log(`Wrote users/${uid} (role=student)`);

  console.log("Done. Student can sign in with the email/password provided.");
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
  console.error("Seeding failed:", err);
  process.exit(1);
});
