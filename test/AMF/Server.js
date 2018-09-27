"use strict"

const ByteArray = require("../../src/ByteArray")

require("net").createServer((socket) => {
	socket.on("data", (data) => {
		const buffer = Buffer.from(data)

		console.log("[REC]", buffer)

		const obj = new ByteArray(buffer).readObject()

		console.log(`Adobe Flash said the following: ${obj.message}`)
	})
}).listen((1234), () => {
	console.log("Listening")
})