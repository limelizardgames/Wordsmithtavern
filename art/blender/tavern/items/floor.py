"""Seating slot: on the floor in front of the right bay, around slots.FLOOR_RIGHT."""

from __future__ import annotations

import math
import random

import bpy
from mathutils import Matrix, Vector

from .. import core, geo, lighting, slots
from .. import materials as M
from . import common, item

C = slots.FLOOR_RIGHT


def rustic():
    return M.wood(
        "rustic-pine",
        (0.07, 0.045, 0.026),
        (0.2, 0.13, 0.075),
        grain=38,
        rough=(0.55, 0.85),
        bump=0.45,
        dirt=0.65,
        knots=0.8,
        checks=1.0,
        tint=0.18,
    )


def place(ob, origin: Vector, yaw: float):
    """Rotate an object built around `origin` by `yaw` about the vertical axis."""
    rel = ob.location - origin
    ob.location = origin + Matrix.Rotation(yaw, 3, "Z") @ rel
    ob.rotation_euler.z += yaw
    return ob


def tankard(base: Vector, r=0.042, h=0.12, mat=None, foam=False):
    mat = mat or common.pewter()
    prof = [
        (0.0, 0.0),
        (r * 1.05, 0.0),
        (r * 1.08, 0.006),
        (r, 0.02),
        (r * 0.96, h * 0.85),
        (r * 1.0, h),
        (r * 0.92, h),
        (r * 0.88, h * 0.9),
        (r * 0.9, 0.012),
        (0.0, 0.012),
    ]
    body = geo.lathe("tankard", prof, base, segments=40, mat=mat)
    geo.tube(
        "handle",
        [
            base + Vector((r * 0.95, 0, h * 0.82)),
            base + Vector((r * 1.9, 0, h * 0.75)),
            base + Vector((r * 1.9, 0, h * 0.3)),
            base + Vector((r * 0.95, 0, h * 0.22)),
        ],
        0.007,
        mat=mat,
    )
    return body


def stool(pos: Vector, height=0.46, seat_r=0.17, wood=None, yaw=0.0, seed=0):
    wood = wood or rustic()
    seat = geo.cylinder(
        "stool-seat", seat_r, 0.045, pos + Vector((0, 0, height - 0.022)), verts=40, mat=wood, bev=0.008
    )
    for k in range(3):
        a = yaw + 2 * math.pi * k / 3
        top = pos + Vector((math.cos(a) * seat_r * 0.55, math.sin(a) * seat_r * 0.55, height - 0.04))
        foot = pos + Vector((math.cos(a) * seat_r * 0.95, math.sin(a) * seat_r * 0.95, 0.0))
        geo.tube("stool-leg", [foot, (foot + top) / 2, top], 0.018, mat=wood, kind="POLY", resolution=4)
    return seat


def table(center: Vector, w, d, h, wood, top_t=0.045, yaw=0.0, legs_short=None, planks=3):
    parts = []
    step = d / planks
    for i in range(planks):
        parts.append(
            geo.box(
                "table-plank",
                (w, step - 0.006, top_t),
                center + Vector((0, -d / 2 + step * (i + 0.5), h - top_t / 2)),
                mat=wood,
                bev=0.006,
            )
        )
    geo.box(
        "apron-f", (w - 0.16, 0.03, 0.09), center + Vector((0, -d / 2 + 0.07, h - top_t - 0.045)), mat=wood, bev=0.004
    )
    for sx in (-1, 1):
        for sy in (-1, 1):
            short = 0.025 if legs_short == (sx, sy) else 0.0
            lx, ly = sx * (w / 2 - 0.07), sy * (d / 2 - 0.07)
            leg_h = h - top_t - short
            leg = geo.box(
                "table-leg",
                (leg_h, 0.055, 0.055),
                center + Vector((lx, ly, short + leg_h / 2)),
                rot=(0, math.pi / 2, 0),
                mat=wood,
                bev=0.006,
            )
            parts.append(leg)
    return parts


@item("table-wobbly", "floorRight")
def table_wobbly():
    wood = rustic()
    yaw = math.radians(-6)
    before = set()
    c = C + Vector((0.05, 0.05, 0))
    table(c, 0.95, 0.62, 0.74, wood, legs_short=(1, -1))
    # The folded wedge under the short leg.
    wedge = geo.box(
        "wedge",
        (0.07, 0.05, 0.02),
        c + Vector((0.95 / 2 - 0.07, -0.62 / 2 + 0.07, 0.012)),
        mat=M.matte("paper", (0.62, 0.56, 0.44), rough=0.8, bump=0.3),
        bev=0.003,
    )
    wedge.rotation_euler = (0.1, -0.12, 0.4)
    stool(c + Vector((-0.62, -0.18, 0)), wood=wood, seed=1)
    stool(c + Vector((0.66, 0.05, 0)), height=0.44, wood=wood, yaw=0.5, seed=2)
    tankard(c + Vector((-0.2, -0.08, 0.74)))
    mug = tankard(
        c + Vector((0.22, 0.1, 0.74)), r=0.037, h=0.1, mat=M.matte("stoneware", (0.35, 0.26, 0.18), rough=0.35)
    )
    holder = geo.lathe(
        "dish",
        [(0.0, 0.0), (0.05, 0.0), (0.055, 0.012), (0.05, 0.014), (0.0, 0.006)],
        c + Vector((0.05, 0.12, 0.74)),
        segments=32,
        mat=common.pewter(),
    )
    common.candle(c + Vector((0.05, 0.12, 0.748)), height=0.06, radius=0.019, seed=11)
    for ob in list(bpy.data.collections[core.current()].objects):
        place(ob, C, yaw)
    common.own_light(
        "table-candle",
        C + Matrix.Rotation(yaw, 3, "Z") @ (c - C + Vector((0.05, 0.12, 0.84))),
        0.6,
        lighting.WARM_LAMP,
        radius=0.01,
    )
    _ = before, mug, holder


def oak():
    return M.wood(
        "oak-table",
        (0.1, 0.06, 0.03),
        (0.28, 0.18, 0.09),
        grain=45,
        rough=(0.35, 0.6),
        bump=0.3,
        varnish=0.3,
        dirt=0.4,
        knots=0.3,
        tint=0.1,
    )


def turned_leg(base: Vector, h: float, mat, r=0.035):
    prof = [
        (0.0, 0.0),
        (r * 0.8, 0.0),
        (r, 0.04),
        (r * 0.7, 0.1),
        (r * 1.1, h * 0.35),
        (r * 0.75, h * 0.55),
        (r * 1.05, h * 0.75),
        (r * 1.2, h - 0.12),
        (r * 1.2, h),
        (0.0, h),
    ]
    return geo.lathe("turned-leg", prof, base, segments=20, mat=mat)


def bench(center: Vector, length: float, mat, yaw=0.0):
    parts = [geo.box("bench-seat", (length, 0.28, 0.05), center + Vector((0, 0, 0.43)), mat=mat, bev=0.008)]
    for sx in (-1, 1):
        parts.append(
            geo.box(
                "bench-leg",
                (0.05, 0.24, 0.41),
                center + Vector((sx * (length / 2 - 0.1), 0, 0.205)),
                mat=mat,
                bev=0.006,
            )
        )
    geo.box("bench-stretcher", (length - 0.2, 0.04, 0.05), center + Vector((0, 0, 0.12)), mat=mat, bev=0.004)
    return parts


def bread(pos: Vector):
    crust = M.matte("crust", (0.36, 0.18, 0.06), rough=0.7, bump=0.6, bump_scale=80)
    loaf = geo.lathe(
        "loaf", [(0.0, 0.0), (0.07, 0.0), (0.085, 0.03), (0.07, 0.06), (0.0, 0.075)], pos, segments=32, mat=crust
    )
    loaf.scale = (1.4, 1.0, 1.0)
    return loaf


@item("table-oak", "floorRight")
def table_oak():
    wood = oak()
    c = C + Vector((0.02, 0.08, 0))
    w, d, h = 1.05, 0.66, 0.76
    geo.box("oak-top", (w, d, 0.07), c + Vector((0, 0, h - 0.035)), mat=wood, bev=0.012, segments=3)
    for sx in (-1, 1):
        for sy in (-1, 1):
            turned_leg(c + Vector((sx * (w / 2 - 0.08), sy * (d / 2 - 0.08), 0)), h - 0.07, wood)
    geo.box("apron", (w - 0.12, d - 0.12, 0.1), c + Vector((0, 0, h - 0.12)), mat=wood, bev=0.006)
    geo.box("stretcher", (w - 0.16, 0.05, 0.05), c + Vector((0, 0, 0.12)), mat=wood, bev=0.005)
    bench(c + Vector((0, -0.52, 0)), 0.95, wood)
    pew = common.pewter()
    tankard(c + Vector((-0.3, -0.12, h)))
    tankard(c + Vector((0.28, -0.05, h)), r=0.04, h=0.11)
    geo.lathe(
        "jug",
        [(0.0, 0.0), (0.06, 0.0), (0.075, 0.06), (0.068, 0.14), (0.04, 0.2), (0.046, 0.23), (0.0, 0.23)],
        c + Vector((0.05, 0.12, h)),
        segments=36,
        mat=pew,
    )
    geo.cylinder(
        "trencher",
        0.14,
        0.02,
        c + Vector((-0.1, 0.05, h + 0.01)),
        mat=M.wood("trencher", (0.15, 0.1, 0.06), (0.3, 0.2, 0.11), grain=120),
        verts=40,
        bev=0.004,
    )
    bread(c + Vector((-0.1, 0.05, h + 0.02)))
    bottle = geo.lathe(
        "candle-bottle",
        [(0.0, 0.0), (0.04, 0.0), (0.042, 0.12), (0.018, 0.17), (0.016, 0.21), (0.0, 0.21)],
        c + Vector((0.35, 0.15, h)),
        segments=32,
        mat=M.glass("green-bottle", (0.35, 0.55, 0.3), rough=0.05),
    )
    common.candle(c + Vector((0.35, 0.15, h + 0.205)), height=0.08, radius=0.014, seed=21)
    common.own_light("oak-candle", c + Vector((0.35, 0.1, h + 0.32)), 0.8, lighting.WARM_LAMP, radius=0.01)
    _ = bottle


def leather():
    n = M.N("oxblood-leather")
    co = n.coord("Object")
    crease = n.noise(co, scale=25.0, detail=8.0, rough=0.7, distortion=1.0).outputs["Fac"]
    wear = n.noise(co, scale=6.0, detail=4.0).outputs["Fac"]
    col = n.mix(n.maprange(wear, 0.5, 0.75, 0.0, 0.7), (0.12, 0.025, 0.02), (0.3, 0.14, 0.08))
    occ = n.ao(0.08)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.8, 0.0), col, (0.01, 0.004, 0.003))
    return n.finish(
        n.principled(
            base=col,
            rough=n.maprange(wear, 0.3, 0.8, 0.35, 0.65),
            coat=0.2,
            sheen=0.2,
            normal=n.bump(crease, strength=0.35, distance=0.003),
        )
    )


def cushion(name, size, loc, mat, rot=(0, 0, 0), soft=0.35):
    ob = geo.box(name, size, loc, rot=rot, mat=mat, bev=min(size) * soft, segments=4)
    sub = ob.modifiers.new("Soft", "SUBSURF")
    sub.levels = sub.render_levels = 2
    geo.displace(ob, strength=0.008, size=0.08)
    return ob


@item("armchair", "floorRight")
def squashy_armchair():
    lea = leather()
    c = C + Vector((0.1, 0.12, 0))
    yaw = math.radians(-18)
    base = cushion("chair-base", (0.78, 0.72, 0.3), c + Vector((0, 0, 0.3)), lea, soft=0.25)
    seat = cushion("chair-seat", (0.56, 0.58, 0.14), c + Vector((0, -0.05, 0.5)), lea, soft=0.45)
    back = cushion(
        "chair-back", (0.62, 0.2, 0.62), c + Vector((0, 0.27, 0.78)), lea, rot=(math.radians(-8), 0, 0), soft=0.3
    )
    for sx in (-1, 1):
        cushion("chair-arm", (0.13, 0.68, 0.28), c + Vector((sx * 0.34, -0.02, 0.55)), lea, soft=0.45)
        cushion(
            "chair-wing",
            (0.12, 0.26, 0.42),
            c + Vector((sx * 0.32, 0.2, 0.93)),
            lea,
            rot=(0, 0, sx * math.radians(12)),
            soft=0.4,
        )
    wood = M.wood("chair-feet", (0.03, 0.017, 0.01), (0.08, 0.045, 0.025), grain=80, varnish=0.4)
    for sx in (-1, 1):
        for sy in (-1, 1):
            geo.lathe(
                "chair-foot",
                [(0.0, 0.0), (0.025, 0.0), (0.03, 0.06), (0.04, 0.15), (0.0, 0.15)],
                c + Vector((sx * 0.33, sy * 0.3, 0)),
                segments=16,
                mat=wood,
            )
    brass = common.brass()
    for sx in (-1, 1):
        for k in range(9):
            geo.lathe(
                "stud",
                [(0.0, 0.006), (0.006, 0.003), (0.0065, 0.0)],
                c + Vector((sx * 0.41, -0.32 + k * 0.08, 0.52)),
                rot=(0, sx * math.pi / 2, 0),
                segments=10,
                mat=brass,
            )
    blanket = geo.grid(
        "blanket",
        0.5,
        0.7,
        20,
        28,
        c + Vector((0.2, -0.05, 0.72)),
        rot=(math.radians(20), math.radians(-60), 0),
        mat=M.fabric("tartan", (0.12, 0.25, 0.14), sheen=0.5, weave=300, pattern_dark=0.5),
    )
    geo.displace(blanket, strength=0.04, size=0.12)
    geo.box(
        "book",
        (0.16, 0.22, 0.035),
        c + Vector((-0.34, -0.12, 0.7)),
        rot=(0, 0, 0.3),
        mat=M.matte("book-cover", (0.08, 0.12, 0.2), rough=0.6),
        bev=0.004,
    )
    for ob in list(bpy.data.collections[core.current()].objects):
        place(ob, C, yaw)
    _ = base, seat, back


@item("bard-stage", "floorRight")
def bards_stage():
    c = C + Vector((0.05, 0.2, 0))
    boards = M.wood(
        "stage-boards",
        (0.06, 0.035, 0.02),
        (0.17, 0.1, 0.055),
        grain=36,
        rough=(0.5, 0.8),
        dirt=0.6,
        knots=0.5,
        checks=0.6,
        tint=0.2,
    )
    w, d, h = 1.5, 0.75, 0.2
    for k in range(7):
        x = c.x - w / 2 + (k + 0.5) * w / 7
        geo.box(
            "stage-board",
            (d, w / 7 - 0.006, 0.03),
            Vector((x, c.y, h - 0.015)),
            rot=(0, 0, math.pi / 2),
            mat=boards,
            bev=0.003,
        )
    geo.box("stage-skirt", (w, 0.03, h - 0.03), Vector((c.x, c.y - d / 2, (h - 0.03) / 2)), mat=boards, bev=0.004)
    velvet = M.fabric("stage-velvet", (0.13, 0.008, 0.012), sheen=1.0, rough=0.85, weave=1200, pattern_dark=0.55)
    rod_z = 1.1  # a low drape: the right-wall slot hangs above it
    curtain = geo.grid(
        "curtain",
        w + 0.1,
        rod_z - h,
        160,
        30,
        Vector((c.x, c.y + d / 2 - 0.02, h + (rod_z - h) / 2)),
        rot=(math.pi / 2, 0, 0),
        mat=velvet,
    )
    geo.folds(curtain, amplitude=0.06, period=0.05)
    geo.displace(curtain, strength=0.01, size=0.2)
    geo.cylinder(
        "curtain-rod",
        0.015,
        w + 0.24,
        Vector((c.x, c.y + d / 2 - 0.02, rod_z + 0.02)),
        rot=(0, math.pi / 2, 0),
        mat=common.brass(),
        verts=16,
    )
    stool(Vector((c.x - 0.1, c.y, h)), height=0.45, seed=5)
    bucket_wood = M.wood("bucket", (0.1, 0.06, 0.03), (0.24, 0.15, 0.08), along="Z", across="X", grain=60)
    b = Vector((c.x + 0.5, c.y - 0.15, h))
    geo.lathe(
        "bucket",
        [(0.0, 0.0), (0.09, 0.0), (0.11, 0.2), (0.1, 0.2), (0.08, 0.012), (0.0, 0.012)],
        b,
        segments=32,
        mat=bucket_wood,
    )
    for z in (0.04, 0.16):
        geo.lathe(
            "hoop",
            [(0.093 + z * 0.1, z - 0.012), (0.096 + z * 0.1, z), (0.093 + z * 0.1, z + 0.012)],
            b,
            segments=32,
            mat=common.iron(),
        )
    gold = M.metal("coin-gold", (0.85, 0.62, 0.22), rough=(0.2, 0.35))
    rnd = random.Random(4)
    for k in range(8):
        geo.cylinder(
            "coin",
            0.012,
            0.003,
            b + Vector((rnd.uniform(-0.05, 0.05), rnd.uniform(-0.05, 0.05), 0.02 + k * 0.004)),
            rot=(rnd.uniform(-0.4, 0.4), rnd.uniform(-0.4, 0.4), 0),
            mat=gold,
            verts=16,
        )
    # Footlights: three candles in tin reflectors along the front edge.
    tin = M.metal("tin", (0.6, 0.6, 0.58), rough=(0.2, 0.4))
    for k in range(3):
        p = Vector((c.x - 0.5 + k * 0.5, c.y - d / 2 + 0.05, h))
        geo.lathe("reflector", [(0.0, 0.0), (0.04, 0.0), (0.05, 0.05), (0.0, 0.06)], p, segments=16, mat=tin, arc=0.5)
        common.candle(p + Vector((0, -0.01, 0)), height=0.05, radius=0.012, seed=40 + k)
    common.own_light("footlights", Vector((c.x, c.y - d / 2 - 0.1, h + 0.2)), 1.2, lighting.WARM_LAMP, radius=0.3)


def book(pos: Vector, size, colour, lean=0.0, seed=0):
    rnd = random.Random(seed)
    w, d, h = size
    cover = M.matte(f"cloth-{colour}", colour, rough=0.65, bump=0.3, bump_scale=300)
    b = geo.box("book", (w, d, h), pos + Vector((0, 0, h / 2)), rot=(0, lean, 0), mat=cover, bev=0.003)
    if rnd.random() < 0.6:
        band = geo.box(
            "band",
            (w + 0.002, 0.004, 0.01),
            pos + Vector((0, -d / 2, h * rnd.uniform(0.7, 0.85))),
            rot=(0, lean, 0),
            mat=common.brass(),
            bev=0.0,
        )
        band.location += Vector((math.sin(lean) * h * 0.3, 0, 0))
    return b


@item("reading-nook", "floorRight")
def reading_nook():
    c = C + Vector((0.18, 0.28, 0))
    wood = M.wood(
        "shelf-walnut", (0.035, 0.02, 0.012), (0.1, 0.06, 0.035), grain=55, rough=(0.4, 0.65), dirt=0.5, varnish=0.25
    )
    w, d, h = 1.05, 0.3, 1.08  # low enough for the right-wall slot above
    geo.box("case-back", (w, 0.02, h), c + Vector((0, d / 2, h / 2)), mat=wood, bev=0.004)
    for sx in (-1, 1):
        geo.box("case-side", (0.03, d, h), c + Vector((sx * w / 2, 0, h / 2)), mat=wood, bev=0.005)
    colours = [
        (0.25, 0.04, 0.03),
        (0.05, 0.12, 0.08),
        (0.06, 0.07, 0.18),
        (0.3, 0.2, 0.08),
        (0.12, 0.05, 0.12),
        (0.4, 0.33, 0.2),
        (0.08, 0.06, 0.04),
    ]
    rnd = random.Random(9)
    shelves = [0.06, 0.4, 0.74]
    for z in shelves + [h - 0.02]:
        geo.box("shelf", (w - 0.03, d - 0.02, 0.025), c + Vector((0, 0, z)), mat=wood, bev=0.003)
    for si, z in enumerate(shelves):
        x = c.x - w / 2 + 0.03
        k = 0
        while x < c.x + w / 2 - 0.08:
            bw = rnd.uniform(0.025, 0.06)
            bh = rnd.uniform(0.22, 0.36)
            lean = 0.0
            if rnd.random() < 0.08:
                lean = rnd.uniform(0.15, 0.3)
            book(
                Vector((x + bw / 2, c.y - 0.01 + rnd.uniform(-0.02, 0.02), z + 0.0125)),
                (bw, d - 0.06, bh),
                rnd.choice(colours),
                lean=lean,
                seed=si * 50 + k,
            )
            x += bw + 0.002 + (math.sin(lean) * bh if lean else 0)
            k += 1
            if rnd.random() < 0.05:
                x += 0.08
    # "No bones in it. Promise." One bookmark does look suspicious.
    bone = geo.lathe(
        "bookmark",
        [(0.0, 0.0), (0.008, 0.004), (0.006, 0.02), (0.006, 0.07), (0.009, 0.085), (0.0, 0.09)],
        c + Vector((-0.2, -0.13, 0.74 + 0.3)),
        segments=12,
        mat=M.matte("bone", (0.72, 0.66, 0.55), rough=0.6, sss=0.2),
    )
    bone.rotation_euler = (0, math.radians(-15), 0)
    stool(Vector((c.x - 0.45, c.y - 0.45, 0)), height=0.45, seed=6)
    for k in range(3):
        book(
            Vector((c.x - 0.45, c.y - 0.45 + 0.01 * k, 0.45 + 0.04 * k)), (0.2, 0.26, 0.04), colours[k + 2], seed=90 + k
        )
    top_z = h + 0.0125
    common.candle(Vector((c.x + 0.35, c.y - 0.05, top_z)), height=0.09, radius=0.015, seed=33)
    for k in range(4):
        book(
            Vector((c.x - 0.3 + k * 0.004, c.y - 0.02, top_z + k * 0.035)),
            (0.22, 0.28, 0.035),
            colours[k],
            seed=120 + k,
        )
    common.own_light("nook-candle", Vector((c.x + 0.35, c.y - 0.2, top_z + 0.2)), 0.8, lighting.WARM_LAMP, radius=0.01)
