import {StayAwake} from './awake.js'
import {Components} from './components.js'
import {listenForChanges} from './pdf-integration.js'
import {Comms} from './comms.js'
import {Sharer} from './sharer.js'
import {UrlUtils} from './url-utils.js'
import {ConnectionSaver} from './connection-saver.js'

//show the presentation mode button as a normal button, not hidden in the secondary menu
const presentationMode = document.getElementById('presentationMode')
presentationMode.classList.remove('secondaryToolbarButton')
presentationMode.classList.add('toolbarButton')
document.getElementById('openFile').before(presentationMode)

class UiAdditions {
	#endpoint

	constructor() {
		this._urlUtils = new UrlUtils()
		this.#endpoint = this._urlUtils.getEndpoint()
	}

	async init() {
		const stayAwaker = new StayAwake()
		await stayAwaker.init()
		if (this.#endpoint != null && this.#endpoint.length > 0) {
			const sharer = new Sharer(this._urlUtils)
			const connectionSaver = new ConnectionSaver(this._urlUtils)
			console.log(connectionSaver.fetchConnectionInfo())
			const comms = new Comms(stayAwaker, this._urlUtils, connectionSaver)
			const components = new Components(this._urlUtils, sharer, comms, connectionSaver)
			try {
				await comms.init()
				components.build()
				listenForChanges(comms)
			} catch (e) {
				console.error('Not enabling share feature, failed to establish websocket connectivity.')
				console.error(e)
			}
		} else {
			console.log(
				"Not enabling share feature, empty endpoint url provided - set the 'endpoint' URL param to the full URL of the api gateway endpoint."
			)
		}
	}
}

new UiAdditions().init() //async but no need to wait
