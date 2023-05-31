import track from "./track.js"
import profile from "./profile.js"
export default async function(fastify, opts) {
    fastify.get('/', async (req, reply) => {
        return "Advance v3 - by Nanoo"
    })

    fastify.get('/register/:username', track)
    fastify.get('/track/:username', track)
    fastify.get('/users/:username', profile)
}
