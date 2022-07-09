# h3-mvar
 
# Halo 3 MCC MVAR Research/Parsing
## Types
MCC uses 2 file types for storing map variants.

### MVAR
This is what is used when you save a map in forge. While it's layout is similar to a mapv, it's stored as a bitstream.

### MAPV
This is what maps are stored as if they were ported from Xbox 360 fileshares. While still being stored as a .mvar file, this is a different format that uses the struct of s_blf_chunk_compressed_data. It is essentially a zip file of the original mapv format from Xbox 360 Halo 3.

## To-Do
- Parse rotations to their correct values. Currently they're parsed as their quantized values and are never dequantized.

## Credits
Camden for helping with unknown structs and helping with understanding the bitstream process.
DavidJCobb for his bitstream library

## License
[MIT](https://choosealicense.com/licenses/mit/)