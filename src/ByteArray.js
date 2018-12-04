"use strict"

const AMF3 = require("./AMF3")
const AMF0 = require("./AMF0")

const DEFAULT_SIZE = 2048

class ByteArray {
  constructor(buffer) {
    this.writePosition = 0
    this.readPosition = 0
    this.endian = true
    this.objectEncoding = 3

    if (buffer instanceof ByteArray) {
      this.buffer = buffer.buffer
    } else if (Buffer.isBuffer(buffer)) {
      this.buffer = buffer
    } else {
      this.buffer = Buffer.alloc(typeof buffer === "number" ? parseInt(buffer) : DEFAULT_SIZE)
    }
  }

  /**
   * Returns the amount of bytes available
   * @returns {Number}
   */
  get bytesAvailable() {
    return this.writePosition - this.readPosition
  }

  /**
   * Returns the length of the buffer
   * @returns {Number}
   */
  get length() {
    return this.buffer.length
  }

  /**
   * Clears the buffer and resets the positions
   */
  clear() {
    this.buffer = Buffer.alloc(DEFAULT_SIZE)
    this.reset()
  }

  /**
   * Resets the positions
   */
  reset() {
    this.writePosition = 0
    this.readPosition = 0
  }

  /**
   * Checks if you can write data
   * @param {Number} length
   * @returns {Boolean}
   */
  canWrite(length) {
    return this.length - this.writePosition >= length
  }

  /**
   * Scales the buffer if needed
   * @param {Number} length
   */
  scaleBuffer(length) {
    const oldBuffer = this.buffer

    // DEFAULT_SIZE avoids memory leaks
    this.buffer = Buffer.alloc(this.length + DEFAULT_SIZE + length)

    oldBuffer.copy(this.buffer)
  }

  /**
   * Reads a boolean
   * @returns {Boolean}
   */
  readBoolean() {
    return this.readByte() !== 0
  }

  /**
   * Reads a signed byte
   * @returns {Number}
   */
  readByte() {
    const value = this.buffer.readInt8(this.readPosition)

    this.readPosition += 1

    return value
  }

  /**
   * Reads multiple signed bytes
   * @param {ByteArray} buffer
   * @param {Number} offset
   * @param {Number} length
   */
  readBytes(buffer, offset = 0, length = 0) {
    if (offset < 0 || length < 0) {
      throw new RangeError("Offset/Length can't be less than 0")
    }

    if (length === 0) {
      length = this.bytesAvailable
    }

    if (length > this.bytesAvailable) {
      throw new RangeError("Length can't be greater than the amount of bytes available")
    }

    if (!buffer.canWrite(offset + length)) {
      buffer.scaleBuffer(offset + length)
    }

    if (length > 0) {
      for (let i = 0; i < length; i++) {
        buffer.writeByte(this.readByte())
      }
    }
  }

  /**
   * Reads a double
   * @returns {Number}
   */
  readDouble() {
    const value = this.endian ? this.buffer.readDoubleBE(this.readPosition) : this.buffer.readDoubleLE(this.readPosition)

    this.readPosition += 8

    return value
  }

  /**
   * Reads a float
   * @returns {Number}
   */
  readFloat() {
    const value = this.endian ? this.buffer.readFloatBE(this.readPosition) : this.buffer.readFloatLE(this.readPosition)

    this.readPosition += 4

    return value
  }

  /**
   * Reads a half precision float
   * @returns {Number}
   */
  readHalfFloat() {
    const value = this.readUnsignedShort()
    const sign = (value & 0x8000) >> 15
    const exponent = (value & 0x7c00) >> 10
    const fraction = value & 0x03ff

    if (exponent === 0) {
      return (sign ? -1 : 1) * Math.pow(2, -14) * (fraction / Math.pow(2, 10))
    } else if (exponent === 0x1f) {
      return fraction ? NaN : (sign ? -1 : 1) * Infinity
    }

    return (sign ? -1 : 1) * Math.pow(2, exponent - 15) * (1 + fraction / Math.pow(2, 10))
  }

  /**
   * Reads a signed int
   * @returns {Number}
   */
  readInt() {
    const value = this.endian ? this.buffer.readInt32BE(this.readPosition) : this.buffer.readInt32LE(this.readPosition)

    this.readPosition += 4

    return value
  }

  /**
   * Reads a multibyte string
   * @param {Length} length
   * @param {String} charSet
   * @returns {String}
   */
  readMultiByte(length, charSet = "utf8") {
    const position = this.readPosition

    this.readPosition += length

    if (Buffer.isEncoding(charSet)) {
      return this.buffer.toString(charSet, position, position + length)
    }
  }

  /**
   * Reads an object
   * @returns {Object}
   */
  readObject() {
    return this.objectEncoding === 3 ? new AMF3(this).readData() : new AMF0(this).readData()
  }

  /**
   * Reads a signed short
   * @returns {Number}
   */
  readShort() {
    const value = this.endian ? this.buffer.readInt16BE(this.readPosition) : this.buffer.readInt16LE(this.readPosition)

    this.readPosition += 2

    return value
  }

  /**
   * Reads an unsigned byte
   * @returns {Number}
   */
  readUnsignedByte() {
    const value = this.buffer.readUInt8(this.readPosition)

    this.readPosition += 1

    return value
  }

  /**
   * Reads an unsigned int
   * @returns {Number}
   */
  readUnsignedInt() {
    const value = this.endian ? this.buffer.readUInt32BE(this.readPosition) : this.buffer.readUInt32LE(this.readPosition)

    this.readPosition += 4

    return value
  }

  /**
   * Reads an unsigned short
   * @returns {Number}
   */
  readUnsignedShort() {
    const value = this.endian ? this.buffer.readUInt16BE(this.readPosition) : this.buffer.readUInt16LE(this.readPosition)

    this.readPosition += 2

    return value
  }

  /**
   * Reads a UTF-8 string
   * @returns {String}
   */
  readUTF() {
    const length = this.readShort()
    const position = this.readPosition

    this.readPosition += length

    return this.buffer.toString("utf8", position, position + length)
  }

  /**
   * Reads multiple UTF-8 bytes
   * @param {Number} length
   * @returns {String}
   */
  readUTFBytes(length) {
    return this.readMultiByte(length)
  }

  /**
   * Converts the buffer to JSON
   * @returns {JSON}
   */
  toJSON() {
    return this.buffer.toJSON()
  }

  /**
   * Converts the buffer to string
   * @param {String} charSet
   * @param {Number} offset
   * @param {Number} length
   * @returns {String}
   */
  toString(charSet = "utf8", offset = 0, length = this.length) {
    return this.buffer.toString(charSet, offset, length)
  }

  /**
   * Writes a boolean
   * @param {Boolean} value
   */
  writeBoolean(value) {
    this.writeByte(value ? 1 : 0)
  }

  /**
   * Writes a signed byte
   * @param {Number} value
   */
  writeByte(value) {
    if (!this.canWrite(1)) {
      this.scaleBuffer(1)
    }

    this.buffer.writeInt8(value, this.writePosition)

    this.writePosition += 1
  }

  /**
   * Writes multiple signed bytes
   * @param {ByteArray} buffer
   * @param {Number} offset
   * @param {Number} length
   */
  writeBytes(buffer, offset = 0, length = 0) {
    if (offset < 0 || length < 0) {
      throw new Error("Offset/Length can't be less than 0")
    }

    if (offset > buffer.length) {
      offset = buffer.length
    }

    if (length === 0) {
      length = buffer.length - offset
    }

    if (length > buffer.length - offset) {
      throw new RangeError("Length can't be greater than the length of the buffer")
    }

    if (length > 0) {
      for (let i = offset; i < length; i++) {
        this.writeByte(buffer.readByte())
      }
    }
  }

  /**
   * Writes a double
   * @param {Number} value
   */
  writeDouble(value) {
    if (!this.canWrite(8)) {
      this.scaleBuffer(8)
    }

    this.endian ? this.buffer.writeDoubleBE(value, this.writePosition) : this.buffer.writeDoubleLE(value, this.writePosition)

    this.writePosition += 8
  }

  /**
   * Writes a float
   * @param {Number} value
   */
  writeFloat(value) {
    if (!this.canWrite(4)) {
      this.scaleBuffer(4)
    }

    this.endian ? this.buffer.writeFloatBE(value, this.writePosition) : this.buffer.writeFloatLE(value, this.writePosition)

    this.writePosition += 4
  }

  /**
   * Writes a half precision float
   * @param {Number} value
   */
  writeHalfFloat(value) {
    if (!this.canWrite(2)) {
      this.scaleBuffer(2)
    }

    const floatView = new Float32Array(1)
    const int32View = new Int32Array(floatView.buffer)

    floatView[0] = value

    const x = int32View[0]

    let bits = (x >> 16) & 0x8000
    let mantissa = (x >> 12) & 0x07ff
    let exponent = (x >> 23) & 0xff

    if (exponent < 103) {
      return this.writeUnsignedShort(bits)
    }

    if (exponent > 142) {
      bits |= 0x7c00
      bits |= (exponent == 255 ? 0 : 1) && x & 0x007fffff

      return this.writeUnsignedShort(bits)
    }

    if (exponent < 113) {
      mantissa |= 0x0800
      bits |= (mantissa >> (114 - exponent)) + ((mantissa >> (113 - exponent)) & 1)

      return this.writeUnsignedShort(bits)
    }

    bits |= ((exponent - 112) << 10) | (mantissa >> 1)
    bits += mantissa & 1

    this.writeUnsignedShort(bits)
  }

  /**
   * Writes a signed int
   * @param {Number} value
   */
  writeInt(value) {
    if (!this.canWrite(4)) {
      this.scaleBuffer(4)
    }

    this.endian ? this.buffer.writeInt32BE(value, this.writePosition) : this.buffer.writeInt32LE(value, this.writePosition)

    this.writePosition += 4
  }

  /**
   * Writes a multibyte string
   * @param {String} value
   * @param {String} charSet
   */
  writeMultiByte(value, charSet = "utf8") {
    const length = Buffer.byteLength(value)

    if (!this.canWrite(length)) {
      this.scaleBuffer(length)
    }

    if (Buffer.isEncoding(charSet)) {
      this.buffer.write(value, this.writePosition, length, charSet)

      this.writePosition += length
    }
  }

  /**
   * Writes an object
   * @param {Object} value
   */
  writeObject(value) {
    this.objectEncoding === 3 ? new AMF3(this).writeData(value) : new AMF0(this).writeData(value)
  }

  /**
   * Writes a signed short
   * @param {Number} value
   */
  writeShort(value) {
    if (!this.canWrite(2)) {
      this.scaleBuffer(2)
    }

    this.endian ? this.buffer.writeInt16BE(value, this.writePosition) : this.buffer.writeInt16LE(value, this.writePosition)

    this.writePosition += 2
  }

  /**
   * Writes an unsigned byte
   * @param {Number} value
   */
  writeUnsignedByte(value) {
    if (!this.canWrite(1)) {
      this.scaleBuffer(1)
    }

    this.buffer.writeUInt8(value, this.writePosition)

    this.writePosition += 1
  }

  /**
   * Writes an unsigned int
   * @param {Number} value
   */
  writeUnsignedInt(value) {
    if (!this.canWrite(4)) {
      this.scaleBuffer(4)
    }

    this.endian ? this.buffer.writeUInt32BE(value, this.writePosition) : this.buffer.writeUInt32LE(value, this.writePosition)

    this.writePosition += 4
  }

  /**
   * Writes an unsigned short
   * @param {Number} value
   */
  writeUnsignedShort(value) {
    if (!this.canWrite(2)) {
      this.scaleBuffer(2)
    }

    this.endian ? this.buffer.writeUInt16BE(value, this.writePosition) : this.buffer.writeUInt16LE(value, this.writePosition)

    this.writePosition += 2
  }

  /**
   * Writes a UTF-8 string
   * @param {String} value
   */
  writeUTF(value) {
    const length = Buffer.byteLength(value)

    if (length > 65535) {
      throw new RangeError("Length can't be greater than 65535")
    }

    if (!this.canWrite(length)) {
      this.scaleBuffer(length)
    }

    this.writeUnsignedShort(length)

    this.buffer.write(value, this.writePosition, length)

    this.writePosition += length
  }

  /**
   * Writes multiple UTF-8 bytes
   * @param {String} value
   */
  writeUTFBytes(value) {
    this.writeMultiByte(value)
  }
}

module.exports = ByteArray
