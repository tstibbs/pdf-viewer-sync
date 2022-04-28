import {aws} from '../utils'
import {getPoolId} from '../persistance.js'
import {messageTypePoolId} from '../../../ui-additions/src/constants.js'

export async function handler(event) {
	console.log(JSON.stringify(event, null, 2))
	const {connectionId} = event.requestContext

	const apigwManagementApi = new aws.ApiGatewayManagementApi({
		endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
	})

	const sendPoolId = async poolId => {
		let data = {
			type: messageTypePoolId,
			value: poolId
		}
		await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(data) }).promise()
	}

	try {
		let poolId = await getPoolId(connectionId)
		await sendPoolId(poolId)
	} catch (e) {
		console.error(e)
		return { statusCode: 500, body: e.stack }
	}
	
	return { statusCode: 200, body: 'Finished.' }
}
