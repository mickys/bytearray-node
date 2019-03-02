"use strict"

class LoginVO {
  constructor(playerName, pw) {
    this.id = 0
    this.playerName = playerName
    this.pw = pw
  }
}

const ba = new (require("../../src/"))()

ba.registerClassAlias("com.pandaland.mvc.model.vo.LoginVO", LoginVO)
ba.registerClassAlias("com.pandaland.mvc.model.vo.AmfResponse", class AmfResponse { })
ba.registerClassAlias("com.pandaland.mvc.model.vo.LoginResultVO", class LoginResultVO { })
ba.registerClassAlias("com.pandaland.mvc.model.vo.PlayerInfoVO", class PlayerInfoVO { })
ba.registerClassAlias("com.pandaland.mvc.model.vo.ItemVO", class ItemVO { })
ba.registerClassAlias("com.pandaland.informationserver.api.vo.PartnerTrackingVO", class PartnerTrackingVO { })
ba.registerClassAlias("com.pandaland.mvc.model.vo.GameServerVO", class GameServerVO { })

// Capture the message length and store the AMF0 object buffer
ba.writeObject(new LoginVO("Zaseth", "Lol123456"))
const AmfValue = ba.buffer
ba.clear()
ba.clearReferences()

// Write the unimportant bytes like version and header/message count
ba.buffer = Buffer.from([0, 0, 0, 0, 0, 1])
ba.position += 6

// Write the message
ba.writeUTF("amfConnectionService.doLogin")
ba.writeUTF("/1")
ba.writeInt(AmfValue.length + 5)
ba.endian = false
ba.writeInt(10) // Strict Array
ba.endian = true
ba.writeByte(1) // Only 1 Strict Array
ba.buffer = Buffer.concat([ba.buffer, AmfValue])

require("request").post({ url: "https://panfu.world/InformationServer/", body: ba.buffer, encoding: null, headers: { "content-type": "application/x-amf", "content-length": ba.length } }, (err, res) => {
  if (err) throw err

  ba.buffer = res.body
  ba.position = 6 // Start with 6, unimportant bytes that we check in if statement
  ba.clearReferences()

  if ([...ba.buffer.slice(0, 6)].every(byte => [0, 0, 0, 0, 0, 1].includes(byte))) {
    const packet = { requestURI: ba.readUTF(), responseURI: ba.readUTF(), length: ba.readUnsignedInt(), value: ba.readObject() }

    if (packet.value.statusCode >= 1) {
      console.log("Incorrect username/password")
    } else {
      console.log(packet.value)
    }
  } else {
    throw new Error("Invalid result from HTTP response")
  }
})
