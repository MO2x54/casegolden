import React from 'react';
import { RoomSettings } from '../types/game';
import {
  Clock,
  Coins,
  Crown,
  Sliders,
  Timer,
  Zap,
} from 'lucide-react';

interface HostDashboardProps {
  settings: RoomSettings;
  editable: boolean;
  onChange: (next: RoomSettings) => void;
  showMaxPlayers?: boolean;
  compact?: boolean;
}

interface PresetItem {
  id: string;
  label: string;
  subtitle: string;
  apply: (current: RoomSettings) => RoomSettings;
}

const HOST_PRESETS: PresetItem[] = [
  {
    id: 'classic',
    label: 'كلاسيكي أصلي',
    subtitle: '1,200 ج · وقت مفتوح · كفالة 50 ج',
    apply: (cur) => ({
      ...cur,
      startingMoney: 1200,
      goReward: 350,
      jailBail: 50,
      turnTimeLimitSec: 0,
      gameDurationMin: 0,
      freeParkingJackpot: true,
      auctionEnabled: true,
      doubleGoBonus: false,
    }),
  },
  {
    id: 'blitz',
    label: 'جيم سريع (15 د)',
    subtitle: '1,500 ج · دور 45 ث · مباراة 15 د',
    apply: (cur) => ({
      ...cur,
      startingMoney: 1500,
      goReward: 400,
      jailBail: 50,
      turnTimeLimitSec: 45,
      gameDurationMin: 15,
      freeParkingJackpot: true,
      auctionEnabled: true,
      doubleGoBonus: true,
    }),
  },
  {
    id: 'tycoon',
    label: 'تحدّي المليونير',
    subtitle: '3,000 ج · دور 60 ث · مضاعفة البداية',
    apply: (cur) => ({
      ...cur,
      startingMoney: 3000,
      goReward: 500,
      jailBail: 100,
      turnTimeLimitSec: 60,
      gameDurationMin: 45,
      freeParkingJackpot: true,
      auctionEnabled: true,
      doubleGoBonus: true,
    }),
  },
];

export const HostDashboard: React.FC<HostDashboardProps> = ({
  settings,
  editable,
  onChange,
  showMaxPlayers = true,
  compact = false,
}) => {
  const update = <K extends keyof RoomSettings>(key: K, val: RoomSettings[K]) => {
    if (!editable) return;
    onChange({ ...settings, [key]: val });
  };

  const turnLabel =
    settings.turnTimeLimitSec > 0 ? `${settings.turnTimeLimitSec} ثانية` : 'مفتوح';
  const matchLabel =
    settings.gameDurationMin > 0 ? `${settings.gameDurationMin} دقيقة` : 'حتى الإفلاس';

  return (
    <div className="bg-[#0D1422] border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="font-display text-sm sm:text-base font-extrabold text-white">
            لوحة تحكم صاحب الغرفة (Host Dashboard)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          {editable ? 'تحكم كامل بالوقت والقواعد' : 'قواعد الغرفة الحالية (عرض فقط)'}
        </span>
      </div>

      {/* Quick Presets (Editable only) */}
      {editable && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>قوالب جاهزة سريعة:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {HOST_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.apply(settings))}
                className="text-right px-3 py-2 rounded-xl bg-[#121C2E] hover:bg-amber-500/15 border border-slate-800 hover:border-amber-400/50 transition-colors cursor-pointer"
              >
                <div className="font-display font-bold text-xs text-amber-300">
                  {preset.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {preset.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section 1: Time & Clocks */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
          <Timer className="w-3.5 h-3.5" />
          <span>إعدادات الوقت والمؤقتات</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>وقت الدور لكل لاعب</span>
            </label>
            <select
              disabled={!editable}
              value={settings.turnTimeLimitSec}
              onChange={(e) => update('turnTimeLimitSec', Number(e.target.value))}
              className="w-full bg-[#090F1B] border border-slate-700 disabled:opacity-65 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-num focus:outline-none focus:border-amber-400"
            >
              <option value={0}>بدون حد زمني (مفتوح)</option>
              <option value={30}>30 ثانية (سريع جداً)</option>
              <option value={45}>45 ثانية (سريع)</option>
              <option value={60}>60 ثانية (متوازن)</option>
              <option value={90}>90 ثانية</option>
              <option value={120}>120 ثانية (دقيقتان)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
              <Timer className="w-3 h-3 text-slate-400" />
              <span>مدة المباراة الكلية</span>
            </label>
            <select
              disabled={!editable}
              value={settings.gameDurationMin}
              onChange={(e) => update('gameDurationMin', Number(e.target.value))}
              className="w-full bg-[#090F1B] border border-slate-700 disabled:opacity-65 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-num focus:outline-none focus:border-amber-400"
            >
              <option value={0}>مفتوحة حتى إفلاس الجميع</option>
              <option value={15}>15 دقيقة (أعلى ثروة يفوز)</option>
              <option value={30}>30 دقيقة</option>
              <option value={45}>45 دقيقة</option>
              <option value={60}>60 دقيقة (ساعة)</option>
              <option value={90}>90 دقيقة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Bank Economy */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <Coins className="w-3.5 h-3.5" />
          <span>إعدادات البنك واللاعبين</span>
        </div>

        <div
          className={`grid grid-cols-2 ${
            showMaxPlayers && !compact ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
          } gap-2.5`}
        >
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              رصيد البداية
            </label>
            <select
              disabled={!editable}
              value={settings.startingMoney}
              onChange={(e) => update('startingMoney', Number(e.target.value))}
              className="w-full bg-[#090F1B] border border-slate-700 disabled:opacity-65 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white font-num focus:outline-none focus:border-amber-400"
            >
              {[1000, 1200, 1500, 2000, 3000, 5000].map((v) => (
                <option key={v} value={v}>
                  {v.toLocaleString('en-US')} ج
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              مكافأة البداية
            </label>
            <select
              disabled={!editable}
              value={settings.goReward}
              onChange={(e) => update('goReward', Number(e.target.value))}
              className="w-full bg-[#090F1B] border border-slate-700 disabled:opacity-65 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white font-num focus:outline-none focus:border-amber-400"
            >
              {[200, 300, 350, 400, 500].map((v) => (
                <option key={v} value={v}>
                  {v} ج
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              كفالة السجن
            </label>
            <select
              disabled={!editable}
              value={settings.jailBail}
              onChange={(e) => update('jailBail', Number(e.target.value))}
              className="w-full bg-[#090F1B] border border-slate-700 disabled:opacity-65 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white font-num focus:outline-none focus:border-amber-400"
            >
              {[50, 100, 150, 200].map((v) => (
                <option key={v} value={v}>
                  {v} ج
                </option>
              ))}
            </select>
          </div>

          {showMaxPlayers && (
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                أقصى لاعبين
              </label>
              <select
                disabled={!editable}
                value={settings.maxPlayers}
                onChange={(e) => update('maxPlayers', Number(e.target.value))}
                className="w-full bg-[#090F1B] border border-slate-700 disabled:opacity-65 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white font-num focus:outline-none focus:border-amber-400"
              >
                {[2, 4, 6, 8, 10].map((v) => (
                  <option key={v} value={v}>
                    {v} لاعبين
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Special House Rules */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
          <Sliders className="w-3.5 h-3.5" />
          <span>القواعد الإضافية للغرفة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
              settings.freeParkingJackpot
                ? 'bg-emerald-500/10 border-emerald-500/35 text-slate-100'
                : 'bg-[#090F1B] border-slate-800 text-slate-400'
            } ${editable ? 'cursor-pointer' : 'opacity-80'}`}
          >
            <input
              type="checkbox"
              disabled={!editable}
              checked={settings.freeParkingJackpot}
              onChange={(e) => update('freeParkingJackpot', e.target.checked)}
              className="accent-amber-500 w-4 h-4 shrink-0"
            />
            <span>خزينة نادي الحظ</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
              settings.auctionEnabled
                ? 'bg-emerald-500/10 border-emerald-500/35 text-slate-100'
                : 'bg-[#090F1B] border-slate-800 text-slate-400'
            } ${editable ? 'cursor-pointer' : 'opacity-80'}`}
          >
            <input
              type="checkbox"
              disabled={!editable}
              checked={settings.auctionEnabled}
              onChange={(e) => update('auctionEnabled', e.target.checked)}
              className="accent-amber-500 w-4 h-4 shrink-0"
            />
            <span>المزادات العلنية</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
              settings.doubleGoBonus
                ? 'bg-emerald-500/10 border-emerald-500/35 text-slate-100'
                : 'bg-[#090F1B] border-slate-800 text-slate-400'
            } ${editable ? 'cursor-pointer' : 'opacity-80'}`}
          >
            <input
              type="checkbox"
              disabled={!editable}
              checked={settings.doubleGoBonus}
              onChange={(e) => update('doubleGoBonus', e.target.checked)}
              className="accent-amber-500 w-4 h-4 shrink-0"
            />
            <span>×2 عند الوقوف بالبداية</span>
          </label>
        </div>
      </div>

      {/* Live Unboxed Rule Summary */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span>
          الرصيد: <strong className="font-num text-amber-300">{settings.startingMoney} ج</strong>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          الدور: <strong className="text-sky-300">{turnLabel}</strong>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          المباراة: <strong className="text-sky-300">{matchLabel}</strong>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          الكفالة: <strong className="font-num text-slate-200">{settings.jailBail} ج</strong>
        </span>
      </div>
    </div>
  );
};
