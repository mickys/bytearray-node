"use strict"

const ByteArray = require("../../src/ByteArray")

const writePacket = (data) => {
	const ba = new ByteArray()

	const recipients = [data.recipients]

	ba.writeShort(26880)
	ba.writeUTF(String(data.senderId))
	ba.writeUTF(data.subject)
	ba.writeShort(recipients.length)

	for (let i = 0; i < recipients.length; i++) {
		ba.writeUTF(recipients[i])
	}

	ba.writeObject(data.content)
	ba.writeInt(ba.position)

	return ba
}

const readPacket = (ba) => {
	if (ba.position !== 0) ba.position = 0
	if (ba.readShort() !== 26880) return undefined

	const senderId = ba.readUTF()
	const subject = ba.readUTF()
	const recipientLength = ba.readShort()
	const recipients = {}

	for (let i = 0; i < recipientLength; i++) {
		recipients[i] = ba.readUTF()
	}

	const content = ba.readObject()
	const length = ba.readInt() + 4

	return {
		content,
		senderId,
		recipients,
		subject,
		length
	}
}

const writePingPacket = () => {
	return writePacket({
		senderId: 100,
		subject: "PING",
		recipients: "System.Ping.Client",
		content: {
			online: true
		}
	})
}

const readPingPacket = (ba) => {
	return readPacket(ba).content.online ? "The client is online" : "The client is not online"
}