import './additions.css'
import {changePage} from './pdf-integration.js'

export class Components {
	constructor(urlUtils, sharer, comms) {
		this._urlUtils = urlUtils
		this._sharer = sharer
		this._comms = comms
	}

	build() {
		if (this._urlUtils.getPosition() == null) {
			this._addJoinPanel()
		}
		this._addSharePanel()
		this._addShareButton()
		this._listenForClicks()
		this._comms.onClientJoined(() => {
			this._hideSharePanel()
		})
	}

	_addJoinPanel() { //add panel that shows if you're joining a pool
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

	_addSharePanel() { //add share panel (hidden initially)
		this._sharePanel = document.createElement('div')
		this._sharePanel.id = 'sync-share-panel'
		this._sharePanel.classList.add('sync-base-panel')
		this._sharePanel.style = "display: none"
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

	_addShareButton() { //add button to open share panel
		this._openButton = document.createElement('button')
		this._openButton.innerHTML = `<span>Share and Sync</span>`
		this._openButton.title = "Share and Sync"
		this._openButton.classList.add('toolbarButton')
		this._openButton.classList.add('shareAndSync')
		let presentationButton = document.getElementById('presentationMode')
		presentationButton.parentElement.insertBefore(this._openButton, presentationButton)
	}

	_listenForClicks() {
		this._sharePanel.addEventListener('click', event => {
			if (event.target === this._sharePanel || event.target === this._wrapper) { //i.e. ignore clicks from child elements
				this._hideSharePanel()
			}
		})
		this._shareCloseButton.addEventListener('click', () => {
			this._hideSharePanel()
		})
		this._openButton.addEventListener('click', () => {
			this._showSharePanel()
		})
	}

	_hideJoinPanel() {
		this._joinPanel.style = "display: none"
	}

	async _showSharePanel() {
		let shareUrl = await this._sharer.showShareInfo(this._canvas)
		this._link.href = shareUrl
		this._link.text = shareUrl
		this._sharePanel.style = ""
	}

	_hideSharePanel() {
		this._sharePanel.style = "display: none"
	}
}
