import { dataStart } from "../../config.js"
import database from "../../helper/database.js"
import { getSafename } from "../../helper/system.js"

export default async function(req, reply){
    const username = req.params?.username
    if(!username) return reply.send({ error: "Invalid arguments" })
    const limit = req.query?.limit || 10
    const offset = req.query?.offset || 0
    const mode = req.query?.mode || 0
    const user = (await database.awaitQuery(`SELECT * FROM users WHERE userid = "?" username_safe = "?" or discord = "?"`, [
        username,
        getSafename(username),
        username
    ]))[0]
    let year = (req.query?.year >> 0) || new Date().getFullYear()
    if (year < 2023 || year > 2024) year = 2024
    if(!user) return reply.send({ error: "User not found" })
    const scores = await database.awaitQuery(`
        SELECT global, country, time FROM stats_${year}
        WHERE user = ${user.userid} AND time > ${dataStart} AND mode = ${mode}
        ORDER BY time DESC
        LIMIT ${limit} OFFSET ${offset}
    `)
    return scores
}