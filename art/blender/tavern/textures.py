"""Painted and printed artwork used on furniture (the goose portrait, notices, labels...).

Drawn as SVG here, rasterised with cairosvg, cached under art/blender/.cache/. Text uses the
game's own fonts (Almendra, Uncial Antiqua), converted from the npm @fontsource packages.
"""

from __future__ import annotations

import os
import pathlib

import bpy

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent.parent
CACHE = HERE.parent / ".cache"
FONTS = CACHE / "fonts"

INK = "#2b1a0e"
PARCH = "#e8d7ae"


def _ensure_fonts():
    if os.environ.get("FONTCONFIG_FILE", "").startswith(str(CACHE)):
        return
    from fontTools.ttLib import TTFont

    FONTS.mkdir(parents=True, exist_ok=True)
    src = REPO / "node_modules" / "@fontsource"
    wanted = {
        "almendra-latin-400-normal": src / "almendra" / "files" / "almendra-latin-400-normal.woff2",
        "almendra-latin-700-normal": src / "almendra" / "files" / "almendra-latin-700-normal.woff2",
        "almendra-latin-400-italic": src / "almendra" / "files" / "almendra-latin-400-italic.woff2",
        "uncial-antiqua-latin-400-normal": src / "uncial-antiqua" / "files" / "uncial-antiqua-latin-400-normal.woff2",
    }
    for name, woff in wanted.items():
        out = FONTS / f"{name}.ttf"
        if not out.exists():
            f = TTFont(woff)
            f.flavor = None
            f.save(out)
    conf = CACHE / "fonts.conf"
    conf.write_text(
        '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig>'
        f"<dir>{FONTS}</dir><cachedir>{CACHE / 'fc-cache'}</cachedir>"
        '<include ignore_missing="yes">/etc/fonts/fonts.conf</include></fontconfig>'
    )
    os.environ["FONTCONFIG_FILE"] = str(conf)


def rasterise(name: str, svg: str, width: int, height: int) -> pathlib.Path:
    _ensure_fonts()
    import cairosvg

    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / f"{name}.png"
    cairosvg.svg2png(bytestring=svg.encode(), write_to=str(out), output_width=width, output_height=height)
    return out


def image(name: str) -> bpy.types.Image:
    """The Blender image for one of the ARTWORK entries (rendered on first use)."""
    existing = bpy.data.images.get(name)
    if existing:
        return existing
    fn, w, h = ARTWORK[name]
    path = rasterise(name, fn(), w, h)
    img = bpy.data.images.load(str(path))
    img.name = name
    return img


# ── Artwork ─────────────────────────────────────────────────────────────────────────────────
def _svg(w, h, body, defs=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{defs}</defs>{body}</svg>'


def goose_painting():
    """A heroic goose in the grand-portrait manner, darkened by a century of pipe smoke."""
    w, h = 1200, 960
    defs = """
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c2f3a"/><stop offset="0.45" stop-color="#4f6a6a"/>
      <stop offset="0.72" stop-color="#c79a55"/><stop offset="0.8" stop-color="#e2b86c"/>
    </linearGradient>
    <radialGradient id="cloud" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#f2dcb0" stop-opacity="0.75"/><stop offset="1" stop-color="#f2dcb0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cloudDark" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#22343b" stop-opacity="0.8"/><stop offset="1" stop-color="#22343b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#48572c"/><stop offset="1" stop-color="#1a2212"/>
    </linearGradient>
    <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6b7b45"/><stop offset="1" stop-color="#2b3719"/>
    </linearGradient>
    <radialGradient id="body" cx="0.42" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#fbf7ec"/><stop offset="0.6" stop-color="#e2dccb"/><stop offset="1" stop-color="#9d9888"/>
    </radialGradient>
    <linearGradient id="neck" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b9b3a2"/><stop offset="0.5" stop-color="#f7f2e6"/><stop offset="1" stop-color="#c9c3b2"/>
    </linearGradient>
    <radialGradient id="helm" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#d7dadb"/><stop offset="0.35" stop-color="#8d9496"/><stop offset="1" stop-color="#34393b"/>
    </radialGradient>
    <linearGradient id="blade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6f777a"/><stop offset="0.5" stop-color="#e6ecee"/><stop offset="1" stop-color="#5c6366"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.55" stop-color="#1b120a" stop-opacity="0"/><stop offset="1" stop-color="#1b120a" stop-opacity="0.85"/>
    </radialGradient>
    <linearGradient id="varnish" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6b4a12" stop-opacity="0.28"/><stop offset="1" stop-color="#3a2508" stop-opacity="0.38"/>
    </linearGradient>"""
    body = f"""
    <rect width="{w}" height="{h}" fill="url(#sky)"/>
    <ellipse cx="260" cy="210" rx="330" ry="90" fill="url(#cloudDark)"/>
    <ellipse cx="880" cy="160" rx="360" ry="110" fill="url(#cloudDark)"/>
    <ellipse cx="760" cy="520" rx="420" ry="70" fill="url(#cloud)"/>
    <ellipse cx="300" cy="560" rx="330" ry="50" fill="url(#cloud)"/>
    <circle cx="930" cy="610" r="46" fill="#f6dc98" opacity="0.9"/>
    <path d="M0 650 C 220 560, 420 600, 640 640 S 1000 600, 1200 620 L 1200 960 L 0 960 Z" fill="url(#hill2)"/>
    <path d="M0 760 C 300 700, 520 760, 760 740 S 1080 700, 1200 740 L 1200 960 L 0 960 Z" fill="url(#hill)"/>
    <path d="M140 640 l 10 -60 l 12 60 Z M170 646 l 8 -44 l 9 44 Z" fill="#1d2615"/>
    <g transform="translate(40 30)">
      <ellipse cx="520" cy="860" rx="300" ry="40" fill="#0f140a" opacity="0.55"/>
      <path d="M330 700 C 300 610, 380 520, 500 520 C 560 520, 600 540, 640 560 C 700 590, 760 640, 780 700 C 800 770, 740 830, 620 845 C 500 860, 380 820, 330 700 Z" fill="url(#body)"/>
      <path d="M430 640 C 470 610, 560 610, 610 650 C 560 640, 500 650, 450 690 Z" fill="#cfc8b6" opacity="0.8"/>
      <path d="M470 700 C 520 690, 600 700, 650 740 C 600 735, 540 735, 480 760 Z" fill="#b9b2a0" opacity="0.7"/>
      <path d="M600 570 C 590 480, 600 380, 640 300 C 660 260, 700 240, 730 250 C 700 300, 690 380, 700 470 C 705 520, 680 560, 640 580 Z" fill="url(#neck)"/>
      <path d="M640 300 C 650 230, 700 190, 760 200 C 810 208, 830 250, 815 290 C 800 320, 760 330, 720 318 C 690 312, 660 315, 640 300 Z" fill="url(#body)"/>
      <path d="M812 262 C 860 262, 900 270, 918 284 C 896 296, 860 300, 812 292 Z" fill="#e0782e"/>
      <path d="M812 280 C 850 284, 885 286, 912 286" stroke="#8a3e12" stroke-width="4" fill="none"/>
      <circle cx="782" cy="252" r="10" fill="#140c06"/><circle cx="785" cy="249" r="3" fill="#fff"/>
      <path d="M680 230 C 690 150, 800 140, 830 215 C 800 205, 720 205, 680 230 Z" fill="url(#helm)"/>
      <path d="M676 232 C 720 214, 790 212, 834 222" stroke="#2a2e30" stroke-width="10" fill="none"/>
      <circle cx="712" cy="222" r="6" fill="#c9cdce"/><circle cx="760" cy="216" r="6" fill="#c9cdce"/><circle cx="806" cy="220" r="6" fill="#c9cdce"/>
      <path d="M752 150 C 740 110, 770 80, 800 90 C 780 110, 770 130, 770 150 Z" fill="#9b2a26"/>
      <g transform="translate(90 20) rotate(12 830 560)">
        <rect x="815" y="330" width="30" height="420" fill="url(#blade)"/>
        <path d="M815 330 L 830 280 L 845 330 Z" fill="#d9dfe1"/>
        <rect x="770" y="740" width="120" height="22" rx="8" fill="#6b4a1d"/>
        <rect x="818" y="760" width="24" height="90" fill="#3a2410"/>
        <circle cx="830" cy="862" r="18" fill="#b08a3a"/>
      </g>
      <path d="M700 690 C 760 650, 820 620, 860 640 C 830 690, 780 730, 720 740 Z" fill="#d8d1bf"/>
      <path d="M540 845 l -20 60 l 30 -6 l 18 -52 Z M620 845 l 10 58 l 28 -8 l -12 -52 Z" fill="#d7732d"/>
    </g>
    <rect width="{w}" height="{h}" fill="url(#vignette)"/>
    <rect width="{w}" height="{h}" fill="url(#varnish)"/>"""
    return _svg(w, h, body, defs)


def tapestry():
    w, h = 900, 1100
    border = []
    for k in range(18):
        y = 60 + k * 55
        border.append(
            f'<path d="M30 {y} l 18 -22 l 18 22 l -18 22 Z" fill="#d7a73e"/><path d="M834 {y} l 18 -22 l 18 22 l -18 22 Z" fill="#d7a73e"/>'
        )
    for k in range(14):
        x = 80 + k * 55
        border.append(f'<path d="M{x} 30 l 22 18 l -22 18 l -22 -18 Z" fill="#d7a73e"/>')
    defs = """
    <radialGradient id="field" cx="0.5" cy="0.45" r="0.7">
      <stop offset="0" stop-color="#9c2b33"/><stop offset="1" stop-color="#5a1219"/>
    </radialGradient>"""
    body = f"""
    <rect width="{w}" height="{h}" fill="#3c0c12"/>
    <rect x="70" y="70" width="{w - 140}" height="{h - 140}" fill="url(#field)"/>
    <rect x="70" y="70" width="{w - 140}" height="{h - 140}" fill="none" stroke="#d7a73e" stroke-width="10"/>
    <rect x="92" y="92" width="{w - 184}" height="{h - 184}" fill="none" stroke="#e8c46a" stroke-width="3" stroke-dasharray="14 8"/>
    {"".join(border)}
    <path d="M150 150 L 750 150 L 720 250 L 180 250 Z" fill="#e7d2a0"/>
    <text x="450" y="222" font-family="Uncial Antiqua" font-size="64" text-anchor="middle" fill="#5a1219">The Word Wars</text>
    <g font-family="Uncial Antiqua" font-size="330" text-anchor="middle">
      <text x="270" y="690" fill="#e2b344" stroke="#3a1a08" stroke-width="8">A</text>
      <text x="630" y="690" fill="#7fb4e8" stroke="#10243a" stroke-width="8">Z</text>
    </g>
    <g stroke-linecap="round">
      <path d="M360 430 L 560 700" stroke="#cfd6d8" stroke-width="16"/><path d="M540 430 L 340 700" stroke="#cfd6d8" stroke-width="16"/>
      <path d="M330 690 L 390 700 M510 700 L 570 690" stroke="#8a6a22" stroke-width="20"/>
    </g>
    <g font-family="Uncial Antiqua" font-size="150" text-anchor="middle">
      <text x="450" y="930" fill="#e2b344" stroke="#3a1a08" stroke-width="5">Y</text>
    </g>
    <path d="M450 800 L 450 945" stroke="#7fb4e8" stroke-width="12" opacity="0.8"/>
    <g fill="#e2b344" opacity="0.9">{"".join(f'<circle cx="{150 + k * 75}" cy="1000" r="10"/>' for k in range(9))}</g>"""
    return _svg(w, h, body, defs)


def stained_glass():
    """The Great Ale Flood: a colossal tankard spilling over a little town. Black = lead."""
    w, h = 1000, 1050
    panes = []
    import random as _r

    rnd = _r.Random(3)
    cols = ["#1f4f8f", "#2a6aa8", "#173c73", "#2f7a5a", "#1f5d45"]
    for j in range(7):
        for i in range(6):
            x, y = i * 170 - 20, j * 160 - 20
            c = rnd.choice(cols)
            panes.append(f'<rect x="{x}" y="{y}" width="170" height="160" fill="{c}"/>')
    body = f"""
    <rect width="{w}" height="{h}" fill="#162f55"/>
    {"".join(panes)}
    <circle cx="820" cy="170" r="80" fill="#f1e4a8"/>
    <path d="M330 220 L 670 220 L 640 700 L 360 700 Z" fill="#d49a2a"/>
    <path d="M360 260 L 420 260 L 400 660 L 380 660 Z" fill="#f0c865"/>
    <path d="M670 300 C 800 300, 820 520, 655 560" fill="none" stroke="#b07a18" stroke-width="60"/>
    <path d="M300 230 C 280 140, 380 110, 420 150 C 450 90, 560 90, 580 150 C 630 110, 720 150, 700 230 Z" fill="#fbf1d6"/>
    <path d="M340 230 C 300 300, 260 380, 250 470 C 240 560, 200 620, 150 700 L 330 700 C 330 560, 330 400, 360 280 Z" fill="#fbf1d6" opacity="0.95"/>
    <path d="M0 760 C 150 700, 250 820, 400 760 S 650 700, 780 770 S 950 720, 1000 760 L 1000 1050 L 0 1050 Z" fill="#c98a1f"/>
    <path d="M0 860 C 160 820, 280 900, 450 850 S 760 820, 1000 870 L 1000 1050 L 0 1050 Z" fill="#e0a836"/>
    <path d="M120 740 l 60 -50 l 60 50 v 70 h -120 Z" fill="#8f2f2f"/><path d="M780 760 l 50 -40 l 50 40 v 60 h -100 Z" fill="#7b3a8f"/>
    <g fill="none" stroke="#0c0c0c" stroke-width="12" stroke-linejoin="round">
      <path d="M330 220 L 670 220 L 640 700 L 360 700 Z"/>
      <path d="M670 300 C 800 300, 820 520, 655 560"/>
      <path d="M300 230 C 280 140, 380 110, 420 150 C 450 90, 560 90, 580 150 C 630 110, 720 150, 700 230"/>
      <path d="M340 230 C 300 300, 260 380, 250 470 C 240 560, 200 620, 150 700"/>
      <path d="M0 760 C 150 700, 250 820, 400 760 S 650 700, 780 770 S 950 720, 1000 760"/>
      <path d="M0 860 C 160 820, 280 900, 450 850 S 760 820, 1000 870"/>
      <circle cx="820" cy="170" r="80"/>
      <path d="M120 740 l 60 -50 l 60 50 v 70 h -120 Z M780 760 l 50 -40 l 50 40 v 60 h -100 Z"/>
      <path d="M500 220 L 500 700 M345 460 L 655 460"/>
    </g>
    <g stroke="#0c0c0c" stroke-width="8">{"".join(f'<line x1="{i * 170 - 20}" y1="0" x2="{i * 170 - 20}" y2="{h}"/>' for i in range(1, 7))}{"".join(f'<line x1="0" y1="{j * 160 - 20}" x2="{w}" y2="{j * 160 - 20}"/>' for j in range(1, 8))}</g>
    <rect width="{w}" height="{h}" fill="none" stroke="#0c0c0c" stroke-width="30"/>"""
    return _svg(w, h, body)


def _paper(w, h, content, tint=PARCH, seed=1):
    import random as _r

    rnd = _r.Random(seed)
    stains = "".join(
        f'<circle cx="{rnd.uniform(0, w):.0f}" cy="{rnd.uniform(0, h):.0f}" r="{rnd.uniform(20, 90):.0f}" fill="#7a5a2a" opacity="{rnd.uniform(0.04, 0.12):.2f}"/>'
        for _ in range(7)
    )
    defs = f"""<radialGradient id="edge{seed}" cx="0.5" cy="0.5" r="0.7"><stop offset="0.6" stop-color="#5a3d18" stop-opacity="0"/><stop offset="1" stop-color="#5a3d18" stop-opacity="0.55"/></radialGradient>"""
    return _svg(
        w,
        h,
        f'<rect width="{w}" height="{h}" fill="{tint}"/>{stains}{content}<rect width="{w}" height="{h}" fill="url(#edge{seed})"/>',
        defs,
    )


def _scribbles(x, y, width, lines, gap=34, seed=0):
    import random as _r

    rnd = _r.Random(seed)
    out = []
    for i in range(lines):
        yy = y + i * gap
        pts = [f"M{x} {yy}"]
        xx = x
        end = x + width * rnd.uniform(0.6, 1.0)
        while xx < end:
            step = rnd.uniform(8, 18)
            pts.append(f"q {step / 2:.0f} {rnd.uniform(-9, 9):.0f} {step:.0f} 0")
            xx += step
            if rnd.random() < 0.12:
                xx += 14
                pts.append("m 14 0")
        out.append(f'<path d="{" ".join(pts)}" stroke="{INK}" stroke-width="3" fill="none" opacity="0.8"/>')
    return "".join(out)


def note_lost_cat():
    return _paper(
        400,
        520,
        f"""
      <text x="200" y="80" font-family="Uncial Antiqua" font-size="54" text-anchor="middle" fill="{INK}">Lost</text>
      <text x="200" y="140" font-family="Almendra" font-size="46" text-anchor="middle" fill="{INK}">one cat.</text>
      <ellipse cx="200" cy="245" rx="70" ry="60" fill="none" stroke="{INK}" stroke-width="4"/>
      <path d="M138 215 L 142 158 L 178 190 M262 215 L 258 158 L 222 190" stroke="{INK}" stroke-width="4" fill="none" stroke-linejoin="round"/>
      <circle cx="176" cy="240" r="7" fill="{INK}"/><circle cx="224" cy="240" r="7" fill="{INK}"/>
      <path d="M192 262 l 8 8 l 8 -8 M200 270 v 10 M120 262 l 55 6 M120 280 l 55 -2 M280 262 l -55 6 M280 280 l -55 -2" stroke="{INK}" stroke-width="3" fill="none"/>
      <text x="200" y="380" font-family="Almendra" font-size="42" text-anchor="middle" fill="#6b1a12">Found: dragon.</text>
      <text x="200" y="440" font-family="Almendra" font-size="36" text-anchor="middle" font-style="italic" fill="{INK}">Please advise.</text>""",
        seed=2,
    )


def note_wanted():
    return _paper(
        420,
        560,
        f"""
      <text x="210" y="90" font-family="Uncial Antiqua" font-size="70" text-anchor="middle" fill="#5a1210">Wanted</text>
      <text x="210" y="150" font-family="Almendra" font-size="36" text-anchor="middle" fill="{INK}">a bard who rhymes</text>
      <rect x="70" y="180" width="280" height="200" fill="none" stroke="{INK}" stroke-width="4"/>
      <path d="M150 350 c 0 -80 30 -120 60 -120 c 30 0 60 40 60 120" fill="none" stroke="{INK}" stroke-width="4"/>
      <circle cx="210" cy="215" r="30" fill="none" stroke="{INK}" stroke-width="4"/>
      <text x="210" y="450" font-family="Almendra" font-size="40" text-anchor="middle" fill="{INK}">Reward: 10 gold</text>
      {_scribbles(80, 490, 260, 2, seed=5)}""",
        tint="#e2cf9e",
        seed=3,
    )


def note_quest():
    return _paper(
        380,
        440,
        f"""
      <text x="190" y="70" font-family="Uncial Antiqua" font-size="48" text-anchor="middle" fill="{INK}">Quest</text>
      <text x="190" y="130" font-family="Almendra" font-size="34" text-anchor="middle" fill="{INK}">Rats in the cellar.</text>
      <text x="190" y="180" font-family="Almendra" font-size="30" text-anchor="middle" font-style="italic" fill="{INK}">Big ones. Polite.</text>
      {_scribbles(50, 240, 280, 4, seed=7)}
      <text x="190" y="410" font-family="Almendra" font-size="34" text-anchor="middle" fill="#5a1210">5 coins &amp; a pie</text>""",
        seed=4,
    )


def note_map():
    return _paper(
        460,
        360,
        f"""
      <path d="M40 300 C 120 250, 90 180, 170 150 S 300 170, 330 90 S 420 60, 430 40" stroke="{INK}" stroke-width="5" stroke-dasharray="14 10" fill="none"/>
      <path d="M60 80 l 30 -40 l 30 40 Z M100 90 l 25 -30 l 25 30 Z" fill="none" stroke="{INK}" stroke-width="4"/>
      <circle cx="330" cy="90" r="14" fill="none" stroke="{INK}" stroke-width="4"/>
      <path d="M400 30 l 30 30 M430 30 l -30 30" stroke="#8a1a12" stroke-width="7"/>
      <text x="80" y="330" font-family="Almendra" font-size="30" fill="{INK}">here be geese</text>""",
        tint="#dcc596",
        seed=5,
    )


def note_goose():
    return _paper(
        360,
        300,
        f"""
      <text x="180" y="80" font-family="Uncial Antiqua" font-size="44" text-anchor="middle" fill="#5a1210">Beware</text>
      <text x="180" y="140" font-family="Almendra" font-size="40" text-anchor="middle" fill="{INK}">of the goose.</text>
      {_scribbles(50, 200, 260, 2, seed=9)}""",
        tint="#efe2c0",
        seed=6,
    )


def tip_label():
    return _paper(
        700,
        260,
        f"""
      <text x="350" y="90" font-family="Almendra" font-size="58" text-anchor="middle" fill="{INK}">For the Wordsmith's</text>
      <text x="350" y="180" font-family="Uncial Antiqua" font-size="72" text-anchor="middle" fill="#5a1210">Retirement</text>
      <path d="M140 210 C 260 230, 440 230, 560 210" stroke="{INK}" stroke-width="4" fill="none"/>""",
        tint="#efe0b8",
        seed=8,
    )


def certificate():
    orn = "".join(
        f'<circle cx="{40 + k * 40}" cy="40" r="6" fill="#b08a2a"/><circle cx="{40 + k * 40}" cy="760" r="6" fill="#b08a2a"/>'
        for k in range(15)
    )
    return _paper(
        640,
        800,
        f"""
      <rect x="24" y="24" width="592" height="752" fill="none" stroke="#b08a2a" stroke-width="10"/>
      <rect x="44" y="44" width="552" height="712" fill="none" stroke="#6b4a12" stroke-width="3"/>{orn}
      <text x="320" y="170" font-family="Uncial Antiqua" font-size="62" text-anchor="middle" fill="#5a1210">Royal Seal</text>
      <text x="320" y="240" font-family="Almendra" font-size="44" text-anchor="middle" fill="{INK}">of Excellence</text>
      <text x="320" y="330" font-family="Almendra" font-size="30" text-anchor="middle" font-style="italic" fill="{INK}">awarded by royal decree</text>
      <text x="320" y="375" font-family="Almendra" font-size="30" text-anchor="middle" font-style="italic" fill="{INK}">to the Wordsmith Tavern</text>
      {_scribbles(120, 450, 400, 3, seed=11)}
      <path d="M380 640 c 30 -40 60 20 90 -10 s 40 -20 60 10" stroke="{INK}" stroke-width="4" fill="none"/>
      <text x="440" y="700" font-family="Almendra" font-size="22" text-anchor="middle" fill="{INK}">an anonymous (handsome) inspector</text>""",
        tint="#efe3c4",
        seed=10,
    )


def order_slip():
    return _paper(
        420,
        560,
        f"""
      <text x="210" y="80" font-family="Uncial Antiqua" font-size="46" text-anchor="middle" fill="{INK}">Orders</text>
      <g font-family="Almendra" font-style="italic" font-size="34" fill="{INK}">
        <text x="50" y="160">ii  Hearty Stew</text><text x="50" y="220">i  Mushroom Pie</text>
        <text x="50" y="280">i  Barkroot Tea</text><text x="80" y="330" font-size="26">(spelled correctly)</text>
      </g>
      <path d="M50 400 C 150 380, 250 420, 360 395" stroke="{INK}" stroke-width="3" fill="none"/>""",
        tint="#f0e4c6",
        seed=12,
    )


def spellbook_cover():
    return _svg(
        600,
        800,
        """
      <rect width="600" height="800" fill="#000"/>
      <rect x="40" y="40" width="520" height="720" fill="none" stroke="#fff" stroke-width="10"/>
      <rect x="64" y="64" width="472" height="672" fill="none" stroke="#fff" stroke-width="3"/>
      <text x="300" y="300" font-family="Uncial Antiqua" font-size="96" text-anchor="middle" fill="#fff">Spells</text>
      <path d="M140 270 L 460 320" stroke="#fff" stroke-width="10"/>
      <text x="300" y="440" font-family="Almendra" font-size="52" text-anchor="middle" fill="#fff">Fizzlewick</text>
      <circle cx="300" cy="590" r="70" fill="none" stroke="#fff" stroke-width="8"/>
      <path d="M300 530 l 16 44 h 46 l -38 28 l 14 46 l -38 -28 l -38 28 l 14 -46 l -38 -28 h 46 Z" fill="#fff"/>""",
    )


ARTWORK = {
    "goose-painting": (goose_painting, 1200, 960),
    "tapestry-art": (tapestry, 900, 1100),
    "stained-glass": (stained_glass, 1000, 1050),
    "note-lost-cat": (note_lost_cat, 400, 520),
    "note-wanted": (note_wanted, 420, 560),
    "note-quest": (note_quest, 380, 440),
    "note-map": (note_map, 460, 360),
    "note-goose": (note_goose, 360, 300),
    "tip-label": (tip_label, 700, 260),
    "certificate": (certificate, 640, 800),
    "order-slip": (order_slip, 420, 560),
    "spellbook-cover": (spellbook_cover, 600, 800),
}
