import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import { loadData } from '../lib/storage';
import type { WeekData } from '../types';

const FOOD_QUALITY_SCORE: Record<string, number> = {
  'Très équilibrée': 100,
  'Plutôt saine': 80,
  Moyenne: 60,
  'Fast-food': 35,
  Mauvaise: 15,
};

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `S${d.getDate()}/${d.getMonth() + 1}`;
}

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  delta: string | null;
  positive: boolean | null;
  icon: string;
  color: string;
}

function KpiCard({ label, value, unit, delta, positive, icon, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-100 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-3xl font-bold ${color}`}>{value}</span>
        <span className="text-sm text-stone-400 mb-1">{unit}</span>
      </div>
      {delta !== null && (
        <span
          className={`text-xs font-medium ${
            positive === true ? 'text-emerald-600' : positive === false ? 'text-rose-500' : 'text-stone-400'
          }`}
        >
          {delta} vs sem. préc.
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { weeks } = useMemo(() => loadData(), []);

  const last = weeks[weeks.length - 1] as WeekData | undefined;
  const prev = weeks[weeks.length - 2] as WeekData | undefined;

  const weightDelta = last && prev && last.weight !== null && prev.weight !== null
    ? `${last.weight - prev.weight > 0 ? '+' : ''}${(last.weight - prev.weight).toFixed(1)} kg`
    : null;

  const stepsDelta = last && prev
    ? `${last.stepsPerDay - prev.stepsPerDay > 0 ? '+' : ''}${(last.stepsPerDay - prev.stepsPerDay).toLocaleString()}`
    : null;

  const sportCountLast = last ? last.sportSessions.length : 0;
  const sportCountPrev = prev ? prev.sportSessions.length : 0;
  const sportDelta = last && prev
    ? `${sportCountLast - sportCountPrev > 0 ? '+' : ''}${sportCountLast - sportCountPrev} séance(s)`
    : null;

  const alcoolLast = last ? last.beer + last.wine + last.spirits : 0;
  const alcoolPrev = prev ? prev.beer + prev.wine + prev.spirits : 0;
  const alcoolDelta = last && prev
    ? `${alcoolLast - alcoolPrev > 0 ? '+' : ''}${alcoolLast - alcoolPrev} verre(s)`
    : null;

  const weightData = weeks.map((w) => ({
    name: formatWeekLabel(w.date),
    poids: w.weight,
  }));

  const stepsData = weeks.map((w) => ({
    name: formatWeekLabel(w.date),
    pas: w.stepsPerDay,
  }));

  const alcoolData = weeks.map((w) => ({
    name: formatWeekLabel(w.date),
    bière: w.beer,
    vin: w.wine,
    spiritueux: w.spirits,
  }));

  const foodScore = last && last.foodQuality ? FOOD_QUALITY_SCORE[last.foodQuality] ?? 0 : 0;
  const radialData = [{ name: 'Score', value: foodScore, fill: '#8aad8a' }];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Tableau de bord</h1>
        <p className="text-stone-500 text-sm mt-1">
          {weeks.length > 0 ? `${weeks.length} semaines enregistrées` : 'Aucune donnée'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Poids"
          value={last?.weight !== null && last?.weight !== undefined ? String(last.weight) : '—'}
          unit="kg"
          delta={weightDelta}
          positive={weightDelta ? parseFloat(weightDelta) < 0 : null}
          icon="⚖️"
          color="text-stone-800"
        />
        <KpiCard
          label="Pas / jour"
          value={last ? last.stepsPerDay.toLocaleString() : '—'}
          unit="pas"
          delta={stepsDelta}
          positive={stepsDelta ? parseFloat(stepsDelta) > 0 : null}
          icon="👟"
          color="text-[#8aad8a]"
        />
        <KpiCard
          label="Séances sport"
          value={String(sportCountLast)}
          unit="séances"
          delta={sportDelta}
          positive={sportDelta ? parseInt(sportDelta) > 0 : null}
          icon="🏋️"
          color="text-[#c4724a]"
        />
        <KpiCard
          label="Alcool"
          value={String(alcoolLast)}
          unit="verres"
          delta={alcoolDelta}
          positive={alcoolDelta ? parseFloat(alcoolDelta) < 0 : null}
          icon="🍷"
          color="text-stone-800"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-600 mb-4">Évolution du poids</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e7e5e4', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="poids"
                stroke="#8aad8a"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8aad8a' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radial food score */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-100 flex flex-col">
          <h2 className="text-sm font-semibold text-stone-600 mb-4">Score alimentaire (dernière semaine)</h2>
          <div className="flex items-center justify-center flex-1">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f5f0e8' }} />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#8aad8a]">{foodScore}</span>
                <span className="text-xs text-stone-400">/100</span>
              </div>
            </div>
          </div>
          {last?.foodQuality && (
            <p className="text-center text-sm text-stone-500 mt-2">{last.foodQuality}</p>
          )}
        </div>

        {/* Steps chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-600 mb-4">Pas quotidiens</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stepsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e7e5e4', fontSize: 12 }}
              />
              <Bar dataKey="pas" radius={[4, 4, 0, 0]}>
                {stepsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pas >= 8000 ? '#8aad8a' : '#e5d5c5'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-stone-400 mt-2">Vert = objectif 8 000 pas atteint</p>
        </div>

        {/* Alcohol stacked chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <h2 className="text-sm font-semibold text-stone-600 mb-4">Consommation d'alcool</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={alcoolData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e7e5e4', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="bière" stackId="a" fill="#c4724a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="vin" stackId="a" fill="#b05c38" radius={[0, 0, 0, 0]} />
              <Bar dataKey="spiritueux" stackId="a" fill="#8b3a1a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
