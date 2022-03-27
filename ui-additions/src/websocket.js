import {actionPing} from './constants.js'

const THREE_HOURS_IN_MILLIS = 3 * 60 * 60 * 1000
const FIVE_MINS_IN_MILLIS = 5 * 60 * 1000

export class ResilientWebSocket {

	constructor(url, messageHandler, stayAwaker) {
		this._url = url
		this._messageHandler = messageHandler
		this._stayAwaker = stayAwaker
		this._createSocket()
	}

	_createSocket() {
		this._socket = new WebSocket(this._url)
		this._socketReadyPromise = new Promise((resolve, reject) => {
			this._socket.onerror = (event) => {
				console.log('socket error')
				console.log(error)
				reject(event) //this won't do anything if the promise is already resolved
			}
			this._socket.onclose = event => {
				console.log('socket close')
				console.log('error')
				reject(event) //this won't do anything if the promise is already resolved
				this._closeSocket()
				if (this._shouldReconnect()) {
					console.log('socket closed; attempting reconnect')
					this._createSocket() //create a new WebSocket connection, old one is dead
				} else {
					console.log('socket closed; not attempting reconnect')
				}
			}

			this._socket.onopen = () => {
				console.log('socket open')
				resolve() //socket set up and ready to use
			}

			this._socket.onmessage = this._handleMessage.bind(this)
		})
		this._socketReadyPromise.then(() => {//no need to make this method wait for this
			this._startPinging()
		})
	}

	_closeSocket() {
		if (this._socket != null) {
			this._socket.close()
			this._socket.onopen = null
			this._socket.onmessage = null
			this._socket.onclose = null
			this._socket.onerror = null
			this._socket = null
		}
	}

	_shouldReconnect() {
		let isAwake = this._stayAwaker.isAwake()
		let recentActivity = (Date.now() - this._lastMessageActivity) < THREE_HOURS_IN_MILLIS
		return isAwake && recentActivity
	}

	_startPinging() {
		//aws api gateway times out socket after 10 mins of idle, so send ping every 5 mins to keep it alive
		setInterval(() => {
			if (this._shouldReconnect()) {
				this._ping()
			}
			//don't clear the interval if currently asleep, as it may just be that the tab has been temporarily hidden
		}, FIVE_MINS_IN_MILLIS)
	}

	_ping() {
		//send directly, don't record this as 'last activity'
		this._socket.send(JSON.stringify({
			action: actionPing
		}))
	}

	send(message) {
		this._lastMessageActivity = Date.now()
		this._socket.send(JSON.stringify(message))
	}

	_handleMessage(event) {
		this._lastMessageActivity = Date.now()
		let data = JSON.parse(event.data)
		this._messageHandler(data)
	}

	async waitForSocketReady() { //don't cache the result of this method as a socket reconnect could cause a new promise to be created
		await this._socketReadyPromise
	}

	//update the URL to be used next time we need to reopen the socket
	updateUrl(url) {
		this._url = url
	}
}
