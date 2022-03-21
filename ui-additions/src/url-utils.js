import {joinTokenParam, webSocketParam} from './constants.js'

export class UrlUtils {
	constructor() {
		const urlParams = new URLSearchParams(location.search)
		this._joinToken = urlParams.get(joinTokenParam)
		this._webSocketBase = urlParams.get(webSocketParam)
		this._viewerBase = new URL(location.pathname, location.href).href
	}

	updateJoinToken(joinToken) {
		this._joinToken = joinToken
		const url = this.generateUrl()
		window.history.pushState({}, '', url);
	}

	generateUrl() {
		return `${this._viewerBase}?${webSocketParam}=${this._webSocketBase}&${joinTokenParam}=${this._joinToken}`
	}

	getJoinToken() {
		return this._joinToken
	}

	getWebSocketBase() {
		return this._webSocketBase
	}
}
