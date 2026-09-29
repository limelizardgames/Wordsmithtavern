"""Render the tavern's image layers for the game.

    python art/blender/render.py                    # every layer (slow: ~1 h on 4 cores)
    python art/blender/render.py base counter       # just those layers
    python art/blender/render.py hearth-sooty       # one furniture piece
    python art/blender/render.py --preview defaults # quick low-res check of the default room

Outputs WebP layers and manifest.json into src/ui/art/renders/. Every layer is a crop of the
same camera frame; the manifest records each crop in scene units (see tavern/core.py).
Requires the bpy module (pip install -r art/blender/requirements.txt), Python 3.11.
"""

from __future__ import annotations

import argparse
import json
import math
import pathlib
import sys
import time

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
REPO = HERE.parent.parent

import bpy  # noqa: E402

from tavern import barley, core, lighting, post, room  # noqa: E402
from tavern.items import REGISTRY, load_all  # noqa: E402

OUT = REPO / "src" / "ui" / "art" / "renders"
DEFAULTS = ["hearth-sooty", "lights-candles", "window-dusty", "table-wobbly"]
BARLEY_LAYERS = [f"barley:{m}" for m in barley.MOODS] + [f"barley-portrait:{m}" for m in barley.MOODS]
# Extra room around each piece for its shadows and blur: left, top, right, bottom (scene units).
MARGINS = {
    "hearth": (34, 16, 40, 22),
    "lights": (12, 8, 12, 12),
    "window": (8, 8, 8, 10),
    "wallLeft": (16, 12, 20, 20),
    "wallRight": (16, 12, 20, 20),
    "floorRight": (22, 14, 26, 18),
    "hearthside": (20, 14, 24, 16),
    "counter": (12, 10, 16, 8),
    "barley": (12, 10, 16, 8),
}


def build_scene():
    scene = core.reset()
    room.build()
    lighting.build()
    load_all()
    for fid, (_slot, fn) in REGISTRY.items():
        with core.building(f"item:{fid}"):
            fn()
    barley.build()
    core.make_camera(scene)
    scene.cycles.film_transparent_glass = True
    return scene


def item_collections():
    """Collections that are rendered one at a time (furniture and Barley's moods)."""
    return [c for c in bpy.data.collections if c.name.startswith(("item:", "barley:"))]


def configure(kind: str, target: str | None = None, on_counter: bool = False):
    scene = bpy.context.scene
    for col in item_collections():
        hidden = col.name != target
        # Copy first: changing visibility invalidates Blender's cached object list.
        for ob in list(col.all_objects):
            ob.hide_render = hidden
    room_objs = core.objects_in("Room")
    counter_objs = core.objects_in("Counter")
    for ob in room_objs + counter_objs:
        ob.hide_render = False
        ob.is_shadow_catcher = False
        ob.visible_camera = True
    if kind == "base":
        scene.render.film_transparent = False
        for ob in counter_objs:
            ob.visible_camera = False
    elif kind == "counter":
        scene.render.film_transparent = True
        for ob in room_objs:
            ob.visible_camera = False
    else:  # a furniture piece (or Barley)
        scene.render.film_transparent = True
        for ob in room_objs:
            ob.is_shadow_catcher = True
        for ob in counter_objs:
            if on_counter:
                ob.is_shadow_catcher = True
            else:
                ob.visible_camera = False


def bbox(objs):
    dg = bpy.context.evaluated_depsgraph_get()
    xs, ys = [], []
    for ob in objs:
        if ob.type not in ("MESH", "CURVE") or ob.hide_render:
            continue
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        mw = ev.matrix_world
        for v in me.vertices:
            p = mw @ v.co
            if p.y <= 0.05:
                continue
            x, y = core.project(p)
            xs.append(x)
            ys.append(y)
        ev.to_mesh_clear()
    return min(xs), min(ys), max(xs), max(ys)


def set_region(box):
    """Set a render border (scene units). Returns the pixel-snapped box actually used."""
    scene = bpy.context.scene
    fx, fy, fw, fh = core.FULL
    ppu = core.PX_PER_UNIT
    wpx, hpx = round(fw * ppu), round(fh * ppu)
    x0, y0, x1, y1 = box
    px0 = max(0, math.floor((x0 - fx) * ppu))
    py0 = max(0, math.floor((y0 - fy) * ppu))
    px1 = min(wpx, math.ceil((x1 - fx) * ppu))
    py1 = min(hpx, math.ceil((y1 - fy) * ppu))
    full = px0 == 0 and py0 == 0 and px1 == wpx and py1 == hpx
    scene.render.use_border = not full
    scene.render.use_crop_to_border = not full
    scene.render.border_min_x = px0 / wpx
    scene.render.border_max_x = px1 / wpx
    scene.render.border_min_y = 1 - py1 / hpx
    scene.render.border_max_y = 1 - py0 / hpx
    edges = (px0 > 0, py0 > 0, px1 < wpx, py1 < hpx)
    return (fx + px0 / ppu, fy + py0 / ppu, (px1 - px0) / ppu, (py1 - py0) / ppu), edges


def render(path: pathlib.Path):
    scene = bpy.context.scene
    scene.render.filepath = str(path)
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"  rendered {path.name} in {time.time() - t:.0f}s", flush=True)


def render_portrait(mood: str, png: pathlib.Path, preview: bool):
    """Barley close up, for dialogue cards: his own camera and key light, transparent film."""
    from mathutils import Vector

    scene = bpy.context.scene
    target = f"barley:{mood}"
    configure("item", target, on_counter=False)
    for ob in core.objects_in("Room"):
        ob.is_shadow_catcher = False
        ob.visible_camera = False
    at = barley.slots.BARLEY
    yaw = barley.facing_yaw(at)
    fwd = Vector((math.sin(yaw), -math.cos(yaw), 0.0))
    look = at + Vector((0, 0, 0.1))
    cam_data = bpy.data.cameras.new("portrait-cam")
    cam_data.lens = 85
    cam_data.sensor_width = 36
    cam_data.dof.use_dof = False
    cam = bpy.data.objects.new("portrait-cam", cam_data)
    cam.location = look + fwd * 0.62 + Vector((0, 0, 0.05))
    cam.rotation_euler = (look - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(cam)
    keep_cam = scene.camera
    scene.camera = cam
    key = lighting.area(
        "portrait-key", look + fwd * 0.5 + Vector((-0.35, 0, 0.35)), look, 6.0, lighting.WARM_LAMP, size=(0.3, 0.3)
    )
    rim = lighting.area(
        "portrait-rim", look - fwd * 0.4 + Vector((0.3, 0, 0.3)), look, 5.0, (1.0, 0.8, 0.6), size=(0.2, 0.2)
    )
    for lamp in (key, rim):
        lamp.light_linking.receiver_collection = bpy.data.collections[target]
    old = (scene.render.resolution_x, scene.render.resolution_y, scene.render.use_border)
    scene.render.resolution_x = scene.render.resolution_y = 320 if preview else 720
    scene.render.use_border = False
    scene.render.film_transparent = True
    render(png)
    scene.render.resolution_x, scene.render.resolution_y, scene.render.use_border = old
    scene.camera = keep_cam
    for ob in (cam, key, rim):
        bpy.data.objects.remove(ob)


def load_manifest(out: pathlib.Path):
    f = out / "manifest.json"
    manifest = (
        json.loads(f.read_text())
        if f.exists()
        else {"pxPerUnit": core.PX_PER_UNIT, "full": list(core.FULL), "layers": {}}
    )
    # Where the game draws flickering firelight and lamp glows (scene units).
    fire = core.project(lighting.FIRE)
    manifest["fx"] = {
        "fire": [round(fire[0], 2), round(fire[1], 2)],
        "lamps": [[round(v, 2) for v in core.project(p)] for p in lighting.LAMPS],
    }
    return manifest


def save_layer(manifest, out, name, png, box, edges, *, alpha=True, glow=True, quality=88):
    img = post.load(png)
    if alpha:
        if glow:
            img = post.glow(img, threshold=0.82, radius=4.0 * core.PX_PER_UNIT / 3, strength=0.55)
        img = post.feather(img, px=max(2, round(3 * core.PX_PER_UNIT)), sides=edges)
    file = f"{name.replace(':', '-')}.webp"
    post.save_webp(img, out / file, quality=quality, alpha=alpha)
    x, y, w, h = box
    manifest["layers"][name] = {"file": file, "x": round(x, 3), "y": round(y, 3), "w": round(w, 3), "h": round(h, 3)}


def run(layers, out: pathlib.Path, preview: bool, samples: int | None):
    scene = build_scene()
    tmp = out / ".tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    if preview:
        scene.render.resolution_percentage = 34
        scene.cycles.samples = samples or 24
    elif samples:
        scene.cycles.samples = samples
    manifest = load_manifest(out)
    manifest["pxPerUnit"] = core.PX_PER_UNIT * scene.render.resolution_percentage / 100
    for name in layers:
        print(f"[{name}]", flush=True)
        png = tmp / f"{name.replace(':', '-')}.png"
        if name == "base":
            configure("base")
            box, edges = set_region(
                (core.FULL[0], core.FULL[1], core.FULL[0] + core.FULL[2], core.FULL[1] + core.FULL[3])
            )
            render(png)
            save_layer(manifest, out, "base", png, box, edges, alpha=False, quality=86)
        elif name == "counter":
            configure("counter")
            x0, y0, x1, y1 = bbox(core.objects_in("Counter"))
            box, edges = set_region((x0, y0 - 6, x1, y1))
            render(png)
            save_layer(manifest, out, "counter", png, box, edges, glow=False)
        elif name.startswith("barley:"):
            configure("item", name, on_counter=True)
            x0, y0, x1, y1 = bbox(core.objects_in(name))
            ml, mt, mr, mb = MARGINS["barley"]
            box, edges = set_region((x0 - ml, y0 - mt, x1 + mr, y1 + mb))
            render(png)
            save_layer(manifest, out, name, png, box, edges, glow=False)
        elif name.startswith("barley-portrait:"):
            mood = name.split(":")[1]
            render_portrait(mood, png, preview)
            img = post.trim(post.load(png))
            file = f"barley-portrait-{mood}.webp"
            post.save_webp(img, out / file, quality=90)
            manifest.setdefault("portraits", {})[f"barley:{mood}"] = {"file": file}
        elif name in REGISTRY:
            slot, _ = REGISTRY[name]
            target = f"item:{name}"
            configure("item", target, on_counter=slot == "counter")
            x0, y0, x1, y1 = bbox(core.objects_in(target))
            ml, mt, mr, mb = MARGINS[slot]
            box, edges = set_region((x0 - ml, y0 - mt, x1 + mr, y1 + mb))
            render(png)
            save_layer(manifest, out, f"item:{name}", png, box, edges)
        else:
            print(f"  unknown layer {name}", file=sys.stderr)
            continue
        (out / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")


def composite_preview(out: pathlib.Path, items: list[str], dest: pathlib.Path):
    import numpy as np

    manifest = load_manifest(out)
    ppu = manifest["pxPerUnit"]
    fx, fy, fw, fh = manifest["full"]
    size = (round(fw * ppu), round(fh * ppu))
    base = post.load(out / manifest["layers"]["base"]["file"])
    layers = []
    for key in [f"item:{i}" for i in items] + ["counter"]:
        entry = manifest["layers"].get(key)
        if not entry:
            continue
        img = post.load(out / entry["file"])
        layers.append((img, round((entry["x"] - fx) * ppu), round((entry["y"] - fy) * ppu)))
    img = post.composite(layers, size, base)
    post.save_png(np.concatenate([img, np.ones(img.shape[:2] + (1,), np.float32)], axis=2), dest)
    print(f"composite -> {dest}")


def closeup(items: list[str], box, dest: pathlib.Path, samples: int | None, percent: int = 100):
    """Everything in one render (no layers), for judging detail (percent < 100 for overviews)."""
    scene = build_scene()
    scene.render.resolution_percentage = percent
    for col in item_collections():
        for ob in list(col.all_objects):
            ob.hide_render = col.name[5:] not in items
    scene.render.film_transparent = False
    if samples:
        scene.cycles.samples = samples
    set_region(box)
    render(dest)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("layers", nargs="*")
    ap.add_argument("--preview", action="store_true", help="1/3 resolution, few samples, into a scratch folder")
    ap.add_argument("--samples", type=int)
    ap.add_argument("--out", type=pathlib.Path)
    ap.add_argument("--composite", type=pathlib.Path, help="also write a composite of base + default furniture")
    ap.add_argument("--closeup", help="x0,y0,x1,y1 in scene units: render everything there at full size")
    ap.add_argument("--dest", type=pathlib.Path, help="output file for --closeup")
    ap.add_argument("--percent", type=int, default=100, help="resolution percentage for --closeup")
    args = ap.parse_args()
    if args.closeup:
        box = tuple(float(v) for v in args.closeup.split(","))
        closeup(args.layers or DEFAULTS, box, args.dest, args.samples, args.percent)
        return
    load_all()
    layers = args.layers or ["all"]
    expanded: list[str] = []
    for name in layers:
        if name == "all":
            expanded += ["base", "counter", *REGISTRY.keys(), *BARLEY_LAYERS]
        elif name == "barley":
            expanded += BARLEY_LAYERS
        elif name == "defaults":
            expanded += ["base", "counter", *DEFAULTS]
        else:
            expanded.append(name)
    out = args.out or (pathlib.Path("/tmp/wordsmith-preview") if args.preview else OUT)
    out.mkdir(parents=True, exist_ok=True)
    run(expanded, out, args.preview, args.samples)
    if args.composite:
        composite_preview(out, DEFAULTS, args.composite)


if __name__ == "__main__":
    main()
