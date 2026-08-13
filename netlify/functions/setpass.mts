import type { Config, Context } from "@netlify/functions";
import { admin } from "@netlify/identity";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return new Response("bad method", { status: 405 });
  const body = (await req.json()) as { userId?: string; password?: string };
  if (!body.userId || !body.password) {
    return new Response("userId and password required", { status: 400 });
  }
  try {
    const user = await admin.updateUser(body.userId, { password: body.password });
    return Response.json({ ok: true, email: user.email, roles: user.roles });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
};

export const config: Config = {
  path: "/setpass",
};
