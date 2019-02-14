# ByteArray-node

This is a Node.js implementation of the Actionscript 3 ByteArray, without any dependencies!

# Installation

`npm install bytearray-node`

# Specification

### Unsupported methods
- LZMA compression/uncompression
- The serialization/deserialization of objects (AMF0/AMF3)
- atomicCompareAndSwapIntAt/atomicCompareAndSwapLength

### Unsupported properties
- defaultObjectEncoding (AMF)
- objectEncoding (AMF)
- shareable (Atomic methods)

### Extra supported methods
- writeUnsignedByte
- writeUnsignedShort

### Extra supported properties
- The endian is defined by a boolean (Default = true, true = BE, false = LE)
- compressionLevel (Default = 9, Range= -1/9, ZLIB only)
- writeUTF/readUTF uses an unsigned short to support longer strings
- You can initialize a new ByteArray with a buffer or array

# Examples and tests

See `/test/`
