from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType


SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"


def load_script_module(name: str) -> ModuleType:
    if str(SCRIPTS_DIR) not in sys.path:
        sys.path.insert(0, str(SCRIPTS_DIR))

    module_path = SCRIPTS_DIR / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"alm_{name}", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load module for {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
