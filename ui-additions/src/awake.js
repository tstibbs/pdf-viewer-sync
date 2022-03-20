export async function stayAwake() {
	let wakeLock = null

	const requestWakeLock = async () => {
		try {
			wakeLock = await navigator.wakeLock.request('screen')
		} catch (err) {
			console.error(`${err.name}, ${err.message}`)
		}
	}

	//if page becomes invisible, the lock will be released - so re-acquire when the page becomes visible again
	document.addEventListener('visibilitychange', () => {
		if (wakeLock !== null && document.visibilityState === 'visible') {
			requestWakeLock()
		}
	})
	//acquire lock on load
	requestWakeLock()
}
