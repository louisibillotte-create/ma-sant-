import { useState, useEffect } from 'react';
import type { DailyLog, DailyMeal, MealType } from '../types';
import { loadData, saveDailyLog, toDateId } from '../lib/storage';

const MEAL_TYPES: MealType[] = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation'];

const MEAL_ICONS: Record<MealType, string> = {
  'Petit-déjeuner': '🌅',
  'Déjeuner': '☀️',
  'Dîner': '🌙',
  'Collation': '🍎',
};

function emptyLog(dateId: string): DailyLog {
  return {
    id: dateId,
    date: dateId,
    meals: MEAL_TYPES.map((type) => ({ type, description: '' })),
    drinks: { water: 0, coffee: 0, tea: 0, beer: 0, wine: 0, spirits: 0, other: '' },
    notes: '',
  };
}

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isToday(dateStr: string): boolean {
  return dateStr === toDateId(new Date());
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return toDateId(d);
}

function Counter({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-stone-600">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-lg leading-none transition-colors"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-stone-700">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-lg leading-none transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function Journal() {
  const today = toDateId(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [log, setLog] = useState<DailyLog>(emptyLog(today));
  const [saved, setSaved] = useState(false);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);

  // Load log for selected date
  useEffect(() => {
    const { dailyLogs } = loadData();
    const existing = dailyLogs.find((l) => l.id === selectedDate);
    setLog(existing ?? emptyLog(selectedDate));
    setSaved(false);

    // Recent logs sorted descending (last 10, excluding selected)
    const recent = [...dailyLogs]
      .filter((l) => l.id !== selectedDate)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
    setRecentLogs(recent);
  }, [selectedDate]);

  function updateMeal(type: MealType, description: string) {
    setLog((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.type === type ? { ...m, description } : m)),
    }));
    setSaved(false);
  }

  function updateDrink(key: keyof typeof log.drinks, value: number | string) {
    setLog((prev) => ({ ...prev, drinks: { ...prev.drinks, [key]: value } }));
    setSaved(false);
  }

  function handleSave() {
    saveDailyLog(log);
    setSaved(true);
    // Refresh recent list
    const { dailyLogs } = loadData();
    const recent = [...dailyLogs]
      .filter((l) => l.id !== selectedDate)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
    setRecentLogs(recent);
  }

  function logSummary(l: DailyLog): string {
    const meals = l.meals.filter((m) => m.description.trim()).map((m) => m.type).join(', ');
    const alcool = l.drinks.beer + l.drinks.wine + l.drinks.spirits;
    const parts = [];
    if (meals) parts.push(meals);
    if (l.drinks.water > 0) parts.push(`${l.drinks.water} eau`);
    if (alcool > 0) parts.push(`${alcool} alcool`);
    return parts.join(' · ') || 'Entrée vide';
  }

  return (
    <div className="flex gap-6 p-6 min-h-screen">
      {/* Main form */}
      <div className="flex-1 max-w-2xl">
        {/* Header + date nav */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 mb-5">
          <h1 className="text-xl font-bold text-stone-800 mb-4">Journal alimentaire</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
            >
              ←
            </button>
            <div className="flex-1 text-center">
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="sr-only"
                id="date-picker"
              />
              <label
                htmlFor="date-picker"
                className="cursor-pointer font-semibold text-stone-700 hover:text-[#8aad8a] transition-colors capitalize"
              >
                {formatDateFR(selectedDate)}
              </label>
              {isToday(selectedDate) && (
                <span className="ml-2 text-xs bg-[#8aad8a] text-white px-2 py-0.5 rounded-full">Aujourd'hui</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const next = addDays(selectedDate, 1);
                if (next <= today) setSelectedDate(next);
              }}
              disabled={selectedDate >= today}
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>

        {/* Meals */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-stone-700 mb-4">Repas</h2>
          <div className="flex flex-col gap-4">
            {MEAL_TYPES.map((type) => {
              const meal: DailyMeal = log.meals.find((m) => m.type === type) ?? { type, description: '' };
              return (
                <div key={type}>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-600 mb-1.5">
                    <span>{MEAL_ICONS[type]}</span>
                    {type}
                  </label>
                  <textarea
                    value={meal.description}
                    onChange={(e) => updateMeal(type, e.target.value)}
                    placeholder={`Qu'avez-vous mangé ? (${type.toLowerCase()})`}
                    rows={2}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8aad8a] resize-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Drinks */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-stone-700 mb-2">Boissons</h2>
          <div className="divide-y divide-stone-100">
            <Counter label="💧 Eau (verres)" value={log.drinks.water} onChange={(v) => updateDrink('water', v)} />
            <Counter label="☕ Café" value={log.drinks.coffee} onChange={(v) => updateDrink('coffee', v)} />
            <Counter label="🍵 Thé" value={log.drinks.tea} onChange={(v) => updateDrink('tea', v)} />
            <Counter label="🍺 Bière" value={log.drinks.beer} onChange={(v) => updateDrink('beer', v)} />
            <Counter label="🍷 Vin" value={log.drinks.wine} onChange={(v) => updateDrink('wine', v)} />
            <Counter label="🥃 Spiritueux" value={log.drinks.spirits} onChange={(v) => updateDrink('spirits', v)} />
            <div className="py-2">
              <input
                type="text"
                value={log.drinks.other}
                onChange={(e) => updateDrink('other', e.target.value)}
                placeholder="Autres boissons (jus, soda…)"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8aad8a]"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-stone-700 mb-3">Notes libres</h2>
          <textarea
            value={log.notes}
            onChange={(e) => { setLog((p) => ({ ...p, notes: e.target.value })); setSaved(false); }}
            placeholder="Ressentis, observations du jour…"
            rows={3}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8aad8a] resize-none"
          />
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-colors bg-[#8aad8a] hover:bg-[#7a9e7a] text-white"
        >
          {saved ? '✓ Sauvegardé !' : 'Enregistrer'}
        </button>
      </div>

      {/* Sidebar: recent entries */}
      <div className="w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sticky top-6">
          <h3 className="font-semibold text-stone-700 text-sm mb-3">Entrées récentes</h3>
          {recentLogs.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-4">Aucune entrée pour l'instant.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {recentLogs.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedDate(l.id)}
                  className="text-left px-3 py-2.5 rounded-xl hover:bg-stone-50 transition-colors group"
                >
                  <p className="text-xs font-medium text-stone-600 group-hover:text-[#8aad8a] transition-colors capitalize">
                    {formatDateFR(l.id)}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5 truncate">{logSummary(l)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
