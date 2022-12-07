import {getPoolId, getConnectionIdsInPool} from '../persistance.js'
import {messageTypeCounterUpdate} from '../../../ui-additions/src/constants.js'

//now update other clients to update their counter
export async function buildClientsCounterMessageFromEvent(event) {
	const {connectionId} = event.requestContext
	let poolId = await getPoolId(connectionId)
	return await buildClientsCounterMessageFromPoolId(poolId)
}

export async function buildClientsCounterMessageFromPoolId(poolId) {
	let connectionIds = await getConnectionIdsInPool(poolId)
	let count = connectionIds.length
	let message = {
		type: messageTypeCounterUpdate,
		value: count
	}
	return message
}
