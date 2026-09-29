"""Where each furniture slot lives in the room (metres). Every variant of a slot is built around
the same anchor, so the room's lighting and the other slots fit whichever piece is on display."""

from __future__ import annotations

from mathutils import Vector

from . import core, lighting

WALL = core.WALL_Y

# Hearth: a chimney breast on the back wall, left of the window, floor to ceiling.
HEARTH_X = lighting.FIRE.x
HEARTH_W = 1.3
BREAST_FRONT = 6.5
FIRE = lighting.FIRE

# Left wall slot hangs on the chimney breast above the mantel.
WALL_LEFT = Vector((HEARTH_X, BREAST_FRONT - 0.02, 1.62))

# Window opening in the back wall (x0, x1, z0, z1); items fill it.
WINDOW = (-0.5, 0.5, 0.95, 2.0)

# Right wall slot: plaster bay between the posts at x = 0.66 and 2.55.
WALL_RIGHT = Vector((1.6, WALL - 0.02, 1.58))

# Seating stands on the floor in front of the right bay.
FLOOR_RIGHT = Vector((1.55, 6.25, 0.0))

# Fireside: on the floor beside the hearth, towards the room.
HEARTHSIDE = Vector((-0.78, 6.05, 0.0))

# Lamps hang at lighting.LAMPS from the joists.
LAMPS = lighting.LAMPS
CEILING = 2.75

# Counter props and Barley stand on the bar top.
BAR_Z = 1.05
COUNTER = Vector((0.37, 1.6, BAR_Z))
BARLEY = Vector((-0.45, 1.6, BAR_Z))

# Drawing order in the game, back to front (the guest goes between "lights" and the counter).
ORDER = ["window", "wallRight", "hearth", "wallLeft", "floorRight", "hearthside", "lights", "counter"]
