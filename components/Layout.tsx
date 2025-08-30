import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UsersIcon, DocumentAddIcon, ViewListIcon, ChartBarIcon, ClipboardListIcon, LogoutIcon } from './icons';
import { logoBase64 } from '../assets/logo';

const Sidebar: React.FC = () => {
    const { isAdminOrSecretary, logout, user } = useAuth();

    const getLinkClasses = ({ isActive }: { isActive: boolean }) => {
        const baseClasses = "flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-200";
        const activeClasses = "bg-brand text-white";
        const inactiveClasses = "hover:bg-orange-100 dark:hover:bg-gray-700";
        return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
    };

    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="h-20 flex items-center justify-center px-4 border-b border-gray-200 dark:border-gray-700">
                <img src={logoBase64} alt="Company Logo" className="h-12" />
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                <NavLink to="/dashboard" className={getLinkClasses}>
                    <ChartBarIcon className="w-5 h-5 ml-3" />
                    <span>داشبورد</span>
                </NavLink>
                {isAdminOrSecretary && (
                    <>
                        <NavLink to="/contacts" className={getLinkClasses}>
                            <UsersIcon className="w-5 h-5 ml-3" />
                            <span>مدیریت مخاطبین</span>
                        </NavLink>
                        <NavLink to="/create-meeting" className={getLinkClasses}>
                            <DocumentAddIcon className="w-5 h-5 ml-3" />
                            <span>ایجاد صورتجلسه</span>
                        </NavLink>
                        <NavLink to="/all-minutes" className={getLinkClasses}>
                            <ViewListIcon className="w-5 h-5 ml-3" />
                            <span>تمام صورتجلسات</span>
                        </NavLink>
                    </>
                )}
                <NavLink to="/my-tasks" className={getLinkClasses}>
                    <ClipboardListIcon className="w-5 h-5 ml-3" />
                    <span>کارتابل من</span>
                </NavLink>
            </nav>
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                {user && (
                    <div className="mb-4 p-3 bg-orange-50 dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-gray-600">
                        <p className="font-semibold text-gray-800 dark:text-white">{`${user.firstName} ${user.lastName}`}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.role}</p>
                    </div>
                )}
                <button onClick={logout} className="w-full flex items-center justify-center px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                    <LogoutIcon className="w-5 h-5 ml-3" />
                    <span>خروج</span>
                </button>
            </div>
        </aside>
    );
};

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
