"use strict"

const it = require("tape")
const ByteArray = require("../src/")

it("Can write/read signed bytes", (tape) => {
  const ba = new ByteArray()

  ba.writeByte(1)
  ba.writeByte(2)
  ba.writeByte(3)

  ba.position = 0

  tape.equal(ba.readByte(), 1)
  tape.equal(ba.readByte(), 2)
  tape.equal(ba.readByte(), 3)
  tape.equal(ba.position, 3)

  tape.end()
})
