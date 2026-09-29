# Tavern art pipeline

The tavern, its furniture and Barley are 3D scenes built in code with Blender's Python module
and path-traced with Cycles. Nothing is hand-painted and there are no image or model files to
license: materials are procedural (noise-based wood, stone, plaster, metal, glass, fabric) and
the few printed or painted pieces (the goose portrait, notices, labels) are SVG drawn in
`tavern/textures.py`, using the game's own fonts.

The renders the game uses are committed in `src/ui/art/renders/`, so you only need this folder
to change the art.

Licensing: renders made with Blender are yours, with no licence attached. The scripts here use
Blender's Python API, which is GPL; that only matters if you distribute the scripts themselves.

## How the layers fit together

The game lays the tavern out in "scene units": a 480 x 320 core that wider or taller screens
extend to 760 x 540. The Blender camera is calibrated so the back wall, 7 m away, maps to 1 cm
per unit (see `tavern/core.py`). Every layer is a crop of that one camera frame, and
`manifest.json` records each crop's box in scene units. `TavernScene` stacks them:

1. `base`: the empty room (always drawn).
2. Furniture behind the guest, back to front: window, right wall, hearth, left wall, seating,
   fireside, lights.
3. The guest.
4. `counter` (the bar top), the counter piece, Barley (`barley:<mood>`).

Furniture layers are rendered with the room as a **shadow catcher**, so each piece carries its
own soft shadows onto the wall or floor. A layer can darken the room but not brighten it, so
light that reaches the room (the fire, the two lamps, moonlight) is part of every render, and
each piece's own flames and lamps are light-linked to that piece only. Hearth, lights and
window are always furnished in the game, which is what makes this work.

## Rendering

Needs Python 3.11 (the `bpy` wheel is Blender 5.0 as a module) and about 2 GB of disk.

```bash
python3.11 -m venv .venv-art
.venv-art/bin/pip install -r art/blender/requirements.txt
npm install                                   # the fonts come from node_modules/@fontsource

# Quick low-resolution check of the default room (a few minutes):
.venv-art/bin/python art/blender/render.py --preview --out /tmp/tavern defaults --composite /tmp/tavern.png

# Look at one area at full size with some pieces placed (scene units x0,y0,x1,y1):
.venv-art/bin/python art/blender/render.py --closeup=-10,-10,250,260 --dest /tmp/hearth.png hearth-grand cat-basket

# Re-render layers for the game (writes WebP + manifest.json into src/ui/art/renders/):
.venv-art/bin/python art/blender/render.py hearth-grand          # one piece
.venv-art/bin/python art/blender/render.py barley                # Barley's moods and portraits
.venv-art/bin/python art/blender/render.py all                   # everything, about 2 h on 4 cores
```

## Where things are

| File                  | What                                                    |
| --------------------- | ------------------------------------------------------- |
| `tavern/core.py`      | Scene setup, render settings, the camera calibration    |
| `tavern/materials.py` | Procedural materials                                    |
| `tavern/geo.py`       | Mesh helpers (boxes, lathes, tubes, mouldings)          |
| `tavern/room.py`      | Walls, timbers, floor, ceiling, window opening, the bar |
| `tavern/lighting.py`  | Firelight, lamps, moonlight and fill                    |
| `tavern/slots.py`     | Where each furniture slot lives in the room             |
| `tavern/items/*.py`   | One builder per furniture piece, registered by id       |
| `tavern/barley.py`    | Barley and his five expressions                         |
| `tavern/textures.py`  | Painted and printed artwork (SVG)                       |
| `tavern/post.py`      | Glow, feathered crop edges, WebP export                 |
| `render.py`           | Renders layers and writes the manifest                  |

To add a furniture piece: add it to `src/content/furniture.ts`, write a builder in the matching
`tavern/items/` module with `@item("<id>", "<slot>")`, build it around that slot's anchor in
`slots.py`, and render it by id.
