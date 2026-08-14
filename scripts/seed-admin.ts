/**
 * One-time bootstrap that creates Hafsa's teacher account.
 *
 *   node --experimental-strip-types scripts/seed-admin.ts
 *
 * Requirements:
 *   1. `firebase login` (or GOOGLE_APPLICATION_CREDENTIALS pointing at a
 *      service-account JSON for the target project).
 *   2. Env vars or flags: --email, --password, --name, --project.
 *
 * The service account JSON must NEVER be committed. It is loaded from the
 * FIREBASE_SERVICE_ACCOUNT path / GOOGLE_APPLICATION_CREDENTIALS env var or
 * the `--service-account` flag.
 *
 * This runs against the PRODUCTION project by default (teacher account must
 * exist in prod). Use --project to target dev.
 */
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const args = parseArgs(process.argv.slice(2));

const email = args.email ?? process.env.PW_TEACHER_EMAIL;
const password = args.password ?? process.env.PW_TEACHER_PASSWORD;
const name = args.name ?? "Hafsa";
const projectId =
  args.project ?? process.env.PW_FIREBASE_PROJECT ?? "purple-world";
const serviceAccountPath =
  args["service-account"] ??
  process.env.FIREBASE_SERVICE_ACCOUNT ??
  process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!email || !password) {
  console.error("Usage: node scripts/seed-admin.ts --email you@example.com --password '...'");
  console.error("  optional: --name Hafsa --project <project-id> --service-account <path>");
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

  let uid: string | null = null;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`Teacher already exists: ${existing.uid}`);
  } catch {
    const created = await auth.createUser({ email, password, displayName: name });
    uid = created.uid;
    console.log(`Created teacher auth user: ${uid}`);
  }

  // Strongest signal: a custom claim. Rules also consult users/{uid}.role.
  await auth.setCustomUserClaims(uid, { role: "teacher" });
  console.log("Set custom claim role=teacher");

  const userRef = db.collection("users").doc(uid);
  const existing = await userRef.get();
  if (existing.exists) {
    await userRef.update({
      displayName: existing.get("displayName") ?? name,
      role: "teacher",
      email,
    });
    console.log("Updated users/{uid} (role forced to teacher).");
  } else {
    await userRef.set({
      role: "teacher",
      email,
      displayName: name,
      avatarUrl: null,
      studentId: null,
      groupId: null,
      createdAt: new Date(),
      prefs: { notifications: true, language: "eng" },
    });
    console.log("Created users/{uid} (role=teacher).");
  }

  console.log("Done. Teacher account is ready.");
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