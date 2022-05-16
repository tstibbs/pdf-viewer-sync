import {randomUUID} from 'crypto'

import {WEB_SOCKET_URL} from '../utils.js'
import {apiGatewayJoinTokenParam} from '../../../ui-additions/src/constants.js'

export async function handler(event) {
	let joinToken = event.queryStringParameters?.[apiGatewayJoinTokenParam]
	console.log({ joinToken })
	if (joinToken == null) {
		//new connection from first client
		joinToken = randomUUID()
	} //else new connection from subsequent client trying to join, or an old client trying to rejoin a session that no longer exists - but that's ok, creating your own pool id should be fine

	let body = {
		poolId: joinToken, //send back to the client anyway, for consistency, even though in most cases this will have just been passed to us
		webSocketUrl: WEB_SOCKET_URL
	}
	console.log('returning:')
	console.log(body)
	return body
}
