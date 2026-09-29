"""Hearths. Every hearth is a chimney breast on the back wall with its fire at slots.FIRE."""

from __future__ import annotations

import math
import random

from mathutils import Vector

from .. import geo, slots
from .. import materials as M
from . import common, item

CEIL = slots.CEILING
Y0 = slots.BREAST_FRONT  # front face of the chimney breast
Y1 = slots.WALL + 0.02


def rough_stone(name, size, loc, mat, rot=(0, 0, 0), seed=0, rough=0.012):
    """A roughly squared stone: rounded arrises, lumpy faces."""
    ob = geo.box(name, size, loc, rot=rot, mat=mat, bev=min(size) * 0.12, segments=2)
    sub = ob.modifiers.new("Sub", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = 2
    geo.displace(ob, strength=rough * 1.6, size=0.04 + (seed % 5) * 0.01, depth=2)
    return ob


def stone_jamb(x0, x1, z0, z1, mat, seed, depth=0.5, course=0.2, y_front=Y0):
    rnd = random.Random(seed)
    z = z0
    k = 0
    while z < z1 - 0.02:
        h = min(course * rnd.uniform(0.8, 1.2), z1 - z)
        rough_stone(
            f"jamb-{seed}-{k}",
            (x1 - x0 - 0.012, depth, h - 0.012),
            ((x0 + x1) / 2 + rnd.uniform(-0.006, 0.006), y_front + depth / 2 + rnd.uniform(-0.01, 0.006), z + h / 2),
            mat,
            seed=seed + k,
        )
        z += h
        k += 1
    geo.box(
        "mortar",
        (x1 - x0 - 0.02, depth - 0.02, z1 - z0),
        ((x0 + x1) / 2, y_front + depth / 2 + 0.008, (z0 + z1) / 2),
        mat=M.mortar("mortar-dark", (0.12, 0.1, 0.085)),
        bev=0.0,
    )


def firebox(x0, x1, z_top, mat_back):
    """Sooty inside of the fireplace opening."""
    w = x1 - x0
    geo.grid(
        "firebox-back",
        w + 0.1,
        z_top + 0.3,
        12,
        10,
        ((x0 + x1) / 2, Y1 - 0.03, (z_top + 0.3) / 2),
        rot=(math.pi / 2, 0, 0),
        mat=mat_back,
    )
    geo.box(
        "firebox-top",
        (w + 0.1, Y1 - Y0 + 0.02, 0.04),
        ((x0 + x1) / 2, (Y0 + Y1) / 2, z_top + 0.3),
        mat=mat_back,
        bev=0.0,
    )
    geo.box(
        "firebox-floor",
        (w, Y1 - Y0, 0.03),
        ((x0 + x1) / 2, (Y0 + Y1) / 2, 0.015),
        mat=M.stone("hearthstone", (0.16, 0.15, 0.14), (0.08, 0.075, 0.07), soot=0.8),
        bev=0.003,
    )


def face(name, center, size, normal: str, mat, density=160):
    """A dense grid for displaced masonry. normal: '-Y' (front), '+X' / '-X' (sides), '+Z' (floor)."""
    w, h = size
    nx, ny = max(2, int(w * density)), max(2, int(h * density))
    rot = {
        "-Y": (math.pi / 2, 0, 0),
        "+X": (math.pi / 2, 0, math.pi / 2),
        "-X": (math.pi / 2, 0, -math.pi / 2),
        "+Z": (0, 0, 0),
        "-Z": (math.pi, 0, 0),
    }[normal]
    return geo.grid(name, w, h, nx, ny, center, rot=rot, mat=mat)


def masonry_breast(x0, x1, ox0, ox1, oz, mat, back_mat, top_z=CEIL, box_back=6.95):
    """Chimney breast faces in displaced stone with a fireplace opening, plus the firebox."""
    face("front-upper", ((x0 + x1) / 2, Y0, (oz + top_z) / 2), (x1 - x0, top_z - oz), "-Y", mat)
    face("front-left", ((x0 + ox0) / 2, Y0, oz / 2), (ox0 - x0, oz), "-Y", mat)
    face("front-right", ((ox1 + x1) / 2, Y0, oz / 2), (x1 - ox1, oz), "-Y", mat)
    face("side-right", (x1, (Y0 + Y1) / 2, top_z / 2), (Y1 - Y0, top_z), "+X", mat)
    face("side-left", (x0, (Y0 + Y1) / 2, top_z / 2), (Y1 - Y0, top_z), "-X", mat)
    # Inside the opening.
    face("jamb-l", (ox0, (Y0 + box_back) / 2, oz / 2), (box_back - Y0, oz), "+X", back_mat)
    face("jamb-r", (ox1, (Y0 + box_back) / 2, oz / 2), (box_back - Y0, oz), "-X", back_mat)
    face("firebox-back", ((ox0 + ox1) / 2, box_back, (oz + 0.3) / 2), (ox1 - ox0, oz + 0.3), "-Y", back_mat)
    face(
        "firebox-top",
        ((ox0 + ox1) / 2, (Y0 + box_back) / 2, oz),
        (ox1 - ox0, box_back - Y0),
        "-Z",
        back_mat,
        density=40,
    )
    # Solid core so nothing of the room shows through the stonework.
    geo.box(
        "core",
        (x1 - x0 - 0.06, Y1 - Y0 - 0.08, top_z - oz),
        ((x0 + x1) / 2, (Y0 + Y1) / 2 + 0.03, (oz + top_z) / 2),
        mat=M.mortar("mortar-core", (0.05, 0.045, 0.04)),
        bev=0.0,
    )
    for side, (a0, a1) in (("l", (x0 + 0.03, ox0)), ("r", (ox1, x1 - 0.03))):
        geo.box(
            f"core-{side}",
            (a1 - a0, Y1 - Y0 - 0.08, oz),
            ((a0 + a1) / 2, (Y0 + Y1) / 2 + 0.03, oz / 2),
            mat=M.mortar("mortar-core", (0.05, 0.045, 0.04)),
            bev=0.0,
        )


def breast(x0, x1, z0, mat, depth=Y1 - Y0):
    ob = geo.box(
        "breast", (x1 - x0, depth, CEIL - z0), ((x0 + x1) / 2, Y0 + depth / 2, (z0 + CEIL) / 2), mat=mat, bev=0.01
    )
    sub = ob.modifiers.new("Sub", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = 4
    ob.modifiers.move(len(ob.modifiers) - 1, 0)
    geo.displace(ob, strength=0.01, size=0.3)
    return ob


def rubble(
    x0,
    x1,
    z0,
    z1,
    mat,
    soot_mat=None,
    soot_center=None,
    soot_r=0.55,
    seed=0,
    depth=0.16,
    y_front=Y0,
    width=(0.16, 0.36),
    course=(0.11, 0.22),
):
    """Rubble stonework filling a rectangle of wall face, with mortar behind."""
    rnd = random.Random(seed)
    z = z0
    k = 0
    while z < z1 - 0.03:
        h = min(rnd.uniform(*course), z1 - z)
        x = x0 - rnd.uniform(0.0, 0.12)
        while x < x1 - 0.02:
            w = rnd.uniform(*width)
            xa, xb = max(x, x0), min(x + w, x1)
            if xb - xa > 0.05:
                c = Vector(
                    (
                        (xa + xb) / 2,
                        y_front + depth / 2 + rnd.uniform(-0.014, 0.004),
                        z + h / 2 + rnd.uniform(-0.008, 0.008),
                    )
                )
                m = mat
                if (
                    soot_mat is not None
                    and soot_center is not None
                    and (c - soot_center).length < soot_r * rnd.uniform(0.8, 1.25)
                ):
                    m = soot_mat
                rough_stone(
                    f"rubble-{seed}-{k}",
                    (xb - xa - 0.018, depth, h - 0.018),
                    c,
                    m,
                    rot=(0, rnd.uniform(-0.06, 0.06), 0),
                    seed=seed + k,
                    rough=0.014,
                )
                k += 1
            x += w
        z += h
    geo.box(
        "mortar-back",
        (x1 - x0, depth - 0.03, z1 - z0),
        ((x0 + x1) / 2, y_front + depth / 2 + 0.012, (z0 + z1) / 2),
        mat=M.mortar("mortar", (0.11, 0.1, 0.088)),
        bev=0.0,
    )


def hearth_slab(x0, x1, mat, depth=0.36):
    rnd = random.Random(4)
    x = x0
    k = 0
    while x < x1 - 0.05:
        w = min(rnd.uniform(0.28, 0.42), x1 - x)
        rough_stone(
            f"slab-{k}", (w - 0.012, depth, 0.05), (x + w / 2, Y0 - depth / 2, 0.02), mat, seed=20 + k, rough=0.004
        )
        x += w
        k += 1


@item("hearth-sooty", "hearth")
def hearth_sooty():
    cx = slots.HEARTH_X
    x0, x1 = cx - slots.HEARTH_W / 2, cx + slots.HEARTH_W / 2
    ox0, ox1, oz = cx - 0.41, cx + 0.41, 0.84
    soot_c = (cx, Y0, oz + 0.2)
    stone = M.stone_wall(
        "rubble-sooty",
        (0.32, 0.28, 0.23),
        (0.16, 0.145, 0.13),
        (0.2, 0.185, 0.16),
        course=2.0,
        joint=0.026,
        soot=0.95,
        soot_center=soot_c,
        soot_radius=0.8,
    )
    inner = M.stone_wall(
        "firebox-sooty",
        (0.06, 0.052, 0.046),
        (0.028, 0.024, 0.02),
        (0.02, 0.018, 0.016),
        scale=6.0,
        soot=1.0,
        soot_center=soot_c,
        soot_radius=1.2,
    )
    masonry_breast(x0, x1, ox0, ox1, oz, stone, inner)
    charred = M.wood(
        "charred-oak",
        (0.014, 0.009, 0.006),
        (0.055, 0.034, 0.022),
        grain=26,
        rough=(0.6, 0.9),
        bump=0.6,
        checks=2.0,
        dirt=0.6,
    )
    lintel = geo.box(
        "lintel",
        (x1 - x0 + 0.04, 0.26, 0.19),
        ((x0 + x1) / 2, Y0 + 0.1, oz + 0.095),
        mat=charred,
        bev=0.015,
        segments=3,
    )
    sub = lintel.modifiers.new("Sub", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = 4
    lintel.modifiers.move(len(lintel.modifiers) - 1, 0)
    geo.displace(lintel, strength=0.01, size=0.25)
    flag = M.stone_wall(
        "flagstone",
        (0.13, 0.12, 0.11),
        (0.075, 0.07, 0.065),
        (0.04, 0.036, 0.032),
        scale=3.2,
        course=1.0,
        depth=0.012,
        joint=0.02,
        soot=0.7,
        soot_center=(cx, Y0, 0.0),
        soot_radius=0.7,
    )
    face("hearthstone", (cx, Y0 - 0.2, 0.012), (x1 - x0 + 0.14, 0.4), "+Z", flag, density=90)
    face("firebox-floor", (cx, (Y0 + 6.95) / 2, 0.012), (ox1 - ox0, 6.95 - Y0), "+Z", flag, density=60)
    common.fire(slots.FIRE, size=0.85, logs=3, flames=7, seed=2)
    iron = common.iron()
    geo.tube(
        "poker",
        [
            Vector((x1 + 0.06, Y0 - 0.1, 0.02)),
            Vector((x1 + 0.02, Y0 - 0.08, 0.45)),
            Vector((x1 - 0.01, Y0 - 0.07, 0.72)),
        ],
        0.008,
        mat=iron,
    )
    for hx in (cx - 0.3, cx + 0.3):
        geo.tube(
            "hook",
            [
                Vector((hx, Y0 + 0.0, oz + 0.12)),
                Vector((hx, Y0 - 0.05, oz + 0.1)),
                Vector((hx, Y0 - 0.06, oz + 0.05)),
                Vector((hx, Y0 - 0.03, oz + 0.03)),
            ],
            0.005,
            mat=iron,
        )


def mantel_candlestick(base: Vector, height=0.2, mat=None, seed=0):
    mat = mat or common.brass()
    prof = [
        (0.0, 0.0),
        (0.045, 0.0),
        (0.045, 0.008),
        (0.02, 0.02),
        (0.012, 0.05),
        (0.018, 0.07),
        (0.01, 0.09),
        (0.01, height - 0.03),
        (0.022, height - 0.02),
        (0.024, height - 0.012),
        (0.012, height - 0.008),
        (0.0, height - 0.008),
    ]
    geo.lathe("candlestick", prof, base, segments=32, mat=mat)
    common.candle(base + Vector((0, 0, height - 0.01)), height=0.1, radius=0.011, seed=seed)


@item("hearth-stone", "hearth")
def hearth_stone():
    cx = slots.HEARTH_X
    x0, x1 = cx - slots.HEARTH_W / 2, cx + slots.HEARTH_W / 2
    ox0, ox1, oz = cx - 0.42, cx + 0.42, 0.86
    soot_c = (cx, Y0, oz + 0.1)
    sand = M.ashlar(
        "sandstone",
        (0.3, 0.23, 0.16),
        (0.17, 0.13, 0.09),
        (0.12, 0.1, 0.08),
        soot=0.8,
        soot_center=soot_c,
        soot_radius=0.6,
        depth=0.02,
    )
    inner = M.stone_wall(
        "firebox-dark",
        (0.07, 0.06, 0.05),
        (0.03, 0.026, 0.022),
        (0.02, 0.018, 0.016),
        scale=6.0,
        soot=1.0,
        soot_center=soot_c,
        soot_radius=1.2,
    )
    masonry_breast(x0, x1, ox0, ox1, oz, sand, inner)
    # Stone lintel, mantel shelf and corbels.
    lint = M.ashlar(
        "sandstone-lintel",
        (0.44, 0.36, 0.26),
        (0.36, 0.29, 0.2),
        (0.3, 0.25, 0.19),
        block=(2.0, 0.5),
        soot=0.7,
        soot_center=soot_c,
        soot_radius=0.5,
    )
    geo.box("lintel", (ox1 - ox0 + 0.34, 0.08, 0.24), (cx, Y0 - 0.035, oz + 0.12), mat=lint, bev=0.008)
    shelf = geo.box("mantel", (x1 - x0 + 0.12, 0.26, 0.07), (cx, Y0 - 0.11, oz + 0.3), mat=lint, bev=0.01, segments=3)
    for sx in (-1, 1):
        geo.box(
            "corbel",
            (0.1, 0.16, 0.14),
            (cx + sx * (ox1 - ox0) / 2 + sx * 0.08, Y0 - 0.07, oz + 0.2),
            mat=lint,
            bev=0.012,
        )
    flag = M.stone_wall(
        "flagstone-light",
        (0.24, 0.21, 0.17),
        (0.15, 0.13, 0.11),
        (0.08, 0.07, 0.06),
        scale=2.8,
        course=1.0,
        depth=0.01,
        joint=0.018,
        soot=0.4,
        soot_center=(cx, Y0, 0.0),
        soot_radius=0.5,
    )
    face("hearthstone", (cx, Y0 - 0.2, 0.012), (x1 - x0 + 0.14, 0.4), "+Z", flag, density=90)
    face("firebox-floor", (cx, (Y0 + 6.95) / 2, 0.012), (ox1 - ox0, 6.95 - Y0), "+Z", flag, density=60)
    common.fire(slots.FIRE, size=0.95, seed=5)
    iron = common.iron()
    # Fire irons on a stand.
    stand = Vector((x1 + 0.12, Y0 - 0.14, 0.0))
    geo.cylinder("irons-base", 0.06, 0.02, stand + Vector((0, 0, 0.01)), mat=iron, verts=20)
    geo.tube("irons-post", [stand, stand + Vector((0, 0, 0.62))], 0.007, mat=iron, kind="POLY")
    for k, dx in enumerate((-0.03, 0.0, 0.03)):
        geo.tube(
            f"iron-{k}",
            [stand + Vector((dx, 0.02, 0.05)), stand + Vector((dx * 1.5, 0.025, 0.6))],
            0.005,
            mat=iron,
            kind="POLY",
        )
    brass = common.brass()
    shelf_top = oz + 0.3 + 0.035
    mantel_candlestick(Vector((x0 + 0.12, Y0 - 0.1, shelf_top)), seed=3)
    geo.lathe(
        "jug",
        [(0.0, 0.0), (0.05, 0.0), (0.065, 0.05), (0.06, 0.11), (0.035, 0.15), (0.04, 0.17), (0.0, 0.17)],
        Vector((cx + 0.2, Y0 - 0.1, shelf_top)),
        segments=32,
        mat=M.matte("jug-glaze", (0.24, 0.16, 0.09), rough=0.3),
    )
    _ = shelf, brass


@item("hearth-grand", "hearth")
def hearth_grand():
    cx = slots.HEARTH_X + 0.02
    w = slots.HEARTH_W + 0.2
    x0, x1 = cx - w / 2, cx + w / 2
    ox0, ox1, oz = cx - 0.55, cx + 0.55, 1.0
    soot_c = (cx, Y0, oz + 0.1)
    stone = M.stone_wall(
        "rubble-grand",
        (0.36, 0.32, 0.26),
        (0.2, 0.18, 0.15),
        (0.22, 0.2, 0.17),
        course=2.0,
        joint=0.024,
        soot=0.7,
        soot_center=soot_c,
        soot_radius=0.7,
    )
    inner = M.stone_wall(
        "firebox-grand",
        (0.07, 0.06, 0.05),
        (0.03, 0.026, 0.022),
        (0.02, 0.018, 0.016),
        scale=5.0,
        soot=1.0,
        soot_center=soot_c,
        soot_radius=1.4,
    )
    masonry_breast(x0, x1, ox0, ox1, oz, stone, inner)
    oak = M.wood(
        "mantel-oak",
        (0.035, 0.02, 0.012),
        (0.1, 0.06, 0.034),
        grain=30,
        rough=(0.4, 0.7),
        bump=0.4,
        varnish=0.25,
        dirt=0.5,
        checks=0.6,
    )
    beam = geo.box("bressummer", (x1 - x0 + 0.1, 0.3, 0.26), (cx, Y0 + 0.08, oz + 0.13), mat=oak, bev=0.02, segments=3)
    geo.box("mantel-shelf", (x1 - x0 + 0.2, 0.3, 0.05), (cx, Y0 - 0.1, oz + 0.285), mat=oak, bev=0.008)
    # Carved rosettes along the beam.
    for k in range(5):
        x = cx + (k - 2) * 0.26
        geo.lathe(
            "rosette",
            [(0.0, 0.02), (0.03, 0.018), (0.045, 0.01), (0.05, 0.0)],
            Vector((x, Y0 - 0.071, oz + 0.13)),
            rot=(math.pi / 2, 0, 0),
            segments=16,
            mat=oak,
        )
    common.fire(slots.FIRE + Vector((0.02, 0.0, 0.02)), size=1.2, logs=4, seed=8)
    iron = common.iron()
    for sx in (-1, 1):
        base = Vector((cx + sx * 0.33, Y0 + 0.14, 0.0))
        geo.tube(
            "firedog-leg",
            [
                base + Vector((0, -0.12, 0)),
                base + Vector((0, -0.08, 0.08)),
                base + Vector((0, 0.0, 0.1)),
                base + Vector((0, 0.28, 0.1)),
            ],
            0.012,
            mat=iron,
        )
        geo.tube(
            "firedog-post",
            [base + Vector((0, -0.08, 0.08)), base + Vector((0, -0.1, 0.34))],
            0.016,
            mat=iron,
            kind="POLY",
        )
        geo.lathe(
            "firedog-knob",
            [(0.0, 0.0), (0.03, 0.01), (0.034, 0.035), (0.02, 0.06), (0.0, 0.065)],
            base + Vector((0, -0.1, 0.33)),
            segments=20,
            mat=common.brass(),
        )
    # A crane with a cauldron over the fire.
    pivot = Vector((ox0 + 0.05, Y0 + 0.2, 0.0))
    geo.tube("crane-post", [pivot, pivot + Vector((0, 0, 0.92))], 0.013, mat=iron, kind="POLY")
    tip = Vector((slots.FIRE.x + 0.05, Y0 + 0.16, 0.86))
    geo.tube("crane-arm", [pivot + Vector((0, 0, 0.86)), tip], 0.012, mat=iron, kind="POLY")
    geo.tube(
        "crane-brace",
        [pivot + Vector((0, 0, 0.5)), pivot + (tip - pivot) * 0.5 + Vector((0, 0, 0.43))],
        0.008,
        mat=iron,
        kind="POLY",
    )
    pot_top = 0.62
    common.chain(tip, Vector((tip.x, tip.y, pot_top + 0.02)), link=0.025, thickness=0.004, mat=iron)
    pot = geo.lathe(
        "cauldron",
        [
            (0.0, pot_top - 0.2),
            (0.09, pot_top - 0.19),
            (0.15, pot_top - 0.12),
            (0.155, pot_top - 0.05),
            (0.13, pot_top),
            (0.14, pot_top + 0.01),
            (0.12, pot_top + 0.005),
            (0.11, pot_top - 0.03),
            (0.0, pot_top - 0.03),
        ],
        Vector((tip.x, tip.y, 0.0)),
        segments=40,
        mat=iron,
    )
    stew = geo.lathe(
        "stew",
        [(0.0, pot_top - 0.035), (0.112, pot_top - 0.035)],
        Vector((tip.x, tip.y, 0.0)),
        segments=32,
        mat=M.matte("stew", (0.22, 0.11, 0.04), rough=0.25, sss=0.2),
    )
    geo.tube(
        "bail",
        [
            Vector((tip.x - 0.13, tip.y, pot_top)),
            Vector((tip.x, tip.y, pot_top + 0.14)),
            Vector((tip.x + 0.13, tip.y, pot_top)),
        ],
        0.005,
        mat=iron,
    )
    shelf_top = oz + 0.31
    mantel_candlestick(Vector((x0 + 0.1, Y0 - 0.1, shelf_top)), height=0.24, seed=6)
    mantel_candlestick(Vector((x1 - 0.1, Y0 - 0.1, shelf_top)), height=0.24, seed=7)
    pew = common.pewter()
    for x in (cx - 0.22, cx + 0.05):
        geo.cylinder(
            "plate",
            0.13,
            0.012,
            Vector((x, Y0 - 0.02, shelf_top + 0.13)),
            rot=(math.radians(80), 0, 0),
            mat=pew,
            verts=40,
        )
    _ = beam, pot, stew


@item("hearth-dragon", "hearth")
def hearth_dragon():
    cx = slots.HEARTH_X
    x0, x1 = cx - slots.HEARTH_W / 2 - 0.05, cx + slots.HEARTH_W / 2 + 0.05
    ox0, ox1, oz = cx - 0.44, cx + 0.44, 0.9
    soot_c = (cx, Y0, oz)
    basalt = M.ashlar(
        "basalt",
        (0.08, 0.075, 0.078),
        (0.03, 0.029, 0.031),
        (0.012, 0.012, 0.013),
        block=(0.36, 0.18),
        soot=0.4,
        soot_center=soot_c,
        soot_radius=0.6,
        depth=0.02,
    )
    inner = M.stone_wall("firebox-basalt", (0.05, 0.045, 0.04), (0.02, 0.018, 0.016), (0.01, 0.01, 0.01), scale=6.0)
    masonry_breast(x0, x1, ox0, ox1, oz, basalt, inner)
    lint = M.ashlar("basalt-lintel", (0.08, 0.075, 0.08), (0.05, 0.048, 0.05), (0.03, 0.03, 0.03), block=(3.0, 0.5))
    geo.box("lintel", (ox1 - ox0 + 0.4, 0.1, 0.26), (cx, Y0 - 0.045, oz + 0.13), mat=lint, bev=0.01)
    # Glowing runes cut into the lintel.
    rune_mat = M.glow("rune", (1.0, 0.35, 0.06), 6.0)
    import random as _r

    rnd = _r.Random(12)
    for k in range(9):
        x = cx - 0.44 + k * 0.11
        pts = [
            Vector((x + rnd.uniform(-0.02, 0.02), Y0 - 0.098, oz + 0.13 + rnd.uniform(-0.06, 0.06))) for _ in range(3)
        ]
        common.no_room_light(geo.tube(f"rune-{k}", pts, 0.004, mat=rune_mat, kind="POLY", resolution=2))
    # A dragon's head keystone above the opening.
    scale_mat = M.stone_wall(
        "dragon-carving",
        (0.09, 0.085, 0.09),
        (0.05, 0.048, 0.05),
        (0.02, 0.02, 0.02),
        scale=40.0,
        course=1.0,
        depth=0.004,
        joint=0.05,
    )
    head_c = Vector((cx, Y0 - 0.12, oz + 0.42))
    snout = geo.lathe(
        "dragon-snout",
        [(0.0, 0.0), (0.05, 0.02), (0.075, 0.1), (0.085, 0.2), (0.07, 0.26), (0.0, 0.27)],
        head_c + Vector((0, 0.14, -0.02)),
        rot=(math.pi / 2, 0, 0),
        segments=24,
        mat=scale_mat,
    )
    snout.scale = (1.25, 1.0, 0.75)
    for sx in (-1, 1):
        geo.lathe(
            "horn",
            [(0.0, 0.0), (0.025, 0.0), (0.018, 0.08), (0.008, 0.16), (0.0, 0.2)],
            head_c + Vector((sx * 0.07, 0.12, 0.05)),
            rot=(math.radians(-60), sx * math.radians(25), 0),
            segments=12,
            mat=scale_mat,
        )
        eye = geo.lathe(
            "dragon-eye",
            [(0.0, 0.0), (0.014, 0.0), (0.012, 0.008), (0.0, 0.01)],
            head_c + Vector((sx * 0.055, -0.035, 0.035)),
            rot=(math.pi / 2, 0, 0),
            segments=12,
            mat=M.glow("dragon-eye", (1.0, 0.55, 0.1), 12.0),
        )
        common.no_room_light(eye)
    common.fire(slots.FIRE, size=1.05, seed=11)
    # Stray sparks drifting up out of the fire.
    spark = M.glow("spark", (1.0, 0.6, 0.2), 20.0)
    for _ in range(14):
        p = slots.FIRE + Vector((rnd.uniform(-0.25, 0.25), rnd.uniform(-0.25, -0.05), rnd.uniform(0.25, 0.7)))
        common.no_room_light(geo.lathe("spark", [(0.0, -0.003), (0.0025, 0.0), (0.0, 0.003)], p, segments=6, mat=spark))
    flag = M.stone_wall(
        "flagstone-dark",
        (0.07, 0.066, 0.064),
        (0.04, 0.038, 0.037),
        (0.02, 0.019, 0.018),
        scale=3.0,
        course=1.0,
        depth=0.01,
        joint=0.018,
    )
    face("hearthstone", (cx, Y0 - 0.2, 0.012), (x1 - x0 + 0.14, 0.4), "+Z", flag, density=90)
    face("firebox-floor", (cx, (Y0 + 6.95) / 2, 0.012), (ox1 - ox0, 6.95 - Y0), "+Z", flag, density=60)
