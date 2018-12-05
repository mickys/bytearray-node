"use strict"

const assignIn = require("lodash.assignin")

class AMF3 {
  constructor(ba) {
    this.ba = ba

    this.strings = new Map()
    this.objects = new Map()
    this.traits = new Map()
  }

  /**
   * Checks if the value is safe
   * Separate function as it's a utility
   * @param {Number} value
   * @returns {Boolean}
   */
  isSafe(value) {
    return -Math.pow(2, 28) <= value && value <= +Math.pow(2, 28) - 1
  }

  /**
   * Checks if the array is dense
   * Separate function as it's a utility
   * @param {Array} array
   * @returns {Boolean}
   */
  isDenseArray(array) {
    if (!array) {
      return true
    }

    let c = 0

    for (const x in array) {
      if (x !== c) {
        return false
      }

      c++
    }

    return true
  }

  /**
   * Writes an array
   * Separate function as it's big
   * @param {Array} value
   */
  writeArray(value) {
    this.ba.writeByte(9)

    if (this.objects.has(value)) {
      return this.writeUnsignedInt29((this.objects.get(value) << 1) | 0)
    }

    this.objects.set(value, this.objects.size)

    if (this.isDenseArray(value)) {
      this.writeUnsignedInt29((value.length << 1) | 1)
      this.writeString("")

      for (const i in value) {
        this.writeData(value[i])
      }
    } else {
      this.writeUnsignedInt29(1)

      for (const key in value) {
        this.writeString(key)
        this.writeData(value[key])
      }

      this.writeString("")
    }
  }

  /**
   * Writes an object
   * Separate function as it's big
   * @param {Object} value
   */
  writeObject(value) {
    this.ba.writeByte(10)

    if (this.objects.has(value)) {
      return this.writeUnsignedInt29((this.objects.get(value) << 1) | 0)
    }

    this.objects.set(value, this.objects.size)

    const name = value["@name"] !== undefined ? value["@name"] : ""
    const dynamic = value["@dynamic"] !== undefined ? value["@dynamic"] : true
    const externalizable = value["@externalizable"] !== undefined ? value["@externalizable"] : false
    const properties = value["@properties"] !== undefined ? value["@properties"] : []

    if (!this.traits.has(name)) {
      this.traits.set(name, this.traits.size)
      this.writeUnsignedInt29((properties.length << 4) | (dynamic << 3) | (externalizable << 2) | 3)
      this.writeString(name)

      for (const property of properties) {
        this.writeString(property)
      }
    } else {
      this.writeUnsignedInt29((this.traits[name] << 2) | 1)
    }

    if (!externalizable) {
      for (const property of properties) {
        if (property[0] !== "@") {
          this.writeData(value[property])
        }
      }

      if (dynamic) {
        const keys = Object.keys(value)
        const members = keys.filter((x) => !properties.includes(x))

        for (const member of members) {
          if (member[0] != "@") {
            this.writeString(member)
            this.writeData(value[member])
          }
        }

        this.writeString("")
      }
    } else {
      if (name === "flex.messaging.io.ArrayCollection") {
        this.writeData(value.source)
      } else {
        throw new Error("Unsupported externalizable")
      }
    }
  }

  /**
   * Writes a string
   * Separate function as it's used multiple times
   * @param {String} value
   */
  writeString(value) {
    if (value.length === 0 || value === "") {
      return this.writeUnsignedInt29((0 << 1) | 1)
    }

    if (this.strings.has(value)) {
      return this.writeUnsignedInt29((this.strings.get(value) << 1) | 0)
    }

    this.strings.set(value, this.strings.size)
    this.writeUnsignedInt29((value.length << 1) | 1)
    this.ba.writeUTFBytes(value)
  }

  /**
   * Writes an unsigned int29
   * Separate function as it's used multiple times
   * @param {Number} value
   */
  writeUnsignedInt29(value) {
    if (value < 0x80) {
      this.ba.writeUnsignedByte(value)
    } else if (value < 0x4000) {
      this.ba.writeUnsignedByte(((value >> 7) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(value & 0x7f)
    } else if (value < 0x200000) {
      this.ba.writeUnsignedByte(((value >> 14) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(((value >> 7) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(value & 0x7f)
    } else if (value < 0x40000000) {
      this.ba.writeUnsignedByte(((value >> 22) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(((value >> 15) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(((value >> 8) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(value & 0xff)
    } else {
      throw new RangeError(`${value} is out of range`)
    }
  }

  /**
   * Serializes data
   * @param {?} value
   */
  writeData(value) {
    if (value === null) {
      this.ba.writeByte(1)
    } else if (value === undefined) {
      this.ba.writeByte(0)
    } else if (typeof value === "boolean") {
      this.ba.writeByte(value ? 3 : 2)
    } else if (typeof value === "number") {
      if (Number.isInteger(value) && this.isSafe(value)) {
        this.ba.writeByte(4)
        this.writeUnsignedInt29(value & 0x1fffffff)
      } else {
        this.ba.writeByte(5)
        this.ba.writeDouble(value)
      }
    } else if (value instanceof Date) {
      this.ba.writeByte(8)

      if (this.objects.has(value)) {
        return this.writeUnsignedInt29((this.objects.get(value) << 1) | 0)
      }

      this.objects.set(value, this.objects.size)
      this.writeUnsignedInt29((0 << 1) | 1)
      this.ba.writeDouble(value.getTime())
    } else if (typeof value === "string") {
      this.ba.writeByte(6)
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
    const index = this.readUnsignedInt29()

    if (index & 1) {
      let key = this.readString()

      if (key === "") {
        const value = []

        this.objects.set(this.objects.size, value)

        for (let i = 0; i < index >> 1; i++) {
          value.push(this.readData())
        }

        return value
      }

      let value = {}

      this.objects.set(this.objects.size, value)

      while (key !== "") {
        value[key] = this.readData()
        key = this.readString()
      }

      for (let i = 0; i < index >> 1; i++) {
        value[i] = this.readData()
      }

      return value
    } else {
      if (this.objects.has(index >> 1)) {
        return this.objects.get(index >> 1)
      }
    }
  }

  /**
   * Reads an object
   * Separate function as it's big
   * @returns {Object}
   */
  readObject() {
    const index = this.readUnsignedInt29()

    if (index & (1 << 0)) {
      const value = {}

      this.objects.set(this.objects.size, value)

      if (index & (1 << 1)) {
        const traits = {}

        this.traits.set(this.traits.size, traits)

        const name = this.readString()

        traits["@name"] = name
        traits["@externalizable"] = !!(index & (1 << 2))
        traits["@dynamic"] = !!(index & (1 << 3))
        traits["@properties"] = []

        for (let i = 0; i < index >> 4; i++) {
          traits["@properties"].push(this.readString())
        }

        assignIn(value, traits)
      } else {
        if (this.traits.has(index >> 2)) {
          assignIn(value, this.traits.get(index >> 2))
        }
      }

      if (!value["@externalizable"]) {
        for (const property of value["@properties"]) {
          if (property[0] !== "@") {
            value[property] = this.readData()
          }
        }

        if (value["@dynamic"]) {
          for (let property = this.readString(); property !== ""; property = this.readString()) {
            if (property[0] !== "@") {
              value[property] = this.readData()
            }
          }
        }
      } else {
        if (value["@name"] === "flex.messaging.io.ArrayCollection") {
          value.source = this.readData()
        } else {
          throw new Error("Unsupported externalizable")
        }
      }

      const removeSpecs = true

      if (removeSpecs) {
        delete value["@name"]
        delete value["@externalizable"]
        delete value["@dynamic"]
        delete value["@properties"]
      }

      return value
    } else {
      if (this.objects.has(index >> 1)) {
        return this.objects.get(index >> 1)
      }
    }
  }

  /**
   * Reads a string
   * Separate function as it's used multiple times
   * @returns {String}
   */
  readString() {
    const index = this.readUnsignedInt29()

    if (index & 1) {
      const value = this.ba.readUTFBytes(index >> 1)

      if (value.length !== 0) {
        this.strings.set(this.strings.size, value)
      }

      return value
    } else {
      if (this.strings.has(index >> 1)) {
        return this.strings.get(index >> 1)
      }
    }
  }

  /**
   * Reads an unsigned int29
   * Separate function as it's used multiple times
   * @returns {Number}
   */
  readUnsignedInt29() {
    let byte = this.ba.readUnsignedByte()

    if (byte < 128) {
      return byte
    }

    let ref = (byte & 0x7f) << 7

    byte = this.ba.readUnsignedByte()

    if (byte < 128) {
      return ref | byte
    }

    ref = (ref | (byte & 0x7f)) << 7
    byte = this.ba.readUnsignedByte()

    if (byte < 128) {
      return ref | byte
    }

    ref = (ref | (byte & 0x7f)) << 8
    byte = this.ba.readUnsignedByte()

    return ref | byte
  }

  /**
   * Deserializes data
   * @returns {?}
   */
  readData() {
    const marker = this.ba.readByte()

    if (marker === 1) {
      return null
    } else if (marker === 0) {
      return undefined
    } else if (marker === 3) {
      return true
    } else if (marker === 2) {
      return false
    } else if (marker === 4) {
      const value = this.readUnsignedInt29()

      return value & 0x010000000 ? value | 0xe0000000 : value
    } else if (marker === 5) {
      return this.ba.readDouble()
    } else if (marker === 8) {
      const index = this.readUnsignedInt29()

      if (index & 1) {
        const value = new Date(this.ba.readDouble())

        this.objects.set(this.objects.size, value)

        return value.toString()
      } else {
        if (this.objects.has(index >> 1)) {
          return this.objects.get(index >> 1)
        }
      }
    } else if (marker === 6 || marker === 7 || marker === 11) {
      return this.readString()
    } else if (marker === 9) {
      return this.readArray()
    } else if (marker === 10) {
      return this.readObject()
    } else {
      throw new TypeError(`Unknown marker: ${marker}`)
    }
  }
}

module.exports = AMF3
