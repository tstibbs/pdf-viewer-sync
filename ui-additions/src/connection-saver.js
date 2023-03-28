const storageId = 'pdf-viewer-sync/connection-saver'
const maxAge = 60 * 60 * 1000 //one hour in millis

export class ConnectionSaver {
	#urlUtils

	constructor(urlUtils) {
		this.#urlUtils = urlUtils
	}

	saveConnectionInfo() {
		const date = Date.now()
		const blob = this.#serialise(this.#urlUtils.getPosition(), this.#urlUtils.getJoinToken(), date)
		try {
			localStorage.setItem(storageId, blob)
		} catch (e) {
			//ignore, there are so many (valid) reasons why this can fail and this is all just best efforts anyway
		}
	}

	fetchConnectionInfo() {
		const now = Date.now()
		try {
			const blob = localStorage.getItem(storageId)
			if (blob != null) {
				const data = this.#deserialise(blob)
				let {date} = data
				let age = now - date
				if (age < maxAge) {
					return data
				}
			}
		} catch (e) {
			//ignore, there are so many (valid) reasons why this can fail and this is all just best efforts anyway
		}
		return null
	}

	#serialise(position, joinToken, date) {
		return JSON.stringify({position, joinToken, date})
	}

	#deserialise(blob) {
		return JSON.parse(blob)
	}
}
