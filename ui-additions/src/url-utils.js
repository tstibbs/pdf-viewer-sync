import {joinTokenParam, webSocketParam, positionParam, pageParam} from './constants.js'
import {getCurrentPage} from './pdf-integration.js'

export class UrlUtils {
	constructor() {
		this._urlParams = new URLSearchParams(location.search)
		this._joinToken = this._urlParams.get(joinTokenParam)
		this._position = this._urlParams.get(positionParam)
		this._webSocketBase = this._urlParams.get(webSocketParam)
		this._startingPage = this._urlParams.get(pageParam)
		this._viewerBase = new URL(location.pathname, location.href).href
		if (this._position != null) {
			this._position = parseInt(this._position)
		}
		if (this._startingPage != null) {
			this._startingPage = parseInt(this._startingPage)
		}
		if (this._position == null && this._joinToken == null) {
			//we are the first UI, so assume position 0 and initialise it as such to prevent "join pool?" popups
			this.updatePosition(0)
		}
	}

	updatePosition(position) {
		this._position = parseInt(position)
		this._urlParams.set(positionParam, this._position)
		const url = this._generateMyUrl()
		window.history.pushState({}, '', url)
	}

	updateJoinToken(joinToken) {
		this._joinToken = joinToken
		this._urlParams.set(joinTokenParam, this._joinToken)
		const url = this._generateMyUrl()
		window.history.pushState({}, '', url);
	}

	_generateMyUrl() {
		return this._generateUrl(this._urlParams)
	}

	generateClientUrl() {
		let clientParams = new URLSearchParams(this._urlParams.toString()) //clone url params so we can modify before passing on
		clientParams.delete(positionParam) // don't want to set a position for clients, let them choose it
		clientParams.set(pageParam, this._fetchCurrentPage())
		return this._generateUrl(clientParams)
	}

	_generateUrl(urlParams) {
		return `${this._viewerBase}?${urlParams}${location.hash}`
	}

	getJoinToken() {
		return this._joinToken
	}

	getWebSocketBase() {
		return this._webSocketBase
	}

	getPosition() {
		return this._position
	}

	getStartingPage() {
		return this._startingPage
	}

	_fetchCurrentPage() {
		let page = getCurrentPage()
		if (page == null || typeof page != 'number') {
			page = 0
		}
		return page
	}

	isPositionSet() {
		return typeof this._position == 'number'
	}
}
