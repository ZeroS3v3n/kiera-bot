import * as Validation from '@/api/validations'
import * as errors from 'restify-errors'
import { validate } from '@/api/utils/validate'
import { WebRouted } from '@/api/web-router'
import { TrackedAvailableObject } from '@/objects/available-objects'
import { ObjectID } from 'bson'

export namespace Server {
  export async function settings(routed: WebRouted) {
    const v = await validate(Validation.Server.getSettings(), routed.req.body)

    // this.DEBUG_WEBAPI('req params', v.o)

    if (v.valid) {
      var serverSettings = await routed.Bot.DB.getMultiple<TrackedAvailableObject>('server-settings', {
        serverID: v.o.serverID
      })

      return routed.res.send(serverSettings)
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }

  export async function updateSettings(routed: WebRouted) {
    const v = await validate(Validation.Server.updateSetting(), routed.req.body)

    // console.log('req params', v)

    if (v.valid) {
      var updateCount = await routed.Bot.DB.update<TrackedAvailableObject>(
        'server-settings',
        v.o._id ? { _id: new ObjectID(v.o._id) } : { serverID: v.o.serverID },
        {
          $set: {
            key: 'server.channel.notification.block',
            type: 'string',
            state: v.o.state,
            value: v.o.value
          }
        },
        { atomic: true, upsert: true }
      )

      if (updateCount > 0) return routed.res.send({ status: 'updated', success: true })
      return routed.res.send({ status: 'failed', success: false })
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }
}
