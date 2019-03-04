"use strict"

let references = []
const classAliases = {}

module.exports = class AMF0 {
  /**
   * Registers a class alias
   * @param {String} aliasName
   * @param {Class} classObject
   */
  static registerClassAlias(aliasName, classObject) {
    if (classAliases[aliasName] !== classObject) {
      classAliases[aliasName] = classObject
    }
  }

  /**
   * Clears the reference array used in AMF0
   */
  static clearReferences() {
    references = []
  }

  /**
   * Serializes data using the AMF0 format
   * @param {ByteArray} ba
   * @param {*} value
   * @param {Boolean} strMarker
   */
  static serializeData(ba, value, strMarker = true) {
    const type = typeof value

    if (value === undefined) {
      ba.writeByte(6)
    } else if (value === null) {
      ba.writeByte(5)
    } else if (type === "number") {
      ba.writeByte(0)
      ba.writeDouble(value)
    } else if (type === "boolean") {
      ba.writeByte(1)
      ba.writeBoolean(value)
    } else if (type === "string") {
      if (value.length < 65535) {
        if (strMarker) {
          ba.writeByte(2)
        }

        ba.writeUTF(value)
      } else {
        ba.writeByte(12)
        ba.writeUnsignedInt(value.length)
      }
    } else if (type === "object") {
      const func = value.constructor

      if (func === Object) {
        const idx = references.indexOf(value)

        if (idx >= 0 && idx <= 65535) {
          ba.writeByte(7)
          ba.writeUnsignedShort(idx)
        } else {
          references.push(value)
        }

        ba.writeByte(3)

        for (const key in value) {
          this.serializeData(ba, key, false)
          this.serializeData(ba, value[key])
        }

        ba.writeUTF("")
        ba.writeByte(9)
      } else if (func === Array) {
        const idx = references.indexOf(value)

        if (idx >= 0 && idx <= 65535) {
          ba.writeByte(7)
          ba.writeUnsignedShort(idx)
        } else {
          references.push(value)
        }

        ba.writeByte(8)
        ba.writeUnsignedInt(value.length)

        for (const key in value) {
          this.serializeData(ba, key, false)
          this.serializeData(ba, value[key])
        }

        ba.writeUTF("")
        ba.writeByte(9)
      } else if (func === Date) {
        ba.writeByte(11)
        ba.writeDouble(value.getTime())
        ba.writeShort(value.getTimezoneOffset())
      } else if (Object.keys(classAliases).length > 0 && func !== Number && func !== String) {
        let alias = ""

        for (const aliasName in classAliases) {
          if (classAliases[aliasName].name.toString() === func.name.toString()) {
            alias = aliasName
          }
        }

        const idx = references.indexOf(value)

        if (idx >= 0 && idx <= 65535) {
          ba.writeByte(7)
          ba.writeUnsignedShort(idx)
        } else {
          references.push(value)
        }

        if (alias.length > 0) {
          ba.writeByte(16)
          ba.writeUTF(alias)
        } else {
          ba.writeByte(3)
        }

        for (const key in value) {
          this.serializeData(ba, key, false)
          this.serializeData(ba, value[key])
        }

        ba.writeUTF("")
        ba.writeByte(9)
      } else {
        throw new TypeError(`Unknown custom constructor that is not registered as a class alias: ${func.name}`)
      }
    } else {
      throw new TypeError(`Unknown value type: ${type}`)
    }
  }

  /**
   * Deserializes data using the AMF0 format
   * @param {ByteArray} ba
   * @returns {*}
   */
  static deserializeData(ba) {
    const marker = ba.readByte()

    if (marker === 0) {
      return ba.readDouble()
    } else if (marker === 1) {
      return ba.readBoolean()
    } else if (marker === 2) {
      return ba.readUTF()
    } else if (marker === 3) {
      const value = {}

      for (let key = ba.readUTF(); key !== ""; key = ba.readUTF()) {
        value[key] = this.deserializeData(ba)
      }

      if (ba.readByte() !== 9) {
        throw new Error("Couldn't deserialize the entire buffer")
      }

      return value
    } else if (marker === 5) {
      return null
    } else if (marker === 6) {
      return undefined
    } else if (marker === 7) {
      return references[ba.readUnsignedShort()]
    } else if (marker === 8) {
      const value = {}
      const length = ba.readUnsignedInt()

      for (let key = ba.readUTF(); key !== "" && length !== 0; key = ba.readUTF()) {
        value[key] = this.deserializeData(ba)
      }

      if (ba.readByte() !== 9) {
        throw new Error("Couldn't deserialize the entire buffer")
      }

      return value
    } else if (marker === 10) {
      const value = []
      const length = ba.readUnsignedInt()

      for (let i = 0; i < length; i++) {
        value[i] = this.deserializeData(ba)
      }

      return value
    } else if (marker === 11) {
      const date = new Date(ba.readDouble())

      ba.readShort()

      return date
    } else if (marker === 12) {
      return ba.readUTFBytes(ba.readUnsignedInt())
    } else if (marker === 16) {
      let classAlias = classAliases[ba.readUTF()]

      if (!classAlias) {
        throw new Error("Deserialized an unexisting AMF0 class alias")
      }

      classAlias = new classAlias()

      for (let key = ba.readUTF(); key !== ""; key = ba.readUTF()) {
        classAlias[key] = this.deserializeData(ba)
      }

      if (ba.readByte() !== 9) {
        throw new Error("Couldn't deserialize the entire buffer")
      }

      return classAlias
    } else {
      throw new TypeError(`Unknown AMF0 marker: ${marker}`)
    }
  }
}
