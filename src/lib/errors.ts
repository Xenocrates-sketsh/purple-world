import { FirebaseError } from "firebase/app";

/**
 * Translate common Firebase Auth / Firestore error codes into human,
 * student-friendly messages.
 *
 * TEMP DEBUG: the real error is ALWAYS logged to the console AND the raw
 * `code` + `message` are appended to the returned string so they show in the
 * UI while we debug the sign-in failure. Remove the suffix once the bug is
 * found.
 *
 * Note: we deliberately duck-type the error instead of relying on
 * `instanceof FirebaseError`. When the app resolves two copies of the firebase
 * SDK (e.g. a nested node_modules copy), `instanceof` returns false even for
 * real Firebase errors, which made the old code fall through to a generic
 * message and hide `code`/`message`.
 */
function errorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" && code.length > 0 ? code : undefined;
  }
  return undefined;
}

function errorMessage(error: unknown): string | undefined {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" && message.length > 0 ? message : undefined;
  }
  return undefined;
}

export function humanError(error: unknown): string {
  const code = errorCode(error);
  const rawMessage = errorMessage(error) ?? String(error);

  // Never swallow the actual error — log it so we can see what happened.
  console.error("[purple-world] error:", {
    code,
    message: rawMessage,
    raw: error,
    isFirebaseError: error instanceof FirebaseError,
  });

  let message: string;

  if (code === undefined) {
    message = "Something went wrong. Please try again.";
  } else {
    switch (code) {
      // Auth
      case "auth/email-already-in-use":
        message = "An account with this email already exists. Try signing in.";
        break;
      case "auth/weak-password":
        message = "Your password is too weak. Use at least 6 characters.";
        break;
      case "auth/invalid-credential":
      case "auth/invalid-login-credentials":
      case "auth/wrong-password":
        message = "Incorrect email or password.";
        break;
      case "auth/user-not-found":
        message = "No account found with this email.";
        break;
      case "auth/invalid-email":
        message = "That email address looks invalid.";
        break;
      case "auth/too-many-requests":
        message = "Too many attempts. Please wait a moment and try again.";
        break;
      case "auth/network-request-failed":
        message = "Network error. Check your connection and try again.";
        break;
      case "auth/popup-closed-by-user":
        message = "The sign-in window was closed.";
        break;
      case "auth/user-disabled":
        message = "This account has been disabled.";
        break;
      case "auth/requires-recent-login":
        message = "Please re-authenticate (sign back in) before making this change.";
        break;
      case "auth/operation-not-allowed":
        message = "This sign-in method is not enabled.";
        break;
      case "auth/invalid-action-code":
        message = "This link or code is invalid or has expired.";
        break;
      // Firestore / Storage
      case "permission-denied":
        message = "You don't have permission to do that.";
        break;
      case "unavailable":
        message = "The service is temporarily unavailable. Please retry.";
        break;
      case "not-found":
        message = "That item could not be found.";
        break;
      case "already-exists":
        message = "That item already exists.";
        break;
      case "storage/unauthorized":
        message = "You don't have permission to upload files here.";
        break;
      case "storage/quota-exceeded":
        message = "Storage limit reached.";
        break;
      case "storage/canceled":
        message = "The upload was cancelled.";
        break;
      default:
        message = "Something went wrong. Please try again.";
    }
  }

  // TEMP: append the raw code AND the raw message so both are visible in the
  // UI during debugging.
  const codeSuffix = code ? `[${code}]` : `[unknown error]`;
  return `${message} ${codeSuffix} ${rawMessage}`;
}

/** Map a Firestore write error to an actionable message during form ops. */
export function isPermissionDenied(error: unknown): boolean {
  return errorCode(error) === "permission-denied";
}
