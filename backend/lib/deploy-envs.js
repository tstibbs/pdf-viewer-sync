import dotenv from 'dotenv'

dotenv.config()

let {STACK_NAME} = process.env
if (STACK_NAME == null || STACK_NAME.length == 0) {
	STACK_NAME = 'NO-STACK-NAME-PROVIDED' //makes testing slightly easier by not always insisting something is set
}
export {STACK_NAME}

export const COUNTRIES_DENY_LIST = splitOrEmpty('COUNTRIES_DENY_LIST')

function splitOrEmpty(envName) {
	if (envName in process.env) {
		let value = process.env[envName]
		if (value == null) {
			return null
		} else if (value.length == 0) {
			return []
		} else {
			return process.env[envName].split(',') //if empty string, will result in empty array, which is probably what we want
		}
	} else {
		return null //because if the env isn't set, we want it to break in order to flag that it isn't set, so the operator can go and set it
	}
}
