export function buildUi() {
	var div = document.createElement('div')
	div.id = 'sync-share-panel'
	div.style = '    position: absolute; top: 0; right: 0; z-index: 99999; background: lightgrey;'
	div.innerHTML = `
	<canvas id="sync-share-canvas"></canvas>
	<div id="sync-share-link"></div>
	`
	document.body.appendChild(div)
}
