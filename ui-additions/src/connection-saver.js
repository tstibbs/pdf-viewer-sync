const storageId = 'pdf-viewer-sync/connection-saver'

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
		try {
			const blob = localStorage.getItem(storageId)
			if (blob != null) {
				return this.#deserialise(blob)
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
