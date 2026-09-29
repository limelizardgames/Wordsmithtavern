"""Right wall slot: on the plaster bay between the posts, centred on slots.WALL_RIGHT."""

from __future__ import annotations

import math
import random

from mathutils import Vector

from .. import geo, slots, textures
from .. import materials as M
from . import common, item
from .lights import torus
from .wall_left import FACE, nail

C = slots.WALL_RIGHT


def gilt():
    n = M.N("gilt")
    co = n.coord("Object")
    wear = n.noise(co, scale=40.0, detail=6.0, rough=0.6).outputs["Fac"]
    occ = n.ao(0.02)
    gold = n.principled(base=(0.78, 0.56, 0.24), metallic=1.0, rough=n.maprange(wear, 0.3, 0.7, 0.2, 0.45))
    bole = n.principled(base=(0.3, 0.09, 0.05), rough=0.6)
    grime = n.principled(base=(0.03, 0.02, 0.01), rough=0.8)
    worn = n.maprange(wear, 0.62, 0.7, 0.0, 1.0)
    s = n.shader_mix(worn, gold, bole)
    return n.finish(n.shader_mix(n.maprange(occ, 0.0, 1.0, 0.8, 0.0), s, grime))


@item("painting-goose", "wallRight")
def goose_portrait():
    img = textures.image("goose-painting")
    pw, ph = 0.72, 0.72 * img.size[1] / img.size[0]
    c = C + Vector((0, -0.01, 0.04))
    geo.grid("canvas", pw, ph, 2, 2, c + Vector((0, -0.02, 0)), rot=FACE, mat=M.painting("oil-goose", img))
    fw, fh = pw + 0.2, ph + 0.2
    prof = [
        (0.0, 0.0),
        (0.0, 0.035),
        (0.01, 0.05),
        (0.022, 0.055),
        (0.032, 0.045),
        (0.042, 0.052),
        (0.055, 0.058),
        (0.068, 0.045),
        (0.08, 0.03),
        (0.09, 0.034),
        (0.1, 0.022),
        (0.1, 0.0),
    ]
    geo.moulding("frame", fw, fh, prof, c, mat=gilt())
    iron = common.iron()
    top = c + Vector((0, 0.0, fh / 2))
    nail(top + Vector((0, 0.02, 0.14)))
    geo.tube(
        "wire",
        [top + Vector((-0.2, -0.005, -0.03)), top + Vector((0, 0.012, 0.13)), top + Vector((0.2, -0.005, -0.03))],
        0.0015,
        mat=iron,
        kind="POLY",
    )


@item("tapestry", "wallRight")
def word_wars_tapestry():
    img = textures.image("tapestry-art")
    w = 0.72
    h = w * img.size[1] / img.size[0]
    c = C + Vector((0, -0.02, -0.02))
    cloth = geo.grid("tapestry", w, h, 60, 80, c, rot=FACE, mat=M.woven("tapestry-weave", img))
    # Gentle vertical folds and a sag between the hanging loops.
    tex_mod = cloth.modifiers.new("Folds", "WAVE")
    tex_mod.use_x = True
    tex_mod.use_y = False
    tex_mod.height = 0.012
    tex_mod.width = 0.18
    tex_mod.narrowness = 1.2
    tex_mod.speed = 0.0
    tex_mod.time_offset = 0.0
    geo.displace(cloth, strength=0.006, size=0.15)
    rod_z = c.z + h / 2 + 0.03
    oak = M.wood("rod-oak", (0.04, 0.025, 0.014), (0.12, 0.075, 0.04), grain=80, varnish=0.3)
    geo.cylinder("rod", 0.014, w + 0.16, Vector((c.x, c.y - 0.01, rod_z)), rot=(0, math.pi / 2, 0), mat=oak, verts=20)
    brass = common.brass()
    for sx in (-1, 1):
        geo.lathe(
            "finial",
            [(0.0, 0.0), (0.02, 0.01), (0.024, 0.03), (0.012, 0.05), (0.0, 0.06)],
            Vector((c.x + sx * (w / 2 + 0.08), c.y - 0.01, rod_z)),
            rot=(0, sx * math.pi / 2, 0),
            segments=20,
            mat=brass,
        )
    for k in range(7):
        x = c.x - w / 2 + 0.04 + k * (w - 0.08) / 6
        torus(
            "loop",
            Vector((x, c.y - 0.005, rod_z - 0.01)),
            0.02,
            0.004,
            M.woven("tapestry-weave", img),
            rot=(0, math.pi / 2, 0),
            segs=16,
            rings=6,
        )
    tassel = M.fabric("tassel", (0.62, 0.45, 0.14), sheen=0.6, weave=2000)
    for k in range(9):
        x = c.x - w / 2 + 0.03 + k * (w - 0.06) / 8
        geo.lathe(
            "tassel",
            [(0.0, 0.0), (0.008, -0.01), (0.014, -0.04), (0.012, -0.07), (0.0, -0.075)],
            Vector((x, c.y - 0.006, c.z - h / 2)),
            segments=12,
            mat=tassel,
        )
    nail(Vector((c.x, c.y + 0.01, rod_z + 0.02)))


@item("ship-bottle", "wallRight")
def ship_in_bottle():
    c = C + Vector((0, 0, -0.12))
    wood = M.wood(
        "shelf-oak", (0.05, 0.03, 0.017), (0.14, 0.085, 0.045), grain=50, rough=(0.45, 0.7), dirt=0.5, varnish=0.2
    )
    shelf_y = slots.WALL - 0.14
    geo.box("shelf", (0.62, 0.22, 0.03), Vector((c.x, shelf_y, c.z)), mat=wood, bev=0.005)
    for sx in (-1, 1):
        geo.box(
            "bracket",
            (0.18, 0.025, 0.12),
            Vector((c.x + sx * 0.22, shelf_y + 0.02, c.z - 0.075)),
            rot=(0, 0, math.pi / 2),
            mat=wood,
            bev=0.004,
        )
    top = c.z + 0.015
    for sx in (-1, 1):
        geo.box("cradle", (0.03, 0.1, 0.05), Vector((c.x + sx * 0.12, shelf_y, top + 0.025)), mat=wood, bev=0.004)
    axis_z = top + 0.075
    bottle = geo.lathe(
        "bottle",
        [
            (0.0, -0.21),
            (0.065, -0.21),
            (0.072, -0.19),
            (0.073, 0.12),
            (0.06, 0.16),
            (0.024, 0.2),
            (0.022, 0.26),
            (0.026, 0.27),
            (0.0, 0.27),
        ],
        Vector((c.x, shelf_y, axis_z)),
        rot=(0, math.pi / 2, 0),
        segments=48,
        mat=M.glass("bottle-glass", (0.72, 0.85, 0.72), rough=0.02),
    )
    geo.cylinder(
        "cork",
        0.021,
        0.04,
        Vector((c.x + 0.28, shelf_y, axis_z)),
        rot=(0, math.pi / 2, 0),
        mat=M.matte("cork-stopper", (0.45, 0.3, 0.17), rough=0.9, bump=0.8, bump_scale=300),
        verts=16,
    )
    # The ship: hull, masts and sails, very small and very patient.
    hull_wood = M.wood("model-hull", (0.08, 0.04, 0.02), (0.2, 0.1, 0.05), grain=200, varnish=0.5)
    hull = geo.lathe(
        "hull",
        [(0.0, -0.1), (0.022, -0.08), (0.028, 0.0), (0.022, 0.07), (0.0, 0.1)],
        Vector((c.x - 0.02, shelf_y, axis_z - 0.03)),
        rot=(0, math.pi / 2, 0),
        segments=16,
        mat=hull_wood,
    )
    hull.scale = (0.6, 1.0, 1.0)
    sail = M.matte("sailcloth", (0.85, 0.8, 0.68), rough=0.8, sss=0.3)
    for dx, hgt in ((-0.06, 0.09), (0.0, 0.11), (0.06, 0.08)):
        base = Vector((c.x - 0.02 + dx, shelf_y, axis_z - 0.02))
        geo.tube("mast", [base, base + Vector((0, 0, hgt))], 0.0015, mat=hull_wood, kind="POLY")
        for j, sz in enumerate((0.05, 0.035)):
            s = geo.grid(
                "sail",
                sz * 0.9,
                sz * 0.7,
                4,
                4,
                base + Vector((0, -0.004, hgt * (0.45 + j * 0.35))),
                rot=FACE,
                mat=sail,
            )
            geo.displace(s, strength=0.004, size=0.03)
    geo.box(
        "sea",
        (0.2, 0.08, 0.012),
        Vector((c.x - 0.02, shelf_y, axis_z - 0.052)),
        mat=M.matte("putty-sea", (0.08, 0.2, 0.3), rough=0.35, bump=0.8, bump_scale=60),
        bev=0.004,
    )
    _ = bottle


@item("holy-grill", "wallRight")
def holy_grill():
    c = C + Vector((0, -0.02, 0.0))
    board_wood = M.wood("reliquary", (0.03, 0.015, 0.008), (0.1, 0.05, 0.025), grain=60, varnish=0.5)
    geo.moulding(
        "reliquary-frame",
        0.64,
        0.66,
        [(0.0, 0.0), (0.0, 0.04), (0.012, 0.05), (0.04, 0.045), (0.05, 0.02), (0.05, 0.0)],
        c + Vector((0, 0.01, 0)),
        mat=gilt(),
    )
    geo.box(
        "velvet",
        (0.56, 0.01, 0.58),
        c + Vector((0, 0.012, 0)),
        mat=M.fabric("velvet-blue", (0.03, 0.05, 0.16), sheen=1.0, rough=0.9, weave=1500),
        bev=0.0,
    )
    halo = M.glow("halo-gold", (1.0, 0.8, 0.35), 3.0)
    ring = torus("halo", c + Vector((0, -0.004, 0.02)), 0.22, 0.006, halo, rot=FACE, segs=64, rings=6)
    common.no_room_light(ring)
    for k in range(16):
        a = 2 * math.pi * k / 16
        d = Vector((math.cos(a), 0, math.sin(a)))
        ray = geo.tube(
            "ray",
            [c + Vector((0, -0.003, 0.02)) + d * 0.235, c + Vector((0, -0.003, 0.02)) + d * (0.26 + 0.02 * (k % 2))],
            0.0025,
            mat=halo,
            kind="POLY",
        )
        common.no_room_light(ray)
    greasy = M.metal("greasy-iron", (0.035, 0.033, 0.03), rough=(0.12, 0.6), tarnish=(0.015, 0.012, 0.01), scale=40)
    g = c + Vector((0, -0.03, 0.03))
    geo.box("grill-frame-t", (0.3, 0.018, 0.018), g + Vector((0, 0, 0.12)), mat=greasy, bev=0.004)
    geo.box("grill-frame-b", (0.3, 0.018, 0.018), g + Vector((0, 0, -0.12)), mat=greasy, bev=0.004)
    for k in range(8):
        x = g.x - 0.14 + k * 0.04
        geo.cylinder("grill-bar", 0.0055, 0.24, Vector((x, g.y, g.z)), mat=greasy, verts=10)
    geo.tube(
        "grill-handle",
        [g + Vector((0, 0, -0.12)), g + Vector((0, -0.01, -0.25)), g + Vector((0.01, -0.012, -0.29))],
        0.008,
        mat=greasy,
    )
    geo.lathe(
        "handle-grip",
        [(0.0, 0.0), (0.014, 0.005), (0.016, 0.05), (0.012, 0.07), (0.0, 0.072)],
        g + Vector((0.01, -0.012, -0.36)),
        segments=16,
        mat=board_wood,
    )
    common.own_light("grill-glow", c + Vector((0, -0.25, 0.05)), 3.0, (1.0, 0.85, 0.5), radius=0.1)


@item("golden-lute", "wallRight")
def golden_lute():
    c = C + Vector((-0.02, -0.06, -0.02))
    n = M.N("scorched-gold")
    co = n.coord("Object")
    scorch = n.noise(co, scale=9.0, detail=8.0, rough=0.65).outputs["Fac"]
    burn = n.maprange(scorch, 0.58, 0.68, 0.0, 1.0)
    gold = n.principled(base=(0.8, 0.55, 0.2), metallic=1.0, rough=n.maprange(scorch, 0.3, 0.7, 0.18, 0.35))
    soot = n.principled(base=(0.02, 0.015, 0.01), rough=0.8)
    gold_mat = n.finish(n.shader_mix(burn, gold, soot))
    spruce = M.wood(
        "soundboard", (0.3, 0.2, 0.1), (0.52, 0.38, 0.2), along="Z", across="X", grain=160, varnish=0.6, dirt=0.3
    )
    ebony = M.matte("ebony", (0.02, 0.015, 0.012), rough=0.35)
    # Bowl back (half a pear, behind the soundboard), soundboard, neck, bent-back pegbox.
    L = 0.36
    prof = [(0.0, 0.0), (0.06, 0.012), (0.12, 0.06), (0.15, 0.14), (0.14, 0.22), (0.1, 0.3), (0.05, 0.345), (0.0, L)]
    body = geo.lathe("lute-body", prof, c + Vector((0, 0.0, -0.2)), segments=48, mat=gold_mat, arc=0.5)
    body.scale = (1.0, 0.55, 1.0)
    outline = [(0.0, 0.0)] + [(-x, z) for x, z in prof[1:-1]] + [(0.0, L)] + [(x, z) for x, z in reversed(prof[1:-1])]
    sb = geo.mesh(
        "lute-top",
        [(x, 0.0, z) for x, z in outline],
        [tuple(range(len(outline)))],
        mat=spruce,
        loc=c + Vector((0, -0.001, -0.2)),
    )
    geo.lathe(
        "rose",
        [(0.0, 0.0), (0.035, 0.0), (0.036, 0.001)],
        c + Vector((0, -0.002, -0.05)),
        rot=FACE,
        segments=32,
        mat=M.matte("rose-hole", (0.01, 0.008, 0.006), rough=0.9),
    )
    geo.box("neck", (0.035, 0.03, 0.26), c + Vector((0, 0.005, 0.27)), mat=ebony, bev=0.004)
    peg = geo.box(
        "pegbox",
        (0.04, 0.03, 0.14),
        c + Vector((0, 0.04, 0.44)),
        rot=(math.radians(-70), 0, 0),
        mat=gold_mat,
        bev=0.004,
    )
    for k in range(4):
        geo.cylinder(
            "peg",
            0.006,
            0.08,
            c + Vector((0, 0.05 + k * 0.03, 0.43 + k * 0.012)),
            rot=(0, math.pi / 2, 0),
            mat=ebony,
            verts=10,
        )
    silver = M.metal("string", (0.8, 0.78, 0.72), rough=(0.2, 0.3))
    for k in range(6):
        x = -0.012 + k * 0.005
        geo.tube(
            "string",
            [c + Vector((x, -0.006, -0.15)), c + Vector((x * 0.6, -0.022, 0.4))],
            0.0006,
            mat=silver,
            kind="POLY",
            resolution=1,
        )
    for dz in (0.3, -0.1):
        geo.tube(
            "wall-peg",
            [Vector((c.x + 0.12, slots.WALL, c.z + dz)), Vector((c.x + 0.12, c.y + 0.02, c.z + dz + 0.02))],
            0.01,
            mat=M.wood("peg-wood", (0.05, 0.03, 0.02), (0.1, 0.06, 0.035)),
            kind="POLY",
        )
    _ = sb, peg, random
