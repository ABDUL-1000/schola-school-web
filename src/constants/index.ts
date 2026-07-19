export const API_BASE_URL = "http://localhost:5001/api/v1";

export const APP_NAME = "Schola";

export const USER_ROLES = {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
  SCHOOL: "SCHOOL",
  ADMIN: "ADMIN",
  APP_ADMIN: "APP_ADMIN",
} as const;

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export const EXAM_TYPES = {
  TEST: "TEST",
  QUIZ: "QUIZ",
  ASSIGNMENT: "ASSIGNMENT",
  FINAL: "FINAL",
} as const;

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  SHORT_ANSWER: "SHORT_ANSWER",
  ESSAY: "ESSAY",
} as const;

export const ATTENDANCE_TYPES = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  EXCUSED: "EXCUSED",
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export const DATE_FORMATS = {
  DISPLAY: "DD MMM YYYY",
  API: "YYYY-MM-DD",
  TIME: "hh:mm A",
} as const;
