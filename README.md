# ByteArray-node

ByteArray-node is a rewrite of ByteArray.js. The difference between these 2 is that ByteArray-node uses pure Buffer implementation making it faster and cleaner. It is advised to use this implementation instead! This implementation supports scalable buffers, which is very unique.

A quick example (there's more in /test/):

```javascript
const ByteArray = require("bytearray-node")

const ba = new ByteArray()

ba.writeShort(55)
ba.writeByte(45)

ba.readShort() // 55
ba.readByte() // 45

ba.writePosition // 3
ba.readPosition // 3
```

# Installation

**npm install bytearray-node**
