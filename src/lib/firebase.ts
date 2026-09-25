import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

import { FIREBASE_CONFIG, isFirebaseConfigured } from "./config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

function required<T>(value: T | null | undefined, name: string): NonNullable<T> {
  if (value == null) {
    throw new Error(`Firebase "${name}" was accessed before initialization.`);
  }
  return value as NonNullable<T>;
}

export function initFirebase(): boolean {
  if (app) return true;
  if (!isFirebaseConfigured) return false;
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  return true;
}

export function getFirebaseApp() {
  return required(app, "app");
}

export function getFirebaseAuth() {
  return required(auth, "auth");
}

export function getFirestoreDb() {
  return required(db, "firestore");
}

export function getFirebaseFunctions() {
  return required(functions, "functions");
}