# 📦 SUTRA WORLD — Required 3D Assets Library

This module contains **21 disaster response, urban architecture, collapsed structures, flood obstacles, and emergency vehicle 3D assets** pulled from `osrf/gazebo_models` and converted into dual-format (`.dae` / `.obj` + standalone `.glb` & `.sdf`).

---

## 🏗️ Asset Catalog & Categories

### 🏚️ 1. Collapsed & Disaster Structures
* `collapsed_house`: Fractured 2-story residential home with collapsed roof, broken masonry, and rubble piles.
* `collapsed_industrial`: Heavy industrial warehouse with sheared steel beams and collapsed concrete floor slabs.
* `collapsed_fire_station`: Damaged municipal garage with collapsed vehicle bays and brick debris.
* `collapsed_police_station`: Caved-in civic building with cracked concrete walls.

### 🏡 2. Intact & Partially Submerged Residential Houses
* `house_1`: Standard two-story single-family suburban home.
* `house_2`: Multi-room residential dwelling.
* `house_3`: Modern suburban residence.
* `office_building`: Multi-story urban office structure.

### 🌉 3. Disaster Infrastructure & Flood Hazards
* `water_tower`: Elevated water storage tank tower (23.3m).
* `truss_bridge`: Heavy steel structural bridge for river/canal crossings.
* `jersey_barrier`: Concrete flood and traffic barrier.
* `drc_practice_orange_jersey_barrier`: High-visibility safety barrier.
* `drc_practice_white_jersey_barrier`: White highway safety barrier.
* `construction_barrel`: Orange safety drum with reflective stripes.
* `construction_cone`: Traffic cone for hazard perimeter demarcation.
* `fire_hydrant`: Municipal street fire hydrant.

### 🚑 4. Emergency Rescue Vehicles & Robotics
* `ambulance`: Emergency medical response van.
* `fire_truck`: Municipal fire and rescue engine.
* `suv`: Heavy-duty search-and-rescue patrol SUV.
* `warehouse_robot`: Autonomous mobile ground robot for disaster inspection.
* `cardboard_box`: Supply crate and floating debris prop.

---

## 🛠️ Supported Formats
Every asset includes:
1. **`model.sdf` & `model.config`**: Native Gazebo Classic & Modern Gazebo Garden/Harmonic simulation descriptions.
2. **`meshes/*.dae` or `*.obj`**: High-detail polygon source geometry.
3. **`materials/textures/*`**: Diffuse, normal, and specular image maps.
4. **`*.glb` (glTF 2.0 Binary)**: Self-contained, embedded-texture 3D models for instant loading in Three.js, Blender, and React.
