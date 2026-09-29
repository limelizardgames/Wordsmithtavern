"""The tavern room: back wall, floor, ceiling and the bar counter in the foreground.

World layout (metres): camera at the origin looking along +Y, eye height 1.55. The back wall's
plaster surface is at Y = 7; its timbers stand proud of it. The bar top runs across the bottom
of the frame between Y = 1.1 and 1.78. Slot areas the furniture fills are kept clear of posts.
"""

from __future__ import annotations

import math
import random

from . import core, geo
from . import materials as M

WALL = core.WALL_Y
CEIL = 2.75
WIN = (-0.5, 0.5, 0.95, 2.0)  # window opening: x0, x1, z0, z1
WIN_DEPTH = 0.42
BAR_Z = 1.05
BAR_Y = (1.1, 1.78)


def oak_dark():
    return M.wood(
        "oak-dark",
        (0.026, 0.016, 0.01),
        (0.08, 0.05, 0.03),
        grain=30,
        rough=(0.55, 0.85),
        bump=0.45,
        dirt=0.6,
        knots=0.4,
        checks=1.0,
        tint=0.15,
    )


def oak_panel():
    return M.wood(
        "oak-panel",
        (0.04, 0.024, 0.014),
        (0.105, 0.064, 0.036),
        grain=45,
        rough=(0.4, 0.7),
        bump=0.3,
        dirt=0.5,
        tint=0.14,
    )


def floor_wood():
    return M.wood(
        "floor",
        (0.022, 0.016, 0.012),
        (0.07, 0.05, 0.035),
        along="X",
        across="Y",
        grain=34,
        rough=(0.6, 0.9),
        bump=0.55,
        dirt=0.9,
        knots=0.5,
        tint=0.25,
        checks=0.8,
    )


def bar_wood():
    return M.wood(
        "bar-top",
        (0.045, 0.022, 0.011),
        (0.14, 0.075, 0.036),
        grain=70,
        rough=(0.25, 0.5),
        bump=0.15,
        varnish=0.8,
        dirt=0.15,
        tint=0.06,
        rings=0.3,
    )


def wall_plaster():
    return M.plaster("plaster", base=(0.6, 0.52, 0.39), dirt=(0.3, 0.23, 0.15), soot=0.5)


def build_wall():
    pl = wall_plaster()
    x0, x1, z0, z1 = WIN
    # Plaster in four pieces around the window opening.
    for name, xa, xb, za, zb in (
        ("wall-left", -5.2, x0, 0.0, CEIL),
        ("wall-right", x1, 5.2, 0.0, CEIL),
        ("wall-below", x0, x1, 0.0, z0),
        ("wall-above", x0, x1, z1, CEIL),
    ):
        ob = geo.grid(
            name,
            xb - xa,
            zb - za,
            max(2, int((xb - xa) * 12)),
            max(2, int((zb - za) * 12)),
            ((xa + xb) / 2, WALL + 0.001, (za + zb) / 2),
            rot=(math.pi / 2, 0, 0),
            mat=pl,
        )
        geo.displace(ob, strength=0.012, size=0.35, depth=2)
    # Reveal (the thickness of the wall around the window).
    d = WIN_DEPTH
    geo.grid(
        "reveal-l", d, z1 - z0, 4, 12, (x0, WALL + d / 2, (z0 + z1) / 2), rot=(math.pi / 2, 0, math.pi / 2), mat=pl
    )
    geo.grid(
        "reveal-r", d, z1 - z0, 4, 12, (x1, WALL + d / 2, (z0 + z1) / 2), rot=(math.pi / 2, 0, -math.pi / 2), mat=pl
    )
    geo.grid("reveal-top", x1 - x0, d, 12, 4, ((x0 + x1) / 2, WALL + d / 2, z1), rot=(math.pi, 0, 0), mat=pl)
    geo.box(
        "reveal-sill",
        (x1 - x0 + 0.02, d, 0.04),
        ((x0 + x1) / 2, WALL + d / 2 - 0.02, z0 - 0.02),
        mat=oak_panel(),
        bev=0.006,
    )


def build_timbers():
    oak = oak_dark()
    depth = 0.16
    y = WALL - depth / 2 + 0.002
    random.seed(11)

    def beam(name, x0, x1, z0, z1):
        ob = geo.box(name, (x1 - x0, depth, z1 - z0), ((x0 + x1) / 2, y, (z0 + z1) / 2), mat=oak, bev=0.012, segments=3)
        # Old hand-hewn timber: never quite straight.
        sub = ob.modifiers.new("Cuts", "SUBSURF")
        sub.subdivision_type = "SIMPLE"
        sub.levels = sub.render_levels = 4
        ob.modifiers.move(len(ob.modifiers) - 1, 0)
        geo.displace(ob, strength=0.012, size=0.6, depth=2)
        return ob

    def post(name, x, z0, z1, w=0.2):
        # Long axis on local X (the grain), stood upright, a little proud of the rails.
        return geo.box(
            name,
            (z1 - z0, depth, w),
            (x, y - 0.015, (z0 + z1) / 2),
            rot=(0, math.pi / 2, 0),
            mat=oak,
            bev=0.012,
            segments=3,
        )

    peg = M.wood("peg", (0.02, 0.012, 0.008), (0.05, 0.03, 0.018), grain=80, dirt=0.3)

    def pegs(x, z):
        for dz in (-0.03, 0.03):
            geo.cylinder(
                "peg",
                0.014,
                0.03,
                (x + random.uniform(-0.03, 0.03), WALL - depth - 0.028, z + dz),
                rot=(math.pi / 2, 0, 0),
                mat=peg,
                verts=12,
            )

    # Wall plate under the ceiling and a big tie beam across the top of the core view.
    beam("plate", -5.2, 5.2, CEIL - 0.16, CEIL)
    beam("tie-beam", -5.2, 5.2, 1.98, 2.2)
    # Sill rail capping the panelling.
    beam("sill-rail", -5.2, 5.2, 0.95, 1.06)
    for i, x in enumerate((-4.35, -3.3, -0.66, 0.66, 2.55, 3.95)):
        post(f"post-{i}", x, 0.0, CEIL - 0.16)
        for z in (1.005, 2.09):
            pegs(x, z)
    # Short studs above the tie beam.
    for i, x in enumerate((-4.35, -2.2, -0.66, 0.66, 1.6, 2.55, 3.95)):
        post(f"stud-{i}", x, 2.2, CEIL - 0.16, w=0.16)
    # Curved braces in the outer bays (seen on wide screens).
    for i, (xa, xb) in enumerate(((-4.25, -3.4), (2.65, 3.85))):
        ang = math.atan2(2.2 - 1.06, xb - xa)
        length = math.hypot(xb - xa, 2.2 - 1.06)
        geo.box(
            f"brace-{i}",
            (length, depth * 0.8, 0.14),
            ((xa + xb) / 2, y + 0.01, (1.06 + 2.2) / 2),
            rot=(0, -ang if i == 0 else ang, 0),
            mat=oak,
            bev=0.01,
        )


def build_panelling():
    wood = oak_panel()
    x = -5.2
    k = 0
    while x < 5.2:
        w = 0.13
        geo.box(
            f"panel-{k}",
            (0.95, 0.02, w - 0.004),
            (x + w / 2, WALL - 0.012, 0.475),
            rot=(0, math.pi / 2, 0),
            mat=wood,
            bev=0.003,
        )
        x += w
        k += 1
    geo.box(
        "skirting",
        (10.4, 0.03, 0.12),
        (0, WALL - 0.03, 0.06),
        mat=M.wood("skirting", (0.03, 0.018, 0.01), (0.09, 0.05, 0.03)),
        bev=0.005,
    )


def build_floor():
    wood = floor_wood()
    random.seed(5)
    x = -5.0
    k = 0
    while x < 5.0:
        w = random.choice((0.18, 0.2, 0.22, 0.24))
        y = 0.0
        while y < WALL:
            length = random.uniform(1.4, 3.2)
            y1 = min(WALL, y + length)
            ob = geo.box(
                f"board-{k}",
                (y1 - y - 0.004, w - 0.006, 0.03),
                (x + w / 2, (y + y1) / 2, -0.015),
                rot=(0, 0, math.pi / 2),
                mat=wood,
                bev=0.004,
            )
            ob.location.z = random.uniform(-0.017, -0.013)
            y = y1
            k += 1
        x += w


def build_ceiling():
    pl = M.plaster("ceiling-plaster", base=(0.2, 0.16, 0.115), dirt=(0.08, 0.06, 0.04), soot=1.0)
    geo.grid("ceiling", 10.4, 8.0, 40, 30, (0, 3.5, CEIL + 0.18), rot=(math.pi, 0, 0), mat=pl)
    oak = M.wood(
        "oak-sooty",
        (0.012, 0.009, 0.007),
        (0.04, 0.028, 0.02),
        grain=30,
        rough=(0.6, 0.9),
        bump=0.45,
        dirt=0.7,
        checks=1.0,
        tint=0.2,
    )
    for i in range(18):
        x = -5.1 + i * 0.6
        geo.box(f"joist-{i}", (7.2, 0.14, 0.18), (x, 3.5, CEIL + 0.09), rot=(0, 0, math.pi / 2), mat=oak, bev=0.01)
    geo.box("girder", (10.4, 0.32, 0.3), (0, 4.2, CEIL - 0.15), mat=oak, bev=0.015)


def build_sides():
    pl = wall_plaster()
    for sx in (-5.2, 5.2):
        geo.grid(
            f"side-{sx}",
            8.0,
            CEIL,
            8,
            4,
            (sx, 3.0, CEIL / 2),
            rot=(math.pi / 2, 0, math.pi / 2 if sx < 0 else -math.pi / 2),
            mat=pl,
        )


def build_sky():
    x0, x1, z0, z1 = WIN
    sky = geo.grid("sky", 6.0, 4.0, 1, 1, (0, WALL + 2.5, 1.6), rot=(math.pi / 2, 0, 0), mat=M.night_sky("night-sky"))
    sky.visible_shadow = False
    moon = geo.lathe(
        "moon",
        [(0.0, 0.0), (0.085, 0.0)],
        (0.28, WALL + 2.45, 1.82),
        rot=(-math.pi / 2, 0, 0),
        mat=M.glow("moon", (0.95, 0.93, 0.85), 6.0),
        segments=48,
    )
    moon.visible_shadow = False
    # Distant hills and a tree line under the moon.
    hill = [
        (-3.0, 0.0),
        (-3.0, 1.15),
        (-2.0, 1.3),
        (-1.0, 1.22),
        (-0.2, 1.4),
        (0.6, 1.28),
        (1.5, 1.34),
        (3.0, 1.2),
        (3.0, 0.0),
    ]
    verts = [(x, 0.0, z) for x, z in hill]
    hills = geo.mesh(
        "hills",
        verts,
        [tuple(range(len(verts)))],
        loc=(0, WALL + 2.2, 0.0),
        mat=M.matte("hills", (0.01, 0.012, 0.018), rough=1.0),
    )
    hills.visible_shadow = False


def build_counter():
    wood = bar_wood()
    y0, y1 = BAR_Y
    planks = 2
    step = (y1 - y0) / planks
    for i in range(planks):
        ya = y0 + i * step
        geo.box(
            f"bar-{i}", (9.6, step - 0.003, 0.06), (0, ya + step / 2, BAR_Z - 0.03), col="Counter", mat=wood, bev=0.004
        )
    # Rounded front edge (the far side of the bar, towards the guest).
    edge = geo.cylinder(
        "bar-edge",
        0.035,
        9.6,
        (0, y1 + 0.01, BAR_Z - 0.035),
        rot=(0, math.pi / 2, 0),
        col="Counter",
        mat=wood,
        verts=24,
    )
    geo.box("bar-apron", (9.6, 0.04, 0.5), (0, y1 + 0.02, BAR_Z - 0.3), col="Counter", mat=oak_panel(), bev=0.004)
    return edge


def build():
    build_wall()
    build_timbers()
    build_panelling()
    build_floor()
    build_ceiling()
    build_sides()
    build_sky()
    build_counter()
