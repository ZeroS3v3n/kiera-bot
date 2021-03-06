import { Bot } from '@/index'

export function stats(Bot: Bot, socket: SocketIO.Server) {
  // Emit stats periodically
  setInterval(() => {
    heartBeat(Bot, socket)
  }, 2000)
}

export function heartBeat(Bot: Bot, socket: SocketIO.Server) {
  socket.emit('heartbeat', { stats: Bot.BotMonitor.LiveStatistics.BotStatistics })
}
