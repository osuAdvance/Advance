import database from "../helper/database.js";
import get from "../helper/fetch.js"
import { getTime } from "../helper/system.js";
import { convertToNumber } from "../helper/mods.js";

export default function getUser(id, first = false){ //2-5 Requests -> 100-250 (50)
    return new Promise(async (resolve, reject) => {
        if(typeof(id) != "object") return reject("ID need to be in an array.")

        id.sort((a, b) => a - b)

        let users;

        try {
            const request = await get(`https://osu.ppy.sh/api/v2/users?ids[]=${id.join("&ids[]=")}`)
            users = request.users
        } catch (e) {
            return reject(e)
        }

        if(users.length < 1 && id.length == 1) return reject("User not found")
        
        let pos = 0;

        for(let i = 0; i < id.length; i++){
            const user = users[pos]
            if(user.id != id[i]){
                database.awaitQuery(`UPDATE users SET available = 0 WHERE userid = ${id[i]}`)
                continue;
            }

            pos++

            getInfo(user, user.id)
            
            let modes = await getStats(user.id, user.statistics_rulesets)
            modes = first ? ["osu", "taiko", "fruits", "mania"] : modes

            for(let j = 0; j < modes.length; j++){
                getScores(user.id, modes[j])
            }
        }

        return resolve()
    })
}

function getInfo(user, id){
    return new Promise(async (resolve, reject) => {
        const check = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ?`, [ id ]))[0]

        if(!check) reject("User does not exist")

        if(check.username != user.username || check.country != user.country_code){
            database.awaitQuery(`UPDATE users SET username = ?, username_safe = ?, country = ?
            WHERE userid = ?`, [
                user.username,
                user.username.toLowerCase().replaceAll(" ", "_"),
                user.country_code,
                id
            ])
        }
        return resolve()
    })
}

function getStats(id, stats){
    return new Promise(async (resolve, reject) => {
        const currentTime = await getTime()
        const result = new Set()
        const modes = ["osu", "taiko", "fruits", "mania"]

        for(const m in modes){
            const mode = modes[m]
            if(!stats) continue;
            const stat = stats[mode]
            if(!stat?.is_ranked) continue;

            const rank = (await database.awaitQuery(`SELECT * FROM stats
            WHERE user = ${id} AND mode = ${m} AND time > ${currentTime - (60 * 60 * 24)} `))[0]

            if(!rank){
                database.awaitQuery(`INSERT INTO stats 
                (user, global, country, pp, accuracy, playcount, playtime, score, hits, level, progress, mode, time) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    id, stat.global_rank, stat.country_rank, Math.floor(stat.pp),
                    stat.hit_accuracy, stat.play_count, stat.play_time, stat.ranked_score,
                    stat.total_hits, stat.level.current, stat.level.progress,
                    m, currentTime
                ])
                result.add(mode)
                if(m == 3) resolve([...result])
                continue;
            }

            if(rank.playcount == stat.play_count) continue;

            database.awaitQuery(`UPDATE stats
            SET global = ?, country = ?, pp = ?, accuracy = ?, playcount = ?, playtime = ?, score = ?, hits = ?, level = ?, progress = ?
            WHERE user = ${id} AND mode = ${m} AND time = ${rank.time}`, [
                stat.global_rank, stat.country_rank, Math.floor(stat.pp),
                stat.hit_accuracy, stat.play_count, stat.play_time, stat.ranked_score,
                stat.total_hits, stat.level.current, stat.level.progress
            ])

            result.add(mode)
            if(m == 3) resolve([...result])
        }

        return resolve([...result])
    })
}

function getScores(id, mode){
    return new Promise(async (resolve, reject) => {
        const currentTime = await getTime()
        const scoreCache = []
        for(const type of ["best", "recent"]){
            const scores = await get(`https://osu.ppy.sh/api/v2/users/${id}/scores/${type}?mode=${mode}&include_fails=1&limit=100`)
            //! Remove when capacity reaches limit

            resolve() //? <-

            for(var i = 0; i < scores.length; i++){
                const score = scores[i]
                if(scoreCache.indexOf(score.id) != -1) continue;
                scoreCache.push(score.id)
                const check = (await database.awaitQuery(`SELECT * FROM scores
                WHERE user = ${id} AND scoreid = ${score.id} AND time = ${await getTime(score.created_at)}`))[0]
                //TODO: shorten this

                if(check && check?.pp == score.pp) continue; //TODO: add aditional checks if peppy decides to fuck pp again

                if(check && check?.pp != score.pp){
                    database.awaitQuery(`UPDATE scores SET pp = ${score.pp}
                    WHERE user = ${id} AND scoreid = ${score.id} AND time = ${await getTime(score.created_at)}`)
                    continue;
                }

                database.awaitQuery(`INSERT INTO scores 
                (user, beatmap, scoreid, score, accuracy, maxcombo, count50, count100, count300, countmiss, countkatu, countgeki, 
                fc, mods, time, rank, pp, mode, calculated, added)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    score.user_id, score.beatmap.id, score.id, score.score, score.accuracy * 100, score.max_combo,
                    score.statistics.count_50, score.statistics.count_100, score.statistics.count_300,
                    score.statistics.count_miss, score.statistics.count_katu, score.statistics.count_geki,
                    +score.perfect, await convertToNumber(score.mods) || 0, await getTime(score.created_at),
                    score.rank, score.pp || 0, score.mode_int, 0, currentTime
                ])

                const beatmap = (await database.awaitQuery(`SELECT * FROM beatmaps WHERE beatmapid = ${score.beatmap.id}`))[0]

                if(!beatmap){
                    await database.awaitQuery(`INSERT INTO beatmaps (beatmapid, beatmapsetid, title, artist, creator, creatorid, version, added, last_update)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        score.beatmap.id,
                        score.beatmapset.id,
                        score.beatmapset.title,
                        score.beatmapset.artist,
                        score.beatmapset.creator,
                        score.beatmapset.user_id,
                        score.beatmap.version,
                        currentTime,
                        currentTime
                    ])
                } else {
                    database.awaitQuery(`UPDATE beatmaps
                    SET playcount = playcount + 1, last_update = ?${score.rank != "F" ? ", passcount = passcount + 1" : ""} 
                    WHERE beatmapid = ${score.beatmap.id}`, [ currentTime ])
                }

                const set = (await database.awaitQuery(`SELECT * FROM beatmapsets WHERE setid = ${score.beatmapset.id}`))[0]

                if(!set){
                    await database.awaitQuery(`INSERT INTO beatmapsets (setid, title, artist, creator, creatorid, added, last_update)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                        score.beatmapset.id,
                        score.beatmapset.title,
                        score.beatmapset.artist,
                        score.beatmapset.creator,
                        score.beatmapset.user_id,
                        currentTime,
                        currentTime
                    ])
                } else {
                    database.awaitQuery(`UPDATE beatmapsets
                    SET playcount = playcount + 1, last_update = ?${score.rank != "F" ? ", passcount = passcount + 1" : ""} 
                    WHERE setid = ${score.beatmapset.id}`, [ currentTime ])
                }
            }
        }
        resolve()
    })
}

export function getUsername(username){
    return new Promise(async (resolve, reject) => {
        const user = await get(`https://osu.ppy.sh/api/v2/users/${username}/osu?key=username`)
        if(user.error === null) return reject("User not found") //? Idk about this one || resolve null

        const check = (await database.awaitQuery(`SELECT * FROM users WHERE username_safe = ?`, [
            user.username.toLowerCase().replaceAll(" ", "_")
        ]))[0]

        if(check) return reject("User is already in database")

        resolve(user)

        await database.awaitQuery(`INSERT INTO users
            (userid, username, username_safe, country, added)
            VALUES (?, ?, ?, ?, ?)`, [
                user.id, user.username, user.username.toLowerCase().replaceAll(" ", "_"),
                user.country_code, await getTime()
        ])

        return getUser([user.id], true);
    })
}