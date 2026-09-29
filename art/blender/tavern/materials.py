"""Procedural materials. No image textures: everything is built from Cycles noise, so the
art can be regenerated anywhere from this repository alone."""

from __future__ import annotations

import bpy

Color = tuple[float, float, float]


class N:
    """A tiny node-graph builder so material recipes stay readable."""

    def __init__(self, name: str):
        self.mat = bpy.data.materials.new(name)
        self.mat.use_nodes = True
        self.nt = self.mat.node_tree
        self.nt.nodes.clear()
        self.out = self.nt.nodes.new("ShaderNodeOutputMaterial")

    # generic ------------------------------------------------------------------------------
    def node(self, kind: str, inputs: dict | None = None, **props):
        n = self.nt.nodes.new(kind)
        for k, v in props.items():
            setattr(n, k, v)
        for k, v in (inputs or {}).items():
            self.put(n.inputs[k], v)
        return n

    def put(self, socket, value):
        if isinstance(value, bpy.types.NodeSocket):
            self.nt.links.new(value, socket)
        elif isinstance(value, bpy.types.Node):
            self.nt.links.new(value.outputs[0], socket)
        else:
            dv = socket.default_value
            if isinstance(value, (tuple, list)) and hasattr(dv, "__len__") and len(dv) == 4 and len(value) == 3:
                value = tuple(value) + (1.0,)
            socket.default_value = value

    @staticmethod
    def sock(sockets, name: str, kind: str):
        for s in sockets:
            if s.name == name and s.type == kind:
                return s
        raise KeyError(f"{name}/{kind}")

    # inputs -------------------------------------------------------------------------------
    def coord(self, kind: str = "Object"):
        return self.node("ShaderNodeTexCoord").outputs[kind]

    def rand(self):
        return self.node("ShaderNodeObjectInfo").outputs["Random"]

    def xyz(self, v):
        n = self.node("ShaderNodeSeparateXYZ", {"Vector": v})
        return n.outputs["X"], n.outputs["Y"], n.outputs["Z"]

    def combine(self, x, y, z):
        return self.node("ShaderNodeCombineXYZ", {"X": x, "Y": y, "Z": z}).outputs[0]

    def vmath(self, op: str, a, b=None, scale=None):
        n = self.node("ShaderNodeVectorMath", operation=op)
        self.put(n.inputs[0], a)
        if b is not None:
            self.put(n.inputs[1], b)
        if scale is not None:
            self.put(n.inputs["Scale"], scale)
        return n.outputs["Vector"] if op not in ("DOT_PRODUCT", "LENGTH", "DISTANCE") else n.outputs["Value"]

    def math(self, op: str, a, b=0.0, clamp=False):
        n = self.node("ShaderNodeMath", operation=op, use_clamp=clamp)
        self.put(n.inputs[0], a)
        self.put(n.inputs[1], b)
        return n.outputs[0]

    def maprange(self, v, a0, a1, b0, b1, clamp=True):
        n = self.node(
            "ShaderNodeMapRange",
            {"Value": v, "From Min": a0, "From Max": a1, "To Min": b0, "To Max": b1},
            clamp=clamp,
        )
        return n.outputs["Result"]

    # textures -----------------------------------------------------------------------------
    def noise(self, v, scale=5.0, detail=4.0, rough=0.55, distortion=0.0, lac=2.0):
        n = self.node(
            "ShaderNodeTexNoise",
            {
                "Vector": v,
                "Scale": scale,
                "Detail": detail,
                "Roughness": rough,
                "Distortion": distortion,
                "Lacunarity": lac,
            },
        )
        return n

    def voronoi(self, v, scale=5.0, feature="F1", metric="EUCLIDEAN", randomness=1.0):
        return self.node(
            "ShaderNodeTexVoronoi",
            {"Vector": v, "Scale": scale, "Randomness": randomness},
            feature=feature,
            distance=metric,
        )

    def wave(
        self, v, scale=5.0, kind="BANDS", direction="Y", distortion=0.0, detail=2.0, detail_scale=1.0, profile="SIN"
    ):
        n = self.node(
            "ShaderNodeTexWave",
            {"Vector": v, "Scale": scale, "Distortion": distortion, "Detail": detail, "Detail Scale": detail_scale},
            wave_type=kind,
            wave_profile=profile,
        )
        if kind == "BANDS":
            n.bands_direction = direction
        else:
            n.rings_direction = direction
        return n.outputs["Fac"]

    def ramp(self, fac, stops: list[tuple[float, Color]]):
        n = self.node("ShaderNodeValToRGB")
        self.put(n.inputs["Fac"], fac)
        els = n.color_ramp.elements
        while len(els) < len(stops):
            els.new(0.5)
        for el, (pos, col) in zip(els, stops):
            el.position = pos
            el.color = tuple(col) + (1.0,)
        return n.outputs["Color"]

    def mix(self, fac, a, b, blend="MIX"):
        n = self.node("ShaderNodeMix", data_type="RGBA", blend_type=blend)
        self.put(self.sock(n.inputs, "Factor", "VALUE"), fac)
        self.put(self.sock(n.inputs, "A", "RGBA"), a)
        self.put(self.sock(n.inputs, "B", "RGBA"), b)
        return self.sock(n.outputs, "Result", "RGBA")

    def hsv(self, color, h=0.5, s=1.0, v=1.0):
        return self.node("ShaderNodeHueSaturation", {"Color": color, "Hue": h, "Saturation": s, "Value": v}).outputs[0]

    def ao(self, distance=0.2):
        n = self.node("ShaderNodeAmbientOcclusion", {"Distance": distance}, samples=8)
        return n.outputs["AO"]

    def bump(self, height, strength=0.3, distance=0.01, normal=None):
        n = self.node("ShaderNodeBump", {"Height": height, "Strength": strength, "Distance": distance})
        if normal is not None:
            self.put(n.inputs["Normal"], normal)
        return n.outputs["Normal"]

    # shaders ------------------------------------------------------------------------------
    def principled(self, **inputs):
        names = {
            "base": "Base Color",
            "metallic": "Metallic",
            "rough": "Roughness",
            "normal": "Normal",
            "ior": "IOR",
            "alpha": "Alpha",
            "sss": "Subsurface Weight",
            "sss_radius": "Subsurface Radius",
            "sss_scale": "Subsurface Scale",
            "spec": "Specular IOR Level",
            "transmission": "Transmission Weight",
            "coat": "Coat Weight",
            "coat_rough": "Coat Roughness",
            "sheen": "Sheen Weight",
            "sheen_rough": "Sheen Roughness",
            "sheen_tint": "Sheen Tint",
            "emission": "Emission Color",
            "emission_strength": "Emission Strength",
            "aniso": "Anisotropic",
        }
        n = self.node("ShaderNodeBsdfPrincipled")
        for k, v in inputs.items():
            self.put(n.inputs[names.get(k, k)], v)
        return n.outputs["BSDF"]

    def emission(self, color, strength=1.0):
        return self.node("ShaderNodeEmission", {"Color": color, "Strength": strength}).outputs[0]

    def shader_mix(self, fac, a, b):
        n = self.node("ShaderNodeMixShader")
        self.put(n.inputs[0], fac)
        self.put(n.inputs[1], a)
        self.put(n.inputs[2], b)
        return n.outputs[0]

    def finish(self, surface, volume=None, displacement=None):
        self.put(self.out.inputs["Surface"], surface)
        if volume is not None:
            self.put(self.out.inputs["Volume"], volume)
        if displacement is not None:
            self.put(self.out.inputs["Displacement"], displacement)
            self.mat.displacement_method = "BOTH"
        return self.mat


_cache: dict[str, bpy.types.Material] = {}


def cached(fn):
    def wrapper(name: str, *args, **kwargs):
        key = name
        if key not in _cache or _cache[key].name not in bpy.data.materials:
            _cache[key] = fn(name, *args, **kwargs)
        return _cache[key]

    return wrapper


def clear_cache():
    _cache.clear()


# ── Wood ─────────────────────────────────────────────────────────────────────────────────────
@cached
def wood(
    name: str,
    dark: Color,
    light: Color,
    *,
    along: str = "X",
    across: str = "Y",
    grain: float = 40.0,
    rough: tuple[float, float] = (0.55, 0.8),
    bump: float = 0.25,
    varnish: float = 0.0,
    tint: float = 0.12,
    dirt: float = 0.5,
    knots: float = 0.0,
    checks: float = 0.0,
    rings: float = 0.0,
):
    """Planks and beams. Grain runs along the object's local `along` axis. `dark`/`light` bound
    the tone; the grain itself only moves the colour a little, like real, aged wood."""
    n = N(name)
    co = n.coord("Object")
    r = n.rand()
    off = n.combine(n.math("MULTIPLY", r, 37.3), n.math("MULTIPLY", r, 13.1), n.math("MULTIPLY", r, 71.7))
    co = n.vmath("ADD", co, off)
    cx, cy, cz = n.xyz(co)
    comp = {"X": cx, "Y": cy, "Z": cz}
    depth_axis = ({"X", "Y", "Z"} - {along, across}).pop()
    a, b, c = comp[along], comp[across], comp[depth_axis]

    def stretched(k_along, k_across):
        return n.combine(
            n.math("MULTIPLY", a, k_along), n.math("MULTIPLY", b, k_across), n.math("MULTIPLY", c, k_across)
        )

    # Growth lines: long, gently wandering stripes.
    v = stretched(grain * 0.03, grain)
    warp = n.noise(stretched(0.8, 3.0), scale=1.0, detail=3.0, rough=0.5).outputs["Color"]
    vw = n.vmath("ADD", v, n.vmath("SCALE", n.vmath("SUBTRACT", warp, (0.5, 0.5, 0.5)), scale=grain * 0.08))
    lines = n.wave(
        vw, scale=0.12, kind="BANDS", direction="Y", distortion=3.0, detail=4.0, detail_scale=1.2, profile="SAW"
    )
    # Fine streaks and pores.
    streak = n.noise(stretched(grain * 0.08, grain * 5.0), scale=1.0, detail=5.0, rough=0.65).outputs["Fac"]
    # Tone drifting along the board.
    drift = n.noise(stretched(1.2, 6.0), scale=1.0, detail=3.0, rough=0.5).outputs["Fac"]
    tone = n.math(
        "ADD",
        n.math("MULTIPLY", lines, 0.35),
        n.math("ADD", n.math("MULTIPLY", streak, 0.4), n.math("MULTIPLY", drift, 0.25)),
    )
    col = n.ramp(tone, [(0.25, dark), (0.75, light)])
    if knots > 0:
        kv = n.voronoi(stretched(1.5, 9.0), scale=1.0, randomness=1.0)
        knot = n.maprange(kv.outputs["Distance"], 0.0, 0.06 * knots, 0.85, 0.0)
        col = n.mix(knot, col, tuple(x * 0.45 for x in dark))
    # Per-piece tint so neighbouring planks differ.
    col = n.hsv(
        col,
        h=n.maprange(r, 0, 1, 0.49, 0.51),
        s=n.maprange(r, 0, 1, 0.85, 1.1),
        v=n.maprange(r, 0, 1, 1 - tint, 1 + tint),
    )
    height = n.math("ADD", n.math("MULTIPLY", lines, 0.3), n.math("MULTIPLY", streak, 0.7))
    if checks > 0:
        ck = n.noise(stretched(grain * 0.02, grain * 1.6), scale=1.0, detail=2.0).outputs["Fac"]
        crack = n.maprange(ck, 0.5 - 0.012 * checks, 0.5, 0.0, 1.0)
        crack = n.math("MULTIPLY", crack, n.maprange(ck, 0.5, 0.5 + 0.012 * checks, 1.0, 0.0))
        col = n.mix(crack, col, (0.01, 0.007, 0.005))
        height = n.math("SUBTRACT", height, n.math("MULTIPLY", crack, 0.8))
    if rings > 0:
        # Mug rings and smudges on a bar top.
        rv = n.voronoi(n.coord("Object"), scale=7.0, randomness=1.0)
        ring = n.maprange(n.math("ABSOLUTE", n.math("SUBTRACT", rv.outputs["Distance"], 0.045)), 0.0, 0.004, 1.0, 0.0)
        pick = n.maprange(rv.outputs["Color"], 0.0, 1.0, 0.0, 1.0)
        ring = n.math("MULTIPLY", ring, n.math("GREATER_THAN", pick, 1.0 - rings))
        col = n.mix(n.math("MULTIPLY", ring, 0.35), col, tuple(x * 0.4 for x in dark))
    if dirt > 0:
        occ = n.ao(0.15)
        grime = n.noise(n.coord("Object"), scale=3.0, detail=5.0, rough=0.6).outputs["Fac"]
        amount = n.math("ADD", n.maprange(occ, 0.0, 1.0, dirt, 0.0), n.maprange(grime, 0.5, 0.8, 0.0, dirt * 0.35))
        col = n.mix(amount, col, tuple(x * 0.35 for x in dark))
    smudge = n.noise(n.coord("Object"), scale=4.0, detail=4.0).outputs["Fac"]
    roughness = n.maprange(
        n.math("ADD", n.math("MULTIPLY", streak, 0.6), n.math("MULTIPLY", smudge, 0.4)), 0.3, 0.7, rough[0], rough[1]
    )
    normal = n.bump(height, strength=bump, distance=0.003)
    bsdf = n.principled(
        base=col,
        rough=roughness,
        normal=normal,
        spec=0.4,
        coat=varnish,
        coat_rough=n.maprange(smudge, 0.3, 0.7, 0.05, 0.25),
    )
    return n.finish(bsdf)


# ── Walls ────────────────────────────────────────────────────────────────────────────────────
@cached
def plaster(name: str, base: Color = (0.74, 0.66, 0.52), dirt: Color = (0.42, 0.33, 0.22), soot: float = 0.35):
    """Limewash over lath. World coordinates, so neighbouring wall pieces join seamlessly."""
    n = N(name)
    co = n.node("ShaderNodeNewGeometry").outputs["Position"]
    big = n.noise(co, scale=1.1, detail=7.0, rough=0.65).outputs["Fac"]
    mid = n.noise(co, scale=5.0, detail=6.0, rough=0.62).outputs["Fac"]
    trowel = n.noise(
        n.vmath("MULTIPLY", co, (2.5, 1.0, 1.0)), scale=9.0, detail=3.0, rough=0.5, distortion=1.5
    ).outputs["Fac"]
    fine = n.noise(co, scale=90.0, detail=3.0, rough=0.6).outputs["Fac"]
    stain = n.maprange(n.math("ADD", n.math("MULTIPLY", big, 0.7), n.math("MULTIPLY", mid, 0.3)), 0.42, 0.74, 0.0, 0.85)
    col = n.mix(stain, base, dirt)
    col = n.mix(n.maprange(fine, 0.3, 0.7, 0.12, -0.08), col, (0.2, 0.16, 0.11))
    # Hairline cracks.
    cr = n.voronoi(
        n.vmath("ADD", co, n.vmath("SCALE", n.noise(co, scale=3.0, detail=4.0).outputs["Color"], scale=0.25)),
        scale=3.5,
        feature="DISTANCE_TO_EDGE",
    )
    crack = n.maprange(cr.outputs["Distance"], 0.0, 0.012, 1.0, 0.0)
    crack = n.math(
        "MULTIPLY", crack, n.maprange(n.noise(co, scale=2.0, detail=2.0).outputs["Fac"], 0.55, 0.65, 0.0, 1.0)
    )
    col = n.mix(n.math("MULTIPLY", crack, 0.7), col, (0.12, 0.09, 0.06))
    _, _, z = n.xyz(co)
    top = n.maprange(z, 1.1, 2.8, 0.0, soot)
    col = n.mix(n.math("MULTIPLY", top, n.maprange(mid, 0.3, 0.7, 0.6, 1.2)), col, (0.1, 0.075, 0.055))
    occ = n.ao(0.35)
    col = n.mix(n.maprange(occ, 0.2, 1.0, 0.65, 0.0), col, (0.07, 0.05, 0.035))
    height = n.math(
        "ADD",
        n.math("ADD", n.math("MULTIPLY", big, 0.35), n.math("MULTIPLY", trowel, 0.35)),
        n.math("MULTIPLY", fine, 0.3),
    )
    height = n.math("SUBTRACT", height, n.math("MULTIPLY", crack, 0.4))
    normal = n.bump(height, strength=0.7, distance=0.012)
    return n.finish(n.principled(base=col, rough=0.93, normal=normal, spec=0.3))


@cached
def stone(name: str, a: Color = (0.36, 0.33, 0.29), b: Color = (0.2, 0.18, 0.16), soot: float = 0.0):
    """Individual stones: colour varies per object, surface pitted and chipped."""
    n = N(name)
    co = n.coord("Object")
    r = n.rand()
    co = n.vmath("ADD", co, n.combine(n.math("MULTIPLY", r, 17.0), n.math("MULTIPLY", r, 5.0), 0.0))
    big = n.noise(co, scale=5.0, detail=6.0, rough=0.65).outputs["Fac"]
    vor = n.voronoi(co, scale=22.0).outputs["Distance"]
    fine = n.noise(co, scale=90.0, detail=2.0).outputs["Fac"]
    base = n.mix(r, a, b)
    col = n.mix(n.maprange(big, 0.3, 0.75, 0.0, 1.0), n.hsv(base, v=1.25), n.hsv(base, v=0.7))
    col = n.mix(n.maprange(vor, 0.0, 0.15, 0.5, 0.0), col, (0.1, 0.09, 0.08))
    if soot > 0:
        _, _, z = n.xyz(n.coord("Object"))
        col = n.mix(n.maprange(big, 0.4, 0.7, soot, soot * 0.4), col, (0.03, 0.025, 0.02))
    occ = n.ao(0.06)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.7, 0.0), col, (0.02, 0.018, 0.015))
    height = n.math(
        "ADD", n.math("MULTIPLY", big, 0.5), n.math("ADD", n.math("MULTIPLY", vor, 0.3), n.math("MULTIPLY", fine, 0.2))
    )
    normal = n.bump(height, strength=0.6, distance=0.01)
    return n.finish(n.principled(base=col, rough=n.maprange(fine, 0.2, 0.8, 0.75, 0.95), normal=normal))


@cached
def stone_wall(
    name: str,
    a: Color = (0.3, 0.27, 0.23),
    b: Color = (0.16, 0.145, 0.13),
    mortar: Color = (0.09, 0.083, 0.075),
    *,
    scale: float = 4.5,
    course: float = 1.6,
    depth: float = 0.035,
    soot: float = 0.0,
    soot_center=(0.0, 0.0, 0.0),
    soot_radius: float = 0.6,
    joint: float = 0.035,
):
    """Rubble masonry with true displacement: irregular stones from warped Voronoi cells.
    World coordinates, so faces of one chimney breast share one continuous stonework."""
    n = N(name)
    pos = n.node("ShaderNodeNewGeometry").outputs["Position"]
    warp = n.vmath(
        "SCALE", n.vmath("SUBTRACT", n.noise(pos, scale=2.2, detail=2.0).outputs["Color"], (0.5, 0.5, 0.5)), scale=0.14
    )
    p = n.vmath("MULTIPLY", n.vmath("ADD", pos, warp), (1.0, 1.0, course))
    vor_e = n.voronoi(p, scale=scale, feature="DISTANCE_TO_EDGE", randomness=0.95).outputs["Distance"]
    cell = n.voronoi(p, scale=scale, feature="F1", randomness=0.95).outputs["Color"]
    cr, cg, cb = n.xyz(cell)
    surface = n.noise(pos, scale=16.0, detail=8.0, rough=0.7).outputs["Fac"]
    chips = n.noise(pos, scale=70.0, detail=3.0, rough=0.6).outputs["Fac"]
    stone_mask = n.maprange(vor_e, joint * 0.5, joint * 1.9, 0.0, 1.0)
    bulge = n.math("ADD", 0.55, n.math("MULTIPLY", cr, 0.35))
    height = n.math(
        "MULTIPLY", stone_mask, n.math("ADD", bulge, n.math("MULTIPLY", n.math("SUBTRACT", surface, 0.5), 0.7))
    )
    height = n.math("ADD", height, n.math("MULTIPLY", chips, 0.08))
    col = n.mix(cg, a, b)
    col = n.hsv(
        col, h=n.maprange(cb, 0, 1, 0.47, 0.53), s=n.maprange(cr, 0, 1, 0.7, 1.2), v=n.maprange(cr, 0, 1, 0.75, 1.3)
    )
    col = n.mix(n.maprange(surface, 0.3, 0.7, 0.35, -0.2), col, (0.05, 0.045, 0.04))
    col = n.mix(n.maprange(chips, 0.6, 0.75, 0.0, 0.3), col, (0.5, 0.47, 0.42))
    mcol = n.mix(n.maprange(chips, 0.3, 0.7, 0.0, 1.0), mortar, tuple(c * 0.6 for c in mortar))
    col = n.mix(stone_mask, mcol, col)
    if soot > 0:
        d = n.vmath("DISTANCE", pos, soot_center)
        sm = n.math(
            "MULTIPLY",
            n.maprange(d, soot_radius * 0.3, soot_radius, soot, 0.0),
            n.maprange(surface, 0.25, 0.6, 1.0, 0.6),
        )
        col = n.mix(sm, col, (0.012, 0.01, 0.009))
    occ = n.ao(0.08)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.75, 0.0), col, (0.01, 0.009, 0.008))
    rough = n.maprange(surface, 0.3, 0.7, 0.78, 0.96)
    bsdf = n.principled(base=col, rough=rough, normal=n.bump(chips, strength=0.25, distance=0.003))
    disp = n.node("ShaderNodeDisplacement", {"Height": height, "Midlevel": 0.0, "Scale": depth})
    return n.finish(bsdf, displacement=disp.outputs[0])


@cached
def ashlar(
    name: str,
    a: Color = (0.42, 0.34, 0.24),
    b: Color = (0.3, 0.24, 0.17),
    mortar: Color = (0.24, 0.21, 0.17),
    *,
    block=(0.42, 0.21),
    depth: float = 0.012,
    soot: float = 0.0,
    soot_center=(0.0, 0.0, 0.0),
    soot_radius: float = 0.6,
    plane: str = "XZ",
):
    """Dressed stone in regular courses (sandstone by default), with tooled faces."""
    n = N(name)
    pos = n.node("ShaderNodeNewGeometry").outputs["Position"]
    px, py, pz = n.xyz(pos)
    u, v = {"XZ": (px, pz), "YZ": (py, pz), "XY": (px, py)}[plane]
    uv = n.combine(u, v, 0.0)
    brick = n.node(
        "ShaderNodeTexBrick",
        {
            "Vector": uv,
            "Color1": (1, 1, 1),
            "Color2": (0, 0, 0),
            "Mortar": (0, 0, 0),
            "Scale": 1.0,
            "Mortar Size": 0.012,
            "Mortar Smooth": 0.5,
            "Bias": 0.0,
            "Brick Width": block[0],
            "Row Height": block[1],
        },
        offset=0.5,
        offset_frequency=2,
        squash=1.0,
        squash_frequency=2,
    )
    tone = brick.outputs["Color"]
    mask = brick.outputs["Fac"]  # 1 in the joints
    stone = n.math("SUBTRACT", 1.0, mask)
    grain = n.noise(pos, scale=45.0, detail=6.0, rough=0.65).outputs["Fac"]
    big = n.noise(pos, scale=5.0, detail=4.0).outputs["Fac"]
    tool = n.wave(
        n.vmath("MULTIPLY", pos, (1.0, 1.0, 1.0)),
        scale=90.0,
        kind="BANDS",
        direction="DIAGONAL",
        distortion=3.0,
        detail=2.0,
    )
    col = n.mix(tone, b, a)
    col = n.mix(n.maprange(big, 0.3, 0.7, 0.0, 0.5), col, tuple(c * 0.7 for c in b))
    col = n.mix(n.maprange(grain, 0.3, 0.7, 0.25, -0.15), col, (0.08, 0.065, 0.05))
    col = n.mix(mask, col, mortar)
    if soot > 0:
        d = n.vmath("DISTANCE", pos, soot_center)
        col = n.mix(
            n.math(
                "MULTIPLY",
                n.maprange(d, soot_radius * 0.3, soot_radius, soot, 0.0),
                n.maprange(big, 0.2, 0.6, 1.0, 0.7),
            ),
            col,
            (0.015, 0.012, 0.01),
        )
    occ = n.ao(0.05)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.7, 0.0), col, (0.01, 0.009, 0.008))
    height = n.math(
        "ADD",
        n.math("MULTIPLY", stone, n.math("ADD", 0.8, n.math("MULTIPLY", grain, 0.2))),
        n.math("MULTIPLY", n.math("MULTIPLY", tool, stone), 0.06),
    )
    edge_wear = n.maprange(n.noise(pos, scale=25.0, detail=5.0).outputs["Fac"], 0.55, 0.7, 0.0, 1.0)
    col = n.mix(n.math("MULTIPLY", edge_wear, 0.4), col, tuple(c * 0.5 for c in b))
    bump_h = n.math("SUBTRACT", n.math("ADD", grain, n.math("MULTIPLY", tool, 0.4)), n.math("MULTIPLY", mask, 3.0))
    bsdf = n.principled(
        base=col, rough=n.maprange(grain, 0.3, 0.7, 0.7, 0.92), normal=n.bump(bump_h, strength=0.6, distance=0.004)
    )
    disp = n.node("ShaderNodeDisplacement", {"Height": height, "Midlevel": 0.0, "Scale": depth})
    return n.finish(bsdf, displacement=disp.outputs[0])


@cached
def mortar(name: str, color: Color = (0.3, 0.27, 0.23)):
    n = N(name)
    co = n.coord("Object")
    g = n.noise(co, scale=120.0, detail=3.0).outputs["Fac"]
    big = n.noise(co, scale=6.0, detail=4.0).outputs["Fac"]
    col = n.mix(n.maprange(big, 0.3, 0.7, 0.0, 0.6), color, tuple(c * 0.5 for c in color))
    occ = n.ao(0.05)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.8, 0.0), col, (0.02, 0.02, 0.02))
    return n.finish(n.principled(base=col, rough=0.97, normal=n.bump(g, strength=0.5, distance=0.004)))


# ── Metals, glass, misc ──────────────────────────────────────────────────────────────────────
@cached
def metal(
    name: str,
    color: Color,
    rough: tuple[float, float] = (0.3, 0.55),
    tarnish: Color | None = None,
    rust: float = 0.0,
    scale: float = 30.0,
):
    n = N(name)
    co = n.coord("Object")
    nz = n.noise(co, scale=scale, detail=5.0, rough=0.6).outputs["Fac"]
    fine = n.noise(co, scale=scale * 8, detail=2.0).outputs["Fac"]
    col = color
    metallic = 1.0
    roughness = n.maprange(nz, 0.3, 0.7, rough[0], rough[1])
    if tarnish is not None:
        occ = n.ao(0.04)
        col = n.mix(n.maprange(occ, 0.0, 1.0, 0.85, 0.0), col, tarnish)
        col = n.mix(n.maprange(nz, 0.45, 0.8, 0.0, 0.5), col, tarnish)
    if rust > 0:
        mask = n.maprange(
            n.noise(co, scale=scale * 0.4, detail=8.0, rough=0.7).outputs["Fac"],
            0.55 - rust * 0.2,
            0.62 - rust * 0.2,
            0.0,
            1.0,
        )
        rc = n.ramp(fine, [(0.0, (0.2, 0.07, 0.02)), (1.0, (0.45, 0.2, 0.07))])
        col = n.mix(mask, col, rc)
        metallic = n.maprange(mask, 0.0, 1.0, 1.0, 0.0)
        roughness = n.maprange(mask, 0.0, 1.0, rough[0], 0.95)
    normal = n.bump(n.math("ADD", nz, n.math("MULTIPLY", fine, 0.3)), strength=0.08, distance=0.002)
    return n.finish(n.principled(base=col, metallic=metallic, rough=roughness, normal=normal))


@cached
def glass(name: str, tint: Color = (0.9, 0.95, 0.92), rough: float = 0.02, dirt: float = 0.0):
    n = N(name)
    rough_in = rough
    if dirt > 0:
        g = n.noise(n.coord("Object"), scale=18.0, detail=4.0).outputs["Fac"]
        rough_in = n.maprange(g, 0.4, 0.75, rough, rough + dirt)
    return n.finish(n.principled(base=tint, rough=rough_in, ior=1.5, transmission=1.0, spec=0.5))


@cached
def matte(
    name: str,
    color: Color,
    rough: float = 0.7,
    sss: float = 0.0,
    sheen: float = 0.0,
    bump: float = 0.0,
    bump_scale: float = 40.0,
):
    n = N(name)
    normal = None
    if bump > 0:
        normal = n.bump(
            n.noise(n.coord("Object"), scale=bump_scale, detail=3.0).outputs["Fac"], strength=bump, distance=0.003
        )
    kw = dict(base=color, rough=rough, sss=sss, sheen=sheen)
    if normal is not None:
        kw["normal"] = normal
    if sss > 0:
        kw["sss_radius"] = (1.0, 0.45, 0.25)
        kw["sss_scale"] = 0.02
    return n.finish(n.principled(**kw))


@cached
def fabric(
    name: str, color: Color, sheen: float = 0.8, rough: float = 0.85, weave: float = 600.0, pattern_dark: float = 0.75
):
    n = N(name)
    co = n.coord("Object")
    wx = n.wave(co, scale=weave, kind="BANDS", direction="X")
    wz = n.wave(co, scale=weave, kind="BANDS", direction="Z")
    w = n.math("MULTIPLY", wx, wz)
    big = n.noise(co, scale=4.0, detail=4.0).outputs["Fac"]
    col = n.mix(n.maprange(big, 0.3, 0.7, 0.0, 0.5), color, tuple(c * pattern_dark for c in color))
    occ = n.ao(0.08)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.75, 0.0), col, tuple(c * 0.25 for c in color))
    return n.finish(
        n.principled(
            base=col, rough=rough, sheen=sheen, sheen_rough=0.4, normal=n.bump(w, strength=0.25, distance=0.001)
        )
    )


@cached
def wax(name: str, color: Color = (0.86, 0.78, 0.6)):
    n = N(name)
    g = n.noise(n.coord("Object"), scale=60.0, detail=3.0).outputs["Fac"]
    return n.finish(
        n.principled(
            base=color,
            rough=0.45,
            sss=0.7,
            sss_radius=(1.0, 0.6, 0.3),
            sss_scale=0.01,
            normal=n.bump(g, strength=0.1, distance=0.002),
        )
    )


@cached
def flame(name: str, strength: float = 18.0):
    """Candle and fire flames: bright core fading to transparent orange edges (use on thin shells)."""
    n = N(name)
    lw = n.node("ShaderNodeLayerWeight", {"Blend": 0.35})
    facing = n.math("SUBTRACT", 1.0, lw.outputs["Facing"])
    _, _, z = n.xyz(n.coord("Generated"))
    heat = n.math("MULTIPLY", facing, n.maprange(z, 0.0, 1.0, 1.0, 0.25))
    col = n.ramp(
        heat, [(0.0, (0.8, 0.12, 0.01)), (0.45, (1.0, 0.36, 0.05)), (0.8, (1.0, 0.6, 0.18)), (1.0, (1.0, 0.78, 0.42))]
    )
    em = n.emission(col, n.math("MULTIPLY", heat, strength))
    tr = n.node("ShaderNodeBsdfTransparent").outputs[0]
    alpha = n.maprange(heat, 0.05, 0.45, 0.0, 1.0)
    return n.finish(n.shader_mix(alpha, tr, em))


@cached
def glow(name: str, color: Color, strength: float = 5.0):
    n = N(name)
    return n.finish(n.emission(color, strength))


@cached
def night_sky(name: str):
    """Seen through the window: a moonlit, cloudy night with a scattering of stars."""
    n = N(name)
    co = n.node("ShaderNodeNewGeometry").outputs["Position"]
    _, _, z = n.xyz(co)
    col = n.ramp(
        n.maprange(z, 0.7, 2.3, 0.0, 1.0),
        [(0.0, (0.07, 0.1, 0.18)), (0.5, (0.035, 0.05, 0.1)), (1.0, (0.012, 0.018, 0.04))],
    )
    clouds = n.noise(n.vmath("MULTIPLY", co, (0.8, 1.0, 2.2)), scale=2.2, detail=6.0, rough=0.6).outputs["Fac"]
    col = n.mix(n.maprange(clouds, 0.5, 0.75, 0.0, 0.55), col, (0.12, 0.14, 0.2))
    stars = n.voronoi(co, scale=60.0, randomness=1.0)
    star = n.maprange(stars.outputs["Distance"], 0.0, 0.035, 1.0, 0.0)
    star = n.math("MULTIPLY", star, n.maprange(clouds, 0.45, 0.6, 1.0, 0.0))
    col = n.mix(star, col, (0.9, 0.92, 1.0), "ADD")
    return n.finish(n.emission(col, 1.0))


# ── Image-based surfaces (artwork from textures.py, mapped by UV) ────────────────────────────
def _image(n: N, img, interpolation="Cubic"):
    t = n.node("ShaderNodeTexImage", {"Vector": n.coord("UV")}, interpolation=interpolation)
    t.image = img
    return t


@cached
def painting(name: str, img, varnish: float = 0.7):
    """Oil on canvas: the picture, canvas weave, brush ridges and crazed old varnish."""
    n = N(name)
    col = _image(n, img).outputs["Color"]
    co = n.coord("Object")
    weave = n.math("MULTIPLY", n.wave(co, scale=900.0, direction="X"), n.wave(co, scale=900.0, direction="Z"))
    strokes = n.noise(
        n.vmath("MULTIPLY", co, (6.0, 1.0, 1.0)), scale=60.0, detail=4.0, rough=0.6, distortion=1.5
    ).outputs["Fac"]
    crackle = n.voronoi(co, scale=160.0, feature="DISTANCE_TO_EDGE").outputs["Distance"]
    crack = n.maprange(crackle, 0.0, 0.03, 1.0, 0.0)
    col = n.mix(n.math("MULTIPLY", crack, 0.35), col, (0.08, 0.05, 0.02))
    height = n.math(
        "ADD",
        n.math("MULTIPLY", weave, 0.3),
        n.math("SUBTRACT", n.math("MULTIPLY", strokes, 0.7), n.math("MULTIPLY", crack, 0.3)),
    )
    bsdf = n.principled(
        base=col,
        rough=0.55,
        normal=n.bump(height, strength=0.35, distance=0.001),
        coat=varnish,
        coat_rough=n.maprange(strokes, 0.3, 0.7, 0.08, 0.3),
    )
    return n.finish(bsdf)


@cached
def woven(name: str, img):
    n = N(name)
    col = _image(n, img).outputs["Color"]
    co = n.coord("Object")
    wx = n.wave(co, scale=700.0, direction="X", distortion=0.5)
    wz = n.wave(co, scale=520.0, direction="Z", distortion=0.5)
    w = n.math("MULTIPLY", wx, wz)
    fuzz = n.noise(co, scale=300.0, detail=3.0).outputs["Fac"]
    col = n.mix(n.maprange(w, 0.0, 0.5, 0.45, 0.0), col, (0.02, 0.01, 0.01))
    col = n.mix(n.maprange(fuzz, 0.3, 0.7, 0.2, -0.1), col, (0.3, 0.25, 0.2))
    occ = n.ao(0.05)
    col = n.mix(n.maprange(occ, 0.0, 1.0, 0.7, 0.0), col, (0.01, 0.005, 0.005))
    return n.finish(
        n.principled(
            base=col,
            rough=0.92,
            sheen=0.9,
            sheen_rough=0.45,
            normal=n.bump(n.math("ADD", w, n.math("MULTIPLY", fuzz, 0.3)), strength=0.5, distance=0.001),
        )
    )


@cached
def stained(name: str, img, backlight: float = 1.4):
    """Leaded coloured glass lit from behind: dark image areas are lead cames."""
    n = N(name)
    t = _image(n, img, "Linear")
    col = t.outputs["Color"]
    lum = n.node("ShaderNodeRGBToBW", {"Color": col}).outputs[0]
    lead = n.maprange(lum, 0.02, 0.08, 1.0, 0.0)
    ripple = n.noise(n.coord("Object"), scale=120.0, detail=2.0).outputs["Fac"]
    glass_col = n.hsv(col, s=1.1, v=n.maprange(ripple, 0.0, 1.0, 0.8, 1.15))
    glass = n.shader_mix(
        0.5, n.principled(base=glass_col, rough=0.15, transmission=1.0, ior=1.5), n.emission(glass_col, backlight)
    )
    metal = n.principled(base=(0.03, 0.03, 0.03), metallic=0.8, rough=0.55)
    return n.finish(n.shader_mix(lead, glass, metal))


@cached
def paper(name: str, img, rough: float = 0.75):
    n = N(name)
    col = _image(n, img).outputs["Color"]
    fibre = n.noise(n.coord("Object"), scale=400.0, detail=4.0).outputs["Fac"]
    return n.finish(
        n.principled(
            base=col,
            rough=rough,
            sss=0.25,
            sss_radius=(1.0, 0.8, 0.6),
            sss_scale=0.002,
            normal=n.bump(fibre, strength=0.2, distance=0.0005),
        )
    )


@cached
def gilt_leather(name: str, img, leather: Color = (0.12, 0.035, 0.025), gold: Color = (0.8, 0.58, 0.22)):
    """Leather with gold tooling wherever the image is white."""
    n = N(name)
    mask = n.node("ShaderNodeRGBToBW", {"Color": _image(n, img).outputs["Color"]}).outputs[0]
    co = n.coord("Object")
    grain = n.noise(co, scale=150.0, detail=6.0, rough=0.7).outputs["Fac"]
    wear = n.noise(co, scale=12.0, detail=4.0).outputs["Fac"]
    lcol = n.mix(n.maprange(wear, 0.5, 0.75, 0.0, 0.6), leather, tuple(c * 1.8 for c in leather))
    lcol = n.mix(n.maprange(grain, 0.3, 0.7, 0.2, -0.1), lcol, (0.01, 0.005, 0.004))
    leather_bsdf = n.principled(
        base=lcol,
        rough=n.maprange(wear, 0.4, 0.8, 0.45, 0.75),
        normal=n.bump(n.math("SUBTRACT", grain, n.math("MULTIPLY", mask, 0.6)), strength=0.4, distance=0.001),
    )
    gold_bsdf = n.principled(base=gold, metallic=1.0, rough=0.3)
    return n.finish(n.shader_mix(n.maprange(mask, 0.4, 0.6, 0.0, 1.0), leather_bsdf, gold_bsdf))
