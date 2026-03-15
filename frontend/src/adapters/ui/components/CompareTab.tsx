import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts';
import { useComparison } from '../hooks/useComparison';
import { Badge, Spinner, Alert, Table, Th, Td } from './shared';

const TARGET = 89.3368;

export function CompareTab() {
  const { results, loading, error } = useComparison();

  if (loading) return <Spinner />;
  if (error) return <Alert message={error} />;
  if (results.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg">No baseline set.</p>
        <p className="text-sm mt-1">Go to the Routes tab and click "Set Baseline" on a route.</p>
      </div>
    );
  }

  const { baseline } = results[0];

  // Chart data: baseline + comparisons
  const chartData = [
    { name: `${baseline.routeId} (Baseline)`, ghg: baseline.ghgIntensity, isBaseline: true },
    ...results.map(r => ({
      name: r.comparison.routeId,
      ghg: r.comparison.ghgIntensity,
      isBaseline: false,
      compliant: r.compliant,
    })),
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Baseline Info */}
      <div className="bg-ocean-900/30 border border-ocean-700/40 rounded-xl p-4">
        <p className="text-xs text-ocean-300 uppercase tracking-widest mb-1">Baseline Route</p>
        <div className="flex flex-wrap gap-4 mt-2">
          <span className="font-mono text-white font-bold text-lg">{baseline.routeId}</span>
          <Badge variant="blue">{baseline.vesselType}</Badge>
          <Badge variant="blue">{baseline.fuelType}</Badge>
          <span className="font-mono text-ocean-300">{baseline.ghgIntensity} gCO₂e/MJ</span>
          <span className="font-mono text-ocean-300">{baseline.year}</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          FuelEU 2025 target: <span className="text-slate-300 font-mono">{TARGET} gCO₂e/MJ</span>
        </p>
      </div>

      {/* Chart */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
        <p className="text-sm font-medium text-slate-300 mb-4">GHG Intensity Comparison (gCO₂e/MJ)</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis domain={[85, 96]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(v: number) => [`${v.toFixed(2)} gCO₂e/MJ`, 'GHG Intensity']}
            />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <ReferenceLine
              y={TARGET}
              stroke="#f59e0b"
              strokeDasharray="6 3"
              label={{ value: `Target ${TARGET}`, fill: '#f59e0b', fontSize: 11, position: 'insideTopRight' }}
            />
            <Bar dataKey="ghg" name="GHG Intensity" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isBaseline ? '#0ea5e9' : entry.compliant ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-ocean-500 inline-block" /> Baseline</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Compliant</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Non-Compliant</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 bg-amber-400 inline-block" /> Target Line</span>
        </div>
      </div>

      {/* Table */}
      <Table>
        <thead>
          <tr>
            <Th>Route</Th>
            <Th>Vessel</Th>
            <Th>Fuel</Th>
            <Th>Year</Th>
            <Th>GHG (baseline)</Th>
            <Th>GHG (comparison)</Th>
            <Th>% Diff</Th>
            <Th>Compliant</Th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.comparison.id} className="hover:bg-slate-700/20 transition-colors">
              <Td><span className="font-mono text-ocean-300">{r.comparison.routeId}</span></Td>
              <Td>{r.comparison.vesselType}</Td>
              <Td><Badge variant={r.comparison.fuelType === 'LNG' ? 'green' : r.comparison.fuelType === 'HFO' ? 'red' : 'gray'}>{r.comparison.fuelType}</Badge></Td>
              <Td className="font-mono">{r.comparison.year}</Td>
              <Td><span className="font-mono text-slate-300">{r.baseline.ghgIntensity.toFixed(2)}</span></Td>
              <Td>
                <span className={`font-mono font-medium ${r.compliant ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.comparison.ghgIntensity.toFixed(2)}
                </span>
              </Td>
              <Td>
                <span className={`font-mono text-sm ${r.percentDiff < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.percentDiff > 0 ? '+' : ''}{r.percentDiff.toFixed(2)}%
                </span>
              </Td>
              <Td>
                <span className="text-lg">{r.compliant ? '✅' : '❌'}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
