# ByteArray-node

This is a Node.js implementation of the Actionscript 3 ByteArray, without any dependencies!

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

### Extra supported properties
- You can use registerClassAlias in the ByteArray class
- The endian is defined by a boolean (Default = true, true = BE, false = LE)
- compressionLevel (Default = 9, Range= -1/9, ZLIB only)
- writeUTF/readUTF uses an unsigned short to support longer strings
- You can initialize a new ByteArray with a buffer or array

# Examples and tests

See `/test/`

# AMF0 and registerClassAlias

This library fully supports AMF0 and class aliases. Below is a simple illustration.

First, in Actionscript 3:

```actionscript
// Person.as
package {
  public class Person {
    public var name:String;
    public var age:Number;

    public function Person(name:String, age:Number) {
      this.name = name;
      this.age = age;
    }
  }
}

// Main.as
package {
  import flash.utils.ByteArray;
  import flash.net.registerClassAlias;

  import flash.display.Sprite;
  import flash.events.Event;

  import Person;

  public class Main extends Sprite {
    public function Main() {
      registerClassAlias("com.person", Person);

      var ba:ByteArray = new ByteArray();
      ba.objectEncoding = 0;
      ba.writeObject(new Person("Mike", 30));
    }
  }
}
```

To do this using this library, you can do the following:

```javascript
// Person.js
module.exports = class Person {
  constructor(name, age) {
    this.name = name
    this.age = age
  }
}

// Main.js
const ByteArray = require("bytearray-node")
const Person = require("./Person")

const ba = new ByteArray()

ba.registerClassAlias("com.person", Person)
ba.writeObject(new Person("Mike", 30))
ba.position = 0
console.log(ba.readObject()) // Person { name: 'Mike', age: 30 }
```
