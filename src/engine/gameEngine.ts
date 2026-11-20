import {
  BOARD_SPACES,
  BUILDING_TIER_META,
  COLOR_GROUP_META,
  HAZZAK_CARDS,
  MAHKAMA_CARDS,
} from '../data/boardData';
import {
  BoardSpace,
  ColorGroupId,
  GameLogEntry,
  GameState,
  LogCategory,
  LuckCard,
  Player,
  PropertyState,
  RoomSettings,
  TradeOffer,
} from '../types/game';

export const DEFAULT_SETTINGS: RoomSettings = {
  startingMoney: 1200,
  goReward: 350,
  freeParkingJackpot: true,
  maxPlayers: 10,
  auctionEnabled: true,
  turnTimeLimitSec: 0,
  gameDurationMin: 0,
  jailBail: 50,
  doubleGoBonus: false,
};

export const JAIL_BAIL = 50;

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function addLog(
  logs: GameLogEntry[],
  text: string,
  category: LogCategory = 'system'
): GameLogEntry[] {
  return [
    {
      id: makeId('log'),
      text,
      category,
      timestamp: Date.now(),
    },
    ...logs,
  ].slice(0, 80);
}

export function createInitialProperties(): Record<string, PropertyState> {
  const props: Record<string, PropertyState> = {};
  for (const space of BOARD_SPACES) {
    if (
      space.type === 'property' ||
      space.type === 'station' ||
      space.type === 'utility'
    ) {
      props[String(space.index)] = {
        ownerId: null,
        houses: 0,
        mortgaged: false,
      };
    }
  }
  return props;
}

export function createInitialGameState(
  players: Player[],
  settings: RoomSettings
): GameState {
  const initializedPlayers = players.map((p) => ({
    ...p,
    money: settings.startingMoney,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailCards: 0,
    bankrupt: false,
  }));

  return {
    players: initializedPlayers,
    properties: createInitialProperties(),
    currentTurnIndex: 0,
    turnPhase: 'roll',
    dice: [1, 1],
    consecutiveDoubles: 0,
    treasuryPool: 0,
    logs: [
      {
        id: makeId('start'),
        text: `بدأت لعبة بنك الحظ الكلاسيكي! رصيد البداية ${settings.startingMoney} جنيه ومكافأة البداية ${settings.goReward} جنيه.`,
        category: 'system',
        timestamp: Date.now(),
      },
    ],
    activeCard: null,
    activeAuction: null,
    activeTrade: null,
    winnerId: null,
    turnCounter: 1,
    lastActionId: 'init',
    matchStartedAt: Date.now(),
    turnStartedAt: Date.now(),
  };
}

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function hasFullColorGroup(
  state: GameState,
  playerId: string,
  group: ColorGroupId
): boolean {
  const meta = COLOR_GROUP_META[group];
  if (!meta) return false;
  return meta.indices.every((idx) => {
    const prop = state.properties[String(idx)];
    return prop && prop.ownerId === playerId;
  });
}

export function countOwnedInGroup(
  state: GameState,
  playerId: string,
  group: ColorGroupId
): number {
  const meta = COLOR_GROUP_META[group];
  if (!meta) return 0;
  return meta.indices.filter((idx) => {
    const prop = state.properties[String(idx)];
    return prop && prop.ownerId === playerId && !prop.mortgaged;
  }).length;
}

/**
 * Returns the cumulative cost of a building level (0 -> 0, 1 -> garage, 2 -> rest, 3 -> market).
 */
export function getTierFullCost(space: BoardSpace, level: number): number {
  if (!space.buildingCosts || level <= 0 || level > 3) return 0;
  return space.buildingCosts[level - 1] || 0;
}

/**
 * Exact Bank El-Hazz upgrade cost: pays only the difference between target tier and current tier.
 */
export function getBuildingUpgradeCost(
  space: BoardSpace,
  currentLevel: number,
  targetLevel: 1 | 2 | 3
): number {
  if (targetLevel <= currentLevel) return 0;
  return Math.max(0, getTierFullCost(space, targetLevel) - getTierFullCost(space, currentLevel));
}

export function calculateRent(
  state: GameState,
  spaceIndex: number,
  diceTotal: number
): number {
  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[String(spaceIndex)];
  if (!space || !prop || !prop.ownerId || prop.mortgaged) return 0;

  if (space.type === 'station') {
    const ownedCount = countOwnedInGroup(state, prop.ownerId, 'station');
    const rents = space.rents || [25, 50, 100, 200];
    return rents[Math.max(0, Math.min(rents.length - 1, ownedCount - 1))];
  }

  if (space.type === 'utility') {
    const ownedCount = countOwnedInGroup(state, prop.ownerId, 'utility');
    const multiplier = ownedCount >= 2 ? 10 : 4;
    return diceTotal * multiplier;
  }

  if (space.type === 'property' && space.rents && space.group) {
    if (prop.houses > 0) {
      return space.rents[Math.min(3, prop.houses)] || space.rents[0];
    }
    const base = space.rents[0];
    if (hasFullColorGroup(state, prop.ownerId, space.group)) {
      return base * 2;
    }
    return base;
  }

  return 0;
}

export function calculatePlayerNetWorth(state: GameState, playerId: string): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 0;
  let total = player.money;
  for (const [idxStr, prop] of Object.entries(state.properties)) {
    if (prop.ownerId === playerId) {
      const space = BOARD_SPACES[Number(idxStr)];
      if (space?.price) {
        total += prop.mortgaged ? Math.floor(space.price * 0.5) : space.price;
      }
      if (space && prop.houses > 0) {
        total += Math.floor(getTierFullCost(space, prop.houses) * 0.5);
      }
    }
  }
  return total;
}

export function getNextActivePlayerIndex(players: Player[], fromIndex: number): number {
  const total = players.length;
  for (let step = 1; step <= total; step++) {
    const idx = (fromIndex + step) % total;
    if (!players[idx].bankrupt) return idx;
  }
  return fromIndex;
}

function resolveLanding(
  next: GameState,
  settings: RoomSettings,
  playerIndex: number,
  diceTotal: number,
  isDouble: boolean
): { sound: string } {
  const player = next.players[playerIndex];
  const space = BOARD_SPACES[player.position];
  let sound = 'step';

  if (space.type === 'go') {
    next.logs = addLog(next.logs, `وقف ${player.name} على نقطة البداية!`, 'move');
    next.turnPhase = isDouble ? 'roll' : 'end_turn';
    return { sound: 'cashIn' };
  }

  if (space.type === 'jail') {
    next.logs = addLog(next.logs, `وقف ${player.name} عند السجن (زيارة فقط).`, 'move');
    next.turnPhase = isDouble ? 'roll' : 'end_turn';
    return { sound };
  }

  if (space.type === 'free_parking') {
    if (settings.freeParkingJackpot && next.treasuryPool > 0) {
      const pot = next.treasuryPool;
      player.money += pot;
      next.treasuryPool = 0;
      next.logs = addLog(
        next.logs,
        `🎉 ربح ${player.name} خزينة نادي الحظ بالكامل وقدرها ${pot} جنيه!`,
        'money'
      );
      sound = 'cashIn';
    } else {
      next.logs = addLog(next.logs, `استراحة مجانية للاعب ${player.name} في نادي الحظ.`, 'move');
    }
    next.turnPhase = isDouble ? 'roll' : 'end_turn';
    return { sound };
  }

  if (space.type === 'go_to_jail') {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    next.consecutiveDoubles = 0;
    next.logs = addLog(next.logs, `🚓 تم إرسال ${player.name} إلى السجن مباشرة!`, 'court');
    next.turnPhase = 'end_turn';
    return { sound: 'jail' };
  }

  // Authentic Classic Bank El-Hazz Decks: "حظك" & "محاكمة ⚖️"
  if (space.type === 'chance' || space.type === 'court') {
    const deck = space.type === 'chance' ? HAZZAK_CARDS : MAHKAMA_CARDS;
    const card = deck[Math.floor(Math.random() * deck.length)];
    return applyLuckCard(next, settings, playerIndex, card, diceTotal, isDouble);
  }

  // Property, Station (الأتوبيس السريع...), or Utility (محطة بنزين)
  const prop = next.properties[String(space.index)];
  if (!prop) {
    next.turnPhase = isDouble ? 'roll' : 'end_turn';
    return { sound };
  }

  if (!prop.ownerId) {
    next.logs = addLog(
      next.logs,
      `وصل ${player.name} إلى ${space.name} (${space.price} جنيه) — متاحة للشراء أو المزاد.`,
      'property'
    );
    next.turnPhase = 'buy_or_auction';
    return { sound: 'step' };
  }

  if (prop.ownerId === player.id) {
    next.logs = addLog(next.logs, `وصل ${player.name} إلى ملكه الخاص: ${space.name}.`, 'move');
    next.turnPhase = isDouble ? 'roll' : 'end_turn';
    return { sound };
  }

  if (prop.mortgaged) {
    next.logs = addLog(
      next.logs,
      `وصل ${player.name} إلى ${space.name} — المدينة مرهونة ولا يُحصّل إيجار.`,
      'property'
    );
    next.turnPhase = isDouble ? 'roll' : 'end_turn';
    return { sound };
  }

  const owner = next.players.find((p) => p.id === prop.ownerId);
  const rent = calculateRent(next, space.index, diceTotal);
  if (owner && !owner.bankrupt && rent > 0) {
    player.money -= rent;
    owner.money += rent;
    const tierNote =
      prop.houses > 0 ? ` (${BUILDING_TIER_META[prop.houses]?.name})` : '';
    next.logs = addLog(
      next.logs,
      `💸 دفع ${player.name} إيجار ${rent} جنيه إلى ${owner.name} عن ${space.name}${tierNote}.`,
      'money'
    );
    sound = 'cashOut';
  }
  next.turnPhase = isDouble ? 'roll' : 'end_turn';
  return { sound };
}

function applyLuckCard(
  next: GameState,
  settings: RoomSettings,
  playerIndex: number,
  card: LuckCard,
  diceTotal: number,
  isDouble: boolean
): { sound: string } {
  const player = next.players[playerIndex];
  const deckLabel = card.deck === 'hazzak' ? 'كارت حظك' : 'كارت محاكمة ⚖️';

  next.activeCard = {
    card,
    drawnByPlayerId: player.id,
    drawnByPlayerName: player.name,
    timestamp: Date.now(),
  };

  let sound = card.deck === 'mahkama' ? 'courtGavel' : 'cardFlip';

  switch (card.effectType) {
    case 'gain_money': {
      const amount = card.amount || 100;
      player.money += amount;
      next.logs = addLog(
        next.logs,
        `🃏 ${deckLabel} (${player.name}): "${card.title}" — ربح ${amount} جنيه!`,
        'card'
      );
      sound = 'cashIn';
      next.turnPhase = isDouble ? 'roll' : 'end_turn';
      break;
    }

    case 'pay_money': {
      const amount = card.amount || 50;
      player.money -= amount;
      if (settings.freeParkingJackpot) {
        next.treasuryPool += amount;
      }
      next.logs = addLog(
        next.logs,
        `⚖️ ${deckLabel} (${player.name}): "${card.title}" — دفع ${amount} جنيه${
          settings.freeParkingJackpot ? ' (لخزينة نادي الحظ)' : ''
        }.`,
        'court'
      );
      sound = 'courtGavel';
      next.turnPhase = isDouble ? 'roll' : 'end_turn';
      break;
    }

    case 'jail_free_card': {
      player.getOutOfJailCards += 1;
      next.logs = addLog(
        next.logs,
        `🎟️ ${deckLabel} (${player.name}): حصل على بطاقة أمان للخروج المجاني من السجن!`,
        'card'
      );
      sound = 'cashIn';
      next.turnPhase = isDouble ? 'roll' : 'end_turn';
      break;
    }

    case 'go_to_jail': {
      player.position = 10;
      player.inJail = true;
      player.jailTurns = 0;
      next.consecutiveDoubles = 0;
      next.logs = addLog(
        next.logs,
        `⚖️ ${deckLabel} (${player.name}): "${card.title}" — تم إيداعه السجن!`,
        'court'
      );
      sound = 'jail';
      next.turnPhase = 'end_turn';
      break;
    }

    case 'collect_from_all': {
      const amount = card.amount || 40;
      let totalCollected = 0;
      for (const other of next.players) {
        if (other.id !== player.id && !other.bankrupt) {
          other.money -= amount;
          totalCollected += amount;
        }
      }
      player.money += totalCollected;
      next.logs = addLog(
        next.logs,
        `🃏 ${deckLabel} (${player.name}): "${card.title}" — جمع ${totalCollected} جنيه من اللاعبين.`,
        'card'
      );
      sound = 'cashIn';
      next.turnPhase = isDouble ? 'roll' : 'end_turn';
      break;
    }

    case 'pay_to_all': {
      const amount = card.amount || 40;
      let totalPaid = 0;
      for (const other of next.players) {
        if (other.id !== player.id && !other.bankrupt) {
          other.money += amount;
          totalPaid += amount;
        }
      }
      player.money -= totalPaid;
      next.logs = addLog(
        next.logs,
        `⚖️ ${deckLabel} (${player.name}): "${card.title}" — دفع ${totalPaid} جنيه للاعبين.`,
        'court'
      );
      sound = 'cashOut';
      next.turnPhase = isDouble ? 'roll' : 'end_turn';
      break;
    }

    case 'repairs': {
      const gCost = card.garageCost || 25;
      const rCost = card.restCost || 50;
      const mCost = card.marketCost || 90;
      let garages = 0;
      let rests = 0;
      let markets = 0;
      for (const prop of Object.values(next.properties)) {
        if (prop.ownerId === player.id) {
          if (prop.houses === 1) garages += 1;
          else if (prop.houses === 2) rests += 1;
          else if (prop.houses === 3) markets += 1;
        }
      }
      const totalCost = garages * gCost + rests * rCost + markets * mCost;
      if (totalCost > 0) {
        player.money -= totalCost;
        if (settings.freeParkingJackpot) {
          next.treasuryPool += totalCost;
        }
      }
      next.logs = addLog(
        next.logs,
        `⚖️ ${deckLabel} (${player.name}): صيانة (${garages} جراج، ${rests} استراحة، ${markets} سوق) — دفع ${totalCost} جنيه.`,
        'court'
      );
      sound = totalCost > 0 ? 'courtGavel' : 'cardFlip';
      next.turnPhase = isDouble ? 'roll' : 'end_turn';
      break;
    }

    case 'move_to': {
      const target = card.targetPos ?? 0;
      const oldPos = player.position;
      if (target <= oldPos && target !== 10) {
        player.money += settings.goReward;
        next.logs = addLog(
          next.logs,
          `💰 مرّ ${player.name} بنقطة البداية وتقاضى ${settings.goReward} جنيه!`,
          'money'
        );
      }
      player.position = target;
      next.logs = addLog(
        next.logs,
        `🃏 ${deckLabel} (${player.name}): "${card.title}" — انتقل إلى ${BOARD_SPACES[target].name}.`,
        'card'
      );
      if (BOARD_SPACES[target].type !== 'chance' && BOARD_SPACES[target].type !== 'court') {
        resolveLanding(next, settings, playerIndex, diceTotal, isDouble);
      } else {
        next.turnPhase = isDouble ? 'roll' : 'end_turn';
      }
      break;
    }

    case 'move_relative': {
      const delta = card.moveDelta || -3;
      const newPos = (player.position + delta + 40) % 40;
      player.position = newPos;
      next.logs = addLog(
        next.logs,
        `🃏 ${deckLabel} (${player.name}): "${card.title}" — وصل إلى ${BOARD_SPACES[newPos].name}.`,
        'card'
      );
      if (BOARD_SPACES[newPos].type !== 'chance' && BOARD_SPACES[newPos].type !== 'court') {
        resolveLanding(next, settings, playerIndex, diceTotal, isDouble);
      } else {
        next.turnPhase = isDouble ? 'roll' : 'end_turn';
      }
      break;
    }
  }

  return { sound };
}

export function rollDiceAndMove(
  state: GameState,
  settings: RoomSettings,
  playerId: string
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const currentPlayer = next.players[next.currentTurnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId || next.turnPhase !== 'roll') {
    return { state, sound: '' };
  }

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const isDouble = d1 === d2;
  const total = d1 + d2;

  next.dice = [d1, d2];
  next.activeCard = null;
  next.lastActionId = makeId('roll');

  // Jail handling
  if (currentPlayer.inJail) {
    if (isDouble) {
      currentPlayer.inJail = false;
      currentPlayer.jailTurns = 0;
      next.consecutiveDoubles = 0;
      next.logs = addLog(
        next.logs,
        `🎲 رمى ${currentPlayer.name} دبل (${d1} + ${d2}) وخرج من السجن حراً!`,
        'move'
      );
      currentPlayer.position = (currentPlayer.position + total) % 40;
      const res = resolveLanding(next, settings, next.currentTurnIndex, total, false);
      return { state: next, sound: res.sound || 'diceRoll' };
    } else {
      currentPlayer.jailTurns += 1;
      if (currentPlayer.jailTurns >= 3) {
        const bail = settings.jailBail || JAIL_BAIL;
        currentPlayer.money -= bail;
        if (settings.freeParkingJackpot) next.treasuryPool += bail;
        currentPlayer.inJail = false;
        currentPlayer.jailTurns = 0;
        currentPlayer.position = (currentPlayer.position + total) % 40;
        next.logs = addLog(
          next.logs,
          `⛓️ انقضت مدة حبس ${currentPlayer.name} (3 أدوار)؛ دفع كفالة ${bail} جنيه وتحرك ${total} خطوات.`,
          'court'
        );
        const res = resolveLanding(next, settings, next.currentTurnIndex, total, false);
        return { state: next, sound: res.sound || 'courtGavel' };
      } else {
        next.logs = addLog(
          next.logs,
          `⛓️ رمى ${currentPlayer.name} (${d1} + ${d2}) دون دبل — يبقى في السجن (دور ${currentPlayer.jailTurns}/3).`,
          'court'
        );
        next.turnPhase = 'end_turn';
        return { state: next, sound: 'diceRoll' };
      }
    }
  }

  // Triple doubles rule
  if (isDouble) {
    next.consecutiveDoubles += 1;
    if (next.consecutiveDoubles >= 3) {
      currentPlayer.position = 10;
      currentPlayer.inJail = true;
      currentPlayer.jailTurns = 0;
      next.consecutiveDoubles = 0;
      next.logs = addLog(
        next.logs,
        `🚓 رمى ${currentPlayer.name} 3 دبلات متتالية (${d1}+${d2})! دخل السجن مباشرة.`,
        'court'
      );
      next.turnPhase = 'end_turn';
      return { state: next, sound: 'jail' };
    }
  } else {
    next.consecutiveDoubles = 0;
  }

  // Normal movement
  const oldPos = currentPlayer.position;
  const newPos = (oldPos + total) % 40;
  if (oldPos + total >= 40) {
    const exactGoDouble = Boolean(settings.doubleGoBonus && newPos === 0);
    const reward = exactGoDouble ? settings.goReward * 2 : settings.goReward;
    currentPlayer.money += reward;
    next.logs = addLog(
      next.logs,
      exactGoDouble
        ? `🎉 وقف ${currentPlayer.name} تماماً على نقطة البداية وتقاضى المكافأة المضاعفة ${reward} جنيه!`
        : `💰 مرّ ${currentPlayer.name} بنقطة البداية وتقاضى ${reward} جنيه!`,
      'money'
    );
  }
  currentPlayer.position = newPos;
  next.logs = addLog(
    next.logs,
    `🎲 رمى ${currentPlayer.name} النرد (${d1} + ${d2} = ${total})${isDouble ? ' — دبل!' : ''} ووصل إلى ${BOARD_SPACES[newPos].name}.`,
    'move'
  );

  const res = resolveLanding(next, settings, next.currentTurnIndex, total, isDouble);
  return { state: next, sound: res.sound || 'diceRoll' };
}

export function payJailBail(
  state: GameState,
  settings: RoomSettings,
  playerId: string
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const player = next.players[next.currentTurnIndex];
  if (!player || player.id !== playerId || !player.inJail || next.turnPhase !== 'roll') {
    return { state, sound: '' };
  }
  const bail = settings.jailBail || JAIL_BAIL;
  if (player.money < bail) return { state, sound: '' };

  player.money -= bail;
  if (settings.freeParkingJackpot) next.treasuryPool += bail;
  player.inJail = false;
  player.jailTurns = 0;
  next.lastActionId = makeId('bail');
  next.logs = addLog(
    next.logs,
    `🔓 دفع ${player.name} كفالة ${bail} جنيه وخرج من السجن! يمكنه رمي النرد الآن.`,
    'court'
  );
  return { state: next, sound: 'cashOut' };
}

export function useJailFreeCard(
  state: GameState,
  playerId: string
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const player = next.players[next.currentTurnIndex];
  if (
    !player ||
    player.id !== playerId ||
    !player.inJail ||
    player.getOutOfJailCards <= 0 ||
    next.turnPhase !== 'roll'
  ) {
    return { state, sound: '' };
  }

  player.getOutOfJailCards -= 1;
  player.inJail = false;
  player.jailTurns = 0;
  next.lastActionId = makeId('jailcard');
  next.logs = addLog(
    next.logs,
    `🎟️ استخدم ${player.name} بطاقة الأمان وغادر السجن مجاناً!`,
    'card'
  );
  return { state: next, sound: 'cashIn' };
}

export function buyCurrentProperty(
  state: GameState,
  playerId: string
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const player = next.players[next.currentTurnIndex];
  if (!player || player.id !== playerId || next.turnPhase !== 'buy_or_auction') {
    return { state, sound: '' };
  }

  const space = BOARD_SPACES[player.position];
  const prop = next.properties[String(space.index)];
  if (!space?.price || !prop || prop.ownerId || player.money < space.price) {
    return { state, sound: '' };
  }

  player.money -= space.price;
  prop.ownerId = player.id;
  prop.houses = 0;
  prop.mortgaged = false;

  const isDouble = next.dice[0] === next.dice[1] && next.consecutiveDoubles > 0;
  next.turnPhase = isDouble ? 'roll' : 'end_turn';
  next.lastActionId = makeId('buy');
  next.logs = addLog(
    next.logs,
    `🏛️ اشترى ${player.name} سند ملكية "${space.name}" بمبلغ ${space.price} جنيه.`,
    'property'
  );
  return { state: next, sound: 'buyProperty' };
}

export function startAuction(
  state: GameState,
  spaceIndex: number,
  startedByPlayerId: string
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const space = BOARD_SPACES[spaceIndex];
  const prop = next.properties[String(spaceIndex)];
  if (!space?.price || !prop || prop.ownerId || next.activeAuction) {
    return { state, sound: '' };
  }

  const starter = next.players.find((p) => p.id === startedByPlayerId);
  const activeCount = next.players.filter((p) => !p.bankrupt).length;
  if (activeCount < 2) return { state, sound: '' };

  const isDouble = next.dice[0] === next.dice[1] && next.consecutiveDoubles > 0;
  const returnPhase =
    next.turnPhase === 'buy_or_auction'
      ? isDouble
        ? 'roll'
        : 'end_turn'
      : next.turnPhase;

  next.activeAuction = {
    propertyIndex: spaceIndex,
    currentBid: 0,
    highestBidderId: null,
    highestBidderName: null,
    passedPlayerIds: [],
    startedByPlayerId,
    startedAt: Date.now(),
    returnPhase,
  };
  next.turnPhase = 'auction';
  next.lastActionId = makeId('auc_start');
  next.logs = addLog(
    next.logs,
    `🔨 بدأ مزاد علني مباشر على "${space.name}" (السعر الأصلي ${space.price} جنيه) بطلب من ${starter?.name || 'لاعب'}!`,
    'auction'
  );
  return { state: next, sound: 'auctionBid' };
}

export function placeAuctionBid(
  state: GameState,
  playerId: string,
  increment: number
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const auc = next.activeAuction;
  if (!auc) return { state, sound: '' };

  const player = next.players.find((p) => p.id === playerId && !p.bankrupt);
  if (!player) return { state, sound: '' };
  if (auc.passedPlayerIds.includes(playerId)) return { state, sound: '' };

  const newBid = auc.currentBid + increment;
  if (player.money < newBid) return { state, sound: '' };

  auc.currentBid = newBid;
  auc.highestBidderId = player.id;
  auc.highestBidderName = player.name;
  next.lastActionId = makeId('auc_bid');

  const space = BOARD_SPACES[auc.propertyIndex];
  next.logs = addLog(
    next.logs,
    `🔨 زايد ${player.name} بمبلغ ${newBid} جنيه على "${space.name}"!`,
    'auction'
  );

  const activePlayers = next.players.filter((p) => !p.bankrupt);
  const remaining = activePlayers.filter((p) => !auc.passedPlayerIds.includes(p.id));
  if (remaining.length === 1 && remaining[0].id === auc.highestBidderId) {
    return finalizeAuction(next);
  }

  return { state: next, sound: 'auctionBid' };
}

export function passAuction(
  state: GameState,
  playerId: string
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const auc = next.activeAuction;
  if (!auc) return { state, sound: '' };
  if (auc.passedPlayerIds.includes(playerId)) return { state, sound: '' };
  if (auc.highestBidderId === playerId) return { state, sound: '' };

  const player = next.players.find((p) => p.id === playerId);
  auc.passedPlayerIds.push(playerId);
  next.lastActionId = makeId('auc_pass');
  next.logs = addLog(
    next.logs,
    `انسحب ${player?.name || 'لاعب'} من المزاد.`,
    'auction'
  );

  const activePlayers = next.players.filter((p) => !p.bankrupt);
  const remaining = activePlayers.filter((p) => !auc.passedPlayerIds.includes(p.id));

  if (remaining.length === 0) {
    return finalizeAuction(next);
  }
  if (remaining.length === 1 && auc.highestBidderId === remaining[0].id) {
    return finalizeAuction(next);
  }

  return { state: next, sound: 'step' };
}

function finalizeAuction(next: GameState): { state: GameState; sound: string } {
  const auc = next.activeAuction;
  if (!auc) return { state: next, sound: '' };

  const space = BOARD_SPACES[auc.propertyIndex];
  const prop = next.properties[String(auc.propertyIndex)];

  let sound = 'step';
  if (auc.highestBidderId && auc.currentBid > 0 && prop) {
    const winner = next.players.find((p) => p.id === auc.highestBidderId);
    if (winner && winner.money >= auc.currentBid) {
      winner.money -= auc.currentBid;
      prop.ownerId = winner.id;
      prop.houses = 0;
      prop.mortgaged = false;
      next.logs = addLog(
        next.logs,
        `🏆 رسا مزاد "${space.name}" على ${winner.name} بمبلغ ${auc.currentBid} جنيه!`,
        'auction'
      );
      sound = 'auctionWin';
    }
  } else {
    next.logs = addLog(
      next.logs,
      `انتهى مزاد "${space.name}" دون مزايدات وبقيت المدينة ملكاً للبنك.`,
      'auction'
    );
  }

  const returnPhase = auc.returnPhase || 'end_turn';
  next.activeAuction = null;
  next.turnPhase = returnPhase === 'auction' ? 'end_turn' : returnPhase;
  next.lastActionId = makeId('auc_end');
  return { state: next, sound };
}

/**
 * Checks whether a player can build or upgrade a city to targetLevel:
 * 1 = جراج (مستطيل), 2 = استراحة (مثلث), 3 = سوق (مربع).
 * Pays only the exact cost difference from the current tier.
 */
export function canBuildTier(
  state: GameState,
  playerId: string,
  spaceIndex: number,
  targetLevel: 1 | 2 | 3
): { allowed: boolean; cost: number; reason?: string } {
  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[String(spaceIndex)];
  const player = state.players.find((p) => p.id === playerId);

  if (
    !space ||
    space.type !== 'property' ||
    !space.group ||
    !space.buildingCosts ||
    !prop ||
    !player
  ) {
    return { allowed: false, cost: 0, reason: 'لا يمكن البناء على هذه الخانة.' };
  }
  if (prop.ownerId !== playerId) {
    return { allowed: false, cost: 0, reason: 'لا تملك هذه المدينة.' };
  }
  if (!hasFullColorGroup(state, playerId, space.group)) {
    return {
      allowed: false,
      cost: getBuildingUpgradeCost(space, prop.houses, targetLevel),
      reason: 'يجب امتلاك جميع مدن المجموعة اللونية أولاً للبناء.',
    };
  }
  const groupIndices = COLOR_GROUP_META[space.group].indices;
  const anyMortgaged = groupIndices.some((i) => state.properties[String(i)]?.mortgaged);
  if (anyMortgaged) {
    return {
      allowed: false,
      cost: getBuildingUpgradeCost(space, prop.houses, targetLevel),
      reason: 'لا يمكن البناء مع وجود مدينة مرهونة في نفس المجموعة.',
    };
  }
  if (prop.houses >= targetLevel) {
    return { allowed: false, cost: 0, reason: 'المدينة مطوّرة بالفعل لهذا المستوى أو أعلى.' };
  }

  const diffCost = getBuildingUpgradeCost(space, prop.houses, targetLevel);
  if (player.money < diffCost) {
    return {
      allowed: false,
      cost: diffCost,
      reason: `رصيدك لا يكفي (${diffCost} جنيه مطلوبة).`,
    };
  }

  return { allowed: true, cost: diffCost };
}

export function buildPropertyTier(
  state: GameState,
  playerId: string,
  spaceIndex: number,
  targetLevel: 1 | 2 | 3
): { state: GameState; sound: string } {
  const check = canBuildTier(state, playerId, spaceIndex, targetLevel);
  if (!check.allowed) return { state, sound: '' };

  const next = cloneState(state);
  const space = BOARD_SPACES[spaceIndex];
  const prop = next.properties[String(spaceIndex)];
  const player = next.players.find((p) => p.id === playerId)!;

  const prevLevel = prop.houses;
  player.money -= check.cost;
  prop.houses = targetLevel;
  next.lastActionId = makeId('build');

  const tierInfo = BUILDING_TIER_META[targetLevel];
  const actionVerb = prevLevel > 0 ? 'رقّى مبنى' : 'بنى';
  next.logs = addLog(
    next.logs,
    `🏗️ ${actionVerb} ${player.name} إلى "${tierInfo.name} ${tierInfo.symbol}" في ${space.name} مقابل ${check.cost} جنيه.`,
    'property'
  );
  return { state: next, sound: 'buyProperty' };
}

export function sellBuildingTier(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const space = BOARD_SPACES[spaceIndex];
  const prop = next.properties[String(spaceIndex)];
  const player = next.players.find((p) => p.id === playerId);

  if (
    !space ||
    space.type !== 'property' ||
    !space.buildingCosts ||
    !prop ||
    !player ||
    prop.ownerId !== playerId ||
    prop.houses <= 0
  ) {
    return { state, sound: '' };
  }

  const prevLevel = prop.houses;
  const nextLevel = prevLevel - 1;
  const tierDiff = getTierFullCost(space, prevLevel) - getTierFullCost(space, nextLevel);
  const refund = Math.floor(tierDiff * 0.5);

  prop.houses = nextLevel;
  player.money += refund;
  next.lastActionId = makeId('sell_b');

  const soldName = BUILDING_TIER_META[prevLevel]?.name || 'مبنى';
  next.logs = addLog(
    next.logs,
    `💰 باع ${player.name} (${soldName}) في ${space.name} واسترد ${refund} جنيه.`,
    'property'
  );
  return { state: next, sound: 'cashIn' };
}

export function toggleMortgage(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const space = BOARD_SPACES[spaceIndex];
  const prop = next.properties[String(spaceIndex)];
  const player = next.players.find((p) => p.id === playerId);

  if (!space?.price || !prop || !player || prop.ownerId !== playerId) {
    return { state, sound: '' };
  }

  const mortgageVal = Math.floor(space.price * 0.5);
  const unmortgageCost = Math.ceil(space.price * 0.55);

  if (!prop.mortgaged) {
    if (space.type === 'property' && space.group) {
      const hasAnyBuilding = COLOR_GROUP_META[space.group].indices.some(
        (i) => (next.properties[String(i)]?.houses || 0) > 0
      );
      if (hasAnyBuilding) return { state, sound: '' };
    }
    prop.mortgaged = true;
    player.money += mortgageVal;
    next.lastActionId = makeId('mort');
    next.logs = addLog(
      next.logs,
      `📜 رهن ${player.name} "${space.name}" وحصل على ${mortgageVal} جنيه.`,
      'property'
    );
    return { state: next, sound: 'cashIn' };
  } else {
    if (player.money < unmortgageCost) return { state, sound: '' };
    prop.mortgaged = false;
    player.money -= unmortgageCost;
    next.lastActionId = makeId('unmort');
    next.logs = addLog(
      next.logs,
      `✅ فكّ ${player.name} رهن "${space.name}" مقابل ${unmortgageCost} جنيه.`,
      'property'
    );
    return { state: next, sound: 'cashOut' };
  }
}

export function proposeTrade(
  state: GameState,
  offer: Omit<TradeOffer, 'id' | 'createdAt'>
): { state: GameState; sound: string } {
  const next = cloneState(state);
  if (next.activeTrade) return { state, sound: '' };

  const fromPlayer = next.players.find((p) => p.id === offer.fromPlayerId && !p.bankrupt);
  const toPlayer = next.players.find((p) => p.id === offer.toPlayerId && !p.bankrupt);
  if (!fromPlayer || !toPlayer || fromPlayer.id === toPlayer.id) return { state, sound: '' };

  next.activeTrade = {
    ...offer,
    id: makeId('trade'),
    offerCash: Math.max(0, Math.floor(offer.offerCash)),
    requestCash: Math.max(0, Math.floor(offer.requestCash)),
    createdAt: Date.now(),
  };
  next.lastActionId = makeId('trade_prop');
  next.logs = addLog(
    next.logs,
    `🤝 عرض ${fromPlayer.name} صفقة تبادل على ${toPlayer.name}.`,
    'trade'
  );
  return { state: next, sound: 'cardFlip' };
}

export function respondToTrade(
  state: GameState,
  responderId: string,
  accept: boolean
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const trade = next.activeTrade;
  if (!trade) return { state, sound: '' };

  if (responderId !== trade.toPlayerId && !(responderId === trade.fromPlayerId && !accept)) {
    return { state, sound: '' };
  }

  const fromPlayer = next.players.find((p) => p.id === trade.fromPlayerId);
  const toPlayer = next.players.find((p) => p.id === trade.toPlayerId);

  if (!accept || !fromPlayer || !toPlayer) {
    next.activeTrade = null;
    next.lastActionId = makeId('trade_rej');
    next.logs = addLog(
      next.logs,
      `❌ تم رفض/إلغاء صفقة التبادل بين ${trade.fromPlayerName} و${trade.toPlayerName}.`,
      'trade'
    );
    return { state: next, sound: 'step' };
  }

  if (fromPlayer.money < trade.offerCash || toPlayer.money < trade.requestCash) {
    next.activeTrade = null;
    next.logs = addLog(next.logs, `تعذر تنفيذ الصفقة لعدم كفاية الرصيد.`, 'trade');
    return { state: next, sound: 'cashOut' };
  }

  fromPlayer.money = fromPlayer.money - trade.offerCash + trade.requestCash;
  toPlayer.money = toPlayer.money - trade.requestCash + trade.offerCash;

  for (const idx of trade.offerProperties) {
    const p = next.properties[String(idx)];
    if (p && p.ownerId === fromPlayer.id && p.houses === 0) {
      p.ownerId = toPlayer.id;
    }
  }
  for (const idx of trade.requestProperties) {
    const p = next.properties[String(idx)];
    if (p && p.ownerId === toPlayer.id && p.houses === 0) {
      p.ownerId = fromPlayer.id;
    }
  }

  next.activeTrade = null;
  next.lastActionId = makeId('trade_ok');
  next.logs = addLog(
    next.logs,
    `🤝 تمّت صفقة التبادل بنجاح بين ${fromPlayer.name} و${toPlayer.name}!`,
    'trade'
  );
  return { state: next, sound: 'buyProperty' };
}

export function declareBankruptcy(
  state: GameState,
  playerId: string
): { state: GameState; sound: string; gameFinished: boolean } {
  const next = cloneState(state);
  const pIdx = next.players.findIndex((p) => p.id === playerId && !p.bankrupt);
  if (pIdx === -1) return { state, sound: '', gameFinished: false };

  const player = next.players[pIdx];
  player.bankrupt = true;
  player.money = 0;

  for (const prop of Object.values(next.properties)) {
    if (prop.ownerId === player.id) {
      prop.ownerId = null;
      prop.houses = 0;
      prop.mortgaged = false;
    }
  }

  next.logs = addLog(
    next.logs,
    `💔 أعلن ${player.name} إفلاسه وعادت جميع مدنه وأملاكه إلى بنك الحظ.`,
    'court'
  );

  const activePlayers = next.players.filter((p) => !p.bankrupt);
  if (activePlayers.length <= 1) {
    next.winnerId = activePlayers[0]?.id || null;
    next.turnPhase = 'finished';
    next.activeAuction = null;
    next.activeTrade = null;
    next.lastActionId = makeId('win');
    if (activePlayers[0]) {
      next.logs = addLog(
        next.logs,
        `🏆 فاز ${activePlayers[0].name} بلقب بطل بنك الحظ الكلاسيكي!`,
        'system'
      );
    }
    return { state: next, sound: 'victory', gameFinished: true };
  }

  if (next.currentTurnIndex === pIdx) {
    next.currentTurnIndex = getNextActivePlayerIndex(next.players, pIdx);
    next.turnPhase = 'roll';
    next.consecutiveDoubles = 0;
    next.turnCounter += 1;
    next.turnStartedAt = Date.now();
  }

  next.lastActionId = makeId('bankrupt');
  return { state: next, sound: 'jail', gameFinished: false };
}

export function finishGameByTimeLimit(
  state: GameState,
  reason = 'انتهى وقت المباراة!'
): { state: GameState; sound: string; gameFinished: boolean } {
  if (state.turnPhase === 'finished') {
    return { state, sound: '', gameFinished: true };
  }
  const next = cloneState(state);
  const active = next.players.filter((p) => !p.bankrupt);
  const sorted = [...active].sort(
    (a, b) => calculatePlayerNetWorth(next, b.id) - calculatePlayerNetWorth(next, a.id)
  );
  const winner = sorted[0] || null;
  next.winnerId = winner?.id || null;
  next.turnPhase = 'finished';
  next.activeAuction = null;
  next.activeTrade = null;
  next.activeCard = null;
  next.lastActionId = makeId('win_time');

  if (winner) {
    const worth = calculatePlayerNetWorth(next, winner.id);
    next.logs = addLog(
      next.logs,
      `⏱️ ${reason} فاز ${winner.name} بأعلى صافي ثروة (${worth.toLocaleString('en-US')} جنيه)!`,
      'system'
    );
  }
  return { state: next, sound: 'victory', gameFinished: true };
}

export function endTurn(
  state: GameState,
  playerId: string
): { state: GameState; sound: string } {
  const next = cloneState(state);
  const current = next.players[next.currentTurnIndex];
  if (
    !current ||
    current.id !== playerId ||
    (next.turnPhase !== 'end_turn' && next.turnPhase !== 'buy_or_auction')
  ) {
    return { state, sound: '' };
  }
  if (current.money < 0) {
    return { state, sound: '' };
  }

  if (
    next.turnPhase === 'buy_or_auction' &&
    next.dice[0] === next.dice[1] &&
    next.consecutiveDoubles > 0
  ) {
    next.turnPhase = 'roll';
    next.turnStartedAt = Date.now();
    next.lastActionId = makeId('skip_dbl');
    return { state: next, sound: 'step' };
  }

  next.currentTurnIndex = getNextActivePlayerIndex(next.players, next.currentTurnIndex);
  next.turnPhase = 'roll';
  next.consecutiveDoubles = 0;
  next.activeCard = null;
  next.turnCounter += 1;
  next.turnStartedAt = Date.now();
  next.lastActionId = makeId('end');

  const upcoming = next.players[next.currentTurnIndex];
  next.logs = addLog(next.logs, `انتقل الدور إلى ${upcoming.name} (${upcoming.token}).`, 'system');
  return { state: next, sound: 'step' };
}

export function dismissActiveCard(state: GameState): GameState {
  if (!state.activeCard) return state;
  const next = cloneState(state);
  next.activeCard = null;
  next.lastActionId = makeId('dismiss_card');
  return next;
}
