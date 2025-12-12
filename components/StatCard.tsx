import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  colorClass: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon: Icon, colorClass }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
};