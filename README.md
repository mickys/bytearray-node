# ByteArray-node

This is a Node.js implementation of the Actionscript 3 ByteArray, supporting AMF0.

# Installation

`npm install bytearray-node`

# Specification

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
- compressionLevel (Default = 9, Range= -1/9, **ZLIB only**)
- You can construct a new ByteArray with a buffer or array

# Examples

`For more examples, see /test/`

This library fully supports AMF0 and class aliases. Below is a simple illustration.

```javascript
// Person.js
module.exports = class Person {
  constructor(name, age) {
    this.name = name
    this.age = age
  }

  get mikeAge() {
    if (this.name === "Mike") {
      return this.age
    }
  }
}

// Main.js
const ByteArray = require("bytearray-node")
const Person = require("./Person")

const ba = new ByteArray()

ba.registerClassAlias("com.person", Person)
ba.writeObject(new Person("Mike", 30))
ba.position = 0

const person = ba.readObject() // Person { name: 'Mike', age: 30 }

person instanceof Person // true
person.mikeAge // 30
```
