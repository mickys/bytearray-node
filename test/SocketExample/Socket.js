"use strict"

const ByteArray = require("../../src/ByteArray")

const sendMulti = (userId, subject, recipients, content) => {
	const ba = new ByteArray()

	ba.writeShort(26880)

	const lengthPos = ba.position

	const key = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000

	ba.writeInt(0)
	ba.writeUTF(String(userId ^ key))
	ba.writeUTF(String(key))
	ba.writeUTF(subject)
	ba.writeInt(0)
	ba.writeShort(1)
	ba.writeUTF(recipients)
	ba.writeObject(content)

	const messageLength = ba.position - lengthPos - 4

	ba.writeInt(messageLength)

	return ba
}

const readMulti = (ba) => {
	ba.position = 0

	const header = ba.readShort()

	if (header !== 26880) {
		const errHeader = {}

		errHeader.senderId = "Error"
		errHeader.subject = "Error"
		errHeader.content = "Invalid Header"

		return errHeader
	}

	const size = ba.readInt()

	if (size !== 0) {
		const errSize = {}

		errSize.senderId = "Error"
		errHeader.subject = "Error"
		errHeader.content = "Invalid Size"

		return errSize
	}

	try {
		const message = {}

		message.senderId = ba.readUTF() ^ ba.readUTF()
		message.subject = ba.readUTF()
		message.timestamp = ba.readInt()
		message.recipients = {}
		message.recipients[ba.readShort() === 1 ? "0" : "0"] = ba.readUTF()
		message.content = ba.readObject()
		message.messageLength = ba.readInt()
		message.length = ba.position

		return message
	} catch (e) {
		const errSocket = {}

		errSocket.senderId = "Error"
		errSocket.subject = "Error"
		errSocket.content = "Error in Socket Data"

		return errSocket
	}
}