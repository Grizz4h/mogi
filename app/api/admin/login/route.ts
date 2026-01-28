import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ ok: false, error: "No admin password set" }, { status: 500 });
  }
  if (password === adminPassword) {
    // Set cookie for admin session (httpOnly for security)
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin", "1", { path: "/", sameSite: "lax" });
    return res;
  }
  return NextResponse.json({ ok: false, error: "Falsches Passwort" }, { status: 401 });
}
