import { useState, useEffect } from 'react';
import type { WeekData, FoodQuality, SportSession } from '../types';
import { loadData, saveWeek, getCurrentWeekId, getCurrentWeekDate } from '../lib/storage';

const FOOD_QUALITIES: FoodQuality[] = [
  'Très équilibrée',
  'Plutôt saine',
  'Moyenne',
  'Fast-food',
  'Mauvaise',
];

function emptyWeek(): WeekData {
  return {
    id: getCurrentWeekId(),
    date: getCurrentWeekDate(),
    weight: null,
    waist: null,
    foodQuality: null,
    fruitVegPortions: 3,
    homeMeals: 14,
    mealDetails: '',
    stepsPerDay: 7000,
    totalKm: 0,
    sportSessions: [{ activity: '', duration: 30 }],
    beer: 0,
    wine: 0,
    spirits: 0,
    energy: 7,
    sleep: 7,
    coachNotes: '',
  };
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-stone-500">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-lg flex items-center justify-center transition-colors"
        >
          −
        </button>
        <span className="text-xl font-bold text-stone-800 w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full bg-[#8aad8a] hover:bg-[#7a9e7a] text-white font-bold text-lg flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function Saisie() {
  const [form, setForm] = useState<WeekData>(emptyWeek);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const { weeks } = loadData();
    const currentId = getCurrentWeekId();
    const existing = weeks.find((w) => w.id === currentId);
    if (existing) setForm(existing);
  }, []);

  function set<K extends keyof WeekData>(key: K, value: WeekData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSport(index: number, field: keyof SportSession, value: string | number) {
    const sessions = [...form.sportSessions];
    sessions[index] = { ...sessions[index], [field]: value };
    set('sportSessions', sessions);
  }

  function addSession() {
    set('sportSessions', [...form.sportSessions, { activity: '', duration: 30 }]);
  }

  function removeSession(index: number) {
    set('sportSessions', form.sportSessions.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveWeek(form);
    setSaved(true);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Saisie hebdomadaire</h1>
        <p className="text-stone-500 text-sm mt-1">Semaine {form.id}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Body */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <span>⚖️</span> Mesures corporelles
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Poids (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.weight ?? ''}
                onChange={(e) => set('weight', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a]"
                placeholder="ex. 72.5"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Tour de taille (cm) — optionnel</label>
              <input
                type="number"
                step="0.5"
                value={form.waist ?? ''}
                onChange={(e) => set('waist', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a]"
                placeholder="ex. 82"
              />
            </div>
          </div>
        </section>

        {/* Food */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <span>🥗</span> Alimentation
          </h2>
          <div className="mb-4">
            <label className="block text-xs text-stone-500 mb-2">Qualité alimentaire de la semaine</label>
            <div className="flex flex-wrap gap-2">
              {FOOD_QUALITIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => set('foodQuality', q)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.foodQuality === q
                      ? 'bg-[#8aad8a] border-[#8aad8a] text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-[#8aad8a]'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Portions fruits & légumes / jour</label>
              <input
                type="number"
                min={0}
                max={15}
                value={form.fruitVegPortions}
                onChange={(e) => set('fruitVegPortions', parseInt(e.target.value) || 0)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a]"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Repas maison (sur 21)</label>
              <input
                type="number"
                min={0}
                max={21}
                value={form.homeMeals}
                onChange={(e) => set('homeMeals', parseInt(e.target.value) || 0)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Détail des repas / remarques</label>
            <textarea
              value={form.mealDetails}
              onChange={(e) => set('mealDetails', e.target.value)}
              rows={3}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a] resize-none"
              placeholder="Ex. beaucoup de fast-food lundi et mardi, soirée resto jeudi..."
            />
          </div>
        </section>

        {/* Activity */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <span>👟</span> Activité physique
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Pas / jour (moyenne)</label>
              <input
                type="number"
                step="100"
                value={form.stepsPerDay}
                onChange={(e) => set('stepsPerDay', parseInt(e.target.value) || 0)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a]"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Km totaux (semaine)</label>
              <input
                type="number"
                step="0.1"
                value={form.totalKm}
                onChange={(e) => set('totalKm', parseFloat(e.target.value) || 0)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a]"
              />
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-stone-500">Sessions sportives</label>
              <button
                type="button"
                onClick={addSession}
                className="text-xs text-[#8aad8a] hover:text-[#7a9e7a] font-semibold"
              >
                + Ajouter
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {form.sportSessions.map((session, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={session.activity}
                    onChange={(e) => handleSport(index, 'activity', e.target.value)}
                    placeholder="Activité (ex. Yoga)"
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a]"
                  />
                  <input
                    type="number"
                    value={session.duration}
                    onChange={(e) => handleSport(index, 'duration', parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-20 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a]"
                    placeholder="min"
                  />
                  <span className="text-xs text-stone-400">min</span>
                  {form.sportSessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSession(index)}
                      className="text-rose-400 hover:text-rose-600 text-sm font-bold w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Alcohol */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <span>🍷</span> Consommation d'alcool (verres / semaine)
          </h2>
          <div className="flex justify-around">
            <Counter label="Bière 🍺" value={form.beer} onChange={(v) => set('beer', v)} />
            <Counter label="Vin 🍷" value={form.wine} onChange={(v) => set('wine', v)} />
            <Counter label="Spiritueux 🥃" value={form.spirits} onChange={(v) => set('spirits', v)} />
          </div>
        </section>

        {/* Well-being */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <span>✨</span> Bien-être
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-stone-500">Énergie générale</label>
                <span className="text-xs font-semibold text-[#8aad8a]">{form.energy}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form.energy}
                onChange={(e) => set('energy', parseInt(e.target.value))}
                className="w-full accent-[#8aad8a]"
              />
              <div className="flex justify-between text-xs text-stone-300 mt-0.5">
                <span>Épuisé</span>
                <span>Excellent</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-stone-500">Qualité du sommeil</label>
                <span className="text-xs font-semibold text-[#8aad8a]">{form.sleep}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form.sleep}
                onChange={(e) => set('sleep', parseInt(e.target.value))}
                className="w-full accent-[#8aad8a]"
              />
              <div className="flex justify-between text-xs text-stone-300 mt-0.5">
                <span>Très mauvais</span>
                <span>Parfait</span>
              </div>
            </div>
          </div>
        </section>

        {/* Coach Notes */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <span>🤖</span> Notes pour le coach
          </h2>
          <textarea
            value={form.coachNotes}
            onChange={(e) => set('coachNotes', e.target.value)}
            rows={4}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a] resize-none"
            placeholder="Questions, remarques, contexte particulier de la semaine..."
          />
        </section>

        <button
          type="submit"
          className="bg-[#8aad8a] hover:bg-[#7a9e7a] text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm"
        >
          {saved ? '✓ Enregistré !' : 'Enregistrer la semaine'}
        </button>
      </form>
    </div>
  );
}
