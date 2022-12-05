import {deleteConnection} from '../persistance.js'
import {updateClientsCounter} from './client-count.js'

export async function handler(event) {
	updateCounterError = null
	try {
		//first update other clients about the disconnection (because we need the info still in dydb to do the update)
		try {
			await updateClientsCounter(event, true)
		} catch (err) {
			console.error(err)
			updateCounterError = {statusCode: 500, body: 'Failed to update other clients: ' + JSON.stringify(err)}
		}
		//now remove the connection
		await deleteConnection(event.requestContext.connectionId)
		//if delete was successful then return the error info from the update clients counter call (if delete unsuccessful then we won't get this far)
		if (updateCounterError) {
			return updateCounterError
		}
	} catch (err) {
		console.error(e)
		return {statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err)}
	}

	return {statusCode: 200, body: 'Disconnected.'}
}
