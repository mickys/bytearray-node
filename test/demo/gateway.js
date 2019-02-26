"use strict"

const ByteArray = require("../../src/")

/**
 * Start an AMF0 gateway
 * @param {Number} port - The port to listen on
 * @param {String} host - The host to listen on
 */
function start(port = 8081, host = "127.0.0.1") {
  const methods = require("./methods")
  const server = require("http").createServer()

  server.addListener("request", onRequest)
  server.listen(parseInt(port), host)

  console.log(`Gateway started on ${host}:${port}`)

  /**
   * Handles request events
   * @param {Object} req - The incoming HTTP request object
   * @param {Object} res - The incoming HTTP response object
   */
  function onRequest(req, res) {
    if (req.headers["content-type"] === "application/x-amf") {
      req.setEncoding("binary")

      // Collect body data
      let body = ""
      req.addListener("data", (chunk) => { body += chunk })

      // Process body data when it's fully collected
      req.addListener("end", () => {
        const requestBA = new ByteArray(Buffer.from(body))
        const responseBA = new ByteArray()
        const requestPacket = { headers: {}, messages: [] }
        const responsePacket = { headers: {}, messages: [] }
        const bytes = [195, 191, 195, 191, 195, 191, 195, 191, 2] // Equivalent to \xFF\xFF\xFF\xFF

        // Deserialize the requesting AMF0 packet first
        if (requestBA.readUnsignedShort() === 0) { // AMF0
          const headerCount = requestBA.readUnsignedShort()

          for (let i = 0; i < headerCount; i++) {
            requestBA.clearReferences()

            const header = {
              name: requestBA.readUTF(),
              mustUnderstand: requestBA.readBoolean(),
              length: requestBA.readUnsignedInt(),
              value: requestBA.readObject()[0]
            }

            // This doesn't avoid duplicates, this is just a test anyway
            requestPacket.headers[header.name] = header
            responsePacket.headers[header.name] = header
          }

          const messageCount = requestBA.readUnsignedShort()

          for (let i = 0; i < messageCount; i++) {
            requestBA.clearReferences()

            const message = {
              requestURI: requestBA.readUTF(),
              responseURI: requestBA.readUTF(),
              length: requestBA.readUnsignedInt(),
              value: requestBA.readObject()[0]
            }

            requestPacket.messages.push(message)

            let value = ""

            // Check if the requestURI exists
            if (methods[message.requestURI]) {
              value = methods[message.requestURI]()
            }

            responsePacket.messages.push({
              requestURI: message.responseURI + "/onResult",
              responseURI: "",
              value
            })
          }

          console.log(`Received: ${JSON.stringify(requestPacket)}`)
          console.log(`Sending: ${JSON.stringify(responsePacket)}`)

          // Serialize a new AMF0 packet to respond with
          responseBA.writeUnsignedShort(0) // AMF0
          responseBA.writeUnsignedShort(responsePacket.headers.length)

          for (let i = 0; i < responsePacket.headers.length; i++) {
            responseBA.clearReferences()
            responseBA.writeUTF(responsePacket.headers[i].name)
            responseBA.writeBoolean(responsePacket.headers[i].mustUnderstand)
            for (let i = 0; i < bytes.length; i++) { responseBA.writeUnsignedByte(bytes[i]) }
            responseBA.writeObject(responsePacket.headers[i].value)
          }

          responseBA.writeUnsignedShort(responsePacket.messages.length)

          for (let i = 0; i < responsePacket.messages.length; i++) {
            responseBA.clearReferences()
            responseBA.writeUTF(responsePacket.messages[i].requestURI)
            responseBA.writeUTF(responsePacket.messages[i].responseURI)
            for (let i = 0; i < bytes.length; i++) { responseBA.writeUnsignedByte(bytes[i]) }
            responseBA.writeObject(responsePacket.messages[i].value)
          }

          res.writeHead(200, { "content-type": "application/x-amf", "content-length": responseBA.length })
          res.write(responseBA.toString(), "binary")
          res.end()
        }
      })
    }
  }
}

start()
