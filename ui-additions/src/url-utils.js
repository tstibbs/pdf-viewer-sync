import {joinTokenParam, endpointParam, positionParam, pageParam, fileParam} from './constants.js'
import {getCurrentPage} from './pdf-integration.js'

export class UrlUtils {
	#joiningExistingPool

	constructor() {
		this._urlParams = this._parseHash(location.hash)
		this._joinToken = this._urlParams.get(joinTokenParam)
		this._position = this._urlParams.get(positionParam)
		this._endpoint = this._urlParams.get(endpointParam)
		this._startingPage = this._urlParams.get(pageParam)
		this._file = this._urlParams.get(fileParam)
		this._viewerBase = new URL(location.pathname, location.href).href
		if (this._position != null) {
			this._position = parseInt(this._position)
		}
		if (this._startingPage != null) {
			this._startingPage = parseInt(this._startingPage)
		}
		if (this._joinToken != null) {
			this.#joiningExistingPool = true
		} else {
			this.#joiningExistingPool = false
		}
		if (this._position == null && !this.#joiningExistingPool) {
			//we are the first UI, so assume position 0 and initialise it as such to prevent "join pool?" popups
			this.updatePosition(0)
		}
	}

	_parseHash(hash) {
		if (hash.startsWith('#')) {
			hash = hash.substring(1)
		}
		return new URLSearchParams(hash)
	}

	updatePosition(position) {
		this._position = parseInt(position)
		this._urlParams.set(positionParam, this._position)
		this._updateMyUrl()
	}

	updateJoinToken(joinToken) {
		this._joinToken = joinToken
		this._urlParams.set(joinTokenParam, this._joinToken)
		this._updateMyUrl()
	}

	updateFile(file) {
		//note this update may be delayed, as it will only happen after the file has been uploaded, if that's required
		this._file = file
		this._urlParams.set(fileParam, this._file)
		this._updateMyUrl()
	}

	_updateMyUrl() {
		const url = this._generateUrl(this._urlParams)
		window.history.pushState({}, '', url)
	}

	generateClientUrl() {
		let clientParams = new URLSearchParams(this._urlParams.toString()) //clone url params so we can modify before passing on
		clientParams.delete(positionParam) // don't want to set a position for clients, let them choose it
		clientParams.set(pageParam, this._fetchCurrentPage())
		return this._generateUrl(clientParams)
	}

	_generateUrl(urlParams) {
		return `${this._viewerBase}${location.search}#${urlParams}`
	}

	getJoinToken() {
		return this._joinToken
	}

	getEndpoint() {
		return this._endpoint
	}

	getPosition() {
		return this._position
	}

	isJoiningExistingPool() {
		return this.#joiningExistingPool
	}

	getStartingPage() {
		return this._startingPage
	}

	getFile() {
		return this._file
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
