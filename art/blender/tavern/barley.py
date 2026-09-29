"""Barley, the enchanted tankard: a wooden stave tankard with a living face, in five moods.

Built in local space (origin at the base, face towards -Y) and placed on the bar facing the
camera. Each mood is a separate collection "barley:<mood>".
"""

from __future__ import annotations

import math

import bpy
from mathutils import Matrix, Vector

from . import core, geo, lighting, slots
from . import materials as M
from .items import common
from .items.lights import torus

MOODS = ("neutral", "happy", "grumpy", "surprised", "sad")
R0, R1, H = 0.064, 0.057, 0.155  # radius at the foot and the rim, height
EYE_Z, EYE_X, EYE_R = 0.098, 0.022, 0.0125
MOUTH_Z = 0.058


def radius_at(z: float) -> float:
    return R0 + (R1 - R0) * max(0.0, min(1.0, z / H))


def on_surface(x: float, z: float, lift: float = 0.0) -> Vector:
    """A point on the front of the tankard (towards -Y) at height z, lifted off the wood."""
    r = radius_at(z) + lift
    return Vector((x, -math.sqrt(max(r * r - x * x, 1e-8)), z))


# ── Materials ────────────────────────────────────────────────────────────────────────────────
def stave_wood():
    n = M.N("barley-staves")
    co = n.coord("Object")
    _, _, z = n.xyz(co)
    ang = n.node("ShaderNodeTexGradient", {"Vector": co}, gradient_type="RADIAL").outputs["Fac"]
    staves = n.math("FRACT", n.math("MULTIPLY", ang, 14.0))
    stave_id = n.math("FLOOR", n.math("MULTIPLY", ang, 14.0))
    joint = n.math("ADD", n.maprange(staves, 0.0, 0.035, 1.0, 0.0), n.maprange(staves, 0.965, 1.0, 0.0, 1.0))
    grain_v = n.combine(n.math("MULTIPLY", ang, 180.0), n.math("MULTIPLY", z, 6.0), n.math("MULTIPLY", stave_id, 3.1))
    grain = n.noise(grain_v, scale=1.0, detail=6.0, rough=0.6, distortion=1.2).outputs["Fac"]
    streak = n.noise(
        n.combine(n.math("MULTIPLY", ang, 900.0), n.math("MULTIPLY", z, 20.0), stave_id), scale=1.0, detail=3.0
    ).outputs["Fac"]
    tint = n.node("ShaderNodeTexWhiteNoise", {"Vector": n.combine(stave_id, 0.0, 0.0)}, noise_dimensions="3D").outputs[
        "Value"
    ]
    col = n.ramp(
        n.math("ADD", n.math("MULTIPLY", grain, 0.7), n.math("MULTIPLY", streak, 0.3)),
        [(0.25, (0.05, 0.024, 0.01)), (0.5, (0.12, 0.062, 0.026)), (0.78, (0.23, 0.13, 0.055))],
    )
    col = n.hsv(col, s=0.9, v=n.maprange(tint, 0.0, 1.0, 0.75, 1.25))
    col = n.mix(n.math("MULTIPLY", joint, 0.85), col, (0.02, 0.01, 0.005))
    wear = n.noise(co, scale=30.0, detail=5.0).outputs["Fac"]
    col = n.mix(n.maprange(wear, 0.6, 0.75, 0.0, 0.3), col, (0.3, 0.19, 0.09))
    grime = n.noise(co, scale=8.0, detail=4.0).outputs["Fac"]
    col = n.mix(n.maprange(grime, 0.5, 0.75, 0.0, 0.45), col, (0.03, 0.015, 0.006))
    occ = n.ao(0.02)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.8, 0.0), col, (0.015, 0.008, 0.004))
    height = n.math("SUBTRACT", n.math("MULTIPLY", streak, 0.4), n.math("MULTIPLY", joint, 1.0))
    return n.finish(
        n.principled(
            base=col,
            rough=n.maprange(wear, 0.3, 0.8, 0.35, 0.6),
            coat=0.45,
            coat_rough=0.15,
            normal=n.bump(height, strength=0.4, distance=0.0015),
        )
    )


def carved_wood():
    """Darker, oiled wood for the eyelids, brows and lips."""
    return M.wood(
        "barley-carving",
        (0.07, 0.035, 0.014),
        (0.2, 0.1, 0.042),
        along="X",
        across="Z",
        grain=400,
        rough=(0.3, 0.5),
        varnish=0.5,
        dirt=0.3,
        tint=0.05,
    )


def eyeball():
    n = M.N("barley-eye")
    co = n.coord("Object")
    nrm = n.vmath("NORMALIZE", co)
    _, fy, _ = n.xyz(nrm)
    front = n.math("MULTIPLY", fy, -1.0)  # 1 straight ahead (-Y)
    iris = n.maprange(front, 0.72, 0.76, 0.0, 1.0)
    pupil = n.maprange(front, 0.9, 0.915, 0.0, 1.0)
    fibres = n.noise(n.vmath("MULTIPLY", nrm, (40.0, 40.0, 40.0)), scale=1.0, detail=4.0, distortion=2.0).outputs["Fac"]
    iris_col = n.ramp(
        n.math("ADD", n.maprange(front, 0.74, 0.92, 0.0, 0.6), n.math("MULTIPLY", fibres, 0.4)),
        [(0.0, (0.18, 0.08, 0.02)), (0.5, (0.55, 0.3, 0.06)), (1.0, (0.3, 0.14, 0.03))],
    )
    sclera = n.mix(n.maprange(front, 0.2, 0.72, 0.35, 0.0), (0.88, 0.85, 0.78), (0.6, 0.35, 0.3))
    col = n.mix(iris, sclera, iris_col)
    col = n.mix(pupil, col, (0.005, 0.004, 0.004))
    return n.finish(
        n.principled(
            base=col,
            rough=0.3,
            sss=n.math("SUBTRACT", 1.0, iris),
            sss_radius=(1.0, 0.5, 0.35),
            sss_scale=0.004,
            coat=1.0,
            coat_rough=0.02,
        )
    )


def foam():
    n = M.N("ale-foam")
    co = n.coord("Object")
    bubbles = n.voronoi(co, scale=260.0).outputs["Distance"]
    big = n.voronoi(co, scale=70.0).outputs["Distance"]
    col = n.mix(n.maprange(big, 0.0, 0.5, 0.0, 0.25), (0.92, 0.88, 0.76), (0.72, 0.6, 0.38))
    return n.finish(
        n.principled(
            base=col,
            rough=0.55,
            sss=0.6,
            sss_radius=(1.0, 0.85, 0.6),
            sss_scale=0.01,
            normal=n.bump(n.math("ADD", bubbles, n.math("MULTIPLY", big, 0.6)), strength=0.6, distance=0.002),
        )
    )


def mouth_dark():
    return M.matte("barley-mouth", (0.02, 0.006, 0.003), rough=0.6)


# ── Face parts ───────────────────────────────────────────────────────────────────────────────
MOOD = {
    #            upper lid (cover, tilt), lower lid cover, brow (lift, tilt), mouth
    "neutral": dict(lid=0.3, tilt=0.0, low=0.0, brow=(0.0, 0.0), mouth="smile-closed"),
    "happy": dict(lid=0.32, tilt=0.0, low=0.34, brow=(0.004, -0.15), mouth="grin"),
    "grumpy": dict(lid=0.5, tilt=0.35, low=0.08, brow=(-0.004, 0.45), mouth="frown"),
    "surprised": dict(lid=0.08, tilt=0.0, low=0.0, brow=(0.008, -0.1), mouth="o"),
    "sad": dict(lid=0.42, tilt=-0.3, low=0.0, brow=(0.002, -0.45), mouth="sad"),
}


def lid(center: Vector, cover: float, tilt: float, side: int, mat, lower=False):
    """A wooden eyelid: part of a shell just outside the eyeball, closing over `cover` of it."""
    if cover <= 0.01:
        return None
    r = EYE_R * 1.12
    a_end = math.pi * cover
    prof = [(r * math.sin(a), r * math.cos(a)) for a in [a_end * k / 10 for k in range(11)]]
    prof = [(0.0, r)] + prof[1:]
    ob = geo.lathe("eyelid", prof, center, segments=32, mat=mat, arc=0.5)
    # Lathe axis is +Z (the top of the eye); open half faces +Y (into the wood).
    ob.rotation_euler = (0, 0, math.pi)
    if lower:
        ob.rotation_euler = (math.pi, 0, 0)
    ob.rotation_euler.y = side * tilt
    geo.solidify(ob, 0.002, offset=1.0)
    return ob


def brow(center: Vector, lift: float, tilt: float, side: int, mat):
    z = center.z + EYE_R * 1.6 + lift
    inner, outer = center.x - side * 0.012, center.x + side * 0.014
    zi = z - tilt * 0.01
    zo = z + tilt * 0.01 * 0.6
    pts = [
        on_surface(inner, zi, 0.003),
        on_surface((inner + outer) / 2, (zi + zo) / 2 + 0.002, 0.004),
        on_surface(outer, zo, 0.003),
    ]
    return geo.tube("brow", pts, 0.0032, mat=mat, radii=[0.7, 1.0, 0.7])


def mouth(kind: str, lip_mat, dark):
    w = 0.024
    z = MOUTH_Z
    if kind in ("smile-closed", "frown"):
        bend = 0.006 if kind == "smile-closed" else -0.007
        pts = [
            on_surface(-w, z + bend, 0.0015),
            on_surface(-w / 2, z - bend * 0.2, 0.0015),
            on_surface(0.0, z - bend * 0.5, 0.0015),
            on_surface(w / 2, z - bend * 0.2, 0.0015),
            on_surface(w, z + bend, 0.0015),
        ]
        geo.tube("mouth-line", pts, 0.0028, mat=dark, radii=[0.6, 1.0, 1.0, 1.0, 0.6])
        geo.tube("lip", [p + Vector((0, -0.0015, -0.003)) for p in pts[1:-1]], 0.002, mat=lip_mat)
        return
    if kind == "grin":
        outline = (
            [(-w * 1.15, z + 0.004)]
            + [
                (w * 1.15 * math.cos(a), z + 0.004 - 0.02 * math.sin(a))
                for a in [math.pi - math.pi * k / 12 for k in range(1, 12)]
            ]
            + [(w * 1.15, z + 0.004)]
        )
    elif kind == "o":
        outline = [
            (0.011 * math.cos(a), z - 0.004 + 0.014 * math.sin(a)) for a in [2 * math.pi * k / 20 for k in range(20)]
        ]
    else:  # sad: a small downturned open mouth
        outline = [
            (w * 0.8 * math.cos(a), z - 0.006 + 0.007 * math.sin(a) - 0.006 * math.cos(a) ** 2)
            for a in [2 * math.pi * k / 20 for k in range(20)]
        ]
    pts = [on_surface(x, zz, 0.0012) for x, zz in outline]
    cx = sum(x for x, _ in outline) / len(outline)
    cz = sum(zz for _, zz in outline) / len(outline)
    verts = [on_surface(cx, cz, 0.0012)] + pts
    faces = [(0, 1 + k, 1 + (k + 1) % len(pts)) for k in range(len(pts))]
    geo.mesh("mouth-cavity", verts, faces, mat=dark, smooth=True)
    geo.tube("lip", pts + [pts[0]], 0.0026, mat=lip_mat, kind="POLY", resolution=3)
    if kind == "grin":
        tongue = geo.lathe(
            "tongue",
            [(0.0, 0.0), (0.009, 0.001), (0.01, 0.003), (0.0, 0.004)],
            on_surface(0.0, z - 0.011, 0.0005),
            rot=(math.pi / 2, 0, 0),
            segments=16,
            mat=M.matte("barley-tongue", (0.35, 0.05, 0.04), rough=0.35, sss=0.3),
        )
        tongue.scale = (1.3, 0.8, 1.0)


def build_one(mood: str, origin: Vector, yaw: float):
    wood = stave_wood()
    carve = carved_wood()
    iron = common.iron()
    prof = (
        [(0.0, 0.0), (R0, 0.0), (R0 + 0.002, 0.004), (R0 + 0.001, 0.01)]
        + [(radius_at(z), z) for z in (0.03, 0.08, 0.13)]
        + [(R1 + 0.002, H - 0.004), (R1 + 0.001, H), (R1 - 0.008, H), (R1 - 0.009, H - 0.02), (0.0, H - 0.02)]
    )
    geo.lathe("barley-body", prof, (0, 0, 0), segments=72, mat=wood)
    for z in (0.02, 0.132):
        r = radius_at(z)
        geo.lathe(
            "hoop",
            [
                (r + 0.0005, z - 0.007),
                (r + 0.0025, z - 0.006),
                (r + 0.003, z),
                (r + 0.0025, z + 0.006),
                (r + 0.0005, z + 0.007),
            ],
            (0, 0, 0),
            segments=72,
            mat=iron,
        )
    handle = [
        Vector((R0 - 0.004, 0.0, 0.035)),
        Vector((R0 + 0.035, 0.0, 0.04)),
        Vector((R0 + 0.048, 0.0, 0.085)),
        Vector((R0 + 0.035, 0.0, 0.125)),
        Vector((R1 - 0.002, 0.0, 0.128)),
    ]
    geo.tube("barley-handle", handle, 0.011, mat=wood, radii=[1.0, 0.9, 0.85, 0.9, 1.0])
    # A head of foam, spilling over the front rim.
    head = geo.lathe(
        "foam",
        [
            (0.0, H + 0.03),
            (0.03, H + 0.028),
            (0.05, H + 0.018),
            (R1 + 0.004, H + 0.004),
            (R1 + 0.003, H - 0.006),
            (R1 - 0.01, H - 0.01),
            (0.0, H - 0.01),
        ],
        (0, 0, 0),
        segments=64,
        mat=foam(),
    )
    geo.displace(head, strength=0.006, size=0.012, subdivide=1)
    geo.tube(
        "foam-drip",
        [
            on_surface(-0.028, H + 0.002, 0.002),
            on_surface(-0.03, H - 0.012, 0.003),
            on_surface(-0.03, H - 0.02, 0.0035),
        ],
        0.006,
        mat=foam(),
        radii=[1.3, 0.9, 1.25],
    )
    geo.lathe(
        "foam-drop",
        [(0.0, -0.007), (0.006, -0.004), (0.006, 0.0), (0.0, 0.004)],
        on_surface(-0.03, H - 0.024, 0.004),
        segments=16,
        mat=foam(),
    )
    # Face.
    spec = MOOD[mood]
    eye = eyeball()
    for side in (-1, 1):
        c = on_surface(side * EYE_X, EYE_Z, -0.006)
        ball = geo.lathe(
            "eye",
            [(0.0, -EYE_R)]
            + [(EYE_R * math.sin(math.pi * k / 16), -EYE_R * math.cos(math.pi * k / 16)) for k in range(1, 16)]
            + [(0.0, EYE_R)],
            c,
            segments=32,
            mat=eye,
        )
        ball.rotation_euler = (0, 0, 0)
        socket = torus(
            "socket", c + Vector((0, 0.002, 0)), EYE_R * 1.05, 0.0028, carve, rot=(math.pi / 2, 0, 0), segs=32, rings=8
        )
        lid(c, spec["lid"], spec["tilt"], side, carve)
        lid(c, spec["low"], -spec["tilt"] * 0.3, side, carve, lower=True)
        brow(c, spec["brow"][0], spec["brow"][1], side, carve)
        _ = socket
    mouth(spec["mouth"], carve, mouth_dark())
    # Place everything on the bar, turned to face the camera.
    bpy.context.view_layer.update()
    mw = Matrix.Translation(origin) @ Matrix.Rotation(yaw, 4, "Z")
    for ob in list(bpy.data.collections[core.current()].objects):
        if ob.parent is None:
            ob.matrix_world = mw @ ob.matrix_world


CAMERA = Vector((0.0, 0.0, core.CAM_Z))


def facing_yaw(at: Vector, eye: Vector = CAMERA) -> float:
    d = eye - at
    return math.atan2(d.x, -d.y)


def build(moods=MOODS):
    """All moods, placed on the bar for the scene camera."""
    at = slots.BARLEY
    yaw = facing_yaw(at)
    for mood in moods:
        with core.building(f"barley:{mood}"):
            build_one(mood, at, yaw)
            # A little extra warmth on Barley from the candle further down the bar.
            common.own_light(
                f"barley-key-{mood}", at + Vector((-0.35, -0.35, 0.3)), 2.5, lighting.WARM_LAMP, radius=0.08
            )
