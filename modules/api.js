import { fastify as f } from "fastify"
import { port, host } from "../config.js"
import api from "../api/routes.js"
import Logger from "cutesy.js"
const log = new Logger().changeTag("API").purpleBlue()

const fastify = f({ logger: false, trustProxy: true })

async function run(){
    fastify.addHook('onResponse', async (req, reply) => {
        const time = parseFloat(reply.elapsedTime.toFixed(2))
        log.send(`${req.ips ? req.ips[req.ips.length - 1] : req.ip} -> ${req.url} (${reply.statusCode}) - ${time}ms`)
    })

    fastify.register(api, { prefix: '/api' })

    await fastify.listen({ port, host })
}

run()