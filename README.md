# ByteArray-node

ByteArray-node is a rewrite of ByteArray.js. The difference between these 2 is that ByteArray-node uses pure Buffer implementation making it faster and cleaner. It is advised to use this implementation instead!

A quick example (there's more in /test/):

```javascript
const ByteArray = require("bytearray-node")

const ba = new ByteArray()

ba.writeShort(55)
ba.writeByte(45)

ba.position = 0

ba.readShort() // 55
ba.readByte() // 45
```

AMF0 is supported in this library, demo:

```javascript
const ByteArray = require("bytearray-node")

const ba = new ByteArray()

ba.writeObject({id: 1})

ba.position = 0

ba.readObject() // { id: 1 }
```

# Installation

**npm install bytearray-node**