import './additions.css'
import {changePage} from './pdf-integration.js'
import icon0 from './img/share-icon-0.svg'
import icon1 from './img/share-icon-1.svg'
import icon2 from './img/share-icon-2.svg'
import icon3 from './img/share-icon-3.svg'
import icon4 from './img/share-icon-4.svg'
import icon5 from './img/share-icon-5.svg'
import icon6 from './img/share-icon-6.svg'
const icons = [icon0, icon1, icon2, icon3, icon4, icon5, icon6]

export class Components {
	#sharePanelShown

	constructor(urlUtils, sharer, comms) {
		this._urlUtils = urlUtils
		this._sharer = sharer
		this._comms = comms
		this.#sharePanelShown = false
		this._comms.onConnectionStateChange(() => {
			this.#connectionStateChanged()
		})
		//don't display yet, but create so it can be re-configured by the connection listener
		this._openSharePanelButton = document.createElement('button')
		this._openSharePanelButton.innerHTML = `<span>Share and Sync</span>`
		this._openSharePanelButton.title = 'Share and Sync'
		this._openSharePanelButton.classList.add('toolbarButton')
		this._openSharePanelButton.classList.add('shareAndSync')
		this.#setShareIcon(0) //default to zero clients connected, just so there's something to show
	}

	build() {
		if (this._urlUtils.isJoiningExistingPool()) {
			this._addJoinPanel()
		}
		this._addSharePanel()
		this._addShareButton()
		this._listenForClicks()
		this._comms.onClientJoined(() => {
			this._hideSharePanel()
		})
	}

	_addJoinPanel() {
		//add panel that shows if you're joining a pool
		this._joinPanel = document.createElement('div')
		this._joinPanel.id = 'sync-join-panel'
		this._joinPanel.classList.add('sync-base-panel')
		this._joinPanel.innerHTML = `
		<div class="wrapper">
			<div class="inner">
				<label>Join sync pool with position: 
					<input type="number" name="position" min="-100" max="100" value="1">
				</label>
				<button type="button" id="sync-join-close">Ok</button>
			<div>
		</div>
		`
		document.body.appendChild(this._joinPanel)
		this._positionInput = document.querySelector('input[name="position"]')
		this._joinCloseButton = document.getElementById('sync-join-close')
		this._joinCloseButton.addEventListener('click', () => {
			let position = this._positionInput.value
			this._urlUtils.updatePosition(position)
			//trigger it to update now we have the correct position info
			changePage(this._urlUtils.getStartingPage(), this._urlUtils.getPosition())
			this._hideJoinPanel()
			this._comms.sendJoined(position)
		})
	}

	_addSharePanel() {
		//add share panel (hidden initially)
		this._sharePanel = document.createElement('div')
		this._sharePanel.id = 'sync-share-panel'
		this._sharePanel.classList.add('sync-base-panel')
		this._sharePanel.style = 'display: none'
		this._sharePanel.innerHTML = `
		<div class="wrapper" id="sync-share-wrapper">
			<div class="inner">
				<canvas id="sync-share-canvas"></canvas>
				<div id="sync-share-link"><a href="" target="_blank"></a></div>
				<button type="button" id="sync-share-close">close</button>
			<div>
		</div>
		`
		document.body.appendChild(this._sharePanel)
		this._shareCloseButton = document.getElementById('sync-share-close')
		this._link = document.querySelector('#sync-share-link > a')
		this._canvas = document.getElementById('sync-share-canvas')
		this._wrapper = document.querySelector('#sync-share-panel div.wrapper')
	}

	_addShareButton() {
		//add button to open share panel
		let presentationButton = document.getElementById('presentationMode')
		presentationButton.parentElement.insertBefore(this._openSharePanelButton, presentationButton)
	}

	_listenForClicks() {
		this._sharePanel.addEventListener('click', event => {
			if (event.target === this._sharePanel || event.target === this._wrapper) {
				//i.e. ignore clicks from child elements
				this._hideSharePanel()
			}
		})
		this._shareCloseButton.addEventListener('click', () => {
			this._hideSharePanel()
		})
		this._openSharePanelButton.addEventListener('click', () => {
			this._showSharePanel()
		})
	}

	_hideJoinPanel() {
		this._joinPanel.style = 'display: none'
	}

	async _showSharePanel() {
		this.#sharePanelShown = true
		this.#connectionStateChanged() //trigger UI update as if we've "just connected"
		let shareUrl = await this._sharer.showShareInfo(this._canvas)
		this._link.href = shareUrl
		this._link.text = shareUrl
		this._sharePanel.style = ''
	}

	_hideSharePanel() {
		this._sharePanel.style = 'display: none'
	}

	#connectionStateChanged() {
		const {connected, clientsCounter} = this._comms.connectionInfo
		console.log({connected})
		console.log({clientsCounter})
		//don't show connection info until we've attempted to share, or if we're joining a pool
		if (this.#sharePanelShown || this._urlUtils.isJoiningExistingPool()) {
			//update colour of icon first
			if (connected) {
				this._openSharePanelButton.classList.add('connected')
				this._openSharePanelButton.classList.remove('disconnected')
			} else {
				this._openSharePanelButton.classList.add('disconnected')
				this._openSharePanelButton.classList.remove('connected')
			}
			//now update the dots to indicate how many clients are connected
			this.#setShareIcon(clientsCounter)
		}
	}

	#setShareIcon(clientsCounter) {
		//we don't have icons for large client numbers, so cap at the max we do have
		if (clientsCounter > icons.length - 1) {
			clientsCounter = icons.length - 1
		}
		this._openSharePanelButton.style.setProperty('--share-icon-url', `url(${icons[clientsCounter]})`)
	}
}
