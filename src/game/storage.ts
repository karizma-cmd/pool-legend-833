/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerProfile, CueItem, TableSkin, BallSkin } from './types';

export const CUES_CATALOG: CueItem[] = [
  {
    id: 'cue_birch',
    name: 'Standard Birch',
    arabicName: 'خشب البتولا الكلاسيكي',
    price: 0,
    unlocked: true,
    power: 2,
    aimLength: 2,
    spinControl: 2,
    tier: 'starter',
    description: 'The reliable starter cue with balanced weight and smooth natural birch finish.',
    arabicDescription: 'عصا البداية المعتمدة بتوازن ممتاز وخشب بتولا طبيعي ناعم ومريح للمبتدئين.',
    primaryColor: '#b45309',
    accentColor: '#78350f',
    shaftMaterial: 'birch',
  },
  {
    id: 'cue_carbon',
    name: 'Tactical Shadow Carbon',
    arabicName: 'كاربون الظل التكتيكي',
    price: 20000,
    unlocked: false,
    power: 3,
    aimLength: 3,
    spinControl: 3,
    tier: 'common',
    description: 'Aerospace-grade carbon fiber composite shaft with vibration reduction technology.',
    arabicDescription: 'سبيكة ألياف الكربون المقاومة للانحناء مع تقليل ارتداد الضربة وتحسين الدقة.',
    primaryColor: '#18181b',
    accentColor: '#38bdf8',
    shaftMaterial: 'carbon',
  },
  {
    id: 'cue_falcon',
    name: 'Royal Arabian Falcon',
    arabicName: 'صقر الصحراء المذهب',
    price: 50000,
    unlocked: false,
    power: 4,
    aimLength: 4,
    spinControl: 4,
    tier: 'rare',
    description: 'Bespoke golden falcon filigree with premium genuine leather wrap for exquisite cue control.',
    arabicDescription: 'تصميم ملكي مستوحى من الصقر العربي بنقوش ذهبية ومقبض جلدي يوفر دوراناً استثنائياً للكرات.',
    primaryColor: '#d97706',
    accentColor: '#fbbf24',
    shaftMaterial: 'gold',
  },
  {
    id: 'cue_dragon',
    name: 'Volcanic Dragonfire',
    arabicName: 'لهب التنين البركاني',
    price: 95000,
    unlocked: false,
    power: 5,
    aimLength: 4,
    spinControl: 4,
    tier: 'epic',
    description: 'Tempered crimson maple with dragon scale grip for explosive break power.',
    arabicDescription: 'خشب القيقب الناري المعالج حرارياً لتوليد قوة كسر تفجيرية تشق رصّة الكرات بسهولة.',
    primaryColor: '#dc2626',
    accentColor: '#f59e0b',
    shaftMaterial: 'maple',
  },
  {
    id: 'cue_viper',
    name: 'Royal Viper Emerald',
    arabicName: 'أفعى الزمرد الملكية',
    price: 150000,
    unlocked: false,
    power: 4,
    aimLength: 5,
    spinControl: 5,
    tier: 'epic',
    description: 'Iridescent emerald viper wrap with precision counter-balance for razor-sharp spin shots.',
    arabicDescription: 'جلد ثعبان أخضر زمردي فاخر مع موازنة سحرية تسمح بإعطاء دوران جانبي حاد للكرات المعقدة.',
    primaryColor: '#065f46',
    accentColor: '#34d399',
    shaftMaterial: 'obsidian',
  },
  {
    id: 'cue_pharaoh',
    name: 'Golden Pharaoh Sovereign',
    arabicName: 'فرعون الذهب الخالص',
    price: 220000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'legendary',
    description: 'Legendary gold leaf wrapping with Egyptian lapis lazuli accents. Maximum tournament stats.',
    arabicDescription: 'مغطاة بالكامل بالذهب عيار 24 مع تطعيمات حجر اللازورد الملكي وإحصائيات بطولات كاملة.',
    primaryColor: '#ca8a04',
    accentColor: '#1e3a8a',
    shaftMaterial: 'gold',
  },
  {
    id: 'cue_obsidian',
    name: 'Black Diamond Eclipse',
    arabicName: 'كسوف الأوبسيديان الفضائي',
    price: 300000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'legendary',
    description: 'Carved from volcanic obsidian with deep amethyst reflections, striking fear on the felt.',
    arabicDescription: 'منحوتة من زجاج الأوبسيديان البركاني المصقول مع طاقة بنفسجية ترهب الخصوم على الطاولة.',
    primaryColor: '#1e1b4b',
    accentColor: '#c084fc',
    shaftMaterial: 'obsidian',
  },
  {
    id: 'cue_nebula',
    name: 'Cosmic Nebula Star',
    arabicName: 'سديم الفضاء الكوني',
    price: 390000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'Infused with starlight and interstellar matter, providing surreal hydrodynamic accuracy.',
    arabicDescription: 'عصا نيزكية تسخر طاقة النجوم لتوفير دقة تسديد وتحكم هيدروديناميكي لا يُضاهى.',
    primaryColor: '#4c1d95',
    accentColor: '#38bdf8',
    shaftMaterial: 'neon',
  },
  {
    id: 'cue_titan',
    name: 'Quantum Titan Apex',
    arabicName: 'تيتان الكم الخارق',
    price: 480000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'The pinnacle of high-tech pool engineering, titanium alloy shaft with anti-friction coating.',
    arabicDescription: 'أعظم إنجاز في تاريخ البلياردو الاحترافي، سبيكة تيتانيوم مضادة للجاذبية بقمة الأداء.',
    primaryColor: '#0369a1',
    accentColor: '#f8fafc',
    shaftMaterial: 'carbon',
  },
  {
    id: 'cue_frostbite',
    name: 'Valkyrie Frost Crystalline',
    arabicName: 'صقيع الفالكيري الكريستالي',
    price: 580000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'Carved from glacial sapphire with shimmering polar ice crystals that freeze the table.',
    arabicDescription: 'منحوتة من ياقوت القطب الجليدي مع بلورات متوهجة تجمد الطاولة بدقة توجيه خارقة.',
    primaryColor: '#0284c7',
    accentColor: '#bae6fd',
    shaftMaterial: 'neon',
  },
  {
    id: 'cue_katana',
    name: 'Samurai Katana Edge',
    arabicName: 'سيف الساموراي الإمبراطوري',
    price: 670000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'Folded Damascus steel shaft with braided crimson Tsuka grip and razor-honed balance.',
    arabicDescription: 'فولاذ دمشقي مطوي مع مقبض تسوكا ياباني مجدول باللون القرمزي لقطع زوايا الكرات بحدة السيف.',
    primaryColor: '#881337',
    accentColor: '#e11d48',
    shaftMaterial: 'carbon',
  },
  {
    id: 'cue_phoenix',
    name: 'Phoenix Sunburst Apex',
    arabicName: 'وهج العنقاء الأسطورية',
    price: 760000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'Forged in immortal solar flames, radiating solar flares and golden embers with every strike.',
    arabicDescription: 'مصنوعة من ريش ولهب طائر العنقاء الخالد، تشع شرارات ذهبية شمسية مع كل ضربة.',
    primaryColor: '#b45309',
    accentColor: '#fef08a',
    shaftMaterial: 'gold',
  },
  {
    id: 'cue_dark_matter',
    name: 'Dark Matter Singularity',
    arabicName: 'ثقب المادة المظلمة',
    price: 840000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'Harnesses a gravitational micro-singularity to pull object balls straight into the pockets.',
    arabicDescription: 'تسخر جاذبية الثقوب السوداء لسحب الكرات مباشرة إلى الجيوب بقوة جذب كونية مذهلة.',
    primaryColor: '#0f172a',
    accentColor: '#a855f7',
    shaftMaterial: 'obsidian',
  },
  {
    id: 'cue_excalibur',
    name: 'Excalibur Royal Sovereign',
    arabicName: 'إكسكاليبور الملكي الأعظم',
    price: 910000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'The legendary sword of kings reborn as an unrivaled cue stick crowned with flawless diamonds.',
    arabicDescription: 'سيف الملوك الأسطوري متجسد في عصا ملكية مرصعة بالماس والياقوت الأزرق الملكي.',
    primaryColor: '#1e3a8a',
    accentColor: '#fbbf24',
    shaftMaterial: 'gold',
  },
  {
    id: 'cue_cyberpunk',
    name: 'Cyberpunk Glitch Matrix',
    arabicName: 'ماتريكس السايبربانك المتوهج',
    price: 960000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'Holographic circuit boards pulsing with synthetic cyber neon code and hyper-reactive sensors.',
    arabicDescription: 'دوائر إلكترونية مجسمة بنبضات شيفرة الماتريكس الخضراء مع استجابة فائقة السرعة.',
    primaryColor: '#15803d',
    accentColor: '#4ade80',
    shaftMaterial: 'neon',
  },
  {
    id: 'cue_zeus',
    name: 'Thunderbolt Zeus Immortal',
    arabicName: 'صاعقة زيوس الرعدية',
    price: 985000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'Electrified Greek lightning bolt captured in crystalline ether, striking with thunderous impact.',
    arabicDescription: 'صاعقة برق إلهية محبوسة في زجاج نقي تضرب رصة الكرات بقوة زلزالية خارقة.',
    primaryColor: '#1d4ed8',
    accentColor: '#60a5fa',
    shaftMaterial: 'neon',
  },
  {
    id: 'cue_jade_dragon',
    name: 'Imperial Jade Dragon',
    arabicName: 'تنين الإمبراطور الزمردي',
    price: 995000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'Carved from an unbroken boulder of pure Imperial Jade with serpentine 24K gold dragon scales.',
    arabicDescription: 'منحوتة من حجر اليشم الإمبراطوري الخالص مع حراشف تنين ذهبية عيار 24 للملوك فقط.',
    primaryColor: '#047857',
    accentColor: '#fbbf24',
    shaftMaterial: 'gold',
  },
  {
    id: 'cue_grandmaster',
    name: 'Eternal Grandmaster Sovereign',
    arabicName: 'الملك الأسطوري الأبدي',
    price: 1000000,
    unlocked: false,
    power: 5,
    aimLength: 5,
    spinControl: 5,
    tier: 'mythic',
    description: 'The ultimate pool cue in existence. Solid mirror-polished platinum with red ruby inlays.',
    arabicDescription: 'أعظم وأثمن عصا في تاريخ لعبة البلياردو. بلاتين خالص مصقول بمرآة مع ياقوت أحمر ملكي نادر.',
    primaryColor: '#94a3b8',
    accentColor: '#ef4444',
    shaftMaterial: 'gold',
  },
];

export const TABLES_CATALOG: TableSkin[] = [
  {
    id: 'table_classic_8bp',
    name: '8 Ball Pool Classic Royal Blue',
    arabicName: 'طاولة 8 بال بول الملكية (الأصلية)',
    price: 0,
    unlocked: true,
    feltColor: '#026ee6', // Rich 8BP Royal Blue
    feltRoughness: 0.8,
    frameColor: '#7a3311', // Classic polished mahogany
    frameMaterial: 'mahogany',
    accentColor: '#38bdf8',
    textureUrl: '/assets/aistudio/897605018_1801695377894810_7053844980198404968_n_0e54bafe.jpg',
  },
  {
    id: 'table_wildwest',
    name: 'Wild West Wanted 8BP',
    arabicName: 'طاولة الغرب الأمريكي (8BP)',
    price: 0,
    unlocked: true,
    feltColor: '#8f381c', // Warm rust/terracotta leather felt from reference image
    feltRoughness: 0.82,
    frameColor: '#78350f', // Antique carved mahogany wood
    frameMaterial: 'mahogany',
    accentColor: '#f59e0b',
  },
  {
    id: 'table_green',
    name: 'Classic Tournament Green',
    arabicName: 'أخضر البطولات الملكي',
    price: 0,
    unlocked: true,
    feltColor: '#15803d',
    feltRoughness: 0.8,
    frameColor: '#854d0e', // Warm luxury polished mahogany
    frameMaterial: 'mahogany',
    accentColor: '#eab308',
  },
  {
    id: 'table_midnight',
    name: 'Midnight Navy Blue',
    arabicName: 'أزرق كحلي ليلي فاخر',
    price: 1500,
    unlocked: false,
    feltColor: '#1e3a8a',
    feltRoughness: 0.75,
    frameColor: '#09090b',
    frameMaterial: 'ebony',
    accentColor: '#38bdf8',
  },
  {
    id: 'table_ruby',
    name: 'Royal Ruby Crimson',
    arabicName: 'مخمل الياقوت القرمزي',
    price: 2500,
    unlocked: false,
    feltColor: '#881337',
    feltRoughness: 0.78,
    frameColor: '#451a03',
    frameMaterial: 'mahogany',
    accentColor: '#fbbf24',
  },
  {
    id: 'table_cyber',
    name: 'Cyberpunk Neon Matrix',
    arabicName: 'ماتريكس السايبربانك المتوهج',
    price: 10000,
    unlocked: false,
    feltColor: '#312e81',
    feltRoughness: 0.7,
    frameColor: '#030712',
    frameMaterial: 'cyber',
    accentColor: '#a855f7',
  },
  {
    id: 'table_gold',
    name: 'Golden VIP Sovereign',
    arabicName: 'طاولة الذهب الخالص VIP',
    price: 25000,
    unlocked: false,
    feltColor: '#09090b', // Jet onyx slate
    feltRoughness: 0.65,
    frameColor: '#d97706', // 24K Gold rail casting
    frameMaterial: 'gold',
    accentColor: '#f59e0b',
  },
  {
    id: 'table_emerald',
    name: 'Emerald Pharaoh Oasis',
    arabicName: 'واحة الزمرد الملكية',
    price: 50000,
    unlocked: false,
    feltColor: '#064e3b',
    feltRoughness: 0.72,
    frameColor: '#78350f',
    frameMaterial: 'gold',
    accentColor: '#34d399',
  },
  {
    id: 'table_carbon',
    name: 'Tactical Shadow Carbon',
    arabicName: 'كاربون الظل التكتيكي',
    price: 100000,
    unlocked: false,
    feltColor: '#334155', // Slate graphite felt
    feltRoughness: 0.7,
    frameColor: '#0f172a',
    frameMaterial: 'carbon',
    accentColor: '#38bdf8',
  },
  {
    id: 'table_lava',
    name: 'Dragonfire Lava Volcanic',
    arabicName: 'حمم التنين البركاني',
    price: 250000,
    unlocked: false,
    feltColor: '#991b1b', // Molten lava red felt
    feltRoughness: 0.75,
    frameColor: '#1c1917', // Scorched blackwood
    frameMaterial: 'mahogany',
    accentColor: '#f97316',
  },
];

export const BALLS_CATALOG: BallSkin[] = [
  {
    id: 'balls_classic',
    name: 'Official Tournament Resin',
    price: 0,
    unlocked: true,
    style: 'classic',
  },
  {
    id: 'balls_pearl',
    name: 'High-Gloss Pearl Finish',
    price: 800,
    unlocked: false,
    style: 'pearl',
  },
  {
    id: 'balls_neon',
    name: 'Cyber Glow Neon Set',
    price: 1800,
    unlocked: false,
    style: 'neon',
  },
];

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  rewardCoins: number;
  unlocked: boolean;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_break', title: 'Opening Break', desc: 'Take your first break shot in any mode', icon: '🎱', rewardCoins: 100, unlocked: false },
  { id: 'first_win', title: 'First Victory', desc: 'Win your first match against AI or a friend', icon: '🏆', rewardCoins: 250, unlocked: false },
  { id: 'pot_10', title: 'Sharpshooter', desc: 'Pot 10 object balls in your career', icon: '🎯', rewardCoins: 300, unlocked: false },
  { id: 'pot_50', title: 'Billiards Master', desc: 'Pot 50 object balls', icon: '💎', rewardCoins: 800, unlocked: false },
  { id: 'tournament_champ', title: 'Grand Champion', desc: 'Win an 8-player bracket tournament', icon: '👑', rewardCoins: 1500, unlocked: false },
  { id: 'bank_shot', title: 'Bank Shot Wizard', desc: 'Pot a ball via cushion rebound', icon: '⚡', rewardCoins: 400, unlocked: false },
  { id: 'streak_3', title: 'On Fire', desc: 'Win 3 matches in a row', icon: '🔥', rewardCoins: 600, unlocked: false },
  { id: 'hotspot_connect', title: 'Local Legend', desc: 'Play an offline hotspot multiplayer match', icon: '📡', rewardCoins: 500, unlocked: false },
];

export interface DailyChallenge {
  id: string;
  title: string;
  desc: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
}

export interface TournamentGiftData {
  id: string;
  type: 'cue' | 'coins';
  cueId?: string;
  cueName?: string;
  cueArabicName?: string;
  cueTier?: string;
  coinsAmount?: number;
  claimed: boolean;
  date: number;
}

export type BetSettlementStatus = 'NONE' | 'PENDING' | 'SETTLED_WIN' | 'SETTLED_LOSS';

export interface MatchBetSession {
  matchId: string;
  stakeAmount: number;
  status: BetSettlementStatus;
  gameMode: string;
  opponentName: string;
  timestamp: number;
  settledAt?: number;
  payoutAmount?: number;
  netProfit?: number;
}

export interface SettledMatchRecord {
  matchId: string;
  status: BetSettlementStatus;
  stakeAmount: number;
  payout: number;
  netProfit: number;
  timestamp: number;
}

const STORAGE_KEY_PROFILE = 'pool_legends_profile_v1';
const STORAGE_KEY_CUES = 'pool_legends_cues_v1';
const STORAGE_KEY_TABLES = 'pool_legends_tables_v1';
const STORAGE_KEY_BALLS = 'pool_legends_balls_v1';
const STORAGE_KEY_ACHIEVEMENTS = 'pool_legends_achievements_v1';
const STORAGE_KEY_DAILY = 'pool_legends_daily_v1';
const STORAGE_KEY_TOURNAMENT_GIFT = 'pool_legends_tournament_gift_v1';
const STORAGE_KEY_ACTIVE_BET = 'pool_legends_active_bet_v1';
const STORAGE_KEY_SETTLED_MATCHES = 'pool_legends_settled_matches_v1';

const memoryStore = new Map<string, string>();
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {}
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {}
    memoryStore.delete(key);
  },
};

class StorageManager {
  public getProfile(): PlayerProfile {
    try {
      const data = safeStorage.getItem(STORAGE_KEY_PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        // Ensure valid number for player coins without overwriting 0
        if (typeof parsed.coins !== 'number' || isNaN(parsed.coins) || parsed.coins < 0) {
          parsed.coins = 2500;
        } else {
          parsed.coins = Math.floor(parsed.coins);
        }
        // Upgrade legacy default table to the new 8BP Royal Blue table
        if (!parsed.selectedTableFelt || parsed.selectedTableFelt === 'table_wildwest') {
          parsed.selectedTableFelt = 'table_classic_8bp';
          parsed.selectedTableFrame = 'table_classic_8bp';
        }
        this.saveProfile(parsed);
        return parsed;
      }
    } catch {}

    const defaultProfile: PlayerProfile = {
      id: 'player_' + Math.random().toString(36).substring(2, 8),
      name: 'Cue Master',
      avatar: '🎱',
      level: 1,
      xp: 0,
      coins: 2500, // 2500 starting cash advance
      selectedCueId: 'cue_birch',
      selectedTableFelt: 'table_classic_8bp',
      selectedTableFrame: 'table_classic_8bp',
      selectedBallSkin: 'balls_classic',
      matchesWon: 0,
      matchesLost: 0,
      ballsPottedTotal: 0,
      tournamentsWon: 0,
      highestStreak: 0,
      currentStreak: 0,
    };
    this.saveProfile(defaultProfile);
    return defaultProfile;
  }

  public saveProfile(profile: PlayerProfile) {
    try {
      profile.coins = Math.max(0, Math.floor(profile.coins));
      safeStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch {}
  }

  public addCoins(amount: number): number {
    const profile = this.getProfile();
    profile.coins = Math.max(0, Math.floor(profile.coins + amount));
    this.saveProfile(profile);
    return profile.coins;
  }

  public deductCoins(amount: number): number {
    const profile = this.getProfile();
    profile.coins = Math.max(0, Math.floor(profile.coins - amount));
    this.saveProfile(profile);
    return profile.coins;
  }

  // =========================================================================
  // ATOMIC WALLET & EXACTLY-ONCE BETTING ENGINE (نظام تسوية الرهانات الذري)
  // =========================================================================

  public getSettledMatches(): Record<string, SettledMatchRecord> {
    try {
      const data = safeStorage.getItem(STORAGE_KEY_SETTLED_MATCHES);
      if (data) return JSON.parse(data);
    } catch {}
    return {};
  }

  public isMatchAlreadySettled(matchId: string): boolean {
    const settled = this.getSettledMatches();
    return Boolean(settled[matchId]);
  }

  public recordSettledMatch(matchId: string, status: BetSettlementStatus, stakeAmount: number, payout: number, netProfit: number) {
    try {
      const map = this.getSettledMatches();
      map[matchId] = {
        matchId,
        status,
        stakeAmount,
        payout,
        netProfit,
        timestamp: Date.now(),
      };
      // Keep memory pruned to the last 150 matches
      const keys = Object.keys(map);
      if (keys.length > 150) {
        const sorted = keys.sort((a, b) => map[b].timestamp - map[a].timestamp);
        const pruned: Record<string, SettledMatchRecord> = {};
        for (let i = 0; i < 100; i++) {
          pruned[sorted[i]] = map[sorted[i]];
        }
        safeStorage.setItem(STORAGE_KEY_SETTLED_MATCHES, JSON.stringify(pruned));
      } else {
        safeStorage.setItem(STORAGE_KEY_SETTLED_MATCHES, JSON.stringify(map));
      }
    } catch {}
  }

  public getActiveBet(): MatchBetSession | null {
    try {
      const data = safeStorage.getItem(STORAGE_KEY_ACTIVE_BET);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return null;
  }

  public saveActiveBet(bet: MatchBetSession | null) {
    try {
      if (bet) {
        safeStorage.setItem(STORAGE_KEY_ACTIVE_BET, JSON.stringify(bet));
      } else {
        safeStorage.removeItem(STORAGE_KEY_ACTIVE_BET);
      }
    } catch {}
  }

  /**
   * Starts a new match bet with atomic deduction and balance validation.
   * 1. Checks if player wallet balance covers stakeAmount.
   * 2. Deducts stakeAmount ONCE from player wallet upon confirming bet & match start.
   * 3. Records original bet with status 'PENDING' and unique Match ID.
   * 4. Settles any abandoned previous pending match as SETTLED_LOSS to prevent exploits.
   */
  public startMatchBet(
    matchId: string, 
    stakeAmount: number, 
    details?: { opponentName?: string; mode?: string }
  ): { success: boolean; currentBalance: number; bet?: MatchBetSession; error?: string } {
    // Check if an earlier match was left abandoned/pending (e.g. reload/browser close/surrender)
    const existing = this.getActiveBet();
    if (existing && existing.status === 'PENDING') {
      this.forfeitActiveBet(existing.matchId);
    }

    const profile = this.getProfile();

    // Free / Zero-stake match (e.g. Cup tournaments, local practice, pass-and-play)
    if (stakeAmount <= 0) {
      const freeBet: MatchBetSession = {
        matchId,
        stakeAmount: 0,
        status: 'PENDING',
        gameMode: details?.mode || '8ball',
        opponentName: details?.opponentName || 'Opponent',
        timestamp: Date.now(),
      };
      this.saveActiveBet(freeBet);
      return { success: true, currentBalance: profile.coins, bet: freeBet };
    }

    // STRICT VALIDATION: Player CANNOT bet more than their current wallet balance!
    if (profile.coins < stakeAmount) {
      return { 
        success: false, 
        currentBalance: profile.coins, 
        error: 'INSUFFICIENT_FUNDS' 
      };
    }

    // Deduct stake amount IMMEDIATELY from profile upon confirming bet & match start!
    profile.coins = Math.max(0, profile.coins - stakeAmount);
    this.saveProfile(profile);

    // Record Active Bet as PENDING
    const activeBet: MatchBetSession = {
      matchId,
      stakeAmount,
      status: 'PENDING',
      gameMode: details?.mode || '8ball',
      opponentName: details?.opponentName || 'Opponent',
      timestamp: Date.now(),
    };
    this.saveActiveBet(activeBet);

    return { 
      success: true, 
      currentBalance: profile.coins, 
      bet: activeBet 
    };
  }

  /**
   * Settles the match bet with EXACTLY-ONCE Settlement Guarantee:
   * - If WIN: NOTHING is deducted from the player, and they win DOUBLE the staked amount once!
   * - If LOSS: The staked amount is deducted from the player's wallet once upon defeat.
   */
  public settleMatchBet(
    matchId: string, 
    isWin: boolean
  ): { 
    success: boolean; 
    stakeAmount: number;
    netProfit: number; 
    payout: number; 
    newBalance: number; 
    status: BetSettlementStatus; 
    alreadySettled?: boolean; 
    bet?: MatchBetSession 
  } {
    const profile = this.getProfile();

    // 1. Guard against duplicate settlement via settled history
    const settledMap = this.getSettledMatches();
    if (settledMap[matchId]) {
      const rec = settledMap[matchId];
      return {
        success: false,
        alreadySettled: true,
        stakeAmount: rec.stakeAmount || 0,
        status: rec.status,
        newBalance: profile.coins,
        payout: rec.payout,
        netProfit: rec.netProfit,
      };
    }

    const active = this.getActiveBet();

    if (!active || active.matchId !== matchId) {
      return {
        success: false,
        alreadySettled: false,
        stakeAmount: active?.stakeAmount || 0,
        status: 'NONE',
        newBalance: profile.coins,
        payout: 0,
        netProfit: 0,
        bet: active || undefined,
      };
    }

    // 2. Guard against duplicate settlement via active bet status
    if (active.status !== 'PENDING') {
      return {
        success: false,
        alreadySettled: true,
        stakeAmount: active.stakeAmount,
        status: active.status,
        newBalance: profile.coins,
        payout: active.payoutAmount || 0,
        netProfit: active.netProfit || 0,
        bet: active,
      };
    }

    const currentStake = active.stakeAmount;

    // Non-staked match (Cup, practice, 0 stake)
    if (currentStake <= 0) {
      const finalStatus: BetSettlementStatus = isWin ? 'SETTLED_WIN' : 'SETTLED_LOSS';
      active.status = finalStatus;
      active.settledAt = Date.now();
      active.payoutAmount = 0;
      active.netProfit = 0;
      this.saveActiveBet(active);
      this.recordSettledMatch(matchId, finalStatus, 0, 0, 0);
      return {
        success: true,
        alreadySettled: false,
        stakeAmount: 0,
        status: finalStatus,
        newBalance: profile.coins,
        payout: 0,
        netProfit: 0,
        bet: active,
      };
    }

    let payout = 0;
    let netProfit = 0;
    let status: BetSettlementStatus = 'SETTLED_LOSS';

    if (isWin) {
      status = 'SETTLED_WIN';
      // WIN: Stake was deducted at start. Player wins DOUBLE the staked amount (2x)!
      payout = currentStake * 2;
      netProfit = currentStake;
      profile.coins += payout;
    } else {
      status = 'SETTLED_LOSS';
      payout = 0;
      netProfit = -currentStake;
      // LOSS: Stake was already deducted upfront at match start. Money is NOT returned!
    }

    // Atomically commit profile and updated bet
    this.saveProfile(profile);

    active.status = status;
    active.settledAt = Date.now();
    active.payoutAmount = payout;
    active.netProfit = netProfit;
    this.saveActiveBet(active);
    this.recordSettledMatch(matchId, status, currentStake, payout, netProfit);

    return {
      success: true,
      alreadySettled: false,
      stakeAmount: currentStake,
      netProfit,
      payout,
      newBalance: profile.coins,
      status,
      bet: active,
    };
  }

  /**
   * Forfeits/surrenders the active bet upon exit or disconnect.
   * Settles as SETTLED_LOSS and deducts the staked money from the player.
   */
  public forfeitActiveBet(matchId?: string): { success: boolean; stakeLost: number; newBalance: number } {
    const active = this.getActiveBet();
    const profile = this.getProfile();

    if (!active) {
      return { success: false, stakeLost: 0, newBalance: profile.coins };
    }

    if (matchId && active.matchId !== matchId) {
      return { success: false, stakeLost: 0, newBalance: profile.coins };
    }

    const settledMap = this.getSettledMatches();
    if (settledMap[active.matchId]) {
      return { success: false, stakeLost: 0, newBalance: profile.coins };
    }

    if (active.status === 'PENDING') {
      active.status = 'SETTLED_LOSS';
      active.settledAt = Date.now();
      active.payoutAmount = 0;
      active.netProfit = -active.stakeAmount;
      this.saveActiveBet(active);
      this.recordSettledMatch(active.matchId, 'SETTLED_LOSS', active.stakeAmount, 0, -active.stakeAmount);

      // Staked money was already deducted at match start. Money is NOT returned.
      profile.matchesLost++;
      profile.currentStreak = 0;
      this.saveProfile(profile);

      return {
        success: true,
        stakeLost: active.stakeAmount,
        newBalance: profile.coins,
      };
    }

    return { success: false, stakeLost: 0, newBalance: profile.coins };
  }

  /**
   * Checks on startup if a match was abandoned mid-game (e.g. browser closed or reloaded).
   * Settles it as SETTLED_LOSS so the player cannot exploit browser closing.
   */
  public checkAndSettleAbandonedBet(): MatchBetSession | null {
    const active = this.getActiveBet();
    if (active && active.status === 'PENDING') {
      this.forfeitActiveBet(active.matchId);
      return this.getActiveBet();
    }
    return null;
  }

  public addXP(amount: number): { level: number; leveledUp: boolean } {
    const profile = this.getProfile();
    profile.xp += amount;
    const requiredXP = profile.level * 250;
    let leveledUp = false;

    if (profile.xp >= requiredXP) {
      profile.level++;
      profile.xp -= requiredXP;
      leveledUp = true;
    }
    this.saveProfile(profile);
    return { level: profile.level, leveledUp };
  }

  public getCues(): CueItem[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEY_CUES);
      if (data) {
        const parsed: CueItem[] = JSON.parse(data);
        const merged = CUES_CATALOG.map(cat => {
          const stored = parsed.find(p => p.id === cat.id);
          if (stored) {
            return {
              ...cat,
              unlocked: stored.unlocked || cat.unlocked,
            };
          }
          return cat;
        });
        return merged;
      }
    } catch {}
    return CUES_CATALOG;
  }

  public saveCues(cues: CueItem[]) {
    try {
      safeStorage.setItem(STORAGE_KEY_CUES, JSON.stringify(cues));
    } catch {}
  }

  public unlockCue(cueId: string): boolean {
    const cues = this.getCues();
    const cue = cues.find(c => c.id === cueId);
    const profile = this.getProfile();
    if (!cue || cue.unlocked || profile.coins < cue.price) return false;

    profile.coins -= cue.price;
    cue.unlocked = true;
    this.saveProfile(profile);
    this.saveCues(cues);
    return true;
  }

  public getTables(): TableSkin[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEY_TABLES);
      if (data) {
        const parsed: TableSkin[] = JSON.parse(data);
        return TABLES_CATALOG.map(cat => {
          const stored = parsed.find(p => p.id === cat.id);
          if (stored) {
            return {
              ...cat,
              unlocked: stored.unlocked || cat.unlocked,
            };
          }
          return cat;
        });
      }
    } catch {}
    return TABLES_CATALOG;
  }

  public saveTables(tables: TableSkin[]) {
    try {
      safeStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(tables));
    } catch {}
  }

  public unlockTable(tableId: string): boolean {
    const tables = this.getTables();
    const table = tables.find(t => t.id === tableId);
    const profile = this.getProfile();
    if (!table || table.unlocked || profile.coins < table.price) return false;

    profile.coins -= table.price;
    table.unlocked = true;
    this.saveProfile(profile);
    this.saveTables(tables);
    return true;
  }

  public getAchievements(): Achievement[] {
    try {
      const data = safeStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
      if (data) return JSON.parse(data);
    } catch {}
    return ACHIEVEMENTS_LIST;
  }

  public unlockAchievement(id: string): Achievement | null {
    const list = this.getAchievements();
    const ach = list.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      try {
        safeStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(list));
      } catch {}
      this.addCoins(ach.rewardCoins);
      return ach;
    }
    return null;
  }

  public getDailyChallenges(): DailyChallenge[] {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const saved = safeStorage.getItem(STORAGE_KEY_DAILY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) {
          return parsed.challenges;
        }
      }
    } catch {}

    const newChallenges: DailyChallenge[] = [
      { id: 'daily_pot_5', title: 'Daily Potter', desc: 'Pot 5 object balls today', target: 5, current: 0, reward: 250, completed: false },
      { id: 'daily_win_1', title: 'Daily Champion', desc: 'Win 1 match in 8-Ball or 9-Ball', target: 1, current: 0, reward: 350, completed: false },
      { id: 'daily_clean', title: 'Precision Game', desc: 'Finish a match without scratching', target: 1, current: 0, reward: 300, completed: false },
    ];

    try {
      safeStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify({ date: today, challenges: newChallenges }));
    } catch {}

    return newChallenges;
  }

  public unlockCueFree(cueId: string): CueItem | null {
    const cues = this.getCues();
    const cue = cues.find(c => c.id === cueId);
    if (!cue) return null;
    cue.unlocked = true;
    this.saveCues(cues);
    return cue;
  }

  public getLockedCues(): CueItem[] {
    const cues = this.getCues();
    return cues.filter(c => !c.unlocked);
  }

  public getPendingTournamentGift(): TournamentGiftData | null {
    try {
      const data = safeStorage.getItem(STORAGE_KEY_TOURNAMENT_GIFT);
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  }

  public saveTournamentGift(gift: TournamentGiftData | null) {
    try {
      if (gift) {
        safeStorage.setItem(STORAGE_KEY_TOURNAMENT_GIFT, JSON.stringify(gift));
      } else {
        safeStorage.removeItem(STORAGE_KEY_TOURNAMENT_GIFT);
      }
    } catch {}
  }

  public claimTournamentGift(): { success: boolean; gift: TournamentGiftData | null } {
    const gift = this.getPendingTournamentGift();
    if (!gift || gift.claimed) return { success: false, gift: null };

    gift.claimed = true;
    this.saveTournamentGift(gift);

    if (gift.type === 'coins' && gift.coinsAmount) {
      this.addCoins(gift.coinsAmount);
    } else if (gift.type === 'cue' && gift.cueId) {
      this.unlockCueFree(gift.cueId);
    }

    return { success: true, gift };
  }
}

export const storage = new StorageManager();
