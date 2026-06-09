import { useEffect, useState } from 'react';
import { getPricing, updateFares, updateSurge, resetPricing } from '../api';
import { Plus, Trash2, Save, RotateCcw } from 'lucide-react';

const VEHICLES = ['bike', 'three_wheeler', 'pickup_8ft', 'pickup_14ft', 'truck'];

export default function Pricing() {
  const [fares, setFares]       = useState({});
  const [surge, setSurge]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');

  const load = () => {
    setLoading(true);
    getPricing()
      .then((r) => {
        setFares(r.data.data.fareConfig || {});
        setSurge(r.data.data.surgeWindows || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const saveFares = async () => {
    setSaving(true);
    try {
      await updateFares(fares);
      notify('✓ Fare rates saved');
    } catch (err) {
      notify('✗ ' + (err.response?.data?.message || 'Save failed'));
    } finally { setSaving(false); }
  };

  const saveSurge = async () => {
    setSaving(true);
    try {
      await updateSurge(surge);
      notify('✓ Surge windows saved');
    } catch (err) {
      notify('✗ ' + (err.response?.data?.message || 'Save failed'));
    } finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!confirm('Reset all pricing to defaults?')) return;
    setSaving(true);
    try {
      await resetPricing();
      notify('✓ Pricing reset to defaults');
      load();
    } catch (err) {
      notify('✗ Reset failed');
    } finally { setSaving(false); }
  };

  const updateFareField = (vehicle, field, val) => {
    setFares((prev) => ({
      ...prev,
      [vehicle]: { ...prev[vehicle], [field]: Number(val) },
    }));
  };

  const updateSurgeField = (i, field, val) => {
    setSurge((prev) =>
      prev.map((w, idx) =>
        idx === i ? { ...w, [field]: field === 'label' ? val : Number(val) } : w
      )
    );
  };

  const addSurgeWindow = () => {
    setSurge((prev) => [
      ...prev,
      { startHour: 0, endHour: 1, multiplier: 1.1, label: 'New surge' },
    ]);
  };

  const removeSurgeWindow = (i) => {
    setSurge((prev) => prev.filter((_, idx) => idx !== i));
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading…</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Pricing</h1>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-indigo-600 font-medium">{msg}</span>}
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Fare Rates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-700">Fare Rates</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fare = firstKmRate + (chargeableKm − 1) × perKm · Min 3 km</p>
          </div>
          <button
            onClick={saveFares}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={14} />
            Save Fares
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Vehicle</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">First 1 km (₹)</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Per km from km 2 (₹)</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Min fare (3 km)</th>
              </tr>
            </thead>
            <tbody>
              {VEHICLES.map((v) => {
                const c = fares[v] || {};
                const minFare = Math.round((c.firstKmRate || 0) + 2 * (c.perKm || 0));
                return (
                  <tr key={v} className="border-b border-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-700 capitalize">{v.replace('_', ' ')}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        value={c.firstKmRate ?? ''}
                        onChange={(e) => updateFareField(v, 'firstKmRate', e.target.value)}
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        value={c.perKm ?? ''}
                        onChange={(e) => updateFareField(v, 'perKm', e.target.value)}
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="py-2 px-3 text-gray-500 font-medium">₹{minFare}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Surge Windows */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-700">Surge Windows (IST)</h2>
            <p className="text-xs text-gray-400 mt-0.5">Multiplier ≥ 1 · Hours in 24-hour format · No surge = no entry needed</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addSurgeWindow}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              <Plus size={14} />
              Add Window
            </button>
            <button
              onClick={saveSurge}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save size={14} />
              Save Surge
            </button>
          </div>
        </div>

        {surge.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No surge windows. Click "Add Window" to create one.</p>
        )}

        <div className="space-y-3">
          {surge.map((w, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>From</span>
                <input
                  type="number"
                  min="0" max="23"
                  value={w.startHour}
                  onChange={(e) => updateSurgeField(i, 'startHour', e.target.value)}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span>:00 to</span>
                <input
                  type="number"
                  min="0" max="24"
                  value={w.endHour}
                  onChange={(e) => updateSurgeField(i, 'endHour', e.target.value)}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span>:00</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>×</span>
                <input
                  type="number"
                  min="1" max="3" step="0.01"
                  value={w.multiplier}
                  onChange={(e) => updateSurgeField(i, 'multiplier', e.target.value)}
                  className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-gray-400 text-xs">
                  (+{Math.round((w.multiplier - 1) * 100)}%)
                </span>
              </div>
              <input
                type="text"
                value={w.label}
                onChange={(e) => updateSurgeField(i, 'label', e.target.value)}
                placeholder="Label shown to customers"
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => removeSurgeWindow(i)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
