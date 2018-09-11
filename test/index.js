"use strict"

const ByteArray = require("../src/ByteArray")

const DataViewToByteArray = () => {
	const arb = new ArrayBuffer(8) // An ArrayBuffer with a byteLength of 8
	const buf = new DataView(arb) // Sets the new DataView object

	buf.setFloat64(0, 123.456, false) // Writes 123.456 (Double) on position 0 using BE (Big Endian)

	const ba = new ByteArray(arb) // Overwrites ByteArray.js' ArrayBuffer with our own

	console.log(ba.readDouble()) // Reads from our overwritten ArrayBuffer => 123.456
}

const exampleWriteRead = () => {
	const ba = new ByteArray()

	ba.writeByte(55)

	console.log(ba.readByte()) // 55
}