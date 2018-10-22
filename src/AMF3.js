"use strict"

const extend = require("lodash").extend
const difference = require("lodash").difference

class AMF3 {
  constructor(ba) {
    this.ba = ba
    this.strings = new Map()
    this.objects = new Map()
    this.traits = new Map()
  }

  isSafe(val) {
    return -Math.pow(2, 28) <= val && val <= +Math.pow(2, 28) - 1
  }

  isDenseArray(array) {
    if (!array) {
      return true
    }

    let test = 0

    for (const x in array) {
      if (x !== test) {
        return false
      }

      test++
    }

    return true
  }

  writeUnsignedInt29(val) {
    if (val < 0x80) {
      this.ba.writeUnsignedByte(val)
    } else if (val < 0x4000) {
      this.ba.writeUnsignedByte(((val >> 7) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(val & 0x7f)
    } else if (val < 0x200000) {
      this.ba.writeUnsignedByte(((val >> 14) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(((val >> 7) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(val & 0x7f)
    } else if (val < 0x40000000) {
      this.ba.writeUnsignedByte(((val >> 22) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(((val >> 15) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(((val >> 8) & 0x7f) | 0x80)
      this.ba.writeUnsignedByte(val & 0xff)
    } else {
      throw new RangeError(`${val} is out of range`)
    }
  }

  writeString(val) {
    if (val.length === 0 || val === "") {
      return this.writeUnsignedInt29((0 << 1) | 1)
    }

    if (this.strings.has(val)) {
      return this.writeUnsignedInt29((this.strings.get(val) << 1) | 0)
    }

    this.strings.set(val, this.strings.size)
    this.writeUnsignedInt29((val.length << 1) | 1)
    this.ba.writeUTFBytes(val)
  }

  writeData(val) {
    if (val === null) {
      this.ba.writeByte(1)
    } else if (val === undefined) {
      this.ba.writeByte(0)
    } else if (typeof val === "boolean") {
      this.ba.writeByte(val ? 3 : 2)
    } else if (typeof val === "number") {
      if (Number.isInteger(val) && this.isSafe(val)) {
        this.ba.writeByte(4)
        this.writeUnsignedInt29(val & 0x1fffffff)
      } else {
        this.ba.writeByte(5)
        this.ba.writeDouble(val)
      }
    } else if (val instanceof Date) {
      this.ba.writeByte(8)

      if (this.objects.has(val)) {
        return this.writeUnsignedInt29((this.objects.get(val) << 1) | 0)
      }

      this.objects.set(val, this.objects.size)
      this.writeUnsignedInt29((0 << 1) | 1)
      this.ba.writeDouble(val.getTime())
    } else if (typeof val === "string") {
      this.ba.writeByte(6)
      this.writeString(val)
    } else if (val instanceof Array) {
      this.ba.writeByte(9)

      if (this.objects.has(val)) {
        return this.writeUnsignedInt29((this.objects.get(val) << 1) | 0)
      }

      this.objects.set(val, this.objects.size)

      let isDense = this.isDenseArray(val)

      if (isDense) {
        this.writeUnsignedInt29((val.length << 1) | 1)
        this.writeString("")

        for (const i in val) {
          this.writeData(val[i])
        }
      } else {
        this.writeUnsignedInt29(1)

        for (const key in val) {
          this.writeString(key)
          this.writeData(val[key])
        }

        this.writeString("")
      }
    } else if (val instanceof Object) {
      this.ba.writeByte(10)

      if (this.objects.has(val)) {
        return this.writeUnsignedInt29((this.objects.get(val) << 1) | 0)
      }

      this.objects.set(val, this.objects.size)

      const name = val["@name"] !== undefined ? val["@name"] : ""
      const dynamic = val["@dynamic"] !== undefined ? val["@dynamic"] : true
      const externalizable = val["@externalizable"] !== undefined ? val["@externalizable"] : false
      const properties = val["@properties"] !== undefined ? val["@properties"] : []

      if (!this.traits.has(name)) {
        this.traits.set(name, this.traits.size)
        this.writeUnsignedInt29(
          (properties.length << 4) | (dynamic << 3) | (externalizable << 2) | 3
        )
        this.writeString(name)

        for (const property of properties) {
          this.writeString(property)
        }
      } else {
        this.writeUnsignedInt29((this.traits.get(name) << 2) | 1)
      }

      if (!externalizable) {
        for (const property of properties) {
          if (property[0] !== "@") {
            this.writeData(val[property])
          }
        }

        if (dynamic) {
          const keys = Object.keys(val)
          const members = difference(keys, properties)

          for (const member of members) {
            if (member[0] != "@") {
              this.writeString(member)
              this.writeData(val[member])
            }
          }

          this.writeString("")
        }
      } else {
        switch (name) {
          case "flex.messaging.io.ArrayCollection":
            this.writeData(val.source)
            break
          default:
            throw new Error("Unsupported externalizable")
        }
      }
    } else {
      throw new TypeError(`Unknown type: ${typeof val}`)
    }
  }

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

  readString() {
    const index = this.readUnsignedInt29()

    if (index & 1) {
      const val = this.ba.readUTFBytes(index >> 1)

      if (val.length !== 0) {
        this.strings.set(this.strings.size, val)
      }

      return val
    } else {
      if (this.strings.has(index >> 1)) {
        return this.strings.get(index >> 1)
      }
    }
  }

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
      const val = this.readUnsignedInt29()

      return val & 0x010000000 ? val | 0xe0000000 : val
    } else if (marker === 5) {
      return this.ba.readDouble()
    } else if (marker === 8) {
      const index = this.readUnsignedInt29()

      if (index & 1) {
        const val = new Date(this.ba.readDouble())

        this.objects.set(this.objects.size, val)

        return val.toString()
      } else {
        if (this.objects.has(index >> 1)) {
          return this.objects.get(index >> 1)
        }
      }
    } else if (marker === 6 || marker === 7 || marker === 11) {
      return this.readString()
    } else if (marker === 9) {
      const index = this.readUnsignedInt29()

      if (index & 1) {
        let key = this.readString()

        if (key === "") {
          const val = []

          this.objects.set(this.objects.size, val)

          for (let i = 0; i < index >> 1; i++) {
            val.push(this.readData())
          }

          return val
        }

        let val = {}

        this.objects.set(this.objects.size, val)

        while (key !== "") {
          val[key] = this.readData()
          key = this.readString()
        }

        for (let i = 0; i < index >> 1; i++) {
          val[i] = this.readData()
        }

        return val
      } else {
        if (this.objects.has(index >> 1)) {
          return this.objects.get(index >> 1)
        }
      }
    } else if (marker === 10) {
      const index = this.readUnsignedInt29()

      if (index & (1 << 0)) {
        const val = {}

        this.objects.set(this.objects.size, val)

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

          extend(val, traits)
        } else {
          if (this.traits.has(index >> 2)) {
            extend(val, this.traits.get(index >> 2))
          }
        }

        if (!val["@externalizable"]) {
          for (const property of val["@properties"]) {
            if (property[0] !== "@") {
              val[property] = this.readData()
            }
          }

          if (val["@dynamic"]) {
            for (let property = this.readString(); property !== ""; property = this.readString()) {
              if (property[0] !== "@") {
                val[property] = this.readData()
              }
            }
          }
        } else {
          switch (val["@name"]) {
            case "flex.messaging.io.ArrayCollection":
              val.source = this.readData()
              break
            default:
              throw new Error("Unsupported externalizable")
          }
        }

        const removeSpecs = true

        if (removeSpecs) {
          delete val["@name"]
          delete val["@externalizable"]
          delete val["@dynamic"]
          delete val["@properties"]
        }

        return val
      } else {
        if (this.objects.has(index >> 1)) {
          return this.objects.get(index >> 1)
        }
      }
    } else {
      throw new TypeError(`Unknown marker: ${marker}`)
    }
  }
}

module.exports = AMF3
