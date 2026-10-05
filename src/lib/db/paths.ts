/** Central Firestore path builders. Keep paths in one place so rules and code never drift. */

export const paths = {
  users: (uid: string) => `users/${uid}`,
  students: (id: string) => `students/${id}`,
  groups: (id: string) => `groups/${id}`,
  lessons: (id: string) => `lessons/${id}`,
  attendance: (lessonId: string, studentId: string) =>
    `lessons/${lessonId}/attendance/${studentId}`,
  attendanceOfLesson: (lessonId: string) => `lessons/${lessonId}/attendance`,
  payments: (id: string) => `payments/${id}`,
  assessments: (id: string) => `assessments/${id}`,
  results: (assessmentId: string, studentId: string) =>
    `assessments/${assessmentId}/results/${studentId}`,
  resultsOfAssessment: (assessmentId: string) => `assessments/${assessmentId}/results`,
  exercises: (id: string) => `exercises/${id}`,
  submissions: (exerciseId: string, studentId: string) =>
    `exercises/${exerciseId}/submissions/${studentId}`,
  submissionsOfExercise: (exerciseId: string) => `exercises/${exerciseId}/submissions`,
  announcements: (id: string) => `announcements/${id}`,
  lessonResources: (id: string) => `lessonResources/${id}`,
  conversations: (id: string) => `conversations/${id}`,
  messages: (conversationId: string, messageId: string) =>
    `conversations/${conversationId}/messages/${messageId}`,
  messagesOf: (conversationId: string) => `conversations/${conversationId}/messages`,
  participants: (conversationId: string, uid: string) =>
    `conversations/${conversationId}/participants/${uid}`,
  participantsOf: (conversationId: string) =>
    `conversations/${conversationId}/participants`,
  notifications: (uid: string, id: string) => `notifications/${uid}/items/${id}`,
  notificationsOf: (uid: string) => `notifications/${uid}/items`,
  notes: (studentId: string, entryId: string) => `notes/${studentId}/entries/${entryId}`,
  notesOf: (studentId: string) => `notes/${studentId}/entries`,
  invites: (code: string) => `invites/${code}`,
  arrivals: (id: string) => `arrivals/${id}`,
  settings: (key: string) => `settings/${key}`,
  ratings: "ratings",
} as const;

/** Identity of a Firestore doc: id + typed data. */
export interface Doc<T> {
  id: string;
  data: T;
  /** Firestore document reference (available on listener-produced docs). */
  ref?: import("firebase/firestore").DocumentReference;
}

export function asDoc<T>(id: string, data: T): Doc<T> {
  return { id, data };
}