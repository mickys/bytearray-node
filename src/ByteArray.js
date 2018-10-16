"use strict"

const zlib = require("zlib")
const lzma = require("lzma-native")

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
			this.buffer = Buffer.alloc(typeof(buffer) === "number" ? parseInt(buffer) : DEFAULT_SIZE)
		}
	}

	get bytesAvailable() {
		return this.writePosition - this.readPosition
	}

	get length() {
		return this.buffer.length
	}

	clear() {
		this.buffer = Buffer.alloc(DEFAULT_SIZE)
		this.reset()
	}

	reset() {
		this.writePosition = 0
		this.readPosition = 0
	}

	canWrite(length) {
		return (this.length - this.writePosition) >= length
	}

	scaleBuffer(length) {
		const oldBuffer = this.buffer

		this.buffer = Buffer.alloc(this.buffer.length + DEFAULT_SIZE + length)

		oldBuffer.copy(this.buffer)
	}

	atomicCompareAndSwapIntAt(byteIndex, expectedValue, newValue) {
		let byte = this.buffer[byteIndex]

		if (byte === expectedValue) {
			this.buffer[byteIndex] = newValue
		}

		return byte
	}

	atomicCompareAndSwapLength(expectedLength, newLength) {
		const prevLength = this.length

		if (prevLength !== expectedLength) {
			return prevLength
		}

		if (prevLength < newLength) {
			this.buffer = Buffer.concat([this.buffer, Buffer.alloc(newLength - prevLength)], newLength)
		}

		if (prevLength > newLength) {
			this.buffer = this.buffer.slice(newLength - 1, prevLength - 1)
		}

		return prevLength
	}

	compress(algorithm) {
		algorithm = algorithm.toLowerCase()

		if (algorithm === "zlib") {
			this.buffer = zlib.deflateSync(this.buffer)
		} else if (algorithm === "deflate") {
			this.buffer = zlib.deflateRawSync(this.buffer)
		} else if (algorithm === "lzma") {
			lzma.LZMA().compress(this.buffer, 1, (res) => {
				this.buffer = res
			})
		} else {
			throw new Error("Unknown algorithm")
		}
	}

	deflate() {
		this.compress("deflate")
	}

	inflate() {
		this.uncompress("deflate")
	}

	uncompress(algorithm) {
		algorithm = algorithm.toLowerCase()

		if (algorithm === "zlib") {
			this.buffer = zlib.inflateSync(this.buffer)
		} else if (algorithm === "deflate") {
			this.buffer = zlib.inflateRawSync(this.buffer)
		} else if (algorithm === "lzma") {
			lzma.LZMA().decompress(this.buffer, (res) => {
				this.buffer = res
			})
		} else {
			throw new Error("Unknown algorithm")
		}

		this.reset()
	}

	readBoolean() {
		return this.readByte() !== 0
	}

	readByte() {
		const value = this.buffer.readInt8(this.readPosition)

		this.readPosition += 1

		return value
	}

	readBytes(buffer, offset = 0, length = 0) {
		if (offset < 0 || length < 0) {
			throw new RangeError("Offset/Length can't be less than 0")
		}

		if (length === 0) {
			length = this.bytesAvailable
		}

		if (length > this.bytesAvailable) {
			throw new RangeError("Length can't be greater than the bytes available")
		}

		const total = offset + length

		if (total !== (offset + length)) {
			throw new RangeError("32-bit overflow")
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

	readDouble() {
		const value = this.endian ? this.buffer.readDoubleBE(this.readPosition) : this.buffer.readDoubleLE(this.readPosition)

		this.readPosition += 8

		return value
	}

	readFloat() {
		const value = this.endian ? this.buffer.readFloatBE(this.readPosition) : this.buffer.readFloatLE(this.readPosition)

		this.readPosition += 4

		return value
	}

	readInt() {
		const value = this.endian ? this.buffer.readInt32BE(this.readPosition) : this.buffer.readInt32LE(this.readPosition)

		this.readPosition += 4

		return value
	}

	readMultiByte(length, charSet = "utf8") {
		const position = this.readPosition

		this.readPosition += length

		if (Buffer.isEncoding(charSet)) {
			return this.buffer.toString(charSet, position, position + length)
		}
	}

	readObject() {
		return this.objectEncoding === 3 ? new AMF3(this).readData() : new AMF0(this).readData()
	}

	readShort() {
		const value = this.endian ? this.buffer.readInt16BE(this.readPosition) : this.buffer.readInt16LE(this.readPosition)

		this.readPosition += 2

		return value
	}

	readUnsignedByte() {
		const value = this.buffer.readUInt8(this.readPosition)

		this.readPosition += 1

		return value
	}

	readUnsignedInt() {
		const value = this.endian ? this.buffer.readUInt32BE(this.readPosition) : this.buffer.readUInt32LE(this.readPosition)

		this.readPosition += 4

		return value
	}

	readUnsignedShort() {
		const value = this.endian ? this.buffer.readUInt16BE(this.readPosition) : this.buffer.readUInt16LE(this.readPosition)

		this.readPosition += 2

		return value
	}

	readUTF() {
		const length = this.readShort()
		const position = this.readPosition

		this.readPosition += length

		return this.buffer.toString("utf8", position, position + length)
	}

	readUTFBytes(length) {
		return this.readMultiByte(length)
	}

	toJSON() {
		return this.buffer.toJSON()
	}

	toString(charSet = "utf8", offset = 0, length = this.length) {
		return this.buffer.toString(charSet, offset, length)
	}

	writeBoolean(value) {
		this.writeByte(value ? 1 : 0)
	}

	writeByte(value) {
		if (!this.canWrite(1)) {
			this.scaleBuffer(1)
		}

		this.buffer.writeInt8(value, this.writePosition)

		this.writePosition += 1
	}

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
			throw new RangeError("Length can't be greater than the buffer length")
		}

		if (length > 0) {
			for (let i = offset; i < length; i++) {
				this.writeByte(buffer.readByte())
			}
		}
	}

	writeDouble(value) {
		if (!this.canWrite(8)) {
			this.scaleBuffer(8)
		}

		this.endian ? this.buffer.writeDoubleBE(value, this.writePosition) : this.buffer.writeDoubleLE(value, this.writePosition)

		this.writePosition += 8
	}

	writeFloat(value) {
		if (!this.canWrite(4)) {
			this.scaleBuffer(4)
		}

		this.endian ? this.buffer.writeFloatBE(value, this.writePosition) : this.buffer.writeFloatLE(value, this.writePosition)

		this.writePosition += 4
	}

	writeInt(value) {
		if (!this.canWrite(4)) {
			this.scaleBuffer(4)
		}

		this.endian ? this.buffer.writeInt32BE(value, this.writePosition) : this.buffer.writeInt32LE(value, this.writePosition)

		this.writePosition += 4
	}

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

	writeObject(value) {
		this.objectEncoding === 3 ? new AMF3(this).writeData(value) : new AMF0(this).writeData(value)
	}

	writeShort(value) {
		if (!this.canWrite(2)) {
			this.scaleBuffer(2)
		}

		this.endian ? this.buffer.writeInt16BE(value, this.writePosition) : this.buffer.writeInt16LE(value, this.writePosition)

		this.writePosition += 2
	}

	writeUnsignedByte(value) {
		if (!this.canWrite(1)) {
			this.scaleBuffer(1)
		}

		this.buffer.writeUInt8(value, this.writePosition)

		this.writePosition += 1
	}

	writeUnsignedInt(value) {
		if (!this.canWrite(4)) {
			this.scaleBuffer(4)
		}

		this.endian ? this.buffer.writeUInt32BE(value, this.writePosition) : this.buffer.writeUInt32LE(value, this.writePosition)

		this.writePosition += 4
	}

	writeUnsignedShort(value) {
		if (!this.canWrite(2)) {
			this.scaleBuffer(2)
		}

		this.endian ? this.buffer.writeUInt16BE(value, this.writePosition) : this.buffer.writeUInt16LE(value, this.writePosition)

		this.writePosition += 2
	}

	writeUTF(value) {
		const length = Buffer.byteLength(value)

		if (!this.canWrite(length)) {
			this.scaleBuffer(length)
		}

		if (length > 65535) {
			throw new RangeError("Length can't be greater than 65535")
		}

		this.writeUnsignedShort(length)

		this.buffer.write(value, this.writePosition, length)

		this.writePosition += length
	}

	writeUTFBytes(value) {
		this.writeMultiByte(value)
	}
}

module.exports = ByteArray