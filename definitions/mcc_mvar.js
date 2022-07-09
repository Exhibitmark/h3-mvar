class s_blf_header {
   constructor(stream) {
      this.signature = stream.readString(4);
      this.chunk_size = stream.readUInt32();
      this.version_major = stream.readUInt16();
      this.version_minor = stream.readUInt16();
   }
}

class s_blf_chunk_start_of_file {
   constructor(stream) {
      this.header = new s_blf_header(stream)
      if(this.header.signature !== '_blf')
         throw new Error(`Invalid signature: ${this.header.signature} (expected '_blf')`)
      this.byte_order_mark = stream.readSInt16();
      this.alignment_padding_unused = stream.readString(34);
   }
}

class s_saved_game_item_metadata {
   constructor(stream) {
      this.version_major = stream.readUInt16();
      this.version_minor = stream.readUInt16();
      this.skip = stream.skipBytes(20)
      this.untracked_version = stream.readString(44)
   }
}

class s_blf_chunk_content_header {
   constructor(stream) {
      this.header = new s_blf_header(stream)
      if(this.header.signature !== 'athr')
         throw new Error(`Invalid signature: ${this.header.signature} (expected 'athr')`)
      this.content_header = new s_saved_game_item_metadata(stream)
   }
}

class c_map_variant {
   constructor(stream) {
      this.header = new s_blf_header(stream)
      if(this.header.signature !== 'mvar')
         throw new Error(`Invalid signature: ${this.header.signature} (expected 'mvar')`)
      this.id = Number(stream.readUInt64())
   }
}

class s_blffile_saved_game_file {
   constructor(stream) {
      this.start_of_file = new s_blf_chunk_start_of_file(stream)
      this.metadata = new s_blf_chunk_content_header(stream)
      this.c_map_variant = new c_map_variant(stream)
   }
}

class Vector3 {
   constructor(a, b, c) {
      this[0] = 0;
      this[1] = 0;
      this[2] = 0;
      if (a instanceof Array || a instanceof Vector3) {
         this[0] = a[0] || 0;
         this[1] = a[1] || 0;
         this[2] = a[2] || 0;
      } else if (+a === a) {
         this[0] = a || 0;
         this[1] = b || 0;
         this[2] = c || 0;
      }
   }
   get x() { return this[0]; }
   get y() { return this[1]; }
   get z() { return this[2]; }
   set x(v) { return this[0] = v; }
   set y(v) { return this[1] = v; }
   set z(v) { return this[2] = v; }
   enforce_single_precision() {
      for(let i = 0; i < 3; ++i)
         this[i] = Math.fround(this[i]);
   }
   length() { return Math.sqrt(Math.fround(this[0]*this[0] + this[1]*this[1] + this[2]*this[2])); }
   normalize() {
      let l = this.length();
      let a = Math.abs(l);
      if (0.0001 <= a) {
         a = 1.0 / l;
         this[0] *= a;
         this[1] *= a;
         this[2] *= a;
         this.enforce_single_precision();
      }
   }
}

function crossProduct(v1,v2) {
   return [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0]
   ]
 }

function normalize3d(vector){
   let result = Math.sqrt(((vector[0] * vector[0]) + (vector[1] * vector[1])) + (vector[2] * vector[2]))
   result &= -1
   if (result < 0.000099999997)
      result = 0
   vector[0] *= (1.0 / result)
   vector[1] *= (1.0 / result)
   vector[2] *= (1.0 / result)
   return vector
}

function dequantize_unit_vector3d(a1){
   let v6 = dequantize_real((a1 >> 3), -1, 1, 8, 1)
   let v7 = dequantize_real((a1 >> 11), -1, 1, 8, 1)
   let v5 = a1 & 7;
   let v = []
   switch(v5){
       case 0:
           v = [1, v6, v7]
           break;
       case 1:
           v = [v6, 1, v7]
           break;
       case 2:
           v = [v6, v7, 1]
           break;
       case 3:
           v = [-1, v6, v7]
           break;
       case 4:
           v = [v6, -1, v7]
           break;
       case 5:
           v = [v6, v7, -1]
           break;
       default:
           v = [0, 0, 1]
           break;
   }
   return normalize3d(v)
}

function dequantize_real(quantized, min_bound, max_bound, bitcount, is_signed){
   let result = min_bound
   let data_size = (1 << bitcount) - 1;
   if ( is_signed )
     data_size -= data_size % 2;
   if ( quantized ){
      if ( quantized < data_size ){
         result = ((data_size - quantized) * min_bound + (quantized * max_bound)) / data_size;
      }
      else {
         return max_bound;
      }
   }
   return result;
}

function quantize_real(value, min, max,  bitcount, is_signed, a6){
   let step_count, v9, v10, quantized_value;

   step_count = (1 << bitcount) - 1;
   if ( is_signed )
       step_count -= step_count % 2;
   v9 = (value - min) / ((max - min) / step_count);
   if ( v9 < 0.0 )
       v10 = -1.0;
   else
       v10 = 1.0;
   quantized_value = ((v10 * 0.5) + v9)

   if ( a6 ){
       if ( quantized_value || value == min ) {
       if ( quantized_value == step_count && value != max )
           return (quantized_value - 1);
       }
       else {
           return 1
       }
   }
   return Math.floor(quantized_value)
}


class s_variant_object_datum {
   readPosition(stream, mapBounds) {
      this.position.x = dequantize_real(stream.readBits(16, false), mapBounds.x.min, mapBounds.x.max, 16)
      this.position.y = dequantize_real(stream.readBits(16, false), mapBounds.y.min, mapBounds.y.max, 16);
      this.position.z = dequantize_real(stream.readBits(16, false), mapBounds.z.min, mapBounds.z.max, 16);
   }

   axes_compute_reference_internal(up, forward, axes){
      let v10, v11, v12, v13, v14; 
      v10 = up[0] + 0 & -1
      v11 = up[1] + 0 & -1
      if ( v11 <= v10 ){
        v12 = 0 - up[0];
        v14 = 0;
        v13 = up[2]
      } else {
        v12 = 0 - up[1];
        v13 = 0
        v14 = up[2]
      }
      forward[0] = v13;
      forward[1] = v14;
      forward[2] = v12;
      forward = this.normalize3d(forward)
      axes[0] = (forward[2] * up[1]) - (up[2] * forward[1]);
      axes[2] = (forward[1] * up[0]) - (up[1] * forward[0]);
      axes[1] = (up[2] * forward[0]) - (forward[2] * up[0]);
      return this.normalize3d(axes)
   }
   normalize3d(vector){
      let result = Math.sqrt(((vector[0] * vector[0]) + (vector[1] * vector[1])) + (vector[2] * vector[2]))
      let v6 = (result - 0.0) & -1
      if (v6 < 0.000099999997)
        v6 = 0
      vector[0] *= (1.0 / result)
      vector[1] *= (1.0 / result)
      vector[2] *= (1.0 / result)
      return vector
   }

   constructor(stream, mapBounds) {
      this.position = new Vector3(); 
      this.up = new Vector3();


      let variant_object_exists = stream.readBits(1);
      if (!variant_object_exists){
         this.spawn_attached_to = -1
         this.boundary_positive_height = 0
         this.boundary_width_or_radius = 0
         this.m_flags =  0x90C0000
         return
      }


      //console.log(`Variant Object Exists`)

      this.e_variant_object_placement_flags = stream.readBits(16, false);
      //readFlags(flags, this.e_variant_object_placement_flags)

      this.variant_object_definition_index = stream.readBits(32, false);
      let parent_object_exists = stream.readBits(1);
      if (parent_object_exists){
         console.log(`\nParent Object Exists`)
         this.parent_object_identifier = stream.readBits(64, false)
      } else {
        // console.log(`\nParent Object Does Not Exist`)
         this.parent_object_identifier = -1
      }
         
      let variant_object_position_exists = stream.readBits(1);

      if (variant_object_position_exists){
         this.readPosition(stream, mapBounds);
      } else {
         console.log(`${count}: \nPosition Does Not Exist`)
         return
      }
      let up_is_global_up3d = stream.readBits(1)
      if (up_is_global_up3d) {
         console.log('up-is-global-up3d')
         this.up.x = 0;
         this.up.y = 0;
         this.up.z = 1;

      } else {
         this.raw_up = stream.readBits(19, false);
        //a = dequantize_unit_vector3d(a)
      }
      this.rawrotation = stream.readBits(8, false)

      this.e_multiplayer_object_type = stream.readBits(8, false), //variant-properties-cached-object-type
      this.e_variant_placement_flags = stream.readBits(8, false), //variant-properties-flags
      this.game_engine_flags = stream.readBits(16, false), //variant-properties-game-engine-flags
      this.shared_storage = stream.readBits(8, false), //variant-properties-shared-storage
      this.spawn_time = stream.readBits(8, false), //variant-properties-spawn-time
      this.team_affiliation = stream.readBits(8, false) //variant-properties-team-affiliation
      this.shape_type = stream.readBits(8, false)

      if(this.shape_type == 1){
         let v26 = stream.readBits(16, false)
         this.boundary_width_or_radius = dequantize_real(v26, 0.0, 60.0, 16, 0)
         return
      } else if(this.shape_type == 2){
         return
      } else if(this.shape_type == 3){
         let v18 = stream.readBits(16, false)
         this.boundary_width_or_radius = dequantize_real(v18, 0.0, 60.0, 16, 0)
         let v20 = stream.readBits(16, false)
         this.boundary_box_length = dequantize_real(v20, 0.0, 60.0, 16, 0)
         let v22 = stream.readBits(16, false)
         this.boundary_positive_height = dequantize_real(v22, 0.0, 60.0, 16, 0)
         let v24 = stream.readBits(16, false)
         this.boundary_negative_height = dequantize_real(v24, 0.0, 60.0, 16, 0)
      } else {
        this.spawn_attached_to = -1
        this.boundary_positive_height = 0.0
        this.boundary_width_or_radius = 0.0
      }
      
   }
}

let count = 0 
class mapVariant {
   constructor(stream) {
      this.start_of_file = new s_blf_chunk_start_of_file(stream)
      this.metadata = new s_blf_chunk_content_header(stream)
      this.c_map_variant = new c_map_variant(stream)
      this.title = stream.readWidecharString(128, true);
      this.description = stream.readString(128, true);
      this.author = stream.readString(128, true);
      this.file_type = stream.readBits(5, false) - 1,
      this.online = stream.readBits(1, false),
      this.xuid = stream.readUInt64().toString(16),
      this.size_in_bytes = Number(stream.readUInt64()),
      this.date = Number(stream.readUInt64()),
      this.length_seconds = stream.readUInt32(),
      this.campaign_id = stream.readSInt32(),
      this.map_id = stream.readSInt32(),
      this.game_engine_index = stream.readBits(7,false),
      this.campaign_difficulty = stream.readByte(),
      this.hopper_id = stream.readByte(),
      this.game_id = Number(stream.readUInt64()), //includes padding
      this.m_map_variant_version = stream.readByte(),
      this.m_original_map_signature_hash = stream.readUInt32(),
      this.m_number_of_scenario_objects = stream.readBits(10,false),
      this.m_number_of_variant_objects = stream.readBits(10,false),
      this.m_number_of_placeable_object_quota = stream.readBits(9,false),
      this.map_id = stream.readSInt32(),
      this.built_in = stream.readBits(1,false),

      this.bounds = {
         x: { min: stream.readFloat(), max: stream.readFloat() },
         y: { min: stream.readFloat(), max: stream.readFloat() },
         z: { min: stream.readFloat(), max: stream.readFloat() },
      },
      this.m_game_engine_subtype = stream.readBits(4, false),
      this.m_maximum_budget = stream.readFloat(),
      
      this.m_spent_budget = stream.readFloat(),

      this.forgeObjects = {};
      this.startIndices = [];
      this.quotas = [];

      for(let i = 0; i < this.m_number_of_variant_objects; ++i) {
         count = i
        if(i > 639){
            this.forgeObjects[i] = {
               object_index: -1,
               definition_index: -1,
               spawn_attached_to: -1,
               multiplayer_game_object_properties_m_flags: 0x90C0000,
               multiplayer_game_object_properties_boundary_positive_height: 0,
               multiplayer_game_object_properties_boundary_width_or_radius: 0
            }
         }
         this.forgeObjects[i] = new s_variant_object_datum(stream, this.bounds);
      }

      for(let i = 0; i < 14; ++i) {
         this.startIndices[i] = stream.readBits(9, false)-1
      }
      for(let i = 0; i < this.m_number_of_placeable_object_quota; ++i) {
         this.quotas[i] = {
            "object_definition_index": stream.readBits(32, false).toString(16),
            "minimum_count": stream.readBits(8, false),
            "maximum_count": stream.readBits(8, false),
            "placed_on_map": stream.readBits(8, false),
            "maximum_allowed": stream.readBits(8, false),
            "price_per_item": stream.readFloat(),
         }
      }

   }
}

module.exports = {
   mapVariant,
   s_variant_object_datum
}