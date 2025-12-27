import React from 'react';

export function StatCard({ title, value, subValue, extra, icon, trendColor = "text-slate-400" }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl shrink-0 transition-colors">
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' }) : icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-slate-500 dark:text-slate-400 text-base font-bold mb-1.5">{title}</h3>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-slate-700 dark:text-slate-100 leading-tight truncate">{value}</span>
                            {subValue && <span className="text-slate-400 dark:text-slate-500 text-sm font-sans whitespace-nowrap font-medium">{subValue}</span>}
                        </div>
                        {extra && (
                            <div className={`text-sm font-bold ${trendColor} dark:opacity-90 font-sans mt-2 flex flex-col gap-0.5`}>
                                {extra}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
