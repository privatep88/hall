import React, { useMemo } from 'react';
import { Booking, Hall } from '../types';
import { ChartIcon, GemIcon } from './icons';

interface DashboardProps {
    bookings: Booking[];
    halls: { id: Hall; name: string; icon: any }[];
}

export const Dashboard: React.FC<DashboardProps> = ({ bookings, halls }) => {
    
    // 1. Calculate Statistics
    const stats = useMemo(() => {
        const totalBookings = bookings.length;
        
        // Group by Hall
        const byHall: Record<string, number> = {};
        halls.forEach(h => byHall[h.id] = 0);
        bookings.forEach(b => {
            byHall[b.hallId] = (byHall[b.hallId] || 0) + 1;
        });

        // Group by Department
        const byDept: Record<string, number> = {};
        bookings.forEach(b => {
            if (b.department) {
                const dept = b.department.trim();
                byDept[dept] = (byDept[dept] || 0) + 1;
            }
        });
        const topDepartments = Object.entries(byDept)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5

        // Group by Month (Current Year)
        const currentYear = new Date().getFullYear();
        const byMonth: Record<number, number> = {};
        // Initialize all months to 0
        for (let i = 0; i < 12; i++) byMonth[i] = 0;
        
        bookings.forEach(b => {
            const date = new Date(b.date);
            if (date.getFullYear() === currentYear) {
                byMonth[date.getMonth()] = (byMonth[date.getMonth()] || 0) + 1;
            }
        });

        return {
            totalBookings,
            byHall,
            topDepartments,
            byMonth,
            currentYear
        };
    }, [bookings, halls]);

    const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const maxMonthValue = Math.max(...(Object.values(stats.byMonth) as number[]), 1);

    // Helper to get color theme based on Hall ID
    const getHallTheme = (hallId: string) => {
        if (hallId === Hall.AlWaha) {
            return {
                border: 'border-emerald-500',
                text: 'text-emerald-700',
                bg: 'bg-emerald-50',
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
                gradient: 'from-emerald-500 to-teal-400',
                chartColor: 'text-emerald-500'
            };
        }
        if (hallId === Hall.AlDana) {
            return {
                border: 'border-violet-500',
                text: 'text-violet-700',
                bg: 'bg-violet-50',
                iconBg: 'bg-violet-100',
                iconColor: 'text-violet-600',
                gradient: 'from-violet-500 to-fuchsia-400',
                chartColor: 'text-violet-500'
            };
        }
        return {
            border: 'border-blue-500',
            text: 'text-blue-700',
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            gradient: 'from-blue-500 to-cyan-400',
            chartColor: 'text-blue-500'
        };
    };

    // Colors for top departments ranking
    const rankColors = [
        'from-yellow-400 to-yellow-600', // Gold
        'from-slate-300 to-slate-500',   // Silver
        'from-orange-300 to-orange-500', // Bronze
        'from-blue-400 to-blue-600',     // 4th
        'from-indigo-400 to-indigo-600'  // 5th
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-8">
            {/* Header Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Bookings Card */}
                <div className="bg-white rounded-2xl shadow-lg border-l-8 border-blue-600 p-6 flex items-center justify-between transition-transform hover:scale-105 hover:shadow-xl group">
                    <div>
                        <p className="text-gray-500 font-bold mb-2 text-sm uppercase tracking-wider">إجمالي الحجوزات</p>
                        <h3 className="text-5xl font-extrabold text-slate-800 group-hover:text-blue-700 transition-colors">{stats.totalBookings}</h3>
                        <p className="text-xs text-gray-400 mt-2 font-medium">حجز مسجل في النظام</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-5 rounded-2xl shadow-inner transform rotate-3 group-hover:rotate-6 transition-transform">
                        <ChartIcon className="w-10 h-10 text-blue-700" />
                    </div>
                </div>

                {/* Hall Cards */}
                {halls.map(hall => {
                    const theme = getHallTheme(hall.id);
                    return (
                        <div key={hall.id} className={`bg-white rounded-2xl shadow-lg border-l-8 ${theme.border} p-6 flex items-center justify-between transition-transform hover:scale-105 hover:shadow-xl group`}>
                            <div>
                                <p className="text-gray-500 font-bold mb-2 text-sm uppercase tracking-wider">{hall.name}</p>
                                <h3 className={`text-5xl font-extrabold text-slate-800 group-hover:${theme.text} transition-colors`}>{stats.byHall[hall.id]}</h3>
                                <p className="text-xs text-gray-400 mt-2 font-medium">حجز لهذه القاعة</p>
                            </div>
                            <div className={`${theme.iconBg} p-5 rounded-2xl shadow-inner transform -rotate-3 group-hover:-rotate-6 transition-transform`}>
                                <hall.icon className={`w-10 h-10 ${theme.iconColor}`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Activity Chart */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <span className="p-2 bg-blue-100 rounded-lg">
                                <ChartIcon className="w-6 h-6 text-blue-600" />
                            </span>
                            نشاط الحجوزات الشهري
                        </h3>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold shadow-sm">{stats.currentYear}</span>
                    </div>
                    
                    <div className="flex items-end justify-between h-64 gap-3 pt-4 border-b border-gray-100 pb-2">
                        {Object.entries(stats.byMonth).map(([monthIndex, countValue]) => {
                            const count = countValue as number;
                            const heightPercentage = (count / maxMonthValue) * 100;
                            // Dynamic gradient based on height intensity
                            const barGradient = count === 0 ? 'bg-gray-100' : 
                                                count > 5 ? 'bg-gradient-to-t from-blue-900 via-blue-600 to-cyan-400' : 
                                                'bg-gradient-to-t from-slate-700 to-slate-500';

                            return (
                                <div key={monthIndex} className="flex flex-col items-center flex-1 group h-full justify-end">
                                    <div className="relative w-full flex justify-center items-end h-[90%]">
                                        <div 
                                            style={{ height: `${heightPercentage}%` }} 
                                            className={`w-full max-w-[24px] md:max-w-[32px] rounded-t-lg transition-all duration-700 ease-out relative shadow-sm group-hover:shadow-md group-hover:brightness-110 ${barGradient}`}
                                        >
                                            {count > 0 && (
                                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600">
                                                    {count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] md:text-xs text-gray-500 mt-3 font-bold truncate w-full text-center group-hover:text-blue-600 transition-colors">
                                        {monthNames[parseInt(monthIndex)]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Departments */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                     <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <span className="p-2 bg-yellow-100 rounded-lg">
                                <GemIcon className="w-6 h-6 text-yellow-600" />
                            </span>
                            الإدارات الأكثر حجزاً
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {stats.topDepartments.length > 0 ? (
                            stats.topDepartments.map(([dept, count], index) => {
                                const percentage = (count / stats.totalBookings) * 100;
                                const colorClass = rankColors[index] || 'from-slate-400 to-slate-600';
                                
                                return (
                                    <div key={index} className="relative group">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold shadow-md bg-gradient-to-br ${colorClass}`}>
                                                    {index + 1}
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm md:text-base group-hover:text-blue-800 transition-colors">{dept}</span>
                                            </div>
                                            <span className="font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-0.5 rounded-full text-xs shadow-sm">{count} حجز</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
                                            <div 
                                                className={`h-4 rounded-full shadow-sm transition-all duration-1000 ease-out bg-gradient-to-r ${colorClass}`}
                                                style={{ width: `${percentage}%` }}
                                            >
                                                <div className="w-full h-full bg-white opacity-20 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <div className="bg-gray-50 p-6 rounded-full mb-4">
                                    <ChartIcon className="w-12 h-12 text-gray-300" />
                                </div>
                                <p>لا توجد بيانات كافية للإدارات حتى الآن</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Bookings Summary (Visual) */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-xl p-8 text-white overflow-hidden relative">
                {/* Decorative background blurs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <h3 className="text-2xl font-bold mb-8 relative z-10 flex items-center gap-2">
                    <span className="w-1 h-8 bg-yellow-400 rounded-full"></span>
                    نسبة إشغال القاعات
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {halls.map(hall => {
                        const count = stats.byHall[hall.id];
                        const percentage = stats.totalBookings > 0 ? Math.round((count / stats.totalBookings) * 100) : 0;
                        const theme = getHallTheme(hall.id);

                        return (
                             <div key={hall.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 flex items-center gap-6 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-slate-700"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        />
                                        <path
                                            className={`${theme.chartColor} drop-shadow-md`}
                                            strokeDasharray={`${percentage}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-xl font-bold text-white">{percentage}%</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-xl text-white mb-1 flex items-center gap-2">
                                        {hall.name}
                                        <hall.icon className={`w-5 h-5 ${theme.text} opacity-80`} />
                                    </h4>
                                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`} 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-2 font-mono">{count} حجز مسجل</p>
                                </div>
                             </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};