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

tape("This library also supports writeBytes/readBytes", (v) => {
  const ba = new ByteArray()

  ba.writeByte(1)
  ba.writeByte(2)

  v.equal(ba.writePosition, 2)

  const rb = new ByteArray()

  v.equal(rb.writePosition, 0)
  v.equal(rb.readPosition, 0)

  rb.writeBytes(ba, 0, 2)

  v.equal(rb.writePosition, 2)

  v.equal(rb.readByte(), 1)
  v.equal(rb.readByte(), 2)

  v.equal(rb.readPosition, 2)

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
