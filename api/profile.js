import database from "../helper/database.js"
import { getSafename } from "../helper/system.js"
import favMod from "../worker/favmod.js"
import favStats from "../worker/favstats.js"

export default async function (req, reply) {
    const username = req.params?.username
    if(!username) return reply.send({ error: "Invalid username" })
    let user = (await database.awaitQuery(`SELECT * FROM users WHERE username_safe = "${getSafename(username)}"`))[0]
    if(!user) return reply.send({ error: "User not in the system" })
    let scores = await database.awaitQuery(`SELECT * FROM scores s JOIN beatmaps b ON s.beatmap = b.beatmapid WHERE s.user = ${user.userid} AND s.time >= 1672527600`)

    if(scores.length < 1) return reply.send(user)

    const recent = scores.sort((a, b) => a.time > b.time ? -1 : 1)
    const best = scores.sort((a, b) => a.pp > b.pp ? -1 : 1)

    const [ { arts, bsets }, fav ] = await Promise.all([
        favStats(recent),
        favMod(scores)
    ])

    user.favourite = {
        mod: fav,
        artists: arts,
        songs: bsets
    }

    user.scores = {
        best,
        recent
    }

    return user
}