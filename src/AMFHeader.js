"use strict"

class AMFHeader {
	constructor(name, value, mustUnderstand = false) {
		this.name = name
		this.value = value
		this.mustUnderstand = mustUnderstand
	}
}

module.exports = AMFHeader