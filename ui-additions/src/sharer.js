import qrcode from 'qrcode'

export class Sharer {
	constructor(urlUtils) {
		this._urlUtils = urlUtils
	}

	async showShareInfo(canvas) {
		const shareUrl = this._urlUtils.generateClientUrl()
		await qrcode.toCanvas(canvas, shareUrl)
		return shareUrl
	}
}
