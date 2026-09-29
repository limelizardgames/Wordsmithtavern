"""Left wall slot: hung on the chimney breast above the mantel, centred on slots.WALL_LEFT."""

from __future__ import annotations

import math
import random

from mathutils import Vector

from .. import geo, slots, textures
from .. import materials as M
from . import common, item
from .lights import antler, bone_mat, torus

C = slots.WALL_LEFT
FACE = (math.pi / 2, 0, 0)  # local +Z towards the camera


def nail(p: Vector):
    geo.cylinder("nail", 0.006, 0.02, p + Vector((0, -0.01, 0)), rot=FACE, mat=common.iron(), verts=10)


def aged_wood():
    return M.wood(
        "aged-board",
        (0.05, 0.03, 0.018),
        (0.14, 0.09, 0.05),
        grain=50,
        rough=(0.55, 0.85),
        bump=0.45,
        dirt=0.6,
        knots=0.5,
        checks=0.8,
        tint=0.2,
    )


@item("wall-shield", "wallLeft")
def rusty_shield():
    c = C + Vector((0, -0.03, 0.02))
    r = 0.3
    n = M.N("shield-face")
    co = n.coord("Object")
    cx, cy, cz = n.xyz(co)
    planks = n.wave(co, scale=16.0, kind="BANDS", direction="X", profile="SAW")
    joint = n.maprange(planks, 0.0, 0.04, 1.0, 0.0)
    wood_n = n.noise(n.vmath("MULTIPLY", co, (6.0, 1.0, 1.0)), scale=40.0, detail=6.0).outputs["Fac"]
    wood_col = n.ramp(wood_n, [(0.3, (0.07, 0.045, 0.025)), (0.7, (0.16, 0.1, 0.055))])
    # Faded quartered paint, chipped.
    quarter = n.math("GREATER_THAN", n.math("MULTIPLY", cx, cy), 0.0)
    paint = n.mix(quarter, (0.32, 0.05, 0.035), (0.55, 0.47, 0.32))
    chips = n.noise(co, scale=18.0, detail=8.0, rough=0.7).outputs["Fac"]
    painted = n.maprange(chips, 0.44, 0.5, 0.0, 1.0)
    col = n.mix(painted, wood_col, paint)
    col = n.mix(joint, col, (0.01, 0.007, 0.005))
    dents = n.voronoi(co, scale=9.0).outputs["Distance"]
    scratches = n.wave(
        n.vmath("MULTIPLY", co, (1.0, 1.0, 1.0)),
        scale=45.0,
        kind="BANDS",
        direction="DIAGONAL",
        distortion=8.0,
        detail=2.0,
    )
    scratch = n.maprange(scratches, 0.0, 0.03, 1.0, 0.0)
    col = n.mix(n.math("MULTIPLY", scratch, 0.6), col, (0.2, 0.14, 0.09))
    occ = n.ao(0.05)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.7, 0.0), col, (0.01, 0.008, 0.006))
    height = n.math(
        "SUBTRACT",
        n.math("ADD", n.math("MULTIPLY", dents, 0.5), n.math("MULTIPLY", painted, 0.15)),
        n.math("ADD", joint, n.math("MULTIPLY", scratch, 0.4)),
    )
    face_mat = n.finish(
        n.principled(
            base=col,
            rough=n.maprange(painted, 0.0, 1.0, 0.85, 0.6),
            normal=n.bump(height, strength=0.5, distance=0.004),
        )
    )
    geo.lathe(
        "shield",
        [(0.0, 0.035), (r * 0.5, 0.028), (r * 0.95, 0.012), (r, 0.0), (0.0, 0.0)],
        c,
        rot=FACE,
        segments=72,
        mat=face_mat,
    )
    rusty = M.metal("rusty-iron", (0.05, 0.046, 0.042), rough=(0.5, 0.8), rust=0.8, scale=18)
    torus("shield-rim", c + Vector((0, -0.004, 0)), r, 0.012, rusty, rot=FACE, segs=72, rings=8)
    geo.lathe(
        "boss",
        [(0.0, 0.1), (0.035, 0.095), (0.07, 0.07), (0.085, 0.04), (0.1, 0.035), (0.1, 0.03), (0.0, 0.03)],
        c,
        rot=FACE,
        segments=48,
        mat=rusty,
    )
    for k in range(10):
        a = 2 * math.pi * k / 10
        geo.lathe(
            "rivet",
            [(0.0, 0.01), (0.008, 0.005), (0.009, 0.0)],
            c + Vector((math.cos(a) * 0.12, -0.03, math.sin(a) * 0.12)),
            rot=FACE,
            segments=10,
            mat=rusty,
        )
    nail(c + Vector((0, 0.03, r + 0.02)))


@item("notice-board", "wallLeft")
def notice_board():
    c = C + Vector((0, 0, 0.02))
    w, h = 0.92, 0.66
    frame_wood = M.wood(
        "board-frame", (0.04, 0.025, 0.014), (0.11, 0.07, 0.04), grain=40, rough=(0.5, 0.8), dirt=0.6, checks=0.6
    )
    cork = M.matte("cork", (0.36, 0.25, 0.15), rough=0.95, bump=0.9, bump_scale=900)
    geo.box("cork", (w - 0.08, 0.02, h - 0.08), c + Vector((0, 0.0, 0)), mat=cork, bev=0.0)
    geo.moulding(
        "board-frame",
        w,
        h,
        [(0.0, 0.0), (0.0, 0.05), (0.01, 0.055), (0.05, 0.05), (0.055, 0.03), (0.055, 0.0)],
        c + Vector((0, -0.01, 0)),
        mat=frame_wood,
    )
    rnd = random.Random(3)
    notes = [
        ("note-lost-cat", (-0.3, 0.1), 0.2, 4),
        ("note-wanted", (-0.05, 0.06), 0.22, -3),
        ("note-quest", (0.26, 0.12), 0.2, 6),
        ("note-map", (0.2, -0.17), 0.24, -8),
        ("note-goose", (-0.28, -0.18), 0.18, 10),
    ]
    iron = common.iron()
    for k, (tex, (dx, dz), width, ang) in enumerate(notes):
        img = textures.image(tex)
        aspect = img.size[1] / img.size[0]
        hh = width * aspect
        p = c + Vector((dx, -0.013 - k * 0.0015, dz))
        note = geo.grid(
            f"note-{k}", width, hh, 12, 12, p, rot=(math.pi / 2, math.radians(ang), 0), mat=M.paper(f"paper-{tex}", img)
        )
        geo.displace(note, strength=0.008, size=0.1)
        pin = p + Vector((math.sin(math.radians(ang)) * hh * 0.42, -0.012, math.cos(math.radians(ang)) * hh * 0.42))
        geo.lathe(
            "pin",
            [(0.0, 0.012), (0.008, 0.008), (0.009, 0.0), (0.0, 0.0)],
            pin,
            rot=FACE,
            segments=16,
            mat=M.matte(f"pin-{k}", rnd.choice([(0.5, 0.05, 0.03), (0.1, 0.2, 0.5), (0.7, 0.6, 0.1)]), rough=0.3),
        )
    # A dagger stuck through a notice: adventurers.
    d0 = c + Vector((0.36, -0.02, -0.22))
    geo.box(
        "dagger-blade",
        (0.16, 0.004, 0.022),
        d0 + Vector((-0.02, 0.02, 0.05)),
        rot=(0, math.radians(-68), 0),
        mat=M.metal("steel", (0.6, 0.6, 0.6), rough=(0.2, 0.4)),
        bev=0.001,
    )
    geo.cylinder(
        "dagger-grip",
        0.009,
        0.08,
        d0 + Vector((0.035, -0.07, -0.08)),
        rot=(math.radians(-30), math.radians(22), 0),
        mat=M.matte("grip-leather", (0.08, 0.04, 0.02), rough=0.7, bump=0.4),
        verts=12,
    )
    nail(c + Vector((0, 0.02, h / 2 + 0.03)))
    _ = iron


@item("mounted-antlers", "wallLeft")
def jackalope_antlers():
    c = C + Vector((0, -0.02, 0.0))
    plaque_wood = M.wood(
        "plaque-walnut", (0.03, 0.017, 0.01), (0.09, 0.05, 0.028), grain=70, rough=(0.3, 0.5), varnish=0.6, dirt=0.3
    )
    shape = lambda a: 0.15 * (1.0 + 0.12 * math.cos(2 * a)) * (1.0 - 0.18 * max(0.0, -math.sin(a)))
    geo.disc("plaque", shape, c + Vector((0, 0.02, 0)), rot=FACE, thickness=0.03, mat=plaque_wood, segments=64)
    geo.disc(
        "plaque-back",
        lambda a: 0.17 * (1.0 + 0.12 * math.cos(2 * a)) * (1.0 - 0.18 * max(0.0, -math.sin(a))),
        c + Vector((0, 0.035, 0)),
        rot=FACE,
        thickness=0.015,
        mat=plaque_wood,
        segments=64,
    )
    bone = bone_mat()
    base = c + Vector((0, -0.04, 0.03))
    for sx in (-1, 1):
        pts = [
            base + Vector((sx * 0.02, 0, 0)),
            base + Vector((sx * 0.08, -0.02, 0.07)),
            base + Vector((sx * 0.14, -0.03, 0.16)),
            base + Vector((sx * 0.13, -0.03, 0.26)),
        ]
        geo.tube("jack-antler", pts, 0.012, mat=bone, radii=[1.0, 0.8, 0.6, 0.3])
        for t, (ox, oz) in ((0.35, (0.06, 0.08)), (0.6, (0.07, 0.07)), (0.8, (-0.05, 0.08))):
            root = pts[1].lerp(pts[2], t) if t < 0.7 else pts[2].lerp(pts[3], (t - 0.7) / 0.3)
            tip = root + Vector((sx * ox, -0.01, oz))
            geo.tube(
                "jack-tine",
                [root, (root + tip) / 2 + Vector((0, 0, 0.01)), tip],
                0.008,
                mat=bone,
                radii=[1.0, 0.6, 0.25],
            )
    brass = common.brass()
    geo.box("nameplate", (0.1, 0.004, 0.025), c + Vector((0, -0.012, -0.1)), mat=brass, bev=0.002)
    _ = antler


@item("legendary-tankard", "wallLeft")
def unbreakable_tankard():
    c = C + Vector((0, 0, -0.12))
    wood = aged_wood()
    shelf_y = slots.BREAST_FRONT - 0.13
    geo.box("shelf", (0.46, 0.24, 0.035), Vector((c.x, shelf_y, c.z)), mat=wood, bev=0.006)
    for sx in (-1, 1):
        geo.box(
            "bracket",
            (0.2, 0.03, 0.14),
            Vector((c.x + sx * 0.17, shelf_y + 0.02, c.z - 0.085)),
            rot=(0, 0, math.pi / 2),
            mat=wood,
            bev=0.005,
        )
    steel = M.metal("dwarf-steel", (0.34, 0.33, 0.31), rough=(0.25, 0.5), tarnish=(0.06, 0.055, 0.05), scale=60)
    gold = common.brass()
    base = Vector((c.x, shelf_y - 0.01, c.z + 0.0175))
    r, h = 0.075, 0.24
    prof = [
        (0.0, 0.0),
        (r * 1.18, 0.0),
        (r * 1.2, 0.02),
        (r * 1.05, 0.035),
        (r, 0.05),
        (r * 0.98, h * 0.9),
        (r * 1.08, h),
        (r * 0.9, h),
        (r * 0.86, 0.04),
        (0.0, 0.04),
    ]
    geo.lathe("big-tankard", prof, base, segments=48, mat=steel)
    for z in (0.07, 0.15):
        geo.lathe("band", [(r * 1.03, z - 0.012), (r * 1.06, z), (r * 1.03, z + 0.012)], base, segments=48, mat=gold)
    geo.tube(
        "big-handle",
        [
            base + Vector((r, 0, h * 0.85)),
            base + Vector((r + 0.07, 0, h * 0.82)),
            base + Vector((r + 0.075, 0, h * 0.35)),
            base + Vector((r, 0, h * 0.22)),
        ],
        0.014,
        mat=steel,
    )
    lid = geo.lathe(
        "lid",
        [(0.0, 0.035), (r * 0.6, 0.03), (r * 1.1, 0.01), (r * 1.12, 0.0), (0.0, 0.0)],
        base + Vector((0, 0, h)),
        segments=48,
        mat=steel,
    )
    lid.rotation_euler = (0, math.radians(-10), 0)
    geo.lathe(
        "gem",
        [(0.0, 0.0), (0.012, 0.004), (0.0, 0.01)],
        base + Vector((0, -r - 0.003, h * 0.5)),
        rot=FACE,
        segments=12,
        mat=M.glass("ruby", (0.8, 0.05, 0.05), rough=0.02),
    )
    geo.box("plaque", (0.14, 0.004, 0.028), Vector((c.x, shelf_y - 0.122, c.z - 0.0)), mat=gold, bev=0.002)


@item("ships-wheel", "wallLeft")
def ships_wheel():
    c = C + Vector((0, -0.05, 0.02))
    teak = M.wood(
        "teak", (0.07, 0.035, 0.015), (0.2, 0.11, 0.05), grain=50, rough=(0.3, 0.55), varnish=0.45, dirt=0.4, checks=0.4
    )
    brass = common.brass()
    R = 0.24
    torus("rim", c, R, 0.022, teak, rot=FACE, segs=72, rings=12)
    torus("inner-ring", c, R * 0.45, 0.012, teak, rot=FACE, segs=48, rings=10)
    geo.lathe(
        "hub",
        [(0.0, 0.05), (0.05, 0.045), (0.06, 0.02), (0.06, -0.02), (0.0, -0.025)],
        c,
        rot=FACE,
        segments=36,
        mat=teak,
    )
    geo.lathe("hub-cap", [(0.0, 0.065), (0.03, 0.058), (0.035, 0.05), (0.0, 0.05)], c, rot=FACE, segments=24, mat=brass)
    for k in range(8):
        a = 2 * math.pi * k / 8 + 0.2
        d = Vector((math.cos(a), 0, math.sin(a)))
        geo.tube("spoke", [c + d * 0.05, c + d * R], 0.013, mat=teak, kind="POLY")
        prof = [(0.0, 0.0), (0.016, 0.01), (0.022, 0.04), (0.016, 0.08), (0.022, 0.1), (0.012, 0.13), (0.0, 0.135)]
        handle = geo.lathe("handle", prof, c + d * (R + 0.01), segments=16, mat=teak)
        handle.rotation_euler = (0, math.pi / 2 - a, 0)
    nail(c + Vector((0, 0.05, R + 0.04)))
