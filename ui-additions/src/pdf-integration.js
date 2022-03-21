export function listenForPageChanges(comms) {
	if (PDFViewerApplication.initializedPromise != undefined) {
		_waitForPromise(comms)
	} else {
		//wait for the viewer to start loading
		document.addEventListener('webviewerloaded', () => {
			_waitForPromise(comms)
		})
	}
}

function _waitForPromise(comms) {
	//wait for the viewer to finish loading
	PDFViewerApplication.initializedPromise.then(() => {
		//now register a listener for when the page changes
		PDFViewerApplication.eventBus.on('pagechanging', (event) => {
			const {pageNumber} = event
			console.log(`page changed to ${pageNumber}`)
			comms.sendPageChange(pageNumber)
		})
	})
}

export function changePage(pageNumber, position) {
	PDFViewerApplication.eventBus.dispatch("pagenumberchanged", {
		value: pageNumber + position
	})
}

export function getCurrentPage() {
	return PDFViewerApplication.page
}
