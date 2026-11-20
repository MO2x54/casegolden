import React, { useState } from 'react';
import { PLAYER_COLORS, PLAYER_TOKENS } from '../data/boardData';
import { DEFAULT_SETTINGS } from '../engine/gameEngine';
import { Player, RoomDocument, RoomSettings } from '../types/game';
import { BuildingShape } from './BuildingShape';
import { HostDashboard } from './HostDashboard';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Crown,
  Globe,
  Landmark,
  LogIn,
  MonitorSmartphone,
  Play,
  Plus,
  Scale,
  Sliders,
  Trash2,
  UserMinus,
  Users,
} from 'lucide-react';

interface EntryScreenProps {
  authReady: boolean;
  isSignedIn: boolean;
  anonymousDisabled: boolean;
  authError: string | null;
  busy: boolean;
  errorBanner: string | null;
  onGoogleLogin: () => void;
  onOpenGuide: () => void;
  onCreateOnlineRoom: (
    profile: { name: string; token: string; color: string },
    chosenSettings: RoomSettings
  ) => void;
  onJoinOnlineRoom: (
    roomCode: string,
    profile: { name: string; token: string; color: string }
  ) => void;
  onStartLocalGame: (players: Player[], settings: RoomSettings) => void;
}

export const EntryScreen: React.FC<EntryScreenProps> = ({
  authReady,
  isSignedIn,
  anonymousDisabled,
  authError,
  busy,
  errorBanner,
  onGoogleLogin,
  onOpenGuide,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onStartLocalGame,
}) => {
  const [mode, setMode] = useState<'online' | 'local'>('online');

  // Online Player Profile + Pre-Creation Host Dashboard
  const [nickname, setNickname] = useState('أحمد');
  const [selectedToken, setSelectedToken] = useState(PLAYER_TOKENS[0].icon);
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0].hex);
  const [joinCode, setJoinCode] = useState('');
  const [showHostSetup, setShowHostSetup] = useState(false);
  const [hostSettings, setHostSettings] = useState<RoomSettings>({
    ...DEFAULT_SETTINGS,
  });

  // Local Pass-and-Play Setup (2..10 players)
  const [localSettings, setLocalSettings] = useState<RoomSettings>({
    ...DEFAULT_SETTINGS,
  });
  const [localPlayers, setLocalPlayers] = useState<
    Array<{ name: string; token: string; color: string }>
  >([
    { name: 'لاعب 1', token: PLAYER_TOKENS[0].icon, color: PLAYER_COLORS[0].hex },
    { name: 'لاعب 2', token: PLAYER_TOKENS[1].icon, color: PLAYER_COLORS[1].hex },
  ]);

  const addLocalPlayer = () => {
    if (localPlayers.length >= 10) return;
    const idx = localPlayers.length;
    setLocalPlayers([
      ...localPlayers,
      {
        name: `لاعب ${idx + 1}`,
        token: PLAYER_TOKENS[idx % PLAYER_TOKENS.length].icon,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length].hex,
      },
    ]);
  };

  const removeLocalPlayer = (index: number) => {
    if (localPlayers.length <= 2) return;
    setLocalPlayers(localPlayers.filter((_, i) => i !== index));
  };

  const updateLocalPlayer = (
    index: number,
    patch: Partial<{ name: string; token: string; color: string }>
  ) => {
    setLocalPlayers(
      localPlayers.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  };

  const handleLaunchLocal = () => {
    const built: Player[] = localPlayers.map((lp, idx) => ({
      id: `local_${idx + 1}`,
      uid: `local_${idx + 1}`,
      name: lp.name.trim() || `لاعب ${idx + 1}`,
      token: lp.token,
      color: lp.color,
      money: localSettings.startingMoney,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      bankrupt: false,
      isHost: idx === 0,
    }));
    onStartLocalGame(built, localSettings);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Clean Typographic Hero Banner + Interactive "!" Game Details Card (No Static Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-center space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-amber-400 text-xs font-bold">
            <Landmark className="w-4 h-4" />
            <span>ورثة هاشم حامد · صنع في مصر</span>
            <span aria-hidden="true">·</span>
            <span>حتى 10 لاعبين</span>
            <span aria-hidden="true">·</span>
            <span className="font-num">40 خانة</span>
          </div>

          <h1
            className="font-display text-3xl sm:text-5xl font-black text-white leading-tight"
            style={{ textWrap: 'balance' }}
          >
            بنك الحظ الكلاسيكي أونلاين
            <span className="block text-xl sm:text-2xl font-num font-bold text-amber-400 mt-1">
              BANK EL-HAZZ
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            النسخة المصرية التراثية بمدنها العربية وأعلامها بالجنيه، مع نظام البناء الأصلي{' '}
            <strong className="text-emerald-300">جراج</strong> و
            <strong className="text-sky-300">استراحة</strong> و
            <strong className="text-amber-300">سوق</strong>، وخانات{' '}
            <strong className="text-rose-300">المحاكمة ⚖️</strong> و
            <strong className="text-sky-300">حظّك 🎲</strong> و
            <strong className="text-amber-300">نادي الحظ</strong>، مع لوحة تحكم كاملة لصاحب الغرفة.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <span className="flex items-center gap-1.5">
              <BuildingShape level={1} size="xs" showLabel />
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <BuildingShape level={2} size="xs" showLabel />
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <BuildingShape level={3} size="xs" showLabel />
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>28 كارت حظّك ومحاكمة</span>
            </span>
          </div>
        </div>

        {/* Interactive "!" Exclamation Info Panel — Opens Complete Game Guide */}
        <div className="lg:col-span-4 bg-[#0D1422] border-t lg:border-t-0 lg:border-r border-slate-800 p-6 flex flex-col items-center justify-center text-center gap-4">
          <button
            type="button"
            onClick={onOpenGuide}
            className="group w-20 h-20 rounded-full bg-amber-500/15 hover:bg-amber-500 border-2 border-amber-400 text-amber-300 hover:text-slate-950 flex items-center justify-center transition-all duration-200 shadow-lg shadow-amber-500/15 hover:scale-105 cursor-pointer"
            aria-label="دليل اللعبة وتفاصيل الكروت والقواعد"
            title="اضغط لعرض دليل اللعبة الكامل"
          >
            <span className="font-num text-5xl font-black leading-none select-none">!</span>
          </button>

          <div className="space-y-1">
            <h2 className="font-display text-base font-extrabold text-white">
              تفاصيل اللعبة وطريقة اللعب
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[230px]">
              اضغط على علامة التعجب لاستعراض القواعد، نظام البناء، وجميع كروت حظّك والمحاكمة.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenGuide}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/35 font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            فتح الدليل الكامل وأنواع الكروت
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-[#111827] border border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => setMode('online')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-display font-bold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'online'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>لعب أونلاين (غرفة بكود)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('local')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-display font-bold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'local'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <MonitorSmartphone className="w-4 h-4" />
            <span>لعب محلي (نفس الجهاز)</span>
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="max-w-2xl mx-auto bg-rose-950/50 border border-rose-500/40 text-rose-200 rounded-xl px-4 py-3 text-sm text-center">
          {errorBanner}
        </div>
      )}

      {/* ONLINE MODE PANEL */}
      {mode === 'online' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Player Identity Card */}
            <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="font-display text-lg font-extrabold text-white">
                1. بطاقة اللاعب الخاصة بك
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block">
                  الاسم أو اللقب داخل الغرفة
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="اكتب اسمك هنا..."
                  className="w-full px-4 py-3 rounded-xl bg-[#0B101C] border border-slate-700 text-white text-sm font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block">
                  اختر قطعة اللعب (Token)
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {PLAYER_TOKENS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedToken(t.icon)}
                      className={`py-2.5 rounded-xl border text-xl flex items-center justify-center transition-all cursor-pointer ${
                        selectedToken === t.icon
                          ? 'bg-amber-500/20 border-amber-400 scale-105'
                          : 'bg-[#0B101C] border-slate-800 hover:border-slate-600'
                      }`}
                      title={t.label}
                    >
                      {t.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block">
                  اختر لونك المميز على اللوحة
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PLAYER_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                        selectedColor === c.hex
                          ? 'border-white scale-110 ring-2 ring-amber-400/60'
                          : 'border-slate-900 opacity-85 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {selectedColor === c.hex && (
                        <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Create or Join Room Card */}
            <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-white">
                  2. إنشاء أو الانضمام لغرفة أونلاين
                </h2>

                {!authReady ? (
                  <div className="text-sm text-slate-400 py-4 text-center">
                    جاري تجهيز الاتصال السحابي...
                  </div>
                ) : !isSignedIn ? (
                  <div className="bg-[#0B101C] border border-amber-500/35 rounded-xl p-4 space-y-3 text-center">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {anonymousDisabled
                        ? 'تسجيل الدخول المجهول (Anonymous Auth) غير مفعّل بعد في لوحة Firebase. يمكنك الدخول فوراً بحساب Google للعب أونلاين الآن:'
                        : authError || 'يرجى تسجيل الدخول للمتابعة في الغرف الأونلاين.'}
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onGoogleLogin}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                    >
                      تسجيل الدخول بحساب Google
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Toggle Pre-Creation Host Dashboard */}
                    <button
                      type="button"
                      onClick={() => setShowHostSetup((v) => !v)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0B101C] hover:bg-slate-900 border border-amber-500/35 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        <span>إعدادات الهوست (الوقت والقواعد قبل الإنشاء)</span>
                      </span>
                      {showHostSetup ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Create Room CTA */}
                    <button
                      type="button"
                      disabled={busy || !nickname.trim()}
                      onClick={() =>
                        onCreateOnlineRoom(
                          {
                            name: nickname.trim(),
                            token: selectedToken,
                            color: selectedColor,
                          },
                          hostSettings
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-45 text-slate-950 font-display font-extrabold text-base shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{busy ? 'جاري الإنشاء...' : 'إنشاء غرفة أونلاين جديدة'}</span>
                    </button>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex-1 h-px bg-slate-800" />
                      <span>أو انضم عبر كود الغرفة</span>
                      <span className="flex-1 h-px bg-slate-800" />
                    </div>

                    {/* Join by 5-char Code */}
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        maxLength={5}
                        value={joinCode}
                        onChange={(e) =>
                          setJoinCode(
                            e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                          )
                        }
                        placeholder="أدخل كود الغرفة (5 رموز)"
                        className="w-full px-4 py-3 rounded-xl bg-[#0B101C] border border-slate-700 text-center font-num text-lg tracking-[0.3em] uppercase text-amber-300 placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        disabled={busy || joinCode.length !== 5 || !nickname.trim()}
                        onClick={() =>
                          onJoinOnlineRoom(joinCode, {
                            name: nickname.trim(),
                            token: selectedToken,
                            color: selectedColor,
                          })
                        }
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white border border-slate-600 font-display font-bold text-sm transition-colors cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>انضمام إلى الغرفة</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                بمجرد إنشاء الغرفة ستظهر لك لوحة تحكم الهوست الكاملة لتعديل الوقت والقواعد وإدارة اللاعبين قبل البدء.
              </p>
            </div>
          </div>

          {/* Collapsible Pre-Creation Host Dashboard */}
          {showHostSetup && isSignedIn && (
            <HostDashboard
              settings={hostSettings}
              editable={true}
              onChange={setHostSettings}
              showMaxPlayers={true}
            />
          )}
        </div>
      )}

      {/* LOCAL MODE PANEL */}
      {mode === 'local' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-display text-lg font-extrabold text-white">
                إعداد اللعب المحلي على نفس الجهاز
              </h2>
              <p className="text-xs text-slate-400">
                أضف من 2 إلى 10 لاعبين واضبط المؤقتات وقواعد البنك ثم ابدأ فوراً.
              </p>
            </div>
            <button
              type="button"
              disabled={localPlayers.length >= 10}
              onClick={addLocalPlayer}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 border border-slate-700 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة لاعب ({localPlayers.length}/10)</span>
            </button>
          </div>

          {/* Local Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {localPlayers.map((lp, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 bg-[#0B101C] border border-slate-800 rounded-xl p-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    const nextTokenIdx =
                      (PLAYER_TOKENS.findIndex((t) => t.icon === lp.token) + 1) %
                      PLAYER_TOKENS.length;
                    updateLocalPlayer(idx, { token: PLAYER_TOKENS[nextTokenIdx].icon });
                  }}
                  style={{ backgroundColor: lp.color }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 border-slate-950 shrink-0 cursor-pointer"
                  title="اضغط لتغيير القطعة"
                >
                  {lp.token}
                </button>

                <input
                  type="text"
                  maxLength={24}
                  value={lp.name}
                  onChange={(e) => updateLocalPlayer(idx, { name: e.target.value })}
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-400"
                />

                <button
                  type="button"
                  onClick={() => {
                    const nextColorIdx =
                      (PLAYER_COLORS.findIndex((c) => c.hex === lp.color) + 1) %
                      PLAYER_COLORS.length;
                    updateLocalPlayer(idx, { color: PLAYER_COLORS[nextColorIdx].hex });
                  }}
                  style={{ backgroundColor: lp.color }}
                  className="w-7 h-7 rounded-full border-2 border-white/40 shrink-0 cursor-pointer"
                  title="تغيير اللون"
                />

                {localPlayers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeLocalPlayer(idx)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                    aria-label="حذف اللاعب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Full Host Dashboard for Local Mode */}
          <HostDashboard
            settings={localSettings}
            editable={true}
            onChange={setLocalSettings}
            showMaxPlayers={false}
          />

          <button
            type="button"
            onClick={handleLaunchLocal}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold text-base shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5" />
            <span>بدء اللعبة المحلية الآن</span>
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Online Waiting Lobby Screen (With Dedicated Host Dashboard)                */
/* -------------------------------------------------------------------------- */

interface WaitingLobbyProps {
  room: RoomDocument;
  myUid: string;
  onUpdateSettings: (settings: RoomSettings) => void;
  onKickPlayer: (targetUid: string) => void;
  onStartGame: () => void;
  onLeaveLobby: () => void;
}

export const WaitingLobby: React.FC<WaitingLobbyProps> = ({
  room,
  myUid,
  onUpdateSettings,
  onKickPlayer,
  onStartGame,
  onLeaveLobby,
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostUid === myUid;
  const players = room.gameState.players;

  const copyCode = () => {
    navigator.clipboard?.writeText(room.roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Room Code Header Card */}
      <div className="bg-[#111827] border border-amber-500/35 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-right">
          <div className="text-xs text-amber-400 font-bold">
            غرفة انتظار أونلاين · شارك الكود مع أصدقائك
          </div>
          <h2 className="font-display text-2xl font-black text-white">
            كود الغرفة:{' '}
            <span className="font-num text-amber-400 tracking-[0.22em]">
              {room.roomId}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ الكود!' : 'نسخ كود الغرفة'}</span>
          </button>

          <button
            type="button"
            onClick={onLeaveLobby}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-sm cursor-pointer whitespace-nowrap"
          >
            مغادرة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Connected Players List */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>
                اللاعبون ({players.length} / {room.settings.maxPlayers})
              </span>
            </h3>
            <span className="text-xs text-slate-400">الحد الأدنى: لاعبان</span>
          </div>

          <div className="space-y-2.5">
            {players.map((p) => {
              const isPlayerHost = p.uid === room.hostUid;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#0B101C] border border-slate-800"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 border-slate-950 shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.token}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-sm text-white truncate">
                        {p.name}
                      </span>
                      {isPlayerHost && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.uid === myUid
                        ? 'أنت'
                        : isPlayerHost
                        ? 'صاحب الغرفة (الهوست)'
                        : 'جاهز للعب'}
                    </div>
                  </div>

                  {isHost && !isPlayerHost && (
                    <button
                      type="button"
                      onClick={() => onKickPlayer(p.uid)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={`إزالة ${p.name} من الغرفة`}
                      aria-label={`إزالة ${p.name}`}
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800">
            {isHost ? (
              <button
                type="button"
                disabled={players.length < 2}
                onClick={onStartGame}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-display font-extrabold text-base transition-colors cursor-pointer"
              >
                <Play className="w-5 h-5" />
                <span>
                  {players.length < 2
                    ? 'بانتظار انضمام لاعب آخر...'
                    : 'ابدأ اللعبة الآن'}
                </span>
              </button>
            ) : (
              <div className="text-center text-xs text-slate-400 bg-[#0B101C] border border-slate-800 rounded-xl py-3 px-4">
                بانتظار صاحب الغرفة لضبط الإعدادات وبدء اللعبة...
              </div>
            )}
          </div>
        </div>

        {/* Dedicated Host Dashboard (Full Width on Right Column) */}
        <div className="lg:col-span-7">
          <HostDashboard
            settings={room.settings}
            editable={isHost}
            onChange={onUpdateSettings}
            showMaxPlayers={true}
            compact={false}
          />
        </div>
      </div>
    </div>
  );
};
