import cache from "../../constants/cache.js";
import { servicePort } from "../../config.js";
import database from "../../helper/database.js"
import { getSafename } from "../../helper/system.js";
export default async function(req, reply){
    const username = req.params?.username
    const mode = req.query?.mode || 0
    let year = parseInt(req.query?.year >> 0) || new Date().getFullYear()

    let user = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ? username_safe = ? or discord = ?`, [
        username,
        getSafename(username),
        username
    ]))[0]
    if(!user) return reply.code(404).send({ error: "User not in the system" })
    if(cache[user.userid]?.[year]?.[mode]?.card){
        reply.header("content-type", "image/png")
        return reply.send(cache[user.userid][year][mode].card)
    }
    const request = await fetch(`http://localhost:${servicePort}/api/users/${username}/card?mode=${mode}&year=${year}`)
    if(!request.ok){
        return reply.code(request.status).send(await request.json())
    }
    cache[user.userid][year][mode].card = Buffer.from(await (await request.blob()).arrayBuffer())
    reply.header("content-type", "image/png")
    return cache[user.userid][year][mode].card;
}