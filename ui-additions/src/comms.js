import {apiGatewayJoinTokenParam} from './constants.js'

export class Comms {

	constructor(urlUtils) {
		this._urlUtils = urlUtils
		this._joinToken = this._urlUtils.getJoinToken()
		let webSocketUrl = this._urlUtils.getWebSocketBase()
		if (this._joinToken != null) {
			webSocketUrl = `${webSocketUrl}?${apiGatewayJoinTokenParam}=${this._joinToken}`
		}
		this._socket = new WebSocket(webSocketUrl)
		this._socketReadyPromise = new Promise((resolve, reject) => {
			this._socket.onerror = (event) => {
				reject(event)
			}

			this._socket.onopen = () => {
				console.log('Connection opened')
				if (this._joinToken != null) {
					resolve() // we already have a join token, so the socket is set up and ready to use
				} else {
					this._socket.send(JSON.stringify({"action":"getPoolId"}))
				}
			}

			this._socket.onmessage = async (event) => {
				let data = JSON.parse(event.data)
				if (data.poolId !== undefined) {
					this._joinToken = data.poolId
					console.log(`New join token: ${this._joinToken}`)
					this._urlUtils.updateJoinToken(this._joinToken)
					resolve() // join token recieved, so we're ready to share now
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
		pageNumber += this._urlUtils.getPosition()
		this._lastRecievedPageNumber = pageNumber
		PDFViewerApplication.eventBus.dispatch("pagenumberchanged", {
			value: pageNumber
		})
	}

	async waitForSocketReady() {
		await this._socketReadyPromise
	}

	async sendPageChange(pageNumber) {
		if (pageNumber != this._lastRecievedPageNumber) { //attempt to prevent infinite loop from events firing for changes we made
			pageNumber -= this._urlUtils.getPosition()
			this._lastRecievedPageNumber = null
			await this.waitForSocketReady()
			let data = {
				type: 'changepage',
				value: pageNumber
			}
			this._socket.send(JSON.stringify({"action":"sendmessage", data: data}))
		}
	}
}
