import { useState } from 'react';
import { useBanking } from '../hooks/useBanking';
import { KpiCard, Spinner, Alert, Button, Select, Input } from './shared';

const SHIP_IDS = ['R001', 'R002', 'R003', 'R004', 'R005'];

export function BankingTab() {
  const [shipId, setShipId] = useState('R002');
  const [year, setYear] = useState('2024');
  const [applyAmount, setApplyAmount] = useState('');

  const { cb, applyResult, loading, error, success, fetchCB, bankSurplus, applyBanked } = useBanking();

  const isSurplus = cb && cb.cbGco2eq > 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-white font-semibold text-base">Article 20 — Banking</h3>
            <p className="text-slate-400 text-sm mt-0.5">
              Bank surplus Compliance Balance (CB) for future use against deficits.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Select label="Ship / Route" value={shipId} onChange={e => setShipId(e.target.value)}>
            {SHIP_IDS.map(id => <option key={id} value={id}>{id}</option>)}
          </Select>
          <Select label="Year" value={year} onChange={e => setYear(e.target.value)}>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </Select>
          <div className="flex items-end">
            <Button onClick={() => fetchCB(shipId, Number(year))} disabled={loading} className="w-full">
              {loading ? 'Computing…' : 'Load CB'}
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert message={error} />}
      {success && <Alert message={success} variant="success" />}

      {/* KPIs */}
      {cb && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Current CB"
              value={cb.cbGco2eq.toLocaleString('en', { maximumFractionDigits: 0 })}
              sub="gCO₂e"
              positive={cb.cbGco2eq > 0}
            />
            <KpiCard
              label="Ship"
              value={cb.shipId}
              sub={`Year ${cb.year}`}
            />
            <KpiCard
              label="Status"
              value={cb.cbGco2eq > 0 ? '↑ Surplus' : cb.cbGco2eq < 0 ? '↓ Deficit' : '— Break-even'}
              positive={cb.cbGco2eq > 0 ? true : cb.cbGco2eq < 0 ? false : undefined}
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bank action */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
              <h4 className="text-white text-sm font-semibold mb-1">Bank Surplus</h4>
              <p className="text-slate-400 text-xs mb-4">
                Transfer this route's surplus CB to the banking register for future use.
              </p>
              <Button
                onClick={() => bankSurplus(shipId, Number(year))}
                disabled={!isSurplus || loading}
                className="w-full"
              >
                {loading ? 'Processing…' : `Bank ${cb.cbGco2eq > 0 ? cb.cbGco2eq.toLocaleString('en', { maximumFractionDigits: 0 }) : '—'} gCO₂e`}
              </Button>
              {!isSurplus && (
                <p className="text-xs text-red-400 mt-2">Cannot bank: CB is not positive.</p>
              )}
            </div>

            {/* Apply action */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
              <h4 className="text-white text-sm font-semibold mb-1">Apply Banked Surplus</h4>
              <p className="text-slate-400 text-xs mb-4">
                Apply previously banked surplus to cover a deficit on this ship.
              </p>
              <div className="flex gap-2">
                <Input
                  label=""
                  type="number"
                  placeholder="Amount (gCO₂e)"
                  value={applyAmount}
                  onChange={e => setApplyAmount(e.target.value)}
                  className="flex-1"
                />
                <div className="flex items-end">
                  <Button
                    onClick={() => applyBanked(shipId, Number(year), Number(applyAmount))}
                    disabled={!applyAmount || loading}
                    variant="secondary"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Apply result */}
          {applyResult && (
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4 animate-fade-in">
              <p className="text-emerald-300 text-sm font-semibold mb-3">Application Result</p>
              <div className="grid grid-cols-3 gap-3">
                <KpiCard label="CB Before" value={applyResult.cbBefore.toLocaleString('en', { maximumFractionDigits: 0 })} sub="gCO₂e" />
                <KpiCard label="Applied" value={applyResult.applied.toLocaleString('en', { maximumFractionDigits: 0 })} sub="gCO₂e" />
                <KpiCard label="CB After" value={applyResult.cbAfter.toLocaleString('en', { maximumFractionDigits: 0 })} sub="gCO₂e" positive={applyResult.cbAfter >= 0} />
              </div>
            </div>
          )}
        </div>
      )}

      {!cb && !loading && (
        <div className="text-center py-12 text-slate-500">
          <p>Select a ship and year, then click <span className="text-slate-300">Load CB</span> to begin.</p>
        </div>
      )}
    </div>
  );
}
