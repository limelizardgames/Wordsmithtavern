# Wordsmith Tavern — Game Design

## Pitch

You run a fantasy tavern in Quillhaven, a town where cooking is word magic. Guests hand over
letters, you forge them into words, and each word becomes an ingredient in their order. Serve
well and the tavern grows: coins, recipes, furniture, and a cast of regulars whose ridiculous
stories unfold a chapter at a time.

**Pillars**

1. **Cosy, never punishing.** Nobody storms out. Patience only changes the tip. Relaxed mode
   removes the timer entirely.
2. **Wordplay you can feel.** A tactile swipe wheel, rising plucked-string notes as letters chain,
   and a satisfying pop as each word drops into the pot.
3. **Characters worth coming back for.** Every regular has a five-chapter comic arc, and finishing
   it leaves a keepsake in the tavern.
4. **A tavern that becomes yours.** Furniture changes the room, gives bonuses and attracts new
   guests.

## The loop

```
Open for the night ──► guests arrive one by one ──► forge words to fill each order
        ▲                                                   │
        │                                                   ▼
 spend coins on recipes & decor ◄── closing-time summary (coins, reviews, renown, level-ups)
```

A night lasts about five minutes: three guests at first, four from renown 4, five from renown 8
(up to six with furniture bonuses). The app saves after every order, so closing it mid-night loses
nothing; the hub then offers to continue the night.

## Orders and the forge wheel

- Each guest orders a **recipe** from your menu and hands over a letter set of 5–8 letters.
  Every letter set comes from a familiar "root" word, so at least one word uses every letter.
- A recipe is a list of **ingredient slots**. Most say "a word of at least N letters". The ✨
  **secret ingredient** (signature slot) needs a word that uses every letter.
- A new word fills the most demanding open slot it qualifies for (signature slots first, then the
  longest minimum). If a Taste Test was pointing at that exact word, it fills that slot instead.
- A valid word that fits no open slot goes in the **tip jar** (1 coin each, plus furniture
  bonuses).
- Filling every slot serves the order automatically.
- **Serve early** is always available: the guest pays half price for the share of slots filled, with
  no tip. Story chapters only advance on a complete order, so story guests come back for another
  try.
- Invalid words, repeats and words shorter than three letters are rejected with a line from Barley.
- **Input:** swipe across tiles and let go to submit; or tap tiles one at a time (tap the last one
  again to take it back) and press ✓; or type on a keyboard. Sliding back over the previous letter
  un-picks it. The centre button shuffles.

Every puzzle is **guaranteed solvable**: the generator only uses letter sets whose familiar words
can fill every slot with distinct words, with two spare words at the short lengths. Recently used
roots are avoided.

### Patience, tips and reviews

- Patience runs in real time while an order is being cooked (it pauses during dialogue, popups,
  ads, and when the app is in the background).
- **Tip** = price × 0.6 × remaining patience × the guest's tip multiplier × furniture bonuses.
  Relaxed mode fixes patience at 60%.
- **Stars:** a complete order earns 3, plus one for serving with more than 35% patience left and
  another above 70%. Relaxed mode always gives 5. Early service gives 1–2 stars.
- Each order gets a short comic review on the closing-time summary.
- Guests order their **favourite** dish half the time if it's on your menu, and pay 50% more for it.

### Taste Test (hints)

Costs 15 coins (minimum 5 with furniture discounts), or is free for a rewarded ad. Each Taste Test
reveals one more letter of a real familiar word for the most demanding open slot, preferring the
most common word of exactly the needed length. The final letter is never revealed.

## Economy

| Source                    | Amount                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Starting coins            | 60                                                                                          |
| Order                     | recipe price (+furniture %), tip, favourite bonus, tip-jar coins                            |
| Renown (XP) per order     | 10 × recipe tier + 2 per bonus word + 5 if complete (halved and prorated when served early) |
| Level up                  | 25 × new level coins                                                                        |
| Story chapters            | 30–200 coins, and a keepsake at the end of each tale                                        |
| Daily tip jar             | 25, 35, 45, 60, 75, 90, 120 coins over a 7-day streak (doubled with a rewarded ad)          |
| Rewarded "double tonight" | the night's coins again                                                                     |

Sinks: recipes (70–1200), furniture (50–1100), Taste Tests (15).

## Progression

Renown levels unlock recipes and furniture to buy, bring more guests per night, and let new guests
arrive. Some guests also need a particular piece of furniture (a knight needs a notice board to pin
his quests to), and Ember the dragon only visits once Barnaby's ballad is finished.

At most one **newcomer** arrives per night, plus one returning guest's next story chapter (two
from five guests a night). Each guest's chapters are at least two nights apart. Longest-waiting
stories go first. Remaining stools are filled by returning regulars (for banter) and townsfolk.

## Reference

### Recipes

| Recipe              | Tier | Letters | Ingredient slots                                     | Price | Patience | Unlock       | Cost    |
| ------------------- | ---- | ------- | ---------------------------------------------------- | ----- | -------- | ------------ | ------- |
| Frothy Ale          | 1    | 5       | hops 3+, grain 3+, honey 4+                          | 12    | 90s      | Renown 1     | starter |
| Hearty Stew         | 1    | 5       | carrot 3+, potato 3+, meat 4+                        | 14    | 95s      | Renown 1     | starter |
| Barkroot Tea        | 1    | 5       | herb 3+, herb 3+, honey 3+, milk 3+                  | 15    | 100s     | Renown 2     | 70      |
| Buttered Bread      | 1    | 5       | grain 3+, herb 3+, butter (all)                      | 17    | 100s     | Renown 2     | 90      |
| Mushroom Pie        | 2    | 6       | mushroom 3+, butter 4+, grain 4+, herb 5+            | 24    | 120s     | Renown 3     | 180     |
| Stinky Cheese Board | 2    | 6       | cheese 3+, apple 3+, grain 4+, cheese 5+             | 24    | 120s     | Renown 3     | 200     |
| Honey Mead          | 2    | 6       | honey 4+, berry 4+, magic (all)                      | 27    | 125s     | Renown 3     | 220     |
| Fisherman's Chowder | 2    | 6       | fish 3+, potato 4+, milk 4+, onion 5+                | 26    | 125s     | Renown 4     | 260     |
| Goblin Goulash      | 2    | 6       | sock 3+, mushroom 3+, meat 4+, onion 4+, pepper 5+   | 29    | 135s     | Renown 4     | 280     |
| Sea-Salt Grog       | 2    | 6       | salt 3+, apple 4+, hops 4+, magic (all)              | 30    | 130s     | Renown 5     | 320     |
| Knightly Kebabs     | 2    | 6       | meat 3+, onion 4+, pepper 4+, fire 5+                | 34    | 130s     | story reward | —       |
| Roast Boar          | 3    | 7       | meat 4+, apple 4+, herb 5+, fire 6+                  | 38    | 150s     | Renown 5     | 420     |
| Calcium Shake       | 3    | 7       | milk 3+, bone 4+, berry 5+, moon 6+                  | 36    | 150s     | Renown 5     | 400     |
| Wizard's Fizz       | 3    | 7       | berry 3+, honey 4+, magic 5+, moon (all)             | 42    | 155s     | Renown 6     | 480     |
| Dwarven Stout       | 3    | 7       | hops 4+, grain 4+, grain 5+, fire (all)              | 44    | 160s     | Renown 7     | 520     |
| Dragon Pepper Chili | 4    | 7       | pepper 4+, meat 5+, onion 5+, fire (all)             | 55    | 170s     | Renown 8     | 800     |
| Moonberry Tart      | 4    | 8       | berry 4+, butter 4+, egg 5+, moon 6+, magic (all)    | 62    | 190s     | Renown 9     | 950     |
| Royal Feast Pie     | 4    | 8       | meat 4+, mushroom 5+, egg 5+, butter 6+, crown (all) | 75    | 200s     | Renown 10    | 1200    |

### Furniture

| Piece                     | Spot       | Price | Unlock   | Bonus                                               | Notes                                |
| ------------------------- | ---------- | ----- | -------- | --------------------------------------------------- | ------------------------------------ |
| Sooty Hearth              | hearth     | —     | —        | —                                                   | starting piece                       |
| Stone Fireplace           | hearth     | 150   | Renown 2 | +10% patience                                       |                                      |
| Grand Hearth              | hearth     | 900   | Renown 7 | +20% patience, +5% tips                             |                                      |
| Dragon-Kindled Hearth     | hearth     | —     | —        | +25% patience, +10% tips                            | story keepsake                       |
| Candle Stubs              | lights     | —     | —        | —                                                   | starting piece                       |
| Brass Lanterns            | lights     | 100   | Renown 1 | +5% tips                                            |                                      |
| Antler Chandelier         | lights     | 480   | Renown 4 | +8% tips, +5% patience                              |                                      |
| Firefly Jars              | lights     | 1100  | Renown 8 | +10% tips, +10% renown                              |                                      |
| Prophetic Star Lanterns   | lights     | —     | —        | +12% tips, +10% renown                              | story keepsake                       |
| Dusty Window              | window     | —     | —        | —                                                   | starting piece                       |
| Window Flower Box         | window     | 120   | Renown 2 | +5% patience, +3% tips                              |                                      |
| Stained-Glass Window      | window     | 700   | Renown 6 | +8% tips, +5% renown                                |                                      |
| Rusty Shield              | wallLeft   | 60    | Renown 1 | +3% tips                                            |                                      |
| Quest Notice Board        | wallLeft   | 200   | Renown 3 | +10% renown                                         | attracts Sir Reginald Pompington III |
| Jackalope Antlers         | wallLeft   | 450   | Renown 5 | +8% tips                                            |                                      |
| The Unbreakable Tankard   | wallLeft   | —     | —        | +10% tips, +1 coin per bonus word                   | story keepsake                       |
| Captain’s Ship Wheel      | wallLeft   | —     | —        | +10% tips, +10% patience                            | story keepsake                       |
| Portrait of a Brave Goose | wallRight  | 90    | Renown 1 | +5% renown                                          |                                      |
| Tapestry of the Word Wars | wallRight  | 600   | Renown 6 | +10% renown, +1 coin per bonus word                 |                                      |
| Ship in a Bottle          | wallRight  | 350   | Renown 6 | +5% tips                                            | attracts Captain Brinebottom         |
| The Holy Grill            | wallRight  | —     | —        | +10% menu prices                                    | story keepsake                       |
| Barnaby’s Golden Lute     | wallRight  | —     | —        | +10% tips, +5% renown                               | story keepsake                       |
| Wobbly Table              | floorRight | —     | —        | —                                                   | starting piece                       |
| Sturdy Oak Table          | floorRight | 180   | Renown 2 | +10% patience                                       |                                      |
| Squashy Armchair          | floorRight | 320   | Renown 3 | +15% patience                                       |                                      |
| Bard’s Stage              | floorRight | 420   | Renown 4 | +12% tips                                           |                                      |
| Mortimer’s Reading Nook   | floorRight | —     | —        | +10% renown, +15% patience                          | story keepsake                       |
| Cat Basket                | hearthside | 140   | Renown 2 | +4% tips, +4% patience                              |                                      |
| Potted Fern               | hearthside | 220   | Renown 4 | +8% patience                                        | attracts Old Oakley                  |
| Hatchling’s Nest          | hearthside | —     | —        | +15% renown                                         | story keepsake                       |
| Oakley’s Sapling          | hearthside | —     | —        | +15% patience, +5% renown                           | story keepsake                       |
| Tip Jar                   | counter    | 50    | Renown 1 | +5% tips                                            |                                      |
| Crystal Ball              | counter    | 380   | Renown 5 | +8% renown                                          | attracts Madame Zephyrine            |
| Brass Coin Register       | counter    | 650   | Renown 7 | +8% menu prices                                     | attracts Ledgerly Pinchpenny         |
| Enchanted Quill           | counter    | 1000  | Renown 8 | Taste Tests 5 coins cheaper, +1 coin per bonus word |                                      |
| Fizzlewick’s Spellbook    | counter    | —     | —        | Taste Tests 5 coins cheaper, +10% renown            | story keepsake                       |
| Royal Seal of Excellence  | counter    | —     | —        | +10% menu prices, +5% tips                          | story keepsake                       |

### Guests

| Guest                                             | Arrives                                    | Favourites                                           | Tales                                                                                       | Keepsake                         |
| ------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------- |
| **Barnaby Bramblefoot**, Halfling Bard            | Renown 1                                   | Honey Mead, Frothy Ale                               | A Bard Arrives → Rhyme Crime → The Turnip Incident → Research Trip → The Dragon Came Too    | Barnaby’s Golden Lute            |
| **Grizelda Stonebeard**, Dwarven Smith            | Renown 1                                   | Dwarven Stout, Roast Boar, Hearty Stew               | Too Small → Too Heavy → Too Magical → Too Chatty → Just Right                               | The Unbreakable Tankard          |
| **Fizzlewick the Befuddled**, Wizard (Almost)     | Renown 2                                   | Wizard's Fizz, Barkroot Tea                          | A Slight Mishap → Study Buddy → The Frog Incident → Cramming → Passed!                      | Fizzlewick’s Spellbook           |
| **Pip Quickfinger**, Goblin Merchant (and Squeak) | Renown 3                                   | Goblin Goulash, Stinky Cheese Board                  | Dragon Eggs, Cheap! → The Invisible Sword → Honest Pip → The Egg Is Warm → It Hatched       | Hatchling’s Nest                 |
| **Sir Reginald Pompington III**, Knight Errant    | Renown 3, owns Quest Notice Board          | Royal Feast Pie, Knightly Kebabs, Roast Boar         | A Soggy Scroll → The Holy Rail → The Holy Gail → Grill Hunting → The Holy Grill             | The Holy Grill + Knightly Kebabs |
| **Old Oakley**, Ancient Ent                       | Renown 4, owns Potted Fern                 | Barkroot Tea, Mushroom Pie                           | Hoom → Clues → The Fern → Market Day → Found                                                | Oakley’s Sapling                 |
| **Mortimer Gloom**, Nervous Necromancer           | Renown 5                                   | Calcium Shake, Mushroom Pie                          | Meet Bones → Small Talk → The Party → Bones Runs Away → Book Club                           | Mortimer’s Reading Nook          |
| **Madame Zephyrine**, Fortune Teller              | Renown 5, owns Crystal Ball                | Moonberry Tart, Barkroot Tea, Honey Mead             | A Vision → Beware the Goose → The Cracked Ball → Wings on the Horizon → The Goose Explained | Prophetic Star Lanterns          |
| **Captain Brinebottom**, Retired Pirate           | Renown 6, owns Ship in a Bottle            | Sea-Salt Grog, Fisherman's Chowder                   | Ahoy → Bigger → Even Bigger → A Letter → Gerald                                             | Captain’s Ship Wheel             |
| **Ledgerly Pinchpenny**, Royal Tax Inspector      | Renown 8, owns Brass Coin Register         | Buttered Bread, Stinky Cheese Board, Royal Feast Pie | Official Business → Paperwork → Off the Record → A Complaint → Royal Seal                   | Royal Seal of Excellence         |
| **Ember**, Very Polite Dragon                     | Renown 9, after Barnaby Bramblefoot's tale | Dragon Pepper Chili, Roast Boar                      | The Roof → Hiccups → The Hoard → Auntie Ember → The Hearth                                  | Dragon-Kindled Hearth            |

### Renown levels

| Level | Renown needed | Level-up coins | Guests per night |
| ----- | ------------- | -------------- | ---------------- |
| 1     | 0             | —              | 3                |
| 2     | 60            | 50             | 3                |
| 3     | 180           | 75             | 3                |
| 4     | 360           | 100            | 4                |
| 5     | 600           | 125            | 4                |
| 6     | 900           | 150            | 4                |
| 7     | 1260          | 175            | 4                |
| 8     | 1680          | 200            | 5                |
| 9     | 2160          | 225            | 5                |
| 10    | 2700          | 250            | 5                |
| 11    | 3300          | 275            | 5                |
| 12    | 3960          | 300            | 5                |

## The regulars' tales (spoilers)

- **Barnaby Bramblefoot** is composing an epic about a dragon he's never met. He can't rhyme
  "dragon" (Barley offers "wagon"), gets pelted with a turnip, goes to Mount Grumble for research,
  and comes back with Ember, who says it's the worst ballad she's ever heard and wants it again.
- **Grizelda Stonebeard** forges the perfect tankard. The first falls through the floor, the second
  never pours, the third only says "refill". The fourth, tempered in a volcano, is unbreakable.
- **Fizzlewick the Befuddled** is on his forty-first attempt at the Grand Spelling Exam. He casts
  FIRE BALL (a very warm dance), levitates his hat into a tree, and turns the examiner into a frog
  by spelling CHARM with an F.
- **Sir Reginald Pompington III**'s quest scroll got rained on. He seeks the Holy Rail (a fence
  post), the Holy Gail (a baker, who is not pleased), and finally the Holy Grill.
- **Pip Quickfinger** and Squeak the rat sell "genuine dragon eggs" (potatoes) and invisible swords.
  Pip tries honesty for a day. Then the potato egg starts humming.
- **Old Oakley** the ent has been looking for his lost acorn for two hundred years, very slowly.
  She turns out to be growing under your floorboards.
- **Mortimer Gloom** is a shy necromancer practising small talk. His best friend Bones runs away
  and becomes a theatre coat rack. Mortimer starts a book club.
- **Madame Zephyrine**'s predictions come true, just never how anyone expects. Beware the goose.
- **Captain Brinebottom**'s kraken grows with every retelling, until a letter arrives from Gerald,
  the teacup-sized kraken, apologising about "the spoon thing".
- **Ledgerly Pinchpenny**, the tax inspector, arrives with twelve forms and slowly admits he likes
  the stew. He withdraws his own complaint and recommends you for a royal seal.
- **Ember** is a very polite dragon who ducks through the door, gets hiccups, starts a recipe hoard,
  becomes an auntie to Pip's hatchling, and lights your hearth for good.

Chapters that reference another guest's story only play once that story is finished.

## Words

- `public/data/words-core.txt`: SCOWL levels 10–20. Roots and first-choice hints.
- `public/data/words-common.txt`: SCOWL level 35. Used to prove orders are solvable, and as
  backup hints.
- `public/data/words-extra.txt`: everything else up to SCOWL 70, all English dialects. Accepted,
  never suggested.
- `public/data/roots.json`: core 5–8 letter words (no lazy plurals) that hide plenty of familiar
  sub-words.
- The filter (`scripts/word-filter.json`, ROT13) blocks slurs and explicit words everywhere, and
  keeps mild, gross or gloomy words out of roots and hints while still accepting them as guesses.

## Tutorial

Barley introduces the tavern on first launch and the first night starts straight away with
Barnaby. Coaching tips appear once each, at the moment they're relevant: forging, filling slots,
the secret ingredient, the tip jar, patience, and hints (after a few misses). After the first night,
Barley points at the shop, recipe book and guest book.

## Ideas for later

- A daily puzzle shared by all players, with a streak.
- Seasonal events (a harvest festival menu, a spooky night with Mortimer).
- Guest requests with twists: "a word with a Z", "nothing with an E".
- Remove-ads purchase (the save already carries a `removeAds` flag the ad service respects).
- Localised word lists and content.
