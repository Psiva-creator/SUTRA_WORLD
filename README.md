# SUTRA_WORLD - 3D Flooded Disaster Management Environment

A high-fidelity 3D environment for disaster simulation, flood modeling, and emergency response management built with **Blender 5.2.1 LTS** and **Blender MCP**.

## Features
- **Base Land:** Full Medellín Apocalyptic Flood model with high-resolution satellite topography and sea water plane.
- **Urban Sectors:** Multiple Sporting Village sectors procedurally conformed to the undulating terrain contours using BVH raycasting heightmaps.
- **Reproducible Python Pipeline:** Build scripts available in `scripts/build_disaster_world.py`.
- **Full Architecture & Session Documentation:** Detailed step-by-step history documented in [`CONVERSATION_HISTORY.md`](./CONVERSATION_HISTORY.md).

## Quickstart (Rebuilding in Blender)
```bash
python3 scripts/build_disaster_world.py
```
