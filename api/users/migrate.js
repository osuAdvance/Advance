import database from "../../helper/database.js";
import { getSafename } from "../../helper/system.js";
export default async function(req, reply){
    const username = req.params?.username

    if(!username) return reply.send({ message: "Nothing to migrate" })

    const userCheck = await database.awaitQuery(`SELECT * FROM users WHERE username_safe = "${getSafename(username)}" OR discord = "${username}"`)
    if(!userCheck[0]) return reply.send({ message: "Nothing to migrate" })
    if(userCheck[0].added < 1685570400) return reply.send({ message: "You already have been migrated!" })
    const oldUser = await database.awaitQuery(`SELECT * FROM advance.users WHERE userid = ${userCheck[0].userid}`)
    if(!oldUser[0]) return reply.send({ message: "Nothing to migrate" })
    await database.awaitQuery(`UPDATE users SET added = ${oldUser[0].added} WHERE userid = ${userCheck[0].userid}`)
    const scores = await database.awaitQuery(`SELECT * FROM advance.scores WHERE user = ${userCheck[0].userid}`)
    if(scores.length < 1) return reply.send({ message: "Nothing to migrate" })
    const stats = await database.awaitQuery(`SELECT * FROM advance.stats WHERE user = ${userCheck[0].userid}`)
    
    for(let i = 0; i < scores.length; i++){
        const score = scores[i]
        
        const check = (await database.awaitQuery(
            `SELECT pp FROM scores WHERE user = ${score.user} AND scoreid = ${score.scoreid} AND time = ${score.time}`
        ))[0]

        if(check) continue;

        database.awaitQuery(`INSERT INTO scores 
        (user, beatmap, scoreid, score, accuracy, maxcombo, count50, count100, count300, countmiss, countkatu, countgeki, 
        fc, mods, time, \`rank\`, passed, pp, mode, calculated, added)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            score.user, score.beatmap, score.scoreid, score.score, score.accuracy, score.maxcombo,
            score.count50, score.count100, score.count300,
            score.countmiss, score.countkatu, score.countgeki,
            score.fc, score.mods, score.time,
            score.rank, score.rank == "F" ? 0 : 1, score.pp, score.mode, score.calculated, score.added
        ])

        const mapCheck = await database.awaitQuery(`SELECT beatmapsetid FROM beatmaps WHERE beatmapid = ${score.beatmap}`)
        const time = Math.floor(new Date().getTime() / 1000)

        if(mapCheck[0]){
            const setCheck = await database.awaitQuery(`SELECT * FROM beatmapsets WHERE setid = ${mapCheck[0].beatmapsetid}`)
            if(!setCheck[0]){
                await database.awaitQuery(`INSERT INTO beatmapsets (
                    setid, playcount, passcount, title, artist, creator, creatorid, last_update, added
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        mapCheck[0].beatmapsetid, 1, 1, mapCheck[0].title, mapCheck[0].artist, mapCheck[0].creator, mapCheck[0].creatorid, time, time
                    ])
            }
        }
        if(!mapCheck[0]){
            try {
                const request = await fetch(`https://catboy.best/api/v2/b/${score.beatmap}`)
                const map = await request.json()
        
                if(map.error) continue;
                const setRequest = await fetch(`https://catboy.best/api/v2/s/${map.beatmapset_id}`)
                const set = await setRequest.json()
                if(set.error) continue;
                await database.awaitQuery(`INSERT INTO beatmaps (
                    beatmapid, beatmapsetid, playcount, passcount,
                    title, artist, creator, creatorid, version, length, ranked, last_update, added
                    ) VALUES (
                        ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?
                    )`, [
                        map.id, map.beatmapset_id, 1, 1, set.title, set.artist, set.creator, set.user_id, map.version, map.hit_length, set.ranked, time, time
                    ]
                )
                const setCheck = await database.awaitQuery(`SELECT * FROM beatmapsets WHERE setid = ${map.beatmapset_id}`)
                if(!setCheck[0]){
                    await database.awaitQuery(`INSERT INTO beatmapsets (
                        setid, playcount, passcount, title, artist, creator, creatorid, last_update, added
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                            set.id, 1, 1, set.title, set.artist, set.creator, set.user_id, time, time
                        ])
                }
            } catch {

            }
        }
    }

    for(let i = 0; i < stats.length; i++){
        const stat = stats[i]

        const check = (await database.awaitQuery(
            `SELECT pp FROM stats WHERE user = ${stat.user} AND mode = ${stat.mode} AND time = ${stat.time}`
        ))[0]

        if(check) continue;

        database.awaitQuery(`INSERT INTO stats 
        (user, global, country, pp, accuracy, playcount, playtime, score, hits, level, progress, mode, time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            stat.user, stat.global, stat.country, stat.pp,
            stat.accuracy, stat.playcount || 0, stat.playtime, stat.score,
            stat.hits, stat.level, stat.progress,
            stat.mode, stat.time
        ])
    }

    return reply.send({ message: `Migrated ${scores.length} Scores and ${stats.length} Updates` })
}