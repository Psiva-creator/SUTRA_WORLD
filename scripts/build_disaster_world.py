"""
Automated Blender Script: Flooded Disaster World Builder
Project: Disaster Management 3D World (Medellín Flood Base + Conformed City Sectors)
"""

import bpy
import mathutils
from mathutils.bvhtree import BVHTree
import os

def build_world():
    # 1. Clean default scene
    if "Cube" in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects["Cube"], do_unlink=True)

    # 2. Import Base Land Model
    medellin_glb = '/home/rohith/hello world /SUTRA_WORLD/city-medellin-apocalyptic-flood-eo-1/source/City - Medellín - Apocalyptic Flood_EO_1A.glb'
    print("Importing Base Land Asset...")
    bpy.ops.import_scene.gltf(filepath=medellin_glb)
    print(f"Base land imported. Total scene objects: {len(bpy.data.objects)}")

    # 3. Build Global Terrain BVHTree for Elevation Conforming
    depsgraph = bpy.context.evaluated_depsgraph_get()
    terrain_objs = [obj for obj in bpy.data.objects if 'BuildingMesh' in obj.name]
    all_terrain_verts = []
    all_terrain_polys = []

    for tobj in terrain_objs:
        mw = tobj.matrix_world
        base_idx = len(all_terrain_verts)
        tob_eval = tobj.evaluated_get(depsgraph)
        tmesh = tob_eval.to_mesh()
        all_terrain_verts.extend([mw @ v.co for v in tmesh.vertices])
        for poly in tmesh.polygons:
            all_terrain_polys.append([base_idx + vi for vi in poly.vertices])
        tob_eval.to_mesh_clear()

    bvh = BVHTree.FromPolygons(all_terrain_verts, all_terrain_polys)
    print(f"Global Terrain BVHTree constructed with {len(all_terrain_verts)} vertices.")

    # 4. Helper to place and conform sporting village sectors
    def place_conformed_sector(tile_names, collection_name, glb_path):
        target_objs = [bpy.data.objects.get(name) for name in tile_names if bpy.data.objects.get(name)]
        if not target_objs:
            print(f"Error: No target tiles found for {collection_name}")
            return

        all_t_verts = []
        for tobj in target_objs:
            mw = tobj.matrix_world
            all_t_verts.extend([mw @ v.co for v in tobj.data.vertices])
            
        t_min_x = min(v.x for v in all_t_verts)
        t_max_x = max(v.x for v in all_t_verts)
        t_min_y = min(v.y for v in all_t_verts)
        t_max_y = max(v.y for v in all_t_verts)
        t_min_z = min(v.z for v in all_t_verts)
        t_max_z = max(v.z for v in all_t_verts)
        
        t_size_x = t_max_x - t_min_x
        t_size_y = t_max_y - t_min_y
        
        print(f"\n[Placing] {collection_name}:")
        print(f"  Target X Footprint: [{t_min_x:.3f}, {t_max_x:.3f}] (width: {t_size_x:.3f}m)")
        print(f"  Target Y Footprint: [{t_min_y:.3f}, {t_max_y:.3f}] (length: {t_size_y:.3f}m)")
        
        existing_objs = set(bpy.data.objects.keys())
        bpy.ops.import_scene.gltf(filepath=glb_path)
        
        imported_objs = [bpy.data.objects[name] for name in bpy.data.objects.keys() if name not in existing_objs]
        imported_meshes = [obj for obj in imported_objs if obj.type == 'MESH']
        
        col = bpy.data.collections.new(collection_name)
        bpy.context.scene.collection.children.link(col)
        
        # Capture raw world vertex positions before hierarchy detachment
        obj_world_verts = {}
        for obj in imported_meshes:
            mw = obj.matrix_world.copy()
            obj_world_verts[obj.name] = [mw @ v.co for v in obj.data.vertices]
            
        all_raw_verts = []
        for vlist in obj_world_verts.values():
            all_raw_verts.extend(vlist)
            
        raw_min_x = min(v.x for v in all_raw_verts)
        raw_max_x = max(v.x for v in all_raw_verts)
        raw_min_y = min(v.y for v in all_raw_verts)
        raw_max_y = max(v.y for v in all_raw_verts)
        raw_size_x = raw_max_x - raw_min_x
        raw_size_y = raw_max_y - raw_min_y
        
        scale_x = t_size_x / raw_size_x
        scale_y = t_size_y / raw_size_y
        scale_z = (scale_x + scale_y) / 2.0
        
        for obj in imported_meshes:
            raw_coords = obj_world_verts[obj.name]
            mesh = obj.data
            
            for i, v in enumerate(mesh.vertices):
                w_co = raw_coords[i]
                
                u = (w_co.x - raw_min_x) / raw_size_x
                v_norm = (w_co.y - raw_min_y) / raw_size_y
                
                new_x = t_min_x + u * t_size_x
                new_y = t_min_y + v_norm * t_size_y
                
                rel_h = max(0.0, w_co.z) * scale_z
                if w_co.z < 0:
                    rel_h = w_co.z * scale_z * 0.2
                    
                origin = mathutils.Vector((new_x, new_y, 20.0))
                direction = mathutils.Vector((0, 0, -1.0))
                hit_loc, hit_norm, hit_idx, hit_dist = bvh.ray_cast(origin, direction)
                
                if hit_loc:
                    ground_z = hit_loc.z
                else:
                    near_loc, near_norm, near_idx, near_dist = bvh.find_nearest(mathutils.Vector((new_x, new_y, (t_min_z + t_max_z)/2)))
                    ground_z = near_loc.z if near_loc else (t_min_z + t_max_z) / 2
                    
                new_z = ground_z + rel_h
                v.co = mathutils.Vector((new_x, new_y, new_z))
                
            mesh.update()
            obj.matrix_world = mathutils.Matrix.Identity(4)
            obj.parent = None
            
            for c in list(obj.users_collection):
                c.objects.unlink(obj)
            col.objects.link(obj)
            
        for obj in imported_objs:
            if obj.type == 'EMPTY':
                bpy.data.objects.remove(obj, do_unlink=True)
                
        all_v = [v.co for o in col.objects for v in o.data.vertices]
        dim_x = max(v.x for v in all_v) - min(v.x for v in all_v)
        dim_y = max(v.y for v in all_v) - min(v.y for v in all_v)
        print(f"  -> Sector '{collection_name}' ready: {len(col.objects)} meshes, {dim_x:.3f}m x {dim_y:.3f}m")

    # 5. Place Sector 1
    sporting_village_glb = '/home/rohith/Downloads/sporting_village.glb'
    place_conformed_sector(
        ['BuildingMesh-00106', 'BuildingMesh-00107', 'BuildingMesh-00343', 'BuildingMesh-00345'],
        'SportingVillage_00106_00107_00343_00345',
        sporting_village_glb
    )

    # 6. Place Sector 2
    place_conformed_sector(
        ['BuildingMesh-00335', 'BuildingMesh-00337', 'BuildingMesh-00336', 'BuildingMesh-00338'],
        'SportingVillage_00335_00337_00336_00338',
        sporting_village_glb
    )

    print("\nWorld building completed successfully!")

if __name__ == '__main__':
    build_world()
