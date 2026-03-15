import { useState } from 'react';
import type { ReactNode } from 'react';
import { usePooling } from '../hooks/usePooling';
import { Alert, Button, Select } from './shared';

const SHIP_IDS = ['R001', 'R002', 'R003', 'R004', 'R005'];

function formatCB(val: number) {
  return (val >= 0 ? '+' : '') + val.toLocaleString('en', { maximumFractionDigits: 0 });
}

export function PoolingTab() {
  const [selectedShip, setSelectedShip] = useState('R001');
  const [year, setYear] = useState('2024');

  const {
    members, pool, loading, error, success,
    poolSum, isValid,
    addMember, removeMember, loadMemberCB, createPool,
  } = usePooling();

  const handleAdd = async () => {
    addMember(selectedShip);
    await loadMemberCB(selectedShip, Number(year));
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
        <h3 className="text-white font-semibold">Article 21 — Pooling</h3>
        <p className="text-slate-400 text-sm mt-1">
          Group ships into a pool to collectively meet FuelEU compliance. Surplus from
          one ship offsets deficit in another (∑CB ≥ 0 required).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Select label="Add Ship" value={selectedShip} onChange={e => setSelectedShip(e.target.value)}>
            {SHIP_IDS.filter(id => !members.find(m => m.shipId === id)).map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </Select>
          <Select label="Year" value={year} onChange={e => setYear(e.target.value)}>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </Select>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={loading} className="w-full">
              + Add to Pool
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert message={error} />}
      {success && <Alert message={success} variant="success" />}

      {/* Members Table */}
      {members.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {/* Pool Sum Indicator */}
          <div className={`flex items-center justify-between rounded-xl border px-5 py-3 ${poolSum >= 0 ? 'bg-emerald-900/20 border-emerald-700/40' : 'bg-red-900/20 border-red-700/40'}`}>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Pool Sum (∑CB)</p>
              <p className={`font-mono text-2xl font-bold mt-0.5 ${poolSum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCB(poolSum)} <span className="text-sm font-normal text-slate-400">gCO₂e</span>
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${isValid ? 'text-emerald-300' : 'text-red-300'}`}>
                {isValid ? '✓ Valid Pool' : members.length < 2 ? '⚠ Min. 2 members' : '✗ Negative Sum'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Art. 21 requires ∑CB ≥ 0</p>
            </div>
          </div>

          {/* Member cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m.shipId} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 relative">
                <button
                  onClick={() => removeMember(m.shipId)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-red-400 text-lg transition-colors"
                  aria-label="Remove member"
                >×</button>
                <p className="font-mono text-ocean-300 font-bold text-lg">{m.shipId}</p>
                {m.loading ? (
                  <p className="text-xs text-slate-400 mt-2 animate-pulse">Loading CB…</p>
                ) : m.cb ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">CB (raw)</span>
                      <span className={`font-mono font-medium ${m.cb.cbGco2eq >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCB(m.cb.cbGco2eq)}
                      </span>
                    </div>
                    {m.cb.bankedSurplus !== undefined && m.cb.bankedSurplus > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Banked surplus</span>
                        <span className="font-mono text-ocean-300">+{m.cb.bankedSurplus.toLocaleString('en', { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t border-slate-700/40 pt-1.5 mt-1.5">
                      <span className="text-slate-300 font-medium">Adjusted CB</span>
                      <span className={`font-mono font-bold ${(m.cb.adjustedCB ?? m.cb.cbGco2eq) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatCB(m.cb.adjustedCB ?? m.cb.cbGco2eq)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Badge variant={m.cb.cbGco2eq >= 0 ? 'green' : 'red'}>
                        {m.cb.cbGco2eq >= 0 ? 'Surplus' : 'Deficit'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">CB not available</p>
                )}
              </div>
            ))}
          </div>

          {/* Create Pool */}
          <div className="flex justify-end">
            <Button
              onClick={() => createPool(Number(year))}
              disabled={!isValid || loading}
              className="px-8"
            >
              {loading ? 'Creating Pool…' : 'Create Pool'}
            </Button>
          </div>

          {/* Pool Result */}
          {pool && (
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-5 animate-fade-in">
              <p className="text-emerald-300 font-semibold mb-1">Pool Created ✓</p>
              <p className="text-slate-400 text-xs mb-4">
                ID: <span className="font-mono text-slate-200">{pool.id}</span> · Year {pool.year}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-slate-400 pb-2 pr-4">Ship</th>
                      <th className="text-right text-xs text-slate-400 pb-2 pr-4">CB Before</th>
                      <th className="text-right text-xs text-slate-400 pb-2 pr-4">CB After</th>
                      <th className="text-right text-xs text-slate-400 pb-2">Transfer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pool.members.map((m) => (
                      <tr key={m.shipId} className="border-t border-slate-700/30">
                        <td className="font-mono text-ocean-300 py-2 pr-4">{m.shipId}</td>
                        <td className={`text-right font-mono py-2 pr-4 ${m.cbBefore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCB(m.cbBefore)}
                        </td>
                        <td className={`text-right font-mono py-2 pr-4 ${m.cbAfter >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCB(m.cbAfter)}
                        </td>
                        <td className={`text-right font-mono py-2 ${(m.cbAfter - m.cbBefore) >= 0 ? 'text-emerald-300' : 'text-orange-300'}`}>
                          {formatCB(m.cbAfter - m.cbBefore)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {members.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500">
          <p>Add ships to the pool using the selector above.</p>
          <p className="text-xs mt-1">Minimum 2 members required. Pool sum must be ≥ 0.</p>
        </div>
      )}
    </div>
  );
}

function Badge({ children, variant = 'gray' }: { children: ReactNode; variant?: 'green' | 'red' | 'gray' }) {
  const cls = {
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    gray: 'bg-slate-600/30 text-slate-300 border-slate-500/30',
  }[variant];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {children}
    </span>
  );
}
