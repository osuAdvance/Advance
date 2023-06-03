import track from "./track.js"
import profile from "./profile.js"
import api from "./api.js"
export default async function(fastify, opts) {
    fastify.get('/', api)
    fastify.get('/register/:username', track)
    fastify.get('/track/:username', track)
    fastify.get('/users/:username', profile)
}
