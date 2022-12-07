import {getPoolId, deleteConnection} from '../persistance.js'
import {buildClientsCounterMessageFromPoolId} from './client-count.js'
import {sendMessageToPoolId} from './message.js'
import {messageTypeClientLeft} from '../../../ui-additions/src/constants.js'

export async function handler(event) {
	const {connectionId} = event.requestContext
	try {
		//get pool id before removing our connection (because we need the info still in dydb)
		let poolId = await getPoolId(connectionId)
		//now remove the connection
		await deleteConnection(connectionId)
		//now send a toast saying that the client disconnected and send counter info
		let toastMessage = {
			type: messageTypeClientLeft,
			value: `Client disconnected.`
		}
		let counterMessage = await buildClientsCounterMessageFromPoolId(poolId)
		await sendMessageToPoolId(event, poolId, [toastMessage, counterMessage])
	} catch (e) {
		console.error(e)
		return {statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(e)}
	}

	return {statusCode: 200, body: 'Disconnected.'}
}
