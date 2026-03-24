import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { loadData, saveChatHistory, getApiKey, saveApiKey } from '../lib/storage';

const SHORTCUTS = [
  { label: 'Bilan de semaine', prompt: 'Fais un bilan complet de ma dernière semaine en analysant mes données de santé.' },
  { label: 'Plan repas', prompt: "Propose-moi un plan repas équilibré pour la semaine prochaine basé sur mes habitudes alimentaires." },
  { label: 'Programme sportif', prompt: "Crée-moi un programme sportif adapté à mes niveaux d'énergie et mes sessions actuelles." },
  { label: 'Alcool & santé', prompt: "Analyse ma consommation d'alcool et ses impacts potentiels sur ma santé." },
  { label: 'Objectifs SMART', prompt: 'Aide-moi à définir 3 objectifs SMART pour le mois prochain basés sur mes tendances.' },
  { label: 'Tendances', prompt: 'Quelles sont les tendances clés de mes données sur les dernières semaines ?' },
];

function buildSystemPrompt(weeksData: ReturnType<typeof loadData>['weeks'], dailyLogs: ReturnType<typeof loadData>['dailyLogs']): string {
  const weeksStr = weeksData.length > 0
    ? weeksData
        .map((w) => {
          const alcohol = w.beer + w.wine + w.spirits;
          return `Semaine ${w.id} (${w.date}):
- Poids: ${w.weight ?? 'N/A'} kg, Tour de taille: ${w.waist ?? 'N/A'} cm
- Alimentation: ${w.foodQuality ?? 'N/A'}, ${w.fruitVegPortions} portions F&L/j, ${w.homeMeals}/21 repas maison
- Activité: ${w.stepsPerDay.toLocaleString()} pas/j, ${w.totalKm} km, ${w.sportSessions.length} séances sport
- Sport: ${w.sportSessions.map((s) => `${s.activity} ${s.duration}min`).join(', ') || 'aucune'}
- Alcool: ${alcohol} verre(s) (bière: ${w.beer}, vin: ${w.wine}, spiritueux: ${w.spirits})
- Énergie: ${w.energy}/10, Sommeil: ${w.sleep}/10
- Notes: ${w.coachNotes || 'aucune'}`;
        })
        .join('\n\n')
    : 'Aucune donnée hebdomadaire enregistrée.';

  const recentLogs = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const logsStr = recentLogs.length > 0
    ? recentLogs
        .map((l) => {
          const meals = l.meals.filter((m) => m.description.trim()).map((m) => `${m.type}: ${m.description}`).join(' | ');
          const alcool = l.drinks.beer + l.drinks.wine + l.drinks.spirits;
          return `${l.date}: ${meals || 'repas non renseignés'} — eau: ${l.drinks.water} verres, café: ${l.drinks.coffee}, alcool: ${alcool} verre(s)${l.notes ? ` — note: ${l.notes}` : ''}`;
        })
        .join('\n')
    : 'Aucun journal alimentaire quotidien enregistré.';

  return `Tu es un coach santé et bien-être bienveillant et expert. Tu accompagnes l'utilisateur dans son suivi santé.

Données hebdomadaires:
${weeksStr}

Journal alimentaire quotidien (14 derniers jours):
${logsStr}

Réponds en français de manière concise, bienveillante et actionnable. Base tes conseils sur les données réelles de l'utilisateur.`;
}

export default function Coach() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { chatHistory } = loadData();
    setMessages(chatHistory);
    const key = getApiKey();
    setApiKey(key);
    setShowKeyForm(!key || key === 'sk-ant-xxxxxxxxxxxxxxxx');
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function handleSaveKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    saveApiKey(trimmed);
    setApiKey(trimmed);
    setShowKeyForm(false);
    setKeyInput('');
  }

  async function sendMessage(userText: string) {
    if (!userText.trim() || loading) return;

    const { weeks, dailyLogs } = loadData();
    const userMsg: ChatMessage = { role: 'user', content: userText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const key = getApiKey();
      if (!key || key === 'sk-ant-xxxxxxxxxxxxxxxx') {
        setShowKeyForm(true);
        throw new Error('Clé API manquante. Saisissez votre clé Anthropic ci-dessus pour activer le coach.');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: buildSystemPrompt(weeks, dailyLogs),
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(err?.error?.message ?? `HTTP ${response.status}`);
      }

      const data = await response.json() as { content: Array<{ type: string; text: string }> };
      const assistantText = data.content[0]?.text ?? '…';
      const withAssistant = [...updated, { role: 'assistant' as const, content: assistantText }];
      setMessages(withAssistant);
      saveChatHistory(withAssistant);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      const withError = [...updated, { role: 'assistant' as const, content: `⚠️ ${errMsg}` }];
      setMessages(withError);
      saveChatHistory(withError);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function clearHistory() {
    setMessages([]);
    saveChatHistory([]);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Coach IA</h1>
          <p className="text-stone-400 text-xs">Basé sur vos données de santé</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowKeyForm((v) => !v)}
            className="text-xs text-stone-400 hover:text-[#8aad8a] transition-colors"
          >
            {apiKey && apiKey !== 'sk-ant-xxxxxxxxxxxxxxxx' ? '🔑 Clé configurée' : '🔑 Configurer la clé API'}
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-stone-400 hover:text-rose-500 transition-colors"
            >
              Effacer l'historique
            </button>
          )}
        </div>
      </div>

      {/* API key form */}
      {showKeyForm && (
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
          <p className="text-xs font-semibold text-amber-800 mb-2">
            Clé API Anthropic requise pour le Coach IA
          </p>
          <p className="text-xs text-amber-700 mb-3">
            Obtenez votre clé sur{' '}
            <span className="font-mono">console.anthropic.com</span> → API Keys.
            Elle sera stockée localement dans votre navigateur.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
              placeholder="sk-ant-…"
              className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Shortcuts */}
      <div className="px-6 py-3 bg-[#f5f0e8] border-b border-stone-200 flex flex-wrap gap-2">
        {SHORTCUTS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => void sendMessage(s.prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-600 hover:border-[#8aad8a] hover:text-[#8aad8a] transition-colors disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {messages.length === 0 && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <span className="text-4xl mb-3">🌿</span>
            <p className="text-stone-500 text-sm max-w-xs">
              Bonjour ! Je suis votre coach santé personnalisé. Utilisez les raccourcis ci-dessus ou posez-moi n'importe quelle question.
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#8aad8a] flex items-center justify-center text-white text-xs mr-2 mt-0.5 shrink-0">
                🌿
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#8aad8a] text-white rounded-br-sm'
                  : 'bg-white border border-stone-200 text-stone-700 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-[#8aad8a] flex items-center justify-center text-white text-xs mr-2 mt-0.5 shrink-0">
              🌿
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 rounded-full bg-stone-300 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-stone-300 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-stone-300 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-stone-200 bg-white">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Posez votre question… (Entrée pour envoyer)"
            className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8aad8a] resize-none"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-[#8aad8a] hover:bg-[#7a9e7a] disabled:opacity-40 text-white p-3 rounded-xl transition-colors shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-stone-300 mt-2 text-center">Shift+Entrée pour un retour à la ligne</p>
      </div>
    </div>
  );
}
