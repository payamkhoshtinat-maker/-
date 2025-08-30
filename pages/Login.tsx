import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { logoBase64 } from '../assets/logo';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('123456'); // Default password
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const loggedInUser = login(email, password);
        if (loggedInUser) {
            if (loggedInUser.role === UserRole.Admin || loggedInUser.role === UserRole.Secretary) {
                navigate('/dashboard');
            } else {
                navigate('/my-tasks');
            }
        } else {
            setError('ایمیل یا رمز عبور نامعتبر است.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <img className="mx-auto h-24 w-auto" src={logoBase64} alt="Company Logo" />
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        ورود به سامانه
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">آدرس ایمیل</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-brand focus:border-brand focus:z-10 sm:text-sm text-right"
                                placeholder="آدرس ایمیل سازمانی"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                         <div>
                            <label htmlFor="password" className="sr-only">رمز عبور</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-brand focus:border-brand focus:z-10 sm:text-sm text-center"
                                placeholder="رمز عبور"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200">
                            ورود
                        </button>
                    </div>
                </form>
                 <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    این اپلیکیشن نمونه خارجی ندارد و از طراحی تا اجرا توسط پیام خوش طینت انجام شده است.
                </p>
            </div>
        </div>
    );
};

export default Login;
