"use strict"

const zlib = require("zlib")
const iconv = require("iconv-lite")
const AMF0 = require("./AMF0")

class ByteArray {
  /**
   * Construct a new ByteArray
   * @constructor
   * @param {Buffer|Array} buffer - Available argument to construct a new ByteArray with a buffer or array
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
   * @param {Number} value - The amount to expand the buffer
   */
  expand(value) {
    this.buffer = Buffer.concat([this.buffer, Buffer.alloc(value)])
  }

  /**
   * Returns the length of the buffer
   * @returns {Number} - The length of the buffer
   */
  get length() {
    return this.buffer.length
  }

  /**
   * Sets the length of the buffer
   * @param {Number} value - The length to set the buffer to
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
   * @returns {Number} - The amount of bytes available
   */
  get bytesAvailable() {
    return this.length - this.position
  }

  /**
   * Registers a class alias
   * @param {String} aliasName - The alias name to serialize
   * @param {Class} classObject - The class to register as an alias
   */
  registerClassAlias(aliasName, classObject) {
    AMF0.registerClassAlias(aliasName.toString(), classObject)
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
   * @param {String} algorithm - The algorithm to compress the buffer
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
   * @returns {Boolean} - The value
   */
  readBoolean() {
    return this.readByte() !== 0
  }

  /**
   * Reads a signed byte
   * @returns {Number} - The value
   */
  readByte() {
    return this.buffer.readInt8(this.position++)
  }

  /**
   * Reads multiple signed bytes from a ByteArray
   * @param {ByteArray} bytes - The ByteArray to read data into
   * @param {Number} offset - The position where to start reading
   * @param {Number} length - The number of bytes to read
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
   * @returns {Number} - The value
   */
  readDouble() {
    const value = this.endian ? this.buffer.readDoubleBE(this.position) : this.buffer.readDoubleLE(this.position)
    this.position += 8
    return value
  }

  /**
   * Reads a float
   * @returns {Number} - The value
   */
  readFloat() {
    const value = this.endian ? this.buffer.readFloatBE(this.position) : this.buffer.readFloatLE(this.position)
    this.position += 4
    return value
  }

  /**
   * Reads a signed int
   * @returns {Number} - The value
   */
  readInt() {
    const value = this.endian ? this.buffer.readInt32BE(this.position) : this.buffer.readInt32LE(this.position)
    this.position += 4
    return value
  }

  /**
   * Reads a multibyte string
   * @param {Length} length - The amount of bytes to read
   * @param {String} charSet - The character set to decode the bytes from
   * @returns {String} - The value
   */
  readMultiByte(length, charSet = "utf8") {
    const position = this.position
    this.position += length

    if (iconv.encodingExists(charSet)) {
      return iconv.decode(this.buffer.slice(position, position + length), charSet)
    } else {
      throw new Error(`Invalid character set: ${charSet}`)
    }
  }

  /**
   * Reads an object from the buffer, encoded in AMF serialized format
   * @returns {*} - The value
   */
  readObject() {
    this.endian = true
    return AMF0.deserializeData(this)
  }

  /**
   * Reads a signed short
   * @returns {Number} - The value
   */
  readShort() {
    const value = this.endian ? this.buffer.readInt16BE(this.position) : this.buffer.readInt16LE(this.position)
    this.position += 2
    return value
  }

  /**
   * Reads an unsigned byte
   * @returns {Number} - The value
   */
  readUnsignedByte() {
    return this.buffer.readUInt8(this.position++)
  }

  /**
   * Reads an unsigned int
   * @returns {Number} - The value
   */
  readUnsignedInt() {
    const value = this.endian ? this.buffer.readUInt32BE(this.position) : this.buffer.readUInt32LE(this.position)
    this.position += 4
    return value
  }

  /**
   * Reads an unsigned short
   * @returns {Number} - The value
   */
  readUnsignedShort() {
    const value = this.endian ? this.buffer.readUInt16BE(this.position) : this.buffer.readUInt16LE(this.position)
    this.position += 2
    return value
  }

  /**
   * Reads a UTF-8 string
   * @returns {String} - The value
   */
  readUTF() {
    const length = this.readUnsignedShort()
    const position = this.position
    this.position += length
    return this.buffer.toString("utf8", position, position + length)
  }

  /**
   * Reads multiple UTF-8 bytes
   * @param {Number} length - The amount of bytes to read
   * @returns {String} - The value
   */
  readUTFBytes(length) {
    return this.readMultiByte(length)
  }

  /**
   * Reads an unsigned int29
   * @returns {Number} - The value
   */
  readUnsignedInt29() {
    let byte = this.readUnsignedByte()
    let value

    if (byte < 128) {
      return byte
    }

    value = (byte & 0x7F) << 7
    byte = this.readUnsignedByte()

    if (byte < 128) {
      return (value | byte)
    }

    value = (value | (byte & 0x7F)) << 7
    byte = this.readUnsignedByte()

    if (byte < 128) {
      return (value | byte)
    }

    value = (value | (byte & 0x7F)) << 8
    byte = this.readUnsignedByte()

    return (value | byte)
  }

  /**
   * Converts the buffer to JSON
   * @returns {JSON} - The value
   */
  toJSON() {
    return this.buffer.toJSON()
  }

  /**
   * Converts the buffer to a string
   * @returns {String} - The value
   */
  toString() {
    return this.buffer.toString("utf8")
  }

  /**
   * Decompresses the buffer
   * @param {String} algorithm - The algorithm to uncompress the buffer
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
   * @param {Boolean} value - The value
   */
  writeBoolean(value) {
    this.writeByte(value ? 1 : 0)
  }

  /**
   * Writes a signed byte
   * @param {Number} value - The value
   */
  writeByte(value) {
    this.expand(1)
    this.buffer.writeInt8(value, this.position++)
  }

  /**
   * Writes multiple signed bytes to a ByteArray
   * @param {ByteArray} bytes - The ByteArray to write data from
   * @param {Number} offset - The position where to start writing
   * @param {Number} length - The number of bytes to write
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
  * @param {Number} value - The value
  */
  writeDouble(value) {
    this.expand(8)
    this.endian ? this.buffer.writeDoubleBE(value, this.position) : this.buffer.writeDoubleLE(value, this.position)
    this.position += 8
  }

  /**
   * Writes a float
   * @param {Number} value - The value
   */
  writeFloat(value) {
    this.expand(4)
    this.endian ? this.buffer.writeFloatBE(value, this.position) : this.buffer.writeFloatLE(value, this.position)
    this.position += 4
  }

  /**
   * Writes a signed int
   * @param {Number} value - The value
   */
  writeInt(value) {
    this.expand(4)
    this.endian ? this.buffer.writeInt32BE(value, this.position) : this.buffer.writeInt32LE(value, this.position)
    this.position += 4
  }

  /**
   * Writes a multibyte string
   * @param {String} value - The value
   * @param {String} charSet - The character set to ecode the bytes to
   */
  writeMultiByte(value, charSet = "utf8") {
    const length = Buffer.byteLength(value)

    if (iconv.encodingExists(charSet)) {
      this.buffer = Buffer.concat([this.buffer, iconv.encode(value, charSet)])
      this.position += length
    } else {
      throw new Error(`Invalid character set: ${charSet}`)
    }
  }

  /**
   * Writes an object into the buffer in AMF serialized format
   * @param {*} value - The value
   */
  writeObject(value) {
    this.endian = true
    AMF0.serializeData(this, value)
  }

  /**
   * Writes a signed short
   * @param {Number} value - The value
   */
  writeShort(value) {
    this.expand(2)
    this.endian ? this.buffer.writeInt16BE(value, this.position) : this.buffer.writeInt16LE(value, this.position)
    this.position += 2
  }

  /**
   * Writes an unsigned byte
   * @param {Number} value - The value
   */
  writeUnsignedByte(value) {
    this.expand(1)
    this.buffer.writeUInt8(value, this.position++)
  }

  /**
   * Writes an unsigned int
   * @param {Number} value - The value
   */
  writeUnsignedInt(value) {
    this.expand(4)
    this.endian ? this.buffer.writeUInt32BE(value, this.position) : this.buffer.writeUInt32LE(value, this.position)
    this.position += 4
  }

  /**
   * Writes an unsigned short
   * @param {Number} value - The value
   */
  writeUnsignedShort(value) {
    this.expand(2)
    this.endian ? this.buffer.writeUInt16BE(value, this.position) : this.buffer.writeUInt16LE(value, this.position)
    this.position += 2
  }

  /**
   * Writes a UTF-8 string
   * @param {String} value - The value
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
   * @param {String} value - The value
   */
  writeUTFBytes(value) {
    this.writeMultiByte(value)
  }

  /**
   * Writes an unsigned int29
   * @param {Number} value - The value
   */
  writeUnsignedInt29(value) {
    if (value < 0x80) {
      this.writeUnsignedByte(value)
    } else if (value < 0x4000) {
      this.writeUnsignedByte(((value >> 7) & 0x7F) | 0x80)
      this.writeUnsignedByte(value & 0x7F)
    } else if (value < 0x200000) {
      this.writeUnsignedByte(((value >> 14) & 0x7F) | 0x80)
      this.writeUnsignedByte(((value >> 7) & 0x7F) | 0x80)
      this.writeUnsignedByte(value & 0x7F)
    } else if (value < 0x40000000) {
      this.writeUnsignedByte(((value >> 22) & 0x7F) | 0x80)
      this.writeUnsignedByte(((value >> 15) & 0x7F) | 0x80)
      this.writeUnsignedByte(((value >> 8) & 0x7F) | 0x80)
      this.writeUnsignedByte(value & 0xFF)
    } else {
      throw new RangeError(`The value "${value}" is out of range`)
    }
  }
}

module.exports = ByteArray
