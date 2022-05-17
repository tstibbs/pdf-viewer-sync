import UAParser from 'ua-parser-js'

import {Notifier} from './notifier.js'
import {
	apiGatewayJoinTokenParam,
	messageTypeChangePage,
	actionSendMessage,
	messageTypeLoadFile,
	messageTypeClientJoined
} from './constants.js'
import {changePage, loadPdfFromParams, getCurrentPage} from './pdf-integration.js'
import {ResilientWebSocket} from './websocket.js'
import {ApiInterface} from './api-interface.js'

export class Comms {
	#stayAwaker
	#apiInterface

	constructor(stayAwaker, urlUtils) {
		this.#stayAwaker = stayAwaker
		this._uaParser = new UAParser()
		this._notifier = new Notifier()
		this._urlUtils = urlUtils
		// initialise such that we don't publish a 'page change' event when we load the file and switch to the right page
		this._lastRecievedPageNumber = this._urlUtils.getStartingPage + this._urlUtils.getPosition()
		// initialise such that we don't publish a 'file change' event when we load the file
		this._lastRecievedFileLoad = this._urlUtils.getFile()
		this._joinToken = this._urlUtils.getJoinToken()
		const endpoint = this._urlUtils.getEndpoint()
		this.#apiInterface = new ApiInterface(this._joinToken, endpoint)
	}

	async init() {
		let joinInfo = await this.#apiInterface.fetchJoinInfo()
		this._joinToken = joinInfo.poolId
		const websocketUrl = `${joinInfo.webSocketUrl}?${apiGatewayJoinTokenParam}=${this._joinToken}`
		this._urlUtils.updateJoinToken(this._joinToken)
		this._socket = new ResilientWebSocket(websocketUrl, this._handleMessage.bind(this), this.#stayAwaker)
		await this.waitForSocketReady()
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
	}

	_handleMessage(data) {
		console.log(`message recieved: ${JSON.stringify(data)}`)
		switch (data.type) {
			case messageTypeChangePage:
				this._recievedPageChange(data.value)
				break;
			case messageTypeLoadFile:
				this._recievedLoadFile(data.value)
				break;
			case messageTypeClientJoined:
				this._recievedClientJoined(data.value)
				break;
			default:
				console.error('Unexpected data type: ' + data.type)
		}
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

	_recievedClientJoined(message) {
		this._notifier.showMessage(message)
		this._onClientJoinedListener()
	}

	onClientJoined(listener) {
		this._onClientJoinedListener = listener
	}

	async waitForSocketReady() {
		//socket will be ready by the time we try to use it, because init waits for this, however subsequent attempts to reconnect could make it 'unready'
		await this._socket.waitForSocketReady()
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
		this._urlUtils.updateFile(file)
		if (file != this._lastRecievedFileLoad) { //attempt to prevent infinite loop from events firing for changes we previously recieved
			this._lastRecievedPageNumber = null
			await this.waitForSocketReady()
			this._sendLoadFile(file)
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
}
