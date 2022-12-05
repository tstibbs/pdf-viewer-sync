import {aws} from '../utils.js'
import {getPoolId, getConnectionIdsInPool, deleteConnection} from '../persistance.js'

export async function sendMessage(event, message) {
	const {connectionId} = event.requestContext

	const apigwManagementApi = new aws.ApiGatewayManagementApi({
		endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
	})

	let poolId = await getPoolId(connectionId)
	let connectionIds = await getConnectionIdsInPool(poolId)
	if (!connectionIds.includes(connectionId)) {
		console.error(`${connectionIds.join(',')} !includes ${connectionId}`)
		throw new Error('Own connection id not included in list to send to - this indicates a problem.')
	}
	//remove our connection id, no point telling the originator to change page when it literally just changed to this number
	connectionIds = connectionIds.filter(id => id != connectionId)

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
	} catch (e) {
		console.error(e)
		return {statusCode: 500, body: e.stack}
	}
	return {statusCode: 200, body: 'Data sent.'}
}
