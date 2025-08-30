import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { TaskStatus, UserRole } from '../types';
import { ChartBarIcon, PieChartIcon, SparklesIcon, SpinnerIcon } from '../components/icons';

const COLORS = ['#F97316', '#FB923C', '#fdba74', '#fed7aa', '#ffedd5'];
const COLORS_ASSIGNEE = ['#22c55e', '#86efac', '#dcfce7'];


const getTodayShamsiComparable = () => {
    const date = new Date();
    const shamsiDate = date.toLocaleDateString('fa-IR-u-nu-latn').split('/');
    return `${shamsiDate[0]}${shamsiDate[1].padStart(2, '0')}${shamsiDate[2].padStart(2, '0')}`;
};

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold dark:fill-white">
        {payload.name}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="dark:fill-gray-300">{`${value} وظیفه`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(نرخ ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const Dashboard: React.FC = () => {
    const { user, isAdminOrSecretary } = useAuth();
    const { tasks, meetings, contacts } = useData();
    const [monthFilter, setMonthFilter] = useState<string>('all');
    const [meetingFilter, setMeetingFilter] = useState<string>('all');
    const [statusChartType, setStatusChartType] = useState<'pie' | 'bar'>('pie');
    const [assigneeChartType, setAssigneeChartType] = useState<'bar' | 'pie'>('bar');
    const [activePieIndex, setActivePieIndex] = useState(0);

    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const PieWithActiveIndex = Pie as any;

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        meetings.forEach(meeting => {
            const month = meeting.date.substring(0, 7); // e.g., "1403/05"
            months.add(month);
        });
        return Array.from(months).sort().reverse();
    }, [meetings]);

    const filteredTasks = useMemo(() => {
        let userTasks = tasks;
        if (user && user.role === UserRole.Normal) {
            userTasks = tasks.filter(task => task.assigneeId === user.id);
        }
        
        const tasksWithMeetingInfo = userTasks.map(task => {
            const meeting = meetings.find(m => m.id === task.meetingId);
            return { ...task, meetingDate: meeting?.date || '', meetingNumber: meeting?.meetingNumber || '' };
        });

        return tasksWithMeetingInfo.filter(task => {
            const monthMatch = monthFilter === 'all' || task.meetingDate.startsWith(monthFilter);
            const meetingMatch = meetingFilter === 'all' || task.meetingNumber === meetingFilter;
            return monthMatch && meetingMatch;
        });
    }, [tasks, meetings, monthFilter, meetingFilter, user]);

    const { totalMeetings, totalTasks, overdueTasks } = useMemo(() => {
        const today = getTodayShamsiComparable();
        const relevantMeetings = meetings.filter(m => monthFilter === 'all' || m.date.startsWith(monthFilter));
        const overdue = filteredTasks.filter(t => (t.dueDate.replace(/\//g, '') < today) && t.status !== TaskStatus.Done);
        return {
            totalMeetings: relevantMeetings.length,
            totalTasks: filteredTasks.length,
            overdueTasks: overdue.length
        };
    }, [meetings, filteredTasks, monthFilter]);


    const tasksByStatus = useMemo(() => {
        const counts = filteredTasks.reduce((acc, task) => {
            const status = task.claimedStatus || task.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<TaskStatus, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredTasks]);

    const tasksByAssignee = useMemo(() => {
        const counts = filteredTasks.reduce((acc, task) => {
            const assigneeName = contacts.find(c => c.id === task.assigneeId)?.lastName || 'نامشخص';
            acc[assigneeName] = (acc[assigneeName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, tasks]) => ({ name, tasks }));
    }, [filteredTasks, contacts]);

    const handleAiReport = async () => {
        if (!aiQuery.trim()) {
            alert("لطفا درخواست خود را وارد کنید.");
            return;
        }
        if (!process.env.API_KEY) {
            alert("کلید API جمینی تنظیم نشده است.");
            setAiResponse("خطا: کلید API جمینی یافت نشد.");
            return;
        }

        setIsAiLoading(true);
        setAiResponse('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const dataContext = { meetings, tasks, contacts };
            const prompt = `
                شما یک تحلیلگر داده برای یک سامانه مدیریت جلسات هستید.
                فقط و فقط بر اساس داده های JSON زیر، به درخواست کاربر پاسخ دهید.
                درخواست کاربر: "${aiQuery}"
                داده های JSON:
                ${JSON.stringify(dataContext, null, 2)}
                
                پاسخ را به زبان فارسی، واضح و خلاصه ارائه دهید. اگر داده برای پاسخ کافی نیست، این موضوع را ذکر کنید.
            `;

            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            setAiResponse(result.text);
        } catch (error) {
            console.error("Error with Gemini report:", error);
            setAiResponse("خطا در برقراری ارتباط با سرویس هوش مصنوعی.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const ChartToggleButton: React.FC<{
        type: 'pie' | 'bar';
        currentType: 'pie' | 'bar';
        setType: (type: 'pie' | 'bar') => void;
    }> = ({ type, currentType, setType }) => (
        <button onClick={() => setType(type)} className={`p-1 rounded-md transition ${currentType === type ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
            {type === 'pie' ? <PieChartIcon className="w-5 h-5" /> : <ChartBarIcon className="w-5 h-5" />}
        </button>
    );

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">داشبورد گزارشات</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center transition hover:shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">تعداد کل جلسات</h3>
                    <p className="text-4xl font-bold text-brand dark:text-orange-400 mt-2">{totalMeetings}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center transition hover:shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">تعداد کل وظایف</h3>
                    <p className="text-4xl font-bold text-gray-700 dark:text-gray-300 mt-2">{totalTasks}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center transition hover:shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">وظایف معوق</h3>
                    <p className="text-4xl font-bold text-red-500 dark:text-red-400 mt-2">{overdueTasks}</p>
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center gap-4 flex-wrap">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">فیلترها:</h3>
                <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="all">همه ماه ها</option>
                    {availableMonths.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
                <select value={meetingFilter} onChange={e => setMeetingFilter(e.target.value)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="all">همه جلسات</option>
                    {meetings.map(meeting => <option key={meeting.id} value={meeting.meetingNumber}>{meeting.meetingNumber}</option>)}
                </select>
            </div>
            
            {isAdminOrSecretary && (
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">دستیار گزارش‌گیری AI</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            placeholder="درخواست خود را به فارسی تایپ کنید (مثلا: لیست وظایف انجام نشده)"
                            className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button onClick={handleAiReport} disabled={isAiLoading} className="flex items-center justify-center px-4 py-2 rounded-lg text-white bg-brand hover:bg-orange-600 disabled:bg-orange-400 transition w-36">
                            {isAiLoading ? <SpinnerIcon /> : <><SparklesIcon className="ml-2" /><span>دریافت گزارش</span></>}
                        </button>
                    </div>
                    {(aiResponse || isAiLoading) && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <h3 className="font-bold mb-2 text-gray-800 dark:text-white">پاسخ AI:</h3>
                            {isAiLoading && <p className="text-gray-600 dark:text-gray-300">لطفا منتظر بمانید...</p>}
                            <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{aiResponse}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">وظایف بر اساس وضعیت</h2>
                        <div className="flex gap-2">
                           <ChartToggleButton type="pie" currentType={statusChartType} setType={setStatusChartType} />
                           <ChartToggleButton type="bar" currentType={statusChartType} setType={setStatusChartType} />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        {statusChartType === 'pie' ? (
                            <PieChart>
                                <PieWithActiveIndex activeIndex={activePieIndex} activeShape={renderActiveShape} data={tasksByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#F97316" dataKey="value" onMouseEnter={(_: any, index: number) => setActivePieIndex(index)}>
                                    {tasksByStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </PieWithActiveIndex>
                                <Tooltip />
                            </PieChart>
                        ) : (
                            <BarChart data={tasksByStatus} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip wrapperClassName="dark:!bg-gray-700 dark:!border-gray-600" />
                                <Bar dataKey="value" name="تعداد وظایف">
                                    {tasksByStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">تعداد وظایف هر شخص</h2>
                        <div className="flex gap-2">
                           <ChartToggleButton type="bar" currentType={assigneeChartType} setType={setAssigneeChartType} />
                           <ChartToggleButton type="pie" currentType={assigneeChartType} setType={setAssigneeChartType} />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        {assigneeChartType === 'bar' ? (
                            <BarChart data={tasksByAssignee} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip wrapperClassName="dark:!bg-gray-700 dark:!border-gray-600" />
                                <Legend />
                                <Bar dataKey="tasks" name="تعداد وظایف" fill="#FB923C" />
                            </BarChart>
                        ) : (
                             <PieChart>
                                <Pie data={tasksByAssignee} dataKey="tasks" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#F97316" label>
                                     {tasksByAssignee.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_ASSIGNEE[index % COLORS_ASSIGNEE.length]} />))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
