import type {
  UserLoginEvent,
  UserSignupEvent,
} from "@netlify/functions";
import { db } from "../../db/index";
import { profiles, students, groups } from "../../db/schema";
import { eq, sql, type SQL, type SQLChunk } from "drizzle-orm";

type Row = Record<string, unknown>;

async function run<T = Row>(query: string, params: unknown[] = []): Promise<T[]> {
  let sqlQuery: SQL;
  if (params.length === 0) {
    sqlQuery = sql.raw(query);
  } else {
    const chunks: SQLChunk[] = [];
    const re = /\$(\d+)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(query))) {
      if (m.index > last) chunks.push(sql.raw(query.slice(last, m.index)));
      const idx = Number(m[1]) - 1;
      chunks.push(sql.param(idx >= 0 && idx < params.length ? params[idx] : null));
      last = m.index + m[0].length;
    }
    if (last < query.length) chunks.push(sql.raw(query.slice(last)));
    sqlQuery = sql.join(chunks);
  }
  return (await db.execute(sqlQuery)) as unknown as T[];
}

function displayName(user: UserSignupEvent["user"]): string {
  return (
    (user.userMetadata?.full_name as string) ||
    (user.userMetadata?.name as string) ||
    user.email ||
    "User"
  );
}

function generateStudentNo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `STU-${out}`;
}

function teacherEmail(): string {
  return (
    Netlify.env.get("TEACHER_EMAIL") ||
    process.env.TEACHER_EMAIL ||
    ""
  ).trim();
}

function isTeacherEmail(email: string): boolean {
  const t = teacherEmail();
  return t.length > 0 && email.toLowerCase() === t.toLowerCase();
}

export default {
  async userLogin(event: UserLoginEvent) {
    const user = event.user;
    if (!user.email) return;

    const isTeacher = isTeacherEmail(user.email);
    const roles = Array.isArray(user.appMetadata?.roles)
      ? (user.appMetadata?.roles as string[])
      : [];

    const profileRole = isTeacher ? "teacher" : "student";
    await db
      .update(profiles)
      .set({ role: profileRole })
      .where(eq(profiles.email, user.email));

    if (isTeacher && !roles.includes("teacher")) {
      return {
        user: {
          ...user,
          appMetadata: { ...user.appMetadata, roles: ["teacher"] },
        },
      };
    }

    if (!isTeacher && !roles.includes("student")) {
      return {
        user: {
          ...user,
          appMetadata: { ...user.appMetadata, roles: ["student"] },
        },
      };
    }
  },

  async userSignup(event: UserSignupEvent) {
    const user = event.user;
    if (!user.email) return event.deny();

    const isTeacher = isTeacherEmail(user.email);

    const name = displayName(user);
    const joinCode =
      ((user.userMetadata?.join_code as string) ?? "").trim().toUpperCase();

    await db
      .insert(profiles)
      .values({
        id: user.id,
        fullName: name,
        email: user.email,
        avatarUrl: null,
        role: isTeacher ? "teacher" : "student",
      })
      .onConflictDoNothing();

    if (isTeacher) {
      return {
        user: {
          ...user,
          appMetadata: { ...user.appMetadata, roles: ["teacher"] },
        },
      };
    }

    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.inviteCode, joinCode))
      .limit(1);

    if (!group) {
      return event.deny();
    }

    // Link a student Hafsa pre-registered by email, if one exists.
    const [existing] = await run(
      `SELECT s.id, s.group_id, p.id AS placeholder_profile_id FROM students s
       JOIN profiles p ON p.id = s.profile_id
       WHERE lower(p.email) = lower($1) LIMIT 1`,
      [user.email]
    );

    if (existing) {
      await run(
        `UPDATE students
         SET profile_id = $1, group_id = COALESCE(group_id, $2)
         WHERE id = $3`,
        [user.id, group.id, existing.id]
      );
      // Orphaned placeholder profile is no longer referenced.
      await run(`DELETE FROM profiles WHERE id = $1 AND id <> $2`, [
        existing.placeholder_profile_id,
        user.id,
      ]);
    } else {
      await db
        .insert(students)
        .values({
          profileId: user.id,
          groupId: group.id,
          studentNo: generateStudentNo(),
        })
        .onConflictDoNothing();
    }

    return {
      user: {
        ...user,
        appMetadata: { ...user.appMetadata, roles: ["student"] },
      },
    };
  },
};