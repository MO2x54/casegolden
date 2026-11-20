import React, { useState } from 'react';
import { BOARD_SPACES, BUILDING_TIER_META, COLOR_GROUP_META } from '../data/boardData';
import {
  calculatePlayerNetWorth,
  canBuildTier,
  getBuildingUpgradeCost,
  getTierFullCost,
} from '../engine/gameEngine';
import { GameState, Player, RoomSettings } from '../types/game';
import { CountryFlag } from './CountryFlag';
import { BuildingShape } from './BuildingShape';
import { ArrowLeftRight, Gavel, ShieldAlert, Trophy, X } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. Title Deed ("سند الملكية") & Classic Building Upgrade Modal             */
/* -------------------------------------------------------------------------- */

interface PropertyModalProps {
  spaceIndex: number;
  state: GameState;
  settings: RoomSettings;
  activePlayerId: string | null;
  canLaunchAuction: boolean;
  onClose: () => void;
  onBuildTier: (spaceIndex: number, targetLevel: 1 | 2 | 3) => void;
  onSellBuilding: (spaceIndex: number) => void;
  onToggleMortgage: (spaceIndex: number) => void;
  onStartAuction: (spaceIndex: number) => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  spaceIndex,
  state,
  settings,
  activePlayerId,
  canLaunchAuction,
  onClose,
  onBuildTier,
  onSellBuilding,
  onToggleMortgage,
  onStartAuction,
}) => {
  const space = BOARD_SPACES[spaceIndex];
  if (!space) return null;

  const prop = state.properties[String(spaceIndex)];
  const owner = prop?.ownerId
    ? state.players.find((p) => p.id === prop.ownerId)
    : null;
  const groupMeta = space.group ? COLOR_GROUP_META[space.group] : null;
  const isOwner = Boolean(owner && activePlayerId && owner.id === activePlayerId);

  const currentLevel = prop?.houses || 0;
  const mortgageVal = space.price ? Math.floor(space.price * 0.5) : 0;
  const unmortgageCost = space.price ? Math.ceil(space.price * 0.55) : 0;
  const isPurchasable =
    space.type === 'property' || space.type === 'station' || space.type === 'utility';

  const tier1Check = activePlayerId
    ? canBuildTier(state, activePlayerId, spaceIndex, 1)
    : { allowed: false, cost: 0 };
  const tier2Check = activePlayerId
    ? canBuildTier(state, activePlayerId, spaceIndex, 2)
    : { allowed: false, cost: 0 };
  const tier3Check = activePlayerId
    ? canBuildTier(state, activePlayerId, spaceIndex, 3)
    : { allowed: false, cost: 0 };

  const sellRefund =
    currentLevel > 0
      ? Math.floor(
          (getTierFullCost(space, currentLevel) -
            getTierFullCost(space, currentLevel - 1)) *
            0.5
        )
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#121A29] border border-slate-700/90 rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Classic Title Deed Header */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: groupMeta ? groupMeta.hex : '#1E293B',
          }}
        >
          <div className="flex items-center gap-3">
            {space.country && <CountryFlag code={space.country} className="w-9 h-6" />}
            <div>
              <div className="text-[11px] text-white/80 font-bold">
                {isPurchasable ? 'سند ملكية — بنك الحظ' : 'بطاقة خانة'}
              </div>
              <h3 className="font-display text-xl font-black text-white leading-tight">
                {space.name}
              </h3>
              <p className="text-xs text-white/85">
                {groupMeta ? groupMeta.name : space.subtitle || 'خانة خاصة'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {isPurchasable ? (
            <>
              <div className="flex items-center justify-between text-sm border-b border-slate-800 pb-3">
                <span className="text-slate-400">سعر الشراء من البنك</span>
                <span className="font-num font-bold text-amber-300 text-base">
                  {space.price} جنيه
                </span>
              </div>

              <div className="flex items-center justify-between text-sm border-b border-slate-800 pb-3">
                <span className="text-slate-400">المالك والحالة</span>
                {owner ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{ backgroundColor: owner.color }}
                    >
                      {owner.token}
                    </span>
                    <span className="font-bold text-slate-100">{owner.name}</span>
                    {currentLevel > 0 && (
                      <BuildingShape level={currentLevel} size="sm" showLabel />
                    )}
                    {prop?.mortgaged && (
                      <span className="text-xs text-rose-400 font-bold">(مرهون)</span>
                    )}
                  </div>
                ) : (
                  <span className="text-emerald-400 font-bold">متاح — ملك البنك</span>
                )}
              </div>

              {/* Authentic Bank El-Hazz Rent & Building Schedule */}
              {space.type === 'property' && space.rents && space.buildingCosts && (
                <div className="space-y-2 text-xs sm:text-sm bg-[#0C121E] rounded-xl p-3.5 border border-slate-800">
                  <div className="flex justify-between text-slate-300">
                    <span>إيجار المرور الأساسي</span>
                    <span className="font-num font-semibold">{space.rents[0]} جنيه</span>
                  </div>
                  <div className="flex justify-between text-sky-300 pb-1.5 border-b border-slate-800/80">
                    <span>مع المجموعة اللونية كاملة (×2)</span>
                    <span className="font-num font-semibold">{space.rents[0] * 2} جنيه</span>
                  </div>

                  {/* Tier 1: جراج */}
                  <div
                    className={`flex items-center justify-between py-1 px-2 rounded-lg ${
                      currentLevel === 1 ? 'bg-emerald-500/15 border border-emerald-500/35' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 text-slate-200 font-semibold">
                      <BuildingShape level={1} size="sm" />
                      <span>إيجار جراج (مستطيل)</span>
                    </span>
                    <span className="font-num font-bold text-emerald-300">
                      {space.rents[1]} ج
                    </span>
                  </div>

                  {/* Tier 2: استراحة */}
                  <div
                    className={`flex items-center justify-between py-1 px-2 rounded-lg ${
                      currentLevel === 2 ? 'bg-sky-500/15 border border-sky-500/35' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 text-slate-200 font-semibold">
                      <BuildingShape level={2} size="sm" />
                      <span>إيجار استراحة (مثلث)</span>
                    </span>
                    <span className="font-num font-bold text-sky-300">
                      {space.rents[2]} ج
                    </span>
                  </div>

                  {/* Tier 3: سوق */}
                  <div
                    className={`flex items-center justify-between py-1 px-2 rounded-lg ${
                      currentLevel === 3 ? 'bg-amber-500/15 border border-amber-500/35' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 text-amber-200 font-bold">
                      <BuildingShape level={3} size="sm" />
                      <span>إيجار سوق (مربع)</span>
                    </span>
                    <span className="font-num font-black text-amber-300">
                      {space.rents[3]} ج
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-1">
                    <span>التكلفة:</span>
                    <span className="font-num">
                      جراج {space.buildingCosts[0]} ج · استراحة {space.buildingCosts[1]} ج · سوق{' '}
                      {space.buildingCosts[2]} ج
                    </span>
                  </div>
                </div>
              )}

              {space.type === 'station' && (
                <div className="space-y-1.5 text-sm bg-[#0C121E] rounded-xl p-3.5 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">خط نقل واحد</span>
                    <span className="font-num font-semibold">25 جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">خطان</span>
                    <span className="font-num font-semibold">50 جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">3 خطوط</span>
                    <span className="font-num font-semibold">100 جنيه</span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>4 خطوط نقل</span>
                    <span className="font-num">200 جنيه</span>
                  </div>
                </div>
              )}

              {space.type === 'utility' && (
                <div className="text-sm text-slate-300 bg-[#0C121E] rounded-xl p-3.5 border border-slate-800 leading-relaxed">
                  عند امتلاك محطة بنزين واحدة يكون رسم الخدمة{' '}
                  <strong className="text-amber-300">4 × مجموع النرد</strong>، وعند امتلاك محطتي
                  البنزين معاً يصبح <strong className="text-amber-300">10 × مجموع النرد</strong>.
                </div>
              )}

              {/* Owner Management Actions: Build / Upgrade (pay difference) / Sell / Mortgage */}
              {isOwner && prop && (
                <div className="space-y-2.5 pt-1">
                  {space.type === 'property' && space.buildingCosts && (
                    <div className="space-y-2">
                      {currentLevel < 3 && (
                        <div className="grid grid-cols-1 gap-2">
                          {currentLevel < 1 && (
                            <button
                              type="button"
                              disabled={!tier1Check.allowed}
                              onClick={() => onBuildTier(spaceIndex, 1)}
                              className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 text-emerald-200 border border-emerald-500/40 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <BuildingShape level={1} size="sm" />
                                <span>بناء جراج</span>
                              </span>
                              <span className="font-num">
                                {getBuildingUpgradeCost(space, currentLevel, 1)} جنيه
                              </span>
                            </button>
                          )}

                          {currentLevel < 2 && (
                            <button
                              type="button"
                              disabled={!tier2Check.allowed}
                              onClick={() => onBuildTier(spaceIndex, 2)}
                              className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 text-sky-200 border border-sky-500/40 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <BuildingShape level={2} size="sm" />
                                <span>
                                  {currentLevel === 1
                                    ? 'ترقية من جراج إلى استراحة (فرق التكلفة)'
                                    : 'بناء استراحة مباشرة'}
                                </span>
                              </span>
                              <span className="font-num">
                                {getBuildingUpgradeCost(space, currentLevel, 2)} جنيه
                              </span>
                            </button>
                          )}

                          {currentLevel < 3 && (
                            <button
                              type="button"
                              disabled={!tier3Check.allowed}
                              onClick={() => onBuildTier(spaceIndex, 3)}
                              className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-display font-extrabold text-xs sm:text-sm transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <BuildingShape level={3} size="sm" />
                                <span>
                                  {currentLevel > 0
                                    ? `ترقية من ${BUILDING_TIER_META[currentLevel].name} إلى سوق (فرق التكلفة)`
                                    : 'بناء سوق مباشرة'}
                                </span>
                              </span>
                              <span className="font-num">
                                {getBuildingUpgradeCost(space, currentLevel, 3)} جنيه
                              </span>
                            </button>
                          )}
                        </div>
                      )}

                      {!tier3Check.allowed && tier3Check.reason && currentLevel < 3 && (
                        <p className="text-xs text-slate-400 text-center">{tier3Check.reason}</p>
                      )}

                      {currentLevel > 0 && (
                        <button
                          type="button"
                          onClick={() => onSellBuilding(spaceIndex)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                        >
                          بيع {BUILDING_TIER_META[currentLevel].name} واسترداد {sellRefund} جنيه
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleMortgage(spaceIndex)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
                      prop.mortgaged
                        ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                        : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {prop.mortgaged
                      ? `فك الرهن مقابل ${unmortgageCost} جنيه`
                      : `رهن المدينة والحصول على ${mortgageVal} جنيه`}
                  </button>
                </div>
              )}

              {/* Unowned Property -> Direct Public Auction Trigger */}
              {!owner && settings.auctionEnabled && canLaunchAuction && (
                <button
                  type="button"
                  onClick={() => {
                    onStartAuction(spaceIndex);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold text-sm transition-colors cursor-pointer"
                >
                  <Gavel className="w-4 h-4" />
                  <span>طرح "{space.name}" في مزاد علني الآن</span>
                </button>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-300 leading-relaxed space-y-2">
              {space.type === 'go' && (
                <p>
                  نقطة انطلاق بنك الحظ! كل لاعب يمر بها أو يقف عليها يتقاضى{' '}
                  <strong className="text-amber-300">{settings.goReward} جنيه</strong>.
                </p>
              )}
              {space.type === 'court' && (
                <p>
                  خانة المحاكمة ⚖️: يسحب اللاعب كارت محاكمة يظهر للجميع في الغرفة (غرامات، تعويضات،
                  براءة، بطاقة أمان، أو أمر بالحبس).
                </p>
              )}
              {space.type === 'chance' && (
                <p>
                  خانة حظك 🎲: يسحب اللاعب كارت حظك يظهر لجميع اللاعبين في الغرفة (مكافآت، انتقال
                  لمدن، هدايا، أو بطاقة أمان).
                </p>
              )}
              {space.type === 'free_parking' && (
                <p>
                  <strong>نادي الحظ:</strong> استراحة مجانية!{' '}
                  {settings.freeParkingJackpot
                    ? `الخزينة الحالية تحتوي على ${state.treasuryPool} جنيه من غرامات المحاكمة ويحصل عليها من يقف هنا.`
                    : 'الاستراحة للراحة فقط دون تجميع غرامات.'}
                </p>
              )}
              {space.type === 'jail' && (
                <p>
                  السجن: إذا وقفت هنا بالرمي العادي فأنت في زيارة فقط. أما المسجون فيخرج برمي دبل،
                  أو كفالة 50 جنيه، أو بطاقة أمان، أو بعد قضاء 3 أدوار.
                </p>
              )}
              {space.type === 'go_to_jail' && (
                <p>يتوجه اللاعب فوراً إلى السجن دون المرور بنقطة البداية.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. Live Public Auction Modal                                               */
/* -------------------------------------------------------------------------- */

interface AuctionModalProps {
  state: GameState;
  myPlayerId: string | null;
  isLocalMode: boolean;
  onBid: (playerId: string, increment: number) => void;
  onPass: (playerId: string) => void;
}

export const AuctionModal: React.FC<AuctionModalProps> = ({
  state,
  myPlayerId,
  isLocalMode,
  onBid,
  onPass,
}) => {
  const auc = state.activeAuction;
  const activePlayers = state.players.filter((p) => !p.bankrupt);

  const [localBidderId, setLocalBidderId] = useState<string>(
    () => activePlayers[0]?.id || ''
  );

  if (!auc) return null;

  const space = BOARD_SPACES[auc.propertyIndex];
  const groupMeta = space?.group ? COLOR_GROUP_META[space.group] : null;

  const actingPlayerId = isLocalMode
    ? activePlayers.some((p) => p.id === localBidderId && !auc.passedPlayerIds.includes(p.id))
      ? localBidderId
      : activePlayers.find((p) => !auc.passedPlayerIds.includes(p.id))?.id || ''
    : myPlayerId || '';

  const actingPlayer = state.players.find((p) => p.id === actingPlayerId);
  const hasPassed = auc.passedPlayerIds.includes(actingPlayerId);
  const isAlreadyHighest = auc.highestBidderId === actingPlayerId;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#121A29] border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl">
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: groupMeta ? groupMeta.hex : '#B45309' }}
        >
          <div className="flex items-center gap-3">
            <Gavel className="w-6 h-6 text-white" />
            <div>
              <p className="text-xs text-white/85 font-semibold">مزاد علني مباشر</p>
              <h3 className="font-display text-xl font-black text-white flex items-center gap-2">
                {space.country && <CountryFlag code={space.country} className="w-7 h-5" />}
                <span>{space.name}</span>
              </h3>
            </div>
          </div>
          <div className="text-left">
            <div className="text-[11px] text-white/80">السعر الرسمي</div>
            <div className="font-num font-bold text-white">{space.price} جنيه</div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-[#0B111E] border border-amber-500/25 rounded-xl p-4 text-center space-y-1">
            <div className="text-xs text-slate-400">أعلى مزايدة حالية</div>
            <div className="font-num text-3xl font-black text-amber-400">
              {auc.currentBid.toLocaleString('en-US')} جنيه
            </div>
            <div className="text-sm text-slate-200">
              {auc.highestBidderName ? (
                <>
                  أعلى مزايد: <strong className="text-emerald-400">{auc.highestBidderName}</strong>
                </>
              ) : (
                <span className="text-slate-400">لا توجد مزايدات بعد — افتتح المزاد!</span>
              )}
            </div>
          </div>

          {isLocalMode && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">
                اختر اللاعب المزايد حالياً (وضع اللعب المحلي):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {activePlayers.map((p) => {
                  const passed = auc.passedPlayerIds.includes(p.id);
                  const selected = p.id === actingPlayerId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={passed}
                      onClick={() => setLocalBidderId(p.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        passed
                          ? 'bg-slate-900/50 text-slate-600 line-through cursor-not-allowed'
                          : selected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <span>{p.token}</span>
                      <span>{p.name}</span>
                      <span className="font-num opacity-80">({p.money})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-xs text-slate-400">حالة المشاركين في المزاد</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {activePlayers.map((p) => {
                const passed = auc.passedPlayerIds.includes(p.id);
                const winning = auc.highestBidderId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                      winning
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : passed
                        ? 'bg-slate-900/60 border-slate-800 text-slate-500 line-through'
                        : 'bg-slate-800/70 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{p.token}</span>
                    <span>{p.name}</span>
                    {winning && <span className="font-bold">★</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {actingPlayer && !hasPassed ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  المزايدة باسم: <strong className="text-slate-100">{actingPlayer.name}</strong>
                </span>
                <span className="font-num text-amber-300">
                  رصيدك: {actingPlayer.money.toLocaleString('en-US')} جنيه
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 500].map((inc) => {
                  const nextAmount = auc.currentBid + inc;
                  const canAfford = actingPlayer.money >= nextAmount;
                  return (
                    <button
                      key={inc}
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onBid(actingPlayer.id, inc)}
                      className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-35 text-slate-950 font-num font-extrabold text-sm transition-colors cursor-pointer"
                    >
                      +{inc} ج
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={isAlreadyHighest}
                onClick={() => onPass(actingPlayer.id)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/70 hover:text-rose-200 hover:border-rose-500/40 disabled:opacity-35 text-slate-300 border border-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                {isAlreadyHighest
                  ? 'أنت صاحب أعلى عرض حالياً — بانتظار البقية'
                  : 'انسحاب من المزاد'}
              </button>
            </div>
          ) : (
            <div className="text-center text-sm text-slate-400 py-2">
              لقد انسحبت من هذا المزاد — بانتظار حسم المزايدين المتبقين...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Synchronized "حظك" & "محاكمة ⚖️" Card Modal                             */
/* -------------------------------------------------------------------------- */

interface CardModalProps {
  state: GameState;
  onDismiss: () => void;
}

const CARD_EFFECT_LABEL: Record<string, { label: string; tone: string }> = {
  gain_money: { label: 'مكافأة مالية', tone: 'text-emerald-300' },
  pay_money: { label: 'غرامة مالية', tone: 'text-rose-300' },
  move_to: { label: 'انتقال على الرقعة', tone: 'text-sky-300' },
  move_relative: { label: 'تحريك خطوات', tone: 'text-sky-300' },
  go_to_jail: { label: 'أمر بالسجن', tone: 'text-rose-400' },
  jail_free_card: { label: 'بطاقة أمان (خروج من السجن)', tone: 'text-amber-300' },
  collect_from_all: { label: 'تحصيل من اللاعبين', tone: 'text-emerald-300' },
  pay_to_all: { label: 'دفع للاعبين', tone: 'text-rose-300' },
  repairs: { label: 'صيانة مبانٍ', tone: 'text-amber-300' },
};

export const CardModal: React.FC<CardModalProps> = ({ state, onDismiss }) => {
  const active = state.activeCard;
  if (!active) return null;

  const isHazzak = active.card.deck === 'hazzak';
  const effectMeta = CARD_EFFECT_LABEL[active.card.effectType] || {
    label: 'حدث خاص',
    tone: 'text-amber-300',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onDismiss}
    >
      <div
        className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-2 ${
          isHazzak
            ? 'bg-[#0F1E33] border-sky-400/60'
            : 'bg-[#241422] border-amber-400/65'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-5 py-4 text-center ${
            isHazzak
              ? 'bg-gradient-to-l from-sky-600 to-blue-700'
              : 'bg-gradient-to-l from-rose-700 to-amber-700'
          }`}
        >
          <div className="text-3xl mb-1">{isHazzak ? '🎲' : '⚖️'}</div>
          <div className="font-display font-black text-xl text-white">
            {isHazzak ? 'كارت حظّك' : 'بطاقة محاكمة'}
          </div>
          <div className="text-xs text-white/85 mt-0.5">
            سحبه اللاعب: {active.drawnByPlayerName}
          </div>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs font-bold">
            <span className={effectMeta.tone}>{effectMeta.label}</span>
            {typeof active.card.amount === 'number' && active.card.amount > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="font-num text-amber-300">
                  {active.card.amount.toLocaleString('en-US')} جنيه
                </span>
              </>
            )}
          </div>

          <h4 className="font-display text-2xl font-extrabold text-white">
            {active.card.title}
          </h4>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            {active.card.description}
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold text-base transition-colors cursor-pointer"
          >
            تمام
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Trade Offer Builder Modal                                               */
/* -------------------------------------------------------------------------- */

interface TradeModalProps {
  state: GameState;
  fromPlayer: Player;
  initialTargetId?: string;
  onClose: () => void;
  onSubmitTrade: (offer: {
    fromPlayerId: string;
    fromPlayerName: string;
    toPlayerId: string;
    toPlayerName: string;
    offerCash: number;
    requestCash: number;
    offerProperties: number[];
    requestProperties: number[];
  }) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  state,
  fromPlayer,
  initialTargetId,
  onClose,
  onSubmitTrade,
}) => {
  const targets = state.players.filter(
    (p) => !p.bankrupt && p.id !== fromPlayer.id
  );
  const [targetId, setTargetId] = useState<string>(
    initialTargetId && targets.some((t) => t.id === initialTargetId)
      ? initialTargetId
      : targets[0]?.id || ''
  );
  const [offerCash, setOfferCash] = useState<number>(0);
  const [requestCash, setRequestCash] = useState<number>(0);
  const [offerProps, setOfferProps] = useState<number[]>([]);
  const [requestProps, setRequestProps] = useState<number[]>([]);

  const targetPlayer = targets.find((t) => t.id === targetId);

  const myTradableProps = Object.entries(state.properties)
    .filter(([, p]) => p.ownerId === fromPlayer.id && p.houses === 0)
    .map(([idx]) => Number(idx));

  const theirTradableProps = Object.entries(state.properties)
    .filter(([, p]) => p.ownerId === targetId && p.houses === 0)
    .map(([idx]) => Number(idx));

  const toggleItem = (list: number[], setList: (v: number[]) => void, idx: number) => {
    setList(list.includes(idx) ? list.filter((i) => i !== idx) : [...list, idx]);
  };

  const canSubmit =
    Boolean(targetPlayer) &&
    offerCash >= 0 &&
    requestCash >= 0 &&
    offerCash <= fromPlayer.money &&
    (offerCash > 0 || requestCash > 0 || offerProps.length > 0 || requestProps.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121A29] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="w-5 h-5 text-amber-400" />
            <h3 className="font-display text-lg font-extrabold text-white">
              عقد صفقة تبادل (كاش + مدن)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              اختر اللاعب الطرف الثاني في الصفقة
            </label>
            <div className="flex flex-wrap gap-2">
              {targets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTargetId(t.id);
                    setRequestProps([]);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${
                    t.id === targetId
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{t.token}</span>
                  <span>{t.name}</span>
                  <span className="font-num text-xs text-slate-400">({t.money} ج)</span>
                </button>
              ))}
            </div>
          </div>

          {targetPlayer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0C121E] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="font-display font-bold text-sm text-emerald-400">
                  ما تعرضه أنت ({fromPlayer.name})
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    مبلغ كاش (جنيه) — متاح {fromPlayer.money}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, fromPlayer.money)}
                    step={10}
                    value={offerCash}
                    onChange={(e) => setOfferCash(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-num text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-slate-400">مدنك (بدون مباني):</div>
                  {myTradableProps.length === 0 ? (
                    <div className="text-xs text-slate-500">لا توجد مدن متاحة للتبادل</div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {myTradableProps.map((idx) => {
                        const sp = BOARD_SPACES[idx];
                        const checked = offerProps.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleItem(offerProps, setOfferProps, idx)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                              checked
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {sp.country && <CountryFlag code={sp.country} className="w-4 h-3" />}
                              <span>{sp.name}</span>
                            </span>
                            <span className="font-num text-amber-300">{sp.price} ج</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#0C121E] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="font-display font-bold text-sm text-sky-400">
                  ما تطلبه من ({targetPlayer.name})
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    مبلغ كاش (جنيه) — متاح {targetPlayer.money}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, targetPlayer.money)}
                    step={10}
                    value={requestCash}
                    onChange={(e) => setRequestCash(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-num text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-slate-400">مدنه (بدون مباني):</div>
                  {theirTradableProps.length === 0 ? (
                    <div className="text-xs text-slate-500">لا توجد مدن متاحة لديه</div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {theirTradableProps.map((idx) => {
                        const sp = BOARD_SPACES[idx];
                        const checked = requestProps.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleItem(requestProps, setRequestProps, idx)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                              checked
                                ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {sp.country && <CountryFlag code={sp.country} className="w-4 h-3" />}
                              <span>{sp.name}</span>
                            </span>
                            <span className="font-num text-amber-300">{sp.price} ج</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={!canSubmit || !targetPlayer}
              onClick={() => {
                if (!targetPlayer) return;
                onSubmitTrade({
                  fromPlayerId: fromPlayer.id,
                  fromPlayerName: fromPlayer.name,
                  toPlayerId: targetPlayer.id,
                  toPlayerName: targetPlayer.name,
                  offerCash,
                  requestCash,
                  offerProperties: offerProps,
                  requestProperties: requestProps,
                });
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-display font-extrabold text-sm transition-colors cursor-pointer"
            >
              إرسال عرض الصفقة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. Incoming Active Trade Banner                                            */
/* -------------------------------------------------------------------------- */

interface IncomingTradeBannerProps {
  state: GameState;
  myPlayerId: string | null;
  isLocalMode: boolean;
  onRespond: (responderId: string, accept: boolean) => void;
}

export const IncomingTradeBanner: React.FC<IncomingTradeBannerProps> = ({
  state,
  myPlayerId,
  isLocalMode,
  onRespond,
}) => {
  const trade = state.activeTrade;
  if (!trade) return null;

  const isRecipient = isLocalMode || myPlayerId === trade.toPlayerId;
  const isProposer = !isLocalMode && myPlayerId === trade.fromPlayerId;

  return (
    <div className="bg-[#162033] border border-amber-400/50 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-300 font-display font-extrabold text-sm">
          <ArrowLeftRight className="w-4 h-4" />
          <span>
            عرض صفقة من {trade.fromPlayerName} إلى {trade.toPlayerName}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#0C121E] rounded-xl p-3 border border-slate-800">
        <div>
          <div className="text-emerald-400 font-bold mb-1">يعرض {trade.fromPlayerName}:</div>
          {trade.offerCash > 0 && (
            <div className="font-num text-amber-200">+ {trade.offerCash} جنيه</div>
          )}
          {trade.offerProperties.map((idx) => (
            <div key={idx} className="text-slate-200">
              • {BOARD_SPACES[idx]?.name}
            </div>
          ))}
          {trade.offerCash === 0 && trade.offerProperties.length === 0 && (
            <div className="text-slate-500">لا شيء</div>
          )}
        </div>
        <div>
          <div className="text-sky-400 font-bold mb-1">مقابل من {trade.toPlayerName}:</div>
          {trade.requestCash > 0 && (
            <div className="font-num text-amber-200">+ {trade.requestCash} جنيه</div>
          )}
          {trade.requestProperties.map((idx) => (
            <div key={idx} className="text-slate-200">
              • {BOARD_SPACES[idx]?.name}
            </div>
          ))}
          {trade.requestCash === 0 && trade.requestProperties.length === 0 && (
            <div className="text-slate-500">لا شيء</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        {isRecipient && (
          <>
            <button
              type="button"
              onClick={() => onRespond(trade.toPlayerId, true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer"
            >
              قبول الصفقة ✓
            </button>
            <button
              type="button"
              onClick={() => onRespond(trade.toPlayerId, false)}
              className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/40 font-bold text-xs sm:text-sm cursor-pointer"
            >
              رفض الصفقة
            </button>
          </>
        )}
        {isProposer && (
          <button
            type="button"
            onClick={() => onRespond(trade.fromPlayerId, false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
          >
            إلغاء العرض
          </button>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 6. Victory Modal                                                           */
/* -------------------------------------------------------------------------- */

interface VictoryModalProps {
  state: GameState;
  onExitToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ state, onExitToMenu }) => {
  if (state.turnPhase !== 'finished' || !state.winnerId) return null;

  const winner = state.players.find((p) => p.id === state.winnerId);
  const ranked = [...state.players].sort((a, b) => {
    if (a.id === state.winnerId) return -1;
    if (b.id === state.winnerId) return 1;
    return calculatePlayerNetWorth(state, b.id) - calculatePlayerNetWorth(state, a.id);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121A29] border-2 border-amber-400/70 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
          <Trophy className="w-9 h-9 text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-300">بطل بنك الحظ الكلاسيكي</p>
          <h3 className="font-display text-3xl font-black text-white mt-1">
            {winner?.token} {winner?.name}
          </h3>
        </div>

        <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-3 space-y-2 text-right">
          {ranked.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-slate-900/60"
            >
              <div className="flex items-center gap-2">
                <span className="font-num text-xs text-slate-400 w-5">#{idx + 1}</span>
                <span>{p.token}</span>
                <span
                  className={
                    p.bankrupt ? 'text-slate-500 line-through' : 'font-bold text-slate-100'
                  }
                >
                  {p.name}
                </span>
              </div>
              <span className="font-num text-xs font-bold text-amber-300">
                {p.bankrupt
                  ? 'مفلس'
                  : `${calculatePlayerNetWorth(state, p.id).toLocaleString('en-US')} ج`}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onExitToMenu}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold text-sm transition-colors cursor-pointer"
        >
          العودة للقائمة الرئيسية
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 7. Classic Bank El-Hazz Rules Modal                                        */
/* -------------------------------------------------------------------------- */

export const RulesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="w-full max-w-lg bg-[#121A29] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="font-display text-lg font-extrabold text-white">
            قواعد بنك الحظ الكلاسيكي (النسخة المصرية)
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 overflow-y-auto space-y-3 text-sm text-slate-300 leading-relaxed">
        <p>
          <strong className="text-amber-300">1. البداية والعملة:</strong> يبدأ كل لاعب برصيد افتراضي{' '}
          <strong>1,200 جنيه</strong> ويتقاضى <strong>350 جنيه</strong> عند المرور بنقطة البداية.
        </p>
        <p>
          <strong className="text-amber-300">2. البناء (جراج / استراحة / سوق):</strong> عند امتلاك
          المجموعة اللونية كاملة يمكنك بناء <strong>جراج (مستطيل ▬)</strong> أو{' '}
          <strong>استراحة (مثلث ▲)</strong> أو <strong>سوق (مربع ■)</strong>، والترقية من مستوى
          لأعلى بدفع <strong>فرق التكلفة فقط</strong> للبنك.
        </p>
        <p>
          <strong className="text-amber-300">3. كروت حظك ومحاكمة ⚖️:</strong> الوقوف على خانات
          "حظك" أو "محاكمة" يسحب كارتاً يظهر لجميع اللاعبين في الغرفة. غرامات المحاكمة تتجمع في
          خزينة <strong>نادي الحظ</strong> (عند تفعيلها).
        </p>
        <p>
          <strong className="text-amber-300">4. المزادات والصفقات:</strong> اضغط على أي مدينة غير
          مملوكة (أو ارفض الشراء) لطرحها في مزاد علني مباشر (+50، +100، +500 جنيه). كما يمكنك تبادل
          الكاش والمدن عبر الصفقات أو رهن المدن لتوفير السيولة.
        </p>
        <p>
          <strong className="text-amber-300">5. الدبل والسجن:</strong> الدبل يمنحك رمية إضافية، و3
          دبلات متتالية تُدخلك السجن. الخروج من السجن يكون بالدبل أو كفالة 50 جنيه أو بطاقة الأمان
          أو بعد 3 أدوار.
        </p>
      </div>
    </div>
  </div>
);
