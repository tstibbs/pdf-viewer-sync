const webSocketBase = ''

export class Comms {

	constructor() {
		
		this._joinToken = (new URLSearchParams(location.search)).get('joinToken')
		let webSocketUrl = webSocketBase
		if (this._joinToken != null) {
			webSocketUrl = `${webSocketUrl}?joinToken=${this._joinToken}`
		}
		this._socket = new WebSocket(webSocketUrl)
		this._socketOpenPromise = new Promise((resolve) => {
			this._socket.onopen = () => {
				console.log('Connection opened')
				resolve()
				if (this._joinToken == null) {
					this._socket.send(JSON.stringify({"action":"getPoolId"}))
				}
			}

			this._socket.onmessage = async (event) => {
				let data = JSON.parse(event.data)
				if (data.poolId !== undefined) {
					this._joinToken = data.poolId
					console.log(`New join token: ${this._joinToken}`)
				} else if (data.type === 'changepage') {
					console.log(`message recieved: ${JSON.stringify(data)}`)
					this._recievedPageChange(data.value)
				} else {
					console.error('Unexpected data type: ' + JSON.stringify(data))
				}
			}
		})
	}

	_recievedPageChange(pageNumber) {
		if (pageNumber != this._mostRecentPageNumber) { //to prevent an infinite loop if this client gets notified about its own changes
			PDFViewerApplication.eventBus.dispatch("pagenumberchanged", {
				value: pageNumber
			})
		}
	}

	async sendPageChange(pageNumber) {
		await this._socketOpenPromise
		let data = {
			type: 'changepage',
			value: pageNumber
		}
		this._mostRecentPageNumber = pageNumber
		this._socket.send(JSON.stringify({"action":"sendmessage", data: data}))
	}

	getJoinToken() {
		return this._joinToken
	}
}
