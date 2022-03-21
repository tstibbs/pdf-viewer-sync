import {stayAwake} from './awake.js'
import {Components} from './components.js'
import {listenForPageChanges} from './pdf-integration.js'
import {Comms} from './comms.js'
import {Sharer} from './sharer.js'
import {UrlUtils} from './url-utils.js'

class UiAdditions {
	constructor() {
		this._urlUtils = new UrlUtils()
		this._webSocketBase = this._urlUtils.getWebSocketBase()
	}

	async init() {
		await stayAwake()
		if (this._webSocketBase != null && this._webSocketBase.length > 0) {
			const sharer = new Sharer(this._urlUtils)
			const components = new Components(this._urlUtils, sharer)
			this._joinToken = this._urlUtils.getJoinToken()
			const comms = new Comms(this._urlUtils, components)
			try {
				await comms.waitForSocketReady()
				components.build()
				listenForPageChanges(comms)
			} catch (e) {
				console.error("Not enabling share feature, failed to establish websocket connectivity.")
				console.error(e)
			}
		} else {
			console.log("Not enabling share feature, empty websocket url provided - set the 'websocket' URL param to the full URL of the websocket.")
		}
	}
}

(new UiAdditions()).init()//async but no need to wait
