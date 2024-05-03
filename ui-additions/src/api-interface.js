import axios from 'axios'
import {
	requestsUrlPrefix,
	endpointGetJoinInfo,
	endpointGetItemUrls,
	endpointFileNameParam,
	endpointPrefixesParam,
	apiGatewayJoinTokenParam
} from './constants.js'

export class ApiInterface {
	#poolId
	#axios

	constructor(poolId, endpoint) {
		this.#poolId = poolId
		this.#axios = axios.create({
			baseURL: `${endpoint}/${requestsUrlPrefix}`
		})
	}

	async fetchJoinInfo() {
		let params = {}
		if (this.#poolId != null) {
			params = {
				params: {
					[apiGatewayJoinTokenParam]: this.#poolId
				}
			}
		}
		let {data: joinInfo} = await this.#axios.get(endpointGetJoinInfo, params)
		this.#poolId = joinInfo.poolId
		return joinInfo
	}

	async uploadFile(fileName, data) {
		let {data: urls} = await this.#axios.post(endpointGetItemUrls, {
			[endpointFileNameParam]: fileName,
			[endpointPrefixesParam]: [this.#poolId]
		})
		const {getUrl, putUrl} = urls
		await axios.put(putUrl, data, {
			headers: {
				'Content-Type': 'application/pdf'
			}
		})
		return getUrl
	}
}
