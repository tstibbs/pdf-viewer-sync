import {aws} from '../utils.js'
import {getPoolId, getConnectionIdsInPool, deleteConnection} from '../persistance.js'
import {buildClientsCounterMessageFromEvent} from './client-count.js'
import {messageTypeClientJoined, messageTypeMulti} from '../../../ui-additions/src/constants.js'

export async function sendMessage(event, message, sendToSender = false) {
	const {connectionId} = event.requestContext

	let poolId = await getPoolId(connectionId)
	let connectionIds = await getConnectionIdsInPool(poolId)
	if (!connectionIds.includes(connectionId)) {
		console.error(`${connectionIds.join(',')} !includes ${connectionId}`)
		throw new Error('Own connection id not included in list to send to - this indicates a problem.')
	}

	if (!sendToSender) {
		//remove our connection id because for example no point telling the originator to change page when it literally just changed to this number
		connectionIds = connectionIds.filter(id => id != connectionId)
	}

	await sendMessageToConnections(event, connectionIds, message)
}

export async function sendMessageToPoolId(event, poolId, message) {
	let connectionIds = await getConnectionIdsInPool(poolId)
	await sendMessageToConnections(event, connectionIds, message)
}

async function sendMessageToConnections(event, connectionIds, message) {
	const apigwManagementApi = new aws.ApiGatewayManagementApi({
		endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
	})

	if (Array.isArray(message)) {
		message = {
			type: messageTypeMulti,
			value: message
		}
	}

	console.log(`Sending ${JSON.stringify(message)} to ${connectionIds.join(',')}`)
	const postCalls = connectionIds.map(async connectionId => {
		try {
			await apigwManagementApi.postToConnection({ConnectionId: connectionId, Data: JSON.stringify(message)}).promise()
		} catch (e) {
			if (e.statusCode === 410) {
				console.log(`Found stale connection, deleting ${connectionId}`)
				await deleteConnection(connectionId)
			} else {
				throw e
			}
		}
	})

	await Promise.all(postCalls)
}

export async function handler(event) {
	try {
		const message = JSON.parse(event.body).data
		await sendMessage(event, message)
		const isJoinNotification = message.type == messageTypeClientJoined
		console.log({isJoinNotification})
		if (isJoinNotification) {
			let countsMessage = await buildClientsCounterMessageFromEvent(event, false)
			await sendMessage(event, countsMessage, true)
		}
	} catch (e) {
		console.error(e)
		return {statusCode: 500, body: e.stack}
	}
	return {statusCode: 200, body: 'Data sent.'}
}
