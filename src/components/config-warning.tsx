import { AlertTriangle } from "lucide-react";

import { Brand } from "@/components/brand";

/** Shown (only) when the app has no Firebase env configuration. */
export function ConfigWarning() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-lg p-8 text-center">
        <Brand className="mx-auto justify-center" subtitle />
        <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">Firebase is not configured yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Purple World reads its Firebase settings from environment variables. Before you can use the
          app, add them to a <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">.env</code> file
          for local development (copy <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">.env.example</code>)
          and to your Vercel project for production.
        </p>
        <ul className="mt-4 space-y-1.5 text-left text-xs text-muted-foreground">
          <li>• Create the Firebase project(s) at console.firebase.google.com</li>
          <li>• Enable Email/Password Auth, Firestore, and Storage</li>
          <li>• Paste the six <code className="rounded bg-surface-muted px-1 py-0.5">VITE_FIREBASE_*</code> values</li>
          <li>• Deploy the rules in <code className="rounded bg-surface-muted px-1 py-0.5">firebase/</code> via the Firebase CLI</li>
          <li>• Run the teacher seed script (see README)</li>
        </ul>
      </div>
    </div>
  );
}