"use strict"

const tape = require("tape")

const ByteArray = require("../src/ByteArray")

tape("A quick test", (v) => {
	const ba = new ByteArray()

	ba.writeInt(1)
	ba.writeShort(2)
	ba.writeByte(3)

	v.equal(ba.readInt(), 1)
	v.equal(ba.readShort(), 2)
	v.equal(ba.readByte(), 3)

	v.end()
})

tape("You can also use 2 ByteArray constructors", (v) => {
	const ba = new ByteArray()

	ba.writeByte(50)
	ba.writeDouble(1.5)

	const rb = new ByteArray(ba)

	v.equal(rb.readByte(), 50)
	v.equal(rb.readDouble(), 1.5)

	v.end()
})

tape("Write/read AMF0 object", (v) => {
	const ba = new ByteArray()

	ba.objectEncoding = 0

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

	const obj = ba.readObject()

	v.deepEqual(obj.data.values, [1, 2, 3, true, false, "maybe"])
	v.equal(obj.fmsVer, "FMS/3,5,5,2004")
	v.equal(obj.clientId, 1584259571)

	v.end()
})

tape("Write/read AMF3 object", (v) => {
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

	const obj = ba.readObject()

	v.deepEqual(obj.data.values, [1, 2, 3, true, false, "maybe"])
	v.equal(obj.fmsVer, "FMS/3,5,5,2004")
	v.equal(obj.clientId, 1584259571)

	v.end()
})

tape("You can serialize a function in AMF format", (v) => {
	const ba = new ByteArray()

	ba.objectEncoding = 0

	const getMessage = (amfVersion) => {
		return `Hello from AMF${amfVersion}`
	}

	ba.writeObject({
		"message": getMessage(0)
	})

	v.equal(ba.readObject().message, "Hello from AMF0")

	v.end()
})

tape("You can also serialize a class in AMF format", (v) => {
	const Person = class Person {
		constructor() {
			this.firstName = ""
			this.lastName = ""
			this.age = 0
		}
	}

	const objectPerson = new Person()

	objectPerson.firstName = "Zaseth"
	objectPerson.lastName = "Secret"
	objectPerson.age = 69

	const ba = new ByteArray()

	ba.writeObject(objectPerson)

	const obj = ba.readObject()

	v.equal(obj.firstName, "Zaseth")
	v.equal(obj.lastName, "Secret")
	v.equal(obj.age, 69)

	v.end()
})

tape("Adobe example #1", (v) => {
	const ba = new ByteArray()

	ba.writeBoolean(false)
	ba.writeDouble(Math.PI)

	v.equal(ba.readBoolean() === false, true)
	v.equal(ba.readDouble(), 3.141592653589793)

	v.end()
})

tape("Adobe example #2", (v) => {
	const ba = new ByteArray()

	v.equal(ba.writePosition, 0)

	ba.writeUTFBytes("Hello World!")

	v.equal(ba.writePosition, 12)

	v.equal(ba.readUTFBytes(6), "Hello ")
	v.equal(ba.readUTFBytes(6), "World!")
	v.equal(ba.readPosition, 12)

	v.end()
})

tape("Adobe example #3", (v) => {
	const ba = new ByteArray()

	ba.writeUnsignedInt(10)

	v.equal(ba.writePosition, 4)

	ba.writeBoolean(true)

	v.equal(ba.writePosition, 5)

	ba.writeUnsignedInt(26)

	v.equal(ba.writePosition, 9)

	v.equal(ba.readUnsignedInt(), 10)
	v.equal(ba.readPosition, 4)
	v.equal(ba.readBoolean(), true)
	v.equal(ba.readPosition, 5)
	v.equal(ba.readUnsignedInt(), 26)
	v.equal(ba.readPosition, 9)

	ba.readPosition = 4

	v.equal(ba.readBoolean(), true)
	v.equal(ba.readPosition, 5)

	v.end()
})