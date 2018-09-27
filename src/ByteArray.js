"use strict"

const AMF3 = require("./AMF3")
const AMF0 = require("./AMF0")

class ByteArray {
	constructor(buffer) {
		this.position = 0
		this.endian = true
		this.objectEncoding = 3

		if (buffer instanceof ByteArray) {
			this.buffer = buffer.buffer
		} else if (Buffer.isBuffer(buffer)) {
			this.buffer = buffer
		} else {
			this.buffer = Buffer.alloc(typeof(buffer) === "number" ? parseInt(buffer) : 2048)
		}
	}

	get bytesAvailable() {
		return this.length - this.position
	}

	get length() {
		return this.buffer.length
	}

	clear() {
		this.buffer = Buffer.alloc(2048)
		this.reset()
	}

	reset() {
		this.position = 0
	}

	updatePosition(pos, write) {
		if (write) {
			const size = this.position + pos

			if (size >= this.length) {
				const ba = new ByteArray(size || this.position)

				ba.writeBytes(this)

				this.position = size && this.position > size ? size : this.position
				this.buffer = ba.buffer
			}
		}

		const a = this.position

		this.position += pos

		return a
	}

	atomicCompareAndSwapIntAt(byteIndex, expectedValue, newValue) {
		let byte = this.buffer[byteIndex]

		if (byte === expectedValue) this.buffer[byteIndex] = newValue

		return byte;
	}

	atomicCompareAndSwapLength(expectedLength, newLength) {
		const prevLength = this.length

		if (prevLength !== expectedLength) return prevLength

		if (prevLength < newLength) this.buffer = Buffer.concat([this.buffer, Buffer.alloc(newLength - prevLength)], newLength)

		if (prevLength > newLength) this.buffer = this.buffer.slice(newLength - 1, prevLength - 1)

		return prevLength
	}

	readBoolean() {
		return Boolean(this.readByte())
	}

	readByte() {
		return this.buffer.readInt8(this.updatePosition(1))
	}

	readBytes(bytes, offset = 0, length = 0) {
		if (offset < 0 || length < 0 || this.bytesAvailable < 0) return

		length = length || bytes.length

		for (let i = offset, l = length; i < l; i++) {
			bytes.writeByte(this.readByte())
		}
	}

	readDouble() {
		return this.endian ? this.buffer.readDoubleBE(this.updatePosition(8)) : this.buffer.readDoubleLE(this.updatePosition(8))
	}

	readFloat() {
		return this.endian ? this.buffer.readFloatBE(this.updatePosition(4)) : this.buffer.readFloatLE(this.updatePosition(4))
	}

	readInt() {
		return this.endian ? this.buffer.readInt32BE(this.updatePosition(4)) : this.buffer.readInt32LE(this.updatePosition(4))
	}

	readMultiByte(length, charSet = "utf8") {
		const position = this.updatePosition(length)

		if (Buffer.isEncoding(charSet)) {
			return this.buffer.toString(charSet, position, position + length)
		}
	}

	readObject() {
		return this.objectEncoding === 3 ? new AMF3(this).readData() : new AMF0(this).readData()
	}

	readShort() {
		return this.endian ? this.buffer.readInt16BE(this.updatePosition(2)) : this.buffer.readInt16LE(this.updatePosition(2))
	}

	readUnsignedByte() {
		return this.buffer.readUInt8(this.updatePosition(1))
	}

	readUnsignedInt() {
		return this.endian ? this.buffer.readUInt32BE(this.updatePosition(4)) : this.buffer.readUInt32LE(this.updatePosition(4))
	}

	readUnsignedShort() {
		return this.endian ? this.buffer.readUInt16BE(this.updatePosition(2)) : this.buffer.readUInt16LE(this.updatePosition(2))
	}

	readUTF() {
		const length = this.readShort()
		const position = this.updatePosition(length)

		return this.buffer.toString("utf8", position, position + length)
	}

	readUTFBytes(length) {
		return this.readMultiByte(length)
	}

	readArrayOfBytes(start, end) {
		const buf = []

		for (let i = start, l = end; i < l; i++) {
			buf.push(this.readUnsignedByte())
		}

		return buf
	}

	toJSON() {
		return this.buffer.toJSON()
	}

	toString(charSet = "utf8", offset = 0, length = this.length) {
		return this.buffer.toString(charSet, offset, length)
	}

	writeBoolean(value) {
		this.writeByte(Number(value))
	}

	writeByte(value) {
		this.buffer.writeInt8(value, this.updatePosition(1, true))
	}

	writeBytes(bytes, offset = 0, length = 0) {
		if (offset < 0 || length < 0 || this.bytesAvailable < 0) return

		length = length || bytes.length

		bytes.reset()

		for (let i = offset, l = length; i < l; i++) {
			this.writeByte(bytes.readByte())
		}
	}

	writeDouble(value) {
		this.endian ? this.buffer.writeDoubleBE(value, this.updatePosition(8, true)) : this.buffer.writeDoubleLE(value, this.updatePosition(8, true))
	}

	writeFloat(value) {
		this.endian ? this.buffer.writeFloatBE(value, this.updatePosition(4, true)) : this.buffer.writeFloatLE(value, this.updatePosition(4, true))
	}

	writeInt(value) {
		this.endian ? this.buffer.writeInt32BE(value, this.updatePosition(4, true)) : this.buffer.writeInt32LE(value, this.updatePosition(4, true))
	}

	writeMultiByte(value, charSet = "utf8") {
		const length = Buffer.byteLength(value)

		if (Buffer.isEncoding(charSet)) {
			this.buffer.write(value, this.updatePosition(length, true), length, charSet)
		}
	}

	writeObject(value) {
		this.objectEncoding === 3 ? new AMF3(this).writeData(value) : new AMF0(this).writeData(value)
	}

	writeShort(value) {
		this.endian ? this.buffer.writeInt16BE(value, this.updatePosition(2, true)) : this.buffer.writeInt16LE(value, this.updatePosition(2, true))
	}

	writeUnsignedByte(value) {
		this.buffer.writeUInt8(value, this.updatePosition(1, true))
	}

	writeUnsignedInt(value) {
		this.endian ? this.buffer.writeUInt32BE(value, this.updatePosition(4, true)) : this.buffer.writeUInt32LE(value, this.updatePosition(4, true))
	}

	writeUnsignedShort(value) {
		this.endian ? this.buffer.writeUInt16BE(value, this.updatePosition(2, true)) : this.buffer.writeUInt16LE(value, this.updatePosition(2, true))
	}

	writeUTF(value) {
		const length = Buffer.byteLength(value)

		this.writeShort(length)

		this.buffer.write(value, this.updatePosition(length, true), length)
	}

	writeUTFBytes(value) {
		this.writeMultiByte(value)
	}

	writeArrayOfBytes(bytes) {
		for (let i = 0, l = bytes.length; i < l; i++) {
			this.writeUnsignedByte(bytes[i])
		}
	}
}

module.exports = ByteArray