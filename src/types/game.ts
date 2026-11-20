export type SpaceType =
  | 'go'
  | 'property'
  | 'station'
  | 'utility'
  | 'chance'
  | 'court'
  | 'jail'
  | 'free_parking'
  | 'go_to_jail';

export type ColorGroupId =
  | 'brown'
  | 'sky'
  | 'rose'
  | 'orange'
  | 'red'
  | 'gold'
  | 'emerald'
  | 'royal'
  | 'station'
  | 'utility';

export type CountryCode =
  | 'EG'
  | 'SY'
  | 'PS'
  | 'JO'
  | 'LB'
  | 'IQ'
  | 'YE'
  | 'TN'
  | 'DZ'
  | 'MA'
  | 'BH'
  | 'SD'
  | 'LY'
  | 'QA'
  | 'SA'
  | 'KW';

export interface BoardSpace {
  index: number;
  name: string;
  subtitle?: string;
  type: SpaceType;
  group?: ColorGroupId;
  country?: CountryCode;
  price?: number;
  /**
   * For properties: [baseRent, garageRent, restRent, marketRent]
   * For stations: [1 station, 2 stations, 3 stations, 4 stations]
   */
  rents?: number[];
  /**
   * Classic Bank El-Hazz building costs: [garageCost, restCost, marketCost]
   * Upgrading pays the difference between target tier cost and current tier cost.
   */
  buildingCosts?: [number, number, number];
}

export interface Player {
  id: string;
  uid: string;
  name: string;
  token: string;
  color: string;
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  bankrupt: boolean;
  isHost: boolean;
}

export interface PropertyState {
  ownerId: string | null;
  /**
   * Classic Bank El-Hazz development level:
   * 0 = أرض بدون مباني
   * 1 = جراج (مستطيل)
   * 2 = استراحة (مثلث)
   * 3 = سوق (مربع)
   */
  houses: number;
  mortgaged: boolean;
}

export interface RoomSettings {
  startingMoney: number;
  goReward: number;
  freeParkingJackpot: boolean;
  maxPlayers: number;
  auctionEnabled: boolean;
  /** Turn countdown limit in seconds (0 = unlimited, 15..300) */
  turnTimeLimitSec: number;
  /** Total match duration limit in minutes (0 = unlimited, 5..180) */
  gameDurationMin: number;
  /** Bail cost to exit Jail immediately (25..500, default 50) */
  jailBail: number;
  /** Landing exactly on GO awards 2x goReward */
  doubleGoBonus: boolean;
}

export type CardEffectType =
  | 'gain_money'
  | 'pay_money'
  | 'move_to'
  | 'move_relative'
  | 'go_to_jail'
  | 'jail_free_card'
  | 'collect_from_all'
  | 'pay_to_all'
  | 'repairs';

export interface LuckCard {
  id: string;
  deck: 'hazzak' | 'mahkama';
  title: string;
  description: string;
  effectType: CardEffectType;
  amount?: number;
  targetPos?: number;
  moveDelta?: number;
  garageCost?: number;
  restCost?: number;
  marketCost?: number;
}

export interface ActiveCardEvent {
  card: LuckCard;
  drawnByPlayerId: string;
  drawnByPlayerName: string;
  timestamp: number;
}

export interface AuctionState {
  propertyIndex: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  passedPlayerIds: string[];
  startedByPlayerId: string;
  startedAt: number;
  returnPhase: TurnPhase;
}

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  offerCash: number;
  requestCash: number;
  offerProperties: number[];
  requestProperties: number[];
  createdAt: number;
}

export type LogCategory =
  | 'move'
  | 'money'
  | 'property'
  | 'card'
  | 'court'
  | 'auction'
  | 'trade'
  | 'system';

export interface GameLogEntry {
  id: string;
  text: string;
  category: LogCategory;
  timestamp: number;
}

export type TurnPhase =
  | 'roll'
  | 'buy_or_auction'
  | 'auction'
  | 'end_turn'
  | 'finished';

export interface GameState {
  players: Player[];
  properties: Record<string, PropertyState>;
  currentTurnIndex: number;
  turnPhase: TurnPhase;
  dice: [number, number];
  consecutiveDoubles: number;
  treasuryPool: number;
  logs: GameLogEntry[];
  activeCard: ActiveCardEvent | null;
  activeAuction: AuctionState | null;
  activeTrade: TradeOffer | null;
  winnerId: string | null;
  turnCounter: number;
  lastActionId: string;
  /** Epoch ms when the match started (0 while in lobby) */
  matchStartedAt: number;
  /** Epoch ms when the current turn started */
  turnStartedAt: number;
}

export interface RoomDocument {
  roomId: string;
  hostUid: string;
  status: 'lobby' | 'playing' | 'finished';
  playerUids: string[];
  settings: RoomSettings;
  gameState: GameState;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderUid: string;
  senderName: string;
  senderColor: string;
  text: string;
  participantUids: string[];
  createdAtMs: number;
}
