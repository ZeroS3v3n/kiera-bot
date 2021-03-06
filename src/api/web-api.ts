import * as restify from 'restify'
import * as Debug from 'debug'
import * as fs from 'fs'
import * as path from 'path'
import * as corsMiddleware from 'restify-cors-middleware'
import * as SocketIO from 'socket.io'
import * as SocketStats from '@/api/socket/stats'
import { Bot } from '@/index'
import { WebRouter, WebRoute } from '@/api/web-router'
import { webRouteLoader } from '@/api/router/route-loader'

export class WebAPI {
  // As of 6.0.0 as a reverse proxy is in use and HTTPS managed there in prod
  // HTTPS Certs are optional for the bot's API
  protected readonly isHTTPSSet = fs.existsSync(path.join(process.env.API_HTTPS_KEY)) && fs.readFileSync(path.join(process.env.API_HTTPS_CRT))
  protected readonly https = this.isHTTPSSet
    ? {
        key: fs.readFileSync(path.join(process.env.API_HTTPS_KEY)),
        certificate: fs.readFileSync(path.join(process.env.API_HTTPS_CRT))
      }
    : null
  protected readonly port: number = Number(process.env.API_PORT || 8234)
  protected readonly prefix: string = '/api'
  protected Bot: Bot
  protected server: restify.Server
  protected socket: SocketIO.Server
  protected router: WebRouter
  protected DEBUG_WEBAPI = Debug('WebAPI')
  public configuredRoutes: Array<WebRoute> = []

  constructor(bot: Bot) {
    this.Bot = bot

    // Start Node Web server
    this.server = restify.createServer(this.isHTTPSSet ? this.https : {})
    // API config
    this.server.use(restify.plugins.bodyParser({ mapParams: true }))

    // Cors
    const cors = corsMiddleware({
      preflightMaxAge: 5, //Optional
      origins: ['*'],
      allowHeaders: ['*'],
      exposeHeaders: ['API-Token-Expiry']
    })

    this.server.pre(cors.preflight)
    this.server.use(cors.actual)

    // Setup routes

    this.configuredRoutes = webRouteLoader()
    // this.configuredRoutes.forEach(r => console.log(`api route:: [${r.method}] ${r.path}`))
    this.router = new WebRouter(this.Bot, this.server, this.configuredRoutes)

    // Setup SocketIO
    this.socket = SocketIO.listen(this.server.server)
    this.socket.sockets.on('connection', (socket) => {
      this.DEBUG_WEBAPI('socket connection')
      // socket.emit('news', { hello: 'world' });
      // socket.on('my other event', (data) => {
      //   this.DEBUG_WEBAPI(data);
      // });
      SocketStats.heartBeat(this.Bot, this.socket)
    })

    // Emit Stats (Loop)
    SocketStats.stats(this.Bot, this.socket)
  }

  public start() {
    return new Promise<boolean>((r) => {
      this.server.listen(this.port, () => {
        this.DEBUG_WEBAPI(`${this.server.name} listening at ${this.server.url}`)
        r(true)
      })
    }).catch((error) => {
      this.DEBUG_WEBAPI(`listening error.. unable to complete startup`)
      return false
    })
  }

  public close() {
    return new Promise<boolean>((r) => {
      this.server.close(() => {
        this.DEBUG_WEBAPI(`stopping WebAPI...`)
        r(true)
      })
    }).catch((error) => {
      this.DEBUG_WEBAPI(`error stopping the WebAPI`)
      return false
    })
  }
}
