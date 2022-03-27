export class StayAwake {
	async init() {
		let wakeLock = null

		const requestWakeLock = async () => {
			try {
				wakeLock = await navigator.wakeLock.request('screen')
				this._awake = true

				//listen for us losing the lock (for example user navigates to another tab)
				wakeLock.addEventListener('release', () => {
					this._awake = false
				})
			} catch (err) {
				console.error(`${err.name}, ${err.message}`)
				this._awake = false
			}
		}

		//if page becomes invisible, the lock will be released - so re-acquire when the page becomes visible again
		document.addEventListener('visibilitychange', () => {
			if (wakeLock !== null && document.visibilityState === 'visible') {
				requestWakeLock()
			}
		})
		//acquire lock on load
		await requestWakeLock()
	}

	isAwake() {
		return this._awake
	}
}
