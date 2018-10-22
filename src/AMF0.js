"use strict"

class AMF0 {
  constructor(ba) {
    this.ba = ba
    this.references = new Map()
  }

  isStrict(array) {
    return Object.keys(array).reduce((isStrict, key) => isStrict && Number.isInteger(key), true)
  }

  writeData(val) {
    if (val === null) {
      this.ba.writeByte(5)
    } else if (val === undefined) {
      this.ba.writeByte(6)
    } else if (typeof val === "boolean") {
      this.ba.writeByte(1)
      this.ba.writeBoolean(val)
    } else if (typeof val === "number") {
      this.ba.writeByte(0)
      this.ba.writeDouble(val)
    } else if (val instanceof Date) {
      this.ba.writeByte(11)
      this.ba.writeDouble(val.getTime())
    } else if (typeof val === "string") {
      this.ba.writeByte(2)
      this.writeString(val)
    } else if (val instanceof Array) {
      if (this.references.has(val)) {
        return this.writeReference(val)
      }

      this.references.set(val, this.references.size)

      if (this.isStrict(val)) {
        this.ba.writeByte(10)
        this.ba.writeUnsignedInt(val.length)

        for (const element of val) {
          this.writeData(element)
        }
      } else {
        this.ba.writeByte(8)
        this.ba.writeUnsignedInt(val.length)

        for (const key in val) {
          this.writeString(key)
          this.writeData(val[key])
        }

        this.ba.writeShort(0)
        this.ba.writeByte(9)
      }
    } else if (val instanceof Object) {
      if (this.references.has(val)) {
        return this.writeReference(val)
      }

      this.references.set(val, this.references.size)

      if (val["@name"] !== undefined) {
        this.ba.writeByte(16)
        this.writeString(val["@name"])
      } else {
        this.ba.writeByte(3)
      }

      for (const key in val) {
        if (key[0] !== "@") {
          this.writeString(key)
          this.writeData(val[key])
        }
      }

      this.ba.writeShort(0)
      this.ba.writeByte(9)
    } else {
      throw new TypeError(`Unknown type: ${typeof val}`)
    }
  }

  readData() {
    const marker = this.ba.readByte()

    if (marker === 5) {
      return null
    } else if (marker === 6 || marker === 13) {
      return undefined
    } else if (marker === 1) {
      return this.ba.readBoolean()
    } else if (marker === 0) {
      return this.ba.readDouble()
    } else if (marker === 11) {
      return new Date(this.ba.readDouble()).toString()
    } else if (marker === 2) {
      return this.ba.readUTF()
    } else if (marker === 12 || marker === 15) {
      return this.ba.readUTFBytes(this.ba.readUnsignedInt())
    } else if (marker === 10) {
      const val = []

      this.references.set(this.references.size, val)

      const len = this.ba.readUnsignedInt()

      for (let i = 0; i < len; i++) {
        val.push(this.readData())
      }

      return val
    } else if (marker === 3) {
      const val = {}

      this.references.set(this.references.size, val)

      for (let key = this.ba.readUTF(); key !== ""; key = this.ba.readUTF()) {
        if (key[0] !== "@") {
          val[key] = this.readData()
        }
      }

      if (this.ba.readByte() === 9) {
        return val
      }
    } else if (marker === 16) {
      const val = {}

      this.references.set(this.references.size, val)

      val["@name"] = this.ba.readUTF()

      for (let key = this.ba.readUTF(); key !== ""; key = this.ba.readUTF()) {
        if (key[0] !== "@") {
          val[key] = this.readData()
        }
      }

      if (this.ba.readByte() === 9) {
        return val
      }
    } else if (marker === 7) {
      return this.references.get(this.ba.readUnsignedShort())
    } else if (marker === 8) {
      const val = []
      const len = this.ba.readUnsignedInt()
      let elementName = this.ba.readUTF()

      while (elementName.length > 0 && len !== 0) {
        val[elementName] = this.readData()
        elementName = this.ba.readUTF()
      }

      if (this.ba.readByte() === 9) {
        return val
      }
    } else if (marker === 17) {
      this.ba.objectEncoding = 3

      return this.ba.readObject()
    } else {
      throw new TypeError(`Unknown marker: ${marker}`)
    }
  }

  writeReference(val) {
    const reference = this.references.get(val)

    if (reference <= 0xffff) {
      this.ba.writeByte(7)
      this.ba.writeUnsignedShort(reference)
    }
  }

  writeString(val) {
    if (val.length <= 0xffff) {
      return this.ba.writeUTF(val)
    }

    this.ba.writeByte(12)
    this.ba.writeUnsignedInt(val.length)
    this.ba.writeUTFBytes(val)
  }
}

module.exports = AMF0
