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
			let newFile = new URLSearchParams(new URL(newURL).hash).get(fileParam)
			let oldFile = new URLSearchParams(new URL(oldURL).hash).get(fileParam)
			if (oldFile != newFile) {
				loadPdfFromParams()
			}
		})

		//listed for the new pdf being loaded - this is seperate to the above to make sure that the pdf is valid/accessible first
		// the doc may not be rendered on the first client yet, but doesn't hurt to get the others working on loading it regardless
		PDFViewerApplication.eventBus.on('documentloaded', () => {
			const file = PDFViewerApplication.url
			//this is the default file that gets loaded on startup, so ignore
			if (file != 'compressed.tracemonkey-pldi-09.pdf') {
				if (_isValidUrl(file)) {
					comms.sendLoadFile(file)
				} else {
					console.log(`file changed to ${file}, not a valid URL so uploading file ready to share`)
					uploadFileAndShare(file, comms)
				}
			}
		})

		let timeoutCalls = []

		//now register a listener for when the page changes
		PDFViewerApplication.eventBus.on('pagechanging', event => {
			//if we've hit another event and there are timeouts still to run, then we must have triggered within 10 ms of the last one, so cancel the last ones and set up a new one. This might in turn get cancelled...
			if (timeoutCalls.length > 0) {
				timeoutCalls.forEach(timeoutId => clearTimeout(timeoutId)) //may have already fired, but that's ok, attempt to clear it and then forget it anyway
				timeoutCalls = []
			}
			let timeoutId = setTimeout(() => {
				//ignore any events that occur within
				const {pageNumber} = event
				comms.sendPageChange(pageNumber)
			}, 10)
			timeoutCalls.push(timeoutId)
		})
	})
}

function uploadFileAndShare(fileName, comms) {
	//don't wait for the data to be available, so that we don't block the rendering of the PDF
	PDFViewerApplication.pdfViewer.pdfDocument.getData().then(data => {
		comms.uploadFileAndShare(fileName, data)
	}, 1)
}

export function changePage(pageNumber, position) {
	PDFViewerApplication.eventBus.dispatch('pagenumberchanged', {
		value: pageNumber + position
	})
}

export function getCurrentPage() {
	return PDFViewerApplication.page
}

export function loadPdfFromParams(page = null, position = null) {
	let file = new URLSearchParams(location.hash).get(fileParam)
	if (file != null && file.length > 0) {
		//wait until the file is loaded before attempting to do anything with it
		if (page != null) {
			PDFViewerApplication.eventBus.on(
				'pagesloaded',
				() => {
					changePage(page, position)
				},
				{
					once: true
				}
			)
		}
		if (PDFViewerApplication.pdfViewer.isInPresentationMode) {
			PDFViewerApplication.eventBus.on(
				'pagerendered',
				() => {
					//for some reason when changing files while in presentation mode, the rendering gets screwed, this is an attempt to get it back
					PDFViewerApplication.pdfViewer.spreadMode = 2 //pretty much any other value
					//delay the change back to give it chance to be re-rendered
					setTimeout(() => {
						PDFViewerApplication.pdfViewer.scrollMode = SCROLL_MODE_PAGE
						PDFViewerApplication.pdfViewer.spreadMode = SPREAD_MODE_NONE
						PDFViewerApplication.pdfViewer.currentScaleValue = 'page-fit'
					}, 0)
				},
				{
					once: true
				}
			)
		}
		PDFViewerApplication.open(file)
	}
}
