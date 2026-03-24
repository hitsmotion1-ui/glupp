"use client";

import { useAdminDailyStats } from "@/lib/hooks/useAdmin";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

// Tooltip customisé respectant ton design
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1E1B16] border border-[#3A3530] p-3 rounded-lg shadow-xl">
        <p className="text-[#F5E6D3] font-bold mb-2 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#F5E6D3]/80">{entry.name}:</span>
            <span className="text-[#F5E6D3] font-mono">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminActivityChart() {
  const { data, isLoading } = useAdminDailyStats();

  if (isLoading) {
    // Skeleton animé de 280px de haut
    return <div className="w-full h-[280px] animate-pulse bg-[#3A3530]/40 rounded-xl" />;
  }

  // Formatage des dates pour l'axe X (ex: "12 Mar")
  const formattedData = data?.map((row: any) => ({
    ...row,
    displayDate: new Date(row.day).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }));

  return (
    <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-6">
      <h2 className="text-xl font-semibold text-[#F7F3EE] mb-6">Activité des 30 derniers jours</h2>
      
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            {/* Grille subtile */}
            <CartesianGrid strokeDasharray="3 3" stroke="#3A3530" vertical={false} />
            
            {/* Axes */}
            <XAxis 
              dataKey="displayDate" 
              stroke="#6B6050" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#6B6050" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => Math.round(val).toString()}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

            {/* Courbes superposées */}
            <Area 
              type="monotone" 
              dataKey="new_users" 
              name="Nouveaux Users" 
              stroke="#4ECDC4" 
              fill="#4ECDC4" 
              fillOpacity={0.1} 
              strokeWidth={2} 
            />
            <Area 
              type="monotone" 
              dataKey="glupps" 
              name="Glupps" 
              stroke="#E08840" 
              fill="#E08840" 
              fillOpacity={0.1} 
              strokeWidth={2} 
            />
            <Area 
              type="monotone" 
              dataKey="duels" 
              name="Duels" 
              stroke="#A78BFA" 
              fill="#A78BFA" 
              fillOpacity={0.1} 
              strokeWidth={2} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}