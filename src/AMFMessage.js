"use strict"

class AMFMessage {
	constructor(targetUri = "", responseUri = "", value = "") {
		this.targetUri = targetUri
		this.responseUri = responseUri
		this.value = value
	}
}

module.exports = AMFMessage