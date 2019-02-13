"use strict"

const it = require("tape")
const ByteArray = require("../src/")

it("Can write/read a byte", (tape) => {
  const ba = new ByteArray()

  ba.writeByte(1)
  ba.writeUnsignedByte(2)

  ba.position = 0

  tape.equal(ba.readByte(), 1)
  tape.equal(ba.readUnsignedByte(), 2)
  tape.equal(ba.position, 2)

  tape.end()
})

it("Can write/read a boolean", (tape) => {
  const ba = new ByteArray()

  ba.writeBoolean(true)
  ba.writeBoolean(false)

  ba.position = 0

  tape.equal(ba.readBoolean(), true)
  tape.equal(ba.readBoolean(), false)
  tape.equal(ba.position, 2)

  tape.end()
})

it("Can write/read bytes", (tape) => {
  const ba = new ByteArray()

  ba.writeByte(1)
  ba.writeByte(2)
  ba.writeByte(3)
  tape.equal(ba.position, 3)

  const rb = new ByteArray()
  rb.writeBytes(ba)

  rb.position = 0

  tape.equal(rb.readByte(), 1)
  tape.equal(rb.readByte(), 2)
  tape.equal(rb.readByte(), 3)

  rb.clear()
  rb.writeBytes(ba)
  rb.writeByte(4)
  rb.writeByte(5)
  rb.writeByte(6)
  rb.position = 3
  rb.readBytes(ba, 3, 3)

  tape.equal(ba.position, 3)
  tape.equal(ba.readByte(), 4)
  tape.equal(ba.readByte(), 5)
  tape.equal(ba.readByte(), 6)
  tape.equal(ba.position, 6)

  tape.end()
})

it("Can write/read a short", (tape) => {
  const ba = new ByteArray()

  ba.writeShort(1)
  ba.writeUnsignedShort(2)

  ba.position = 0

  tape.equal(ba.readShort(), 1)
  tape.equal(ba.readUnsignedShort(), 2)
  tape.equal(ba.position, 4)

  tape.end()
})

it("Can write/read an int", (tape) => {
  const ba = new ByteArray()

  ba.writeInt(1)
  ba.writeUnsignedInt(2)

  ba.position = 0

  tape.equal(ba.readInt(), 1)
  tape.equal(ba.readUnsignedInt(), 2)
  tape.equal(ba.position, 8)

  tape.end()
})

it("Can write/read a float/double", (tape) => {
  const ba = new ByteArray()

  ba.writeFloat(1.123)
  ba.writeDouble(2.456)

  ba.position = 0

  tape.equal(Math.round(ba.readFloat() * 1000) / 1000, 1.123)
  tape.equal(ba.readDouble(), 2.456)
  tape.equal(ba.position, 12)

  tape.end()
})

it("Can write/read a string", (tape) => {
  const ba = new ByteArray()

  ba.writeUTF("Hello World!")
  ba.writeUTFBytes("Hello")
  ba.writeMultiByte("Foo", "ascii")

  ba.position = 0

  tape.equal(ba.readUTF(), "Hello World!")
  tape.equal(ba.readUTFBytes(5), "Hello")
  tape.equal(ba.readMultiByte(3, "ascii"), "Foo")
  tape.equal(ba.position, 22)

  tape.end()
})

it("Can compress/uncompress the buffer", (tape) => {
  const ba = new ByteArray()

  ba.writeUTF("Hello World!")
  ba.writeByte(1)
  ba.writeByte(2)

  tape.equal(ba.position, 16)
  ba.deflate()
  tape.equal(ba.position, 18)

  ba.inflate()
  tape.equal(ba.position, 0)
  tape.equal(ba.readUTF(), "Hello World!")
  tape.equal(ba.readByte(), 1)
  tape.equal(ba.readByte(), 2)
  tape.equal(ba.position, 16)

  ba.clear()
  tape.equal(ba.position, 0)

  ba.writeUTF("Hello World!")
  tape.equal(ba.position, 14)

  ba.compress("zlib")
  tape.equal(ba.position, 22)
  tape.equal(ba.buffer[0], 120)
  tape.equal(ba.buffer[1], 218)

  ba.uncompress("zlib")
  tape.equal(ba.position, 0)
  tape.equal(ba.readUTF(), "Hello World!")
  tape.equal(ba.position, 14)

  tape.end()
})

it("Supports BE/LE", (tape) => {
  const ba = new ByteArray()

  ba.endian = false // LE
  ba.writeShort(1)
  ba.endian = true // BE
  ba.writeShort(2)

  ba.position = 0

  ba.endian = false
  tape.equal(ba.readShort(), 1)
  ba.endian = true
  tape.equal(ba.readShort(), 2)
  tape.equal(ba.position, 4)

  tape.end()
})

it("Supports bytesAvailable", (tape) => {
  const ba = new ByteArray()

  ba.writeUTFBytes("Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Vivamus etc.")

  ba.position = 0

  while (ba.bytesAvailable > 0 && ba.readUTFBytes(1) !== "a") { }

  if (ba.position < ba.bytesAvailable) {
    tape.equal(ba.position, 23)
    tape.equal(ba.bytesAvailable, 47)
  }

  tape.end()
})
