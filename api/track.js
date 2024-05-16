import auth from "../helper/auth.js"
import database from "../helper/database.js"
import { getSafename } from "../helper/system.js"
import { getUser } from "../modules/fetch.js"
import migrate from "./users/migrate.js"

export default async function(req, reply){
    if(req.query?.error) return reply.send({ error: "Access denied, please authorize our Application."})
    if(!req.query?.code || !req.query?.state) return reply.send({ error: "Invalid Payload"})
    const token = await auth.authenticate(req.query.code)
    if(token.error == "invalid_request") return reply.send({ error: "Access denied, please authorize our Application."}) 
    
    const user = await auth.request("https://osu.ppy.sh/api/v2/me", token.access_token)
    const time = Math.floor(new Date().getTime() / 1000)

    const check = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ${user.id}`))[0]
    if(check){
        await database.awaitQuery(`UPDATE users SET available = 1, discord = "${req.query.state}" WHERE userid = ${user.id}`)
        check.available = 1
        delete check.discord
        await getUser(user.id, req.query.state)
        return reply.send({ message: "Updated User", user: check })
    }

    if(!user.is_restricted) await getUser(user.id, req.query.state)
    reply.send({ message: "Added user to system", user: {
        userid: user.id,
        username: user.username,
        username_safe: getSafename(user.username),
        added: time
    }})

    await migrate({params : { username: user.id }}, {send: (() => {})})
    return reply;
}