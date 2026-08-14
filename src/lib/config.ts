export const APP_NAME = "Purple World";
export const TEACHER_NAME = "Hafsa";
export const SUBJECT = "English";
export const APP_TAGLINE = "Your space for BAC English support";

export const ENG = "eng";

/**
 * Firebase SDK config, sourced strictly from Vite env vars.
 * Real values live in Vercel Environment Variables (and local `.env*` files),
 * they are NEVER hardcoded in source.
 */
const env = import.meta.env;

export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: env.VITE_FIREBASE_APP_ID ?? "",
};

export const isFirebaseConfigured =
  Boolean(FIREBASE_CONFIG.apiKey) &&
  Boolean(FIREBASE_CONFIG.projectId) &&
  Boolean(FIREBASE_CONFIG.appId);

/** Deployment environment label shown in the UI (dev / preview / production). */
export const APP_ENV = (env.VITE_APP_ENV ?? "development").toLowerCase();

export const IS_PRODUCTION = APP_ENV === "production";