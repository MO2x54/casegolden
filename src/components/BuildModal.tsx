import React, { useState } from 'react';
import { BOARD_SPACES, BUILDING_TIER_META, COLOR_GROUP_META } from '../data/boardData';
import { canBuildTier, getBuildingUpgradeCost } from '../engine/gameEngine';
import { GameState, Player } from '../types/game';
import { CountryFlag } from './CountryFlag';
import { BuildingShape } from './BuildingShape';
import { ArrowLeft, Hammer, X } from 'lucide-react';

interface BuildModalProps {
  initialSpaceIndex: number;
  state: GameState;
  player: Player;
  onBuildTier: (spaceIndex: number, targetLevel: 1 | 2 | 3) => void;
  onClose: () => void;
}

/**
 * Interactive Full-Group Build Modal ("المجموعة كاملة — ابني في عدن؟")
 * Appears automatically when landing on a city in a completed color group
 * or when opening build management. Shows current vs new rent and exact upgrade cost.
 */
export const BuildModal: React.FC<BuildModalProps> = ({
  initialSpaceIndex,
  state,
  player,
  onBuildTier,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSpaceIndex);

  const space = BOARD_SPACES[selectedIndex];
  if (!space || space.type !== 'property' || !space.group || !space.rents || !space.buildingCosts) {
    return null;
  }

  const groupMeta = COLOR_GROUP_META[space.group];
  const prop = state.properties[String(selectedIndex)];
  const currentLevel = prop?.houses || 0;
  const currentRent =
    currentLevel === 0 ? space.rents[0] * 2 : space.rents[currentLevel];

  const upgradeOptions: Array<{ level: 1 | 2 | 3; label: string; shapeLabel: string }> = [
    { level: 1, label: 'جراج', shapeLabel: 'مستطيل' },
    { level: 2, label: 'استراحة', shapeLabel: 'مثلث' },
    { level: 3, label: 'سوق', shapeLabel: 'مربع' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#121A29] border border-emerald-500/45 rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ backgroundColor: groupMeta.hex }}
        >
          <div className="flex items-center gap-3">
            {space.country && <CountryFlag code={space.country} className="w-9 h-6" />}
            <div>
              <div className="text-xs text-white/90 font-bold flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5" />
                <span>المجموعة كاملة ({groupMeta.name})</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-black text-white leading-tight">
                ابني في {space.name}؟
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/25 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* City Switcher within the Completed Color Group */}
          <div className="space-y-1.5">
            <div className="text-xs text-slate-400 font-semibold">
              اختر المدينة من مجموعتك الكاملة:
            </div>
            <div className="flex flex-wrap gap-2">
              {groupMeta.indices.map((idx) => {
                const sp = BOARD_SPACES[idx];
                const pr = state.properties[String(idx)];
                const lvl = pr?.houses || 0;
                const active = idx === selectedIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-[#0B111E] border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{sp.name}</span>
                    {lvl > 0 && <BuildingShape level={lvl} size="xs" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current City Status Bar */}
          <div className="flex items-center justify-between bg-[#0B111E] border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400">المستوى الحالي: </span>
              <strong className="text-white">
                {BUILDING_TIER_META[currentLevel]?.name}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">الإيجار الحالي: </span>
              <strong className="font-num text-sky-300">{currentRent} جنيه</strong>
            </div>
            <div>
              <span className="text-slate-400">رصيدك: </span>
              <strong className="font-num text-amber-300">
                {player.money.toLocaleString('en-US')} ج
              </strong>
            </div>
          </div>

          {/* Upgrade Cards: Current Rent vs New Rent + Cost */}
          {currentLevel >= 3 ? (
            <div className="bg-amber-500/10 border border-amber-500/35 rounded-xl p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-amber-300 font-display font-bold">
                <BuildingShape level={3} size="md" />
                <span>{space.name} وصلت لأعلى مستوى (سوق)!</span>
              </div>
              <p className="text-xs text-slate-300">
                إيجارها الحالي <strong className="font-num text-amber-300">{space.rents[3]} جنيه</strong>. يمكنك اختيار مدينة أخرى من المجموعة أعلاه.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upgradeOptions.map((opt) => {
                if (opt.level <= currentLevel) return null;
                const check = canBuildTier(state, player.id, selectedIndex, opt.level);
                const cost = getBuildingUpgradeCost(space, currentLevel, opt.level);
                const newRent = space.rents![opt.level];
                const rentGain = newRent - currentRent;

                return (
                  <div
                    key={opt.level}
                    className="bg-[#0B111E] border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BuildingShape level={opt.level} size="sm" />
                        <span className="font-display font-extrabold text-sm text-white">
                          {currentLevel > 0 ? `ترقية إلى ${opt.label}` : `بناء ${opt.label}`}
                        </span>
                        <span className="text-[11px] text-slate-400">({opt.shapeLabel})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-num">{currentRent} ج</span>
                        <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-num font-bold">
                          {newRent} جنيه
                        </span>
                        <span className="text-emerald-400/80 font-num text-[11px]">
                          (+{rentGain} ج)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!check.allowed}
                      onClick={() => onBuildTier(selectedIndex, opt.level)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-35 text-slate-950 font-display font-extrabold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      تأكيد البناء ({cost} ج)
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Dismiss */}
          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              مش دلوقتي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
