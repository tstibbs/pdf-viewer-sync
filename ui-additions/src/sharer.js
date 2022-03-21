import qrcode from 'qrcode'

export class Sharer {
	constructor(comms, urlUtils) {
		this._comms = comms
		this._urlUtils = urlUtils
	}

	async showShareInfo(canvas) {
		const shareUrl = this._urlUtils.generateUrl()
		await qrcode.toCanvas(canvas, shareUrl)
		return shareUrl
	}
}
