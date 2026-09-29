"""Lighting slot: two fixtures hanging at lighting.LAMPS."""

from __future__ import annotations

import math
import random

import bmesh
import bpy
from mathutils import Vector

from .. import core, geo, lighting, slots
from .. import materials as M
from . import common, item
from .counter import soft_glow, sphere

CEIL_PLASTER = slots.CEILING + 0.18


def torus(name, center, R, r, mat, rot=(0, 0, 0), segs=48, rings=10):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    grid = []
    for i in range(segs):
        u = 2 * math.pi * i / segs
        row = []
        for j in range(rings):
            v = 2 * math.pi * j / rings
            row.append(
                bm.verts.new(
                    ((R + r * math.cos(v)) * math.cos(u), (R + r * math.cos(v)) * math.sin(u), r * math.sin(v))
                )
            )
        grid.append(row)
    for i in range(segs):
        for j in range(rings):
            bm.faces.new(
                (grid[i][j], grid[(i + 1) % segs][j], grid[(i + 1) % segs][(j + 1) % rings], grid[i][(j + 1) % rings])
            )
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    ob.location = center
    ob.rotation_euler = rot
    return core.link(ob)


def finish_fixture(objs_before):
    """Fixtures never block the room's lamp light (that light is in every render)."""
    for ob in core.objects_in(core.current()):
        if ob.type != "LIGHT" and ob.name not in objs_before:
            common.no_shadow(ob)


@item("lights-candles", "lights")
def candle_stubs():
    iron = common.iron()
    wax = M.wax("wax-old", (0.8, 0.7, 0.5))
    for f, lamp in enumerate(slots.LAMPS):
        rnd = random.Random(40 + f)
        ring_z = lamp.z - 0.05
        torus(f"ring-{f}", Vector((lamp.x, lamp.y, ring_z)), 0.13, 0.007, iron)
        hook = Vector((lamp.x, lamp.y, ring_z + 0.32))
        for k in range(3):
            a = 2 * math.pi * k / 3 + f * 0.6
            p = Vector((lamp.x + math.cos(a) * 0.13, lamp.y + math.sin(a) * 0.13, ring_z))
            common.chain(hook, p, link=0.022, thickness=0.0025, mat=iron)
            geo.lathe(
                "pan",
                [(0.0, 0.0), (0.028, 0.0), (0.032, 0.008), (0.03, 0.01), (0.0, 0.004)],
                p + Vector((0, 0, 0.004)),
                segments=24,
                mat=iron,
            )
            h = rnd.uniform(0.035, 0.08)
            common.candle(p + Vector((0, 0, 0.01)), height=h, radius=rnd.uniform(0.015, 0.02), wax=wax, seed=f * 10 + k)
            common.own_light(f"flame-{f}-{k}", p + Vector((0, 0, 0.03 + h)), 0.35, lighting.WARM_LAMP, radius=0.01)
        common.chain(Vector((lamp.x, lamp.y, CEIL_PLASTER)), hook, link=0.03, thickness=0.004, mat=iron)
    finish_fixture(set())


def hang(top_z: float, lamp: Vector, mat, link=0.03):
    common.chain(
        Vector((lamp.x, lamp.y, CEIL_PLASTER)), Vector((lamp.x, lamp.y, top_z)), link=link, thickness=0.004, mat=mat
    )


@item("lights-lanterns", "lights")
def brass_lanterns():
    brass = common.brass()
    glass = M.glass("lantern-glass", (0.95, 0.9, 0.8), rough=0.05, dirt=0.15)
    for f, lamp in enumerate(slots.LAMPS):
        c = Vector((lamp.x, lamp.y, lamp.z))
        r, h = 0.085, 0.2
        z0 = c.z - h * 0.45
        geo.lathe(
            "lantern-base",
            [(0.0, 0.0), (r * 1.15, 0.0), (r * 1.2, 0.02), (r * 1.05, 0.035), (0.0, 0.035)],
            Vector((c.x, c.y, z0 - 0.035)),
            segments=6,
            mat=brass,
            smooth=False,
        )
        geo.lathe(
            "lantern-roof",
            [(r * 1.25, 0.0), (r * 1.2, 0.012), (r * 0.5, 0.09), (0.02, 0.12), (0.0, 0.125)],
            Vector((c.x, c.y, z0 + h)),
            segments=6,
            mat=brass,
            smooth=False,
        )
        geo.lathe(
            "lantern-finial",
            [(0.0, 0.0), (0.014, 0.01), (0.012, 0.03), (0.0, 0.04)],
            Vector((c.x, c.y, z0 + h + 0.12)),
            segments=12,
            mat=brass,
        )
        for k in range(6):
            a = math.pi / 6 + k * math.pi / 3
            p = Vector((c.x + math.cos(a) * r, c.y + math.sin(a) * r, z0))
            geo.tube("lantern-post", [p, p + Vector((0, 0, h))], 0.005, mat=brass, kind="POLY")
            a2 = k * math.pi / 3
            geo.box(
                "pane",
                (0.004, r * 0.95, h * 0.94),
                (c.x + math.cos(a2) * r * 0.86, c.y + math.sin(a2) * r * 0.86, z0 + h / 2),
                rot=(0, 0, a2),
                mat=glass,
                bev=0.0,
            )
        common.candle(Vector((c.x, c.y, z0)), height=0.07, radius=0.016, seed=20 + f)
        common.own_light(f"lantern-{f}", Vector((c.x, c.y, z0 + 0.1)), 1.2, lighting.WARM_LAMP, radius=0.01)
        hang(z0 + h + 0.15, lamp, common.iron())
    finish_fixture(set())


def antler(base: Vector, direction: float, bone, length=0.34, rise=0.22, seed=0):
    """One antler beam with a few tines, growing outward then up. Returns the tip points."""
    rnd = random.Random(seed)
    out = Vector((math.cos(direction), math.sin(direction), 0.0))
    pts = [
        base,
        base + out * length * 0.35 + Vector((0, 0, rise * 0.1)),
        base + out * length * 0.75 + Vector((0, 0, rise * 0.5)),
        base + out * length + Vector((0, 0, rise)),
    ]
    geo.tube("antler", pts, 0.014, mat=bone, radii=[1.0, 0.85, 0.65, 0.35])
    tips = [pts[-1]]
    for t in (0.4, 0.7):
        root = base + out * length * t + Vector((0, 0, rise * t * t))
        side = Vector((-out.y, out.x, 0)) * rnd.uniform(-0.25, 0.25)
        tip = root + out * 0.05 + side * 0.3 + Vector((0, 0, rnd.uniform(0.1, 0.16)))
        geo.tube("tine", [root, (root + tip) / 2 + out * 0.02, tip], 0.009, mat=bone, radii=[1.0, 0.7, 0.3])
        tips.append(tip)
    return tips


def bone_mat():
    n = M.N("antler-bone")
    co = n.coord("Object")
    ridges = n.noise(
        n.vmath("MULTIPLY", co, (1.0, 1.0, 1.0)), scale=80.0, detail=4.0, rough=0.7, distortion=2.0
    ).outputs["Fac"]
    big = n.noise(co, scale=6.0, detail=3.0).outputs["Fac"]
    col = n.ramp(big, [(0.3, (0.42, 0.33, 0.22)), (0.7, (0.62, 0.53, 0.4))])
    col = n.mix(n.maprange(ridges, 0.4, 0.7, 0.0, 0.5), col, (0.18, 0.13, 0.08))
    return n.finish(n.principled(base=col, rough=0.6, sss=0.1, normal=n.bump(ridges, strength=0.6, distance=0.004)))


@item("lights-chandelier", "lights")
def antler_chandelier():
    bone = bone_mat()
    iron = common.iron()
    for f, lamp in enumerate(slots.LAMPS):
        hub = Vector((lamp.x, lamp.y, lamp.z - 0.1))
        geo.lathe(
            "hub",
            [(0.0, -0.05), (0.035, -0.04), (0.05, 0.0), (0.035, 0.04), (0.0, 0.05)],
            hub,
            segments=20,
            mat=M.wood("hub-wood", (0.04, 0.025, 0.015), (0.1, 0.06, 0.035), grain=60),
        )
        n = 5
        for k in range(n):
            tips = antler(hub, 2 * math.pi * k / n + f * 0.4, bone, seed=f * 10 + k)
            tip = tips[0]
            geo.lathe(
                "cup",
                [(0.0, 0.0), (0.018, 0.0), (0.02, 0.012), (0.0, 0.01)],
                tip + Vector((0, 0, -0.004)),
                segments=16,
                mat=iron,
            )
            common.candle(tip + Vector((0, 0, 0.006)), height=0.05, radius=0.012, seed=f * 30 + k)
        common.own_light(f"chandelier-{f}", hub + Vector((0, 0, 0.3)), 2.5, lighting.WARM_LAMP, radius=0.2)
        for k in range(3):
            a = 2 * math.pi * k / 3
            common.chain(
                Vector((lamp.x, lamp.y, lamp.z + 0.32)),
                hub + Vector((math.cos(a) * 0.04, math.sin(a) * 0.04, 0.04)),
                link=0.022,
                thickness=0.0025,
                mat=iron,
            )
        hang(lamp.z + 0.32, lamp, iron)
    finish_fixture(set())


@item("lights-fireflies", "lights")
def firefly_jars():
    glass = M.glass("jar-glass", (0.9, 0.95, 0.9), rough=0.03)
    cloth = M.fabric("jar-cloth", (0.35, 0.28, 0.18), sheen=0.3, weave=900)
    twine = M.matte("twine", (0.3, 0.22, 0.13), rough=0.9, bump=0.5, bump_scale=300)
    bug = M.glow("firefly", (0.75, 1.0, 0.25), 9.0)
    for f, lamp in enumerate(slots.LAMPS):
        rnd = random.Random(70 + f)
        base = Vector((lamp.x, lamp.y, lamp.z - 0.13))
        prof = [
            (0.0, 0.0),
            (0.06, 0.0),
            (0.068, 0.012),
            (0.07, 0.15),
            (0.06, 0.17),
            (0.045, 0.185),
            (0.047, 0.21),
            (0.0, 0.21),
        ]
        geo.lathe("jar", prof, base, segments=36, mat=glass)
        geo.lathe(
            "jar-cap",
            [(0.0, 0.225), (0.05, 0.215), (0.056, 0.2), (0.06, 0.18), (0.057, 0.175)],
            base,
            segments=24,
            mat=cloth,
        )
        geo.lathe("jar-string", [(0.049, 0.192), (0.05, 0.196), (0.049, 0.2)], base, segments=24, mat=twine)
        for _ in range(16):
            a, rr, z = rnd.uniform(0, 6.28), rnd.uniform(0.0, 0.05), rnd.uniform(0.02, 0.15)
            p = base + Vector((math.cos(a) * rr, math.sin(a) * rr, z))
            common.no_room_light(
                geo.lathe("firefly", [(0.0, -0.0065), (0.0065, 0.0), (0.0, 0.0065)], p, segments=10, mat=bug)
            )
        common.own_light(f"jar-{f}", base + Vector((0, 0, 0.09)), 0.5, (0.6, 1.0, 0.3), radius=0.05)
        haze = soft_glow("firefly-haze", (0.7, 1.0, 0.3), 1.6, 0.35)
        common.no_room_light(sphere(f"jar-haze-{f}", base + Vector((0, 0, 0.09)), 0.058, haze))
        geo.tube(
            "rope",
            [
                Vector((lamp.x, lamp.y, CEIL_PLASTER)),
                Vector((lamp.x + 0.01, lamp.y, lamp.z + 0.3)),
                base + Vector((0, 0, 0.225)),
            ],
            0.004,
            mat=twine,
        )
    finish_fixture(set())


def star_mesh(name, center, r_inner=0.07, r_point=0.16, mat=None):
    """A pierced paper star: an icosahedron with a pyramid on every face."""
    t = (1 + 5**0.5) / 2
    ico = [
        (-1, t, 0),
        (1, t, 0),
        (-1, -t, 0),
        (1, -t, 0),
        (0, -1, t),
        (0, 1, t),
        (0, -1, -t),
        (0, 1, -t),
        (t, 0, -1),
        (t, 0, 1),
        (-t, 0, -1),
        (-t, 0, 1),
    ]
    faces = [
        (0, 11, 5),
        (0, 5, 1),
        (0, 1, 7),
        (0, 7, 10),
        (0, 10, 11),
        (1, 5, 9),
        (5, 11, 4),
        (11, 10, 2),
        (10, 7, 6),
        (7, 1, 8),
        (3, 9, 4),
        (3, 4, 2),
        (3, 2, 6),
        (3, 6, 8),
        (3, 8, 9),
        (4, 9, 5),
        (2, 4, 11),
        (6, 2, 10),
        (8, 6, 7),
        (9, 8, 1),
    ]
    verts = [Vector(v).normalized() * r_inner for v in ico]  # built around the origin
    out_faces = []
    for a, b, c in faces:
        tip = (verts[a] + verts[b] + verts[c]).normalized() * r_point
        ti = len(verts)
        verts.append(tip)
        out_faces += [(a, b, ti), (b, c, ti), (c, a, ti)]
    return geo.mesh(name, verts, out_faces, mat=mat, loc=center)


def star_paper(glow_col=(1.0, 0.7, 0.35)):
    n = M.N("star-paper")
    co = n.coord("Object")
    holes = n.voronoi(co, scale=70.0).outputs["Distance"]
    pierce = n.maprange(holes, 0.0, 0.12, 1.0, 0.0)
    fibre = n.noise(co, scale=200.0, detail=3.0).outputs["Fac"]
    paper = n.principled(
        base=n.mix(n.maprange(fibre, 0.3, 0.7, 0.0, 0.3), (0.95, 0.88, 0.7), (0.8, 0.7, 0.5)),
        rough=0.8,
        sss=0.8,
        sss_radius=(1.0, 0.8, 0.5),
        sss_scale=0.05,
    )
    glow = n.emission(glow_col, n.maprange(fibre, 0.0, 1.0, 0.5, 0.9))
    lit = n.shader_mix(0.45, paper, glow)
    hole = n.emission((1.0, 0.85, 0.55), 6.0)
    return n.finish(n.shader_mix(pierce, lit, hole))


@item("lights-stars", "lights")
def star_lanterns():
    paper = star_paper()
    iron = common.iron()
    for f, lamp in enumerate(slots.LAMPS):
        c = Vector((lamp.x, lamp.y, lamp.z))
        ob = star_mesh(f"star-{f}", c, mat=paper)
        ob.rotation_euler = (0.3 + f * 0.5, 0.2, f * 0.7)
        common.no_room_light(ob)
        geo.lathe(
            "star-cap",
            [(0.0, 0.0), (0.02, 0.0), (0.016, 0.03), (0.0, 0.035)],
            c + Vector((0, 0, 0.155)),
            segments=12,
            mat=common.brass(),
        )
        hang(lamp.z + 0.19, lamp, iron)
        common.own_light(f"star-{f}", c + Vector((0, -0.25, 0.0)), 2.0, (1.0, 0.9, 0.7), radius=0.1)
    finish_fixture(set())
