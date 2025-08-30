import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Contact, Gender, UserRole } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const ContactModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact | Omit<Contact, 'id'>) => void;
  contact: Contact | null;
}> = ({ isOpen, onClose, onSave, contact }) => {
  const [formData, setFormData] = useState<Contact | Omit<Contact, 'id'>>(
    contact || {
      firstName: '',
      lastName: '',
      phone: '',
      orgEmail: '',
      personalEmail: '',
      gender: Gender.Male,
      role: UserRole.Normal,
      position: '',
    }
  );

  React.useEffect(() => {
    setFormData(contact || {
        firstName: '',
        lastName: '',
        phone: '',
        orgEmail: '',
        personalEmail: '',
        gender: Gender.Male,
        role: UserRole.Normal,
        position: '',
      });
  }, [contact]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{contact ? 'ویرایش مخاطب' : 'افزودن مخاطب'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="نام" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="نام خانوادگی" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="شماره تلفن" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input type="email" name="orgEmail" value={formData.orgEmail} onChange={handleChange} placeholder="ایمیل سازمانی" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} placeholder="ایمیل غیر سازمانی" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="سمت سازمانی" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-reverse space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">انصراف</button>
            <button type="submit" className="px-4 py-2 bg-brand text-white rounded-md hover:bg-orange-600 transition">ذخیره</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Contacts: React.FC = () => {
  const { contacts, addContact, updateContact, deleteContact } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const handleAdd = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if(window.confirm('آیا از حذف این مخاطب اطمینان دارید؟')) {
      deleteContact(id);
    }
  };

  const handleSave = (contactData: Contact | Omit<Contact, 'id'>) => {
    if ('id' in contactData) {
      updateContact(contactData as Contact);
    } else {
      addContact(contactData);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">مدیریت مخاطبین</h1>
        <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-brand text-white rounded-lg shadow-md hover:bg-orange-600 transition">
          <PlusIcon className="w-5 h-5 ml-2" />
          افزودن مخاطب جدید
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">نام و نام خانوادگی</th>
              <th scope="col" className="px-6 py-3">ایمیل سازمانی</th>
              <th scope="col" className="px-6 py-3">سمت</th>
              <th scope="col" className="px-6 py-3">نوع کاربری</th>
              <th scope="col" className="px-6 py-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(contact => (
              <tr key={contact.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {contact.firstName} {contact.lastName}
                </td>
                <td className="px-6 py-4">{contact.orgEmail}</td>
                <td className="px-6 py-4">{contact.position}</td>
                <td className="px-6 py-4">{contact.role}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => handleEdit(contact)} className="text-gray-500 hover:text-brand ml-4 transition"><EditIcon /></button>
                  <button onClick={() => handleDelete(contact.id)} className="text-gray-500 hover:text-red-500 transition"><DeleteIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        contact={editingContact}
      />
    </div>
  );
};

export default Contacts;
