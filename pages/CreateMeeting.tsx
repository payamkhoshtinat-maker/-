import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Contact, ActionType, Task, Meeting, TaskStatus, UserRole, Gender } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { PlusIcon, MicrophoneIcon, StopIcon, SparklesIcon, MailIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

// Helper function to get today's date in Shamsi format YYYY/MM/DD
const getTodayShamsi = () => {
    const date = new Date();
    const shamsiDate = date.toLocaleDateString('fa-IR-u-nu-latn').split('/');
    const year = shamsiDate[0];
    const month = shamsiDate[1].padStart(2, '0');
    const day = shamsiDate[2].padStart(2, '0');
    return `${year}/${month}/${day}`;
};

const SearchableSelect: React.FC<{
  options: Contact[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  placeholder: string;
  isMulti?: boolean;
}> = ({ options, selectedIds, onChange, placeholder, isMulti = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(option =>
        `${option.firstName} ${option.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleSelect = (optionId: number) => {
        if (isMulti) {
            const newSelectedIds = selectedIds.includes(optionId)
                ? selectedIds.filter(id => id !== optionId)
                : [...selectedIds, optionId];
            onChange(newSelectedIds);
        } else {
            onChange([optionId]);
            setIsOpen(false);
        }
    };

    const removeOption = (optionId: number) => {
        onChange(selectedIds.filter(id => id !== optionId));
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white flex flex-wrap gap-1 items-center min-h-[42px]" onClick={() => setIsOpen(!isOpen)}>
                {isMulti && selectedOptions.map(opt => (
                    <span key={opt.id} className="bg-brand text-white px-2 py-1 rounded-full text-sm flex items-center">
                        {opt.firstName} {opt.lastName}
                        <button onClick={(e) => { e.stopPropagation(); removeOption(opt.id); }} className="mr-2 text-white hover:text-gray-200">&times;</button>
                    </span>
                ))}
                {!isMulti && selectedOptions.length > 0 && <span>{selectedOptions[0].firstName} {selectedOptions[0].lastName}</span>}
                <input
                    type="text"
                    placeholder={selectedOptions.length === 0 ? placeholder : ''}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className="flex-grow bg-transparent outline-none"
                />
            </div>
            {isOpen && (
                <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.map(option => (
                        <li key={option.id} onClick={() => handleSelect(option.id)} className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedIds.includes(option.id) ? 'bg-orange-100 dark:bg-orange-900/50' : ''}`}>
                            {option.firstName} {option.lastName}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

interface EmailPreviewData {
    meeting: Omit<Meeting, 'id' | 'meetingNumber'>;
    tasks: Omit<Task, 'id' | 'meetingId'>[];
    emails: {
        to: string;
        assigneeName: string;
        subject: string;
        body: string;
    }[];
}

const GroupEmailPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previewData: EmailPreviewData | null;
}> = ({ isOpen, onClose, onConfirm, previewData }) => {
    if (!isOpen || !previewData) return null;

    const recipients = previewData.emails.map(e => e.assigneeName).join('، ');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">پیش‌نمایش و تایید ارسال ایمیل گروهی</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <p><strong>موضوع جلسه:</strong> {previewData.meeting.title}</p>
                    <p><strong>ارسال برای:</strong> {recipients}</p>
                    <div className="mt-4 pt-4 border-t dark:border-gray-600">
                        <h3 className="font-semibold mb-2">نمونه متن ایمیل:</h3>
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md whitespace-pre-wrap text-sm">
                            {previewData.emails[0]?.body || "ایمیلی برای ارسال وجود ندارد."}
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


const CreateMeeting: React.FC = () => {
    const { contacts, meetings, tasks: allTasks, addMeetingAndTasks, getContactById } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();

    // State for meeting details
    const [title, setTitle] = useState('');
    const [secretaryId, setSecretaryId] = useState<number[]>([]);
    const [company, setCompany] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(getTodayShamsi());
    const [attendeeIds, setAttendeeIds] = useState<number[]>([]);
    const [selectedMeetingToCopy, setSelectedMeetingToCopy] = useState<string>('');
    
    // State for tasks
    const [tempTasks, setTempTasks] = useState<any[]>([]);
    const [currentTask, setCurrentTask] = useState({ description: '', actionType: ActionType.ForAction, assigneeId: [], dueDate: getTodayShamsi() });
    
    // State for recording
    const [isRecording, setIsRecording] = useState(false);
    const [summary, setSummary] = useState('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isEditable, setIsEditable] = useState(true);

    // State for email preview modal
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState<EmailPreviewData | null>(null);

    const resetForm = () => {
        setTitle('');
        setSecretaryId([]);
        setCompany('');
        setLocation('');
        setDate(getTodayShamsi());
        setAttendeeIds([]);
        setTempTasks([]);
        setCurrentTask({ description: '', actionType: ActionType.ForAction, assigneeId: [], dueDate: getTodayShamsi() });
        setSelectedMeetingToCopy('');
        setIsEditable(true);
    };
    
    useEffect(() => {
        if (!selectedMeetingToCopy) {
            resetForm();
            return;
        };

        const meetingId = parseInt(selectedMeetingToCopy, 10);
        const meetingToCopy = meetings.find(m => m.id === meetingId);
        if (!meetingToCopy) return;

        // Access control
        const isToday = meetingToCopy.date === getTodayShamsi();
        const canEdit = user?.role === UserRole.Admin || (user?.role === UserRole.Secretary && isToday);

        if (!canEdit) {
            alert("شما اجازه ویرایش این صورتجلسه را ندارید.");
            setIsEditable(false);
        } else {
            setIsEditable(true);
        }

        setTitle(meetingToCopy.title);
        setSecretaryId([meetingToCopy.secretaryId]);
        setCompany(meetingToCopy.company);
        setLocation(meetingToCopy.location);
        setDate(meetingToCopy.date);
        setAttendeeIds(meetingToCopy.attendeeIds);

        const relatedTasks = allTasks
            .filter(t => t.meetingId === meetingId)
            .map((t, index) => ({
                id: `temp-${Date.now()}-${index}`,
                description: t.description,
                actionType: t.actionType,
                assigneeId: t.assigneeId,
                dueDate: t.dueDate,
            }));
        setTempTasks(relatedTasks);

    }, [selectedMeetingToCopy, meetings, allTasks, user]);


    const handleAddTask = () => {
        if (!currentTask.description || currentTask.assigneeId.length === 0 || !currentTask.dueDate) {
            alert('لطفاً تمام فیلدهای وظیفه را پر کنید.');
            return;
        }
        setTempTasks([...tempTasks, { ...currentTask, id: `temp-${Date.now()}`, assigneeId: currentTask.assigneeId[0] }]);
        setCurrentTask({ description: '', actionType: ActionType.ForAction, assigneeId: [], dueDate: getTodayShamsi() });
    };

    const handleRecord = () => {
        if (isRecording) {
            setIsRecording(false);
        } else {
            setIsRecording(true);
            alert("شبیه سازی ضبط صدا شروع شد. برای توقف دوباره کلیک کنید.\n (نیاز به پیاده سازی کامل MediaRecorder API دارد)");
        }
    };
    
    const handleSummarize = async () => {
      const mockTranscript = `متن ضبط شده جلسه در اینجا قرار میگیرد. هوش مصنوعی این متن را به خلاصه تبدیل میکند.`;
      
      if (!process.env.API_KEY) {
          alert("کلید API جمینی تنظیم نشده است.");
          setSummary("خطا: کلید API جمینی یافت نشد.");
          return;
      }

      setIsLoadingSummary(true);
      setSummary('');
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `این متن جلسه را به صورت یک خلاصه مدیریتی به زبان فارسی بنویس. فقط موارد کلیدی و وظایف تعریف شده را ذکر کن:\n\n${mockTranscript}`,
        });
        setSummary(result.text);
      } catch (error) {
          console.error("Error summarizing with Gemini:", error);
          setSummary("خطا در برقراری ارتباط با سرویس هوش مصنوعی.");
      } finally {
          setIsLoadingSummary(false);
      }
    };

    const prepareMeetingData = () => {
        if (!title || secretaryId.length === 0 || !date || attendeeIds.length === 0) {
            alert("لطفا فیلدهای ضروری جلسه (عنوان، دبیر، تاریخ و شرکت کنندگان) را تکمیل کنید.");
            return null;
        }

        const newMeeting: Omit<Meeting, 'id' | 'meetingNumber'> = {
            title,
            secretaryId: secretaryId[0],
            company,
            location,
            date,
            attendeeIds
        };
        
        const newTasks: Omit<Task, 'id' | 'meetingId'>[] = tempTasks.map(t => ({
            description: t.description,
            actionType: t.actionType,
            assigneeId: t.assigneeId,
            dueDate: t.dueDate,
            status: TaskStatus.NotDone,
        }));

        return { newMeeting, newTasks };
    }

    const handleSaveMeeting = () => {
        if (!isEditable) {
            alert("شما اجازه ذخیره این صورتجلسه را ندارید.");
            return;
        }
        
        const data = prepareMeetingData();
        if (data) {
            addMeetingAndTasks(data.newMeeting, data.newTasks);
            alert("صورتجلسه و وظایف با موفقیت ذخیره شد.");
            navigate('/all-minutes');
        }
    };
    
    const handlePreviewAndSendEmails = () => {
        if (!isEditable) {
            alert("شما اجازه ذخیره و ارسال این صورتجلسه را ندارید.");
            return;
        }

        const data = prepareMeetingData();
        if (!data) return;

        const { newMeeting, newTasks } = data;

        // Group tasks by assignee
        const tasksByAssignee = newTasks.reduce((acc, task) => {
            const assigneeId = task.assigneeId;
            if (!acc[assigneeId]) {
                acc[assigneeId] = [];
            }
            acc[assigneeId].push(task);
            return acc;
        }, {} as Record<number, Omit<Task, 'id' | 'meetingId'>[]>);
        
        const emails: EmailPreviewData['emails'] = [];

        for (const assigneeIdStr in tasksByAssignee) {
            const assigneeId = parseInt(assigneeIdStr, 10);
            const assignee = getContactById(assigneeId);
            const tasksForAssignee = tasksByAssignee[assigneeId];

            if (assignee && tasksForAssignee.length > 0) {
                const taskList = tasksForAssignee.map(t => `- ${t.description} (مهلت: ${t.dueDate})`).join('\n');
                const emailBody = `سلام خانم/آقای ${assignee.lastName},\n\nوظایف زیر از صورتجلسه "${newMeeting.title}" مورخ ${newMeeting.date} به شما محول گردید:\n\n${taskList}\n\nبا تشکر.`;
                
                emails.push({
                    to: assignee.orgEmail,
                    assigneeName: `${assignee.firstName} ${assignee.lastName}`,
                    subject: `اعلان وظایف جلسه: ${newMeeting.title}`,
                    body: emailBody,
                });
            }
        }

        if (emails.length === 0) {
            alert("هیچ وظیفه‌ای برای ارسال ایمیل وجود ندارد. لطفاً ابتدا وظایف را تعریف کنید.");
            return;
        }
        
        setPreviewData({ meeting: newMeeting, tasks: newTasks, emails });
        setIsPreviewModalOpen(true);
    };

    const handleConfirmSaveAndSend = () => {
        if (!previewData) return;

        const { meeting, tasks, emails } = previewData;

        // Simulate sending emails
        emails.forEach(email => {
            console.log(`--- Sending Email to ${email.to} ---\nSubject: ${email.subject}\n${email.body}`);
        });

        // Save data to the database
        addMeetingAndTasks(meeting, tasks);
        
        const emailedContacts = emails.map(e => e.assigneeName);
        alert(`صورتجلسه و وظایف با موفقیت ذخیره شد.\n\nایمیل اطلاع رسانی برای افراد زیر ارسال گردید:\n${emailedContacts.join('، ')}`);
        
        setIsPreviewModalOpen(false);
        setPreviewData(null);
        navigate('/all-minutes');
    };

    const attendees = contacts.filter(c => attendeeIds.includes(c.id));
    const maleAttendees = attendees.filter(a => a.gender === Gender.Male);
    const femaleAttendees = attendees.filter(a => a.gender === Gender.Female);

    return (
        <div className="space-y-6">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                 <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">مشخصات جلسه</h2>
                    <div className="flex items-center gap-2">
                         <label htmlFor="copy-meeting" className="text-sm font-medium">کپی از صورتجلسه قبلی:</label>
                         <select
                            id="copy-meeting"
                            value={selectedMeetingToCopy}
                            onChange={e => setSelectedMeetingToCopy(e.target.value)}
                            className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                         >
                             <option value="">یک جلسه را انتخاب کنید...</option>
                             {meetings.map(m => (
                                 <option key={m.id} value={m.id}>
                                     {m.meetingNumber} - {m.title}
                                 </option>
                             ))}
                         </select>
                    </div>
                </div>
                <fieldset disabled={!isEditable}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input type="text" placeholder="عنوان جلسه" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <SearchableSelect options={contacts} selectedIds={secretaryId} onChange={setSecretaryId} placeholder="دبیر جلسه" />
                        <input type="text" placeholder="نام شرکت" value={company} onChange={e => setCompany(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <input type="text" placeholder="محل برگزاری" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <input type="text" placeholder="تاریخ برگزاری" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center" />
                        <div className="lg:col-span-3">
                             <SearchableSelect options={contacts} selectedIds={attendeeIds} onChange={setAttendeeIds} placeholder="شرکت کنندگان" isMulti={true} />
                        </div>
                    </div>

                    {attendees.length > 0 && (
                        <div className="mt-4 pt-4 border-t dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 space-y-2">
                            {maleAttendees.length > 0 && (
                                <div>
                                    <span className="font-bold">آقایان: </span>
                                    <span>{maleAttendees.map(a => `${a.firstName} ${a.lastName}`).join('، ')}</span>
                                </div>
                            )}
                            {femaleAttendees.length > 0 && (
                                <div>
                                    <span className="font-bold">خانم ها: </span>
                                    <span>{femaleAttendees.map(a => `${a.firstName} ${a.lastName}`).join('، ')}</span>
                                </div>
                            )}
                        </div>
                    )}

                     <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <button onClick={handleRecord} className={`flex items-center px-4 py-2 rounded-lg text-white transition ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-orange-600'}`}>
                             {isRecording ? <StopIcon className="ml-2" /> : <MicrophoneIcon className="ml-2" />}
                             {isRecording ? 'توقف ضبط' : 'ضبط جلسه'}
                           </button>
                            <button onClick={handleSummarize} disabled={isLoadingSummary} className="flex items-center px-4 py-2 rounded-lg text-white bg-brand hover:bg-orange-600 disabled:bg-orange-400 transition">
                             <SparklesIcon className="ml-2" />
                             {isLoadingSummary ? 'در حال پردازش...' : 'خلاصه سازی با AI'}
                           </button>
                        </div>
                         <div className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-lg font-semibold">
                             تعداد حاضرین: {attendeeIds.length} نفر
                        </div>
                     </div>
                     {(summary || isLoadingSummary) && (
                         <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                             <h3 className="font-bold mb-2 text-gray-800 dark:text-white">خلاصه جلسه:</h3>
                             {isLoadingSummary && <p className="text-gray-600 dark:text-gray-300">در حال تولید خلاصه توسط هوش مصنوعی...</p>}
                             <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{summary}</p>
                         </div>
                     )}
                </fieldset>
            </div>
            
            <fieldset disabled={!isEditable} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <legend className="text-xl font-bold mb-4 border-b pb-3 text-gray-800 dark:text-white w-full">اقدامات و وظایف جلسه</legend>
                <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
                    <textarea value={currentTask.description} onChange={e => setCurrentTask({...currentTask, description: e.target.value})} placeholder="شرح اقدام" className="md:col-span-3 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[42px]"></textarea>
                    <select value={currentTask.actionType} onChange={e => setCurrentTask({...currentTask, actionType: e.target.value as ActionType})} className="md:col-span-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {Object.values(ActionType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="md:col-span-2">
                         <SearchableSelect options={attendees} selectedIds={currentTask.assigneeId} onChange={(ids) => setCurrentTask({...currentTask, assigneeId: ids})} placeholder="اقدام کننده" />
                    </div>
                    <input type="text" value={currentTask.dueDate} onChange={e => setCurrentTask({...currentTask, dueDate: e.target.value})} placeholder="تاریخ اقدام" className="md:col-span-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center" />
                    <button onClick={handleAddTask} className="md:col-span-1 flex items-center justify-center px-4 py-2 bg-brand text-white rounded-lg shadow hover:bg-orange-600 transition h-full">
                        <PlusIcon className="w-5 h-5 ml-2" /> افزودن
                    </button>
                </div>
                
                <div className="mt-6 space-y-3">
                    {tempTasks.map((task, index) => (
                        <div key={task.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-start gap-4">
                            <span className="font-bold text-lg text-brand dark:text-orange-400">{tempTasks.length - index}.</span>
                            <div className="flex-1">
                                <p className="text-gray-800 dark:text-gray-100">{task.description}</p>
                                <div className="flex items-center gap-6 text-sm mt-2 text-gray-500 dark:text-gray-400">
                                    <span><strong>اقدام کننده:</strong> {getContactById(task.assigneeId)?.firstName} {getContactById(task.assigneeId)?.lastName}</span>
                                    <span><strong>نوع اقدام:</strong> {task.actionType}</span>
                                    <span className="text-center"><strong>تاریخ اقدام:</strong> {task.dueDate}</span>
                                </div>
                            </div>
                        </div>
                    )).reverse()}
                </div>
            </fieldset>

            <div className="flex justify-end gap-4">
                <button 
                    onClick={handleSaveMeeting} 
                    disabled={!isEditable}
                    className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-lg hover:bg-gray-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    ذخیره صورتجلسه
                </button>
                 <button 
                    onClick={handlePreviewAndSendEmails} 
                    disabled={!isEditable}
                    className="px-6 py-3 bg-brand text-white font-bold rounded-lg shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <MailIcon className="w-5 h-5" />
                    ذخیره و ارسال ایمیل گروهی
                </button>
            </div>

            <GroupEmailPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                onConfirm={handleConfirmSaveAndSend}
                previewData={previewData}
            />
        </div>
    );
};

export default CreateMeeting;
