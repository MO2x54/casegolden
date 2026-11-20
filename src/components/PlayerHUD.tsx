import React from 'react';
import { BOARD_SPACES } from '../data/boardData';
import { GameState } from '../types/game';

interface PlayerHUDProps {
  state: GameState;
  myPlayerId: string | null;
  isLocalMode: boolean;
}

/**
 * Compact perimeter Player HUD strip displaying every player's avatar/token,
 * name, live balance in EGP, current location, and active turn highlight.
 */
export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  state,
  myPlayerId,
  isLocalMode,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-stretch gap-2 min-w-max lg:min-w-0 lg:flex-wrap lg:justify-center">
        {state.players.map((p, idx) => {
          const isTurn = idx === state.currentTurnIndex && !p.bankrupt;
          const isMe = !isLocalMode && p.id === myPlayerId;
          const propCount = Object.values(state.properties).filter(
            (pr) => pr.ownerId === p.id
          ).length;

          return (
            <div
              key={p.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all min-w-[155px] ${
                p.bankrupt
                  ? 'bg-slate-950/60 border-slate-800/60 opacity-45'
                  : isTurn
                  ? 'bg-[#172338] border-amber-400 shadow-md shadow-amber-500/10'
                  : 'bg-[#111827] border-slate-800'
              }`}
            >
              <div
                style={{
                  backgroundColor: p.color,
                  borderColor: isTurn ? '#FEF3C7' : '#0B0F17',
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 shrink-0 ${
                  isTurn ? 'ring-2 ring-amber-400/70' : ''
                }`}
              >
                {p.token}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span
                    className={`font-display font-bold text-xs truncate ${
                      p.bankrupt ? 'line-through text-slate-500' : 'text-white'
                    }`}
                  >
                    {p.name}
                  </span>
                  {isMe && (
                    <span className="text-[10px] text-sky-400 font-bold">(أنت)</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`font-num font-extrabold ${
                      p.money < 0 ? 'text-rose-400' : 'text-amber-300'
                    }`}
                  >
                    {p.money.toLocaleString('en-US')} ج
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 truncate max-w-[72px]">
                    {p.bankrupt
                      ? 'مفلس'
                      : p.inJail
                      ? '⛓️ سجن'
                      : BOARD_SPACES[p.position]?.name}
                  </span>
                </div>
              </div>

              {isTurn && (
                <span className="text-[10px] font-bold text-amber-300 shrink-0">
                  الدور
                </span>
              )}
              {!isTurn && !p.bankrupt && propCount > 0 && (
                <span className="font-num text-[10px] text-slate-400 shrink-0">
                  {propCount}🏠
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
