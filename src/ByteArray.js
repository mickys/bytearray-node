"use strict"

class ByteArray {
	constructor(data, byteLength = 2048, littleEndian = false) {
		if (data !== undefined) {
			if (data.constructor.name === "ArrayBuffer") {
				this.arb = data
			}
		} else {
			this.arb = new ArrayBuffer(byteLength)
		}

		this.buf = new DataView(this.arb)

		this.littleEndian = littleEndian

		this.writePos = 0
		this.readPos = 0
	}

	incrementPosition(whatPos, toIncrement) {
		for (let i = 0; i < toIncrement; i++) {
			whatPos === "write" ? this.writePos++ : this.readPos++;
		}
	}

	get bytesAvailable() {
		return 2048 - (this.writePos + this.readPos)
	}

	readBoolean() {
		return this.readByte() ? true : false
	}

	readByte() {
		return this.buf.getInt8(this.readPos++)
	}

	readBytes(start, end) {
		const buf = []

		for (let i = start; i < end; i++) {
			buf.push(this.readByte())
		}

		return buf
	}

	readDouble() {
		const val = this.buf.getFloat64(this.readPos++, this.littleEndian)

		this.incrementPosition("read", 7)

		return val
	}

	readFloat() {
		const val = this.buf.getFloat32(this.readPos++, this.littleEndian)

		this.incrementPosition("read", 3)

		return val
	}

	readInt() {
		const val = this.buf.getInt32(this.readPos++, this.littleEndian)

		this.incrementPosition("read", 3)

		return val
	}

	readShort() {
		const val = this.buf.getInt16(this.readPos++, this.littleEndian)

		this.readPos++;

		return val
	}

	readUnsignedByte() {
		return this.buf.getUint8(this.readPos++)
	}

	readUnsignedInt() {
		const val = this.buf.getUint32(this.readPos++, this.littleEndian)

		this.incrementPosition("read", 3)

		return val
	}

	readUnsignedShort() {
		const val = this.buf.getUint16(this.readPos, this.littleEndian)

		this.readPos++;

		return val
	}

	readUTF(len) {
		len = len || this.readShort()

		let str = ""

		for (let i = 0; i < len; i++) {
			str += String.fromCharCode(this.readUnsignedByte())
		}

		return str
	}

	readUTFBytes(len) {
		return this.readUTF(len)
	}

	writeBoolean(val) {
		this.writeByte(val ? 1 : 0)
	}

	writeByte(val) {
		this.buf.setInt8(this.writePos++, val)
	}

	writeBytes(bytes) {
		bytes.forEach(byte => {
			this.writeByte(byte)
		})
	}

	writeDouble(val) {
		this.buf.setFloat64(this.writePos++, val, this.littleEndian)

		this.incrementPosition("write", 7)
	}

	writeFloat(val) {
		this.buf.setFloat32(this.writePos++, val, this.littleEndian)

		this.incrementPosition("write", 3)
	}

	writeInt(val) {
		this.buf.setInt32(this.writePos++, val, this.littleEndian)

		this.incrementPosition("write", 3)
	}

	writeShort(val) {
		this.buf.setInt16(this.writePos++, val, this.littleEndian)

		this.writePos++;
	}

	writeUnsignedByte(val) {
		this.buf.setUint8(this.writePos++, val)
	}

	writeUnsignedInt(val) {
		this.buf.setUint32(this.writePos++, val, this.littleEndian)

		this.incrementPosition("write", 3)
	}

	writeUnsignedShort(val) {
		this.buf.setUint16(this.writePos++, val, this.littleEndian)

		this.writePos++;
	}

	writeUTF(val, fromUTFBytes) {
		if (val.length > 65535) throw new RangeError("Length for writeUTF can only be 65535 (int16)")

		if (!fromUTFBytes) this.writeShort(val.length)

		for (let i = 0; i < val.length; i++) {
			this.writeByte(val.charCodeAt(i))
		}
	}

	writeUTFBytes(val) {
		this.writeUTF(val, true)
	}
}

module.exports = ByteArray