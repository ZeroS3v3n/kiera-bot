import * as Utils from '../utils/';
import { RouterRouted } from '../router/router';
import { TrackedUser } from '../objects/user';
import { TrackedDecision, TrackedDecisionOption } from '../objects/decision';
import { ObjectID } from 'bson';
import { decisionFromSaved, decisionRealtime } from '../embedded/decision-embed';

export namespace Decision {
  /**
   * Create a new decision in the DB
   * @export
   * @param {RouterRouted} routed
   */
  export async function newDecision(routed: RouterRouted) {
    const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
    const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)

    // Get the user from the db
    const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', userQuery))
    // Create a new question & 
    const nd = new TrackedDecision({ name: routed.v.o.name, owner: user._id })
    const updated = await routed.bot.DB.add('decision', nd)

    if (updated) {
      await routed.message.reply(
        `New question added (id: \`${nd._id}\`), enter your options using \`!decision ${nd._id} add "Decision result here" \``)
      return true

    }
    return false
  }

  export async function newDecisionEntry(routed: RouterRouted) {
    const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
    const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)

    // Get the user from the db
    const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', userQuery))

    // Get the saved decision from the db (Only the creator can edit)
    var decision = await routed.bot.DB.get<TrackedDecision>('decision', {
      _id: new ObjectID(routed.v.o.id),
      owner: user._id
    })

    if (decision) {
      var ud = new TrackedDecision(decision)
      ud.options.push(new TrackedDecisionOption({ text: routed.v.o.text }))
      await routed.bot.DB.update('decision', { _id: decision._id }, ud)
      await routed.message.reply(`Decision entry added \`${routed.v.o.text}\``)
      return true
    }
    return false
  }

  export async function runSavedDecision(routed: RouterRouted) {
    const decision = await routed.bot.DB.get('decision', { _id: new ObjectID(routed.v.o.id) })
    if (decision) {
      const sd = new TrackedDecision(decision)
      const random = Math.floor((Math.random() * sd.options.length));
      await routed.message.reply(decisionFromSaved(sd, sd.options[random]))
      return true
    }
    return false
  }

  export async function runRealtimeDecision(routed: RouterRouted) {
    const random = Math.floor((Math.random() * routed.v.o.args.length));
    await routed.message.reply(decisionRealtime(routed.v.o.question, routed.v.o.args[random]))
    return true
  }
}
