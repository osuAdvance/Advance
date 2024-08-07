import database from "../../helper/database.js"
import { getSafename } from "../../helper/system.js"

export default async function(req, reply){
    const username = req.params?.username
    if(!username) return reply.send({ error: "Invalid arguments" })
    const limit = req.query?.limit || 10
    const offset = req.query?.offset || 0
    const mode = req.query?.mode || 0
    const user = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ? OR username_safe = ? OR discord = ?`, [
        username,
        getSafename(username),
        username
    ]))[0]
    let currentYear = new Date().getFullYear()
    let year = (req.query?.year >> 0) || currentYear
    if (year < 2023 || year > currentYear) year = currentYear
    if(!user) return reply.send({ error: "User not found" })
    const scores = await database.awaitQuery(`
        SELECT global, country, time FROM stats_${year}
        WHERE user = ${user.userid} AND mode = ${mode}
        ORDER BY time DESC
        LIMIT ${limit} OFFSET ${offset}
    `)
    return scores
}