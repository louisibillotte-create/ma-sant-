import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { loadData, saveChatHistory } from '../lib/storage';

const SHORTCUTS = [
  { label: 'Bilan de semaine', prompt: 'Fais un bilan complet de ma dernière semaine en analysant mes données de santé.' },
  { label: 'Plan repas', prompt: "Propose-moi un plan repas équilibré pour la semaine prochaine basé sur mes habitudes alimentaires." },
  { label: 'Programme sportif', prompt: "Crée-moi un programme sportif adapté à mes niveaux d'énergie et mes sessions actuelles." },
  { label: 'Alcool & santé', prompt: "Analyse ma consommation d'alcool et ses impacts potentiels sur ma santé." },
  { label: 'Objectifs SMART', prompt: 'Aide-moi à définir 3 objectifs SMART pour le mois prochain basés sur mes tendances.' },
  { label: 'Tendances', prompt: 'Quelles sont les tendances clés de mes données sur les dernières semaines ?' },
];

function buildSystemPrompt(weeksData: ReturnType<typeof loadData>['weeks']): string {
  const dataStr = weeksData
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
    .join('\n\n');

  return `Tu es un coach santé et bien-être bienveillant et expert. Tu accompagnes l'utilisateur dans son suivi santé hebdomadaire.

Voici l'historique complet des données de l'utilisateur:

${dataStr}

Réponds en français de manière concise, bienveillante et actionnable. Base tes conseils sur les données réelles de l'utilisateur.`;
}

export default function Coach() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { chatHistory } = loadData();
    setMessages(chatHistory);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(userText: string) {
    if (!userText.trim() || loading) return;

    const { weeks } = loadData();
    const userMsg: ChatMessage = { role: 'user', content: userText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string;
      if (!apiKey || apiKey === 'sk-ant-xxxxxxxxxxxxxxxx') {
        throw new Error('Clé API Anthropic non configurée. Ajoutez VITE_ANTHROPIC_API_KEY dans votre fichier .env');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: buildSystemPrompt(weeks),
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
      const withError = [...updated, { role: 'assistant' as const, content: `⚠️ Erreur : ${errMsg}` }];
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
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-stone-400 hover:text-rose-500 transition-colors"
          >
            Effacer l'historique
          </button>
        )}
      </div>

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
