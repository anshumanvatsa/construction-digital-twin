import { useSim } from '@/contexts/SimulationContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function RiskChart() {
  const { state } = useSim();
  const data = state.riskHistory.slice(-60).map((d, i) => ({
    time: i,
    avg: Math.round(d.avgRisk),
    max: Math.round(d.maxRisk),
  }));

  return (
    <div className="glass rounded-xl p-4 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-3">Risk Trend</h3>
      <div style={{ height: 'calc(100% - 32px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="riskAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 80%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(168, 80%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="riskMax" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 15%, 14%)" />
            <XAxis dataKey="time" stroke="hsl(215, 15%, 30%)" tick={{ fontSize: 10 }} />
            <YAxis stroke="hsl(215, 15%, 30%)" tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(225, 20%, 9%)',
                border: '1px solid hsl(225, 15%, 16%)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Area type="monotone" dataKey="avg" stroke="hsl(168, 80%, 50%)" fill="url(#riskAvg)" strokeWidth={2} name="Avg Risk" />
            <Area type="monotone" dataKey="max" stroke="hsl(0, 72%, 55%)" fill="url(#riskMax)" strokeWidth={1.5} name="Max Risk" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
