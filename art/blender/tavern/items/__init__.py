"""Furniture builders. Each registers with @item("<furniture id>", "<slot>") and builds its
objects into the current collection."""

from __future__ import annotations

from typing import Callable

REGISTRY: dict[str, tuple[str, Callable[[], None]]] = {}


def item(furniture_id: str, slot: str):
    def deco(fn):
        REGISTRY[furniture_id] = (slot, fn)
        return fn

    return deco


def load_all():
    # Importing the modules registers their builders.
    from . import counter, fireside, floor, hearth, lights, wall_left, wall_right, window  # noqa: F401
