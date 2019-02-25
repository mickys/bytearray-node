"use strict"

class AMFHeader {
  /**
   * Construct a new AMFHeader
   * @constructor
   * @param {String} name - The header name
   * @param {Boolean} mustUnderstand - Must the header be understood
   * @param {*} data - The data of the header
   */
  constructor(name, mustUnderstand = false, data) {
    this.name = name
    this.mustUnderstand = mustUnderstand
    this.data = data
  }
}

class AMFMessage {
  /**
   * Construct a new AMFMessage
   * @constructor
   * @param {String} targetURI - The target URI
   * @param {String} responseURI - The response URI
   * @param {*} body - The body of the message
   */
  constructor(targetURI, responseURI, body) {
    this.targetURI = targetURI
    this.responseURI = responseURI
    this.body = body
  }
}

class AMFPacket {
  /**
   * Construct a new AMFPacket
   * @constructor
   */
  constructor() {
    this.version = 0
    this.headers = []
    this.messages = []
  }
}

/**
 * Writes an AMF0 packet
 * @param {AMFPacket} packet - The packet to write
 * @returns {ByteArray} - The AMF0 data
 */
function writeAMF0Packet(packet) {
  const ba = new (require("../../src/"))

  ba.writeShort(packet.version)
  ba.writeShort(packet.headers.length)

  for (let i = 0; i < packet.headers.length; i++) {
    const header = packet.headers[i]

    ba.writeUTF(header.name)
    ba.writeBoolean(header.mustUnderstand)
    ba.writeInt(-1)
    ba.writeObject(header.data)
  }

  ba.writeShort(packet.messages.length)

  for (let i = 0; i < packet.messages.length; i++) {
    const message = packet.messages[i]

    ba.writeUTF(message.targetURI.length === 0 ? "null" : message.targetURI)
    ba.writeUTF(message.responseURI.length === 0 ? "null" : message.responseURI)
    ba.writeInt(-1)
    ba.writeObject(message.body)
  }

  ba.position = 0

  return ba
}

/**
 * Reads an AMF0 packet
 * @param {ByteArray} ba - The AMF0 data
 * @returns {AMFPacket} - The packet that has been read
 */
function readAMF0Packet(ba) {
  if (ba.readShort() !== 0) {
    throw new Error("Invalid AMF version")
  }

  const packet = new AMFPacket()

  const headerCount = ba.readShort()

  for (let i = 0; i < headerCount; i++) {
    const name = ba.readUTF()
    const mustUnderstand = ba.readBoolean()

    if (ba.readInt() !== -1) {
      throw new Error("Invalid AMF header length")
    }

    const data = ba.readObject()

    packet.headers.push(new AMFHeader(name, mustUnderstand, data))
  }

  const messageCount = ba.readShort()

  for (let i = 0; i < messageCount; i++) {
    const targetURI = ba.readUTF()
    const responseURI = ba.readUTF()

    if (ba.readInt() !== -1) {
      throw new Error("Invalid AMF header length")
    }

    const body = ba.readObject()

    packet.messages.push(new AMFMessage(targetURI, responseURI, body))
  }

  return packet
}

const packet = new AMFPacket()

packet.headers.push(new AMFHeader("onLogin", false, { username: "Zaseth", password: "Lol123456" }))
packet.messages.push(new AMFMessage("/login", "/onLogin", { onSuccess: "You have logged in!", onFailed: "Incorrect username or password!" }))

console.log(readAMF0Packet(writeAMF0Packet(packet)))
