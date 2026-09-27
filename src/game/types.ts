/** Shared definitions for game content and state. Content lives in src/content; state logic in src/game. */

export type RecipeId = string;
export type FurnitureId = string;
export type GuestId = string;

export type IngredientId =
  | 'grain'
  | 'hops'
  | 'honey'
  | 'apple'
  | 'berry'
  | 'carrot'
  | 'potato'
  | 'onion'
  | 'mushroom'
  | 'meat'
  | 'fish'
  | 'cheese'
  | 'egg'
  | 'herb'
  | 'pepper'
  | 'milk'
  | 'butter'
  | 'salt'
  | 'fire'
  | 'magic'
  | 'moon'
  | 'bone'
  | 'sock'
  | 'crown';

export interface SlotSpec {
  ingredient: IngredientId;
  /** Minimum word length that fills this slot. */
  min: number;
  /** Signature slot: needs a word that uses every letter. */
  all?: boolean;
}

export type RecipeIconId =
  | 'ale'
  | 'stew'
  | 'bread'
  | 'pie'
  | 'mead'
  | 'chowder'
  | 'roast'
  | 'fizz'
  | 'stout'
  | 'chili'
  | 'tart'
  | 'feast'
  | 'tea'
  | 'goulash'
  | 'grog'
  | 'shake'
  | 'cheese'
  | 'kebab';

export interface RecipeDef {
  id: RecipeId;
  name: string;
  icon: RecipeIconId;
  tier: 1 | 2 | 3 | 4;
  /** Size of the letter set handed over with this order. */
  letters: 5 | 6 | 7 | 8;
  slots: SlotSpec[];
  price: number;
  /** Seconds before the guest's patience (and your tip) runs out. */
  patience: number;
  unlockLevel: number;
  /** Coins to learn it in the Recipe Book. 0 for starters and story rewards. */
  cost: number;
  blurb: string;
  starter?: boolean;
  /** Only obtainable as a story or level reward. */
  special?: boolean;
}

export type FurnitureSlot =
  | 'hearth'
  | 'wallLeft'
  | 'window'
  | 'lights'
  | 'wallRight'
  | 'floorRight'
  | 'hearthside'
  | 'counter';

export interface Bonuses {
  /** +% on tips. */
  tipPct: number;
  /** +% patience time. */
  patiencePct: number;
  /** Extra coins for every bonus word. */
  bonusWordCoins: number;
  /** +% renown (XP). */
  xpPct: number;
  /** Coins off each Taste Test hint. */
  hintDiscount: number;
  /** Extra guests per day. */
  extraCustomers: number;
  /** +% on menu prices. */
  pricePct: number;
}

export interface FurnitureDef {
  id: FurnitureId;
  slot: FurnitureSlot;
  name: string;
  blurb: string;
  price: number;
  unlockLevel: number;
  bonus: Partial<Bonuses>;
  /** Owning this lets the named guest start visiting (once their level requirement is met). */
  attracts?: GuestId;
  /** Story or level reward only; never sold. */
  special?: boolean;
  /** Owned and placed at the start of the game. */
  default?: boolean;
}

export type Species =
  | 'human'
  | 'elf'
  | 'dwarf'
  | 'halfling'
  | 'goblin'
  | 'gnome'
  | 'orc'
  | 'skeleton'
  | 'ent'
  | 'dragon';

export type HairStyle = 'none' | 'short' | 'long' | 'curly' | 'bun' | 'spiky' | 'braids' | 'wild';
export type BeardStyle = 'none' | 'stubble' | 'short' | 'long' | 'braided' | 'mustache' | 'goatee';
export type HatStyle =
  | 'none'
  | 'wizard'
  | 'bard'
  | 'helmet'
  | 'tricorn'
  | 'hood'
  | 'scarf'
  | 'tophat'
  | 'crown'
  | 'cap'
  | 'strawhat'
  | 'chef'
  | 'horns';
export type Accessory =
  | 'eyepatch'
  | 'monocle'
  | 'glasses'
  | 'earring'
  | 'freckles'
  | 'scar'
  | 'rat'
  | 'pipe'
  | 'blush'
  | 'tusks'
  | 'leaves'
  | 'wrinkles'
  | 'necklace';

export interface PortraitSpec {
  species: Species;
  skin: string;
  outfit: string;
  outfitAccent?: string;
  hair?: string;
  hairStyle?: HairStyle;
  beard?: BeardStyle;
  hat?: HatStyle;
  hatColor?: string;
  hatAccent?: string;
  nose?: 'button' | 'big' | 'long' | 'pointy';
  eyes?: 'dot' | 'wide' | 'sleepy' | 'glow';
  accessories?: Accessory[];
}

export type Mood = 'neutral' | 'happy' | 'grumpy' | 'surprised' | 'sad';

/** Who is talking in a dialogue line. 'guest' is whoever is being served. */
export type Speaker = 'guest' | 'barley';

export interface DialogueLine {
  speaker: Speaker;
  text: string;
  mood?: Mood;
}

export interface Reward {
  coins?: number;
  recipe?: RecipeId;
  furniture?: FurnitureId;
}

export interface StoryChapter {
  title: string;
  /** Played before the order is taken. */
  arrive: DialogueLine[];
  /** The order line shown in the guest's speech bubble. {recipe} is replaced with the recipe name. */
  order: string;
  /** Played after the order is served in full. */
  done: DialogueLine[];
  reward?: Reward;
  /** Forces this recipe for the chapter (it's cooked even if you haven't learned it yet). */
  recipe?: RecipeId;
  /** Only plays once these guests' stories are finished (for chapters that reference them). */
  after?: GuestId[];
}

export interface GuestLines {
  greet: string[];
  order: string[];
  happy: string[];
  grumpy: string[];
  waiting: string[];
  /** Chit-chat once their story is over. */
  banter: string[];
}

export interface GuestDef {
  id: GuestId;
  name: string;
  title: string;
  portrait: PortraitSpec;
  favorites: RecipeId[];
  patienceMult: number;
  tipMult: number;
  unlock: { level: number; furniture?: FurnitureId; afterStoryOf?: GuestId };
  /** Guest Book hint while locked. */
  rumor: string;
  bio: string;
  lines: GuestLines;
  story: StoryChapter[];
}

export interface TownsfolkDef {
  id: string;
  title: string;
  names: string[];
  /** Portrait variations are picked at random per visit. */
  looks: PortraitSpec[];
  lines: Omit<GuestLines, 'banter'>;
}
