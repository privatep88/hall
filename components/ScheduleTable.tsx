import React from 'react';
import { Booking } from '../types';
import { formatDateDisplay, formatToYYYYMMDD } from '../utils/dateUtils';

interface ScheduleTableProps {
    days: Date[];
    timeSlots: string[];
    bookings: Booking[];
    onCellClick: (date: Date, time: string) => void;
    onBookingClick: (bookingId: string) => void;
}

const EmptyCell: React.FC<{ date: Date; time: string; onClick: () => void; isWeekend?: boolean }> = ({ date, time, onClick, isWeekend }) => {
    const formattedDate = formatToYYYYMMDD(date);
    // Darker hover for weekend to be visible against lighter background
    const hoverClass = isWeekend ? 'hover:bg-blue-200' : 'hover:bg-blue-100';
    
    return (
        <td
            className={`relative group border border-gray-200 h-12 ${hoverClass} cursor-pointer transition-colors`}
            onClick={onClick}
        >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 bg-gray-900 text-gray-200 text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                {`${formattedDate} - ${time}`}
            </div>
        </td>
    );
};

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ days, timeSlots, bookings, onCellClick, onBookingClick }) => {
    
    const bookingColors = [
        { bg: 'bg-blue-200', hover: 'hover:bg-blue-300', text: 'text-blue-800' },
        { bg: 'bg-teal-200', hover: 'hover:bg-teal-300', text: 'text-teal-800' },
        { bg: 'bg-green-200', hover: 'hover:bg-green-300', text: 'text-green-800' },
        { bg: 'bg-indigo-200', hover: 'hover:bg-indigo-300', text: 'text-indigo-800' },
        { bg: 'bg-purple-200', hover: 'hover:bg-purple-300', text: 'text-purple-800' },
        { bg: 'bg-pink-200', hover: 'hover:bg-pink-300', text: 'text-pink-800' },
        { bg: 'bg-sky-200', hover: 'hover:bg-sky-300', text: 'text-sky-800' },
        { bg: 'bg-cyan-200', hover: 'hover:bg-cyan-300', text: 'text-cyan-800' },
        { bg: 'bg-emerald-200', hover: 'hover:bg-emerald-300', text: 'text-emerald-800' },
        { bg: 'bg-rose-200', hover: 'hover:bg-rose-300', text: 'text-rose-800' },
    ];

    const bookingColorMap = React.useRef(new Map<string, typeof bookingColors[0]>());
    const lastColorIndex = React.useRef(-1);

    const getBookingColor = (bookingId: string) => {
        if (!bookingColorMap.current.has(bookingId)) {
            lastColorIndex.current = (lastColorIndex.current + 1) % bookingColors.length;
            bookingColorMap.current.set(bookingId, bookingColors[lastColorIndex.current]);
        }
        return bookingColorMap.current.get(bookingId)!;
    };
    
    const arabicDayNames: { [key: string]: string } = {
        'Saturday': 'السبت',
        'Sunday': 'الاحد',
        'Monday': 'الاثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الاربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
    };

    const getArabicDayName = (date: Date) => {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return arabicDayNames[dayName] || dayName;
    };

    const displayTimeSlots = timeSlots.slice(0, -1);

    const bookingsByDate = React.useMemo(() => {
        return bookings.reduce((acc, booking) => {
            (acc[booking.date] = acc[booking.date] || []).push(booking);
            return acc;
        }, {} as Record<string, Booking[]>);
    }, [bookings]);

    return (
        <table className="min-w-full border-collapse text-center">
            <thead className="bg-slate-900 text-sm font-bold text-white sticky top-0 z-10">
                <tr>
                    <th colSpan={3} className="py-2 border border-slate-700 bg-slate-900"></th>
                    <th colSpan={displayTimeSlots.length + 1} className="py-2 border border-slate-700 bg-slate-900">
                        من / الى
                    </th>
                </tr>
                <tr>
                    <th className="py-3 px-2 border border-slate-700 w-12 bg-slate-900 text-white">م</th>
                    <th className="py-3 px-2 border border-slate-700 w-28 bg-slate-900 text-white">اليوم</th>
                    <th className="py-3 px-2 border border-slate-700 w-32 bg-slate-900 text-white">التاريخ</th>
                    {displayTimeSlots.map(time => (
                        <th key={time} className="py-3 px-2 border border-slate-700 w-24 bg-slate-900">{time}</th>
                    ))}
                    <th className="py-3 px-2 border border-slate-700 w-48 bg-slate-900">الملاحظات</th>
                </tr>
            </thead>
            <tbody>
                {days.map((day, index) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6; // Sunday or Saturday
                    
                    // Fixed column style logic
                    // If weekend: Dark blue background (#152042), white text, slate border
                    // If weekday: Dark slate background, white text, slate border (default)
                    const fixedColStyle = isWeekend 
                        ? "bg-[#152042] text-white border-slate-600"
                        : "bg-[#334155] text-white border-slate-600";
                    
                    const fixedColumnClass = `border ${fixedColStyle} font-bold align-middle`;
                    const fixedColumnDateClass = `border ${fixedColStyle} font-mono font-bold align-middle`;

                    const formattedDate = formatToYYYYMMDD(day);
                    const allDayBookings = bookingsByDate[formattedDate] || [];
                    const notes = allDayBookings.map(b => b.notes).filter(Boolean).join('، ');

                    // Row background for the rest of the cells
                    // Use a much lighter blue #eff6ff (blue-50) for easier reading
                    const rowBgClass = isWeekend ? 'bg-[#eff6ff]' : 'bg-white';
                    const notesClass = 'text-gray-600 border-gray-200';

                    return (
                        <tr key={day.toISOString()} className={`text-sm ${rowBgClass}`}>
                            <td className={fixedColumnClass}>{index + 1}</td>
                            <td className={fixedColumnClass}>{getArabicDayName(day)}</td>
                            <td className={fixedColumnDateClass}>{formatDateDisplay(day)}</td>
                            {(() => {
                                const cells = [];
                                for (let i = 0; i < displayTimeSlots.length; ) {
                                    const time = timeSlots[i];
                                    const booking = allDayBookings.find(b => b.time === time);

                                    if (booking) {
                                        const startTimeIndex = i;
                                        const endTimeIndex = timeSlots.indexOf(booking.endTime);
                                        const color = getBookingColor(booking.id);
                                        
                                        if (endTimeIndex > startTimeIndex) {
                                            const span = endTimeIndex - startTimeIndex;
                                            cells.push(
                                                <td
                                                    key={booking.id}
                                                    colSpan={span}
                                                    className={`border border-gray-200 p-1 ${color.bg} ${color.hover} cursor-pointer transition-colors text-center align-middle`}
                                                    onClick={() => onBookingClick(booking.id)}
                                                >
                                                    <div className={`font-semibold ${color.text}`}>{booking.department}</div>
                                                </td>
                                            );
                                            i += span;
                                        } else {
                                            cells.push(<EmptyCell key={time} date={day} time={time} onClick={() => onCellClick(day, time)} isWeekend={isWeekend} />);
                                            i++;
                                        }
                                    } else {
                                        cells.push(<EmptyCell key={time} date={day} time={time} onClick={() => onCellClick(day, time)} isWeekend={isWeekend} />);
                                        i++;
                                    }
                                }
                                return cells;
                            })()}
                            <td className={`border p-1 align-middle ${notesClass}`}>{notes}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};