"use strict"

const ByteArray = require("./ByteArray")

class AMF0 {
	constructor(ba) {
		this.ba = ba || new ByteArray()
		this.references = new Map()
	}

	writeData(val) {
		if (val === null) {
			this.ba.writeByte(5)
		} else if (val === undefined) {
			this.ba.writeByte(6)
		} else if (typeof val === "boolean") {
			this.ba.writeByte(1)
			this.ba.writeBoolean(val)
		} else if (typeof val === "number") {
			this.ba.writeByte(0)
			this.ba.writeDouble(val)
		} else if (val instanceof Date) {
			this.ba.writeByte(11)
			this.ba.writeDouble(val.getTime())
		} else if (typeof val === "string") {
			this.ba.writeByte(2)
			this.writeString(val)
		} else if (val instanceof Array) {
			if (!this.references.has(val)) {
				this.references.set(val, this.references.size)

				this.ba.writeByte(10)
				this.ba.writeUnsignedInt(val.length)

				for (const element of val) this.writeData(element)
			} else {
				const reference = this.references.get(val)

				if (reference <= 0xFFFF) {
					this.ba.writeByte(7)
					this.ba.writeUnsignedShort(reference)
				}
			}
		} else if (val instanceof Object) {
			if (!this.references.has(val)) {
				this.references.set(val, this.references.size)

				const name = val["@name"]

				if (name !== undefined) {
					this.ba.writeByte(16)
					this.writeString(name)
				} else {
					this.ba.writeByte(3)
				}

				for (const key in val) {
					if (key[0] !== "@") {
						this.writeString(key)
						this.writeData(val[key])
					}
				}

				this.ba.writeUnsignedShort(0)
				this.ba.writeByte(9)
			} else {
				const reference = this.references.get(val)

				if (reference <= 0xFFFF) {
					this.ba.writeByte(7)
					this.ba.writeUnsignedShort(reference)
				}
			}
		} else {
			throw new TypeError(`Unknown type: ${typeof val}`)
		}
	}

	readData() {
		const marker = this.ba.readByte()

		if (marker === 5) {
			return null
		} else if (marker === 6) {
			return undefined
		} else if (marker === 1) {
			return this.ba.readBoolean()
		} else if (marker === 0) {
			return this.ba.readDouble()
		} else if (marker === 11) {
			return new Date(this.ba.readDouble()).toString()
		} else if (marker === 2) {
			return this.ba.readUTF()
		} else if (marker === 12) {
			return this.readLongString()
		} else if (marker === 10) {
			const val = []

			this.references.set(this.references.size, val)

			const len = this.ba.readUnsignedInt()

			for (let i = 0; i < len; i++) val.push(this.readData())

			return val
		} else if (marker === 3) {
			const val = {}

			this.references.set(this.references.size, val)

			for (let key = this.ba.readUTF(); key !== ""; key = this.ba.readUTF()) {
				if (key[0] !== "@") val[key] = this.readData()
			}

			if (this.ba.readByte() === 9) return val
		} else if (marker === 16) {
			const val = {}

			this.references.set(this.references.size, val)

			val["@name"] = this.ba.readUTF()

			for (let key = this.ba.readUTF(); key !== ""; key = this.ba.readUTF()) {
				if (key[0] !== "@") val[key] = this.readData()
			}

			if (this.ba.readByte() === 9) return val
		} else if (marker === 7) {
			return this.references.get(this.ba.readUnsignedShort())
		} else if (marker === 8) {
			const val = []
			const len = this.ba.readUnsignedInt()
			const elementName = this.readString()

			while (elementName.length > 0 && len !== 0) {
				val[elementName] = this.readData()
				elementName = this.ba.readUTF()
			}

			return val
		} else {
			throw new TypeError(`Unknown marker: ${marker}`)
		}
	}

	writeString(val) {
		if (val.length <= 0xFFFF) {
			this.ba.writeUTF(val)
		} else {
			this.writeLongString(val)
		}
	}

	writeLongString(val) {
		this.ba.writeByte(12)
		this.ba.writeUnsignedInt(val.length)
		this.ba.writeUTFBytes(val)
	}

	readLongString() {
		return this.ba.readUTFBytes(this.ba.readUnsignedInt())
	}
}

module.exports = AMF0