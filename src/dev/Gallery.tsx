import { CONTENT } from '../content';
import type { Mood } from '../game/types';
import { Portrait } from '../ui/art/Portrait';
import { TavernScene } from '../ui/art/TavernScene';
import { Icon, IngredientIcon, RecipeIcon } from '../ui/art/Icons';
import { Barley } from '../ui/art/Barley';
import { SceneDefs } from '../ui/art/SceneDefs';
import type { FurnitureSlot } from '../game/types';

const SETS: Array<Partial<Record<FurnitureSlot, string>>> = [
  {
    hearth: 'hearth-sooty',
    lights: 'lights-candles',
    window: 'window-dusty',
    floorRight: 'table-wobbly',
  },
  {
    hearth: 'hearth-stone',
    lights: 'lights-lanterns',
    window: 'window-flowers',
    floorRight: 'table-oak',
    wallLeft: 'wall-shield',
    wallRight: 'painting-goose',
    hearthside: 'cat-basket',
    counter: 'tip-jar',
  },
  {
    hearth: 'hearth-grand',
    lights: 'lights-chandelier',
    window: 'window-stained',
    floorRight: 'bard-stage',
    wallLeft: 'notice-board',
    wallRight: 'tapestry',
    hearthside: 'potted-fern',
    counter: 'crystal-ball',
  },
  {
    hearth: 'hearth-dragon',
    lights: 'lights-fireflies',
    window: 'window-stained',
    floorRight: 'armchair',
    wallLeft: 'mounted-antlers',
    wallRight: 'ship-bottle',
    hearthside: 'hatchling-nest',
    counter: 'brass-register',
  },
  {
    hearth: 'hearth-dragon',
    lights: 'lights-stars',
    window: 'window-flowers',
    floorRight: 'reading-nook',
    wallLeft: 'legendary-tankard',
    wallRight: 'holy-grill',
    hearthside: 'oakley-sapling',
    counter: 'enchanted-quill',
  },
  {
    hearth: 'hearth-stone',
    lights: 'lights-lanterns',
    window: 'window-dusty',
    floorRight: 'table-oak',
    wallLeft: 'ships-wheel',
    wallRight: 'golden-lute',
    hearthside: 'cat-basket',
    counter: 'fizzlewick-grimoire',
  },
  {
    hearth: 'hearth-stone',
    lights: 'lights-candles',
    window: 'window-dusty',
    floorRight: 'table-wobbly',
    counter: 'royal-seal',
  },
];

/** Dev-only art gallery: open the dev server with #gallery. */
export function Gallery() {
  const moods: Mood[] = ['neutral', 'happy', 'grumpy', 'surprised', 'sad'];
  const looks = CONTENT.townsfolkList.flatMap((t) =>
    t.looks.map((l, i) => ({ id: `${t.id}-${i}`, l })),
  );
  return (
    <div style={{ padding: 12, overflow: 'auto', height: '100%', background: '#3d2616' }}>
      <svg class="svg-defs" aria-hidden="true">
        <SceneDefs />
      </svg>
      <h2 style={{ fontFamily: 'var(--font-display)' }}>Icons</h2>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          background: '#f7e8c4',
          padding: 10,
          borderRadius: 8,
          color: '#2a1a10',
        }}
      >
        {(
          [
            'coin',
            'star',
            'starEmpty',
            'heart',
            'heartEmpty',
            'gear',
            'shuffle',
            'spoon',
            'check',
            'close',
            'back',
            'book',
            'shop',
            'scroll',
            'play',
            'lock',
            'sparkle',
            'music',
            'sound',
            'vibrate',
            'leaf',
            'door',
            'crown',
            'hourglass',
            'gift',
            'bell',
            'info',
            'shield',
            'trash',
          ] as const
        ).map((n) => (
          <Icon name={n} size={36} />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          background: '#f7e8c4',
          padding: 10,
          borderRadius: 8,
          marginTop: 8,
        }}
      >
        {(
          [
            'grain',
            'hops',
            'honey',
            'apple',
            'berry',
            'carrot',
            'potato',
            'onion',
            'mushroom',
            'meat',
            'fish',
            'cheese',
            'egg',
            'herb',
            'pepper',
            'milk',
            'butter',
            'salt',
            'fire',
            'magic',
            'moon',
            'bone',
            'sock',
            'crown',
          ] as const
        ).map((n) => (
          <IngredientIcon id={n} size={36} />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          background: '#f7e8c4',
          padding: 10,
          borderRadius: 8,
          marginTop: 8,
        }}
      >
        {CONTENT.recipeList.map((r) => (
          <RecipeIcon id={r.icon} size={56} />
        ))}
        {(['neutral', 'happy', 'grumpy', 'surprised', 'sad'] as const).map((m) => (
          <Barley mood={m} class="gallery-barley" />
        ))}
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)' }}>Scenes</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SETS.map((placed, i) => (
          <TavernScene
            placed={placed}
            customer={
              i % 2
                ? {
                    key: 'c',
                    spec: CONTENT.guestList[i]!.portrait,
                    mood: 'happy',
                    talking: false,
                    motion: 'idle',
                  }
                : null
            }
            class="gallery-scene"
          />
        ))}
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)' }}>Guests</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CONTENT.guestList.map((g) => (
          <div style={{ width: 120, textAlign: 'center', fontSize: 11 }}>
            <div style={{ width: 120, height: 148, background: '#6b4a2e', borderRadius: 8 }}>
              <Portrait spec={g.portrait} />
            </div>
            {g.name}
          </div>
        ))}
      </div>
      <h2>Moods</h2>
      {['barnaby', 'grizelda', 'ember'].map((id) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {moods.map((m) => (
            <div style={{ width: 96, height: 118, background: '#6b4a2e', borderRadius: 8 }}>
              <Portrait spec={CONTENT.guests.get(id)!.portrait} mood={m} />
            </div>
          ))}
        </div>
      ))}
      <h2>Townsfolk</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {looks.map(({ id, l }) => (
          <div style={{ width: 96, textAlign: 'center', fontSize: 10 }}>
            <div style={{ width: 96, height: 118, background: '#6b4a2e', borderRadius: 8 }}>
              <Portrait spec={l} />
            </div>
            {id}
          </div>
        ))}
      </div>
    </div>
  );
}
