import { NextResponse } from "next/server";
import { HttpError } from "./server-auth";

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error) {
    const message = error.message;
    if (
      message.includes("duplicate key") ||
      message.toLowerCase().includes("unique")
    ) {
      return NextResponse.json(
        { error: "That value already exists. Please choose another." },
        { status: 409 }
      );
    }
    console.error("[api]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}

export function parseBody<T>(body: unknown, fallback: T = {} as T): T {
  if (!body || typeof body !== "object") return fallback;
  return body as T;
}
