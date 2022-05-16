import dotenv from 'dotenv'
import aws from 'aws-sdk'

dotenv.config()

aws.config.apiVersions = {
	dynamodb: '2012-08-10',
	apigatewaymanagementapi: '2018-11-29',
	s3: '2006-03-01'
}

export {aws}

export const {TABLE_NAME, WEB_SOCKET_URL, BUCKET} = process.env
