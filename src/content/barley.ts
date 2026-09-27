import type { DialogueLine, Mood } from '../game/types';

const b = (text: string, mood?: Mood): DialogueLine => ({ speaker: 'barley', text, mood });

/** Barley: an enchanted, three-hundred-year-old tankard. Sarcastic. Secretly very fond of you. */
export const BARLEY = {
  name: 'Barley',
  title: 'Enchanted Tankard',

  intro: [
    b('Oi! Down here. The tankard. Yes, the talking one.', 'surprised'),
    b(
      'You must be the new Wordsmith. Old Auntie Verba left you her tavern. And me. Congratulations on both.',
    ),
    b(
      'In Quillhaven, cooking is word magic. Guests hand over letters, you forge them into words, and the words become food.',
    ),
    b('Don’t ask me how it works. I’m a mug.'),
    b('Here comes your first guest. Try not to poison anyone.', 'happy'),
  ] as DialogueLine[],

  /** Shown once, after the first night. */
  afterFirstNight: [
    b('Not bad for a first night! Only mildly chaotic.', 'happy'),
    b(
      'Spend coins in the Shop on furniture. Nice furniture means bigger tips, more patience, and new kinds of guests.',
    ),
    b('The Recipe Book has new dishes. Fancier food, bigger letter sets, better pay.'),
    b(
      'And the Guest Book keeps track of our regulars and their... stories. Oh, they have stories.',
    ),
  ] as DialogueLine[],

  /** Coaching during the very first order. */
  tips: {
    forge: 'Swipe across the letters to forge a word, then let go. Or tap letters and press ✓.',
    slots: 'Each word becomes an ingredient. Fill every slot on the order to serve it!',
    allLetters: 'The ✨ secret ingredient needs a word that uses EVERY letter.',
    bonus: 'Extra words go in the tip jar. Guests love a show-off.',
    patience:
      'That’s their patience. Serve quickly for bigger tips. Don’t worry, nobody storms out.',
    stuck: 'Stuck? Shuffle the letters, or use a Taste Test to reveal a letter.',
  },

  openNight: [
    'Doors open! Look busy.',
    'Remember: you’re a Wordsmith. You smith words. It’s in the name.',
    'Another night, another hundred words. Let’s cook.',
    'If anyone asks, the stew has always tasted like that.',
    'Chin up, apron on, vowels ready.',
    'I’ve polished myself. Let’s make some coin.',
  ],

  closeNight: [
    'Nice work tonight. I only had to insult three people.',
    'Closing time! Count the coins. Then count them again. It’s fun.',
    'The tavern’s getting a reputation. A good one, mostly.',
    'Another fine night. I’m going to have a little lie down. On my side. Like a mug.',
    'You’re getting good at this. Don’t let it go to your head.',
  ],

  bonus: ['Show-off!', 'Into the tip jar!', 'Extra flavour!', 'Ooh, fancy.', 'Bonus!'],
  invalid: [
    'That’s not a word. I’d know. I’ve heard them all.',
    'Never heard of it. And I’m three hundred.',
    'Is that... Elvish?',
    'Nope. Not in the recipe book.',
    'Bless you?',
  ],
  repeat: ['Already in the pot!', 'You’ve served that one.', 'Déjà vu!'],
  tooShort: ['Three letters at least. Even “ale” manages three.', 'Too short!'],
  lowPatience: [
    'Psst. They’re getting peckish.',
    'Faster, or they’ll start eating the furniture.',
    'Tick tock, Wordsmith.',
  ],

  levelUp: [
    'The tavern’s fame grows! Soon they’ll write songs about us. Barnaby already has. They’re terrible.',
    'Look at us! Practically famous!',
    'Renown up! I’d frame it, but I don’t have hands.',
  ],

  dailyGift: [
    'Found this in the tip jar. Don’t ask how long it’s been there.',
    'A little something for my favourite Wordsmith. You’re my only Wordsmith. Still.',
    'Morning! Here’s what the night shift left behind.',
  ],
};

/** Generic reviews, by star rating. {recipe} is replaced with the dish. */
export const REVIEWS: Record<number, string[]> = {
  5: [
    'Best {recipe} in Quillhaven. Would be served again.',
    'The food spoke to me. Literally. Barley, please stop.',
    'Cosy, tasty, and only one tankard insulted me.',
    'Perfection. Ten out of ten spoons.',
    'I’d give six stars, but the form only goes to five.',
    'The {recipe} made me weep with joy. Or it was the onions.',
  ],
  4: [
    'Very good! A little wait, but worth it.',
    'Tasty {recipe}! The talking tankard was a bit much.',
    'Great food, charming host, suspicious rat in the corner.',
    'Lovely {recipe}. I’d come back. I will come back.',
  ],
  3: [
    'Solid. Like a good table.',
    'The {recipe} was fine. I waited long enough to grow a beard.',
    'Decent! Would visit again if hungry. Which is always.',
  ],
  2: [
    'Half a {recipe}. Wholly confusing.',
    'The {recipe} was... partly {recipe}.',
    'Interesting concept: food that’s mostly missing.',
  ],
  1: [
    'I ordered a {recipe} and got a garnish.',
    'My plate was mostly plate.',
    'A brave attempt. Please try again.',
  ],
};
