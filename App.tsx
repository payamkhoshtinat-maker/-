import React, { ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import CreateMeeting from './pages/CreateMeeting';
import AllMinutes from './pages/AllMinutes';
import MyTasks from './pages/MyTasks';

const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, isAdminOrSecretary } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAdminOrSecretary) return <Navigate to="/my-tasks" replace />;
    return <>{children}</>;
};

const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    const { isAuthenticated, isAdminOrSecretary } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
                path="/" 
                element={
                    !isAuthenticated ? (
                        <Navigate to="/login" replace />
                    ) : isAdminOrSecretary ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <Navigate to="/my-tasks" replace />
                    )
                } 
            />

            <Route path="/dashboard" element={
                <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            } />
            <Route path="/contacts" element={
                <AdminRoute><Layout><Contacts /></Layout></AdminRoute>
            } />
            <Route path="/create-meeting" element={
                <AdminRoute><Layout><CreateMeeting /></Layout></AdminRoute>
            } />
            <Route path="/all-minutes" element={
                <AdminRoute><Layout><AllMinutes /></Layout></AdminRoute>
            } />
            
            <Route path="/my-tasks" element={
                <ProtectedRoute><Layout><MyTasks /></Layout></ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

const App: React.FC = () => {
    return (
        <DataProvider>
            <AuthProvider>
                <HashRouter>
                    <AppRoutes />
                </HashRouter>
            </AuthProvider>
        </DataProvider>
    );
};

export default App;