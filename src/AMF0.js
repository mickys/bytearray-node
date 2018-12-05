"use strict"

class AMF0 {
  constructor(ba) {
    this.ba = ba
    this.references = new Map()
  }

  /**
   * Checks if the array is strict
   * @param {Array} array
   */
  isStrict(array) {
    return Object.keys(array).reduce((isStrict, key) => isStrict && Number.isInteger(key), true)
  }

  /**
   * Writes an array
   * Separate function as it's big
   * @param {Array} value
   */
  writeArray(value) {
    if (this.references.has(value)) {
      return this.writeReference(value)
    }

    this.references.set(value, this.references.size)

    if (this.isStrict(value)) {
      this.ba.writeByte(10)
      this.ba.writeUnsignedInt(value.length)

      for (const element of value) {
        this.writeData(element)
      }
    } else {
      this.ba.writeByte(8)
      this.ba.writeUnsignedInt(value.length)

      for (const key in value) {
        this.writeString(key)
        this.writeData(value[key])
      }

      this.ba.writeShort(0)
      this.ba.writeByte(9)
    }
  }

  /**
   * Writes an object
   * Separate function as it's big
   * @param {Object} value
   */
  writeObject(value) {
    if (this.references.has(value)) {
      return this.writeReference(value)
    }

    this.references.set(value, this.references.size)
    this.ba.writeByte(3)

    for (const key in value) {
      this.writeString(key)
      this.writeData(value[key])
    }

    this.ba.writeShort(0)
    this.ba.writeByte(9)
  }

  /**
   * Writes a reference
   * Separate function as it's used multiple times
   * @param {Number} value
   */
  writeReference(value) {
    const reference = this.references.get(value)

    if (reference <= 0xffff) {
      this.ba.writeByte(7)
      this.ba.writeUnsignedShort(reference)
    }
  }

  /**
   * Writes a string
   * Separate function as it's used multiple times
   * @param {String} value
   */
  writeString(value) {
    if (value.length <= 0xffff) {
      return this.ba.writeUTF(value)
    }

    this.ba.writeByte(12)
    this.ba.writeUnsignedInt(value.length)
    this.ba.writeUTFBytes(value)
  }

  /**
   * Serializes data
   * @param {?} value
   */
  writeData(value) {
    if (value === null) {
      this.ba.writeByte(5)
    } else if (value === undefined) {
      this.ba.writeByte(6)
    } else if (typeof value === "boolean") {
      this.ba.writeByte(1)
      this.ba.writeBoolean(value)
    } else if (typeof value === "number") {
      this.ba.writeByte(0)
      this.ba.writeDouble(value)
    } else if (value instanceof Date) {
      this.ba.writeByte(11)
      this.ba.writeDouble(value.getTime())
    } else if (typeof value === "string") {
      this.ba.writeByte(2)
      this.writeString(value)
    } else if (value instanceof Array) {
      this.writeArray(value)
    } else if (value instanceof Object) {
      this.writeObject(value)
    } else {
      throw new TypeError(`Unknown type: ${typeof value}`)
    }
  }

  /**
   * Reads an array
   * Separate function as it's big
   * @returns {Array}
   */
  readArray() {
    const value = []

    this.references.set(this.references.size, value)

    const length = this.ba.readUnsignedInt()

    for (let i = 0; i < length; i++) {
      value.push(this.readData())
    }

    return value
  }

  /**
   * Reads an object
   * Separate function as it's big
   * @returns {Object}
   */
  readObject() {
    const value = {}

    this.references.set(this.references.size, value)

    for (let key = this.ba.readUTF(); key !== ""; key = this.ba.readUTF()) {
      value[key] = this.readData()
    }

    if (this.ba.readByte() === 9) {
      return value
    }
  }

  /**
   * Reads an ECMA array
   * Separate function as it's big
   * @returns {Array}
   */
  readECMAArray() {
    const value = []
    const length = this.ba.readUnsignedInt()
    let name = this.ba.readUTF()

    while (name.length > 0 && length !== 0) {
      value[name] = this.readData()
      name = this.ba.readUTF()
    }

    if (this.ba.readByte() === 9) {
      return value
    }
  }

  /**
   * Deserializes data
   * @returns {?}
   */
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
      return this.readArray()
    } else if (marker === 3) {
      return this.readObject()
    } else if (marker === 7) {
      return this.references.get(this.ba.readUnsignedShort())
    } else if (marker === 8) {
      return this.readECMAArray()
    } else {
      throw new TypeError(`Unknown marker: ${marker}`)
    }
  }
}

module.exports = AMF0
