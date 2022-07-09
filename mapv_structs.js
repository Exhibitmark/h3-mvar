
const s_blf_header = struct()
    .chars('signature',4)
    .word32Ube('chunk_size')
    .word16Ube('version_major')
    .word16Ube('version_minor')

const s_blf_chunk_start_of_file = struct()
    .struct('header', s_blf_header)
    .word16Sbe('byte_order_mark')
    .chars('alignment_padding_unused', 34)

const s_saved_game_item_metadata = struct()
    .word16Ube('version_major')
    .word16Ube('version_minor')
    .word64Ube('unique_id')
    .chars('w_display_name',32,'hex')
    .chars('description', 128)
    .chars('author',16)
    .word32Ube('file_type') //e_saved_game_file_type
    .word8('author_is_xuid_online')
    .chars('pad0', 3)
    .chars('author_xuid',8,'hex')
    .word64Ube('size_in_bytes')
    .word64Ube('date')
    .word32Ube('length_seconds')
    .word32Sbe('campaign_id') //e_campaign_id
    .word32Sbe('map_id') //e_map_id
    .word32Sbe('game_engine_index') //e_game_engine_type
    .word32Sbe('campaign_difficulty') //e_campaign_difficulty_level
    .word16Sbe('hopper_id')
    .word16Sbe('pad')
    .word64Ube('game_id')

const s_blf_chunk_content_header = struct()
    .struct('header', s_blf_header)
    .struct('content_header', s_saved_game_item_metadata)

const s_blf_chunk_end_of_file = struct()
    .struct('header', s_blf_header)
    .word32Sbe('total_file_size')
    .word32Sbe('authentication_type') //e_blf_file_authentication_type

const s_blf_chunk_compressed_data = struct()
    .struct('header', s_blf_header)
    .word8('compression_type') //e_blf_file_compression_type
    .word32Ube('uncompressed_size')

const shape_data = struct()
    .floatbe('radius_width')
    .floatbe('depth')
    .floatbe('top')
    .floatbe('bottom')

const s_variant_quota = struct()
    .chars('object_definition_index',4,'hex')
    .word8('minimum_count')
    .word8('maximum_count')
    .word8('placed_on_map')
    .word8('maximum_allowed')
    .floatbe('price_per_item')

const c_object_identifier = struct()
    .word32Sbe('m_unique_id')
    .word16Sbe('m_origin_bsp_index')
    .word8('m_type')
    .word8('m_source')

const s_variant_multiplayer_object_properties_definition = struct()
    .word16Ube('game_engine_flags') //e_scenario_game_engine
    .word8('flags') //e_variant_placement_flags
    .word8('team_affiliation')
    .word8('shared_storage')
    .word8('spawn_time_in_seconds')
    .word8('cached_object_type') //e_multiplayer_object_type
    .word8('shape_type') //e_multiplayer_object_boundary_shape
    .struct('shape', shape_data)

const s_variant_object_datum = struct()
    .word16Sbe('flags')
    .word16Sbe('reuse_timeout')
    .word32Sbe('object_index')
    .word32Sbe('helper_object_index')
    .word32Sbe('definition_index')
    .struct('position', core.real_point3d)
    .struct('right', core.real_point3d)
    .struct('up', core.real_point3d)
    .struct('spawn_attached_to', c_object_identifier)
    .struct('map_variant_placement_properties', s_variant_multiplayer_object_properties_definition)

const s_blffile_saved_game_file = struct()
    .struct('start_of_file', s_blf_chunk_start_of_file)
    .struct('metadata', s_blf_chunk_content_header)
    .struct('cmp_header', s_blf_chunk_compressed_data)

const c_map_variant = struct()
    .struct('header', s_blf_header)
    .word16Ule('build_minor')
    .word16Ule('build_major')
    .word64Ube('id')
    .chars('w_map_name',32,'hex')
    .chars('description',128)
    .chars('author',16)
    .word32Sbe('file_type') //e_saved_game_file_type
    .word8('author_is_xuid_online')
    .chars('pad0', 3)
    .chars('xuid',8,'hex')
    .word64Ube('size_in_bytes')
    .word64Ube('date')
    .word32Sbe('length_seconds')
    .word32Sbe('campaign_id') //e_campaign_id
    .word32Sbe('map_id') //e_map_id
    .word32Sbe('game_engine_index') //e_game_engine_type
    .word32Sbe('campaign_difficulty') //e_campaign_difficulty_level
    .word16Sbe('hopper_id')
    .word64Ube('game_id')
    .word16Sbe('pad')
    .word16Sbe('m_map_variant_version')
    .word16Sbe('m_number_of_scenario_objects')
    .word16Sbe('m_number_of_variant_objects')
    .word16Sbe('m_number_of_placeable_object_quotas')
    .word32Sbe('m_map_id')
    .struct('m_variant_scenario_bounds', core.real_rectangle3d)
    .word32Sbe('m_game_engine_subtype') //e_scenario_game_engine
    .floatbe('m_maximum_budget')
    .floatbe('m_spent_budget')
    .word16Sbe('m_showing_helpers')
    .word16Sbe('m_built_in')
    .word32Ule('m_original_map_signature_hash');

const map_variant = struct()
    .struct('c_map_variant', c_map_variant)
    .array('m_variant_objects',640, s_variant_object_datum)
    .array('m_object_type_start_index',14, 'word16Sbe')
    .array('m_quotas', 256, s_variant_quota)
    .array('m_gamestate_indices', 80, 'chars',4,'hex')