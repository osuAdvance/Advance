import { fastify as f } from "fastify"
import { getUsername } from "./fetch.js";

export default async function(){
    const fastify = f();

    fastify.get('/:username/create', async (req, reply) => {
        try {
            await getUsername(req.params.username)
            return reply.send({ message: "Added to the system" })
        } catch (e) {
            return reply.send({ error: e })
        }
    })
    
    fastify.listen({ port: 2451 })
}