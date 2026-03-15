import { useState } from 'react';
import { useRoutes } from '../hooks/useRoutes';
import { Badge, Spinner, Alert, Button, Select, Table, Th, Td } from './shared';

export function RoutesTab() {
  const [vesselType, setVesselType] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [year, setYear] = useState('');

  const { routes, loading, error, setBaseline } = useRoutes(
    vesselType || fuelType || year
      ? { vesselType: vesselType || undefined, fuelType: fuelType || undefined, year: year || undefined }
      : undefined
  );

  const [settingBaseline, setSettingBaseline] = useState<string | null>(null);

  const handleSetBaseline = async (routeId: string) => {
    setSettingBaseline(routeId);
    await setBaseline(routeId);
    setSettingBaseline(null);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Filters */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">Filters</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Vessel Type" value={vesselType} onChange={e => setVesselType(e.target.value)}>
            <option value="">All Types</option>
            <option value="Container">Container</option>
            <option value="BulkCarrier">Bulk Carrier</option>
            <option value="Tanker">Tanker</option>
            <option value="RoRo">RoRo</option>
          </Select>
          <Select label="Fuel Type" value={fuelType} onChange={e => setFuelType(e.target.value)}>
            <option value="">All Fuels</option>
            <option value="HFO">HFO</option>
            <option value="LNG">LNG</option>
            <option value="MGO">MGO</option>
          </Select>
          <Select label="Year" value={year} onChange={e => setYear(e.target.value)}>
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </Select>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-white">{routes.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Routes</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {routes.filter(r => r.ghgIntensity <= 89.3368).length}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Compliant</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-red-400">
            {routes.filter(r => r.ghgIntensity > 89.3368).length}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Non-Compliant</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-ocean-400">
            {routes.length > 0
              ? (routes.reduce((s, r) => s + r.ghgIntensity, 0) / routes.length).toFixed(1)
              : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Avg GHG (gCO₂e/MJ)</p>
        </div>
      </div>

      {error && <Alert message={error} />}
      {loading ? <Spinner /> : (
        <Table>
          <thead>
            <tr>
              <Th>Route ID</Th>
              <Th>Vessel Type</Th>
              <Th>Fuel Type</Th>
              <Th>Year</Th>
              <Th>GHG Intensity</Th>
              <Th>Fuel Cons. (t)</Th>
              <Th>Distance (km)</Th>
              <Th>Emissions (t)</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id} className={`hover:bg-slate-700/20 transition-colors ${r.isBaseline ? 'bg-ocean-900/20' : ''}`}>
                <Td>
                  <span className="font-mono text-ocean-300">{r.routeId}</span>
                  {r.isBaseline && <span className="ml-2 text-xs text-ocean-400 font-medium">[baseline]</span>}
                </Td>
                <Td>{r.vesselType}</Td>
                <Td>
                  <Badge variant={r.fuelType === 'LNG' ? 'green' : r.fuelType === 'HFO' ? 'red' : 'gray'}>
                    {r.fuelType}
                  </Badge>
                </Td>
                <Td className="font-mono">{r.year}</Td>
                <Td>
                  <span className={`font-mono font-medium ${r.ghgIntensity <= 89.3368 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.ghgIntensity.toFixed(1)}
                  </span>
                </Td>
                <Td className="font-mono">{r.fuelConsumption.toLocaleString()}</Td>
                <Td className="font-mono">{r.distance.toLocaleString()}</Td>
                <Td className="font-mono">{r.totalEmissions.toLocaleString()}</Td>
                <Td>
                  <Badge variant={r.ghgIntensity <= 89.3368 ? 'green' : 'red'}>
                    {r.ghgIntensity <= 89.3368 ? '✓ Compliant' : '✗ Non-Compliant'}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    variant={r.isBaseline ? 'secondary' : 'primary'}
                    disabled={r.isBaseline || settingBaseline === r.routeId}
                    onClick={() => handleSetBaseline(r.routeId)}
                  >
                    {r.isBaseline ? 'Baseline' : settingBaseline === r.routeId ? '…' : 'Set Baseline'}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
