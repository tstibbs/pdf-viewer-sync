import {validateCdkAssets} from '@tstibbs/cloud-core-utils'
import {STACK_NAME} from '../lib/deploy-envs.js'

test('Assets are built as expected', async () => {
	await validateCdkAssets(STACK_NAME, 4)
})
