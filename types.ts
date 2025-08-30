
export enum UserRole {
  Admin = 'ادمین',
  Secretary = 'دبیر جلسه',
  Normal = 'عادی',
}

export enum Gender {
  Male = 'آقا',
  Female = 'خانم',
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  orgEmail: string;
  personalEmail: string;
  gender: Gender;
  role: UserRole;
  position: string;
  password?: string; // Added for login
}

export enum ActionType {
  ForAction = 'جهت اقدام',
  ForInfo = 'جهت اطلاع',
  ForFollowUp = 'جهت پیگیری',
}

export enum TaskStatus {
  Done = 'انجام شده',
  InProgress = 'در حال انجام',
  Suspended = 'معلق شده',
  Waiting = 'در انتظار اقدام دیگر',
  NotDone = 'انجام نشده',
}

export interface Task {
  id: number;
  meetingId: number;
  description: string;
  actionType: ActionType;
  assigneeId: number;
  dueDate: string; // Shamsi date string
  status: TaskStatus;
  claimedStatus?: TaskStatus; // Added for user-reported status
  waitingFor?: string;
  notes?: string;
  attachments?: File[];
}

export interface Meeting {
  id: number;
  title: string;
  secretaryId: number;
  company: string;
  location: string;
  date: string; // Shamsi date string
  attendeeIds: number[];
  meetingNumber: string; // Added for unique meeting ID
}

export interface User extends Contact {}