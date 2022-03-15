import {buildUi} from './components.js'
import {PdfIntegration} from './pdf-integration.js'
import {Comms} from './comms.js'
import {Sharer} from './sharer.js'

buildUi()
const comms = new Comms()
const integration = new PdfIntegration(comms)
integration.listenForPageChanges()
const sharer = new Sharer(comms)
