import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  createOnlineRoom,
  joinOnlineRoom,
  leaveOnlineLobby,
  pushGameplayState,
  sendRoomChatMessage,
  signInGuestOrDetect,
  signInWithGooglePopup,
  subscribeAuth,
  subscribeToRoom,
  subscribeToRoomMessages,
  updateHostLobby,
} from './firebase';
import {
  buildPropertyTier,
  buyCurrentProperty,
  createInitialGameState,
  declareBankruptcy,
  DEFAULT_SETTINGS,
  dismissActiveCard,
  endTurn,
  finishGameByTimeLimit,
  hasFullColorGroup,
  passAuction,
  payJailBail,
  placeAuctionBid,
  proposeTrade,
  respondToTrade,
  rollDiceAndMove,
  sellBuildingTier,
  startAuction,
  toggleMortgage,
  useJailFreeCard,
} from './engine/gameEngine';
import { BOARD_SPACES, COLOR_GROUP_META } from './data/boardData';
import { ChatMessage, GameState, Player, RoomDocument, RoomSettings } from './types/game';
import { soundEngine } from './utils/sound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EntryScreen, WaitingLobby } from './components/EntryAndLobby';
import { BoardView } from './components/BoardView';
import { PlayerHUD } from './components/PlayerHUD';
import { SidePanel } from './components/SidePanel';
import { PurchaseModal } from './components/PurchaseModal';
import { BuildModal } from './components/BuildModal';
import { GameGuideModal } from './components/GameGuideModal';
import {
  AuctionModal,
  CardModal,
  IncomingTradeBanner,
  PropertyModal,
  TradeModal,
  VictoryModal,
} from './components/Modals';
import { Copy, Check, Flag, LogOut, Timer, Volume2, VolumeX } from 'lucide-react';

function playNamedSound(sound: string) {
  switch (sound) {
    case 'diceRoll':
      soundEngine.diceRoll();
      break;
    case 'step':
      soundEngine.step();
      break;
    case 'cashIn':
      soundEngine.cashIn();
      break;
    case 'cashOut':
      soundEngine.cashOut();
      break;
    case 'buyProperty':
      soundEngine.buyProperty();
      break;
    case 'cardFlip':
      soundEngine.cardFlip();
      break;
    case 'courtGavel':
      soundEngine.courtGavel();
      break;
    case 'auctionBid':
      soundEngine.auctionBid();
      break;
    case 'auctionWin':
      soundEngine.auctionWin();
      break;
    case 'jail':
      soundEngine.jail();
      break;
    case 'victory':
      soundEngine.victory();
      break;
  }
}

function BankElHazzApp() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [anonymousDisabled, setAnonymousDisabled] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // App mode state
  const [screen, setScreen] = useState<'entry' | 'lobby' | 'game'>('entry');
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Online Room state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomDoc, setRoomDoc] = useState<RoomDocument | null>(null);

  // Local Game state
  const [localState, setLocalState] = useState<GameState | null>(null);
  const [localSettings, setLocalSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [localChat, setLocalChat] = useState<ChatMessage[]>([]);
  const [onlineChat, setOnlineChat] = useState<ChatMessage[]>([]);

  // UI state
  const [busy, setBusy] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isTokenMoving, setIsTokenMoving] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<number | null>(null);
  const [buildModalSpaceIndex, setBuildModalSpaceIndex] = useState<number | null>(null);
  const [dismissedPurchaseActionId, setDismissedPurchaseActionId] = useState<string | null>(null);
  const [tradeModalTargetId, setTradeModalTargetId] = useState<string | undefined>(undefined);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const lastActionRef = useRef<string>('');
  const promptedBuildActionIdRef = useRef<string>('');
  const timedOutTurnRef = useRef<string>('');
  const timedOutMatchRef = useRef<boolean>(false);

  // Initialize Auth (attempt Anonymous Auth first as requested, fallback cleanly to Google if disabled)
  useEffect(() => {
    const unsub = subscribeAuth(async (u) => {
      if (u) {
        setUser(u);
        setAnonymousDisabled(false);
        setAuthError(null);
        setAuthReady(true);
      } else {
        const res = await signInGuestOrDetect();
        if (res.user) {
          setUser(res.user);
        } else {
          setAnonymousDisabled(res.anonymousDisabled);
          setAuthError(res.errorMessage || null);
        }
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Active Online Room in Firestore
  useEffect(() => {
    if (!activeRoomId || !user || isLocalMode) return;
    const unsub = subscribeToRoom(
      activeRoomId,
      (docData) => {
        if (!docData) {
          setRoomDoc(null);
          setActiveRoomId(null);
          setScreen('entry');
          setErrorBanner('تم إغلاق الغرفة من قِبل المضيف.');
          return;
        }
        setRoomDoc(docData);
        if (docData.status === 'lobby') setScreen('lobby');
        else setScreen('game');

        // Subtle audio cue when remote players act
        const actionId = docData.gameState.lastActionId;
        if (actionId && lastActionRef.current && actionId !== lastActionRef.current) {
          if (actionId.startsWith('roll_')) soundEngine.diceRoll();
          else if (actionId.startsWith('auc_bid')) soundEngine.auctionBid();
          else if (actionId.startsWith('auc_end')) soundEngine.auctionWin();
          else if (actionId.startsWith('buy_')) soundEngine.buyProperty();
          else if (actionId.startsWith('win_')) soundEngine.victory();
        }
        lastActionRef.current = actionId;
      },
      (err) => {
        setErrorBanner(err.message);
      }
    );
    return () => unsub();
  }, [activeRoomId, user, isLocalMode]);

  // Subscribe to Room Chat Messages
  useEffect(() => {
    if (!activeRoomId || !user || isLocalMode) return;
    const unsub = subscribeToRoomMessages(activeRoomId, user.uid, (msgs) => {
      setOnlineChat(msgs);
    });
    return () => unsub();
  }, [activeRoomId, user, isLocalMode]);

  const gameState: GameState | null = isLocalMode
    ? localState
    : roomDoc?.gameState || null;
  const settings: RoomSettings = isLocalMode
    ? localSettings
    : roomDoc?.settings || DEFAULT_SETTINGS;
  const myPlayerId: string | null = isLocalMode
    ? gameState?.players[gameState.currentTurnIndex]?.id || null
    : user?.uid || null;
  const chatMessages = isLocalMode ? localChat : onlineChat;

  // Auto-prompt the interactive Full-Group Build Modal ("المجموعة كاملة — ابني في [المدينة]؟")
  // once after the active player finishes moving onto an owned city in a complete color group
  // OR immediately upon buying the final city that completes a color group.
  useEffect(() => {
    if (
      screen !== 'game' ||
      !gameState ||
      isTokenMoving ||
      gameState.activeCard ||
      gameState.activeAuction ||
      gameState.turnPhase === 'finished'
    ) {
      return;
    }

    const activePlayer = gameState.players[gameState.currentTurnIndex];
    if (!activePlayer || activePlayer.bankrupt) return;

    const isActivelyMyTurn = isLocalMode || activePlayer.id === myPlayerId;
    if (!isActivelyMyTurn) return;

    const actionId = gameState.lastActionId;
    if (!actionId || promptedBuildActionIdRef.current === actionId) return;

    const isLandingOrPurchase =
      actionId.startsWith('roll_') || actionId.startsWith('buy_');
    if (!isLandingOrPurchase) return;

    if (gameState.turnPhase === 'buy_or_auction') return;

    const space = BOARD_SPACES[activePlayer.position];
    if (!space || space.type !== 'property' || !space.group) return;

    if (!hasFullColorGroup(gameState, activePlayer.id, space.group)) return;

    const indices = COLOR_GROUP_META[space.group].indices;
    const anyMortgaged = indices.some((idx) => gameState.properties[String(idx)]?.mortgaged);
    const anyUpgradable = indices.some((idx) => (gameState.properties[String(idx)]?.houses || 0) < 3);

    if (!anyMortgaged && anyUpgradable && activePlayer.money > 0) {
      promptedBuildActionIdRef.current = actionId;
      setBuildModalSpaceIndex(space.index);
    }
  }, [screen, gameState, isTokenMoving, isLocalMode, myPlayerId]);

  const commitState = async (
    nextState: GameState,
    sound?: string,
    finished?: boolean
  ) => {
    if (sound) playNamedSound(sound);
    lastActionRef.current = nextState.lastActionId;

    if (isLocalMode) {
      setLocalState(nextState);
    } else if (activeRoomId) {
      try {
        await pushGameplayState(
          activeRoomId,
          nextState,
          finished || nextState.turnPhase === 'finished' ? 'finished' : 'playing'
        );
      } catch (err) {
        setErrorBanner(err instanceof Error ? err.message : 'تعذر مزامنة الحركة مع الغرفة.');
      }
    }
  };

  // Auth & Room Handlers
  const handleGoogleLogin = async () => {
    setBusy(true);
    setErrorBanner(null);
    try {
      const u = await signInWithGooglePopup();
      setUser(u);
      setAnonymousDisabled(false);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'تعذر تسجيل الدخول بـ Google.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateOnlineRoom = async (
    profile: {
      name: string;
      token: string;
      color: string;
    },
    chosenSettings: RoomSettings
  ) => {
    if (!user) return;
    setBusy(true);
    setErrorBanner(null);
    try {
      const hostPlayer: Player = {
        id: user.uid,
        uid: user.uid,
        name: profile.name,
        token: profile.token,
        color: profile.color,
        money: chosenSettings.startingMoney,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        bankrupt: false,
        isHost: true,
      };
      const initial = createInitialGameState([hostPlayer], chosenSettings);
      const code = await createOnlineRoom(hostPlayer, chosenSettings, initial);
      setIsLocalMode(false);
      setActiveRoomId(code);
      setScreen('lobby');
      soundEngine.buyProperty();
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'تعذر إنشاء الغرفة.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinOnlineRoom = async (
    code: string,
    profile: { name: string; token: string; color: string }
  ) => {
    if (!user) return;
    setBusy(true);
    setErrorBanner(null);
    try {
      const res = await joinOnlineRoom(code, profile);
      setIsLocalMode(false);
      setActiveRoomId(res.roomId);
      setScreen('lobby');
      soundEngine.cashIn();
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'تعذر الانضمام للغرفة.');
    } finally {
      setBusy(false);
    }
  };

  const handleStartLocalGame = (players: Player[], chosenSettings: RoomSettings) => {
    setErrorBanner(null);
    setIsLocalMode(true);
    setActiveRoomId(null);
    setRoomDoc(null);
    setLocalSettings(chosenSettings);
    setLocalChat([]);
    setLocalState(createInitialGameState(players, chosenSettings));
    setScreen('game');
    soundEngine.buyProperty();
  };

  const handleUpdateHostSettings = async (nextSettings: RoomSettings) => {
    if (!roomDoc) return;
    const syncedPlayers = roomDoc.gameState.players.map((p) => ({
      ...p,
      money: nextSettings.startingMoney,
    }));
    await updateHostLobby(roomDoc.roomId, {
      settings: nextSettings,
      gameState: {
        ...roomDoc.gameState,
        players: syncedPlayers,
        lastActionId: `cfg_${Date.now()}`,
      },
    });
  };

  const handleKickLobbyPlayer = async (targetUid: string) => {
    if (!roomDoc || !user || roomDoc.hostUid !== user.uid || targetUid === roomDoc.hostUid) {
      return;
    }
    const kicked = roomDoc.gameState.players.find((p) => p.uid === targetUid);
    const nextPlayers = roomDoc.gameState.players.filter((p) => p.uid !== targetUid);
    const nextUids = roomDoc.playerUids.filter((id) => id !== targetUid);
    await updateHostLobby(roomDoc.roomId, {
      playerUids: nextUids,
      gameState: {
        ...roomDoc.gameState,
        players: nextPlayers,
        logs: [
          {
            id: `kick_${Date.now()}`,
            text: `قام صاحب الغرفة بإزالة ${kicked?.name || 'لاعب'} من غرفة الانتظار.`,
            category: 'system' as const,
            timestamp: Date.now(),
          },
          ...roomDoc.gameState.logs,
        ].slice(0, 80),
        lastActionId: `kick_${Date.now()}`,
      },
    });
  };

  const handleStartOnlineGame = async () => {
    if (!roomDoc || roomDoc.gameState.players.length < 2) return;
    const freshState = createInitialGameState(
      roomDoc.gameState.players,
      roomDoc.settings
    );
    await updateHostLobby(roomDoc.roomId, {
      status: 'playing',
      gameState: freshState,
    });
    soundEngine.buyProperty();
  };

  const handleLeaveToEntry = async () => {
    if (!isLocalMode && roomDoc && roomDoc.status === 'lobby' && user && roomDoc.hostUid !== user.uid) {
      await leaveOnlineLobby(roomDoc).catch(() => {});
    }
    setActiveRoomId(null);
    setRoomDoc(null);
    setLocalState(null);
    setOnlineChat([]);
    setLocalChat([]);
    setIsLocalMode(false);
    setSelectedSpace(null);
    setBuildModalSpaceIndex(null);
    setDismissedPurchaseActionId(null);
    promptedBuildActionIdRef.current = '';
    timedOutTurnRef.current = '';
    timedOutMatchRef.current = false;
    setShowTradeModal(false);
    setScreen('entry');
  };

  // Gameplay Action Wrappers
  const handleRollDice = () => {
    if (!gameState || !myPlayerId || isRolling) return;
    setIsRolling(true);
    soundEngine.diceRoll();
    setTimeout(() => {
      const res = rollDiceAndMove(gameState, settings, myPlayerId);
      setIsRolling(false);
      if (res.state !== gameState) {
        commitState(res.state, res.sound);
      }
    }, 320);
  };

  const handleBuyProperty = () => {
    if (!gameState || !myPlayerId) return;
    const res = buyCurrentProperty(gameState, myPlayerId);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleStartAuction = (spaceIndex: number) => {
    if (!gameState || !myPlayerId) return;
    const res = startAuction(gameState, spaceIndex, myPlayerId);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleAuctionBid = (playerId: string, increment: number) => {
    if (!gameState) return;
    const res = placeAuctionBid(gameState, playerId, increment);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleAuctionPass = (playerId: string) => {
    if (!gameState) return;
    const res = passAuction(gameState, playerId);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleEndTurn = () => {
    if (!gameState || !myPlayerId) return;
    const res = endTurn(gameState, myPlayerId);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handlePayBail = () => {
    if (!gameState || !myPlayerId) return;
    const res = payJailBail(gameState, settings, myPlayerId);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleUseJailCard = () => {
    if (!gameState || !myPlayerId) return;
    const res = useJailFreeCard(gameState, myPlayerId);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleBuildTier = (spaceIndex: number, targetLevel: 1 | 2 | 3) => {
    if (!gameState || !myPlayerId) return;
    const res = buildPropertyTier(gameState, myPlayerId, spaceIndex, targetLevel);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleSellBuilding = (spaceIndex: number) => {
    if (!gameState || !myPlayerId) return;
    const res = sellBuildingTier(gameState, myPlayerId, spaceIndex);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleToggleMortgage = (spaceIndex: number) => {
    if (!gameState || !myPlayerId) return;
    const res = toggleMortgage(gameState, myPlayerId, spaceIndex);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleDeclareBankruptcy = () => {
    if (!gameState || !myPlayerId) return;
    const res = declareBankruptcy(gameState, myPlayerId);
    if (res.state !== gameState) commitState(res.state, res.sound, res.gameFinished);
  };

  const handleSubmitTrade = (offer: {
    fromPlayerId: string;
    fromPlayerName: string;
    toPlayerId: string;
    toPlayerName: string;
    offerCash: number;
    requestCash: number;
    offerProperties: number[];
    requestProperties: number[];
  }) => {
    if (!gameState) return;
    const res = proposeTrade(gameState, offer);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleRespondTrade = (responderId: string, accept: boolean) => {
    if (!gameState) return;
    const res = respondToTrade(gameState, responderId, accept);
    if (res.state !== gameState) commitState(res.state, res.sound);
  };

  const handleDismissCard = () => {
    if (!gameState) return;
    const next = dismissActiveCard(gameState);
    if (next !== gameState) commitState(next);
  };

  const handleSendChat = async (text: string) => {
    if (!gameState) return;
    const sender =
      gameState.players.find((p) => p.id === myPlayerId) ||
      gameState.players[gameState.currentTurnIndex];
    if (!sender) return;

    if (isLocalMode) {
      soundEngine.chatPop();
      setLocalChat((prev) => [
        ...prev,
        {
          id: `lc_${Date.now()}`,
          roomId: 'LOCAL',
          senderUid: sender.uid,
          senderName: sender.name,
          senderColor: sender.color,
          text,
          participantUids: [],
          createdAtMs: Date.now(),
        },
      ]);
    } else if (roomDoc) {
      soundEngine.chatPop();
      await sendRoomChatMessage(roomDoc, sender.name, sender.color, text);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const activeManagingPlayer = gameState
    ? isLocalMode
      ? gameState.players[gameState.currentTurnIndex]
      : gameState.players.find((p) => p.id === myPlayerId) || null
    : null;

  const activeTurnPlayer = gameState
    ? gameState.players[gameState.currentTurnIndex] || null
    : null;

  const isMyActiveTurn = Boolean(
    activeTurnPlayer &&
      !activeTurnPlayer.bankrupt &&
      (isLocalMode || activeTurnPlayer.id === myPlayerId)
  );

  const isHostInGame = Boolean(
    screen === 'game' &&
      gameState &&
      gameState.turnPhase !== 'finished' &&
      (isLocalMode || (roomDoc && user && roomDoc.hostUid === user.uid))
  );

  // Live 1-second clock ticker while a game with Turn or Match timers is active
  const hasAnyTimer = Boolean(
    screen === 'game' &&
      gameState &&
      gameState.turnPhase !== 'finished' &&
      ((settings.turnTimeLimitSec || 0) > 0 || (settings.gameDurationMin || 0) > 0)
  );

  useEffect(() => {
    if (!hasAnyTimer) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hasAnyTimer]);

  const turnSecondsLeft: number | null =
    hasAnyTimer && (settings.turnTimeLimitSec || 0) > 0 && gameState
      ? Math.max(
          0,
          settings.turnTimeLimitSec -
            Math.floor((nowMs - (gameState.turnStartedAt || nowMs)) / 1000)
        )
      : null;

  const matchSecondsLeft: number | null =
    hasAnyTimer && (settings.gameDurationMin || 0) > 0 && gameState
      ? Math.max(
          0,
          settings.gameDurationMin * 60 -
            Math.floor((nowMs - (gameState.matchStartedAt || nowMs)) / 1000)
        )
      : null;

  // Enforce Match Duration Limit (triggered by Host or Local controller)
  useEffect(() => {
    if (
      !isHostInGame ||
      !gameState ||
      matchSecondsLeft === null ||
      matchSecondsLeft > 0 ||
      timedOutMatchRef.current
    ) {
      return;
    }
    timedOutMatchRef.current = true;
    const res = finishGameByTimeLimit(gameState, 'انتهى الوقت المحدد للمباراة!');
    if (res.state !== gameState) {
      commitState(res.state, res.sound, res.gameFinished);
    }
  }, [isHostInGame, gameState, matchSecondsLeft]);

  // Enforce Turn Countdown Limit for active player
  useEffect(() => {
    if (
      screen !== 'game' ||
      !gameState ||
      !activeTurnPlayer ||
      !isMyActiveTurn ||
      turnSecondsLeft === null ||
      turnSecondsLeft > 0 ||
      isTokenMoving ||
      isRolling ||
      gameState.activeAuction ||
      gameState.turnPhase === 'finished'
    ) {
      return;
    }

    const turnKey = `${gameState.turnCounter}_${gameState.turnPhase}_${gameState.lastActionId}`;
    if (timedOutTurnRef.current === turnKey) return;
    timedOutTurnRef.current = turnKey;

    if (gameState.activeCard) {
      handleDismissCard();
      return;
    }

    if (gameState.turnPhase === 'roll') {
      handleRollDice();
    } else if (gameState.turnPhase === 'buy_or_auction') {
      if (settings.auctionEnabled) {
        handleStartAuction(activeTurnPlayer.position);
      } else {
        handleEndTurn();
      }
    } else if (gameState.turnPhase === 'end_turn') {
      if (activeTurnPlayer.money < 0) {
        handleDeclareBankruptcy();
      } else {
        handleEndTurn();
      }
    }
  }, [
    screen,
    gameState,
    activeTurnPlayer,
    isMyActiveTurn,
    turnSecondsLeft,
    isTokenMoving,
    isRolling,
    settings.auctionEnabled,
  ]);

  const handleHostEndMatchEarly = () => {
    if (!gameState || !isHostInGame) return;
    const res = finishGameByTimeLimit(
      gameState,
      'أنهى صاحب الغرفة المباراة وحسب الفائز بأعلى ثروة!'
    );
    if (res.state !== gameState) {
      commitState(res.state, res.sound, res.gameFinished);
    }
  };

  const shouldShowPurchaseModal = Boolean(
    screen === 'game' &&
      gameState &&
      !isTokenMoving &&
      !gameState.activeCard &&
      !gameState.activeAuction &&
      gameState.turnPhase === 'buy_or_auction' &&
      isMyActiveTurn &&
      activeTurnPlayer &&
      dismissedPurchaseActionId !== gameState.lastActionId
  );

  const canLaunchAuctionFromBoard = Boolean(
    gameState &&
      !gameState.activeAuction &&
      !gameState.activeTrade &&
      settings.auctionEnabled &&
      gameState.turnPhase !== 'finished' &&
      (isLocalMode || gameState.players[gameState.currentTurnIndex]?.id === myPlayerId)
  );

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Clean Single-Row Top Bar (3 Zones) */}
      <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/90 px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Zone 1: Wordmark */}
        <button
          type="button"
          onClick={() => screen === 'entry' && setErrorBanner(null)}
          className="font-display text-lg font-black tracking-tight text-amber-400 whitespace-nowrap shrink-0 cursor-pointer"
        >
          بنك الحظ الكلاسيكي
        </button>

        {/* Zone 2: Concise Functional Controls */}
        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-300">
          {screen === 'game' && !isLocalMode && activeRoomId && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(activeRoomId).catch(() => {});
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 1500);
              }}
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="نسخ كود الغرفة"
            >
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="font-num">{activeRoomId}</span>
            </button>
          )}

          {screen === 'game' && matchSecondsLeft !== null && (
            <div
              className={`flex items-center gap-1.5 font-num text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${
                matchSecondsLeft <= 60 ? 'text-rose-400' : 'text-amber-300'
              }`}
              title="الوقت المتبقي للمباراة"
            >
              <Timer className="w-4 h-4" />
              <span>
                {Math.floor(matchSecondsLeft / 60)}:
                {String(matchSecondsLeft % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          {isHostInGame && (
            <button
              type="button"
              onClick={handleHostEndMatchEarly}
              className="hidden md:flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="إنهاء المباراة الآن وحساب الفائز بأعلى ثروة"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>إنهاء وحساب الثروات</span>
            </button>
          )}

          {/* Prominent "!" Exclamation Mark Button for Full Game Details & Cards Guide */}
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="تفاصيل اللعبة وطريقة اللعب وأنواع الكروت"
            aria-label="دليل اللعبة وتفاصيل الكروت"
          >
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-num font-black text-sm flex items-center justify-center leading-none">
              !
            </span>
            <span className="hidden sm:inline">دليل اللعبة</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="hidden sm:inline">{muted ? 'صامت' : 'الصوت'}</span>
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          {screen !== 'entry' ? (
            <button
              type="button"
              onClick={handleLeaveToEntry}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          ) : (
            <span className="font-num text-xs font-bold text-slate-400 whitespace-nowrap">
              BANK EL-HAZZ
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {screen === 'entry' && (
          <EntryScreen
            authReady={authReady}
            isSignedIn={Boolean(user)}
            anonymousDisabled={anonymousDisabled}
            authError={authError}
            busy={busy}
            errorBanner={errorBanner}
            onGoogleLogin={handleGoogleLogin}
            onOpenGuide={() => setShowGuideModal(true)}
            onCreateOnlineRoom={handleCreateOnlineRoom}
            onJoinOnlineRoom={handleJoinOnlineRoom}
            onStartLocalGame={handleStartLocalGame}
          />
        )}

        {screen === 'lobby' && roomDoc && user && (
          <WaitingLobby
            room={roomDoc}
            myUid={user.uid}
            onUpdateSettings={handleUpdateHostSettings}
            onKickPlayer={handleKickLobbyPlayer}
            onStartGame={handleStartOnlineGame}
            onLeaveLobby={handleLeaveToEntry}
          />
        )}

        {screen === 'game' && gameState && (
          <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-4 space-y-4">
            {errorBanner && (
              <div className="bg-rose-950/50 border border-rose-500/40 text-rose-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between">
                <span>{errorBanner}</span>
                <button
                  type="button"
                  onClick={() => setErrorBanner(null)}
                  className="text-rose-300 hover:text-white font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            )}

            {/* Perimeter Player HUD Strip */}
            <PlayerHUD
              state={gameState}
              myPlayerId={myPlayerId}
              isLocalMode={isLocalMode}
            />

            {/* Incoming Trade Notification Banner */}
            <IncomingTradeBanner
              state={gameState}
              myPlayerId={myPlayerId}
              isLocalMode={isLocalMode}
              onRespond={handleRespondTrade}
            />

            {/* Main 2-Column Game Table Layout: Dominant Board + Side HUD */}
            <div className="flex flex-col lg:flex-row items-start justify-center gap-4 xl:gap-6">
              <div className="w-full flex-1 min-w-0">
                <BoardView
                  state={gameState}
                  settings={settings}
                  myPlayerId={myPlayerId}
                  isLocalMode={isLocalMode}
                  isRolling={isRolling}
                  turnSecondsLeft={turnSecondsLeft}
                  matchSecondsLeft={matchSecondsLeft}
                  onMovementStateChange={setIsTokenMoving}
                  onSelectSpace={(idx) => setSelectedSpace(idx)}
                  onOpenBuildModal={(idx) => setBuildModalSpaceIndex(idx)}
                  onRollDice={handleRollDice}
                  onBuyProperty={handleBuyProperty}
                  onStartAuction={handleStartAuction}
                  onEndTurn={handleEndTurn}
                  onPayBail={handlePayBail}
                  onUseJailCard={handleUseJailCard}
                  onDeclareBankruptcy={handleDeclareBankruptcy}
                />
              </div>

              <SidePanel
                state={gameState}
                myPlayerId={myPlayerId}
                isLocalMode={isLocalMode}
                chatMessages={chatMessages}
                onOpenTrade={(targetId) => {
                  setTradeModalTargetId(targetId);
                  setShowTradeModal(true);
                }}
                onSelectSpace={(idx) => setSelectedSpace(idx)}
                onSendChat={handleSendChat}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {screen === 'game' && gameState && selectedSpace !== null && (
        <PropertyModal
          spaceIndex={selectedSpace}
          state={gameState}
          settings={settings}
          activePlayerId={activeManagingPlayer?.id || null}
          canLaunchAuction={canLaunchAuctionFromBoard}
          onClose={() => setSelectedSpace(null)}
          onBuildTier={handleBuildTier}
          onSellBuilding={handleSellBuilding}
          onToggleMortgage={handleToggleMortgage}
          onStartAuction={handleStartAuction}
        />
      )}

      {/* Interactive Purchase Modal ("وقفت على [المدينة]") */}
      {shouldShowPurchaseModal && gameState && activeTurnPlayer && (
        <PurchaseModal
          spaceIndex={activeTurnPlayer.position}
          state={gameState}
          settings={settings}
          player={activeTurnPlayer}
          onBuy={handleBuyProperty}
          onAuction={() => handleStartAuction(activeTurnPlayer.position)}
          onSkip={() => {
            if (!settings.auctionEnabled) {
              handleEndTurn();
            } else {
              setDismissedPurchaseActionId(gameState.lastActionId);
            }
          }}
        />
      )}

      {/* Interactive Full-Group Build Modal ("المجموعة كاملة — ابني في [المدينة]؟") */}
      {screen === 'game' &&
        gameState &&
        buildModalSpaceIndex !== null &&
        activeManagingPlayer &&
        !shouldShowPurchaseModal &&
        !gameState.activeCard &&
        !gameState.activeAuction && (
          <BuildModal
            initialSpaceIndex={buildModalSpaceIndex}
            state={gameState}
            player={activeManagingPlayer}
            onBuildTier={handleBuildTier}
            onClose={() => setBuildModalSpaceIndex(null)}
          />
        )}

      {screen === 'game' && gameState && gameState.activeAuction && (
        <AuctionModal
          state={gameState}
          myPlayerId={myPlayerId}
          isLocalMode={isLocalMode}
          onBid={handleAuctionBid}
          onPass={handleAuctionPass}
        />
      )}

      {screen === 'game' && gameState && gameState.activeCard && !isTokenMoving && (
        <CardModal state={gameState} onDismiss={handleDismissCard} />
      )}

      {screen === 'game' &&
        gameState &&
        showTradeModal &&
        activeManagingPlayer && (
          <TradeModal
            state={gameState}
            fromPlayer={activeManagingPlayer}
            initialTargetId={tradeModalTargetId}
            onClose={() => setShowTradeModal(false)}
            onSubmitTrade={handleSubmitTrade}
          />
        )}

      {screen === 'game' && gameState && (
        <VictoryModal state={gameState} onExitToMenu={handleLeaveToEntry} />
      )}

      {showGuideModal && <GameGuideModal onClose={() => setShowGuideModal(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BankElHazzApp />
    </ErrorBoundary>
  );
}
