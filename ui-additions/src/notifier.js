import 'toastr/build/toastr.css'
import toastr from 'toastr'

export class Notifier {
	constructor() {
		toastr.options = {
			newestOnTop: true,
			positionClass: 'toast-bottom-right'
		}
	}

	showMessage(message) {
		toastr.success(message)
	}
}
