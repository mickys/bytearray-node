# ByteArray-node

This is a Node.js implementation of the Actionscript 3 ByteArray, supporting AMF0.

# Installation

`npm install bytearray-node`

# Usage

This library is the same as the ByteArray in Actionscript 3.

```javascript
const ByteArray = require("bytearray-node")

const ba = new ByteArray()

ba.writeByte(1)

ba.position = 0

console.log(ba.readByte()) // 1
```

For more tests and examples, see `/test/`.

# ByteArray specification

### Unsupported methods
- LZMA compression/uncompression
- AMF3 serialization/deserialization
- atomicCompareAndSwapIntAt/atomicCompareAndSwapLength

### Unsupported properties
- objectEncoding (We support AMF0 only)
- shareable (Atomic methods)

### Extra supported methods
- writeUnsignedByte
- writeUnsignedShort
- writeUnsignedInt29
- readUnsignedInt29

### Extra supported properties
- More character sets for writeMultiByte/readMultiByte thanks to **iconv-lite**
- You can use the uint29 methods by constructing a new ByteArray
- You can use registerClassAlias by constructing a new ByteArray
- The endian is defined as a boolean (Default = true, true = BE, false = LE)
- You can construct a new ByteArray with a buffer or array

# AMF0 specification

### Unsupported methods
- XML Document
- AVMPlus marker (AMF3 switch)
- The writing of Strict Arrays (ECMA Arrays are the standard, Strict Arrays are AMF0 packets only)

### Supported functionalities to note
- Typed objects are returned as a class
- registerClassAlias is supported
- Long strings are supported
- Date serialization writes the timezone offset
