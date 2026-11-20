import React, { useState } from 'react';
import { BOARD_SPACES, COLOR_GROUP_META } from '../data/boardData';
import { ChatMessage, GameState, Player } from '../types/game';
import { CountryFlag } from './CountryFlag';
import { BuildingShape } from './BuildingShape';
import {
  ArrowLeftRight,
  Building2,
  MessageSquare,
  ScrollText,
  Send,
  Users,
} from 'lucide-react';

interface SidePanelProps {
  state: GameState;
  myPlayerId: string | null;
  isLocalMode: boolean;
  chatMessages: ChatMessage[];
  onOpenTrade: (targetPlayerId?: string) => void;
  onSelectSpace: (spaceIndex: number) => void;
  onSendChat: (text: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  state,
  myPlayerId,
  isLocalMode,
  chatMessages,
  onOpenTrade,
  onSelectSpace,
  onSendChat,
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'portfolio' | 'feed'>('players');
  const [chatText, setChatText] = useState('');

  const currentPlayer = state.players[state.currentTurnIndex];
  const actingPlayer: Player | undefined = isLocalMode
    ? currentPlayer
    : state.players.find((p) => p.id === myPlayerId) || currentPlayer;

  const ownedByActing = Object.entries(state.properties)
    .filter(([, prop]) => actingPlayer && prop.ownerId === actingPlayer.id)
    .map(([idx, prop]) => ({ space: BOARD_SPACES[Number(idx)], prop }));

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatText.trim();
    if (!trimmed) return;
    onSendChat(trimmed);
    setChatText('');
  };

  return (
    <aside className="w-full lg:w-[370px] xl:w-[400px] shrink-0 bg-[#111827] border border-slate-800 rounded-2xl flex flex-col overflow-hidden h-[560px] lg:h-[780px]">
      {/* Segmented Navigation Tabs */}
      <div className="p-2 bg-[#0D1320] border-b border-slate-800 grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('players')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'players'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>اللاعبون ({state.players.filter((p) => !p.bankrupt).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'portfolio'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>أملاكي ({ownedByActing.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'feed'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>السجل والدردشة</span>
        </button>
      </div>

      {/* Tab 1: Players & Balances */}
      {activeTab === 'players' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {actingPlayer && !actingPlayer.bankrupt && (
            <button
              type="button"
              disabled={Boolean(state.activeTrade || state.activeAuction)}
              onClick={() => onOpenTrade()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 text-amber-300 border border-amber-500/35 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>عقد صفقة تبادل جديدة</span>
            </button>
          )}

          <div className="space-y-2">
            {state.players.map((p, idx) => {
              const isTurn = idx === state.currentTurnIndex && !p.bankrupt;
              const propCount = Object.values(state.properties).filter(
                (pr) => pr.ownerId === p.id
              ).length;
              const currentTileName = BOARD_SPACES[p.position]?.name || '';

              return (
                <div
                  key={p.id}
                  className={`rounded-xl p-3 border transition-colors ${
                    p.bankrupt
                      ? 'bg-slate-950/60 border-slate-800/60 opacity-50'
                      : isTurn
                      ? 'bg-[#172236] border-amber-400/60'
                      : 'bg-[#0E1524] border-slate-800/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-base border-2 shrink-0 shadow"
                        style={{
                          backgroundColor: p.color,
                          borderColor: isTurn ? '#FDE68A' : '#1E293B',
                        }}
                      >
                        {p.token}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-display font-bold text-sm truncate ${
                              p.bankrupt ? 'line-through text-slate-500' : 'text-white'
                            }`}
                          >
                            {p.name}
                          </span>
                          {p.id === myPlayerId && !isLocalMode && (
                            <span className="text-[10px] text-sky-400 font-bold">(أنت)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                          <span>{p.bankrupt ? 'مفلس' : currentTileName}</span>
                          {!p.bankrupt && (
                            <>
                              <span>·</span>
                              <span>{propCount} ملكية</span>
                            </>
                          )}
                          {p.inJail && !p.bankrupt && (
                            <>
                              <span>·</span>
                              <span className="text-rose-400 font-bold">سجن</span>
                            </>
                          )}
                          {p.getOutOfJailCards > 0 && !p.bankrupt && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-400 font-bold">
                                🎟️×{p.getOutOfJailCards}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div
                        className={`font-num text-sm sm:text-base font-extrabold ${
                          p.money < 0 ? 'text-rose-400' : 'text-amber-300'
                        }`}
                      >
                        {p.money.toLocaleString('en-US')} ج
                      </div>
                      {!p.bankrupt &&
                        actingPlayer &&
                        p.id !== actingPlayer.id &&
                        !state.activeTrade &&
                        !state.activeAuction && (
                          <button
                            type="button"
                            onClick={() => onOpenTrade(p.id)}
                            className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                          >
                            صفقة ⇄
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: My Properties / Portfolio */}
      {activeTab === 'portfolio' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {actingPlayer && (
            <div className="text-xs text-slate-400 pb-1 flex items-center justify-between border-b border-slate-800">
              <span>أملاك {actingPlayer.name}</span>
              <span>اضغط على أي عقار للبناء أو الرهن</span>
            </div>
          )}

          {ownedByActing.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm space-y-2">
              <div className="text-3xl">🏛️</div>
              <p>لا توجد عقارات مملوكة بعد.</p>
              <p className="text-xs text-slate-500">
                اشترِ المدن عند الوقوف عليها أو ادخل المزادات العلنية!
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {ownedByActing.map(({ space, prop }) => {
                const groupMeta = space.group ? COLOR_GROUP_META[space.group] : null;
                return (
                  <button
                    key={space.index}
                    type="button"
                    onClick={() => onSelectSpace(space.index)}
                    className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0E1524] hover:bg-[#162136] border border-slate-800 transition-colors text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-8 rounded-sm shrink-0"
                        style={{ backgroundColor: groupMeta?.hex || '#64748B' }}
                      />
                      {space.country && <CountryFlag code={space.country} className="w-6 h-4" />}
                      <div className="min-w-0">
                        <div className="font-display font-bold text-sm text-white truncate">
                          {space.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          {prop.mortgaged ? (
                            <span className="text-rose-400 font-bold">مرهون</span>
                          ) : prop.houses > 0 ? (
                            <BuildingShape level={prop.houses} size="xs" showLabel />
                          ) : (
                            <span>أرض فضاء</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-num text-xs font-bold text-amber-300 shrink-0">
                      {space.price} ج
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Live Event Log + Room Chat */}
      {activeTab === 'feed' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Half: Live Event Log */}
          <div className="flex-1 overflow-y-auto p-3 border-b border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2">
              <ScrollText className="w-3.5 h-3.5" />
              <span>سجل الأحداث المباشر</span>
            </div>
            {state.logs.map((entry) => (
              <div
                key={entry.id}
                className={`text-xs leading-relaxed px-2.5 py-1.5 rounded-lg border ${
                  entry.category === 'court'
                    ? 'bg-rose-950/30 border-rose-500/20 text-rose-200'
                    : entry.category === 'money'
                    ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200'
                    : entry.category === 'auction'
                    ? 'bg-amber-950/30 border-amber-500/25 text-amber-200'
                    : entry.category === 'card'
                    ? 'bg-sky-950/30 border-sky-500/25 text-sky-200'
                    : 'bg-[#0D1320] border-slate-800/80 text-slate-300'
                }`}
              >
                {entry.text}
              </div>
            ))}
          </div>

          {/* Bottom Half: Room Chat */}
          <div className="h-[220px] flex flex-col bg-[#0C121E]">
            <div className="px-3 py-2 border-b border-slate-800/80 text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>دردشة الغرفة</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {chatMessages.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">
                  ابدأ الدردشة مع اللاعبين هنا...
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="text-xs leading-relaxed">
                    <span
                      className="font-bold ml-1.5"
                      style={{ color: msg.senderColor }}
                    >
                      {msg.senderName}:
                    </span>
                    <span className="text-slate-200 break-words">{msg.text}</span>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={handleChatSubmit}
              className="p-2 border-t border-slate-800 flex items-center gap-1.5"
            >
              <input
                type="text"
                maxLength={240}
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="اكتب رسالة سريعة..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer shrink-0"
                aria-label="إرسال"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
