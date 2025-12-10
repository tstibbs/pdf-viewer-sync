#!/usr/bin/env node

import {buildStack} from '../lib/deploy-utils.js'
import {STACK_NAME} from '../lib/deploy-envs.js'

await buildStack(STACK_NAME)
