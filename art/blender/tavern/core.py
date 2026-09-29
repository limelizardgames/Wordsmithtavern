"""Scene setup and the camera calibration that ties the 3D tavern to the game's 2D scene units.

The game lays the tavern out in "scene units": a 480 x 320 core (x right, y down) that wider or
taller screens extend to 760 x 540 (x from -140, y from -220). The camera here is placed so the
back wall, 7 m away, maps to exactly 1 cm per unit, with the floor meeting the wall at y = 212.
Every render is therefore a crop of one shared image plane, and layers line up in the game by
position alone.
"""

from __future__ import annotations

import math
import random

import addon_utils
import bpy
from mathutils import Vector

# ── Calibration (keep in sync with src/ui/art/TavernScene.tsx) ─────────────────────────────
CAM_Z = 1.55  # eye height, metres
FOCAL = 700.0  # focal length in scene units
HORIZON_Y = 57.0  # scene y of the horizon (camera is level, so verticals stay vertical)
CENTER_X = 240.0
WALL_Y = 7.0  # distance from the camera to the back wall surface
FULL = (-140.0, -220.0, 760.0, 540.0)  # x, y, w, h of the largest view the game shows
PX_PER_UNIT = 3  # final render density


def project(p) -> tuple[float, float]:
    """World point -> scene units (x, y)."""
    x, y, z = p
    return CENTER_X + FOCAL * x / y, HORIZON_Y - FOCAL * (z - CAM_Z) / y


def unproject(sx: float, sy: float, depth: float) -> Vector:
    """Scene units at a given distance from the camera -> world point."""
    return Vector(((sx - CENTER_X) * depth / FOCAL, depth, CAM_Z - (sy - HORIZON_Y) * depth / FOCAL))


def units_per_metre(depth: float) -> float:
    return FOCAL / depth


# ── Scene ───────────────────────────────────────────────────────────────────────────────────
def reset(seed: int = 7) -> bpy.types.Scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    addon_utils.enable("cycles", default_set=True)
    random.seed(seed)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    c = scene.cycles
    c.device = "CPU"
    c.samples = 128
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.02
    c.use_denoising = True
    c.denoiser = "OPENIMAGEDENOISE"
    c.max_bounces = 8
    c.diffuse_bounces = 4
    c.glossy_bounces = 4
    c.transmission_bounces = 8
    c.transparent_max_bounces = 16
    c.volume_bounces = 0
    c.volume_step_rate = 1.0
    c.sample_clamp_indirect = 8.0
    c.blur_glossy = 0.5
    c.caustics_reflective = False
    c.caustics_refractive = False
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.0
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.012, 0.014, 0.022, 1)
    bg.inputs["Strength"].default_value = 1.0
    return scene


def make_camera(scene: bpy.types.Scene, view=FULL, fstop: float = 11.0, focus: float = 2.0):
    """A level camera whose frame is exactly `view` (x, y, w, h in scene units)."""
    vx, vy, vw, vh = view
    data = bpy.data.cameras.new("Camera")
    data.sensor_fit = "HORIZONTAL" if vw >= vh else "VERTICAL"
    data.sensor_width = 36.0
    data.sensor_height = 36.0
    big = max(vw, vh)
    data.lens = 36.0 * FOCAL / big
    # Shift the frame so its centre lands on (vx + vw/2, vy + vh/2) with a level camera.
    data.shift_x = (vx + vw / 2 - CENTER_X) / big
    data.shift_y = (HORIZON_Y - (vy + vh / 2)) / big
    data.clip_start = 0.05
    data.clip_end = 60
    data.dof.use_dof = fstop > 0
    data.dof.focus_distance = focus
    data.dof.aperture_fstop = max(fstop, 0.1)
    cam = bpy.data.objects.new("Camera", data)
    cam.location = (0, 0, CAM_Z)
    cam.rotation_euler = (math.pi / 2, 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam
    scene.render.resolution_x = round(vw * PX_PER_UNIT)
    scene.render.resolution_y = round(vh * PX_PER_UNIT)
    scene.render.resolution_percentage = 100
    scene.render.pixel_aspect_x = scene.render.pixel_aspect_y = 1
    return cam


_building: list[str] = ["Room"]


def current() -> str:
    return _building[-1]


class building:
    """`with building("item:tip-jar"):` puts everything created inside into that collection."""

    def __init__(self, name: str):
        self.name = name

    def __enter__(self):
        collection(self.name)
        _building.append(self.name)
        return self

    def __exit__(self, *exc):
        _building.pop()
        return False


def collection(name: str) -> bpy.types.Collection:
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def link(obj: bpy.types.Object, col: bpy.types.Collection | str | None = None) -> bpy.types.Object:
    if col is None:
        col = current()
    if isinstance(col, str):
        col = collection(col)
    for c in obj.users_collection:
        c.objects.unlink(obj)
    col.objects.link(obj)
    return obj


def objects_in(col_name: str) -> list[bpy.types.Object]:
    col = bpy.data.collections.get(col_name)
    return list(col.all_objects) if col else []
