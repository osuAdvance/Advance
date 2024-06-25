import { fastify as f } from "fastify"
import { port, host } from "../config.js"
import api from "../api/routes.js"
import Logger from "cutesy.js"
import { fork } from "child_process"
import cache from "../constants/cache.js"
const log = new Logger().changeTag("API").purpleBlue()

const fastify = f({ logger: false, trustProxy: true })
fastify.addHook('onResponse', async (req, reply) => {
    const time = parseFloat(reply.elapsedTime.toFixed(2))
    log.send(`${req.ips ? req.ips[req.ips.length - 1] : req.ip} -> ${req.url} (${reply.statusCode}) - ${time}ms`)
})

fastify.register(api, { prefix: '/api' })
await fastify.listen({ port, host })
const fetch = fork("modules/cron.js")
fetch.on("message", ({ id, year, mode, type }) => delete cache[id]?.[year]?.[mode]?.[type])