import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../contexts/DataContext';
import { TaskStatus, Task, Meeting } from '../types';
import { MailIcon } from '../components/icons';

type GroupByOption = 'none' | 'meeting' | 'status';

interface MyTask extends Task {
    meetingTitle: string;
    meetingNumber: string;
    // Fix: Added assigneeName to the interface.
    assigneeName: string;
}

const EmailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  task: MyTask | null;
  meeting: Meeting | null;
}> = ({ isOpen, onClose, task, meeting }) => {
    const { getContactById } = useData();
    const secretary = meeting ? getContactById(meeting.secretaryId) : null;
    
    if (!isOpen || !task || !meeting || !secretary) return null;

    const subject = `گزارش وضعیت وظیفه: ${task.description.substring(0, 30)}...`;
    const body = `
سلام خانم/آقای ${secretary.lastName}،

احتراماً، گزارش وضعیت وظیفه زیر از صورتجلسه شماره ${task.meetingNumber} به استحضار می‌رسد:

شرح وظیفه: ${task.description}
وضعیت فعلی: ${task.claimedStatus || task.status}
مهلت انجام: ${task.dueDate}

توضیحات اینجانب:
${task.notes || '(توضیحاتی ثبت نشده است)'}

با تشکر،
${task.assigneeName}
    `.trim();

    const handleSend = () => {
        alert('ایمیل با موفقیت (به صورت شبیه سازی شده) ارسال شد.');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">ارسال ایمیل به دبیر جلسه</h2>
                <div className="space-y-4">
                    <p><strong>به:</strong> {secretary.firstName} {secretary.lastName} ({secretary.orgEmail})</p>
                    <p><strong>موضوع:</strong> {subject}</p>
                    <textarea
                        readOnly
                        value={body}
                        className="w-full h-64 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div className="flex justify-end space-x-reverse space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">انصراف</button>
                    <button type="button" onClick={handleSend} className="px-4 py-2 bg-brand text-white rounded-md hover:bg-orange-600 transition">ارسال</button>
                </div>
            </div>
        </div>
    );
};


const MyTasks: React.FC = () => {
    const { user } = useAuth();
    const { tasks, meetings, updateTask } = useData();
    const [groupBy, setGroupBy] = useState<GroupByOption>('none');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<MyTask | null>(null);
    
    const myTasks: MyTask[] = useMemo(() => {
        if (!user) return [];
        return tasks
            .filter(task => task.assigneeId === user.id)
            .map(task => {
                const meeting = meetings.find(m => m.id === task.meetingId);
                return {
                    ...task,
                    meetingTitle: meeting?.title || 'N/A',
                    meetingNumber: meeting?.meetingNumber || 'N/A',
                    // Fix: Added assigneeName from the logged-in user's context.
                    assigneeName: `${user.firstName} ${user.lastName}`
                };
            })
            .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()); // Simplified date sort
    }, [user, tasks, meetings]);
    
    const groupedTasks = useMemo(() => {
        if (groupBy === 'none') {
            return { 'همه وظایف': myTasks };
        }
        return myTasks.reduce((acc, task) => {
            const key = groupBy === 'meeting' ? task.meetingNumber : (task.claimedStatus || task.status);
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(task);
            return acc;
        }, {} as Record<string, MyTask[]>);

    }, [myTasks, groupBy]);

    const handleClaimedStatusChange = (taskId: number, newStatus: TaskStatus) => {
        updateTask(taskId, { claimedStatus: newStatus });
    };

    const handleNotesChange = (taskId: number, notes: string) => {
        updateTask(taskId, { notes });
    };

    const handleOpenEmailModal = (task: MyTask) => {
        setSelectedTask(task);
        setIsEmailModalOpen(true);
    };

    if (!user) {
        return <div className="text-center text-xl">لطفا برای مشاهده وظایف خود وارد شوید.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">کارتابل وظایف من</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">گروه بندی بر اساس:</span>
                    <button onClick={() => setGroupBy('none')} className={`px-3 py-1 text-sm rounded-full transition ${groupBy === 'none' ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>هیچکدام</button>
                    <button onClick={() => setGroupBy('meeting')} className={`px-3 py-1 text-sm rounded-full transition ${groupBy === 'meeting' ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>شماره صورتجلسه</button>
                    <button onClick={() => setGroupBy('status')} className={`px-3 py-1 text-sm rounded-full transition ${groupBy === 'status' ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>وضعیت</button>
                </div>
            </div>

            <div className="space-y-6">
                {Object.entries(groupedTasks).map(([groupTitle, groupTasks]) => (
                    <div key={groupTitle}>
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b-2 border-brand">{groupTitle} ({groupTasks.length})</h2>
                        <div className="space-y-4">
                            {groupTasks.length > 0 ? groupTasks.map(task => (
                                <div key={task.id} className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">از جلسه: {task.meetingTitle} (شماره: {task.meetingNumber})</p>
                                            <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">{task.description}</p>
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">مهلت انجام: {task.dueDate}</p>
                                        </div>
                                        <div className="w-40 flex-shrink-0">
                                            <label className="text-xs font-semibold">تغییر وضعیت:</label>
                                            <select 
                                                value={task.claimedStatus || task.status} 
                                                onChange={(e) => handleClaimedStatusChange(task.id, e.target.value as TaskStatus)}
                                                className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                            >
                                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-between items-end">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                                            <textarea
                                                placeholder="توضیحات خود را اینجا بنویسید..."
                                                value={task.notes || ''}
                                                onChange={(e) => handleNotesChange(task.id, e.target.value)}
                                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                rows={2}
                                            ></textarea>
                                        </div>
                                         <button onClick={() => handleOpenEmailModal(task)} className="mr-4 flex items-center px-4 py-2 bg-brand text-white rounded-lg shadow hover:bg-orange-600 transition h-full">
                                            <MailIcon className="w-5 h-5 ml-2"/>
                                            ارسال ایمیل به دبیر
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
                                    <p className="text-lg text-gray-600 dark:text-gray-300">هیچ وظیفه‌ای در این گروه وجود ندارد.</p>
                                </div>
                            )}
                        </div>
                    </div>
                 ))
                }
            </div>

            <EmailModal 
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                task={selectedTask}
                meeting={meetings.find(m => m.id === selectedTask?.meetingId) || null}
            />
        </div>
    );
};

export default MyTasks;
