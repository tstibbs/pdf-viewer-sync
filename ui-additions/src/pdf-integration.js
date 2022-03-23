export function listenForChanges(comms) {
	if (PDFViewerApplication.initializedPromise != undefined) {
		_waitForPromise(comms)
	} else {
		//wait for the viewer to start loading
		document.addEventListener('webviewerloaded', () => {
			_waitForPromise(comms)
		})
	}
}

function _isValidUrl(url) {
	try {
		new URL(url)
		return true
	} catch (e) {
		return false
	}
}

function _waitForPromise(comms) {
	//wait for the viewer to finish loading
	PDFViewerApplication.initializedPromise.then(() => {
		//pdf viewer initialised, so now check params to see if we should be loading a file
		//note when the viewer first loads there seems to be a race condition here where sometimes the default file load takes over and the file specified in the hash never actually gets loaded
		loadPdfFromParams()

		//listen for the hash being changed by another page with a target attribute, to see if we should be loading a new file
		window.addEventListener('hashchange', event => {
			const {newURL, oldURL} = event
			let newFile = new URLSearchParams((new URL(newURL)).hash).get('file')
			let oldFile = new URLSearchParams((new URL(oldURL)).hash).get('file')
			if (oldFile != newFile) {
				loadPdfFromParams()
			}
		})

		//listed for the new pdf being loaded - this is seperate to the above to make sure that the pdf is valid/accessible first
		PDFViewerApplication.eventBus.on('pagesloaded', () => {
			const file = PDFViewerApplication.url
			if (_isValidUrl(file)) {
				console.log(`file changed to ${file}`)
				comms.sendLoadFile(file)
			} else {
				console.log(`file changed to ${file} - not sending change to clients as not valid URL`)
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

export function loadPdfFromParams(page = null, position = null) {
	let file = new URLSearchParams(location.hash).get('file')
	if (file != null && file.length > 0) {
		if (page != null) {
			//if page is specified, wait until the file has been loaded before attempting to change page
			PDFViewerApplication.eventBus.on('pagesloaded', () => {
				changePage(page, position)
			}, {
				once: true
			})
		}
		PDFViewerApplication.open(file)
	}
}
