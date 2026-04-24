import React from 'react';

export function StatCard({ title, value, subValue, extra, icon, trendColor = "text-slate-400" }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="hidden md:flex p-2.5 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-xl shrink-0 transition-colors">
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5 md:w-6 md:h-6' }) : icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-bold mb-0.5 md:mb-1.5">{title}</h3>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5 md:gap-2">
                            <span className="text-lg md:text-xl font-black text-slate-700 dark:text-slate-100 leading-tight truncate">{value}</span>
                            {subValue && <span className="text-slate-400 dark:text-slate-500 text-[10px] md:text-sm font-sans whitespace-nowrap font-medium">{subValue}</span>}
                        </div>
                        {extra && (
                            <div className={`text-[11px] md:text-sm font-bold ${trendColor} dark:opacity-90 font-sans mt-1.5 md:mt-2 flex flex-col gap-0.5`}>
                                {extra}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
