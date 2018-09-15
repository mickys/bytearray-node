"use strict"

const ByteArray = require("../src/ByteArray")

const quickTest = () => {
	const ba = new ByteArray()

	ba.writeInt(1)
	ba.writeShort(2)
	ba.writeByte(3)

	if (ba.readInt() === 1 && ba.readShort() === 2 && ba.readByte() === 3) console.log(`Gucci`)
}

const convertToBuffer = () => {
	const ba = new ByteArray()

	ba.writeUTFBytes("Hello world")

	const buf = ba.buffer

	console.log(buf.toString()) // Hello world
}

const convertArrayBufferToByteArray = () => {
	const arb = new ArrayBuffer(8)
	const buf = new DataView(arb)

	buf.setFloat64(0, 123.456, false)

	const ba = new ByteArray(arb)

	console.log(ba.readDouble()) // 123.456
}

const convertDataViewToByteArray = () => {
	const buf = new DataView(new ArrayBuffer(3))

	buf.setInt8(0, 1)
	buf.setInt8(1, 2)
	buf.setInt8(2, 3)

	const ba = new ByteArray(buf)

	console.log(ba.readArrayOfBytes(0, 3)) // [1, 2, 3]
}

const multipleByteArrays = () => {
	const ba = new ByteArray()

	ba.writeArrayOfBytes([1, 2, 3])

	const rb = new ByteArray(ba)

	console.log(rb.readArrayOfBytes(0, 3)) // [1, 2, 3]
}

const exampleWriteRead = () => {
	const ba = new ByteArray()

	ba.writeByte(55)

	console.log(ba.readByte()) // 55
}

const exampleWriteReadObject = () => {
	const ba = new ByteArray()

	ba.writeObject({
		fmsVer: "FMS/3,5,5,2004",
		capabilities: 31,
		mode: 1,
		level: "status",
		code: "NetConnection.Connect.Success",
		description: "Connection succeeded.",
		data: {
			version: "3,5,5,2004",
			values: [1, 2, 3, true, false, "maybe"]
		},
		connection: {
			clients: {
				"1": [1, 2, 3],
				"2": ["a", "b", "c"],
				"admin": ["x", "y", "z", new Date()]
			}
		},
		clientId: 1584259571
	})

	const deserializedObj = ba.readObject()

	console.log(deserializedObj.connection.clients.admin) // [ 'x', 'y', 'z', 'Sat Sep 15 2018 20:09:22 GMT+0200 (GMT+02:00)' ]
}

const exampleFunctionObject = () => {
	const ba = new ByteArray()

	const getMessage = (amfVersion) => {
		return `Hello from AMF ${amfVersion}`
	}

	ba.writeObject({
		"message": getMessage(0)
	})

	console.log(ba.readObject()) // Hello from AMF 0
}