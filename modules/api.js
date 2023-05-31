import { fastify as f } from "fastify"
import { port, host } from "../config.js"
import api from "../api/routes.js"

const fastify = f({ logger: false })

async function run(){
    fastify.addHook('onResponse', async (req, reply) => {
        const time = parseFloat(reply.getResponseTime().toFixed(2))
        log.send(`${req.ips[req.ips.length - 1]} -> ${req.url} (${reply.statusCode}) - ${time}ms`)
    })

    fastify.register(api, { prefix: '/api' })

    await fastify.listen({ port, host })
}

run()