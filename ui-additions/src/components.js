import './additions.css'

export class Components {
	constructor(sharer) {
		this._sharer = sharer
	}

	build() {
		this._addSharePanel()
		this._addShareButton()
		this._listenForClicks()
	}

	_addSharePanel() { //add share panel (hidden initially)
		this._panel = document.createElement('div')
		this._panel.id = 'sync-share-panel'
		this._panel.style = "display: none"
		this._panel.innerHTML = `
		<div class="wrapper">
			<div class="inner">
				<canvas id="sync-share-canvas"></canvas>
				<div id="sync-share-link"><a href="" target="_blank"></a></div>
				<button type="button" id="sync-share-close">close</button>
			<div>
		</div>
		`
		document.body.appendChild(this._panel)
		this._closeButton = document.getElementById('sync-share-close')
		this._link = document.querySelector('#sync-share-link > a')
		this._canvas = document.getElementById('sync-share-canvas')
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
		this._closeButton.addEventListener('click', () => {
			this._hideSharePanel()
		})
		this._openButton.addEventListener('click', () => {
			this._showSharePanel()
		})
	}

	async _showSharePanel() {
		let shareUrl = await this._sharer.showShareInfo(this._canvas)
		this._link.href = shareUrl
		this._link.text = shareUrl
		this._panel.style = ""
	}

	_hideSharePanel() {
		this._panel.style = "display: none"
	}
}
