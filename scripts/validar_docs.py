#!/usr/bin/env python3
"""Coherencia de la documentación del frontend.

1. Todo enlace Markdown relativo apunta a un archivo que existe. Los que salen del
   repositorio (`../LogisticaMinera/...`) se ignoran: el backend no está en el CI.
2. Ningún documento revive conceptos del alcance anterior de la tesis (DR-01, D-F07).
   Una línea puede citarlos si dice explícitamente que están fuera de alcance.

Sale con código 1 si encuentra algo, y lista cada hallazgo con archivo y línea.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ARCHIVOS = [RAIZ / "README.md", RAIZ / "CONTRIBUTING.md", *sorted((RAIZ / "docs").glob("*.md")),
            *sorted((RAIZ / "skills").glob("*/SKILL.md"))]

ENLACE = re.compile(r"\]\(([^)#\s]+)(?:#[^)]*)?\)")

RESIDUOS = {
    r"\buuidLocal\b": "uuid local de la cola sin conexión",
    r"\bhoraCapturaLocal\b": "hora de captura de la cola sin conexión",
    r"features/(salidas|existencias|reportes|busqueda)\b": "feature del alcance anterior",
    r"\bngsw-config\b": "service worker (D-F07)",
    r"frontend-offline-pwa": "skill reemplazada por frontend-registro-ticket",
}
PERMITIDO = re.compile(
    r"fuera de alcance|salió del alcance|reemplaza a|obsolet|residuo|anterior|retir|ninguna mención", re.IGNORECASE
)


def validar() -> list[str]:
    hallazgos: list[str] = []
    for archivo in ARCHIVOS:
        relativo = archivo.relative_to(RAIZ)
        for numero, linea in enumerate(archivo.read_text(encoding="utf-8").splitlines(), start=1):
            for destino in ENLACE.findall(linea):
                if destino.startswith(("http://", "https://", "mailto:")):
                    continue
                ruta = (archivo.parent / destino).resolve()
                if RAIZ not in ruta.parents and ruta != RAIZ:
                    continue
                if not ruta.exists():
                    hallazgos.append(f"{relativo}:{numero}: enlace roto a {destino}")
            if PERMITIDO.search(linea):
                continue
            for patron, motivo in RESIDUOS.items():
                if re.search(patron, linea):
                    hallazgos.append(f"{relativo}:{numero}: {motivo}")
    return hallazgos


def main() -> int:
    hallazgos = validar()
    for hallazgo in hallazgos:
        print(hallazgo)
    print(f"{len(ARCHIVOS)} documentos revisados, {len(hallazgos)} hallazgos.")
    return 1 if hallazgos else 0


if __name__ == "__main__":
    sys.exit(main())
