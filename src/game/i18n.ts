/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'ar';

const STORAGE_KEY_LANG = 'pool_legends_lang_v1';

export const translations = {
  en: {
    // General & Brand
    gameTitle: 'POOL LEGENDS',
    tagline: '3D Offline Billiards & Multiplayer',
    offlineBadge: '100% Offline Mode',
    coins: 'Coins',
    level: 'Level',
    wins: 'Wins',
    balls: 'Balls',
    rank: 'Rank',
    winRate: 'Win Rate',
    equipped: 'Equipped',
    equip: 'Equip',
    buy: 'Buy',
    locked: 'Locked',
    free: 'Free',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    active: 'Active',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',

    // Title Screen
    quickPlay: 'Play 1 on 1 (vs AI)',
    quickPlaySubtitle: 'Instant match against smart offline bot',
    tournament: 'Tournament Cup',
    tournamentSubtitle: '8-player bracket · 1,500 coins prize',
    offlineMultiplayer: 'Play with Friend (Hotspot)',
    offlineMultiplayerSubtitle: 'Wi-Fi Hotspot & Pass-and-Play',
    cuesStore: 'Cues Store',
    cuesStoreSubtitle: '10 exclusive crafted cues',
    practiceMode: 'Solo Practice Table',
    equippedCueBannerTitle: 'Equipped Cue',
    changeOrBuyCues: 'Store & Upgrade Cues',
    difficulty: 'Difficulty',
    aimTip: 'Drag table to aim · Pull cue back to shoot with power',

    // AI Difficulties
    diff_beginner: 'Beginner',
    diff_easy: 'Easy',
    diff_normal: 'Normal',
    diff_pro: 'Professional',
    diff_legend: 'Legend',

    // Profile & Avatar Modal
    profileTitle: 'Player Profile & Avatars',
    profileSubtitle: 'Customize your identity and cartoon character avatar',
    editProfilePic: 'Change Avatar',
    editName: 'Edit Name',
    saveName: 'Save Name',
    cartoonCharactersTab: 'Cartoon Avatars',
    statsTab: 'Career Stats',
    achievementsTab: 'Trophies',
    chooseCartoonAvatar: 'Choose your cartoon character avatar:',
    totalMatches: 'Total Matches',
    matchesWon: 'Matches Won',
    ballsPotted: 'Balls Potted',
    winStreak: 'Best Win Streak',
    tournamentsWon: 'Tournaments Won',
    xpProgress: 'XP Progress',

    // Cue Shop
    shopTitle: 'Billiards Cues & Table Shop',
    shopSubtitle: 'Handcrafted cues & luxury felts · Buy with in-game coins!',
    cuesTab: 'Pool Cues',
    tablesTab: 'Table Felts',
    allTiers: 'All',
    tier_starter: 'Starter',
    tier_common: 'Common',
    tier_rare: 'Rare',
    tier_epic: 'Epic',
    tier_legendary: 'Legendary',
    tier_mythic: 'Mythic',
    powerStat: 'Power',
    aimStat: 'Aim Line',
    spinStat: 'Spin Control',
    equippedCueNotice: 'Currently Equipped Cue',
    equipThisCue: 'Equip Cue',
    buyFor: 'Buy for',
    needMoreCoins: 'Need',
    howToEarnMoney: 'How to earn coins in game?',
    earnPotting: 'Potting balls: +50 coins',
    earnMatchWin: 'Winning match: +350 coins',
    earnTournament: 'Tournament win: +1,500 coins',

    // HUD & In-Game
    menu: 'Menu',
    chatReactions: 'Chat & Stickers',
    view3D: '3D View',
    view2D: '2D Top',
    potStake: 'PRIZE POT',
    pullCue: 'PULL',
    strike: 'Strike',
    fineAim: 'Fine Aim',
    spinSelector: 'Cue Ball Spin',
    openTable: 'Open Table',
    solids: 'Solids (1-7)',
    stripes: 'Stripes (9-15)',
    yourTurn: 'Your Turn',
    opponentTurn: 'Opponent Turn',
    breakShot: 'Break Shot: Take your opening break!',
    ballInHandAutoNotice: '🎯 Cue ball scratched: Drag to position it on the table',
    potEightBallNow: '🎱 All balls cleared! Pot the black 8-ball directly to win!',
    potEightBallPassTurn: '🎱 Turn passes to opponent. Clear your balls or pot the 8-ball!',

    // Rules Status Messages
    status_scratch: 'Scratch: Cue ball pocketed! Drag to position it on table.',
    status_airball: 'Foul: No ball contacted! Turn passes to opponent.',
    status_wrongBall: 'Foul: Must strike your own ball first! Turn passes to opponent.',
    status_eightEarlyLoss: '8-Ball pocketed too early! Opponent wins!',
    status_eightScratchLoss: 'Foul on the 8-Ball! Opponent wins!',
    status_eightWin: '8-Ball pocketed cleanly! Match Won!',
    status_eightBreakWin: 'EPIC BREAK! 8-Ball pocketed on break! Match Won!',
    status_turnPass: 'Turn passes to opponent.',
    status_turnContinue: 'Nice shot! Continue your run.',
    status_groupAssignedSolids: 'You are SOLIDS (1-7)! Opponent is STRIPES (9-15)!',
    status_groupAssignedStripes: 'You are STRIPES (9-15)! Opponent is SOLIDS (1-7)!',

    // Game Over
    victory: 'VICTORY!',
    defeat: 'DEFEAT',
    rematch: 'Play Again',
    mainMenu: 'Main Menu',
    coinsWon: 'Coins Won',

    // Pause Menu Modal
    pauseTitle: 'Game Paused',
    pauseSubtitle: 'Match paused. What would you like to do?',
    exitMatch: 'Exit Match',
    exitMatchSubtitle: 'Leave match and return to Main Menu',
    replayMatch: 'Play Again',
    replayMatchSubtitle: 'Restart match from the beginning',
    resumeMatch: 'Resume Match',

    // Stake Selection
    chooseStakeTitle: 'Choose Match Stake',
    chooseStakeSubtitle: 'Select how much money to play for before choosing opponent',
    startMatchmaking: 'Spin & Find Opponent 🎲',
    selectedStakeBadge: 'Stake',
    prizePot: 'Prize Pot',
  },
  ar: {
    // General & Brand
    gameTitle: 'أساطير البلياردو',
    tagline: 'بلياردو ثلاثية الأبعاد بدون إنترنت ولعب جماعي',
    offlineBadge: 'وضع أوفلاين 100%',
    coins: 'عملة',
    level: 'المستوى',
    wins: 'الانتصارات',
    balls: 'الكرات',
    rank: 'الرتبة',
    winRate: 'نسبة الفوز',
    equipped: 'مجهزة',
    equip: 'تجهيز',
    buy: 'شراء',
    locked: 'مقفل',
    free: 'مجاني',
    cancel: 'إلغاء',
    save: 'حفظ',
    edit: 'تعديل',
    active: 'نشط',
    confirm: 'تأكيد',
    close: 'إغلاق',
    back: 'رجوع',

    // Title Screen
    quickPlay: 'بدء اللعب الفوري (1 ضد 1)',
    quickPlaySubtitle: 'مباراة سريعة ضد الذكاء الاصطناعي الأوفلاين',
    tournament: 'بطولة الكؤوس',
    tournamentSubtitle: '8 لاعبين بنظام الإقصاء · جائزة 1500 عملة',
    offlineMultiplayer: 'لعب جماعي أوفلاين',
    offlineMultiplayerSubtitle: 'نقطة اتصال Hotspot أو نفس الجهاز',
    cuesStore: 'متجر العصي',
    cuesStoreSubtitle: '10 عصي حصرية للشراء والتطوير',
    practiceMode: 'طاولة التدريب الفردي',
    equippedCueBannerTitle: 'العصا الحالية المجهزة',
    changeOrBuyCues: 'تغيير أو شراء عصي جديدة',
    difficulty: 'المستوى',
    aimTip: 'اسحب الشاشة لتحديد مسار الكرة · اسحب العصا للخلف للإطلاق',

    // AI Difficulties
    diff_beginner: 'مبتدئ',
    diff_easy: 'سهل',
    diff_normal: 'متوسط',
    diff_pro: 'محترف',
    diff_legend: 'أسطورة',

    // Profile & Avatar Modal
    profileTitle: 'الملف الشخصي وصور البروفيل',
    profileSubtitle: 'تخصيص الهوية والشخصيات الكرتونية',
    editProfilePic: 'تبديل الصورة',
    editName: 'تعديل الاسم',
    saveName: 'حفظ الاسم',
    cartoonCharactersTab: 'الشخصيات الكرتونية',
    statsTab: 'السجل والإحصائيات',
    achievementsTab: 'الكؤوس',
    chooseCartoonAvatar: 'اختر شخصيتك الكرتونية المفضلة لتظهر على بروفايلك وفي اللعب:',
    totalMatches: 'إجمالي المباريات',
    matchesWon: 'المباريات الفائزة',
    ballsPotted: 'الكرات المسقطة',
    winStreak: 'أعلى سلسلة انتصارات',
    tournamentsWon: 'البطولات المحققة',
    xpProgress: 'مستوى الخبرة (XP)',

    // Cue Shop
    shopTitle: 'متجر عصي البلياردو',
    shopSubtitle: 'عصي حصرية مصنوعة ومصممة خصيصاً لك، اشترِ بالمال الذي تجمعه أثناء اللعب!',
    cuesTab: 'عصي البلياردو',
    tablesTab: 'أقمشة الطاولة',
    allTiers: 'الكل',
    tier_starter: 'بداية',
    tier_common: 'شائع',
    tier_rare: 'نادر',
    tier_epic: 'ملحمي',
    tier_legendary: 'أسطوري',
    tier_mythic: 'خرافي',
    powerStat: 'القوة',
    aimStat: 'خط التسديد',
    spinStat: 'التحكم بالدوران',
    equippedCueNotice: 'العصا الحالية المجهزة',
    equipThisCue: 'تجهيز هذه العصا',
    buyFor: 'شراء مقابل',
    needMoreCoins: 'ينقصك',
    howToEarnMoney: 'كيف تجمع المال أثناء اللعب؟',
    earnPotting: 'إدخال الكرات: +50 عملة',
    earnMatchWin: 'الفوز بالمباراة: +350 عملة',
    earnTournament: 'بطولات الأساطير: +1500 عملة',

    // HUD & In-Game
    menu: 'القائمة',
    chatReactions: 'المحادثة والملصقات',
    view3D: '3D مجسّم',
    view2D: '2D علوي',
    potStake: 'الجائزة',
    pullCue: 'سحب',
    strike: 'ضربة',
    fineAim: 'ضبط دقيق',
    spinSelector: 'دوران الكرة',
    openTable: 'طاولة مفتوحة',
    solids: 'الكرات المصمتة (1-7)',
    stripes: 'الكرات المخططة (9-15)',
    yourTurn: 'دورك للعب',
    opponentTurn: 'دور الخصم',
    breakShot: 'ضربة البداية: خذ ضربة الكسر الافتتاحية!',
    ballInHandAutoNotice: '🎯 سقطت الكرة البيضاء في الحفرة: اسحبها بيدك لتثبيتها على الطاولة',
    potEightBallNow: '🎱 تم إدخال جميع كراتك! يمكنك إدخال الكرة السوداء رقم 8 للفوز مباشرة!',
    potEightBallPassTurn: '🎱 ينتقل الدور للخصم إذا لم يتم إدخال الكرة السوداء.',

    // Rules Status Messages
    status_scratch: 'إسقاط الكرة البيضاء في الحفرة! اسحبها لتثبيتها بيدك على الطاولة.',
    status_airball: 'خطأ: لم يتم لمس أي كرة! ينتقل الدور للخصم.',
    status_wrongBall: 'خطأ: يجب لمس كرات مجموعتك أولاً! ينتقل الدور للخصم.',
    status_eightEarlyLoss: 'إسقاط الكرة السوداء قبل إنهاء مجموعتك! الخصم يفوز!',
    status_eightScratchLoss: 'خطأ أثناء إسقاط الكرة السوداء! الخصم يفوز!',
    status_eightWin: 'تم إسقاط الكرة السوداء بنجاح! مبروك الفوز بالمباراة!',
    status_eightBreakWin: 'كسر أسطوري! الكرة السوداء دخلت في ضربة البداية!',
    status_turnPass: 'ينتقل الدور إلى اللاعب التالي.',
    status_turnContinue: 'ضربة ممتازة! تابع مسيرتك.',
    status_groupAssignedSolids: 'أنت تلعب بالمصمتة (1-7)! الخصم بالمخططة (9-15)!',
    status_groupAssignedStripes: 'أنت تلعب بالمخططة (9-15)! الخصم بالمصمتة (1-7)!',

    // Game Over
    victory: 'فوز ساحق!',
    defeat: 'هزيمة',
    rematch: 'لعب مرة أخرى',
    mainMenu: 'القائمة الرئيسية',
    coinsWon: 'العملات المكتسبة',

    // Pause Menu Modal
    pauseTitle: 'إيقاف مؤقت',
    pauseSubtitle: 'المباراة متوقفة مؤقتاً. ماذا تود أن تفعل؟',
    exitMatch: 'الخروج',
    exitMatchSubtitle: 'مغادرة المباراة الحالية والعودة للقائمة الرئيسية',
    replayMatch: 'إعادة اللعب مجدداً',
    replayMatchSubtitle: 'بدء المباراة من جديد من البداية',
    resumeMatch: 'استئناف اللعب',

    // Stake Selection
    chooseStakeTitle: 'اختر بكم ستلعب من المال',
    chooseStakeSubtitle: 'حدد مبلغ الرهان قبل بدء اختيار الخصم العشوائي',
    startMatchmaking: 'تدوير واختيار الخصم 🎲',
    selectedStakeBadge: 'الرهان',
    prizePot: 'الجائزة',
  }
};

class I18nManager {
  private currentLang: Language = 'en'; // Default English as requested!
  private listeners: Array<(lang: Language) => void> = [];

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG) as Language;
      if (saved === 'ar' || saved === 'en') {
        this.currentLang = saved;
      } else {
        this.currentLang = 'en'; // English is primary by default!
      }
    } catch {
      this.currentLang = 'en';
    }
  }

  public getLanguage(): Language {
    return this.currentLang;
  }

  public setLanguage(lang: Language) {
    this.currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch {}
    this.notify();
  }

  public toggleLanguage(): Language {
    const nextLang: Language = this.currentLang === 'en' ? 'ar' : 'en';
    this.setLanguage(nextLang);
    return nextLang;
  }

  public t(key: keyof typeof translations['en']): string {
    const dict = translations[this.currentLang] || translations.en;
    return dict[key] || translations.en[key] || (key as string);
  }

  public subscribe(listener: (lang: Language) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentLang));
  }
}

export const i18n = new I18nManager();
