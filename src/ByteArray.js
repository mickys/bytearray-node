"use strict"

const AMF0 = require("./AMF0")

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
			} else if (bufType === "ByteArray" && bufArgu.buf.byteLength !== 0) {
				this.arb = bufArgu.buf.buffer
				this.buf = bufArgu.buf
			} else if (bufType === "Buffer") {
				this.arb = this.toArrayBuffer(bufArgu)
				this.buf = new DataView(this.arb)
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

	get bytes() {
		return new Uint8Array(this.buf.buffer, 0, this.length)
	}

	get buffer() {
		return Buffer.from(new Uint8Array(this.buf.buffer, 0, this.length))
	}

	set endian(endian) {
		this.littleEndian = endian
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

	toArrayBuffer(buf) {
		const arb = new ArrayBuffer(buf.length)
		const ui8 = new Uint8Array(arb)

		for (let i = 0; i < buf.length; i++) ui8[i] = buf[i]

		return arb
	}

	fromUTF8(bytes) {
		let val = ""

		for (let i = 0; i < bytes.length; i++) {
			const byte = bytes[i]

			if (byte < 128) {
				val += String.fromCharCode(byte)
			} else if (byte > 191 && byte < 224) {
				val += String.fromCharCode((byte & 31) << 6 | bytes[i + 1] & 63)
				i += 1
			} else if (byte > 223 && byte < 240) {
				val += String.fromCharCode((byte & 15) << 12 | (bytes[i + 1] & 63) << 6 | bytes[i + 2] & 63)
				i += 2
			} else {
				const char = ((byte & 7) << 18 | (bytes[i + 1] & 63) << 12 | (bytes[i + 2] & 63) << 6 | bytes[i + 3] & 63) - 65536
				val += String.fromCharCode(char >> 10 | 55296, char & 1023 | 56320)
				i += 3
			}
		}

		return val
	}

	toUTF8(val) {
		let bytes = []

		for (let i = 0; i < val.length; i++) {
			let char = val.charCodeAt(i)

			if (char < 128) {
				bytes.push(char)
			} else if (char < 2048) {
				bytes.push(192 | (char >> 6), 128 | (char & 63))
			} else if (char < 55296 || char >= 57344) {
				bytes.push(14 | (char >> 12), 128 | ((char >> 6) & 63), 128 | (char & 63))
			} else {
				i++;
				char = 65536 + (((char & 1023) << 10) | (val.charCodeAt(i) & 1023))
				bytes.push(240 | (char >> 18), 128 | ((char >> 12) & 63), 128 | ((char >> 6) & 63), 128 | (char & 63))
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

	readBytes(bytearray, offset = 0, length = 0) {
		if (offset < 0 || length < 0) return

		for (let i = offset; i < length; i++) {
			bytearray.writeByte(this.readByte())
		}
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

	readObject() {
		const amf = new AMF0(this)

		return amf.readData()
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

	readArrayOfBytes(start, end) {
		const buf = []

		for (let i = start; i < end; i++) {
			buf.push(this.readByte())
		}

		return buf
	}

	readASCII(len) {
		let val = ""

		len = len || this.readShort()

		for (let i = 0; i < len; i++) {
			val += String.fromCharCode(this.readByte())
		}

		return val
	}

	readUInt29() {
		let byte = this.readUnsignedByte()
		if (byte < 128) return byte

		let ref = (byte & 127) << 7
		byte = this.readUnsignedByte()

		if (byte < 128) return (ref | byte)
		ref = (ref | (byte & 127)) << 7

		byte = this.readUnsignedByte()
		if (byte < 128) return (ref | byte)

		ref = (ref | (byte & 127)) << 8
		byte = this.readUnsignedByte()

		return (ref | byte)
	}

	writeBoolean(val) {
		this.writeByte(val ? 1 : 0)
	}

	writeByte(val) {
		this.validatePosition(1)

		this.buf.setInt8(this.writePos++, val)
	}

	writeBytes(bytearray, offset = 0, length = 0) {
		if (offset < 0 || length < 0) return

		for (let i = offset; i < length; i++) {
			this.writeByte(bytearray.readByte())
		}
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

	writeObject(val) {
		const amf = new AMF0(this)

		amf.writeData(val)
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

	writeUTF(val) {
		if (val.length > 65535) throw new RangeError("writeUTF only accepts strings with a length that is less than 65535")

		this.writeShort(val.length)

		const UTF8 = this.toUTF8(val)

		UTF8.forEach(byte => {
			this.writeByte(byte)
		})
	}

	writeUTFBytes(val) {
		const UTF8 = this.toUTF8(val)

		UTF8.forEach(byte => {
			this.writeByte(byte)
		})
	}

	writeArrayOfBytes(bytes) {
		bytes.forEach(byte => {
			this.writeByte(byte)
		})
	}

	writeASCII(val) {
		if (val.length > 65535) throw new RangeError("writeASCII only accepts strings with a length that is less than 65535")

		this.writeShort(val.length)

		for (let i = 0; i < val.length; i++) {
			this.writeByte(val.charCodeAt(i))
		}
	}

	writeUInt29(val) {
		const arr = []

		if (val < 128) {
			this.writeUnsignedByte(val)
		} else if (val < 16384) {
			this.writeUnsignedByte(((val >> 7) & 127) | 128)
			this.writeUnsignedByte(val & 127)
		} else if (val < 2097152) {
			this.writeUnsignedByte(((val >> 14) & 127) | 128)
			this.writeUnsignedByte(((val >> 7) & 127) | 128)
			this.writeUnsignedByte(val & 127)
		} else if (val < 1073741824) {
			this.writeUnsignedByte(((val >> 22) & 127) | 128)
			this.writeUnsignedByte(((val >> 15) & 127) | 128)
			this.writeUnsignedByte(((val >> 8) & 127) | 128)
			this.writeUnsignedByte(val & 255)
		} else {
			throw new RangeError(`"${val}" is out of range`)
		}
	}
}

module.exports = ByteArray