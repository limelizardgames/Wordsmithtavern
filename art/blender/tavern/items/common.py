"""Shared pieces: fire, candles, chains, and lights that only light their own item.

Compositing rule: an item layer can darken the room (shadows are caught on the room surfaces)
but cannot brighten it. So light that reaches the room lives in lighting.py for every render,
and an item's own lamps are light-linked to the item only.
"""

from __future__ import annotations

import math
import random

import bpy
from mathutils import Vector

from .. import core, geo, lighting
from .. import materials as M


def own_light(name, loc, power, color, radius=0.05):
    """A point light that lights only the item being built (not the room)."""
    ob = lighting.point(name, loc, power, color, radius=radius, col=core.current())
    ob.light_linking.receiver_collection = bpy.data.collections[core.current()]
    return ob


def no_room_light(obj):
    """Emissive parts: glow for the camera and in reflections, but don't light the room."""
    obj.visible_diffuse = False
    obj.visible_shadow = False
    return obj


def no_shadow(obj):
    obj.visible_shadow = False
    return obj


# ── Materials used by several items ───────────────────────────────────────────────────────────
def iron():
    return M.metal("iron", (0.045, 0.043, 0.04), rough=(0.45, 0.75), tarnish=(0.02, 0.018, 0.016), scale=25)


def brass():
    return M.metal("brass", (0.72, 0.5, 0.2), rough=(0.22, 0.42), tarnish=(0.2, 0.14, 0.06), scale=35)


def pewter():
    return M.metal("pewter", (0.42, 0.42, 0.41), rough=(0.3, 0.55), tarnish=(0.12, 0.12, 0.12), scale=30)


def log_mat():
    n = M.N("log")
    co = n.coord("Object")
    bark_v = n.vmath("MULTIPLY", co, (1.0, 1.0, 0.18))
    bark = n.noise(bark_v, scale=40.0, detail=6.0, rough=0.7, distortion=0.6).outputs["Fac"]
    char = n.noise(co, scale=7.0, detail=5.0, rough=0.6).outputs["Fac"]
    cracks = n.noise(
        n.vmath("MULTIPLY", co, (1.0, 1.0, 0.35)), scale=22.0, detail=3.0, rough=0.5, distortion=1.2
    ).outputs["Fac"]
    crack = n.math("MULTIPLY", n.maprange(cracks, 0.47, 0.5, 0.0, 1.0), n.maprange(cracks, 0.5, 0.53, 1.0, 0.0))
    col = n.mix(n.maprange(char, 0.35, 0.6, 0.0, 1.0), (0.075, 0.05, 0.035), (0.012, 0.01, 0.009))
    col = n.mix(n.maprange(bark, 0.3, 0.7, 0.0, 0.6), col, (0.02, 0.015, 0.012))
    pos = n.node("ShaderNodeNewGeometry").outputs["Position"]
    _, _, wz = n.xyz(pos)
    low = n.maprange(wz, lighting.FIRE.z - 0.15, lighting.FIRE.z - 0.07, 1.0, 0.0)
    hot = n.math("MULTIPLY", n.math("MULTIPLY", crack, n.maprange(char, 0.4, 0.6, 0.0, 1.0)), low)
    ember = n.ramp(
        n.noise(co, scale=30.0, detail=3.0).outputs["Fac"], [(0.3, (1.0, 0.16, 0.02)), (0.7, (1.0, 0.42, 0.06))]
    )
    bsdf = n.principled(
        base=col,
        rough=0.9,
        normal=n.bump(n.math("SUBTRACT", n.math("ADD", bark, char), crack), strength=0.9, distance=0.01),
    )
    em = n.emission(ember, n.math("MULTIPLY", hot, 3.5))
    add = n.node("ShaderNodeAddShader")
    n.put(add.inputs[0], bsdf)
    n.put(add.inputs[1], em)
    return n.finish(add.outputs[0])


def fire_volume_mat(strength=22.0, seed=0.0):
    """Flames as glowing gas: rising, stretched noise inside a box, hotter near the base."""
    n = M.N(f"fire-volume-{seed:g}")
    g = n.coord("Generated")
    gx, gy, gz = n.xyz(g)
    cx = n.math("SUBTRACT", gx, 0.5)
    cy = n.math("SUBTRACT", gy, 0.5)
    width = n.maprange(gz, 0.0, 1.0, 0.46, 0.08)
    radial = n.math(
        "DIVIDE",
        n.math("SQRT", n.math("ADD", n.math("MULTIPLY", cx, cx), n.math("MULTIPLY", n.math("MULTIPLY", cy, cy), 1.6))),
        width,
    )
    nv = n.combine(
        n.math("MULTIPLY", gx, 5.0), n.math("MULTIPLY", gy, 5.0), n.math("ADD", n.math("MULTIPLY", gz, 1.6), seed)
    )
    tongues = n.noise(nv, scale=1.2, detail=6.0, rough=0.62, distortion=1.8).outputs["Fac"]
    shape = n.math(
        "SUBTRACT", n.math("SUBTRACT", tongues, n.math("MULTIPLY", gz, 0.62)), n.math("MULTIPLY", radial, 0.42)
    )
    flame = n.maprange(shape, -0.02, 0.22, 0.0, 1.0)
    heat = n.math("MULTIPLY", flame, n.maprange(gz, 0.0, 1.0, 1.0, 0.45))
    col = n.ramp(
        heat, [(0.0, (0.55, 0.06, 0.005)), (0.35, (1.0, 0.24, 0.02)), (0.7, (1.0, 0.5, 0.1)), (1.0, (1.0, 0.72, 0.3))]
    )
    em = n.emission(col, n.math("MULTIPLY", n.math("POWER", heat, 1.6), strength))
    return n.finish(n.node("ShaderNodeBsdfTransparent").outputs[0], volume=em)


def embers_mat():
    n = M.N("embers")
    co = n.coord("Object")
    lumps = n.voronoi(co, scale=55.0, randomness=1.0)
    speck = n.maprange(lumps.outputs["Distance"], 0.0, 0.35, 1.0, 0.0)
    nz = n.noise(co, scale=14.0, detail=5.0, rough=0.6).outputs["Fac"]
    heat = n.math("MULTIPLY", speck, n.maprange(nz, 0.45, 0.7, 0.0, 1.0))
    col = n.ramp(heat, [(0.0, (0.02, 0.015, 0.012)), (0.4, (0.55, 0.06, 0.008)), (1.0, (1.0, 0.4, 0.05))])
    em = n.emission(col, n.math("MULTIPLY", heat, 7.0))
    bsdf = n.principled(
        base=n.mix(n.maprange(nz, 0.3, 0.7, 0.0, 1.0), (0.1, 0.095, 0.09), (0.02, 0.018, 0.016)), rough=0.95
    )
    return n.finish(n.shader_mix(n.maprange(heat, 0.05, 0.35, 0.0, 1.0), bsdf, em))


def ash_mat():
    n = M.N("ash")
    co = n.coord("Object")
    nz = n.noise(co, scale=25.0, detail=5.0, rough=0.65).outputs["Fac"]
    col = n.ramp(nz, [(0.35, (0.02, 0.018, 0.016)), (0.6, (0.09, 0.085, 0.08)), (0.75, (0.22, 0.21, 0.2))])
    return n.finish(n.principled(base=col, rough=1.0, normal=n.bump(nz, strength=0.6, distance=0.01)))


# ── Fire ──────────────────────────────────────────────────────────────────────────────────────
def flame_shell(name, base: Vector, height: float, radius: float, lean=(0.0, 0.0), twist=0.0, strength=11.0):
    prof = [
        (0.0, 0.0),
        (radius * 0.75, height * 0.08),
        (radius, height * 0.25),
        (radius * 0.8, height * 0.5),
        (radius * 0.45, height * 0.75),
        (radius * 0.12, height * 0.95),
        (0.0, height),
    ]
    ob = geo.lathe(name, prof, base, segments=24, mat=M.flame(f"flame-{strength:g}", strength=strength))
    ob.rotation_euler = (lean[0], lean[1], twist)
    geo.displace(ob, strength=radius * 0.35, size=radius * 1.2, depth=1)
    return no_room_light(ob)


def fire(center: Vector, size: float = 1.0, logs: int = 3, flames: int = 6, seed: int = 3):
    rnd = random.Random(seed)
    lm = log_mat()
    for i in range(logs):
        ang = math.radians(rnd.uniform(-25, 25)) + (i % 2) * math.radians(rnd.uniform(-8, 8))
        r = rnd.uniform(0.045, 0.065) * size
        length = rnd.uniform(0.42, 0.55) * size
        z = center.z - 0.17 * size + r + (0.07 * size if i == logs - 1 and logs > 2 else 0.0)
        y = center.y + rnd.uniform(-0.06, 0.06) * size
        x = center.x + rnd.uniform(-0.05, 0.05) * size
        ob = geo.cylinder(
            f"log-{i}",
            r,
            length,
            (x, y, z),
            rot=(0, math.pi / 2, ang if i < 2 else rnd.uniform(-0.5, 0.5)),
            verts=14,
            mat=lm,
        )
        if i == logs - 1 and logs > 2:
            ob.rotation_euler = (
                math.radians(rnd.uniform(-10, 10)),
                math.pi / 2 - math.radians(12),
                math.pi / 2 + rnd.uniform(-0.3, 0.3),
            )
        geo.displace(ob, strength=0.008, size=0.05, subdivide=1)
    floor_z = center.z - 0.17 * size
    bed = geo.lathe(
        "ember-bed",
        [(0.0, 0.03 * size), (0.12 * size, 0.022 * size), (0.22 * size, 0.008 * size), (0.27 * size, 0.0)],
        (center.x, center.y, floor_z + 0.004),
        segments=40,
        mat=embers_mat(),
    )
    bed.scale = (1.0, 0.55, 1.0)
    geo.displace(bed, strength=0.03 * size, size=0.04, depth=2, subdivide=2)
    no_room_light(bed)
    ash = geo.lathe(
        "ash",
        [(0.0, 0.012), (0.3 * size, 0.006), (0.42 * size, 0.0)],
        (center.x, center.y, floor_z + 0.002),
        segments=40,
        mat=ash_mat(),
    )
    ash.scale = (1.0, 0.5, 1.0)
    geo.displace(ash, strength=0.012, size=0.06, subdivide=2)
    # Flames: a volume of glowing gas above the logs.
    dom = geo.box(
        "flames",
        (0.5 * size, 0.28 * size, 0.7 * size),
        center + Vector((0, 0, 0.17 * size)),
        mat=fire_volume_mat(seed=seed * 1.7),
        bev=0.0,
    )
    no_room_light(dom)
    _ = flames
    # Light the fireplace itself from within (the room gets its firelight from lighting.py).
    own_light("fire-inner", center + Vector((0, -0.02, -0.03)), 60.0 * size, lighting.WARM_FIRE, radius=0.1)
    own_light("fire-inner-2", center + Vector((0, -0.12, 0.12)), 25.0 * size, (1.0, 0.55, 0.2), radius=0.15)


# ── Candles ───────────────────────────────────────────────────────────────────────────────────
def candle(base: Vector, height: float = 0.08, radius: float = 0.018, wax=None, lit=True, drip=True, seed=0):
    rnd = random.Random(seed)
    wax = wax or M.wax("wax")
    top = height
    prof = [
        (0.0, 0.0),
        (radius * 1.08, 0.0),
        (radius * 1.05, height * 0.1),
        (radius, height * 0.9),
        (radius * 0.97, top - 0.004),
        (radius * 0.75, top - 0.002),
        (radius * 0.35, top - 0.006),
        (0.0, top - 0.008),
    ]
    body = geo.lathe("candle", prof, base, segments=28, mat=wax)
    if drip:
        for _ in range(rnd.randint(1, 3)):
            a = rnd.uniform(0, 2 * math.pi)
            dl = rnd.uniform(0.25, 0.7) * height
            p0 = base + Vector((math.cos(a) * radius, math.sin(a) * radius, top - 0.004))
            geo.tube(
                "drip",
                [
                    p0,
                    p0 + Vector((math.cos(a) * 0.002, math.sin(a) * 0.002, -dl * 0.5)),
                    p0 + Vector((math.cos(a) * 0.0025, math.sin(a) * 0.0025, -dl)),
                ],
                0.0035,
                mat=wax,
                resolution=3,
            )
    geo.tube(
        "wick",
        [
            base + Vector((0, 0, top - 0.008)),
            base + Vector((0.001, 0, top + 0.004)),
            base + Vector((0.003, 0, top + 0.008)),
        ],
        0.0012,
        mat=M.matte("wick", (0.02, 0.018, 0.016)),
        resolution=2,
    )
    if lit:
        fl = flame_shell("candle-flame", base + Vector((0, 0, top + 0.004)), 0.032, 0.0065, strength=28.0)
        fl.modifiers.clear()
        halo = geo.lathe(
            "candle-halo",
            [(0.0, 0.0), (0.012, 0.012), (0.014, 0.03), (0.008, 0.045), (0.0, 0.052)],
            base + Vector((0, 0, top - 0.004)),
            segments=20,
            mat=M.flame("halo", strength=4.0),
        )
        no_room_light(halo)
    return body


# ── Hanging hardware ──────────────────────────────────────────────────────────────────────────
def chain(top: Vector, bottom: Vector, link=0.028, thickness=0.0035, mat=None):
    mat = mat or iron()
    d = bottom - top
    n = max(2, int(d.length / (link * 0.78)))
    for k in range(n):
        p = top + d * ((k + 0.5) / n)
        tor = bpy.data.meshes.new("link")
        import bmesh

        bm = bmesh.new()
        segs, rings = 10, 6
        R, r = link * 0.32, thickness
        verts = []
        for i in range(segs):
            u = 2 * math.pi * i / segs
            row = []
            for j in range(rings):
                v = 2 * math.pi * j / rings
                stretch = 1.4
                x = (R + r * math.cos(v)) * math.cos(u)
                z = (R + r * math.cos(v)) * math.sin(u) * stretch
                y = r * math.sin(v)
                row.append(bm.verts.new((x, y, z)))
            verts.append(row)
        for i in range(segs):
            for j in range(rings):
                bm.faces.new(
                    (
                        verts[i][j],
                        verts[(i + 1) % segs][j],
                        verts[(i + 1) % segs][(j + 1) % rings],
                        verts[i][(j + 1) % rings],
                    )
                )
        bm.to_mesh(tor)
        bm.free()
        ob = bpy.data.objects.new("link", tor)
        ob.location = p
        ob.rotation_euler = (0, 0, (k % 2) * math.pi / 2)
        tor.materials.append(mat)
        tor.shade_smooth()
        core.link(ob)
