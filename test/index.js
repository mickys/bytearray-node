"use strict"

const ByteArray = require("../src/ByteArray")

const quickTest = () => {
	const ba = new ByteArray()

	ba.writeInt(1)
	ba.writeShort(2)
	ba.writeByte(3)

	ba.position = 0

	if (ba.readInt() === 1 && ba.readShort() === 2 && ba.readByte() === 3) console.log(`Gucci`)
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

	ba.position = 0

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

	ba.position = 0

	const deserializedObj = ba.readObject()

	console.log(deserializedObj.connection.clients.admin) // [ 'x', 'y', 'z', 'Sat Sep 15 2018 20:09:22 GMT+0200 (GMT+02:00)' ]
}

const exampleFunctionObject = () => {
	const ba = new ByteArray()

	const getMessage = (amfVersion) => {
		return `Hello from AMF${amfVersion}`
	}

	ba.writeObject({
		"message": getMessage(0)
	})

	ba.position = 0

	console.log(ba.readObject()) // Hello from AMF0
}

const adobeExample1 = () => {
	const groceries = ["milk", 4.50, "soup", 1.79, "eggs", 3.19, "bread", 2.35]
	const ba = new ByteArray()

	for (let i = 0; i < groceries.length; i++) {
		ba.writeUTFBytes(groceries[i++])
		ba.writeFloat(groceries[i])
	}
}

const adobeExample2 = () => {
	const ba = new ByteArray()

	console.log(ba.position) // 0

	ba.writeUTFBytes("Hello World!")

	console.log(ba.position) // 12
}

const adobeExample3 = () => {
	const ba = new ByteArray()

	console.log(ba.position) // 0

	ba.writeUTFBytes("Hello World!")

	console.log(ba.position) // 12

	ba.position = 0

	console.log(`The first 6 bytes are: ${ba.readUTFBytes(6)}`) // Hello
	console.log(`And the next 6 bytes are: ${ba.readUTFBytes(6)}`) // World!
}

const adobeExample4 = () => {
	const ba = new ByteArray()

	ba.writeUTFBytes("Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Vivamus etc.")

	console.log(ba.position) // 70

	ba.position = 0

	while (ba.bytesAvailable > 0 && ba.readUTFBytes(1) !== "a") {

	}

	if (ba.position < ba.bytesAvailable) {
		console.log(`Found the letter a; position is: ${ba.position}`) // 23
	}
}

const adobeExample5 = () => {
	const ba = new ByteArray()

	ba.writeUnsignedInt(10) // position = 4
	ba.writeBoolean(true) // position = 5
	ba.writeUnsignedInt(26) // position = 9

	ba.position = 0

	console.log(ba.readUnsignedInt()) // 10, position = 4
	console.log(ba.readBoolean()) // true, position = 5
	console.log(ba.readUnsignedInt()) // 26, position = 9

	ba.position = 4

	console.log(ba.readBoolean()) // true, position = 5
}

const adobeExample6 = () => {
	const ba = new ByteArray()

	ba.writeUnsignedInt(10) // position = 4
	ba.writeUnsignedInt(26) // position = 8

	ba.position = 0

	while (ba.bytesAvailable !== 2040) { // we wrote 8 bytes, 2048 - 8 = 2040
		console.log(ba.readByte())
	}
}