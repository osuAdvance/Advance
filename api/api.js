import database from "../helper/database.js";

export default async function(req, reply){
    const year = new Date().getFullYear()
    const [ users, stats, scores ] = await Promise.all([
        database.awaitQuery(`SELECT COUNT(0) count FROM users`),
        database.awaitQuery(`SELECT COUNT(0) count FROM stats_${year}`),
        database.awaitQuery(`SELECT COUNT(0) count FROM scores_${year}`),
    ])

    return reply.send({
        message: `Advance v3 by Nanoo`,
        database : {
            users: users[0].count,
            stats: stats[0].count,
            scores: scores[0].count
        }
    })
}