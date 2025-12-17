import {validateCdkAssets} from '@tstibbs/cloud-core-utils'
import {buildStack} from '../lib/deploy-utils.js'

test('Assets are built as expected', async () => {
	//8 assets:
	//connectHandler
	//disconnectHandler
	//messageHandler
	//pingHandler
	//getJoinInfo-handler
	//getItemUrls-handler
	//CustomS3AutoDeleteObjects
	//generate keys function
	await validateCdkAssets(buildStack, 8)
}, 15000)
