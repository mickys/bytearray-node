"use strict"

class ByteArray {
	constructor(bufArgu, byteLength = 2048, littleEndian = false) {
		if (bufArgu !== undefined) {
			const bufType = bufArgu.constructor.name

			if (bufType === "ArrayBuffer" && bufArgu.byteLength !== 0) {
				this.arb = bufArgu
				this.buf = new DataView(this.arb)
			} else if (bufType === "DataView" && bufArgu.byteLength !== 0) {
				this.arb = bufArgu.buffer
				this.buf = bufArgu
			} else if (bufArgu.constructor.name === "ByteArray" && bufArgu.buf.byteLength !== 0) {
				this.arb = bufArgu.buf.buffer
				this.buf = bufArgu.buf

				this.writePos = 0
				this.readPos = 0
			}
		} else {
			this.arb = new ArrayBuffer(byteLength)
			this.buf = new DataView(this.arb)
		}

		this.littleEndian = littleEndian
		this.writePos = 0
		this.readPos = 0
	}

	get length() {
		return this.buf.byteLength
	}

	get bytesAvailable() {
		return this.length - (this.writePos + this.readPos)
	}

	incrementPosition(whatPos, toIncrement) {
		for (let i = 0; i < toIncrement; i++) {
			whatPos === "write" ? this.writePos++ : this.readPos++;
		}
	}

	validatePosition(whatPos) {
		if (whatPos > this.length) throw new RangeError(`The position "${whatPos}" can't be greater than the byteLength`)
		if (whatPos <= 0) throw new RangeError(`The position "${whatPos}" can't be less than 0`)
		if (whatPos > this.bytesAvailable) throw new RangeError(`The position "${whatPos}" can't be greater than the amount of bytes available`)
	}

	fromUTF8(bytes) {
		let val = ""

		for (let i = 0; i < bytes.length; i++) {
			const byte = bytes[i]

			if (byte < 0x80) {
				val += String.fromCharCode(byte)
			} else if (byte > 0xbf && byte < 0xe0) {
				val += String.fromCharCode((byte & 0x1f) << 6 | bytes[i + 1] & 0x3f)
				i += 1
			} else if (byte > 0xdf && byte < 0xf0) {
				val += String.fromCharCode((byte & 0x0F) << 12 | (bytes[i + 1] & 0x3F) << 6 | bytes[i + 2] & 0x3F)
				i += 2
			} else {
				const char = ((byte & 0x07) << 18 | (bytes[i + 1] & 0x3f) << 12 | (bytes[i + 2] & 0x3f) << 6 | bytes[i + 3] & 0x3f) - 0x010000
				val += String.fromCharCode(char >> 10 | 0xd800, char & 0x03ff | 0xdc00)
				i += 3
			}
		}

		return val
	}

	toUTF8(val) {
		let bytes = []

		for (let i = 0; i < val.length; i++) {
			let char = val.charCodeAt(i)

			if (char < 0x80) {
				bytes.push(char)
			} else if (char < 0x800) {
				bytes.push(0xc0 | (char >> 6), 0x80 | (char & 0x3f))
			} else if (char < 0xd800 || char >= 0xe000) {
				bytes.push(0x0e | (char >> 12), 0x80 | ((char >> 6) & 0x3f), 0x80 | (char & 0x3f))
			} else {
				i++;
				char = 0x10000 + (((char & 0x3ff) << 10) | (val.charCodeAt(i) & 0x3ff))
				bytes.push(0xf0 | (char >> 18), 0x80 | ((char >> 12) & 0x3f), 0x80 | ((char >> 6) & 0x3f), 0x80 | (char & 0x3f))
			}
		}

		return bytes
	}

	readBoolean() {
		return this.readByte() ? true : false
	}

	readByte() {
		this.validatePosition(1)

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
		this.validatePosition(8)

		const val = this.buf.getFloat64(this.readPos++, this.littleEndian)

		this.incrementPosition("read", 7)

		return val
	}

	readFloat() {
		this.validatePosition(4)

		const val = this.buf.getFloat32(this.readPos++, this.littleEndian)

		this.incrementPosition("read", 3)

		return val
	}

	readInt() {
		this.validatePosition(4)

		const val = this.buf.getInt32(this.readPos++, this.littleEndian)

		this.incrementPosition("read", 3)

		return val
	}

	readShort() {
		this.validatePosition(2)

		const val = this.buf.getInt16(this.readPos++, this.littleEndian)

		this.readPos++;

		return val
	}

	readUnsignedByte() {
		this.validatePosition(1)

		return this.buf.getUint8(this.readPos++)
	}

	readUnsignedInt() {
		this.validatePosition(4)

		const val = this.buf.getUint32(this.readPos++, this.littleEndian)

		this.incrementPosition("read", 3)

		return val
	}

	readUnsignedShort() {
		this.validatePosition(2)

		const val = this.buf.getUint16(this.readPos, this.littleEndian)

		this.readPos++;

		return val
	}

	readUTF(len) {
		const bytes = []

		len = len || this.readShort()

		for (let i = 0; i < len; i++) {
			bytes.push(this.readByte())
		}

		return this.fromUTF8(bytes)
	}

	readUTFBytes(len) {
		return this.readUTF(len)
	}

	writeBoolean(val) {
		this.writeByte(val ? 1 : 0)
	}

	writeByte(val) {
		this.validatePosition(1)

		this.buf.setInt8(this.writePos++, val)
	}

	writeBytes(bytes) {
		bytes.forEach(byte => {
			this.writeByte(byte)
		})
	}

	writeDouble(val) {
		this.validatePosition(8)

		this.buf.setFloat64(this.writePos++, val, this.littleEndian)

		this.incrementPosition("write", 7)
	}

	writeFloat(val) {
		this.validatePosition(4)

		this.buf.setFloat32(this.writePos++, val, this.littleEndian)

		this.incrementPosition("write", 3)
	}

	writeInt(val) {
		this.validatePosition(4)

		this.buf.setInt32(this.writePos++, val, this.littleEndian)

		this.incrementPosition("write", 3)
	}

	writeShort(val) {
		this.validatePosition(2)

		this.buf.setInt16(this.writePos++, val, this.littleEndian)

		this.writePos++;
	}

	writeUnsignedByte(val) {
		this.validatePosition(1)

		this.buf.setUint8(this.writePos++, val)
	}

	writeUnsignedInt(val) {
		this.validatePosition(4)

		this.buf.setUint32(this.writePos++, val, this.littleEndian)

		this.incrementPosition("write", 3)
	}

	writeUnsignedShort(val) {
		this.validatePosition(2)

		this.buf.setUint16(this.writePos++, val, this.littleEndian)

		this.writePos++;
	}

	writeUTF(val, fromUTFBytes) {
		if (val.length > 65535) throw new RangeError("writeUTF only accepts strings with a length that is less than 65535")

		if (!fromUTFBytes) this.writeShort(val.length)

		const UTF8 = this.toUTF8(val)

		UTF8.forEach(byte => {
			this.writeByte(byte)
		})
	}

	writeUTFBytes(val) {
		this.writeUTF(val, true)
	}
}

module.exports = ByteArray