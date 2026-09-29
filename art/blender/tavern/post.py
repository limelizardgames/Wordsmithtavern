"""Image post-processing with numpy/Pillow: glow around flames, feathered crop edges, WebP."""

from __future__ import annotations

import numpy as np
from PIL import Image


def load(path) -> np.ndarray:
    """RGBA float32 in 0..1 (straight alpha)."""
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32) / 255.0


def _blur(a: np.ndarray, radius: float) -> np.ndarray:
    """Separable gaussian blur on an HxWxC array."""
    r = max(1, int(radius * 3))
    x = np.arange(-r, r + 1, dtype=np.float32)
    k = np.exp(-(x**2) / (2 * radius * radius))
    k /= k.sum()
    out = a
    for axis in (0, 1):
        pad = [(0, 0)] * a.ndim
        pad[axis] = (r, r)
        p = np.pad(out, pad, mode="edge")
        acc = np.zeros_like(out)
        for i, w in enumerate(k):
            sl = [slice(None)] * a.ndim
            sl[axis] = slice(i, i + out.shape[axis])
            acc += w * p[tuple(sl)]
        out = acc
    return out


def glow(img: np.ndarray, threshold=0.8, radius=6.0, strength=0.6) -> np.ndarray:
    """Soft light bloom around bright pixels. Works on straight-alpha RGBA; glow outside the
    object becomes semi-transparent light so it still reads over the room."""
    rgb, a = img[..., :3], img[..., 3:4]
    pm = rgb * a
    lum = pm.max(axis=2, keepdims=True)
    bright = pm * np.clip((lum - threshold) / (1 - threshold + 1e-6), 0, 1)
    g = (_blur(bright, radius) + 0.5 * _blur(bright, radius * 3)) * strength
    pm2 = pm + g
    a2 = np.clip(a + g.max(axis=2, keepdims=True) * (1 - a), 0, 1)
    rgb2 = np.where(a2 > 1e-4, pm2 / np.maximum(a2, 1e-4), 0)
    return np.concatenate([np.clip(rgb2, 0, 1), a2], axis=2)


def feather(img: np.ndarray, px: int = 8, sides=(True, True, True, True)) -> np.ndarray:
    """Fade alpha to zero at the crop edges (left, top, right, bottom) so caught shadows never end
    in a hard line."""
    h, w = img.shape[:2]
    ramp_x = np.ones(w, dtype=np.float32)
    ramp_y = np.ones(h, dtype=np.float32)
    t = np.linspace(0, 1, px, dtype=np.float32) ** 1.5
    if sides[0]:
        ramp_x[:px] = np.minimum(ramp_x[:px], t)
    if sides[2]:
        ramp_x[-px:] = np.minimum(ramp_x[-px:], t[::-1])
    if sides[1]:
        ramp_y[:px] = np.minimum(ramp_y[:px], t)
    if sides[3]:
        ramp_y[-px:] = np.minimum(ramp_y[-px:], t[::-1])
    out = img.copy()
    out[..., 3] *= ramp_y[:, None] * ramp_x[None, :]
    return out


def save_webp(img: np.ndarray, path, quality=88, alpha=True):
    arr = np.clip(img * 255.0 + 0.5, 0, 255).astype(np.uint8)
    if alpha:
        # Zero colour where fully transparent: smaller files, no fringes.
        arr[arr[..., 3] == 0, :3] = 0
        Image.fromarray(arr, "RGBA").save(path, "WEBP", quality=quality, method=6, alpha_quality=90, exact=False)
    else:
        Image.fromarray(arr[..., :3], "RGB").save(path, "WEBP", quality=quality, method=6)


def save_png(img: np.ndarray, path):
    arr = np.clip(img * 255.0 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(arr, "RGBA").save(path)


def composite(
    layers: list[tuple[np.ndarray, int, int]], size: tuple[int, int], base: np.ndarray | None = None
) -> np.ndarray:
    """Stack straight-alpha layers at pixel offsets over an opaque base (for previews)."""
    w, h = size
    out = base[..., :3].copy() if base is not None else np.zeros((h, w, 3), np.float32)
    for img, x, y in layers:
        ih, iw = img.shape[:2]
        x0, y0 = max(0, x), max(0, y)
        x1, y1 = min(w, x + iw), min(h, y + ih)
        if x1 <= x0 or y1 <= y0:
            continue
        sub = img[y0 - y : y1 - y, x0 - x : x1 - x]
        a = sub[..., 3:4]
        out[y0:y1, x0:x1] = sub[..., :3] * a + out[y0:y1, x0:x1] * (1 - a)
    return out


def trim(img: np.ndarray, pad: float = 0.04, threshold: float = 0.02) -> np.ndarray:
    """Crop to the visible (alpha) content plus a little padding, as a square."""
    alpha = img[..., 3]
    ys, xs = np.nonzero(alpha > threshold)
    if len(xs) == 0:
        return img
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    side = int(max(x1 - x0, y1 - y0) * (1 + 2 * pad))
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    out = np.zeros((side, side, 4), np.float32)
    sx0, sy0 = cx - side // 2, cy - side // 2
    h, w = alpha.shape
    ax0, ay0 = max(0, sx0), max(0, sy0)
    ax1, ay1 = min(w, sx0 + side), min(h, sy0 + side)
    out[ay0 - sy0 : ay1 - sy0, ax0 - sx0 : ax1 - sx0] = img[ay0:ay1, ax0:ax1]
    return out
