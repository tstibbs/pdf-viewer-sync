import {deleteConnection} from '../persistance.js'

export async function handler(event) {
	try {
		await deleteConnection(event.requestContext.connectionId)
	} catch (err) {
		console.error(e)
		return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) }
	}

	return { statusCode: 200, body: 'Disconnected.' }
}
