import {sendMessage} from './message.js'
import {getPoolId, getConnectionIdsInPool} from '../persistance.js'
import {messageTypeCounterUpdate} from '../../../ui-additions/src/constants.js'

//now update other clients to update their counter
export async function updateClientsCounter(event, disconnect, sendToSender = false) {
	const {connectionId} = event.requestContext
	let poolId = await getPoolId(connectionId)
	let connectionIds = await getConnectionIdsInPool(poolId)
	let count = connectionIds.length
	if (disconnect) {
		count--
	}
	let message = {
		type: messageTypeCounterUpdate,
		value: count
	}
	await sendMessage(event, message, sendToSender)
}
