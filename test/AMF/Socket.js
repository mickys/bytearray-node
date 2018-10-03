"use strict"

const ByteArray = require("../../src/ByteArray")

const writePacket = (subject, recipients, content) => {
	const ba = new ByteArray()

	ba.writeShort(26880)

	const lengthPos = ba.position

	ba.writeInt(0)
	ba.writeUTF(String(100)) // UserID
	ba.writeUTF(subject)
	ba.writeInt(0)
	ba.writeShort(recipients.length)

	for (let i = 0; i < recipients.length; i++) ba.writeUTF(recipients[i])

	ba.writeObject(content) // AMF3

	const messageLength = ba.position - lengthPos - 4
	ba.position = lengthPos
	ba.writeInt(messageLength)

	const bufferArray = [...ba.buffer]
	const hashStream = []

	for (let i = 0; i < messageLength + 6; i++) bufferArray[0 + i] = bufferArray[0 + i] ^ hashStream[(0 + i) & (1 << 15) - 1]

	const socket = new ByteArray()

	socket.writeBytes(ba, 0, messageLength + 6)

	return socket
}

writePacket("SA", ["system.email"], {
	message: "Hello world"
})