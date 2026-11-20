import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ChatMessage, GameState, Player, RoomDocument, RoomSettings } from './types/game';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInGuestOrDetect(): Promise<{
  user: User | null;
  anonymousDisabled: boolean;
  errorMessage?: string;
}> {
  if (auth.currentUser) {
    return { user: auth.currentUser, anonymousDisabled: false };
  }
  try {
    const cred = await signInAnonymously(auth);
    return { user: cred.user, anonymousDisabled: false };
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code || '';
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/admin-restricted-operation'
    ) {
      return { user: null, anonymousDisabled: true };
    }
    if (code === 'auth/unauthorized-domain') {
      return {
        user: null,
        anonymousDisabled: false,
        errorMessage:
          'الدومين الحالي غير مضاف في Firebase (أضفه من Firebase Console ← Authentication ← Settings ← Authorized domains)؛ ويمكنك اللعب محلياً الآن بدون إنترنت.',
      };
    }
    return {
      user: null,
      anonymousDisabled: false,
      errorMessage: error instanceof Error ? error.message : 'تعذر تسجيل الدخول',
    };
  }
}

export async function signInWithGooglePopup(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code || '';
    if (code === 'auth/unauthorized-domain') {
      throw new Error(
        'هذا الرابط غير مضاف في الدومينات المسموحة داخل Firebase. أضف mo2x54.github.io من Firebase Console ← Authentication ← Settings ← Authorized domains.'
      );
    }
    throw error;
  }
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function sanitizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
}

/**
 * Ensures GameState strictly adheres to firebase-blueprint.json & firestore.rules constraints
 */
function sanitizeGameState(gs: GameState): GameState {
  return {
    players: gs.players.slice(0, 10),
    properties: gs.properties,
    currentTurnIndex: Math.max(0, Math.min(9, Math.floor(gs.currentTurnIndex))),
    turnPhase: gs.turnPhase.slice(0, 32) as GameState['turnPhase'],
    dice: [Math.floor(gs.dice[0]), Math.floor(gs.dice[1])],
    consecutiveDoubles: Math.max(0, Math.min(3, Math.floor(gs.consecutiveDoubles))),
    treasuryPool: Math.max(0, Math.min(1000000, Math.floor(gs.treasuryPool))),
    logs: gs.logs.slice(0, 80),
    activeCard: gs.activeCard ?? null,
    activeAuction: gs.activeAuction ?? null,
    activeTrade: gs.activeTrade ?? null,
    winnerId: gs.winnerId ? gs.winnerId.slice(0, 128) : null,
    turnCounter: Math.max(0, Math.min(100000, Math.floor(gs.turnCounter))),
    lastActionId: (gs.lastActionId || 'init').slice(0, 64),
    matchStartedAt: Math.max(0, Math.floor(gs.matchStartedAt || 0)),
    turnStartedAt: Math.max(0, Math.floor(gs.turnStartedAt || 0)),
  };
}

function sanitizeSettings(s: RoomSettings): RoomSettings {
  return {
    startingMoney: Math.max(500, Math.min(20000, Math.floor(s.startingMoney ?? 1200))),
    goReward: Math.max(50, Math.min(2000, Math.floor(s.goReward ?? 350))),
    freeParkingJackpot: Boolean(s.freeParkingJackpot ?? true),
    maxPlayers: Math.max(2, Math.min(10, Math.floor(s.maxPlayers ?? 10))),
    auctionEnabled: Boolean(s.auctionEnabled ?? true),
    turnTimeLimitSec: Math.max(0, Math.min(300, Math.floor(s.turnTimeLimitSec ?? 0))),
    gameDurationMin: Math.max(0, Math.min(180, Math.floor(s.gameDurationMin ?? 0))),
    jailBail: Math.max(25, Math.min(500, Math.floor(s.jailBail ?? 50))),
    doubleGoBonus: Boolean(s.doubleGoBonus ?? false),
  };
}

export async function createOnlineRoom(
  hostPlayer: Player,
  settings: RoomSettings,
  initialGameState: GameState
): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يجب تسجيل الدخول أولاً لإنشاء غرفة أونلاين.');

  // Generate unique 5-char room code
  let roomId = generateRoomCode();
  for (let attempt = 0; attempt < 4; attempt++) {
    const existing = await getDoc(doc(db, 'rooms', roomId));
    if (!existing.exists()) break;
    roomId = generateRoomCode();
  }

  const path = `rooms/${roomId}`;
  const cleanHost: Player = {
    ...hostPlayer,
    id: uid,
    uid,
    name: hostPlayer.name.trim().slice(0, 32) || 'لاعب',
    isHost: true,
  };

  const payload = {
    roomId,
    hostUid: uid,
    status: 'lobby' as const,
    playerUids: [uid],
    settings: sanitizeSettings(settings),
    gameState: sanitizeGameState({
      ...initialGameState,
      players: [cleanHost],
    }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'rooms', roomId), payload);
    return roomId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function joinOnlineRoom(
  rawCode: string,
  joiningPlayer: Omit<Player, 'id' | 'uid' | 'money' | 'position' | 'inJail' | 'jailTurns' | 'getOutOfJailCards' | 'bankrupt' | 'isHost'>
): Promise<{ roomId: string; alreadyJoined?: boolean }> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يجب تسجيل الدخول أولاً للانضمام إلى الغرفة.');

  const roomId = sanitizeRoomCode(rawCode);
  if (roomId.length !== 5) {
    throw new Error('كود الغرفة يجب أن يتكون من 5 أحرف أو أرقام.');
  }

  const path = `rooms/${roomId}`;
  const roomRef = doc(db, 'rooms', roomId);

  let snap;
  try {
    snap = await getDoc(roomRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!snap.exists()) {
    throw new Error('لم يتم العثور على غرفة بهذا الكود. تأكد من الكود وحاول مجدداً.');
  }

  const room = snap.data() as RoomDocument;

  if (room.playerUids.includes(uid)) {
    return { roomId, alreadyJoined: true };
  }

  if (room.status !== 'lobby') {
    throw new Error('هذه الغرفة بدأت اللعب بالفعل ولا يمكن الانضمام حالياً.');
  }

  if (room.playerUids.length >= Math.min(10, room.settings.maxPlayers)) {
    throw new Error('الغرفة مكتملة العدد حالياً.');
  }

  const newPlayer: Player = {
    id: uid,
    uid,
    name: joiningPlayer.name.trim().slice(0, 32) || 'لاعب',
    token: joiningPlayer.token,
    color: joiningPlayer.color,
    money: room.settings.startingMoney,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailCards: 0,
    bankrupt: false,
    isHost: false,
  };

  const nextPlayerUids = [...room.playerUids, uid];
  const nextGameState = sanitizeGameState({
    ...room.gameState,
    players: [...room.gameState.players, newPlayer],
    logs: [
      {
        id: `join_${Date.now()}`,
        text: `انضم ${newPlayer.name} (${newPlayer.token}) إلى الغرفة.`,
        category: 'system' as const,
        timestamp: Date.now(),
      },
      ...room.gameState.logs,
    ].slice(0, 80),
    lastActionId: `join_${Date.now()}`,
  });

  try {
    await updateDoc(roomRef, {
      playerUids: nextPlayerUids,
      gameState: nextGameState,
      updatedAt: serverTimestamp(),
    });
    return { roomId };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function leaveOnlineLobby(room: RoomDocument): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || room.hostUid === uid || room.status !== 'lobby') return;

  const path = `rooms/${room.roomId}`;
  const nextPlayerUids = room.playerUids.filter((id) => id !== uid);
  const leavingPlayer = room.gameState.players.find((p) => p.uid === uid);
  const nextPlayers = room.gameState.players.filter((p) => p.uid !== uid);

  const nextGameState = sanitizeGameState({
    ...room.gameState,
    players: nextPlayers,
    logs: [
      {
        id: `leave_${Date.now()}`,
        text: `غادر ${leavingPlayer?.name || 'لاعب'} غرفة الانتظار.`,
        category: 'system' as const,
        timestamp: Date.now(),
      },
      ...room.gameState.logs,
    ].slice(0, 80),
    lastActionId: `leave_${Date.now()}`,
  });

  try {
    await updateDoc(doc(db, 'rooms', room.roomId), {
      playerUids: nextPlayerUids,
      gameState: nextGameState,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateHostLobby(
  roomId: string,
  updates: {
    settings?: RoomSettings;
    status?: 'lobby' | 'playing';
    gameState?: GameState;
    playerUids?: string[];
  }
): Promise<void> {
  const path = `rooms/${roomId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.settings) payload.settings = sanitizeSettings(updates.settings);
  if (updates.status) payload.status = updates.status;
  if (updates.gameState) payload.gameState = sanitizeGameState(updates.gameState);
  if (updates.playerUids) payload.playerUids = updates.playerUids.slice(0, 10);

  try {
    await updateDoc(doc(db, 'rooms', roomId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function pushGameplayState(
  roomId: string,
  nextState: GameState,
  status: 'playing' | 'finished' = 'playing'
): Promise<void> {
  const path = `rooms/${roomId}`;
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      gameState: sanitizeGameState(nextState),
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToRoom(
  roomId: string,
  onData: (room: RoomDocument | null) => void,
  onError?: (err: Error) => void
) {
  const path = `rooms/${roomId}`;
  return onSnapshot(
    doc(db, 'rooms', roomId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as RoomDocument);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError) onError(wrapped as Error);
      }
    }
  );
}

export async function sendRoomChatMessage(
  room: RoomDocument,
  senderName: string,
  senderColor: string,
  rawText: string
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const text = rawText.trim().slice(0, 240);
  if (!text) return;

  const messageId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `rooms/${room.roomId}/messages/${messageId}`;

  try {
    await setDoc(doc(db, 'rooms', room.roomId, 'messages', messageId), {
      roomId: room.roomId,
      senderUid: uid,
      senderName: senderName.trim().slice(0, 32) || 'لاعب',
      senderColor: senderColor.slice(0, 24) || '#F59E0B',
      text,
      participantUids: room.playerUids.slice(0, 10),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToRoomMessages(
  roomId: string,
  currentUid: string,
  onMessages: (msgs: ChatMessage[]) => void
) {
  const path = `rooms/${roomId}/messages`;
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    where('participantUids', 'array-contains', currentUid),
    limit(80)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: ChatMessage[] = snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | null;
        return {
          id: d.id,
          roomId: data.roomId,
          senderUid: data.senderUid,
          senderName: data.senderName,
          senderColor: data.senderColor,
          text: data.text,
          participantUids: data.participantUids || [],
          createdAtMs: ts ? ts.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => a.createdAtMs - b.createdAtMs);
      onMessages(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
