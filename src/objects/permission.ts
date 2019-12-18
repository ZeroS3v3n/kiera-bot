import { ObjectID } from 'bson'
import { GuildChannel } from 'discord.js'

export interface TextChannelExtended extends GuildChannel {
  permissions: Array<any>
}

export class CommandPermission {
  public readonly _id: ObjectID
  /**
   * Discord server ID
   * @memberof CommandPermission
   */
  public serverID: string
  /**
   * Discord channel ID
   * @type {string}
   * @memberof CommandPermission
   */
  public channelID: string
  public command: string
  /**
   * Defaults to true for: On
   * @type {boolean}
   * @memberof CommandPermission
   */
  public enabled: boolean = true
  public example?: string
  public category?: string

  constructor(init: Partial<CommandPermission>) {
    Object.assign(this, init)
  }

  public isAllowed() {
    return this.enabled
  }
}
