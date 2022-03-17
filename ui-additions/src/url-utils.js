import {joinTokenParam, webSocketParam} from './constants.js'

export class UrlUtils {
	constructor() {
		this._urlParams = new URLSearchParams(location.search)
		this._joinToken = this._urlParams.get(joinTokenParam)
		this._webSocketBase = this._urlParams.get(webSocketParam)
		this._viewerBase = new URL(location.pathname, location.href).href
	}

	updateJoinToken(joinToken) {
		this._joinToken = joinToken
		this._urlParams.set(joinTokenParam, this._joinToken)
		const url = this.generateUrl()
		window.history.pushState({}, '', url);
	}

	generateUrl() {
		return `${this._viewerBase}?${this._urlParams}`
	}

	getJoinToken() {
		return this._joinToken
	}

	getWebSocketBase() {
		return this._webSocketBase
	}
}
