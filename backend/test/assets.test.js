import {validateCdkAssets} from '@tstibbs/cloud-core-utils'
import {STACK_NAME} from '../lib/deploy-envs.js'

test('Assets are built as expected', async () => {
	//7 assets:
	//connectHandler
	//disconnectHandler
	//messageHandler
	//pingHandler
	//getJoinInfo-handler
	//getItemUrls-handler
	//CustomS3AutoDeleteObjects
	await validateCdkAssets(STACK_NAME, 7)
})
