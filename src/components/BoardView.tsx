import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BOARD_SPACES,
  COLOR_GROUP_META,
  getBoardGridPosition,
} from '../data/boardData';
import { hasFullColorGroup, JAIL_BAIL } from '../engine/gameEngine';
import { BoardSpace, ColorGroupId, GameState, Player, RoomSettings } from '../types/game';
import { soundEngine } from '../utils/sound';
import { CountryFlag } from './CountryFlag';
import { BuildingShape } from './BuildingShape';
import { Coins, Gavel, Hammer, KeyRound, Landmark, Lock, Scale, Sparkles, Timer } from 'lucide-react';

interface BoardViewProps {
  state: GameState;
  settings: RoomSettings;
  myPlayerId: string | null;
  isLocalMode: boolean;
  isRolling: boolean;
  turnSecondsLeft?: number | null;
  matchSecondsLeft?: number | null;
  onMovementStateChange?: (isMoving: boolean) => void;
  onSelectSpace: (spaceIndex: number) => void;
  onOpenBuildModal?: (spaceIndex: number) => void;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onStartAuction: (spaceIndex: number) => void;
  onEndTurn: () => void;
  onPayBail: () => void;
  onUseJailCard: () => void;
  onDeclareBankruptcy: () => void;
}

const GRID_TOTAL = 11.7; // 1.35 + 9 * 1.0 + 1.35

/**
 * Computes the exact percentage coordinates (x%, y%) in an LTR 11x11 board coordinate space
 * along the INNER RIM track (bordering the center arena) so player tokens NEVER cover
 * city names, country flags, prices, or building icons on any tile.
 */
function getTokenTrackAnchor(
  spaceIndex: number,
  slotIndex: number,
  slotTotal: number
): { leftPct: number; topPct: number } {
  const { row, col, side } = getBoardGridPosition(spaceIndex);

  const colStart = col === 1 ? 0 : col === 11 ? 10.35 : 1.35 + (col - 2);
  const colSize = col === 1 || col === 11 ? 1.35 : 1;
  const rowStart = row === 1 ? 0 : row === 11 ? 10.35 : 1.35 + (row - 2);
  const rowSize = row === 1 || row === 11 ? 1.35 : 1;

  const colCenter = colStart + colSize / 2;
  const rowCenter = rowStart + rowSize / 2;

  // Fan out multiple players cleanly without colliding with tile text
  const centeredOffset =
    slotTotal <= 1 ? 0 : slotIndex - (slotTotal - 1) / 2;
  const maxSpread = slotTotal > 5 ? 0.14 : 0.2;

  let x = colCenter;
  let y = rowCenter;

  if (side === 'bottom') {
    // Sit neatly along the inner rim right above the bottom row
    x = colCenter + centeredOffset * maxSpread;
    y = 10.35 - 0.19 - (slotTotal > 4 && slotIndex % 2 === 1 ? 0.16 : 0);
  } else if (side === 'top') {
    // Sit neatly along the inner rim right below the top row
    x = colCenter + centeredOffset * maxSpread;
    y = 1.35 + 0.19 + (slotTotal > 4 && slotIndex % 2 === 1 ? 0.16 : 0);
  } else if (side === 'left') {
    // Sit neatly along the inner rim right beside the left column
    x = 1.35 + 0.19 + (slotTotal > 4 && slotIndex % 2 === 1 ? 0.16 : 0);
    y = rowCenter + centeredOffset * maxSpread;
  } else if (side === 'right') {
    // Sit neatly along the inner rim right beside the right column
    x = 10.35 - 0.19 - (slotTotal > 4 && slotIndex % 2 === 1 ? 0.16 : 0);
    y = rowCenter + centeredOffset * maxSpread;
  } else {
    // Corner spaces (0, 10, 20, 30): arrange neatly around the inner corner pocket
    const angleStep = slotTotal > 1 ? centeredOffset * 0.22 : 0;
    const row2Offset = slotTotal > 5 && slotIndex % 2 === 1 ? 0.2 : 0;
    if (spaceIndex === 0) {
      // Bottom-Right corner -> inner pocket up-left
      x = 10.35 - 0.22 - row2Offset + angleStep * 0.55;
      y = 10.35 - 0.22 - row2Offset - angleStep * 0.55;
    } else if (spaceIndex === 10) {
      // Bottom-Left corner -> inner pocket up-right
      x = 1.35 + 0.22 + row2Offset + angleStep * 0.55;
      y = 10.35 - 0.22 - row2Offset + angleStep * 0.55;
    } else if (spaceIndex === 20) {
      // Top-Left corner -> inner pocket down-right
      x = 1.35 + 0.22 + row2Offset + angleStep * 0.55;
      y = 1.35 + 0.22 + row2Offset - angleStep * 0.55;
    } else {
      // Top-Right corner (30) -> inner pocket down-left
      x = 10.35 - 0.22 - row2Offset + angleStep * 0.55;
      y = 1.35 + 0.22 + row2Offset + angleStep * 0.55;
    }
  }

  return {
    leftPct: (x / GRID_TOTAL) * 100,
    topPct: (y / GRID_TOTAL) * 100,
  };
}

const DiceFace: React.FC<{ value: number; rolling: boolean }> = ({ value, rolling }) => {
  const pipsMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const active = pipsMap[value] || [4];

  return (
    <div
      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-600 to-red-800 border border-rose-400/50 shadow-lg shadow-black/50 p-2 grid grid-cols-3 grid-rows-3 gap-0.5 ${
        rolling ? 'animate-dice' : ''
      }`}
    >
      {Array.from({ length: 9 }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-center">
          {active.includes(idx) && (
            <span className="w-2 h-2 rounded-full bg-amber-50 shadow-inner" />
          )}
        </div>
      ))}
    </div>
  );
};

export const BoardView: React.FC<BoardViewProps> = ({
  state,
  settings,
  myPlayerId,
  isLocalMode,
  isRolling,
  turnSecondsLeft = null,
  matchSecondsLeft = null,
  onMovementStateChange,
  onSelectSpace,
  onOpenBuildModal,
  onRollDice,
  onBuyProperty,
  onStartAuction,
  onEndTurn,
  onPayBail,
  onUseJailCard,
  onDeclareBankruptcy,
}) => {
  const currentPlayer: Player | undefined = state.players[state.currentTurnIndex];
  const isMyTurn = Boolean(
    currentPlayer &&
      !currentPlayer.bankrupt &&
      (isLocalMode || currentPlayer.id === myPlayerId)
  );
  const currentSpace: BoardSpace | undefined = currentPlayer
    ? BOARD_SPACES[currentPlayer.position]
    : undefined;

  const canAffordCurrent =
    currentPlayer && currentSpace?.price ? currentPlayer.money >= currentSpace.price : false;
  const isInDebt = Boolean(currentPlayer && currentPlayer.money < 0);

  // Detect if the active player owns any complete upgradable color group
  const upgradableSpaceIndex = useMemo(() => {
    if (!currentPlayer || currentPlayer.bankrupt) return null;
    const candidateGroups: ColorGroupId[] = [
      'brown',
      'sky',
      'rose',
      'orange',
      'red',
      'gold',
      'emerald',
      'royal',
    ];
    // Prefer the space the player is currently standing on if it's in an upgradable full group
    if (
      currentSpace?.type === 'property' &&
      currentSpace.group &&
      hasFullColorGroup(state, currentPlayer.id, currentSpace.group)
    ) {
      const indices = COLOR_GROUP_META[currentSpace.group].indices;
      const anyMortgaged = indices.some((idx) => state.properties[String(idx)]?.mortgaged);
      const anyUpgradable = indices.some((idx) => (state.properties[String(idx)]?.houses || 0) < 3);
      if (!anyMortgaged && anyUpgradable) return currentSpace.index;
    }

    for (const grp of candidateGroups) {
      if (!hasFullColorGroup(state, currentPlayer.id, grp)) continue;
      const indices = COLOR_GROUP_META[grp].indices;
      const anyMortgaged = indices.some((idx) => state.properties[String(idx)]?.mortgaged);
      if (anyMortgaged) continue;
      const firstUpgradable = indices.find(
        (idx) => (state.properties[String(idx)]?.houses || 0) < 3
      );
      if (firstUpgradable !== undefined) return firstUpgradable;
    }
    return null;
  }, [currentPlayer, currentSpace, state]);

  const recentLogs = useMemo(() => state.logs.slice(0, 2), [state.logs]);

  // Smooth step-by-step animated token positions for ALL players (local & remote)
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of state.players) init[p.id] = p.position;
    return init;
  });
  const [movingIds, setMovingIds] = useState<Record<string, number>>({});
  const visualPosRef = useRef<Record<string, number>>(visualPositions);
  const timersRef = useRef<Record<string, number[]>>({});

  useEffect(() => {
    visualPosRef.current = visualPositions;
  }, [visualPositions]);

  useEffect(() => {
    const activeMovingCount = Object.keys(movingIds).length;
    onMovementStateChange?.(activeMovingCount > 0);
  }, [movingIds, onMovementStateChange]);

  useEffect(() => {
    // Clean up any players removed or initialized fresh
    for (const p of state.players) {
      if (p.bankrupt) continue;
      const target = p.position;
      const currentVisual = visualPosRef.current[p.id];

      if (currentVisual === undefined) {
        visualPosRef.current[p.id] = target;
        setVisualPositions((prev) => ({ ...prev, [p.id]: target }));
        continue;
      }

      if (currentVisual === target) continue;

      // Clear any pending timers for this player before scheduling the new path
      if (timersRef.current[p.id]) {
        timersRef.current[p.id].forEach((t) => window.clearTimeout(t));
        timersRef.current[p.id] = [];
      }

      const steps: number[] = [];
      const backwardDist = (currentVisual - target + 40) % 40;
      const forwardDist = (target - currentVisual + 40) % 40;

      if (p.inJail && target === 10) {
        // Direct jump to Jail
        steps.push(10);
      } else if (backwardDist > 0 && backwardDist <= 3) {
        // Backward card movement (e.g., step back 3 spaces)
        for (let i = 1; i <= backwardDist; i++) {
          steps.push((currentVisual - i + 40) % 40);
        }
      } else {
        // Standard clockwise step-by-step movement
        for (let i = 1; i <= forwardDist; i++) {
          steps.push((currentVisual + i) % 40);
        }
      }

      const stepMs = steps.length > 15 ? 60 : steps.length > 1 ? 130 : 180;
      const scheduled: number[] = [];

      steps.forEach((stepPos, idx) => {
        const tid = window.setTimeout(() => {
          visualPosRef.current[p.id] = stepPos;
          setVisualPositions((prev) => ({ ...prev, [p.id]: stepPos }));
          setMovingIds((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }));
          soundEngine.step();

          if (idx === steps.length - 1) {
            const doneTid = window.setTimeout(() => {
              setMovingIds((prev) => {
                const copy = { ...prev };
                delete copy[p.id];
                return copy;
              });
            }, 170);
            scheduled.push(doneTid);
          }
        }, idx * stepMs);
        scheduled.push(tid);
      });

      timersRef.current[p.id] = scheduled;
    }
  }, [state.players]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((arr) =>
        arr.forEach((t) => window.clearTimeout(t))
      );
    };
  }, []);

  const isAnyMoving = Object.keys(movingIds).length > 0;

  // Group players by their CURRENT VISUAL position so slot offsets update smoothly during hops
  const visualGroups = useMemo(() => {
    const map: Record<number, Player[]> = {};
    for (const p of state.players) {
      if (p.bankrupt) continue;
      const vPos = visualPositions[p.id] ?? p.position;
      if (!map[vPos]) map[vPos] = [];
      map[vPos].push(p);
    }
    return map;
  }, [state.players, visualPositions]);

  const ownerMap = useMemo(() => {
    const map: Record<string, Player> = {};
    for (const p of state.players) map[p.id] = p;
    return map;
  }, [state.players]);

  const activeVisualPos =
    currentPlayer && !currentPlayer.bankrupt
      ? visualPositions[currentPlayer.id] ?? currentPlayer.position
      : -1;

  const renderSpaceContent = (space: BoardSpace) => {
    const prop = state.properties[String(space.index)];
    const owner = prop?.ownerId ? ownerMap[prop.ownerId] : null;
    const groupMeta = space.group ? COLOR_GROUP_META[space.group] : null;
    const isCurrentPos = activeVisualPos === space.index;
    const hasOccupants = (visualGroups[space.index]?.length || 0) > 0;

    const pos = getBoardGridPosition(space.index);
    const isCorner = pos.side === 'corner';

    const renderSpecialIcon = () => {
      switch (space.type) {
        case 'go':
          return <span className="text-base sm:text-xl leading-none">🏛️</span>;
        case 'jail':
          return <span className="text-base sm:text-xl leading-none">⛓️</span>;
        case 'free_parking':
          return <span className="text-base sm:text-xl leading-none">🏆</span>;
        case 'go_to_jail':
          return <span className="text-base sm:text-xl leading-none">🚓</span>;
        case 'court':
          return <span className="text-sm sm:text-lg leading-none">⚖️</span>;
        case 'chance':
          return <span className="text-sm sm:text-lg leading-none">🎲</span>;
        case 'station':
          if (space.index === 5) return <span className="text-sm sm:text-base leading-none">🚌</span>;
          if (space.index === 15) return <span className="text-sm sm:text-base leading-none">✈️</span>;
          if (space.index === 25) return <span className="text-sm sm:text-base leading-none">🚢</span>;
          return <span className="text-sm sm:text-base leading-none">🚂</span>;
        case 'utility':
          return <span className="text-sm sm:text-base leading-none">⛽</span>;
        default:
          return null;
      }
    };

    return (
      <button
        key={space.index}
        type="button"
        dir="rtl"
        onClick={() => onSelectSpace(space.index)}
        style={{
          gridRow: pos.row,
          gridColumn: pos.col,
        }}
        className={`relative group flex flex-col justify-between overflow-hidden text-center transition-all duration-150 cursor-pointer select-none border border-slate-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
          isCorner
            ? 'bg-[#161F31] hover:bg-[#1E2940] p-1'
            : space.type === 'court'
            ? 'bg-[#221523] hover:bg-[#2E1C30]'
            : space.type === 'chance'
            ? 'bg-[#112238] hover:bg-[#162E4B]'
            : 'bg-[#121927] hover:bg-[#1A2438]'
        } ${
          isCurrentPos
            ? 'ring-2 ring-amber-400 bg-amber-500/15 z-10'
            : hasOccupants
            ? 'border-slate-500/80'
            : ''
        } ${prop?.mortgaged ? 'opacity-65' : ''}`}
        title={`${space.name}${space.price ? ` — ${space.price} جنيه` : ''}`}
      >
        {/* Top Color Group Header Bar + Geometric Building Token */}
        {space.type === 'property' && groupMeta && (
          <div
            className="w-full h-3 sm:h-3.5 shrink-0 flex items-center justify-center px-0.5"
            style={{ backgroundColor: groupMeta.hex }}
          >
            {prop && prop.houses > 0 && <BuildingShape level={prop.houses} size="xs" />}
          </div>
        )}

        {/* Main Tile Body — 100% Unobstructed Name, Flag & Price */}
        <div className="flex-1 flex flex-col items-center justify-center px-0.5 py-0.5 gap-0.5 min-h-0">
          {space.country ? (
            <CountryFlag code={space.country} className="w-5 h-3.5 sm:w-6 sm:h-4" />
          ) : (
            renderSpecialIcon()
          )}

          <span
            className={`font-display font-bold leading-tight text-slate-100 line-clamp-2 ${
              isCorner ? 'text-[9px] sm:text-[11px]' : 'text-[8px] sm:text-[10px]'
            }`}
          >
            {space.name}
          </span>

          {space.price ? (
            <span className="font-num text-[8px] sm:text-[9.5px] font-semibold text-amber-300/95 leading-none">
              {space.price} ج
            </span>
          ) : space.type === 'free_parking' &&
            settings.freeParkingJackpot &&
            state.treasuryPool > 0 ? (
            <span className="font-num text-[8px] sm:text-[9px] font-bold text-emerald-300 leading-none">
              {state.treasuryPool} ج
            </span>
          ) : space.type === 'go' ? (
            <span className="font-num text-[8px] sm:text-[9px] font-semibold text-emerald-300 leading-none">
              +{settings.goReward} ج
            </span>
          ) : null}
        </div>

        {/* Owner Marker Strip at Bottom */}
        {owner && (
          <div
            className="w-full h-1.5 shrink-0"
            style={{ backgroundColor: owner.color }}
            title={`المالك: ${owner.name}`}
          />
        )}

        {/* Mortgaged Overlay */}
        {prop?.mortgaged && (
          <div className="absolute inset-0 bg-slate-950/55 flex items-center justify-center pointer-events-none">
            <span className="text-[8px] sm:text-[9px] font-bold text-rose-300 bg-slate-950/90 px-1 py-0.5 rounded border border-rose-500/40">
              مرهون
            </span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-[780px] mx-auto aspect-square rounded-2xl p-1.5 sm:p-2 bg-gradient-to-br from-amber-500/30 via-slate-800 to-amber-700/25 shadow-2xl shadow-black/70 border border-amber-500/25">
      {/* LTR Coordinate Space for Exact Board Geometry; RTL preserved inside tiles & center */}
      <div
        dir="ltr"
        className="relative w-full h-full grid rounded-xl overflow-hidden bg-[#0D1320] border border-slate-700/80"
        style={{
          gridTemplateColumns: '1.35fr repeat(9, 1fr) 1.35fr',
          gridTemplateRows: '1.35fr repeat(9, 1fr) 1.35fr',
        }}
      >
        {BOARD_SPACES.map(renderSpaceContent)}

        {/* Center Arena of Classic Bank El-Hazz (9x9) with breathing lane for rim tokens */}
        <div
          dir="rtl"
          className="bank-grid-bg relative flex flex-col items-center justify-between p-5 sm:p-8 overflow-hidden border border-amber-500/20"
          style={{
            gridRow: '2 / 11',
            gridColumn: '2 / 11',
          }}
        >
          {/* Subtle inner rim track guide */}
          <div className="pointer-events-none absolute inset-4 sm:inset-5 border border-amber-500/15 rounded-xl" />

          {/* Top Row Inside Center: Classic Hazzak & Mahkama Card Decks + Club Treasury */}
          <div className="w-full flex items-start justify-between gap-2 z-10">
            <div className="bg-[#122640]/90 border border-sky-400/30 rounded-xl px-2.5 py-1.5 sm:py-2 text-center shadow-md min-w-[70px] sm:min-w-[90px]">
              <div className="text-sm sm:text-lg leading-none mb-0.5 sm:mb-1">🎲</div>
              <div className="font-display font-extrabold text-[10px] sm:text-xs text-sky-300">
                حظك
              </div>
              <div className="text-[9px] text-slate-400">كروت الحظ</div>
            </div>

            <div className="flex flex-col items-center bg-[#141D2E]/90 border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-md">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-300 font-semibold">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>خزينة نادي الحظ</span>
              </div>
              <div className="font-num text-xs sm:text-base font-bold text-amber-100 mt-0.5">
                {settings.freeParkingJackpot
                  ? `${state.treasuryPool.toLocaleString('en-US')} جنيه`
                  : 'معطّلة'}
              </div>
            </div>

            <div className="bg-[#291728]/90 border border-rose-400/30 rounded-xl px-2.5 py-1.5 sm:py-2 text-center shadow-md min-w-[70px] sm:min-w-[90px]">
              <div className="text-sm sm:text-lg leading-none mb-0.5 sm:mb-1">⚖️</div>
              <div className="font-display font-extrabold text-[10px] sm:text-xs text-amber-300">
                محاكمة
              </div>
              <div className="text-[9px] text-slate-400">كروت المحكمة</div>
            </div>
          </div>

          {/* Center Emblem: Classic Egyptian Heritage Crest + Dice */}
          <div className="flex flex-col items-center justify-center text-center my-auto z-10 gap-1.5 sm:gap-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-amber-400/90 mb-0.5">
                <Landmark className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-num text-[10px] sm:text-xs tracking-[0.2em] font-bold text-amber-300/90">
                  BANK EL-HAZZ
                </span>
                <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                بنك الحظ
              </h2>
              <p className="text-[10px] sm:text-[11px] text-amber-200/70 font-semibold">
                ورثة هاشم حامد · صنع في مصر
              </p>
            </div>

            {/* Legend of Classic Building Shapes */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1">
              <BuildingShape level={1} size="xs" showLabel />
              <span className="text-slate-600">·</span>
              <BuildingShape level={2} size="xs" showLabel />
              <span className="text-slate-600">·</span>
              <BuildingShape level={3} size="xs" showLabel />
            </div>

            {/* Dual Classic Red Dice */}
            <div className="flex items-center gap-3 py-0.5">
              <DiceFace value={state.dice[0]} rolling={isRolling} />
              <DiceFace value={state.dice[1]} rolling={isRolling} />
            </div>

            {/* Active Player Turn Status */}
            {currentPlayer && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs border border-white/30"
                  style={{ backgroundColor: currentPlayer.color }}
                >
                  {currentPlayer.token}
                </span>
                <span className="font-bold text-white">{currentPlayer.name}</span>
                <span className="text-slate-500">·</span>
                <span className="text-amber-300 font-semibold">
                  {isAnyMoving
                    ? 'يتحرك...'
                    : state.turnPhase === 'roll'
                    ? currentPlayer.inJail
                      ? 'في السجن'
                      : 'دور الرمي'
                    : state.turnPhase === 'buy_or_auction'
                    ? 'شراء أو مزاد'
                    : state.turnPhase === 'auction'
                    ? 'مزاد جارٍ'
                    : 'إنهاء الدور'}
                </span>
                {state.consecutiveDoubles > 0 && state.turnPhase === 'roll' && !isAnyMoving && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="text-emerald-300 text-xs font-bold">
                      دبل! ارمِ مجدداً
                    </span>
                  </>
                )}
                {turnSecondsLeft !== null && state.turnPhase !== 'finished' && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span
                      className={`font-num text-xs font-extrabold flex items-center gap-1 ${
                        turnSecondsLeft <= 10 ? 'text-rose-400' : 'text-sky-300'
                      }`}
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>{turnSecondsLeft}ث</span>
                    </span>
                  </>
                )}
                {matchSecondsLeft !== null && state.turnPhase !== 'finished' && (
                  <>
                    <span className="text-slate-500 hidden sm:inline">·</span>
                    <span
                      className={`hidden sm:inline font-num text-xs font-bold ${
                        matchSecondsLeft <= 60 ? 'text-rose-400' : 'text-amber-300'
                      }`}
                    >
                      {Math.floor(matchSecondsLeft / 60)}:
                      {String(matchSecondsLeft % 60).padStart(2, '0')}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Compact Live Recent Events Strip */}
            {recentLogs.length > 0 && (
              <div className="hidden sm:flex flex-col gap-0.5 w-full max-w-[360px] bg-slate-950/65 border border-slate-800/90 rounded-lg px-2.5 py-1.5 text-right">
                {recentLogs.map((entry, idx) => (
                  <div
                    key={entry.id}
                    title={entry.text}
                    className={`text-[11px] leading-snug truncate ${
                      idx === 0 ? 'text-slate-200 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {idx === 0 ? '• ' : '◦ '}
                    {entry.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Row Inside Center: Direct Action Controls */}
          <div className="w-full flex flex-wrap items-center justify-center gap-2 z-10">
            {state.turnPhase === 'finished' ? (
              <div className="text-amber-300 font-bold text-sm">انتهت اللعبة!</div>
            ) : !isMyTurn ? (
              <div className="text-xs sm:text-sm text-slate-400 bg-slate-900/75 border border-slate-800 rounded-xl px-4 py-2">
                بانتظار حركة <span className="text-slate-100 font-bold">{currentPlayer?.name}</span>...
              </div>
            ) : (
              <>
                {state.turnPhase === 'roll' && (
                  <>
                    <button
                      type="button"
                      disabled={isRolling || isAnyMoving}
                      onClick={onRollDice}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-display font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {currentPlayer?.inJail ? 'محاولة رمي دبل للخروج 🎲' : 'رمي النرد 🎲'}
                    </button>

                    {currentPlayer?.inJail && (
                      <>
                        <button
                          type="button"
                          disabled={
                            currentPlayer.money < (settings.jailBail || JAIL_BAIL) || isAnyMoving
                          }
                          onClick={onPayBail}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-200 border border-slate-600 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>كفالة {settings.jailBail || JAIL_BAIL} ج</span>
                        </button>
                        {currentPlayer.getOutOfJailCards > 0 && (
                          <button
                            type="button"
                            disabled={isAnyMoving}
                            onClick={onUseJailCard}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>بطاقة أمان</span>
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}

                {state.turnPhase === 'buy_or_auction' && currentSpace && (
                  <>
                    <button
                      type="button"
                      disabled={!canAffordCurrent || isAnyMoving}
                      onClick={onBuyProperty}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        شراء {currentSpace.name} ({currentSpace.price} ج)
                      </span>
                    </button>

                    {settings.auctionEnabled ? (
                      <button
                        type="button"
                        disabled={isAnyMoving}
                        onClick={() => onStartAuction(currentSpace.index)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 text-amber-300 border border-amber-400/40 font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Gavel className="w-4 h-4" />
                        <span>طرح في مزاد علني</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isAnyMoving}
                        onClick={onEndTurn}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-600 font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                      >
                        تخطي الشراء
                      </button>
                    )}
                  </>
                )}

                {state.turnPhase === 'end_turn' && (
                  <>
                    {isInDebt ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs text-rose-300 font-semibold">
                          رصيدك سالب ({currentPlayer?.money} ج) — ارهن مدينة أو بِع مباني
                        </span>
                        <button
                          type="button"
                          onClick={onDeclareBankruptcy}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                        >
                          إعلان الإفلاس
                        </button>
                      </div>
                    ) : (
                      <>
                        {upgradableSpaceIndex !== null && onOpenBuildModal && (
                          <button
                            type="button"
                            disabled={isAnyMoving}
                            onClick={() => onOpenBuildModal(upgradableSpaceIndex)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 text-emerald-200 border border-emerald-400/45 font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Hammer className="w-4 h-4" />
                            <span>بناء وترقية</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isAnyMoving}
                          onClick={onEndTurn}
                          className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-display font-extrabold text-sm shadow-lg shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          إنهاء الدور ⬅️
                        </button>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Floating Animated Player Tokens Layer (Glides along inner rim — NEVER covers city names!) */}
        <div className="pointer-events-none absolute inset-0 z-30">
          {state.players.map((p) => {
            if (p.bankrupt) return null;
            const vPos = visualPositions[p.id] ?? p.position;
            const group = visualGroups[vPos] || [p];
            const slotIndex = Math.max(
              0,
              group.findIndex((member) => member.id === p.id)
            );
            const { leftPct, topPct } = getTokenTrackAnchor(vPos, slotIndex, group.length);
            const isTurn = currentPlayer?.id === p.id;
            const hopTick = movingIds[p.id] || 0;
            const isMovingNow = hopTick > 0;

            return (
              <div
                key={p.id}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transition:
                    'left 135ms cubic-bezier(0.22, 1, 0.36, 1), top 135ms cubic-bezier(0.22, 1, 0.36, 1)',
                  zIndex: isMovingNow ? 50 : isTurn ? 40 : 30,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div
                  key={hopTick}
                  style={{
                    backgroundColor: p.color,
                    borderColor: isTurn ? '#FEF3C7' : '#0B0F17',
                  }}
                  className={`flex items-center justify-center rounded-full border-2 shadow-lg shadow-black/80 transition-transform duration-150 ${
                    isMovingNow ? 'animate-token-hop' : ''
                  } ${
                    group.length > 5
                      ? 'w-5 h-5 text-[10px]'
                      : 'w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm'
                  } ${isTurn ? 'scale-110 ring-2 ring-amber-300/80' : ''}`}
                  title={`${p.name} — ${BOARD_SPACES[vPos]?.name || ''}`}
                >
                  <span className="leading-none drop-shadow">{p.token}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
