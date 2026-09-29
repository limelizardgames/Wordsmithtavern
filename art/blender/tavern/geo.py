"""Mesh helpers. Everything is built at real size (metres) around the object's origin, so the
procedural materials, which use object coordinates, keep a consistent scale."""

from __future__ import annotations

import math
import random

import bmesh
import bpy

from . import core


def _finish(ob, col, mat, smooth):
    core.link(ob, col or core.current())
    if mat is not None:
        mats = mat if isinstance(mat, (list, tuple)) else [mat]
        for m in mats:
            ob.data.materials.append(m)
    if smooth and ob.type == "MESH":
        ob.data.shade_smooth()
    return ob


def mesh(name, verts, faces, *, col=None, mat=None, smooth=False, loc=(0, 0, 0), rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.validate()
    me.update()
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    return _finish(ob, col, mat, smooth)


def bevel(ob, width=0.004, segments=2, angle=35.0):
    m = ob.modifiers.new("Bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(angle)
    m.harden_normals = True
    ob.data.shade_smooth()
    return m


def subdiv(ob, levels=2, render=None):
    m = ob.modifiers.new("Subdivision", "SUBSURF")
    m.levels = levels
    m.render_levels = levels if render is None else render
    return m


def displace(ob, strength=0.01, size=0.2, depth=2, kind="CLOUDS", subdivide=0, mid=0.5, coords="LOCAL"):
    if subdivide:
        m = ob.modifiers.new("Subdivide", "SUBSURF")
        m.subdivision_type = "SIMPLE"
        m.levels = m.render_levels = subdivide
    tex = bpy.data.textures.new(f"{ob.name}-disp", kind)
    if kind == "CLOUDS":
        tex.noise_scale = size
        tex.noise_depth = depth
        tex.noise_basis = "BLENDER_ORIGINAL"
    m = ob.modifiers.new("Displace", "DISPLACE")
    m.texture = tex
    m.strength = strength
    m.mid_level = mid
    m.texture_coords = coords
    return m


def solidify(ob, thickness=0.01, offset=-1.0):
    m = ob.modifiers.new("Solidify", "SOLIDIFY")
    m.thickness = thickness
    m.offset = offset
    return m


def box(name, size, loc=(0, 0, 0), *, rot=(0, 0, 0), col=None, mat=None, bev=0.004, segments=2):
    sx, sy, sz = size
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    verts = [
        (-hx, -hy, -hz),
        (hx, -hy, -hz),
        (hx, hy, -hz),
        (-hx, hy, -hz),
        (-hx, -hy, hz),
        (hx, -hy, hz),
        (hx, hy, hz),
        (-hx, hy, hz),
    ]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    ob = mesh(name, verts, faces, col=col, mat=mat, loc=loc, rot=rot)
    if bev:
        bevel(ob, bev, segments)
    return ob


def grid(name, size_x, size_y, nx, ny, loc=(0, 0, 0), *, rot=(0, 0, 0), col=None, mat=None):
    """A subdivided plane in local XY (normal +Z)."""
    verts, faces = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            verts.append(((i / nx - 0.5) * size_x, (j / ny - 0.5) * size_y, 0.0))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    ob = mesh(name, verts, faces, col=col, mat=mat, loc=loc, rot=rot)
    add_planar_uv(ob, size_x, size_y)
    return ob


def add_planar_uv(ob, size_x, size_y):
    """UVs from local X/Y, 0..1 across the given size (bottom-left = 0,0)."""
    me = ob.data
    uv = me.uv_layers.new(name="UVMap")
    for loop in me.loops:
        v = me.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = (v.x / size_x + 0.5, v.y / size_y + 0.5)


def cylinder(
    name, r, h, loc=(0, 0, 0), *, rot=(0, 0, 0), verts=32, col=None, mat=None, bev=0.0, r_top=None, smooth=True
):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r if r_top is None else r_top, depth=h
    )
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    _finish(ob, col, mat, smooth)
    if bev:
        bevel(ob, bev, 2, angle=50)
    return ob


def lathe(
    name,
    profile,
    loc=(0, 0, 0),
    *,
    rot=(0, 0, 0),
    segments=48,
    col=None,
    mat=None,
    smooth=True,
    close_top=False,
    arc=1.0,
):
    """Spin a list of (radius, z) points around the local Z axis. r == 0 makes a pole.
    `arc` < 1 spins only part of the way round (from +X towards +Y), leaving it open."""
    full = arc >= 1.0
    count = segments if full else segments + 1
    verts, faces, rings = [], [], []
    for r, z in profile:
        if r <= 1e-6:
            rings.append([len(verts)])
            verts.append((0.0, 0.0, z))
        else:
            ring = []
            for k in range(count):
                a = 2 * math.pi * arc * k / segments
                ring.append(len(verts))
                verts.append((r * math.cos(a), r * math.sin(a), z))
            rings.append(ring)
    span = segments
    nxt = (lambda k: (k + 1) % count) if full else (lambda k: k + 1)
    for ra, rb in zip(rings, rings[1:]):
        if len(ra) == 1 and len(rb) == 1:
            continue
        if len(ra) == 1:
            for k in range(span):
                faces.append((ra[0], rb[k], rb[nxt(k)]))
        elif len(rb) == 1:
            for k in range(span):
                faces.append((ra[k], rb[0], ra[nxt(k)]))
        else:
            for k in range(span):
                faces.append((ra[k], ra[nxt(k)], rb[nxt(k)], rb[k]))
    if close_top and len(rings[-1]) > 1:
        faces.append(tuple(reversed(rings[-1])))
    return mesh(name, verts, faces, col=col, mat=mat, smooth=smooth, loc=loc, rot=rot)


def tube(
    name, points, radius, *, col=None, mat=None, resolution=6, kind="BEZIER", taper=None, fill_caps=True, radii=None
):
    """A round tube along 3D points (a curve object with a bevel)."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = resolution
    cu.use_fill_caps = fill_caps
    cu.resolution_u = 12
    if kind == "BEZIER":
        sp = cu.splines.new("BEZIER")
        sp.bezier_points.add(len(points) - 1)
        for i, p in enumerate(points):
            bp = sp.bezier_points[i]
            bp.co = p
            bp.handle_left_type = bp.handle_right_type = "AUTO"
            if radii:
                bp.radius = radii[i]
    else:
        sp = cu.splines.new("POLY")
        sp.points.add(len(points) - 1)
        for i, p in enumerate(points):
            sp.points[i].co = (*p, 1.0)
            if radii:
                sp.points[i].radius = radii[i]
    if taper is not None:
        cu.taper_object = taper
    ob = bpy.data.objects.new(name, cu)
    return _finish(ob, col, mat, False)


def join(name, objs):
    """Join mesh objects into one (modifiers applied first)."""
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    mats = []
    for ob in objs:
        ev = ob.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        me.transform(ob.matrix_world)
        offset = len(mats)
        for m in me.materials:
            mats.append(m)
        for p in me.polygons:
            p.material_index += offset
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    out = bpy.data.meshes.new(name)
    bm.to_mesh(out)
    bm.free()
    for m in mats:
        out.materials.append(m)
    col = objs[0].users_collection[0]
    for ob in objs:
        bpy.data.objects.remove(ob)
    ob = bpy.data.objects.new(name, out)
    col.objects.link(ob)
    return ob


def empty_parent(name, loc=(0, 0, 0), col=None):
    ob = bpy.data.objects.new(name, None)
    ob.location = loc
    core.link(ob, col or core.current())
    return ob


def parent(children, par):
    for c in children:
        c.parent = par
    return par


def jitter(v, amount):
    return v + random.uniform(-amount, amount)


def moulding(name, w, h, profile, loc, *, rot=(math.pi / 2, 0, 0), col=None, mat=None):
    """A rectangular picture-frame moulding. `profile` runs from the outer edge inwards as
    (inset, depth) pairs; depth points at the viewer. Built flat, then turned to face -Y."""
    verts, loops = [], []
    for inset, depth in profile:
        hw, hh = w / 2 - inset, h / 2 - inset
        loops.append(len(verts))
        verts += [(-hw, -hh, depth), (hw, -hh, depth), (hw, hh, depth), (-hw, hh, depth)]
    faces = []
    for a, b in zip(loops, loops[1:]):
        for k in range(4):
            faces.append((a + k, a + (k + 1) % 4, b + (k + 1) % 4, b + k))
    ob = mesh(name, verts, faces, col=col, mat=mat, loc=loc, rot=rot)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()
    return ob


def disc(name, radius_fn, loc, *, segments=64, thickness=0.0, rot=(0, 0, 0), col=None, mat=None, smooth=True):
    """A flat shape from a polar radius function r(theta), optionally with thickness (+Z)."""
    verts = [(0.0, 0.0, thickness)]
    for k in range(segments):
        a = 2 * math.pi * k / segments
        r = radius_fn(a)
        verts.append((r * math.cos(a), r * math.sin(a), thickness))
    faces = [(0, 1 + k, 1 + (k + 1) % segments) for k in range(segments)]
    if thickness > 0:
        base = len(verts)
        for k in range(segments):
            x, y, _ = verts[1 + k]
            verts.append((x, y, 0.0))
        for k in range(segments):
            a0, a1 = 1 + k, 1 + (k + 1) % segments
            faces.append((a1, a0, base + k, base + (k + 1) % segments))
    return mesh(name, verts, faces, col=col, mat=mat, loc=loc, rot=rot, smooth=smooth)


def folds(ob, amplitude=0.03, period=0.12, irregular=0.4):
    """Vertical cloth folds: sine bands along local X pushed along the normal."""
    tex = bpy.data.textures.new(f"{ob.name}-folds", "WOOD")
    tex.wood_type = "BANDS"
    tex.noise_basis_2 = "SIN"
    tex.noise_scale = period
    tex.turbulence = 2.0 * irregular
    tex.noise_basis = "BLENDER_ORIGINAL"
    m = ob.modifiers.new("Folds", "DISPLACE")
    m.texture = tex
    m.strength = amplitude
    m.mid_level = 0.5
    m.texture_coords = "LOCAL"
    return m


def pleat(ob, amplitude=0.04, period=0.12, flare=0.6, seed=0):
    """Hanging-cloth folds, written straight into a grid's vertices (local X across, Y down the
    drop, Z out of the cloth). Folds deepen towards the hem by `flare`."""
    rnd = random.Random(seed)
    phases = [rnd.uniform(0, 2 * math.pi) for _ in range(3)]
    me = ob.data
    ys = [v.co.y for v in me.vertices]
    top, bottom = max(ys), min(ys)
    span = max(top - bottom, 1e-6)
    for v in me.vertices:
        x, y = v.co.x, v.co.y
        drop = (top - y) / span
        wobble = 0.35 * math.sin(2 * math.pi * x / (period * 3.1) + phases[0])
        a = amplitude * (1.0 - flare + flare * drop)
        v.co.z += a * (
            math.sin(2 * math.pi * x / period + phases[1] + wobble)
            + 0.3 * math.sin(2 * math.pi * x / (period * 0.47) + phases[2])
        )
    me.update()
    return ob
