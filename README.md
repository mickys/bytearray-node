# ByteArray-node

ByteArray-node is a rewrite of ByteArray.js. The difference between these 2 is that ByteArray-node uses pure DataView implementation making it faster and cleaner. It is advised to use this implementation instead!

# Installation

**npm install bytearray-node**

A quick example:

```javascript
const ByteArray = require("bytearray-node")

const ba = new ByteArray()

ba.writeShort(55)
ba.writeByte(45)

ba.readShort() // 55
ba.readByte() // 45
```