"use strict"

const zlib = require("zlib")

class ByteArray {
  /**
   * Initialize a new ByteArray
   * @param {Buffer|Array} buffer
   */
  constructor(buffer) {
    /**
     * Holds the data
     * @type {Buffer}
     */
    this.buffer = Buffer.isBuffer(buffer) ? buffer : Array.isArray(buffer) ? Buffer.from(buffer) : Buffer.alloc(0)
    /**
     * The current position
     * @type {Number}
     */
    this.position = 0
    /**
     * The byte order
     * @type {Boolean}
     */
    this.endian = true
    /**
     * The compression level for ZLIB
     * @type {Number}
     */
    this.compressionLevel = 9
  }

  /**
   * Expands the buffer
   * @param {Number} value
   */
  expand(value) {
    this.buffer = Buffer.concat([this.buffer, Buffer.alloc(value)])
  }

  /**
   * Returns the length of the buffer
   * @returns {Number}
   */
  get length() {
    return this.buffer.length
  }

  /**
   * Sets the length of the buffer
   * @param {Number} value
   */
  set length(value) {
    if (value === 0) {
      this.clear()
    } else if (value !== this.length) {
      if (value < this.length) {
        this.buffer = this.buffer.slice(0, value)
      } else {
        this.expand(value)
      }

      this.position = this.length
    }
  }

  /**
   * Returns the amount of bytes available
   * @returns {Number}
   */
  get bytesAvailable() {
    return this.length - this.position
  }

  /**
   * Clears the buffer and resets the length and position to 0
   */
  clear() {
    this.buffer = Buffer.alloc(0)
    this.position = 0
  }

  /**
   * Compresses the buffer
   * @param {String} algorithm
   */
  compress(algorithm) {
    algorithm = algorithm.toLowerCase()

    if (algorithm === "zlib") {
      if (this.compressionLevel < -1 || this.compressionLevel > 9) {
        throw new Error(`Out of range compression level: ${this.compressionLevel}`)
      }

      this.buffer = zlib.deflateSync(this.buffer, { level: this.compressionLevel })
    } else if (algorithm === "deflate") {
      this.buffer = zlib.deflateRawSync(this.buffer)
    } else {
      throw new Error(`Invalid compression algorithm: ${algorithm}`)
    }

    this.position = this.length
  }

  /**
   * Compresses the buffer using deflate
   */
  deflate() {
    this.compress("deflate")
  }

  /**
   * Decompresses the buffer using deflate
   */
  inflate() {
    this.uncompress("deflate")
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
    return this.buffer.readInt8(this.position++)
  }

  /**
   * Reads multiple signed bytes from a ByteArray
   * @param {ByteArray} bytes
   * @param {Number} offset
   * @param {Number} length
   */
  readBytes(bytes, offset = 0, length = 0) {
    if (length === 0) {
      length = this.bytesAvailable
    }

    if (bytes.length < offset + length) {
      bytes.expand(offset + length - bytes.position)
    }

    for (let i = 0; i < length; i++) {
      bytes.buffer[i + offset] = this.buffer[i + this.position]
    }

    this.position += length
  }

  /**
   * Reads a double
   * @returns {Number}
   */
  readDouble() {
    const value = this.endian ? this.buffer.readDoubleBE(this.position) : this.buffer.readDoubleLE(this.position)
    this.position += 8
    return value
  }

  /**
   * Reads a float
   * @returns {Number}
   */
  readFloat() {
    const value = this.endian ? this.buffer.readFloatBE(this.position) : this.buffer.readFloatLE(this.position)
    this.position += 4
    return value
  }

  /**
   * Reads a signed int
   * @returns {Number}
   */
  readInt() {
    const value = this.endian ? this.buffer.readInt32BE(this.position) : this.buffer.readInt32LE(this.position)
    this.position += 4
    return value
  }

  /**
   * Reads a multibyte string
   * @param {Length} length
   * @param {String} charSet
   * @returns {String}
   */
  readMultiByte(length, charSet = "utf8") {
    const position = this.position
    this.position += length

    if (Buffer.isEncoding(charSet)) {
      return this.buffer.toString(charSet, position, position + length)
    } else {
      throw new Error(`Invalid character set: ${charSet}`)
    }
  }

  /**
   * Reads a signed short
   * @returns {Number}
   */
  readShort() {
    const value = this.endian ? this.buffer.readInt16BE(this.position) : this.buffer.readInt16LE(this.position)
    this.position += 2
    return value
  }

  /**
   * Reads an unsigned byte
   * @returns {Number}
   */
  readUnsignedByte() {
    return this.buffer.readUInt8(this.position++)
  }

  /**
   * Reads an unsigned int
   * @returns {Number}
   */
  readUnsignedInt() {
    const value = this.endian ? this.buffer.readUInt32BE(this.position) : this.buffer.readUInt32LE(this.position)
    this.position += 4
    return value
  }

  /**
   * Reads an unsigned short
   * @returns {Number}
   */
  readUnsignedShort() {
    const value = this.endian ? this.buffer.readUInt16BE(this.position) : this.buffer.readUInt16LE(this.position)
    this.position += 2
    return value
  }

  /**
   * Reads a UTF-8 string
   * @returns {String}
   */
  readUTF() {
    const length = this.readUnsignedShort()
    const position = this.position
    this.position += length
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
   * Converts the buffer to a string
   * @param {String} charSet
   * @param {Number} offset
   * @param {Number} length
   * @returns {String}
   */
  toString(charSet = "utf8", offset = 0, length = this.length) {
    return this.buffer.toString(charSet, offset, length)
  }

  /**
   * Decompresses the buffer
   * @param {String} algorithm
   */
  uncompress(algorithm) {
    algorithm = algorithm.toLowerCase()

    if (algorithm === "zlib") {
      if (this.compressionLevel < -1 || this.compressionLevel > 9) {
        throw new Error(`Out of range compression level: ${this.compressionLevel}`)
      }

      this.buffer = zlib.inflateSync(this.buffer, { level: this.compressionLevel })
    } else if (algorithm === "deflate") {
      this.buffer = zlib.inflateRawSync(this.buffer)
    } else {
      throw new Error(`Invalid compression algorithm: ${algorithm}`)
    }

    this.position = 0
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
    this.expand(1)
    this.buffer.writeInt8(value, this.position++)
  }

  /**
   * Writes multiple signed bytes to a ByteArray
   * @param {ByteArray} bytes
   * @param {Number} offset
   * @param {Number} length
   */
  writeBytes(bytes, offset = 0, length = 0) {
    if (length === 0) {
      length = bytes.length - offset
    }

    this.expand(this.position + length - this.position)

    for (let i = 0; i < length; i++) {
      this.buffer[i + this.position] = bytes.buffer[i + offset]
    }

    this.position += length
  }

  /**
  * Writes a double
  * @param {Number} value
  */
  writeDouble(value) {
    this.expand(8)
    this.endian ? this.buffer.writeDoubleBE(value, this.position) : this.buffer.writeDoubleLE(value, this.position)
    this.position += 8
  }

  /**
   * Writes a float
   * @param {Number} value
   */
  writeFloat(value) {
    this.expand(4)
    this.endian ? this.buffer.writeFloatBE(value, this.position) : this.buffer.writeFloatLE(value, this.position)
    this.position += 4
  }

  /**
   * Writes a signed int
   * @param {Number} value
   */
  writeInt(value) {
    this.expand(4)
    this.endian ? this.buffer.writeInt32BE(value, this.position) : this.buffer.writeInt32LE(value, this.position)
    this.position += 4
  }

  /**
   * Writes a multibyte string
   * @param {String} value
   * @param {String} charSet
   */
  writeMultiByte(value, charSet = "utf8") {
    const length = Buffer.byteLength(value)
    this.expand(length)

    if (Buffer.isEncoding(charSet)) {
      this.buffer.write(value, this.position, length, charSet)
      this.position += length
    } else {
      throw new Error(`Invalid character set: ${charSet}`)
    }
  }

  /**
   * Writes a signed short
   * @param {Number} value
   */
  writeShort(value) {
    this.expand(2)
    this.endian ? this.buffer.writeInt16BE(value, this.position) : this.buffer.writeInt16LE(value, this.position)
    this.position += 2
  }

  /**
   * Writes an unsigned byte
   * @param {Number} value
   */
  writeUnsignedByte(value) {
    this.expand(1)
    this.buffer.writeUInt8(value, this.position++)
  }

  /**
   * Writes an unsigned int
   * @param {Number} value
   */
  writeUnsignedInt(value) {
    this.expand(4)
    this.endian ? this.buffer.writeUInt32BE(value, this.position) : this.buffer.writeUInt32LE(value, this.position)
    this.position += 4
  }

  /**
   * Writes an unsigned short
   * @param {Number} value
   */
  writeUnsignedShort(value) {
    this.expand(2)
    this.endian ? this.buffer.writeUInt16BE(value, this.position) : this.buffer.writeUInt16LE(value, this.position)
    this.position += 2
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

    this.expand(length)
    this.writeUnsignedShort(length)
    this.buffer.write(value, this.position, length)
    this.position += length
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
