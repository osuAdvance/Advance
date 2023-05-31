import database from "../helper/database.js"
import { getSafename } from "../helper/system.js"
export default async function (req, reply) {
    const username = req.params?.username
    if(!username) return reply.send({ error: "Invalid username" })
    let user = (await database.awaitQuery(`SELECT * FROM users WHERE username_safe = "${getSafename(username)}"`))[0]
    if(!user) return reply.send({ error: "User not in the system" })
    const [ recent, best ] = await Promise.all([
        database.awaitQuery(`SELECT * FROM scores WHERE user = ${user.userid} ORDER BY time DESC LIMIT 5`),
        database.awaitQuery(`SELECT * FROM scores WHERE user = ${user.userid} ORDER BY pp DESC LIMIT 5`)
    ])

    user.scores = {
        best,
        recent
    }

    return user
}