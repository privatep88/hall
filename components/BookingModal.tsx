
import React, { useState, useEffect, useRef } from 'react';
import { Booking } from '../types';
import { CloseIcon } from './icons';
import { formatDateDisplay } from '../utils/dateUtils';


interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (bookingData: Omit<Booking, 'id' | 'hallId'>) => void;
    onDelete?: () => void;
    hallName: string;
    timeSlots: string[];
    initialData: {
        date: string;
        time: string;
        endTime?: string;
        department?: string;
        notes?: string;
    };
}

const parseDateString = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    // new Date(year, monthIndex, day)
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, onDelete, hallName, initialData, timeSlots }) => {
    const [department, setDepartment] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const departmentInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Autofocus on the department input when the modal opens
            setTimeout(() => {
                departmentInputRef.current?.focus();
            }, 100);
        }
        // Reset state when modal opens or initial data changes
        setDepartment(initialData.department || '');
        setNotes(initialData.notes || '');
        setEndTime(initialData.endTime || '');
        setError('');
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        try {
            setError(''); // Clear previous error
            if (!department.trim()) {
                throw new Error('يرجى إدخال اسم الإدارة الطالبة.');
            }
            if (!endTime) {
                throw new Error('يرجى تحديد وقت انتهاء الحجز.');
            }
            if (endTime <= initialData.time) {
                throw new Error('وقت الانتهاء يجب أن يكون بعد وقت البدء.');
            }
            
            onSave({
                date: initialData.date,
                time: initialData.time,
                endTime,
                department,
                notes,
            });
        } catch (e: any) {
            setError(e.message || 'حدث خطأ غير متوقع.');
        }
    };
    
    const startTimeIndex = timeSlots.indexOf(initialData.time);
    const availableEndTimes = startTimeIndex !== -1 ? timeSlots.slice(startTimeIndex + 1) : [];

    const displayDate = formatDateDisplay(parseDateString(initialData.date));

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg relative transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
                    <CloseIcon />
                </button>
                
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {initialData.department ? 'تعديل الحجز' : 'حجز جديد'}
                    </h2>
                    <p className="text-lg text-gray-600 mt-1">{hallName}</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <div className="space-y-4 text-right">
                     <div className="grid grid-cols-2 gap-4 text-gray-700">
                        <p><span className="font-bold">التاريخ:</span> {displayDate}</p>
                        <p><span className="font-bold">وقت البدء:</span> {initialData.time}</p>
                    </div>

                    <div>
                        <label htmlFor="department" className="block text-sm font-bold text-gray-700 mb-1">
                            الإدارة الطالبة
                        </label>
                        <input
                            ref={departmentInputRef}
                            id="department"
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                            placeholder="اسم الإدارة"
                        />
                    </div>

                    <div>
                        <label htmlFor="endTime" className="block text-sm font-bold text-gray-700 mb-1">
                            وقت الإنتهاء
                        </label>
                        <select
                            id="endTime"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            aria-label="Select end time"
                        >
                            <option value="" disabled>اختر وقت الإنتهاء</option>
                            {availableEndTimes.map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="notes" className="block text-sm font-bold text-gray-700 mb-1">
                            الملاحظات
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                            placeholder="أضف ملاحظات (اختياري)"
                        ></textarea>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-between items-center">
                    <div>
                         {onDelete && (
                            <button
                                onClick={onDelete}
                                className="px-6 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                حذف الحجز
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            حفظ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};