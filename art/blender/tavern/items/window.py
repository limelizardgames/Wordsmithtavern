"""Window slot: every window fills the opening at slots.WINDOW (the night sky is part of the room)."""

from __future__ import annotations

import math
import random

from mathutils import Vector

from .. import geo, slots, textures
from .. import materials as M
from . import common, item

X0, X1, Z0, Z1 = slots.WINDOW
FRAME_Y = slots.WALL + 0.16


def window_wood():
    return M.wood(
        "window-wood",
        (0.05, 0.032, 0.02),
        (0.12, 0.08, 0.05),
        grain=60,
        rough=(0.5, 0.8),
        bump=0.3,
        dirt=0.7,
        checks=0.6,
    )


def casement(glass, bar_w=0.022, cols=3, rows=4, frame_w=0.06, transom=1.62):
    wood = window_wood()
    depth = 0.07
    y = FRAME_Y
    w, h = X1 - X0, Z1 - Z0
    cx = (X0 + X1) / 2
    # Outer frame.
    geo.box("frame-top", (w, depth, frame_w), (cx, y, Z1 - frame_w / 2), mat=wood, bev=0.004)
    geo.box("frame-bottom", (w, depth + 0.02, frame_w), (cx, y - 0.01, Z0 + frame_w / 2), mat=wood, bev=0.004)
    geo.box(
        "frame-l",
        (h, depth, frame_w),
        (X0 + frame_w / 2, y, (Z0 + Z1) / 2),
        rot=(0, math.pi / 2, 0),
        mat=wood,
        bev=0.004,
    )
    geo.box(
        "frame-r",
        (h, depth, frame_w),
        (X1 - frame_w / 2, y, (Z0 + Z1) / 2),
        rot=(0, math.pi / 2, 0),
        mat=wood,
        bev=0.004,
    )
    geo.box("mullion", (h, depth, frame_w * 0.8), (cx, y, (Z0 + Z1) / 2), rot=(0, math.pi / 2, 0), mat=wood, bev=0.004)
    geo.box("transom", (w, depth, frame_w * 0.8), (cx, y, transom), mat=wood, bev=0.004)
    # Glazing bars in each light.
    for side in (0, 1):
        lx0 = X0 + frame_w if side == 0 else cx + frame_w * 0.4
        lx1 = cx - frame_w * 0.4 if side == 0 else X1 - frame_w
        for lz0, lz1, nr in (
            (Z0 + frame_w, transom - frame_w * 0.4, rows - 1),
            (transom + frame_w * 0.4, Z1 - frame_w, 1),
        ):
            for c in range(1, cols):
                x = lx0 + (lx1 - lx0) * c / cols
                geo.box(
                    "bar-v",
                    (lz1 - lz0, 0.03, bar_w),
                    (x, y + 0.005, (lz0 + lz1) / 2),
                    rot=(0, math.pi / 2, 0),
                    mat=wood,
                    bev=0.003,
                )
            for r in range(1, nr + 1):
                z = lz0 + (lz1 - lz0) * r / (nr + 1)
                geo.box("bar-h", (lx1 - lx0, 0.03, bar_w), ((lx0 + lx1) / 2, y + 0.005, z), mat=wood, bev=0.003)
            geo.box(
                "pane", (lx1 - lx0, 0.004, lz1 - lz0), ((lx0 + lx1) / 2, y + 0.012, (lz0 + lz1) / 2), mat=glass, bev=0.0
            )


def cobweb(corner: Vector, size=0.12, seed=1):
    rnd = random.Random(seed)
    silk = M.matte("silk", (0.6, 0.6, 0.58), rough=0.5)
    spokes = []
    for k in range(6):
        a = math.radians(k * 18)
        end = corner + Vector((math.cos(a) * size, -0.001, -math.sin(a) * size))
        geo.tube(
            "web-spoke",
            [corner, corner + (end - corner) * 0.5 + Vector((0, 0, -0.006)), end],
            0.0006,
            mat=silk,
            resolution=1,
        )
        spokes.append(end)
    for ring in (0.35, 0.55, 0.75, 0.92):
        pts = [
            corner + (e - corner) * (ring + rnd.uniform(-0.04, 0.04)) + Vector((0, 0, -0.004 * ring)) for e in spokes
        ]
        geo.tube("web-ring", pts, 0.0005, mat=silk, resolution=1)


@item("window-dusty", "window")
def window_dusty():
    glass = M.glass("glass-dusty", (0.86, 0.9, 0.84), rough=0.08, dirt=0.35)
    casement(glass)
    cobweb(Vector((X0 + 0.065, FRAME_Y - 0.03, Z1 - 0.065)), size=0.14)
    # A forgotten candle end and a dead fly on the sill, for the dust's sake.
    common.candle(Vector((X1 - 0.16, slots.WALL + 0.08, Z0)), height=0.03, radius=0.018, lit=False, seed=5)


def petunia(center: Vector, radius: float, color, seed: int):
    """A trumpet flower with five soft lobes, facing roughly towards the room."""
    rnd = random.Random(seed)
    petal = M.matte(f"petal-{color}", color, rough=0.55, sss=0.35, sheen=0.3)
    lobes = lambda a: radius * (0.82 + 0.18 * math.cos(5 * a))
    fl = geo.disc("petunia", lobes, center, segments=40, mat=petal)
    fl.rotation_euler = (math.pi / 2 + rnd.uniform(-0.6, 0.3), rnd.uniform(-0.5, 0.5), rnd.uniform(0, 6.28))
    sub = fl.modifiers.new("Cup", "SIMPLE_DEFORM")
    sub.deform_method = "BEND"
    sub.angle = math.radians(40)
    throat = geo.lathe(
        "throat",
        [(0.0, -0.025), (radius * 0.18, -0.02), (radius * 0.3, 0.0)],
        center,
        segments=12,
        mat=M.matte("throat", tuple(c * 0.35 for c in color), rough=0.6),
    )
    throat.rotation_euler = fl.rotation_euler
    return fl


def leaf(center: Vector, length: float, mat, rot):
    """A simple pointed oval leaf."""
    lf = geo.disc("leaf", lambda a: length * 0.5 * (0.45 + 0.55 * abs(math.cos(a))), center, segments=24, mat=mat)
    lf.scale = (1.0, 0.45, 1.0)
    lf.rotation_euler = rot
    return lf


@item("window-flowers", "window")
def window_flowers():
    glass = M.glass("glass-clean", (0.92, 0.95, 0.92), rough=0.02, dirt=0.05)
    casement(glass)
    wood = window_wood()
    box_y = slots.WALL - 0.02
    bx0, bx1, bz = X0 - 0.02, X1 + 0.02, Z0
    geo.box(
        "flowerbox-front",
        (bx1 - bx0, 0.02, 0.14),
        Vector(((bx0 + bx1) / 2, box_y - 0.09, bz + 0.07)),
        mat=wood,
        bev=0.004,
    )
    geo.box(
        "flowerbox-back",
        (bx1 - bx0, 0.02, 0.12),
        Vector(((bx0 + bx1) / 2, box_y + 0.09, bz + 0.06)),
        mat=wood,
        bev=0.004,
    )
    for x in (bx0, bx1):
        geo.box("flowerbox-end", (0.02, 0.2, 0.14), Vector((x, box_y, bz + 0.07)), mat=wood, bev=0.004)
    geo.box(
        "soil",
        (bx1 - bx0 - 0.03, 0.17, 0.02),
        Vector(((bx0 + bx1) / 2, box_y, bz + 0.115)),
        mat=M.matte("soil", (0.05, 0.035, 0.022), rough=1.0, bump=1.0, bump_scale=200),
        bev=0.0,
    )
    green = M.matte("petunia-leaf", (0.05, 0.14, 0.035), rough=0.55, sss=0.2)
    rnd = random.Random(8)
    colours = [(0.75, 0.12, 0.45), (0.5, 0.1, 0.55), (0.92, 0.88, 0.9), (0.85, 0.25, 0.5)]
    for k in range(22):
        x = rnd.uniform(bx0 + 0.05, bx1 - 0.05)
        y = box_y + rnd.uniform(-0.08, 0.06)
        z = bz + 0.13 + rnd.uniform(0.0, 0.14)
        stem_base = Vector((x + rnd.uniform(-0.03, 0.03), box_y, bz + 0.12))
        top = Vector((x, y, z))
        geo.tube(
            "stem", [stem_base, (stem_base + top) / 2 + Vector((0, -0.02, 0)), top], 0.0025, mat=green, resolution=2
        )
        petunia(top, rnd.uniform(0.028, 0.036), rnd.choice(colours), seed=k)
    for _ in range(40):
        p = Vector(
            (rnd.uniform(bx0 + 0.03, bx1 - 0.03), box_y + rnd.uniform(-0.1, 0.07), bz + 0.12 + rnd.uniform(0.0, 0.1))
        )
        leaf(p, rnd.uniform(0.035, 0.05), green, (rnd.uniform(0.3, 1.4), rnd.uniform(-0.6, 0.6), rnd.uniform(0, 6.28)))
    # Trailing stems over the front of the box.
    for _ in range(6):
        x = rnd.uniform(bx0 + 0.08, bx1 - 0.08)
        p0 = Vector((x, box_y - 0.09, bz + 0.13))
        pts = [p0, p0 + Vector((0.02, -0.04, -0.05)), p0 + Vector((0.04, -0.05, -0.14))]
        geo.tube("trail", pts, 0.0025, mat=green, resolution=2)
        for t in (0.5, 1.0):
            q = pts[1].lerp(pts[2], t)
            leaf(q, 0.035, green, (rnd.uniform(1.0, 1.6), rnd.uniform(-0.4, 0.4), rnd.uniform(0, 6.28)))


@item("window-stained", "window")
def window_stained():
    img = textures.image("stained-glass")
    wood = window_wood()
    w, h = X1 - X0, Z1 - Z0
    geo.grid(
        "stained",
        w - 0.02,
        h - 0.02,
        2,
        2,
        Vector(((X0 + X1) / 2, FRAME_Y + 0.01, (Z0 + Z1) / 2)),
        rot=(math.pi / 2, 0, 0),
        mat=M.stained("stained-flood", img),
    )
    fw = 0.05
    depth = 0.07
    cx = (X0 + X1) / 2
    geo.box("frame-top", (w, depth, fw), (cx, FRAME_Y, Z1 - fw / 2), mat=wood, bev=0.004)
    geo.box("frame-bottom", (w, depth + 0.02, fw), (cx, FRAME_Y - 0.01, Z0 + fw / 2), mat=wood, bev=0.004)
    geo.box(
        "frame-l", (h, depth, fw), (X0 + fw / 2, FRAME_Y, (Z0 + Z1) / 2), rot=(0, math.pi / 2, 0), mat=wood, bev=0.004
    )
    geo.box(
        "frame-r", (h, depth, fw), (X1 - fw / 2, FRAME_Y, (Z0 + Z1) / 2), rot=(0, math.pi / 2, 0), mat=wood, bev=0.004
    )
    iron = common.iron()
    for z in (Z0 + h * 0.36, Z0 + h * 0.68):
        geo.cylinder(
            "saddle-bar", 0.006, w - 0.04, Vector((cx, FRAME_Y - 0.012, z)), rot=(0, math.pi / 2, 0), mat=iron, verts=10
        )
