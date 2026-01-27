import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ScheduleTable } from './components/ScheduleTable';
import { BookingModal } from './components/BookingModal';
import { Dashboard } from './components/Dashboard';
import { Booking, Hall } from './types';
import { getDaysInMonth, formatToYYYYMMDD, formatDateDisplay } from './utils/dateUtils';
import { LocationIcon, PhoneIcon, EmailIcon, HomeIcon, PalmIcon, GemIcon, PrintIcon, ChartIcon, SaveIcon } from './components/icons';

// Function to generate dynamic initial bookings for the current month
const generateInitialBookings = (): Booking[] => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(today.getDate() + 2);

    return [
        {
            id: '1',
            hallId: Hall.AlWaha,
            date: formatToYYYYMMDD(today),
            time: '09:00',
            endTime: '11:00',
            department: 'قسم الموارد البشرية',
            notes: 'مقابلات توظيف'
        },
        {
            id: '2',
            hallId: Hall.AlWaha,
            date: formatToYYYYMMDD(tomorrow),
            time: '11:00',
            endTime: '12:00',
            department: 'قسم تكنولوجيا المعلومات',
            notes: 'اجتماع فريق الدعم'
        },
        {
            id: '3',
            hallId: Hall.AlDana,
            date: formatToYYYYMMDD(dayAfter),
            time: '14:00',
            endTime: '16:00',
            department: 'قسم التسويق',
            notes: 'ورشة عمل عن الحملات الإعلانية'
        }
    ];
};

const App: React.FC = () => {
    const [selectedHall, setSelectedHall] = useState<Hall>(Hall.AlWaha);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<'calendar' | 'dashboard'>('calendar');
    
    // Single source of truth for bookings, loaded from localStorage.
    const [bookings, setBookings] = useState<Booking[]>(() => {
        try {
            const savedBookings = localStorage.getItem('hallBookings');
            return savedBookings ? JSON.parse(savedBookings) : generateInitialBookings();
        } catch (error) {
            console.error("Could not load bookings from localStorage", error);
            return generateInitialBookings();
        }
    });

    // State to track if there are changes since the last manual save confirmation.
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // State for save button feedback
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Persist bookings to localStorage automatically whenever they change.
    useEffect(() => {
        try {
            localStorage.setItem('hallBookings', JSON.stringify(bookings));
        } catch (error) {
            console.error("Could not save bookings to localStorage", error);
        }
    }, [bookings]);


    const [modalInfo, setModalInfo] = useState<{
        isOpen: boolean;
        bookingToEdit?: Booking;
        date?: Date;
        time?: string;
    }>({ isOpen: false });

    const daysInMonth = useMemo(() => getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);

    const handleCellClick = (date: Date, time: string) => {
        setModalInfo({ isOpen: true, date, time });
    };

    const handleBookingClick = (bookingId: string) => {
        const bookingToEdit = bookings.find(b => b.id === bookingId);
        if (bookingToEdit) {
            setModalInfo({ isOpen: true, bookingToEdit });
        }
    };
    
    const handleCloseModal = () => {
        setModalInfo({ isOpen: false });
    };

    const handleSaveBooking = (bookingData: Omit<Booking, 'id' | 'hallId'>) => {
        const currentHall = modalInfo.bookingToEdit ? modalInfo.bookingToEdit.hallId : selectedHall;

        const hasConflict = bookings.some(b => {
            if (modalInfo.bookingToEdit && b.id === modalInfo.bookingToEdit.id) {
                return false; // Don't check against self when editing
            }
            if (b.hallId === currentHall && b.date === bookingData.date) {
                // Check for time overlap: (StartA < EndB) and (EndA > StartB)
                return bookingData.time < b.endTime && bookingData.endTime > b.time;
            }
            return false;
        });

        if (hasConflict) {
            throw new Error('يوجد تعارض في الحجز. الرجاء اختيار وقت آخر.');
        }

        if (modalInfo.bookingToEdit) {
            // Update booking
            setBookings(bookings.map(b => b.id === modalInfo.bookingToEdit!.id ? { ...modalInfo.bookingToEdit!, ...bookingData } : b));
        } else {
            // Create new booking
            const newBooking: Booking = {
                ...bookingData,
                id: new Date().toISOString(),
                hallId: selectedHall,
            };
            setBookings([...bookings, newBooking]);
        }
        setHasUnsavedChanges(true);
        handleCloseModal();
    };

    const handleDeleteBooking = () => {
        if (modalInfo.bookingToEdit) {
            // Delete booking
            setBookings(bookings.filter(b => b.id !== modalInfo.bookingToEdit!.id));
            setHasUnsavedChanges(true);
            handleCloseModal();
        }
    };
    
    // Manual save handler for user feedback
    const handleSaveChanges = () => {
        setSaveStatus('saving');
        // Data is already saved automatically by the useEffect hook.
        // This button just provides confirmation.
        setHasUnsavedChanges(false); // Reset the change tracker
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000); // Reset button text after 2 seconds
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = parseInt(e.target.value, 10);
        setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = parseInt(e.target.value, 10);
        setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
    };

    const halls = [
        { id: Hall.AlWaha, name: 'قاعة الواحة', icon: PalmIcon },
        { id: Hall.AlDana, name: 'قاعة الدانة', icon: GemIcon },
    ];

    const monthlyBookingCounts = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // getMonth() is 0-indexed
        const monthString = String(month).padStart(2, '0');
        const yearMonthPrefix = `${year}-${monthString}`;

        const counts: { [key in Hall]: number } = {
            [Hall.AlWaha]: 0,
            [Hall.AlDana]: 0,
        };

        for (const booking of bookings) { 
            if (booking.date.startsWith(yearMonthPrefix)) {
                counts[booking.hallId]++;
            }
        }
        return counts;
    }, [bookings, currentDate]);
    
    const totalMonthlyBookings = Object.values(monthlyBookingCounts).reduce((sum: number, count: number) => sum + count, 0);

    // Time slots in chronological order
    const timeSlots = ['07:30', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    const getModalInitialData = () => {
        if (modalInfo.bookingToEdit) {
            return {
                date: modalInfo.bookingToEdit.date,
                time: modalInfo.bookingToEdit.time,
                endTime: modalInfo.bookingToEdit.endTime,
                department: modalInfo.bookingToEdit.department,
                notes: modalInfo.bookingToEdit.notes,
            }
        }
        if (modalInfo.date && modalInfo.time) {
            const startTime = modalInfo.time;

            // Set default end time to the next available slot
            const startTimeIndex = timeSlots.indexOf(startTime);
            const defaultEndTime = startTimeIndex !== -1 && startTimeIndex + 1 < timeSlots.length
                ? timeSlots[startTimeIndex + 1]
                : '';

            return {
                date: formatToYYYYMMDD(modalInfo.date),
                time: modalInfo.time,
                endTime: defaultEndTime,
                department: '',
                notes: '',
            }
        }
        return null;
    }
    
    const modalInitialData = getModalInitialData();

    // Generate years dynamically from current year to current year + 25 (e.g. 2050 ish)
    const currentYearVal = new Date().getFullYear();
    const startYear = currentYearVal;
    const endYear = currentYearVal + 25;
    const yearsForSelect = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    
    const months = [
        { value: 0, name: 'يناير' },
        { value: 1, name: 'فبراير' },
        { value: 2, name: 'مارس' },
        { value: 3, name: 'أبريل' },
        { value: 4, name: 'مايو' },
        { value: 5, name: 'يونيو' },
        { value: 6, name: 'يوليو' },
        { value: 7, name: 'أغسطس' },
        { value: 8, name: 'سبتمبر' },
        { value: 9, name: 'أكتوبر' },
        { value: 10, name: 'نوفمبر' },
        { value: 11, name: 'ديسمبر' },
    ];

    const handlePrint = () => {
        window.print();
    };

    const handleExportToExcel = () => {
        const hallName = halls.find(h => h.id === selectedHall)?.name || '';
        const monthName = months.find(m => m.value === currentDate.getMonth())?.name || '';
        const year = currentDate.getFullYear();
        const title = `جدول حجوزات ${hallName} - ${monthName} ${year}`;
    
        const displayTimeSlots = timeSlots.slice(0, -1);
        
        const headerRow1 = [null, null, null, 'من / الى'];
        const headerRow2 = ['م', 'اليوم', 'التاريخ', ...displayTimeSlots, 'الملاحظات'];
        
        const sheetData: (string | number | null)[][] = [
            [title],
            [],
            headerRow1,
            headerRow2,
        ];
    
        const merges: XLSX.Range[] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow2.length - 1 } },
            { s: { r: 2, c: 3 }, e: { r: 2, c: 3 + displayTimeSlots.length - 1 } },
        ];
    
        const arabicDayNames: { [key: string]: string } = {
            'Saturday': 'السبت', 'Sunday': 'الاحد', 'Monday': 'الاثنين',
            'Tuesday': 'الثلاثاء', 'Wednesday': 'الاربعاء', 'Thursday': 'الخميس',
            'Friday': 'الجمعة',
        };
        const getArabicDayName = (date: Date) => {
            const dayName = date.toLocaleString('en-US', { weekday: 'long' });
            return arabicDayNames[dayName] || dayName;
        };
    
        const filteredBookings = bookings.filter(b => b.hallId === selectedHall);
        
        daysInMonth.forEach((day, index) => {
            const rowIndex = sheetData.length;
            const formattedDate = formatToYYYYMMDD(day);
            const dayBookings = filteredBookings.filter(b => b.date === formattedDate);
            const notes = dayBookings.map(b => b.notes).filter(Boolean).join('، ');
    
            const row: (string | number | null)[] = [
                index + 1,
                getArabicDayName(day),
                formatDateDisplay(day)
            ];
    
            for (let i = 0; i < displayTimeSlots.length; ) {
                const time = timeSlots[i];
                const booking = dayBookings.find(b => b.time === time);
    
                if (booking) {
                    const startTimeIndex = timeSlots.indexOf(booking.time);
                    const endTimeIndex = timeSlots.indexOf(booking.endTime);
                    const span = endTimeIndex > startTimeIndex ? endTimeIndex - startTimeIndex : 1;
                    
                    row.push(booking.department);
                    
                    if (span > 1) {
                        merges.push({
                            s: { r: rowIndex, c: 3 + i },
                            e: { r: rowIndex, c: 3 + i + span - 1 }
                        });
                    }
    
                    for (let j = 1; j < span; j++) {
                        row.push(null); 
                    }
                    i += span;
                } else {
                    row.push('');
                    i++;
                }
            }
            
            row.push(notes);
            sheetData.push(row);
        });
    
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!merges'] = merges;
        ws['!cols'] = [ {wch:5}, {wch:15}, {wch:15}, ...displayTimeSlots.map(() => ({wch: 15})), {wch: 40} ];
        
        const wb = XLSX.utils.book_new();
        wb.Workbook = {
            Views: [{ RTL: true }]
        };
        
        XLSX.utils.book_append_sheet(wb, ws, `حجوزات ${hallName}`);
        XLSX.writeFile(wb, `حجوزات_${hallName}_${year}_${monthName}.xlsx`);
    };


    return (
        <div className="p-4 md:p-8 min-h-screen">
            <header className="mb-6">
                <div className="bg-slate-900 py-4 px-6 rounded-lg shadow-lg relative border-b-4 border-[#eab308]">
                    <div className="absolute top-1/2 -translate-y-1/2 right-6 hidden md:flex print:hidden">
                        <a href="https://dashboard-rouge-rho-68.vercel.app/" className="flex items-center gap-2 px-4 py-2 text-white text-lg font-semibold rounded-lg bg-blue-800 shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all duration-200">
                            <HomeIcon className="w-6 h-6" />
                            <span>الصفحة الرئيسية</span>
                        </a>
                    </div>
                     <div className="absolute top-1/2 -translate-y-1/2 left-6 hidden md:flex print:hidden">
                        <a href="mailto:Logistic@saher.ae" className="flex items-center gap-2 px-4 py-2 text-white text-lg font-semibold rounded-lg bg-blue-800 shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all duration-200">
                            <EmailIcon className="w-6 h-6" />
                            <span>تواصل معنا</span>
                        </a>
                    </div>
                    <div className="text-center">
                        <p className="inline-block px-4 py-1 mb-3 border-2 border-[#12244d] text-yellow-400 rounded-full text-lg font-bold shadow-md">
                            إدارة الخدمات العامة / قسم إدارة المرافق
                        </p>
                        <h1 className="text-2xl md:text-4xl font-bold text-white">
                            نظام حجز قاعات الاجتماعات
                        </h1>
                        <p className="mt-2 text-xl text-blue-200">شركة ساهر للخدمات الذكية</p>
                    </div>
                </div>
            </header>
            
            <main>
                <div className="flex flex-wrap justify-start items-center mb-4 gap-4 print:hidden">
                    {halls.map(hall => {
                        const Icon = hall.icon;
                        const isActive = currentView === 'calendar' && selectedHall === hall.id;
                        return (
                            <button
                                key={hall.id}
                                onClick={() => {
                                    setSelectedHall(hall.id);
                                    setCurrentView('calendar');
                                }}
                                className={`group px-6 py-2 text-lg font-bold rounded-md border-2 transition-all duration-300 flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-blue-950 text-white border-blue-950 shadow-md'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{hall.name}</span>
                                <span className={`mr-1 px-2.5 py-0.5 text-sm rounded-full transition-colors font-bold ${
                                    isActive 
                                        ? 'bg-yellow-500 text-slate-900' 
                                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                }`}>
                                    {monthlyBookingCounts[hall.id]}
                                </span>
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`group px-6 py-2 text-lg font-bold rounded-md border-2 transition-all duration-300 flex items-center gap-2 ${
                            currentView === 'dashboard'
                                ? 'bg-blue-950 text-white border-blue-950 shadow-md'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <ChartIcon className="w-5 h-5" />
                        <span>لوحة المعلومات</span>
                        <span className={`mr-1 px-2.5 py-0.5 text-sm rounded-full transition-colors font-bold ${
                            currentView === 'dashboard' 
                                ? 'bg-yellow-500 text-slate-900' 
                                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                        }`}>
                            {totalMonthlyBookings}
                        </span>
                    </button>

                    <div className="flex-grow"></div>

                    {currentView === 'calendar' && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <label htmlFor="year-select" className="font-bold text-gray-700">السنة:</label>
                                <select
                                    id="year-select"
                                    value={currentDate.getFullYear()}
                                    onChange={handleYearChange}
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                    aria-label="Select year"
                                >
                                    {yearsForSelect.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="month-select" className="font-bold text-gray-700">الشهر:</label>
                                <select
                                    id="month-select"
                                    value={currentDate.getMonth()}
                                    onChange={handleMonthChange}
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                    aria-label="Select month"
                                >
                                    {months.map(month => (
                                        <option key={month.value} value={month.value}>{month.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleExportToExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-950 text-white font-bold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <span>تصدير إلى Excel</span>
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-950 text-white font-bold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <PrintIcon className="w-5 h-5" />
                                <span>طباعة</span>
                            </button>
                        </div>
                    )}
                </div>

                {currentView === 'calendar' ? (
                    <>
                        {/* Print Only Header */}
                        <div className="hidden print:block text-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-900">{halls.find(h => h.id === selectedHall)?.name}</h2>
                            <p className="text-xl text-gray-600">{months.find(m => m.value === currentDate.getMonth())?.name} {currentDate.getFullYear()}</p>
                        </div>

                        <div className="mb-4 p-4 bg-[#334155] rounded-lg shadow-lg text-center border-b-4 border-[#eab308]">
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
                                <ChartIcon className="w-6 h-6 text-white" />
                                <span>إجمالي الحجوزات للشهر المحدد</span>
                            </h3>
                            <div className="flex justify-center items-center gap-x-8 gap-y-2 flex-wrap">
                                {halls.map(hall => (
                                    <div key={hall.id} className="font-semibold text-white flex items-center gap-2">
                                        <span>{hall.name}: </span>
                                        <span className="bg-[#eab308] text-slate-900 px-2 py-0.5 rounded-md font-bold text-lg shadow-sm">{monthlyBookingCounts[hall.id]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="my-4 text-right print:hidden">
                            <button
                                onClick={handleSaveChanges}
                                disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                                className={`inline-flex items-center justify-center gap-2 px-8 py-3 text-lg font-bold rounded-md transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    !hasUnsavedChanges
                                        ? 'bg-[#152042] text-white opacity-50 cursor-not-allowed'
                                        : saveStatus === 'saved' 
                                        ? 'bg-teal-500 text-white focus:ring-teal-400'
                                        : 'bg-[#152042] text-white hover:bg-blue-900 focus:ring-blue-500'
                                }`}
                            >
                                <SaveIcon className="w-6 h-6" />
                                <span>
                                    {saveStatus === 'saved'
                                        ? 'تم الحفظ بنجاح!'
                                        : 'حفظ التغييرات'}
                                </span>
                            </button>
                        </div>

                        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                            <ScheduleTable
                                days={daysInMonth}
                                timeSlots={timeSlots}
                                bookings={bookings.filter(b => b.hallId === selectedHall)}
                                onCellClick={handleCellClick}
                                onBookingClick={handleBookingClick}
                            />
                        </div>
                    </>
                ) : (
                    <Dashboard bookings={bookings} halls={halls} />
                )}
            </main>

            <footer className="bg-slate-900 text-gray-200 mt-8 rounded-t-lg shadow-lg border-t-4 border-[#eab308] print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">

                        {/* Column 1: About SAHER */}
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold text-white mb-4 inline-block pb-1 border-b-2 border-yellow-400">عن SAHER</h3>
                            <p className="text-sm leading-relaxed">
                                شركة رائدة في تقديم الحلول والأنظمة الذكية، ملتزمون بالابتكار والجودة لتحقيق أعلى مستويات الكفاءة والخدمات الذكية.
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold text-white mb-4 inline-block pb-1 border-b-2 border-yellow-400">روابط سريعة</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#!" className="hover:text-white transition-colors">الرئيسية</a></li>
                                <li><a href="#!" className="hover:text-white transition-colors">خدماتنا</a></li>
                                <li><a href="#!" className="hover:text-white transition-colors">تواصل معنا</a></li>
                            </ul>
                        </div>

                        {/* Column 3: Contact Info */}
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold text-white mb-4 inline-block pb-1 border-b-2 border-yellow-400">تواصل معنا</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start">
                                    <LocationIcon className="w-5 h-5 mt-1 flex-shrink-0" />
                                    <span className="mr-3">Level 3, Baynona Building, Khalif City A</span>
                                </li>
                                <li className="flex items-center">
                                    <PhoneIcon className="w-5 h-5" />
                                    <span className="mr-3" dir="ltr">+971 4 123 4567</span>
                                </li>
                                <li className="flex items-center">
                                    <EmailIcon className="w-5 h-5" />
                                    <span className="mr-3">Logistic@saher.ae</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-gray-400 flex flex-col gap-2">
                        <p className="font-semibold text-white">إعداد وتصميم / خالد الجفري</p>
                        <p>جميع الحقوق محفوظة لشركة © {new Date().getFullYear()} SAHER FOR SMART SERVICES</p>
                    </div>
                </div>
            </footer>
            
            {modalInfo.isOpen && (
                <BookingModal
                    isOpen={modalInfo.isOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveBooking}
                    onDelete={handleDeleteBooking}
                    hallName={halls.find(h => h.id === selectedHall)?.name || ''}
                    timeSlots={timeSlots}
                    initialData={modalInitialData || { date: '', time: '' }}
                />
            )}
        </div>
    );
};

export default App;