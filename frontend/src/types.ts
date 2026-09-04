export type Role = "ADMIN" | "REGIONAL_HEAD" | "PROVINCIAL_COORDINATOR" | "TEACHER" | "STUDENT";

export interface AuthUser {
  id: string;
  role: Role;
  fullName: string;
}

export interface Province {
  id: string;
  name: string;
  isOther: boolean;
}

export interface Stream {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Level {
  id: string;
  name: string;
  hasStreams: boolean;
  streams: Stream[];
  subjects: Subject[];
}

export type SessionStatus =
  | "PROPOSED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export interface SessionItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  status: SessionStatus;
  meetingLink: string | null;
  teacher: { id: string; fullName: string; matricule: string };
  level: { id: string; name: string };
  stream: { id: string; name: string } | null;
  subject: { id: string; name: string };
}

export interface AvailableLesson extends SessionItem {
  isEnrolled: boolean;
}

export interface Enrollment {
  id: string;
  fullName: string;
  code: string;
  email: string;
  province: string | null;
  school: string | null;
  registeredAt: string;
  session?: SessionItem;
}
