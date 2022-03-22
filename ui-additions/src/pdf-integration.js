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
		//pdf viewer initialised, so now check params to see if we should be loading a file
		_loadPdfFromParams()
		//listen for the hash being changed by another page with a target attribute, to see if we should be loading a new file
		window.addEventListener('hashchange', event => {
			const {newURL, oldURL} = event
			let newFile = new URLSearchParams((new URL(newURL)).hash).get('file')
			let oldFile = new URLSearchParams((new URL(oldURL)).hash).get('file')
			if (oldFile != newFile) {
				_loadPdfFromParams()
			}
		})

		//now register a listener for when the page changes
		PDFViewerApplication.eventBus.on('pagechanging', event => {
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

export function getCurrentFile() {
	return PDFViewerApplication.url
}

function _loadPdfFromParams() {
	let file = new URLSearchParams(location.hash).get('file')
	if (file != null && file.length > 0) {
		PDFViewerApplication.open(file)
	}
}
