"""Night-time lighting shared by every render: the fire, two lamps, moonlight and a soft fill.

Hearth, lights and window are always furnished in the game, so their light is part of the room.
Each furniture variant puts its fire or lamps at the same spots.
"""

from __future__ import annotations

import bpy
from mathutils import Vector

from . import core

FIRE = Vector((-1.45, 6.72, 0.28))
LAMPS = (Vector((-1.05, 5.75, 1.78)), Vector((1.05, 5.75, 1.78)))
MOON_DIR = Vector((0.12, -1.0, -0.55)).normalized()

WARM_FIRE = (1.0, 0.42, 0.12)
WARM_LAMP = (1.0, 0.55, 0.22)
WARM_FILL = (1.0, 0.7, 0.45)
MOON = (0.55, 0.68, 1.0)


def point(name, loc, power, color, radius=0.05, col="Lights"):
    data = bpy.data.lights.new(name, "POINT")
    data.energy = power
    data.color = color
    data.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, data)
    ob.location = loc
    return core.link(ob, col)


def area(name, loc, target, power, color, size=(1.0, 1.0), col="Lights"):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = "RECTANGLE"
    data.size, data.size_y = size
    ob = bpy.data.objects.new(name, data)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return core.link(ob, col)


def sun(name, direction, strength, color, angle=0.01, col="Lights"):
    data = bpy.data.lights.new(name, "SUN")
    data.energy = strength
    data.color = color
    data.angle = angle
    ob = bpy.data.objects.new(name, data)
    ob.rotation_euler = Vector(direction).to_track_quat("-Z", "Y").to_euler()
    return core.link(ob, col)


def build(fire=True, lamps=True):
    if fire:
        # Firelight leaving the hearth opening, facing the room: identical with any hearth, and
        # never blocked by the chimney breast behind it.
        area("fire-glow", (FIRE.x, 6.48, 0.5), (FIRE.x, 3.0, 0.45), 200.0, WARM_FIRE, size=(0.78, 0.5))
        area("fire-glow-up", (FIRE.x, 6.45, 0.7), (FIRE.x, 4.5, 1.5), 60.0, WARM_FIRE, size=(0.7, 0.2))
    if lamps:
        for i, p in enumerate(LAMPS):
            point(f"lamp-{i}", p, 32.0, WARM_LAMP, radius=0.04)
    sun("moon", MOON_DIR, 1.4, MOON, angle=0.02)
    area("fill", (-0.6, -0.4, 1.9), (0, 5.0, 0.8), 55.0, WARM_FILL, size=(2.5, 0.8))
    # A candle on the bar just out of frame, left of Barley.
    point("bar-candle", (-2.9, 1.45, 1.25), 14.0, WARM_LAMP, radius=0.03)
