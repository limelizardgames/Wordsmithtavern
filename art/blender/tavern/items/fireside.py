"""Fireside slot: on the floor beside the hearth, around slots.HEARTHSIDE."""

from __future__ import annotations

import math
import random

import bpy
from mathutils import Euler, Vector

from .. import core, geo, slots
from .. import materials as M
from . import common, item

C = slots.HEARTHSIDE


def blob(name, elements, mat, resolution=0.006, smooth=True):
    """Metaball shape baked to a mesh. elements: (co, radius, (sx, sy, sz), euler)."""
    mb = bpy.data.metaballs.new(name)
    mb.resolution = mb.render_resolution = resolution
    mb.threshold = 0.6
    centre = sum((Vector(e[0]) for e in elements), Vector()) / len(elements)
    for co, radius, size, rot in elements:
        el = mb.elements.new()
        el.type = "ELLIPSOID"
        el.co = Vector(co) - centre
        # The surface sits well inside an element's radius; scale up so `radius` is what shows.
        el.radius = radius * 1.45
        el.size_x, el.size_y, el.size_z = size
        el.rotation = Euler(rot).to_quaternion()
        el.stiffness = 2.0
    tmp = bpy.data.objects.new(name + "-mb", mb)
    core.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    bpy.data.metaballs.remove(mb)
    ob = bpy.data.objects.new(name, me)
    ob.location = centre  # object origin at the creature, so its textures centre on it
    core.link(ob)
    me.materials.append(mat)
    if smooth:
        me.shade_smooth()
    return ob


# ── Cat ─────────────────────────────────────────────────────────────────────────────────────
def tabby_fur(base=(0.46, 0.23, 0.05), stripe_col=(0.18, 0.065, 0.015), cream=(0.72, 0.56, 0.34)):
    n = M.N("ginger-tabby")
    co = n.coord("Object")
    _, _, z = n.xyz(co)
    ang = n.node("ShaderNodeTexGradient", {"Vector": co}, gradient_type="RADIAL").outputs["Fac"]
    stripes = n.wave(
        n.combine(n.math("MULTIPLY", ang, 20.0), n.math("MULTIPLY", z, 30.0), 0.0),
        scale=1.0,
        kind="BANDS",
        direction="X",
        distortion=4.0,
        detail=3.0,
        detail_scale=1.5,
    )
    stripe = n.maprange(stripes, 0.55, 0.8, 0.0, 1.0)
    fur = n.noise(n.vmath("MULTIPLY", co, (1.0, 1.0, 3.0)), scale=300.0, detail=3.0, rough=0.6).outputs["Fac"]
    col = n.mix(n.math("MULTIPLY", stripe, 0.8), base, stripe_col)
    col = n.mix(n.maprange(z, -0.03, 0.02, 0.7, 0.0), col, cream)
    col = n.mix(n.maprange(fur, 0.3, 0.7, 0.2, -0.1), col, (0.95, 0.75, 0.45))
    occ = n.ao(0.05)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.75, 0.0), col, (0.04, 0.015, 0.005))
    return n.finish(
        n.principled(base=col, rough=0.9, sheen=0.3, sheen_rough=0.5, normal=n.bump(fur, strength=0.7, distance=0.002))
    )


def wicker():
    n = M.N("wicker")
    co = n.coord("Object")
    ang = n.node("ShaderNodeTexGradient", {"Vector": co}, gradient_type="RADIAL").outputs["Fac"]
    _, _, z = n.xyz(co)
    rows = n.wave(n.combine(z, 0.0, 0.0), scale=90.0, kind="BANDS", direction="X")
    cols = n.wave(n.combine(n.math("MULTIPLY", ang, 1.0), 0.0, 0.0), scale=36.0, kind="BANDS", direction="X")
    weave = n.math("ADD", n.math("MULTIPLY", rows, 0.6), n.math("MULTIPLY", cols, 0.4))
    col = n.ramp(weave, [(0.2, (0.12, 0.07, 0.03)), (0.8, (0.5, 0.35, 0.17))])
    return n.finish(n.principled(base=col, rough=0.7, normal=n.bump(weave, strength=0.9, distance=0.006)))


@item("cat-basket", "hearthside")
def cat_basket():
    c = C + Vector((-0.02, 0.0, 0.0))
    wk = wicker()
    prof = [
        (0.0, 0.0),
        (0.2, 0.0),
        (0.24, 0.03),
        (0.27, 0.11),
        (0.28, 0.14),
        (0.26, 0.14),
        (0.25, 0.11),
        (0.22, 0.04),
        (0.0, 0.03),
    ]
    basket = geo.lathe("basket", prof, c, segments=64, mat=wk)
    basket.scale = (1.0, 0.72, 1.0)
    from .lights import torus

    rim = torus("basket-rim", c + Vector((0, 0, 0.14)), 0.27, 0.014, wk, segs=64, rings=8)
    rim.scale = (1.0, 0.72, 1.0)
    cushion = geo.box(
        "cushion",
        (0.34, 0.22, 0.06),
        c + Vector((0, 0, 0.07)),
        mat=M.fabric("plaid", (0.35, 0.08, 0.06), sheen=0.5, weave=250, pattern_dark=0.4),
        bev=0.025,
        segments=4,
    )
    sub = cushion.modifiers.new("Soft", "SUBSURF")
    sub.levels = sub.render_levels = 2
    fur = tabby_fur()
    top = c + Vector((0, 0, 0.1))  # top of the cushion
    body = []
    for k in range(8):
        a = math.radians(-10 + k * 38)
        body.append(
            (
                top + Vector((math.cos(a) * 0.115, math.sin(a) * 0.085 + 0.02, 0.07 - 0.008 * abs(k - 3.5))),
                0.088,
                (1.0, 0.85, 0.7),
                (0, 0, a + math.pi / 2),
            )
        )
    head = top + Vector((-0.07, -0.085, 0.1))
    body += [
        (head, 0.07, (1.0, 0.92, 0.88), (0, 0, 0.2)),
        (head + Vector((0.004, -0.045, -0.018)), 0.034, (1.15, 0.9, 0.8), (0, 0, 0.2)),
        (head + Vector((0.07, -0.02, -0.07)), 0.03, (1.8, 0.8, 0.6), (0, 0, -0.3)),
    ]
    cat = blob("cat", body, fur)
    cat.modifiers.new("Smooth", "SUBSURF").levels = 1
    inner = M.matte("ear-inner", (0.6, 0.32, 0.25), rough=0.7)
    for sx in (-1, 1):
        base = head + Vector((sx * 0.036, 0.008, 0.04))
        ear = geo.mesh(
            "ear",
            [(-0.024, 0.0, 0.0), (0.024, 0.0, 0.0), (sx * 0.006, 0.0, 0.05)],
            [(0, 1, 2)],
            mat=fur,
            loc=base,
            rot=(math.radians(-10), sx * math.radians(18), sx * math.radians(12)),
        )
        geo.solidify(ear, 0.012, offset=0.0)
        ear.modifiers.new("Soft", "SUBSURF").levels = 2
        ein = geo.mesh(
            "ear-in",
            [(-0.014, 0.0, 0.004), (0.014, 0.0, 0.004), (sx * 0.004, 0.0, 0.036)],
            [(0, 1, 2)],
            mat=inner,
            loc=base + Vector((0, -0.0075, 0)),
            rot=ear.rotation_euler,
        )
        eyelid = M.matte("cat-eyelid", (0.03, 0.012, 0.006), rough=0.5)
        geo.tube(
            "eye-closed",
            [
                head + Vector((sx * 0.026 - 0.011, -0.063, 0.014)),
                head + Vector((sx * 0.026, -0.068, 0.008)),
                head + Vector((sx * 0.026 + 0.011, -0.063, 0.014)),
            ],
            0.0022,
            mat=eyelid,
            resolution=2,
        )
        _ = ein
    geo.mesh(
        "cat-nose",
        [(-0.008, 0.0, 0.004), (0.008, 0.0, 0.004), (0.0, 0.0, -0.005)],
        [(0, 1, 2)],
        mat=M.matte("cat-nose", (0.58, 0.28, 0.25), rough=0.4),
        loc=head + Vector((0.004, -0.083, -0.008)),
        rot=(0.3, 0, 0),
    )
    tail_pts = [
        top + Vector((0.14, 0.02, 0.05)),
        top + Vector((0.16, -0.08, 0.04)),
        top + Vector((0.07, -0.14, 0.03)),
        top + Vector((-0.04, -0.15, 0.035)),
        top + Vector((-0.11, -0.12, 0.04)),
    ]
    geo.tube("tail", tail_pts, 0.024, mat=fur, radii=[1.0, 1.0, 0.95, 0.85, 0.65])


# ── Fern ────────────────────────────────────────────────────────────────────────────────────
def terracotta():
    n = M.N("terracotta")
    co = n.coord("Object")
    nz = n.noise(co, scale=30.0, detail=6.0).outputs["Fac"]
    salts = n.noise(co, scale=8.0, detail=5.0, rough=0.7).outputs["Fac"]
    col = n.mix(n.maprange(nz, 0.3, 0.7, 0.0, 0.5), (0.48, 0.22, 0.12), (0.34, 0.15, 0.08))
    col = n.mix(n.maprange(salts, 0.6, 0.72, 0.0, 0.6), col, (0.62, 0.58, 0.5))
    return n.finish(n.principled(base=col, rough=0.9, normal=n.bump(nz, strength=0.3, distance=0.004)))


def frond(base: Vector, direction: float, length: float, lift: float, mat, seed: int, pinnae: int = 22):
    rnd = random.Random(seed)
    out = Vector((math.cos(direction), math.sin(direction), 0.0))
    p0 = base
    p1 = base + out * length * 0.45 + Vector((0, 0, lift))
    p2 = base + out * length + Vector((0, 0, lift * 0.35 - length * 0.35))

    def bez(t):
        return p0 * (1 - t) ** 2 + p1 * 2 * t * (1 - t) + p2 * t * t

    geo.tube("rachis", [bez(t) for t in (0.0, 0.33, 0.66, 1.0)], 0.0025, mat=mat, radii=[1.0, 0.8, 0.6, 0.3])
    verts, faces = [], []
    for i in range(pinnae):
        t = 0.12 + 0.86 * i / pinnae
        p = bez(t)
        tan = (bez(min(1.0, t + 0.01)) - bez(max(0.0, t - 0.01))).normalized()
        side = tan.cross(Vector((0, 0, 1))).normalized()
        up = side.cross(tan).normalized()
        size = 0.055 * (1.0 - t) ** 0.7 + 0.01
        for sgn in (-1, 1):
            d = (side * sgn + tan * 0.35).normalized()
            droop = up * (-0.25 * size)
            w = size * 0.18
            q = [
                p,
                p + d * size * 0.5 + tan * w + droop * 0.5,
                p + d * size + droop,
                p + d * size * 0.5 - tan * w + droop * 0.5,
            ]
            base_i = len(verts)
            verts += q
            faces.append((base_i, base_i + 1, base_i + 2, base_i + 3))
    geo.mesh(f"pinnae-{seed}", verts, faces, mat=mat, smooth=True)
    _ = rnd


@item("potted-fern", "hearthside")
def potted_fern():
    c = C + Vector((0.02, 0.02, 0))
    prof = [
        (0.0, 0.0),
        (0.11, 0.0),
        (0.12, 0.01),
        (0.15, 0.22),
        (0.17, 0.23),
        (0.175, 0.27),
        (0.16, 0.275),
        (0.15, 0.25),
        (0.0, 0.24),
    ]
    geo.lathe("pot", prof, c, segments=48, mat=terracotta())
    geo.lathe(
        "fern-soil",
        [(0.0, 0.25), (0.148, 0.245)],
        c,
        segments=40,
        mat=M.matte("potting-soil", (0.04, 0.028, 0.018), rough=1.0, bump=1.0, bump_scale=300),
    )
    leaf = M.matte("fern-green", (0.07, 0.2, 0.04), rough=0.55, sss=0.3)
    rnd = random.Random(2)
    for k in range(16):
        a = 2 * math.pi * k / 16 + rnd.uniform(-0.15, 0.15)
        frond(c + Vector((0, 0, 0.25)), a, rnd.uniform(0.35, 0.5), rnd.uniform(0.18, 0.32), leaf, seed=k)
    for k in range(5):
        a = rnd.uniform(0, 6.28)
        frond(
            c + Vector((0, 0, 0.25)), a, rnd.uniform(0.25, 0.35), rnd.uniform(0.3, 0.4), leaf, seed=100 + k, pinnae=16
        )


# ── Hatchling ───────────────────────────────────────────────────────────────────────────────
def dragon_scales(base=(0.5, 0.1, 0.04), belly=(0.85, 0.55, 0.2)):
    n = M.N("hatchling-scales")
    co = n.coord("Object")
    _, _, z = n.xyz(co)
    sc = n.voronoi(co, scale=160.0, feature="DISTANCE_TO_EDGE").outputs["Distance"]
    edge = n.maprange(sc, 0.0, 0.08, 1.0, 0.0)
    big = n.noise(co, scale=12.0, detail=3.0).outputs["Fac"]
    col = n.mix(n.maprange(z, -0.02, 0.03, 1.0, 0.0), base, belly)
    col = n.mix(n.maprange(big, 0.3, 0.7, 0.0, 0.4), col, tuple(c * 0.6 for c in base))
    col = n.mix(n.math("MULTIPLY", edge, 0.5), col, (0.08, 0.015, 0.005))
    return n.finish(
        n.principled(
            base=col,
            rough=0.4,
            sss=0.2,
            sss_radius=(1.0, 0.3, 0.1),
            sss_scale=0.01,
            coat=0.3,
            normal=n.bump(n.math("SUBTRACT", 1.0, edge), strength=0.5, distance=0.002),
        )
    )


@item("hatchling-nest", "hearthside")
def hatchling_nest():
    c = C + Vector((0.0, 0.0, 0.0))
    twig = M.wood("twig", (0.05, 0.035, 0.022), (0.14, 0.1, 0.06), grain=300, rough=(0.7, 0.9), dirt=0.2)
    rnd = random.Random(6)
    for _ in range(90):
        a0 = rnd.uniform(0, 2 * math.pi)
        span = rnd.uniform(0.6, 1.4)
        r = rnd.uniform(0.15, 0.24)
        z = rnd.uniform(0.0, 0.1)
        pts = [
            c
            + Vector(
                (
                    math.cos(a0 + span * t) * r * (1 + rnd.uniform(-0.1, 0.1)),
                    math.sin(a0 + span * t) * r * 0.8,
                    z + rnd.uniform(-0.02, 0.03) + 0.04 * math.sin(t * 3),
                )
            )
            for t in (0.0, 0.33, 0.66, 1.0)
        ]
        geo.tube("twig", pts, rnd.uniform(0.004, 0.007), mat=twig, resolution=3)
    geo.lathe(
        "nest-hay",
        [(0.0, 0.03), (0.16, 0.04), (0.2, 0.09)],
        c,
        segments=40,
        mat=M.matte("hay", (0.45, 0.35, 0.15), rough=0.95, bump=1.0, bump_scale=400),
    )
    scales = dragon_scales(base=(0.5, 0.07, 0.025), belly=(0.92, 0.52, 0.14))
    seat = c + Vector((0.0, 0.0, 0.07))
    els = [
        (seat + Vector((0, 0, 0.06)), 0.075, (1.0, 0.85, 1.15), (0, 0, 0)),
        (seat + Vector((0, -0.01, 0.13)), 0.05, (0.9, 0.85, 1.1), (0.25, 0, 0)),
        (seat + Vector((0, -0.03, 0.19)), 0.058, (1.0, 1.0, 0.95), (0, 0, 0)),
        (seat + Vector((0, -0.075, 0.18)), 0.034, (0.9, 1.6, 0.75), (0.15, 0, 0)),
        (seat + Vector((-0.05, -0.05, 0.02)), 0.035, (1.2, 1.4, 0.7), (0, 0, 0.4)),
        (seat + Vector((0.05, -0.05, 0.02)), 0.035, (1.2, 1.4, 0.7), (0, 0, -0.4)),
    ]
    dragon = blob("hatchling", els, scales)
    dragon.modifiers.new("Smooth", "SUBSURF").levels = 1
    head = seat + Vector((0, -0.03, 0.19))
    horn = M.matte("horn", (0.85, 0.75, 0.55), rough=0.4)
    eye_mat = M.glass("amber-eye", (1.0, 0.55, 0.08), rough=0.02)
    pupil = M.matte("pupil", (0.01, 0.005, 0.003), rough=0.1)
    for sx in (-1, 1):
        geo.tube(
            "horn",
            [
                head + Vector((sx * 0.03, 0.02, 0.035)),
                head + Vector((sx * 0.045, 0.05, 0.07)),
                head + Vector((sx * 0.05, 0.09, 0.08)),
            ],
            0.009,
            mat=horn,
            radii=[1.0, 0.6, 0.15],
        )
        eye_c = head + Vector((sx * 0.032, -0.042, 0.012))
        eye = geo.lathe(
            "dragon-eye",
            [(0.0, -0.014)]
            + [(0.014 * math.sin(math.pi * k / 10), -0.014 * math.cos(math.pi * k / 10)) for k in range(1, 10)]
            + [(0.0, 0.014)],
            eye_c,
            segments=24,
            mat=eye_mat,
        )
        geo.box("pupil", (0.004, 0.002, 0.016), eye_c + Vector((sx * 0.002, -0.0125, 0)), mat=pupil, bev=0.001)
        common.no_room_light(eye)
    wing = M.matte("wing-membrane", (0.5, 0.1, 0.04), rough=0.45, sss=0.5)
    for sx in (-1, 1):
        root = seat + Vector((sx * 0.04, 0.03, 0.14))
        tips = [
            root + Vector((sx * 0.1, 0.05, 0.13)),
            root + Vector((sx * 0.15, 0.06, 0.05)),
            root + Vector((sx * 0.13, 0.06, -0.03)),
        ]
        for t in tips:
            geo.tube(
                "wing-finger",
                [root, (root + t) / 2 + Vector((0, 0, 0.015)), t],
                0.004,
                mat=scales,
                radii=[1.0, 0.7, 0.3],
            )
        verts = [root] + tips + [root + Vector((sx * 0.05, 0.05, -0.04))]
        geo.mesh("wing", verts, [(0, 1, 2), (0, 2, 3), (0, 3, 4)], mat=wing, smooth=True)
    tail = [
        seat + Vector((0.06, 0.03, 0.0)),
        seat + Vector((0.13, -0.03, 0.0)),
        seat + Vector((0.1, -0.11, 0.005)),
        seat + Vector((0.0, -0.12, 0.01)),
    ]
    geo.tube("dragon-tail", tail, 0.022, mat=scales, radii=[1.0, 0.7, 0.45, 0.2])
    geo.mesh(
        "tail-spade",
        [(0.0, 0.0, 0.0), (-0.025, -0.012, 0.0), (-0.012, 0.012, 0.0)],
        [(0, 1, 2)],
        mat=scales,
        loc=tail[-1],
    )
    gold = M.metal("coin-gold", (0.85, 0.62, 0.22), rough=(0.2, 0.35))
    for _ in range(9):
        a, r = rnd.uniform(0, 6.28), rnd.uniform(0.08, 0.17)
        geo.cylinder(
            "coin",
            0.013,
            0.003,
            c + Vector((math.cos(a) * r, math.sin(a) * r * 0.8, 0.075 + rnd.uniform(0, 0.02))),
            rot=(rnd.uniform(-0.5, 0.5), rnd.uniform(-0.5, 0.5), 0),
            mat=gold,
            verts=18,
        )
    shell = M.matte("eggshell", (0.8, 0.74, 0.62), rough=0.5, sss=0.2)
    for _ in range(3):
        a = rnd.uniform(0, 6.28)
        piece = geo.lathe(
            "shell",
            [(0.0, 0.0), (0.03, 0.006), (0.045, 0.025), (0.047, 0.04)],
            c + Vector((math.cos(a) * 0.14, math.sin(a) * 0.1, 0.08)),
            segments=20,
            mat=shell,
            arc=0.4,
        )
        piece.rotation_euler = (rnd.uniform(0.5, 2.5), rnd.uniform(-1, 1), rnd.uniform(0, 6.28))


# ── Oak sapling ─────────────────────────────────────────────────────────────────────────────
def oak_leaf_shape(length):
    return lambda a: length * 0.5 * (0.7 + 0.3 * abs(math.cos(a * 3.5))) * (0.6 + 0.4 * abs(math.cos(a)))


@item("oakley-sapling", "hearthside")
def oak_sapling():
    c = C + Vector((0.0, 0.02, 0))
    stave = M.wood("barrel-stave", (0.07, 0.04, 0.02), (0.18, 0.11, 0.06), along="Z", across="X", grain=40, dirt=0.6)
    prof = [(0.0, 0.0), (0.2, 0.0), (0.215, 0.12), (0.22, 0.24), (0.2, 0.24), (0.195, 0.12), (0.18, 0.02), (0.0, 0.02)]
    geo.lathe("half-barrel", prof, c, segments=40, mat=stave)
    for z in (0.05, 0.19):
        geo.lathe(
            "hoop",
            [(0.214 + (z - 0.12) * 0.02, z - 0.015), (0.222, z), (0.214 + (z - 0.12) * 0.02, z + 0.015)],
            c,
            segments=40,
            mat=common.iron(),
        )
    geo.lathe(
        "moss-soil",
        [(0.0, 0.225), (0.2, 0.22)],
        c,
        segments=40,
        mat=M.matte("moss", (0.07, 0.12, 0.03), rough=1.0, bump=1.0, bump_scale=200),
    )
    bark = M.wood(
        "oak-bark",
        (0.06, 0.05, 0.04),
        (0.16, 0.13, 0.1),
        along="Z",
        across="X",
        grain=90,
        rough=(0.8, 0.95),
        bump=0.8,
        checks=2.0,
    )
    rnd = random.Random(3)
    base = c + Vector((0, 0, 0.22))
    trunk = [
        base,
        base + Vector((0.02, 0.0, 0.25)),
        base + Vector((-0.02, 0.01, 0.5)),
        base + Vector((0.01, -0.01, 0.72)),
    ]
    geo.tube("trunk", trunk, 0.03, mat=bark, radii=[1.0, 0.75, 0.5, 0.25])
    leafmat = M.matte("oak-leaf", (0.1, 0.22, 0.05), rough=0.5, sss=0.25)
    for b in range(7):
        t = 0.35 + b * 0.09
        root = trunk[1].lerp(trunk[3], (t - 0.3) / 0.7) if t > 0.3 else trunk[1]
        a = b * 2.4
        tip = root + Vector((math.cos(a) * 0.22, math.sin(a) * 0.16, rnd.uniform(0.08, 0.2)))
        geo.tube("branch", [root, (root + tip) / 2 + Vector((0, 0, 0.03)), tip], 0.009, mat=bark, radii=[1.0, 0.6, 0.3])
        for _ in range(14):
            p = root.lerp(tip, rnd.uniform(0.35, 1.0)) + Vector(
                (rnd.uniform(-0.06, 0.06), rnd.uniform(-0.06, 0.06), rnd.uniform(-0.04, 0.06))
            )
            lf = geo.disc("oak-leaf", oak_leaf_shape(rnd.uniform(0.06, 0.09)), p, segments=36, mat=leafmat)
            lf.scale = (1.0, 0.55, 1.0)
            lf.rotation_euler = (rnd.uniform(-0.9, 0.9), rnd.uniform(-0.9, 0.9), rnd.uniform(0, 6.28))
    acorn = M.matte("acorn", (0.35, 0.22, 0.08), rough=0.4)
    for _ in range(3):
        p = trunk[2] + Vector((rnd.uniform(-0.12, 0.12), rnd.uniform(-0.1, 0.1), rnd.uniform(0.0, 0.15)))
        geo.lathe(
            "acorn", [(0.0, 0.0), (0.008, 0.004), (0.01, 0.014), (0.009, 0.02), (0.0, 0.022)], p, segments=12, mat=acorn
        )
