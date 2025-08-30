import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
// Fix: Import TaskStatus to resolve 'Cannot find name 'TaskStatus'' error.
import { Contact, Meeting, Task, TaskStatus } from '../types';
import { mockContacts, mockMeetings, mockTasks } from '../services/mockData';

interface DataContextType {
  contacts: Contact[];
  meetings: Meeting[];
  tasks: Task[];
  addContact: (contact: Omit<Contact, 'id' | 'password'>) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (id: number) => void;
  addMeetingAndTasks: (meeting: Omit<Meeting, 'id' | 'meetingNumber'>, tasks: Omit<Task, 'id' | 'meetingId'>[]) => void;
  updateTask: (taskId: number, updates: Partial<Task>) => void;
  getContactById: (id: number) => Contact | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // If the stored item is null or undefined (e.g., first visit), use the initial value.
      if (item == null) return initialValue;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', mockContacts);
  const [meetings, setMeetings] = useLocalStorage<Meeting[]>('meetings', mockMeetings);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', mockTasks);

  const addContact = (contact: Omit<Contact, 'id' | 'password'>) => {
    const newContact: Contact = {
        ...contact,
        id: Date.now(),
        password: '123456', // Default password for new users
    }
    setContacts(prev => [...prev, newContact]);
  };

  const updateContact = (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => (c.id === updatedContact.id ? updatedContact : c)));
  };

  const deleteContact = (id: number) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const addMeetingAndTasks = (meeting: Omit<Meeting, 'id' | 'meetingNumber'>, newTasks: Omit<Task, 'id' | 'meetingId'>[]) => {
    const newMeetingId = Date.now();
    const meetingDateForNumber = meeting.date.replace(/\//g, ''); // 1403/05/10 -> 14030510
    
    const newMeeting: Meeting = { 
        ...meeting, 
        id: newMeetingId,
        meetingNumber: `${meetingDateForNumber}-${newMeetingId}`
    };
    
    const tasksWithIds = newTasks.map((task, index) => ({
        ...task,
        id: Date.now() + index, // Ensure unique IDs
        meetingId: newMeetingId,
        status: TaskStatus.NotDone, // Default status
    }));

    setMeetings(prev => [...prev, newMeeting]);
    setTasks(prev => [...prev, ...tasksWithIds]);
  };
  
  const updateTask = (taskId: number, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const getContactById = (id: number) => contacts.find(c => c.id === id);

  return (
    <DataContext.Provider value={{ contacts, meetings, tasks, addContact, updateContact, deleteContact, addMeetingAndTasks, updateTask, getContactById }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};