import { clientID, redirect } from "../config.js"
import api from "./api.js"
import track from "./track.js"
import users from "./users/index.js"

export default async function(fastify, opts){
    fastify.get("/track", async (req, reply) => {
        return reply.send({
            data: `https://osu.ppy.sh/oauth/authorize?client_id=${clientID}&redirect_uri=${redirect}&response_type=code&scope=public+identify&state=${req.query?.discord || 0}`
        })
    })

    fastify.get("/", api)
    fastify.get("/verify", track)
    fastify.register(users, { prefix: '/users/:username' })
}