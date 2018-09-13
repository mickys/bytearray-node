"use strict"

const ByteArray = require("../src/ByteArray")

const convertArrayBufferToByteArray = () => {
	const arb = new ArrayBuffer(8)
	const buf = new DataView(arb)

	buf.setFloat64(0, 123.456, false)

	const ba = new ByteArray(arb)

	console.log(ba.readDouble())
}

const convertDataViewToByteArray = () => {
	const buf = new DataView(new ArrayBuffer(3))

	buf.setInt8(0, 1)
	buf.setInt8(1, 2)
	buf.setInt8(2, 3)

	const ba = new ByteArray(buf)

	console.log(ba.readBytes(0, 3)) // [1, 2, 3]
}

const multipleByteArrays = () => {
	const ba = new ByteArray()

	ba.writeBytes([1, 2, 3])

	const rb = new ByteArray(ba)

	console.log(rb.readBytes(0, 3)) // [1, 2, 3]
}

const exampleWriteRead = () => {
	const ba = new ByteArray()

	ba.writeByte(55)

	console.log(ba.readByte()) // 55
}