export class PdfIntegration {
	constructor(comms) {
		this._comms = comms
	}

	listenForPageChanges() {
		if (PDFViewerApplication.initializedPromise != undefined) {
			this._waitForPromise()
		} else {
			//wait for the viewer to start loading
			document.addEventListener('webviewerloaded', () => {
				this._waitForPromise()
			})
		}
	}

	_waitForPromise() {
		//wait for the viewer to finish loading
		PDFViewerApplication.initializedPromise.then(() => {
			//now register a listener for when the page changes
			PDFViewerApplication.eventBus.on('pagechanging', (event) => {
				const {pageNumber} = event
				console.log(`page changed to ${pageNumber}`)
				this._comms.sendPageChange(pageNumber)
			})
		})
	}
}
