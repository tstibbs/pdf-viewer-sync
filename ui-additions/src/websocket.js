import {actionPing} from './constants.js'

const THREE_HOURS_IN_MILLIS = 3 * 60 * 60 * 1000
const FIVE_MINS_IN_MILLIS = 5 * 60 * 1000

export class ResilientWebSocket {
	#connectionStateChangeListener
	#socketOpen

	constructor(url, messageHandler, stayAwaker, connectionStateChangeListener) {
		this._url = url
		this._messageHandler = messageHandler
		this._stayAwaker = stayAwaker
		this.#connectionStateChangeListener = connectionStateChangeListener
		this.#socketOpen = false
		this._createSocket()
	}

	_createSocket() {
		this._socket = new WebSocket(this._url)
		this._socketReadyPromise = new Promise((resolve, reject) => {
			this._socket.onerror = event => {
				console.log('socket error')
				console.log(event)
				reject(event) //this won't do anything if the promise is already resolved
			}
			this._socket.onclose = event => {
				console.log('socket close')
				console.log(event)
				reject(event) //this won't do anything if the promise is already resolved
				this.#closeSocket()
			}

			this._socket.onopen = () => {
				console.log('socket open')
				this.#connected()
				resolve() //socket set up and ready to use
			}

			this._socket.onmessage = this._handleMessage.bind(this)
		})
		//no need to make this method wait for this
		this._socketReadyPromise.then(() => {
			this._startPinging()
		})
	}

	#connected() {
		this.#socketOpen = true
		this.#connectionStateChangeListener()
	}

	#closeSocket() {
		this.#socketOpen = false
		if (this._socket != null) {
			this._socket.close()
			this._socket.onopen = null
			this._socket.onmessage = null
			this._socket.onclose = null
			this._socket.onerror = null
			this._socket = null
		}
		this.#connectionStateChangeListener() //may be triggered again as a result of creating a new socket
		if (this._shouldReconnect()) {
			console.log('socket closed; attempting reconnect')
			this._createSocket() //create a new WebSocket connection, old one is dead
		} else {
			console.log('socket closed; not attempting reconnect')
		}
	}

	isConnected() {
		return this._socket != null && this.#socketOpen
	}

	_shouldReconnect() {
		let isAwake = this._stayAwaker.isAwake()
		let recentActivity = Date.now() - this._lastMessageActivity < THREE_HOURS_IN_MILLIS
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
		this.#socketSend({
			action: actionPing
		})
	}

	send(message) {
		this._lastMessageActivity = Date.now()
		this.#socketSend(message)
	}

	#socketSend(message) {
		try {
			this._socket.send(JSON.stringify(message))
		} catch (e) {
			console.error(e)
			this.#closeSocket() //something is broken, close it (which will trigger a re-open) to see if that helps
			throw e
		}
	}

	_handleMessage(event) {
		this._lastMessageActivity = Date.now()
		let data = JSON.parse(event.data)
		this._messageHandler(data)
	}

	//don't cache the result of this method as a socket reconnect could cause a new promise to be created
	async waitForSocketReady() {
		await this._socketReadyPromise
	}

	//update the URL to be used next time we need to reopen the socket
	updateUrl(url) {
		this._url = url
	}
}
