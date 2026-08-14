import { FirebaseError } from "firebase/app";

/**
 * Translate common Firebase Auth / Firestore error codes into human,
 * student-friendly messages. Codes we don't recognize fall back to a
 * generic message (never leak raw error internals to the UI).
 */
export function humanError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "Something went wrong. Please try again.";
  }

  switch (error.code) {
    // Auth
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Your password is too weak. Use at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/popup-closed-by-user":
      return "The sign-in window was closed.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/requires-recent-login":
      return "Please re-authenticate (sign back in) before making this change.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled.";
    case "auth/invalid-action-code":
      return "This link or code is invalid or has expired.";
    // Firestore / Storage
    case "permission-denied":
      return "You don't have permission to do that.";
    case "unavailable":
      return "The service is temporarily unavailable. Please retry.";
    case "not-found":
      return "That item could not be found.";
    case "already-exists":
      return "That item already exists.";
    case "storage/unauthorized":
      return "You don't have permission to upload files here.";
    case "storage/quota-exceeded":
      return "Storage limit reached.";
    case "storage/canceled":
      return "The upload was cancelled.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** Map a Firestore write error to an actionable message during form ops. */
export function isPermissionDenied(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "permission-denied";
}