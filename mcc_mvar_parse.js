const fs = require('fs');
const bs = require('./bitstream.js')
const { mapVariant } = require('./definitions/mcc_mvar.js')

if(!process.argv[2])
    throw new Error('No file specified')

let file_buffer = fs.readFileSync(process.argv[2]);


function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

function toObject(json) {
    return JSON.parse(JSON.stringify(json, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value // return everything else unchanged
    ));
}

let arrayBuffer = toArrayBuffer(file_buffer)
let stream = new bs.Bitstream(arrayBuffer)

let map_variant = new mapVariant(stream)
let name = process.argv[3] || 'test_out'
fs.writeFileSync(`${name}.json`, JSON.stringify(toObject(map_variant),undefined,2))