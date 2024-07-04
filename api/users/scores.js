import { dataStart } from "../../config.js"
import database from "../../helper/database.js"
import { getSafename } from "../../helper/system.js"

export default async function(req, reply){
    const username = req.params?.username
    const type = req.params?.type
    if(!username || (type != "best" && type != "recent")) return reply.send({ error: "Invalid arguments" })
    const limit = req.query?.limit || 10
    const offset = req.query?.offset || 0
    const mode = req.query?.mode || 0
    let year = (req.query?.year >> 0) || new Date().getFullYear()
    if (year < 2023 || year > 2024) year = 2024
    const user = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ? OR username_safe = ? OR discord = ?`, [
        username,
        getSafename(username),
        username
    ]))[0]
    if(!user) return reply.send({ error: "User not found" })
    const scores = await database.awaitQuery(`
        SELECT * FROM scores_${year}
        WHERE user = ${user.userid} AND time > ${dataStart} AND mode = ${mode}
        ORDER BY ${type == "best" ? "pp DESC" : "time DESC"}
        LIMIT ${limit} OFFSET ${offset}
    `)
    return scores
}