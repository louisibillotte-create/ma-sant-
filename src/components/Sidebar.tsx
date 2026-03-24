import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Tableau de bord', icon: '📊' },
  { to: '/journal', label: 'Journal du jour', icon: '📝' },
  { to: '/saisie', label: 'Saisie hebdo', icon: '✏️' },
  { to: '/coach', label: 'Coach IA', icon: '🤖' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-stone-200 flex flex-col z-10 shadow-sm">
      <div className="px-6 py-6 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <div>
            <p className="font-bold text-stone-800 text-sm leading-tight">Vitalité</p>
            <p className="text-xs text-stone-400">Suivi Santé</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#8aad8a] text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-stone-100">
        <p className="text-xs text-stone-400">v1.0 · 2025</p>
      </div>
    </aside>
  );
}
