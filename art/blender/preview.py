"""Quick look at the whole room (low resolution): python art/blender/preview.py out.png [scale] [samples]"""

import pathlib
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).parent))

import bpy  # noqa: E402

from tavern import core, lighting, room  # noqa: E402


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/preview.png"
    scale = float(sys.argv[2]) if len(sys.argv) > 2 else 0.34
    samples = int(sys.argv[3]) if len(sys.argv) > 3 else 32
    scene = core.reset()
    room.build()
    lighting.build()
    core.make_camera(scene)
    scene.render.resolution_percentage = max(1, round(100 * scale))
    scene.cycles.samples = samples
    scene.render.filepath = out
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"rendered {out} in {time.time() - t:.1f}s")


main()
