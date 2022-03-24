import {apiGatewayJoinTokenParam, messageTypeChangePage, actionSendMessage, actionGetPoolId, messageTypeLoadFile} from './constants.js'
import {changePage, loadPdfFromParams, getCurrentPage} from './pdf-integration.js'

export class Comms {

	constructor(urlUtils) {
		this._urlUtils = urlUtils
		// initialise such that we don't publish a 'page change' event when we load the file and switch to the right page
		this._lastRecievedPageNumber = this._urlUtils.getStartingPage + this._urlUtils.getPosition()
		// initialise such that we don't publish a 'file change' event when we load the file
		this._lastRecievedFileLoad = this._urlUtils.getFile()
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
					this._sendGetPoolId()
				}
			}

			this._socket.onmessage = async (event) => {
				let data = JSON.parse(event.data)
				if (data.poolId !== undefined) {
					this._joinToken = data.poolId
					console.log(`New join token: ${this._joinToken}`)
					this._urlUtils.updateJoinToken(this._joinToken)
					resolve() // join token recieved, so we're ready to share now
				} else if (data.type === messageTypeChangePage) {
					console.log(`message recieved: ${JSON.stringify(data)}`)
					this._recievedPageChange(data.value)
				} else if (data.type === messageTypeLoadFile) {
					console.log(`message recieved: ${JSON.stringify(data)}`)
					this._recievedLoadFile(data.value)
				} else {
					console.error('Unexpected data type: ' + JSON.stringify(data))
				}
			}
		})
	}

	_sendGetPoolId() {
		this._sendMessage(actionGetPoolId)
	}

	_sendChangePage(pageNumber) {
		let data = {
			type: messageTypeChangePage,
			value: pageNumber
		}
		this._sendMessage(actionSendMessage, data)
	}

	_sendLoadFile(file) {
		let data = {
			type: messageTypeLoadFile,
			value: {
				file: file,
				page: getCurrentPage()
			}
		}
		this._sendMessage(actionSendMessage, data)
	}

	_sendMessage(action, data) {
		let message = {
			action
		}
		if (data != null) {
			message.data = data
		}
		this._socket.send(JSON.stringify(message))
	}

	_recievedPageChange(pageNumber) {
		if (this._urlUtils.isPositionSet()) { // if the user hasn't yet chosen a position param, ignore this event
			let position = this._urlUtils.getPosition()
			this._lastRecievedPageNumber = pageNumber + position
			changePage(pageNumber, position)
		}
	}

	_recievedLoadFile({file, page}) {
		this._lastRecievedFileLoad = file
		let position = this._urlUtils.getPosition()
		this._lastRecievedPageNumber = page + position
		this._urlUtils.updateFile(file)
		loadPdfFromParams(page, position)
	}

	async waitForSocketReady() {
		await this._socketReadyPromise
	}

	async sendPageChange(pageNumber) {
		if (this._urlUtils.isPositionSet()) { // if the user hasn't yet chosen a position param, ignore this event
			if (pageNumber != this._lastRecievedPageNumber) { //attempt to prevent infinite loop from events firing for changes we previously recieved
				pageNumber -= this._urlUtils.getPosition()
				this._lastRecievedPageNumber = null
				await this.waitForSocketReady()
				this._sendChangePage(pageNumber)
			}
		}
	}

	async sendLoadFile(file) {
		if (file != this._lastRecievedFileLoad) { //attempt to prevent infinite loop from events firing for changes we previously recieved
			this._lastRecievedPageNumber = null
			await this.waitForSocketReady()
			this._sendLoadFile(file)
		}
	}
}
