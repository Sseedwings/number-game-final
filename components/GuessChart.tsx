
import React from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from "recharts";

export default function GuessChart({ guesses, target, showTarget }: any) {
  const data = guesses.map((g: any, i: number) => ({ attempt: i + 1, value: g.value }));

  return (
    <div className="w-full h-48 opacity-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="attempt" stroke="#475569" tick={{fontSize: 10}} hide={data.length === 0} />
          <YAxis domain={[0, 100]} stroke="#475569" tick={{fontSize: 10}} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '12px' }}
            itemStyle={{ color: '#22d3ee' }}
          />
          {showTarget && <ReferenceLine y={target} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'DESTINY', fill: '#f43f5e', fontSize: 10 }} />}
          <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: '#22d3ee' }} animationDuration={1000} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
