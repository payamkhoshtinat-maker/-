import { Contact, Meeting, Task, User, UserRole, Gender, ActionType, TaskStatus } from '../types';

export const mockContacts: Contact[] = [
  { id: 1, firstName: 'پیام', lastName: 'خوش طینت', phone: '09123456789', orgEmail: 'payam.khoshtinat@gmail.com', personalEmail: 'payam.k@gmail.com', gender: Gender.Male, role: UserRole.Admin, position: 'مدیرعامل', password: '123456' },
  { id: 2, firstName: 'مریم', lastName: 'جوشن', phone: '09123456788', orgEmail: 'maryam.joushan@company.com', personalEmail: 'maryam.j@gmail.com', gender: Gender.Female, role: UserRole.Secretary, position: 'مدیر دفتر', password: '123456' },
  { id: 3, firstName: 'بابک', lastName: 'رستگار', phone: '09123456787', orgEmail: 'babak.rastegar@company.com', personalEmail: 'babak.r@gmail.com', gender: Gender.Male, role: UserRole.Normal, position: 'کارشناس فروش', password: '123456' },
  { id: 4, firstName: 'ستایش', lastName: 'زنگنه', phone: '09123456786', orgEmail: 'setayesh.zangeneh@company.com', personalEmail: 'setayesh.z@gmail.com', gender: Gender.Female, role: UserRole.Normal, position: 'کارشناس بازاریابی', password: '123456' },
  { id: 5, firstName: 'مجید', lastName: 'استادعلی', phone: '09123456785', orgEmail: 'majid.ostadali@company.com', personalEmail: 'majid.o@gmail.com', gender: Gender.Male, role: UserRole.Normal, position: 'مدیر فنی', password: '123456' },
];

export const mockUsers: User[] = [...mockContacts];

export const mockMeetings: Meeting[] = [
  { id: 1, meetingNumber: '14030415-1', title: 'جلسه بررسی فروش سه ماهه اول', secretaryId: 2, company: 'شرکت ما', location: 'اتاق کنفرانس اصلی', date: '1403/04/15', attendeeIds: [1, 2, 3, 4] },
  { id: 2, meetingNumber: '14030501-2', title: 'برنامه ریزی کمپین بازاریابی جدید', secretaryId: 2, company: 'شرکت ما', location: 'آنلاین', date: '1403/05/01', attendeeIds: [1, 2, 4, 5] },
];

export const mockTasks: Task[] = [
  { id: 1, meetingId: 1, description: 'آماده سازی گزارش نهایی فروش و ارائه در جلسه بعدی', actionType: ActionType.ForAction, assigneeId: 3, dueDate: '1403/04/25', status: TaskStatus.InProgress },
  { id: 2, meetingId: 1, description: 'بررسی دلایل افت فروش در منطقه شمال', actionType: ActionType.ForFollowUp, assigneeId: 4, dueDate: '1403/04/30', status: TaskStatus.Done, claimedStatus: TaskStatus.Done },
  { id: 3, meetingId: 2, description: 'طراحی بنرهای تبلیغاتی برای کمپین', actionType: ActionType.ForAction, assigneeId: 4, dueDate: '1403/05/10', status: TaskStatus.NotDone },
  { id: 4, meetingId: 2, description: 'توسعه لندینگ پیج کمپین', actionType: ActionType.ForAction, assigneeId: 5, dueDate: '1403/05/15', status: TaskStatus.Waiting, waitingFor: 'تایید نهایی محتوا از تیم بازاریابی' },
  { id: 5, meetingId: 2, description: 'اطلاع رسانی به کل تیم در مورد شروع کمپین', actionType: ActionType.ForInfo, assigneeId: 2, dueDate: '1403/05/05', status: TaskStatus.Done },
  { id: 6, meetingId: 1, description: 'بررسی نهایی و تایید بودجه بازاریابی سه ماهه دوم', actionType: ActionType.ForAction, assigneeId: 1, dueDate: '1403/05/20', status: TaskStatus.NotDone },
  { id: 7, meetingId: 2, description: 'هماهنگی با تیم فنی جهت آماده سازی زیرساخت کمپین', actionType: ActionType.ForFollowUp, assigneeId: 2, dueDate: '1403/05/12', status: TaskStatus.InProgress },
];