import UAParser from 'ua-parser-js'

import {Notifier} from './notifier.js'
import {
	commsUrlPrefix,
	apiGatewayJoinTokenParam,
	messageTypeChangePage,
	actionSendMessage,
	messageTypeLoadFile,
	messageTypeClientJoined,
	messageTypeClientLeft,
	messageTypeCounterUpdate,
	messageTypeMulti
} from './constants.js'
import {changePage, loadPdfFromParams, getCurrentPage} from './pdf-integration.js'
import {ResilientWebSocket} from './websocket.js'
import {ApiInterface} from './api-interface.js'

export class Comms {
	#stayAwaker
	#apiInterface
	#endpoint
	#clientsCounter // counts the number of clients in the pool, including this one
	#connectionStateChangeListener
	#connectionSaver

	constructor(stayAwaker, urlUtils, connectionSaver) {
		this.#clientsCounter = 0
		this.#stayAwaker = stayAwaker
		this.#connectionSaver = connectionSaver
		this._uaParser = new UAParser()
		this._notifier = new Notifier()
		this._urlUtils = urlUtils
		// initialise such that we don't publish a 'page change' event when we load the file and switch to the right page
		this._lastPageNumberSet = this._urlUtils.getStartingPage + this._urlUtils.getPosition()
		this._lastFileLoad = null //initialise to null so that an update is sent when 'reopening' the primary client
		this.#endpoint = this._urlUtils.getEndpoint()
	}

	async init() {
		this.#apiInterface = new ApiInterface(this._urlUtils.getJoinToken(), this.#endpoint)
		let joinInfo = await this.#apiInterface.fetchJoinInfo()
		let joinToken = joinInfo.poolId
		const webSocketBase = this.#endpoint.startsWith('http') ? 'ws' + this.#endpoint.substring(4) : this.#endpoint
		const websocketUrl = `${webSocketBase}/${commsUrlPrefix}?${apiGatewayJoinTokenParam}=${joinToken}`
		this._urlUtils.updateJoinToken(joinToken)
		this._socket = new ResilientWebSocket(
			websocketUrl,
			this._handleMessage.bind(this),
			this.#stayAwaker,
			this.#connectionStateChangeListener
		)
		await this.waitForSocketReady()
		this.#activityHappened()
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

	_sendClientJoined(clientData) {
		let data = {
			type: messageTypeClientJoined,
			value: clientData
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
		this._socket.send(message)
		this.#activityHappened()
	}

	#activityHappened() {
		this.#connectionSaver.saveConnectionInfo()
	}

	_handleMessage(data) {
		console.log(`message recieved: ${JSON.stringify(data)}`)
		this.#activityHappened()
		switch (data.type) {
			case messageTypeChangePage:
				this._recievedPageChange(data.value)
				break
			case messageTypeLoadFile:
				this._recievedLoadFile(data.value)
				break
			case messageTypeClientJoined:
				this._recievedClientJoined(data.value)
				break
			case messageTypeClientLeft:
				this._recievedClientLeft(data.value)
				break
			case messageTypeCounterUpdate:
				this._recievedCounterUpdate(data.value)
				break
			case messageTypeMulti:
				this._recievedMultiMessage(data.value)
				break
			case undefined:
				console.error(JSON.stringify(data))
				break
			default:
				console.error('Unexpected data type: ' + data.type)
		}
	}

	_recievedPageChange(pageNumber) {
		// if the user hasn't yet chosen a position param, ignore this event
		if (this._urlUtils.isPositionSet()) {
			let position = this._urlUtils.getPosition()
			let newPageNumber = pageNumber + position
			if (newPageNumber != this._lastPageNumberSet) {
				this._lastPageNumberSet = newPageNumber
				changePage(pageNumber, position)
			} else {
				console.log(`ignoring unnecessary page change request to ${pageNumber}+${position}`)
			}
		}
	}

	_recievedLoadFile({file, page}) {
		if (file != this._lastFileLoad) {
			this._lastFileLoad = file
			let position = this._urlUtils.getPosition()
			this._lastPageNumberSet = page + position
			this._urlUtils.updateFile(file)
			loadPdfFromParams(page, position)
		} else {
			console.log(`ignoring unnecessary file load request for ${file}`)
		}
	}

	_recievedClientJoined(message) {
		this._notifier.showMessage(message)
		this._onClientJoinedListener()
	}

	_recievedClientLeft(message) {
		this._notifier.showMessage(message)
	}

	_recievedCounterUpdate(count) {
		this.#clientsCounter = count
		this.#connectionStateChangeListener()
	}

	_recievedMultiMessage(messages) {
		messages.forEach(message => this._handleMessage(message))
	}

	onClientJoined(listener) {
		this._onClientJoinedListener = listener
	}

	onConnectionStateChange(listener) {
		this.#connectionStateChangeListener = listener
	}

	async waitForSocketReady() {
		//socket will be ready by the time we try to use it, because init waits for this, however subsequent attempts to reconnect could make it 'unready'
		await this._socket.waitForSocketReady()
	}

	async sendPageChange(pageNumber) {
		// if the user hasn't yet chosen a position param, ignore this event
		//attempt to prevent infinite loop from events firing for changes we previously recieved
		if (this._urlUtils.isPositionSet()) {
			if (pageNumber != this._lastPageNumberSet) {
				console.log(`page changed to ${pageNumber}, telling clients to switch to that page`)
				pageNumber -= this._urlUtils.getPosition()
				this._lastPageNumberSet = null
				await this.waitForSocketReady()
				this._sendChangePage(pageNumber)
			} else {
				console.log(`page changed to ${pageNumber}, _not_ telling clients to switch to that page`)
			}
		}
	}

	async sendLoadFile(file) {
		this._urlUtils.updateFile(file)
		//attempt to prevent infinite loop from events firing for changes we previously recieved
		if (file != this._lastFileLoad) {
			console.log(`file changed to ${file}, telling clients to load that URL`)
			this._lastPageNumberSet = null
			this._lastFileLoad = file
			await this.waitForSocketReady()
			this._sendLoadFile(file)
		} else {
			console.log(`file changed to ${file}, _not_ telling clients to load that URL`)
		}
	}

	async sendJoined(position) {
		await this.waitForSocketReady()
		const message = `Client joined at position ${position} on ${this._buildDeviceDescription()}`
		this._sendClientJoined(message)
	}

	_buildDeviceDescription() {
		const {browser, os, device} = this._uaParser.getResult()
		let deviceDescription = `${browser.name} for ${os.name}`
		let physicalDeviceInfo = `${device.vendor ?? ''} ${device.model ?? ''}`.trim()
		if (physicalDeviceInfo.length > 0) {
			deviceDescription = `${deviceDescription} on ${physicalDeviceInfo}`
		}
		return deviceDescription
	}

	async uploadFileAndShare(fileName, data) {
		await this.waitForSocketReady()
		let shareUrl = await this.#apiInterface.uploadFile(fileName, data)
		await this.sendLoadFile(shareUrl)
	}

	get connectionInfo() {
		return {
			clientsCounter: this.#clientsCounter,
			connected: this._socket.isConnected()
		}
	}
}
