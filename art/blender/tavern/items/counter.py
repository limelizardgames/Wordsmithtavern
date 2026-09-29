"""Counter slot: props standing on the bar top around slots.COUNTER (close to the camera)."""

from __future__ import annotations

import math
import random

import bpy
from mathutils import Vector

from .. import core, geo, lighting, slots, textures
from .. import materials as M
from . import common, item

C = slots.COUNTER
TOP = slots.BAR_Z


def label_patch(name, img, center: Vector, radius: float, height: float, arc: float, mat):
    """A label wrapped round a cylinder (facing the camera), with UVs across it."""
    segs, rows = 24, 6
    verts, faces = [], []
    for j in range(rows + 1):
        for i in range(segs + 1):
            a = -math.pi / 2 - arc / 2 + arc * i / segs
            verts.append((radius * math.cos(a), radius * math.sin(a), -height / 2 + height * j / rows))
    for j in range(rows):
        for i in range(segs):
            a = j * (segs + 1) + i
            faces.append((a, a + 1, a + segs + 2, a + segs + 1))
    ob = geo.mesh(name, verts, faces, mat=mat, loc=center, smooth=True)
    me = ob.data
    uv = me.uv_layers.new(name="UVMap")
    for loop in me.loops:
        idx = loop.vertex_index
        i, j = idx % (segs + 1), idx // (segs + 1)
        uv.data[loop.index].uv = (i / segs, j / rows)
    return ob


@item("tip-jar", "counter")
def tip_jar():
    c = C + Vector((0.0, 0.02, TOP - C.z))
    glass = M.glass("jar-glass-thick", (0.88, 0.94, 0.9), rough=0.02, dirt=0.08)
    r, h = 0.07, 0.19
    prof = [
        (0.0, 0.0),
        (r * 0.95, 0.0),
        (r, 0.01),
        (r, h * 0.8),
        (r * 0.8, h * 0.9),
        (r * 0.72, h * 0.93),
        (r * 0.74, h),
        (r * 0.7, h),
        (r * 0.68, h * 0.94),
        (r * 0.76, h * 0.9),
        (r * 0.94, h * 0.8),
        (r * 0.94, 0.012),
        (0.0, 0.012),
    ]
    geo.lathe("tip-jar", prof, c, segments=48, mat=glass)
    img = textures.image("tip-label")
    label_patch("tip-label", img, c + Vector((0, 0, h * 0.42)), r + 0.0015, 0.055, 2.2, M.paper("tip-label-paper", img))
    twine = M.matte("jar-twine", (0.35, 0.25, 0.14), rough=0.9, bump=0.5, bump_scale=300)
    geo.lathe(
        "neck-twine", [(r * 0.75, h * 0.905), (r * 0.77, h * 0.915), (r * 0.75, h * 0.925)], c, segments=32, mat=twine
    )
    # The button.
    btn = M.matte("button-horn", (0.2, 0.12, 0.06), rough=0.35)
    b = c + Vector((0.01, 0.01, 0.018))
    geo.lathe(
        "button",
        [(0.0, 0.004), (0.012, 0.005), (0.016, 0.003), (0.016, 0.0), (0.0, 0.0)],
        b,
        rot=(0.2, 0.15, 0.0),
        segments=24,
        mat=btn,
    )
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        geo.cylinder(
            "button-hole",
            0.0018,
            0.008,
            b + Vector((math.cos(a) * 0.004, math.sin(a) * 0.004, 0.003)),
            mat=M.matte("hole", (0.01, 0.008, 0.006)),
            verts=8,
        )


def mist_shell(seed: int, strength: float = 3.0):
    """Swirling scrying mist on a shell: glowing where the swirl is, transparent elsewhere.
    Partly opaque where it glows, so the glow survives straight-alpha export."""
    n = M.N(f"scrying-mist-{seed}")
    co = n.vmath("ADD", n.coord("Object"), (seed * 1.7, seed * 0.3, seed * 2.9))
    swirl = n.noise(co, scale=26.0, detail=5.0, rough=0.6, distortion=4.0).outputs["Fac"]
    mask = n.maprange(swirl, 0.5, 0.72, 0.0, 0.8)
    col = n.ramp(swirl, [(0.5, (0.35, 0.22, 1.0)), (0.75, (0.85, 0.62, 1.0))])
    return n.finish(n.shader_mix(mask, n.node("ShaderNodeBsdfTransparent").outputs[0], n.emission(col, strength)))


def soft_glow(name: str, color, strength: float, opacity: float):
    n = M.N(name)
    lw = n.node("ShaderNodeLayerWeight", {"Blend": 0.5})
    centre = n.math("SUBTRACT", 1.0, lw.outputs["Facing"])
    mask = n.math("MULTIPLY", n.math("POWER", centre, 2.0), opacity)
    return n.finish(n.shader_mix(mask, n.node("ShaderNodeBsdfTransparent").outputs[0], n.emission(color, strength)))


def sphere(name, center, r, mat, segments=32):
    rings = 16
    prof = (
        [(0.0, -r)]
        + [(r * math.sin(math.pi * k / rings), -r * math.cos(math.pi * k / rings)) for k in range(1, rings)]
        + [(0.0, r)]
    )
    return geo.lathe(name, prof, center, segments=segments, mat=mat)


@item("crystal-ball", "counter")
def crystal_ball():
    c = C + Vector((0.0, 0.0, TOP - C.z))
    brass = common.brass()
    geo.lathe(
        "ball-stand",
        [
            (0.0, 0.0),
            (0.07, 0.0),
            (0.075, 0.01),
            (0.06, 0.02),
            (0.035, 0.035),
            (0.03, 0.05),
            (0.045, 0.06),
            (0.05, 0.065),
            (0.0, 0.065),
        ],
        c,
        segments=48,
        mat=brass,
    )
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.3
        p0 = c + Vector((math.cos(a) * 0.045, math.sin(a) * 0.045, 0.06))
        geo.tube(
            "claw",
            [
                p0,
                p0 + Vector((math.cos(a) * 0.03, math.sin(a) * 0.03, 0.04)),
                p0 + Vector((math.cos(a) * 0.022, math.sin(a) * 0.022, 0.085)),
            ],
            0.006,
            mat=brass,
            radii=[1.0, 0.8, 0.4],
        )
    ball_c = c + Vector((0, 0, 0.065 + 0.075))
    geo.lathe(
        "crystal",
        [(0.0, -0.075)]
        + [(0.075 * math.sin(math.pi * k / 24), -0.075 * math.cos(math.pi * k / 24)) for k in range(1, 24)]
        + [(0.0, 0.075)],
        ball_c,
        segments=64,
        mat=M.glass("crystal", (0.95, 0.95, 1.0), rough=0.0),
    )
    for k, r in enumerate((0.03, 0.045, 0.06)):
        shell = sphere(f"mist-{k}", ball_c, r, mist_shell(k))
        shell.rotation_euler = (0.4 * k, 0.9 * k, 0.3 * k)
        common.no_room_light(shell)
    common.no_room_light(sphere("mist-core", ball_c, 0.022, soft_glow("mist-core", (0.7, 0.5, 1.0), 4.0, 0.6)))
    common.own_light("ball-glow", ball_c + Vector((0, -0.12, 0.02)), 0.6, (0.55, 0.4, 1.0), radius=0.05)


@item("brass-register", "counter")
def brass_register():
    c = C + Vector((0.01, 0.03, TOP - C.z))
    brass = M.metal("register-brass", (0.5, 0.34, 0.13), rough=(0.3, 0.55), tarnish=(0.1, 0.07, 0.03), scale=60)
    wood = M.wood("drawer-wood", (0.025, 0.013, 0.007), (0.07, 0.038, 0.02), grain=90, varnish=0.5)
    geo.box("register-drawer", (0.24, 0.2, 0.05), c + Vector((0, 0, 0.025)), mat=wood, bev=0.004)
    body = geo.box("register-body", (0.22, 0.17, 0.13), c + Vector((0, 0.01, 0.115)), mat=brass, bev=0.008, segments=3)
    # Keyboard slope with three rows of keys.
    slope = geo.box(
        "register-slope",
        (0.2, 0.09, 0.02),
        c + Vector((0, -0.07, 0.15)),
        rot=(math.radians(-35), 0, 0),
        mat=brass,
        bev=0.004,
    )
    white = M.matte("key-enamel", (0.9, 0.87, 0.8), rough=0.25)
    for row in range(3):
        for col in range(6):
            x = c.x - 0.075 + col * 0.03
            y = c.y - 0.1 + row * 0.022
            z = c.z + 0.155 + row * 0.016
            geo.cylinder("key-stem", 0.003, 0.025, Vector((x, y, z)), mat=brass, verts=8)
            geo.cylinder("key-cap", 0.0085, 0.005, Vector((x, y, z + 0.014)), mat=white, verts=16, bev=0.001)
    top = geo.box("register-top", (0.16, 0.08, 0.06), c + Vector((0, 0.03, 0.21)), mat=brass, bev=0.006)
    geo.box(
        "register-window",
        (0.12, 0.004, 0.035),
        c + Vector((0, -0.012, 0.21)),
        mat=M.glass("register-glass", (0.9, 0.9, 0.85), rough=0.05),
        bev=0.0,
    )
    geo.box(
        "register-card",
        (0.1, 0.002, 0.022),
        c + Vector((0, -0.006, 0.21)),
        mat=M.matte("price-card", (0.85, 0.82, 0.72), rough=0.6),
        bev=0.0,
    )
    crest = geo.disc(
        "crest",
        lambda a: 0.05 * (0.7 + 0.3 * abs(math.cos(2 * a))) if math.sin(a) > -0.2 else 0.02,
        c + Vector((0, 0.03, 0.245)),
        rot=(math.pi / 2, 0, 0),
        thickness=0.008,
        mat=brass,
        segments=48,
    )
    geo.tube(
        "crank",
        [c + Vector((0.115, 0.02, 0.12)), c + Vector((0.14, 0.02, 0.12)), c + Vector((0.15, -0.02, 0.07))],
        0.005,
        mat=brass,
        kind="POLY",
    )
    geo.lathe(
        "crank-knob",
        [(0.0, 0.0), (0.008, 0.005), (0.008, 0.03), (0.0, 0.035)],
        c + Vector((0.15, -0.02, 0.07)),
        rot=(math.pi / 2, 0, 0),
        segments=12,
        mat=wood,
    )
    _ = body, slope, top, crest


@item("enchanted-quill", "counter")
def enchanted_quill():
    c = C + Vector((0.0, 0.02, TOP - C.z))
    img = textures.image("order-slip")
    slip = geo.grid(
        "order-slip",
        0.12,
        0.16,
        10,
        12,
        c + Vector((-0.03, 0.0, 0.002)),
        rot=(0, 0, math.radians(8)),
        mat=M.paper("slip-paper", img),
    )
    geo.displace(slip, strength=0.002, size=0.05)
    ink_glass = M.glass("inkwell", (0.3, 0.35, 0.4), rough=0.03)
    well = c + Vector((0.075, 0.03, 0.0))
    geo.lathe(
        "inkwell",
        [
            (0.0, 0.0),
            (0.035, 0.0),
            (0.038, 0.01),
            (0.036, 0.035),
            (0.02, 0.045),
            (0.015, 0.05),
            (0.017, 0.055),
            (0.0, 0.055),
        ],
        well,
        segments=36,
        mat=ink_glass,
    )
    geo.lathe(
        "ink", [(0.0, 0.028), (0.032, 0.028)], well, segments=24, mat=M.matte("ink", (0.005, 0.005, 0.01), rough=0.05)
    )
    # The quill hovers over the slip, mid-word, trailing sparkles.
    tip = c + Vector((-0.01, -0.02, 0.03))
    top = tip + Vector((0.07, 0.04, 0.2))
    shaft = geo.tube(
        "quill-shaft",
        [tip, tip.lerp(top, 0.5) + Vector((0.005, 0, 0.0)), top],
        0.0022,
        mat=M.matte("quill-shaft", (0.85, 0.82, 0.72), rough=0.3),
        radii=[0.5, 1.0, 0.6],
    )
    vane = M.N("feather")
    co = vane.coord("Object")
    barbs = vane.wave(co, scale=900.0, kind="BANDS", direction="DIAGONAL", distortion=1.0)
    colour = vane.mix(vane.maprange(barbs, 0.3, 0.7, 0.0, 0.3), (0.93, 0.9, 0.84), (0.6, 0.55, 0.48))
    vane_mat = vane.finish(
        vane.principled(
            base=colour, rough=0.6, sheen=0.6, sss=0.3, normal=vane.bump(barbs, strength=0.3, distance=0.0005)
        )
    )
    axis = (top - tip).normalized()
    side = axis.cross(Vector((0, -1, 0))).normalized()
    verts, faces = [], []
    n = 16
    for i in range(n + 1):
        t = 0.3 + 0.7 * i / n
        p = tip.lerp(top, t)
        width = 0.028 * math.sin(math.pi * min(1.0, (t - 0.3) / 0.7 * 0.95 + 0.05)) * (1.2 if i > n * 0.6 else 1.0)
        verts += [p - side * width * 0.55 + Vector((0, 0.004, 0)), p, p + side * width + Vector((0, 0.004, 0))]
    for i in range(n):
        a = i * 3
        faces += [(a, a + 1, a + 4, a + 3), (a + 1, a + 2, a + 5, a + 4)]
    geo.mesh("quill-vane", verts, faces, mat=vane_mat, smooth=True)
    sparkle = M.glow("sparkle", (1.0, 0.85, 0.5), 25.0)
    rnd = random.Random(5)
    for k in range(14):
        t = k / 14
        p = (
            tip
            + Vector((-0.06 * t, 0.01 * t, 0.01 + 0.06 * t * t))
            + Vector((rnd.uniform(-0.008, 0.008), 0, rnd.uniform(-0.008, 0.008)))
        )
        s = 0.0015 + 0.002 * (1 - t)
        common.no_room_light(geo.lathe("sparkle", [(0.0, -s), (s, 0.0), (0.0, s)], p, segments=6, mat=sparkle))
    common.own_light("quill-glow", tip + Vector((0, -0.05, 0.03)), 0.25, (1.0, 0.85, 0.5), radius=0.02)
    _ = shaft


@item("fizzlewick-grimoire", "counter")
def grimoire():
    c = C + Vector((0.0, 0.02, TOP - C.z))
    img = textures.image("spellbook-cover")
    cover = M.gilt_leather("grimoire-leather", img, leather=(0.07, 0.03, 0.06))
    w, d, t = 0.19, 0.25, 0.018
    yaw = math.radians(-14)
    parts = []
    parts.append(
        geo.box(
            "pages",
            (w - 0.008, d - 0.01, t - 0.004),
            c + Vector((0.003, 0, t / 2)),
            mat=M.matte("page-edges", (0.8, 0.72, 0.56), rough=0.8, bump=0.5, bump_scale=2000),
            bev=0.001,
        )
    )
    back = geo.box("back-cover", (w, d, 0.003), c + Vector((0, 0, 0.0015)), mat=cover, bev=0.001)
    front = geo.grid("front-cover", w, d, 2, 2, c + Vector((0, 0, t + 0.0005)), mat=cover)
    geo.box(
        "front-board",
        (w, d, 0.003),
        c + Vector((0, 0, t - 0.0012)),
        mat=M.matte("board-edge", (0.06, 0.025, 0.05), rough=0.5),
        bev=0.001,
    )
    geo.box("spine", (0.012, d, t + 0.002), c + Vector((-w / 2, 0, t / 2)), mat=cover, bev=0.004)
    brass = common.brass()
    for sx in (-1, 1):
        for sy in (-1, 1):
            corner = [(0.0, 0.0, 0.0), (0.03, 0.0, 0.0), (0.0, 0.03, 0.0)]
            ob = geo.mesh(
                "corner",
                [(x * -sx, y * -sy, z) for x, y, z in corner],
                [(0, 1, 2)],
                mat=brass,
                loc=c + Vector((sx * (w / 2 - 0.002), sy * (d / 2 - 0.002), t + 0.0015)),
            )
            geo.solidify(ob, 0.002)
    geo.box("clasp", (0.03, 0.022, 0.004), c + Vector((w / 2 - 0.005, 0, t / 2 + 0.002)), mat=brass, bev=0.001)
    for ob in list(bpy.data.collections[core.current()].objects):
        rel = ob.location - c
        ob.location = c + Vector(
            (rel.x * math.cos(yaw) - rel.y * math.sin(yaw), rel.x * math.sin(yaw) + rel.y * math.cos(yaw), rel.z)
        )
        ob.rotation_euler.z += yaw
    _ = parts, back, front


@item("royal-seal", "counter")
def royal_seal():
    c = C + Vector((0.0, 0.04, TOP - C.z))
    img = textures.image("certificate")
    w = 0.15
    h = w * img.size[1] / img.size[0]
    tilt = math.radians(14)
    wood = M.wood("easel", (0.05, 0.03, 0.017), (0.13, 0.08, 0.045), grain=90, varnish=0.4)
    centre = c + Vector((0, 0.02, h / 2 + 0.02))
    frame = geo.moulding(
        "cert-frame",
        w + 0.04,
        h + 0.04,
        [(0.0, 0.0), (0.0, 0.012), (0.006, 0.016), (0.02, 0.012), (0.02, 0.0)],
        centre,
        rot=(math.pi / 2 - tilt, 0, 0),
        mat=wood,
    )
    paper = geo.grid(
        "certificate",
        w,
        h,
        2,
        2,
        centre + Vector((0, 0.001, 0)),
        rot=(math.pi / 2 - tilt, 0, 0),
        mat=M.paper("certificate-paper", img),
    )
    geo.box(
        "easel-leg",
        (0.012, 0.012, h + 0.02),
        c + Vector((0, 0.08, h / 2)),
        rot=(math.radians(-20), 0, 0),
        mat=wood,
        bev=0.002,
    )
    geo.box("easel-ledge", (w + 0.04, 0.02, 0.012), c + Vector((0, 0.005, 0.02)), mat=wood, bev=0.002)
    # Red wax seal with ribbons, fixed to the lower right of the certificate.
    wax = M.matte("sealing-wax", (0.45, 0.02, 0.02), rough=0.3, sss=0.2, bump=0.4, bump_scale=120)
    seal_at = centre + Vector((0.045, -0.018, -h * 0.32))
    for sx in (-1, 1):
        geo.box(
            "ribbon",
            (0.012, 0.002, 0.05),
            seal_at + Vector((sx * 0.01, 0.002, -0.025)),
            rot=(0, sx * 0.3, 0),
            mat=M.fabric("ribbon", (0.08, 0.12, 0.45), sheen=0.9, weave=4000),
            bev=0.0,
        )
    geo.disc(
        "seal",
        lambda a: 0.018 * (1.0 + 0.08 * math.sin(7 * a)),
        seal_at,
        rot=(math.pi / 2 - tilt, 0, 0),
        thickness=0.005,
        mat=wax,
        segments=48,
    )
    _ = frame, paper, lighting
