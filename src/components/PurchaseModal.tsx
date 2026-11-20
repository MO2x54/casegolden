import React from 'react';
import { BOARD_SPACES, COLOR_GROUP_META } from '../data/boardData';
import { GameState, Player, RoomSettings } from '../types/game';
import { CountryFlag } from './CountryFlag';
import { BuildingShape } from './BuildingShape';
import { Gavel, Sparkles, Wallet, X } from 'lucide-react';

interface PurchaseModalProps {
  spaceIndex: number;
  state: GameState;
  settings: RoomSettings;
  player: Player;
  onBuy: () => void;
  onAuction: () => void;
  onSkip: () => void;
}

/**
 * Interactive Purchase Modal ("وقفت على الدار البيضاء") triggered automatically
 * when the active player's piece lands on an unowned city/station/utility.
 * Displays full rent tiers, complete color group ownership cards, and live balance calculation.
 */
export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  spaceIndex,
  state,
  settings,
  player,
  onBuy,
  onAuction,
  onSkip,
}) => {
  const space = BOARD_SPACES[spaceIndex];
  if (!space || !space.price) return null;

  const groupMeta = space.group ? COLOR_GROUP_META[space.group] : null;
  const price = space.price;
  const remaining = player.money - price;
  const canAfford = remaining >= 0;

  const ownerMap: Record<string, Player> = {};
  for (const p of state.players) ownerMap[p.id] = p;

  const typeLabel =
    space.type === 'property'
      ? `مدينة · ${groupMeta?.name || ''}`
      : space.type === 'station'
      ? 'خط نقل سريع'
      : 'محطة بنزين ومرافق';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#121A29] border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ backgroundColor: groupMeta ? groupMeta.hex : '#1E293B' }}
        >
          <div className="flex items-center gap-3">
            {space.country ? (
              <CountryFlag code={space.country} className="w-10 h-6" />
            ) : (
              <span className="text-2xl leading-none">
                {space.type === 'utility' ? '⛽' : '🚌'}
              </span>
            )}
            <div>
              <div className="text-xs text-white/85 font-bold">
                وقفت على {space.name}!
              </div>
              <h3 className="font-display text-2xl font-black text-white leading-tight">
                {space.name}
              </h3>
              <p className="text-xs text-white/85">{typeLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="w-8 h-8 rounded-lg bg-black/25 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer"
            aria-label="تخطي"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Instant Balance Calculator */}
          <div className="grid grid-cols-3 gap-2 bg-[#0B111E] border border-slate-800 rounded-xl p-3 text-center">
            <div>
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Wallet className="w-3 h-3" />
                <span>رصيدك الحالي</span>
              </div>
              <div className="font-num text-sm sm:text-base font-bold text-slate-100 mt-0.5">
                {player.money.toLocaleString('en-US')} ج
              </div>
            </div>
            <div className="border-x border-slate-800">
              <div className="text-[11px] text-amber-300">سعر الشراء</div>
              <div className="font-num text-sm sm:text-base font-black text-amber-400 mt-0.5">
                -{price.toLocaleString('en-US')} ج
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">الرصيد بعد الشراء</div>
              <div
                className={`font-num text-sm sm:text-base font-extrabold mt-0.5 ${
                  canAfford ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {remaining.toLocaleString('en-US')} ج
              </div>
            </div>
          </div>

          {/* Rent Table by Development Level */}
          {space.type === 'property' && space.rents && space.buildingCosts && (
            <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs sm:text-sm">
              <div className="text-xs font-bold text-slate-400 pb-1 border-b border-slate-800">
                جدول الإيجارات لكل مستوى بناء
              </div>
              <div className="flex justify-between text-slate-300">
                <span>أرض فضاء (مرور أساسي)</span>
                <span className="font-num font-bold">{space.rents[0]} جنيه</span>
              </div>
              <div className="flex justify-between text-sky-300">
                <span>عند امتلاك المجموعة كاملة (×2)</span>
                <span className="font-num font-bold">{space.rents[0] * 2} جنيه</span>
              </div>
              <div className="flex justify-between items-center text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <BuildingShape level={1} size="xs" />
                  <span>جراج (تكلفة {space.buildingCosts[0]} ج)</span>
                </span>
                <span className="font-num font-bold">{space.rents[1]} جنيه</span>
              </div>
              <div className="flex justify-between items-center text-sky-300">
                <span className="flex items-center gap-1.5">
                  <BuildingShape level={2} size="xs" />
                  <span>استراحة (تكلفة {space.buildingCosts[1]} ج)</span>
                </span>
                <span className="font-num font-bold">{space.rents[2]} جنيه</span>
              </div>
              <div className="flex justify-between items-center text-amber-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <BuildingShape level={3} size="xs" />
                  <span>سوق (تكلفة {space.buildingCosts[2]} ج)</span>
                </span>
                <span className="font-num font-black">{space.rents[3]} جنيه</span>
              </div>
            </div>
          )}

          {space.type === 'station' && (
            <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm space-y-1">
              <div className="text-xs font-bold text-slate-400 pb-1 border-b border-slate-800">
                إيجار خطوط النقل السريع
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">1 خط / 2 خط / 3 خطوط / 4 خطوط</span>
                <span className="font-num font-bold text-amber-300">
                  25 / 50 / 100 / 200 ج
                </span>
              </div>
            </div>
          )}

          {space.type === 'utility' && (
            <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-300">
              إيجار محطة واحدة = <strong className="text-amber-300">4 × النرد</strong> · محطتان معاً
              = <strong className="text-amber-300">10 × النرد</strong>.
            </div>
          )}

          {/* Full Color Group Ownership Strip */}
          {groupMeta && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400">
                كروت المجموعة اللونية ({groupMeta.name}) — لمعرفة الملاك الحاليين:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {groupMeta.indices.map((idx) => {
                  const sp = BOARD_SPACES[idx];
                  const pr = state.properties[String(idx)];
                  const owner = pr?.ownerId ? ownerMap[pr.ownerId] : null;
                  const isThis = idx === spaceIndex;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl p-2 border text-right ${
                        isThis
                          ? 'bg-amber-500/10 border-amber-400/60'
                          : 'bg-[#0B111E] border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: groupMeta.hex }}
                        />
                        <span className="font-display font-bold text-xs text-white truncate">
                          {sp.name}
                        </span>
                      </div>
                      <div className="text-[11px] truncate">
                        {owner ? (
                          <span className="flex items-center gap-1 text-slate-200">
                            <span>{owner.token}</span>
                            <span className="truncate font-semibold">
                              {owner.id === player.id ? 'ملكك' : owner.name}
                            </span>
                          </span>
                        ) : (
                          <span className={isThis ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                            {isThis ? 'أنت هنا الآن' : 'متاحة للبنك'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              disabled={!canAfford}
              onClick={onBuy}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-35 text-slate-950 font-display font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {canAfford
                  ? `شراء ${space.name} بـ ${price} جنيه`
                  : 'رصيدك لا يكفي للشراء'}
              </span>
            </button>

            {settings.auctionEnabled ? (
              <button
                type="button"
                onClick={onAuction}
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Gavel className="w-4 h-4" />
                <span>مزاد علني</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSkip}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                تخطي
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
