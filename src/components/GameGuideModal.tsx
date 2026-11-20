import React, { useState } from 'react';
import {
  BOARD_SPACES,
  COLOR_GROUP_META,
  HAZZAK_CARDS,
  MAHKAMA_CARDS,
} from '../data/boardData';
import { CardEffectType, ColorGroupId } from '../types/game';
import { BuildingShape } from './BuildingShape';
import { CountryFlag } from './CountryFlag';
import {
  BookOpen,
  Building2,
  Compass,
  Dices,
  Scale,
  Sparkles,
  X,
} from 'lucide-react';

interface GameGuideModalProps {
  onClose: () => void;
}

type GuideTab = 'how_to_play' | 'buildings' | 'cards' | 'spaces';

const EFFECT_TYPE_LABELS: Record<CardEffectType, { label: string; color: string }> = {
  gain_money: { label: 'مكافأة مالية', color: 'text-emerald-300' },
  pay_money: { label: 'غرامة مالية', color: 'text-rose-300' },
  move_to: { label: 'انتقال لخانة', color: 'text-sky-300' },
  move_relative: { label: 'تحريك خطوات', color: 'text-sky-300' },
  go_to_jail: { label: 'دخول السجن', color: 'text-rose-400' },
  jail_free_card: { label: 'بطاقة أمان', color: 'text-amber-300' },
  collect_from_all: { label: 'تحصيل من الجميع', color: 'text-emerald-300' },
  pay_to_all: { label: 'دفع للجميع', color: 'text-rose-300' },
  repairs: { label: 'صيانة مبانٍ', color: 'text-amber-300' },
};

const CITY_GROUPS: ColorGroupId[] = [
  'brown',
  'sky',
  'rose',
  'orange',
  'red',
  'gold',
  'emerald',
  'royal',
];

export const GameGuideModal: React.FC<GameGuideModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<GuideTab>('how_to_play');
  const [cardFilter, setCardFilter] = useState<'all' | 'hazzak' | 'mahkama'>('all');

  const tabs: Array<{ id: GuideTab; label: string; icon: React.ReactNode }> = [
    { id: 'how_to_play', label: 'طريقة اللعب', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'buildings', label: 'المباني والمجموعات', icon: <Building2 className="w-4 h-4" /> },
    { id: 'cards', label: 'أنواع الكروت (28)', icon: <Dices className="w-4 h-4" /> },
    { id: 'spaces', label: 'خانات الرقعة', icon: <Compass className="w-4 h-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#111927] border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#0D1422] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-num font-black text-xl flex items-center justify-center shrink-0">
              !
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-black text-white leading-tight">
                دليل بنك الحظ الكلاسيكي الكامل
              </h3>
              <p className="text-xs text-slate-400">
                طريقة اللعب · نظام الجراج والاستراحة والسوق · جميع كروت حظّك والمحاكمة · الخانات الخاصة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Tabs */}
        <div className="px-4 pt-3 pb-2 bg-[#0D1422]/70 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-display font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm text-slate-300 leading-relaxed">
          {/* TAB 1: HOW TO PLAY */}
          {tab === 'how_to_play' && (
            <div className="space-y-4">
              <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="font-display font-extrabold text-amber-300 text-base">
                  الهدف من اللعبة
                </h4>
                <p>
                  امتلاك أكبر عدد من المدن والمجموعات اللونية العربية، وتطويرها ببناء{' '}
                  <strong className="text-emerald-300">الجراجات</strong> و
                  <strong className="text-sky-300">الاستراحات</strong> و
                  <strong className="text-amber-300">الأسواق</strong> لتحصيل أعلى الإيجارات من
                  المنافسين حتى تبقى آخر لاعب صامد غير مفلس — أو تكون صاحب{' '}
                  <strong className="text-white">أعلى صافي ثروة</strong> عند انتهاء وقت المباراة
                  المحدد من صاحب الغرفة.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="font-display font-bold text-white">1. الرصيد والمرور بالبداية</div>
                  <p className="text-xs text-slate-300">
                    يبدأ كل لاعب بالرصيد الافتراضي <strong className="font-num text-amber-300">1,200 جنيه</strong> (قابل للتعديل من لوحة تحكم الهوست)، ويتقاضى{' '}
                    <strong className="font-num text-emerald-300">350 جنيه</strong> عند المرور بنقطة البداية. ويمكن للهوست تفعيل مضاعفة المكافأة (×2) عند الوقوف عليها تماماً.
                  </p>
                </div>

                <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="font-display font-bold text-white">2. النرد وقاعدة الدبل</div>
                  <p className="text-xs text-slate-300">
                    عند رمي رقمين متماثلين (دبل) تحصل على رمية إضافية بعد إتمام حركتك. لكن إذا رميت{' '}
                    <strong className="text-rose-300">3 دبلات متتالية</strong> تنتقل فوراً إلى السجن!
                  </p>
                </div>

                <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="font-display font-bold text-white">3. الشراء والمزادات العلنية</div>
                  <p className="text-xs text-slate-300">
                    عند الوقوف على مدينة غير مملوكة تظهر نافذة الشراء بحاسبة فورية للرصيد. إذا رفضت الشراء (أو ضغطت على أي مدينة متاحة على الرقعة) تُطرح في{' '}
                    <strong className="text-amber-300">مزاد علني حي</strong> بزيادات +50 و+100 و+500 جنيه.
                  </p>
                </div>

                <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="font-display font-bold text-white">4. الصفقات والرهن والإفلاس</div>
                  <p className="text-xs text-slate-300">
                    يمكنك عقد صفقات تبادل (كاش + مدن بدون مبانٍ) مع أي لاعب، أو رهن مدنك مقابل 50% من قيمتها وفك الرهن مقابل 55%. إذا أصبح رصيدك سالباً ولم تغطِّ الدين تعلن الإفلاس وتعود أملاكك للبنك.
                  </p>
                </div>
              </div>

              <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="font-display font-bold text-amber-300">5. نظام التوقيت (لوحة تحكم الهوست)</div>
                <p className="text-xs text-slate-300">
                  يمكن لصاحب الغرفة تحديد <strong>مؤقت لكل دور</strong> (مثلاً 45 أو 60 ثانية) لمنع التأخير — وعند انتهاء الوقت يتم تنفيذ حركة الدور تلقائياً — كما يمكنه تحديد <strong>مدة إجمالية للمباراة</strong> (15 إلى 90 دقيقة) يُحسب بعدها الفائز تلقائياً بأعلى صافي ثروة.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: BUILDINGS & COLOR GROUPS */}
          {tab === 'buildings' && (
            <div className="space-y-5">
              <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="font-display font-extrabold text-white text-base">
                  نظام البناء الكلاسيكي في بنك الحظ (دفع فرق التكلفة فقط)
                </h4>
                <p className="text-xs text-slate-300">
                  عندما تجمع <strong>جميع مدن نفس المجموعة اللونية</strong>، يتضاعف إيجار الأرض الفضاء تلقائياً (×2)، ويُفتح لك البناء والترقية على 3 مستويات متتالية. عند الترقية من مستوى لآخر تدفع للبنك{' '}
                  <strong className="text-emerald-300">فرق التكلفة فقط</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-[#111927] border border-emerald-500/35 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-300 font-display font-extrabold">
                      <BuildingShape level={1} size="md" />
                      <span>المستوى 1: جراج</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      الشكل: مستطيل أخضر ▬. أول مستوى بناء ويرفع الإيجار بشكل كبير عن الأرض الفضاء.
                    </p>
                  </div>

                  <div className="bg-[#111927] border border-sky-500/35 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sky-300 font-display font-extrabold">
                      <BuildingShape level={2} size="md" />
                      <span>المستوى 2: استراحة</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      الشكل: مثلث سماوي ▲. يمكنك بناؤها مباشرة أو الترقية من الجراج بدفع الفرق فقط.
                    </p>
                  </div>

                  <div className="bg-[#111927] border border-amber-500/40 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-display font-extrabold">
                      <BuildingShape level={3} size="md" />
                      <span>المستوى 3: سوق</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      الشكل: مربع ذهبي ■. أعلى مستوى استثماري على الرقعة ويدرّ أعلى عائد إيجار.
                    </p>
                  </div>
                </div>
              </div>

              {/* All 8 Color Groups */}
              <div className="space-y-2.5">
                <h4 className="font-display font-extrabold text-white text-sm">
                  المجموعات اللونية الثمانية على الرقعة (23 مدينة عربية)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CITY_GROUPS.map((grpId) => {
                    const meta = COLOR_GROUP_META[grpId];
                    return (
                      <div
                        key={grpId}
                        className="bg-[#0B111E] border border-slate-800 rounded-xl p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: meta.hex }}
                            />
                            <span className="font-display font-bold text-xs text-white">
                              {meta.name}
                            </span>
                          </div>
                          <span className="font-num text-[11px] text-slate-400">
                            {meta.indices.length} مدن
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {meta.indices.map((idx) => {
                            const sp = BOARD_SPACES[idx];
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-xs text-slate-200 bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-1"
                              >
                                {sp.country && <CountryFlag code={sp.country} className="w-4 h-2.5" />}
                                <span>{sp.name}</span>
                                <span className="font-num text-[10px] text-amber-300">
                                  {sp.price} ج
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALL CARDS (HAZZAK + MAHKAMA) */}
          {tab === 'cards' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  تحتوي اللعبة على مجموعتين من الكروت (14 كارت حظّك + 14 كارت محاكمة) تظهر متزامنة لجميع لاعبي الغرفة.
                </p>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'all' as const, label: 'الكل (28)' },
                    { id: 'hazzak' as const, label: 'حظّك 🎲 (14)' },
                    { id: 'mahkama' as const, label: 'محاكمة ⚖️ (14)' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCardFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        cardFilter === f.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {(cardFilter === 'all' || cardFilter === 'hazzak') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-display font-extrabold text-sky-300 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>كروت حظّك 🎲 (14 كارت)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {HAZZAK_CARDS.map((card) => {
                      const meta = EFFECT_TYPE_LABELS[card.effectType];
                      return (
                        <div
                          key={card.id}
                          className="bg-[#0D1A2E] border border-sky-500/25 rounded-xl p-3 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-bold text-xs text-white">
                              {card.title}
                            </span>
                            <span className={`text-[10px] font-bold shrink-0 ${meta.color}`}>
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(cardFilter === 'all' || cardFilter === 'mahkama') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-display font-extrabold text-amber-300 text-sm">
                    <Scale className="w-4 h-4" />
                    <span>كروت المحاكمة ⚖️ (14 كارت)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MAHKAMA_CARDS.map((card) => {
                      const meta = EFFECT_TYPE_LABELS[card.effectType];
                      return (
                        <div
                          key={card.id}
                          className="bg-[#201322] border border-amber-500/25 rounded-xl p-3 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-bold text-xs text-white">
                              {card.title}
                            </span>
                            <span className={`text-[10px] font-bold shrink-0 ${meta.color}`}>
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SPECIAL BOARD SPACES */}
          {tab === 'spaces' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="font-display font-extrabold text-emerald-300">🏛️ نقطة البداية</div>
                <p className="text-xs text-slate-300">
                  كل دورة كاملة تمر فيها بنقطة البداية تمنحك مكافأة البنك (350 جنيه افتراضياً). وإذا فعّل الهوست خيار مضاعفة الوقوف تحصل على ضعف المكافأة عند التوقف عليها بالضبط.
                </p>
              </div>

              <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="font-display font-extrabold text-rose-300">⛓️ السجن / اذهب للسجن 🚓</div>
                <p className="text-xs text-slate-300">
                  الوقوف العادي على خانة السجن هو «زيارة فقط». أما المسجون فيخرج بأحد 4 طرق: رمي دبل، دفع الكفالة (50 جنيه افتراضياً)، استخدام بطاقة أمان، أو تلقائياً بعد 3 أدوار.
                </p>
              </div>

              <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="font-display font-extrabold text-amber-300">🏆 نادي الحظ (خزينة الغرامات)</div>
                <p className="text-xs text-slate-300">
                  استراحة مجانية؛ وعند تفعيل «خزينة نادي الحظ» تتجمع فيها كل غرامات المحاكمة وكفالات السجن ليفوز بها أول لاعب يقف على هذه الخانة.
                </p>
              </div>

              <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="font-display font-extrabold text-sky-300">🚌 خطوط النقل السريع (4 خانات)</div>
                <p className="text-xs text-slate-300">
                  الأتوبيس السريع، مطار القاهرة، ميناء الإسكندرية، وسكة حديد مصر. إيجارها يتصاعد حسب عدد الخطوط التي تمتلكها معاً:{' '}
                  <strong className="font-num text-amber-300">25 / 50 / 100 / 200 جنيه</strong>.
                </p>
              </div>

              <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 space-y-1.5 sm:col-span-2">
                <div className="font-display font-extrabold text-amber-200">⛽ محطات البنزين والمرافق (خانتان)</div>
                <p className="text-xs text-slate-300">
                  محطة بنزين النيل ومحطة بنزين الشرق. يُحسب إيجارها بضرب مجموع رقمي النرد × <strong className="text-amber-300">4</strong> عند امتلاك محطة واحدة، أو × <strong className="text-amber-300">10</strong> عند امتلاك المحطتين معاً.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
