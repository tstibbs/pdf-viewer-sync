import qrcode from 'qrcode'

export class Sharer {
	constructor(comms) {
		this._comms = comms
		this._viewerUrl = new URL(location.pathname, location.href).href
		const panel = document.getElementById('sync-share-panel')
		panel.addEventListener('click', event => {
			this._showShareInfo()
		})
	}

	async _showShareInfo() {
		const joinToken = this._comms.getJoinToken()
		const shareUrl = `${this._viewerUrl}?joinToken=${joinToken}`
		const canvas = document.getElementById('sync-share-canvas')
		await qrcode.toCanvas(canvas, shareUrl)
		let link = document.createElement('a')
		link.href = shareUrl
		link.text = shareUrl
		document.getElementById('sync-share-link').appendChild(link)
	}
}
