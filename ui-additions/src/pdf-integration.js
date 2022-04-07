import {fileParam} from './constants.js'

const SCROLL_MODE_PAGE = 3 // copied from https://github.com/mozilla/pdf.js/blob/3635a9a3338feb0049be4f1521d5a5afd173a832/web/ui_utils.js#L67 but I can't work out how to bring this in properly via webpack
const SPREAD_MODE_NONE = 0 // copied from https://github.com/mozilla/pdf.js/blob/3635a9a3338feb0049be4f1521d5a5afd173a832/web/ui_utils.js#L72

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
			let newFile = new URLSearchParams((new URL(newURL)).hash).get(fileParam)
			let oldFile = new URLSearchParams((new URL(oldURL)).hash).get(fileParam)
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
	let file = new URLSearchParams(location.hash).get(fileParam)
	if (file != null && file.length > 0) {
		//wait until the file is loaded before attempting to do anything with it
		PDFViewerApplication.eventBus.on('pagesloaded', () => {
			if (PDFViewerApplication.pdfViewer.isInPresentationMode) {
				//for some reason when changing files while in presentation mode, the rendering gets screwed, this is an attempt to get it back
				PDFViewerApplication.pdfViewer.scrollMode = SCROLL_MODE_PAGE
				PDFViewerApplication.pdfViewer.spreadMode = SPREAD_MODE_NONE
				PDFViewerApplication.pdfViewer.currentScaleValue = "page-fit"
			}
			if (page != null) {
				changePage(page, position)
			}
		}, {
			once: true
		})
		PDFViewerApplication.open(file)
	}
}
