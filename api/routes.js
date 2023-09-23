import { clientID, redirect } from "../config.js"
import api from "./api.js"
import track from "./track.js"
import users from "./users/index.js"
import userList from "./users/list.js"

export default async function(fastify, opts){
    fastify.get("/track", async (req, reply) => {
        const url = `https://osu.ppy.sh/oauth/authorize?client_id=${clientID}&redirect_uri=${redirect}&response_type=code&scope=public+identify&state=${req.query?.discord || 0}`
        const data = req.query?.json == 1 ? { data: url } : url
        return reply[req.query?.json == 1 ? "send" : "redirect"](data)
    })

    fastify.get("/", api)
    fastify.get("/verify", track)
    fastify.get("/users", userList)
    fastify.register(users, { prefix: '/users/:username' })
}