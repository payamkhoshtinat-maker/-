import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Task, TaskStatus } from '../types';
import { MailIcon } from '../components/icons';

type SortConfig = {
    key: keyof FormattedTask;
    direction: 'ascending' | 'descending';
} | null;

interface FormattedTask extends Task {
    meetingTitle: string;
    meetingDate: string;
    secretaryName: string;
    attendeeCount: number;
    meetingLocation: string;
    totalMeetingTasks: number;
    assigneeName: string;
    meetingNumber: string;
}

const FollowUpEmailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  task: FormattedTask | null;
}> = ({ isOpen, onClose, onConfirm, task }) => {
  if (!isOpen || !task) return null;

  const emailBody = `سلام خانم/آقای ${task.assigneeName.split(' ')[1]},

جهت یادآوری و پیگیری، جزئیات وظیفه محول شده به شما از صورتجلسه "${task.meetingTitle}" به شرح زیر است:

- **شماره جلسه:** ${task.meetingNumber}
- **تاریخ جلسه:** ${task.meetingDate}
- **دبیر جلسه:** ${task.secretaryName}

- **شرح وظیفه:** ${task.description}
- **مهلت انجام:** ${task.dueDate}
- **وضعیت فعلی:** ${task.status}

لطفاً در صورت نیاز به راهنمایی یا وجود مشکل، اطلاع دهید.

با تشکر.
  `.trim();

  const subject = `یادآوری پیگیری وظیفه: ${task.description.substring(0, 30)}...`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">پیش‌نمایش ایمیل پیگیری</h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <p><strong>به:</strong> {task.assigneeName}</p>
            <p><strong>موضوع:</strong> {subject}</p>
            <div className="mt-4 pt-4 border-t dark:border-gray-600">
                <h3 className="font-semibold mb-2">متن ایمیل:</h3>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md whitespace-pre-wrap text-sm">
                    {emailBody}
                </div>
            </div>
        </div>
        <div className="flex justify-end space-x-reverse space-x-2 pt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">انصراف</button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 bg-brand text-white rounded-md hover:bg-orange-600 transition">تایید و ارسال</button>
        </div>
      </div>
    </div>
  );
};


const AllMinutes: React.FC = () => {
    const { tasks, meetings, contacts, updateTask } = useData();
    const [filter, setFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [selectedTaskForEmail, setSelectedTaskForEmail] = useState<FormattedTask | null>(null);


    const formattedTasks = useMemo(() => {
        return tasks.map(task => {
            const meeting = meetings.find(m => m.id === task.meetingId);
            const assignee = contacts.find(c => c.id === task.assigneeId);
            const secretary = meeting ? contacts.find(c => c.id === meeting.secretaryId) : undefined;
            
            return {
                ...task,
                meetingNumber: meeting?.meetingNumber || 'N/A',
                meetingTitle: meeting?.title || 'N/A',
                meetingDate: meeting?.date || 'N/A',
                secretaryName: secretary ? `${secretary.firstName} ${secretary.lastName}` : 'N/A',
                attendeeCount: meeting?.attendeeIds.length || 0,
                meetingLocation: meeting?.location || 'N/A',
                totalMeetingTasks: tasks.filter(t => t.meetingId === task.meetingId).length,
                assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'N/A',
            };
        });
    }, [tasks, meetings, contacts]);

    const filteredAndSortedTasks = useMemo(() => {
        let sortableItems = [...formattedTasks];
        
        if(filter) {
            const lowercasedFilter = filter.toLowerCase();
            sortableItems = sortableItems.filter(item => 
                item.description.toLowerCase().includes(lowercasedFilter) ||
                item.meetingTitle.toLowerCase().includes(lowercasedFilter) ||
                item.assigneeName.toLowerCase().includes(lowercasedFilter) ||
                item.status.toLowerCase().includes(lowercasedFilter) ||
                (item.claimedStatus && item.claimedStatus.toLowerCase().includes(lowercasedFilter))
            );
        }

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [formattedTasks, filter, sortConfig]);

    const requestSort = (key: keyof FormattedTask) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handlePreviewEmail = (task: FormattedTask) => {
        setSelectedTaskForEmail(task);
        setIsEmailModalOpen(true);
    };

    const handleConfirmSendEmail = () => {
        if (!selectedTaskForEmail) return;
        alert(`ایمیل پیگیری برای "${selectedTaskForEmail.description}" به ${selectedTaskForEmail.assigneeName} ارسال شد.`);
        setIsEmailModalOpen(false);
        setSelectedTaskForEmail(null);
    };

    const handleStatusChange = (taskId: number, newStatus: TaskStatus, waitingFor?: string) => {
        const updates: Partial<Task> = { status: newStatus };
        if (newStatus === TaskStatus.Waiting) {
            updates.waitingFor = waitingFor || '';
        } else {
            updates.waitingFor = ''; // Clear waitingFor if status changes
        }
        updateTask(taskId, updates);
    };

    const getSortIndicator = (key: keyof FormattedTask) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    const getStatusColor = (status: TaskStatus | undefined) => {
        if (!status) return 'bg-gray-200 text-gray-800';
        switch (status) {
            case TaskStatus.Done: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case TaskStatus.InProgress: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case TaskStatus.Suspended: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case TaskStatus.Waiting: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            default: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        }
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">تمام صورتجلسات</h1>
                <input
                    type="text"
                    placeholder="جستجو در شرح اقدام، عنوان جلسه، اقدام کننده و وضعیت..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-1/3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => requestSort('meetingNumber')}>شماره جلسه {getSortIndicator('meetingNumber')}</th>
                            <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => requestSort('meetingTitle')}>عنوان جلسه {getSortIndicator('meetingTitle')}</th>
                            <th scope="col" className="px-4 py-3">شرح اقدام</th>
                            <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => requestSort('assigneeName')}>اقدام کننده {getSortIndicator('assigneeName')}</th>
                            <th scope="col" className="px-4 py-3 cursor-pointer text-center" onClick={() => requestSort('claimedStatus')}>وضعیت ادعایی {getSortIndicator('claimedStatus')}</th>
                            <th scope="col" className="px-4 py-3 cursor-pointer text-center" onClick={() => requestSort('status')}>وضعیت {getSortIndicator('status')}</th>
                            <th scope="col" className="px-4 py-3">در انتظار</th>
                            <th scope="col" className="px-4 py-3 text-center">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedTasks.map(task => (
                            <tr key={task.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-4 py-4 text-center">{task.meetingNumber}</td>
                                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{task.meetingTitle}</td>
                                <td className="px-4 py-4">{task.description}</td>
                                <td className="px-4 py-4">{task.assigneeName}</td>
                                <td className="px-4 py-4 text-center">
                                    {task.claimedStatus && (
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.claimedStatus)}`}>
                                            {task.claimedStatus}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <select 
                                        value={task.status} 
                                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)} 
                                        className="p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                                    >
                                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-4 py-4">
                                    {task.status === TaskStatus.Waiting && (
                                        <input 
                                            type="text" 
                                            value={task.waitingFor || ''} 
                                            onChange={(e) => handleStatusChange(task.id, task.status, e.target.value)}
                                            className="w-full p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500 text-xs"
                                        />
                                    )}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <button onClick={() => handlePreviewEmail(task)} className="text-gray-500 hover:text-brand transition" title="ارسال ایمیل پیگیری">
                                        <MailIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <FollowUpEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onConfirm={handleConfirmSendEmail}
                task={selectedTaskForEmail}
            />
        </div>
    );
};

export default AllMinutes;
