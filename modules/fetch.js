import database from "../helper/database.js"
import { GET } from "../helper/auth.js"
import { getSafename, getTime, sleep } from "../helper/system.js";
import { includeFailed } from "../config.js";
import { convertToNumber } from "../helper/mods.js";
export async function getUser(id, discord){
    const user = await GET("https://osu.ppy.sh/api/v2/me", id) //:)

    if(user.authentication == "basic"){
        //Revoked token
        await database.awaitQuery(`UPDATE users SET available = 0 WHERE userid = ${id}`)
        return 0;
    }
    const currentTime = getTime()

    //Namechanges and stuff

    const check = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ?`, [ user.id ]))[0]
    if(!check){
        await database.awaitQuery(`
        INSERT INTO users (userid, username, username_safe, country, added, restricted, discord)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            user.id, user.username, getSafename(user.username), user.country_code, currentTime, +user.is_restricted, discord
        ])
    } else {
        if(check.username != user.username || check.country != user.country_code || check.restricted != +user.is_restricted){
            database.awaitQuery(`UPDATE users SET username = ?, username_safe = ?, country = ?, restricted = ? WHERE userid = ?`, [
                user.username,
                user.username.toLowerCase().replaceAll(" ", "_"),
                user.country_code,
                +user.is_restricted,
                id
            ])
        }
    }

    if(user.is_restricted) return 1;

    const modes = await getStats(user.id, user.statistics_rulesets)

    for(var i = 0; i < modes.length; i++) {
        getScores(user.id, modes[i])
    }
    return 1;
}

async function getStats(id, stats){
    const currentTime = getTime()
    const result = []
    const modes = ["osu", "taiko", "fruits", "mania"]

    for(const m in modes){
        const mode = modes[m]
        if(!stats) continue;
        const stat = stats[mode]
        if(!stat) continue;

        const rank = (await database.awaitQuery(`SELECT * FROM stats
        WHERE user = ${id} AND mode = ${m} AND time > ${currentTime - (60 * 60 * 24)} `))[0]

        if(!rank){
            database.awaitQuery(`INSERT INTO stats 
            (user, global, country, pp, accuracy, playcount, playtime, score, hits, level, progress, mode, time) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                id, stat.global_rank || stat.global_rank_exp, stat.country_rank, Math.floor(stat.pp || stat.pp_exp),
                stat.hit_accuracy, stat.play_count, stat.play_time, stat.ranked_score,
                stat.total_hits, stat.level.current, stat.level.progress,
                m, currentTime
            ])
            result.push(mode)
            continue;
        }

        if(!stat.is_ranked) continue;
        if(rank.playcount == stat.play_count) continue;

        await database.awaitQuery(`UPDATE stats
        SET global = ?, country = ?, pp = ?, accuracy = ?, playcount = ?, playtime = ?, score = ?, hits = ?, level = ?, progress = ?
        WHERE user = ${id} AND mode = ${m} AND time = ${rank.time}`, [
            stat.global_rank, stat.country_rank, Math.floor(stat.pp),
            stat.hit_accuracy, stat.play_count, stat.play_time, stat.ranked_score,
            stat.total_hits, stat.level.current, stat.level.progress
        ])

        result.push(mode)
    }

    return result
}

async function getScores(id, mode){
    const currentTime = getTime()
    const scoreCache = []
    const [ bestScores, recentScores ] = await Promise.all([
        GET(`https://osu.ppy.sh/api/v2/users/${id}/scores/best?mode=${mode}&include_fails=${+includeFailed}&limit=100`, id),
        GET(`https://osu.ppy.sh/api/v2/users/${id}/scores/recent?mode=${mode}&include_fails=${+includeFailed}&limit=100`, id)
    ])
    
    if(bestScores.error == "Too Many Attempts." || recentScores.error == "Too Many Attempts."){
        await sleep(60000)
        return resolve(await getScores(id, mode))
    }
    let allScores = []
    try {
        allScores = [...bestScores, ...recentScores]
    } catch {
        console.error(typeof(bestScores), typeof(recentScores))
        console.error(bestScores?.error, recentScores?.error)
        console.error(bestScores, recentScores)
    }

    if(allScores.length < 1) return;
    const databaseCache = await database.awaitQuery(`SELECT scoreid, pp, time FROM scores WHERE user = ${id} AND mode = ${allScores[0].mode_int}`)
    const values = []
    
    for(let i = 0; i < allScores.length; i++) {
        const score = allScores[i]
        if(scoreCache.indexOf(score.id) != -1) continue;
        scoreCache.push(score.id)
    
        const scoreTime = getTime(score.created_at)
    
        const check = databaseCache.filter(s => s.scoreid == score.id || (s.user == id && s.pp == score.pp && s.time == scoreTime))?.[0]
    
        if(check){
            if(check.pp == score.pp || score.pp == null) continue;
            database.awaitQuery(`UPDATE scores SET pp = ${score.pp} WHERE user = ${id} AND scoreid = ${score.id} AND time = ${scoreTime}`)
            continue;
        }

        values.push(
            score.user_id, score.beatmap.id, score.id, score.score, score.accuracy * 100, score.max_combo,
            score.statistics.count_50, score.statistics.count_100, score.statistics.count_300,
            score.statistics.count_miss, score.statistics.count_katu, score.statistics.count_geki,
            +score.perfect, convertToNumber(score.mods) || 0, scoreTime,
            score.rank, +score.passed, score.pp || 0, score.mode_int, 0, currentTime
        )
    
        const beatmap = (await database.awaitQuery(`SELECT * FROM beatmaps WHERE beatmapid = ${score.beatmap.id}`))[0]
    
        if(!beatmap){
            await database.awaitQuery(`INSERT INTO beatmaps (beatmapid, beatmapsetid, title, artist, creator, creatorid, version, length, ranked, added, last_update)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                score.beatmap.id,
                score.beatmapset.id,
                score.beatmapset.title,
                score.beatmapset.artist,
                score.beatmapset.creator,
                score.beatmapset.user_id,
                score.beatmap.version,
                score.beatmap.hit_length,
                score.beatmap.ranked,
                currentTime,
                currentTime
            ])
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
        }
    }

    if(values.length < 1) return;
        
    await database.awaitQuery(`INSERT INTO scores 
    (user, beatmap, scoreid, score, accuracy, maxcombo, count50, count100, count300, countmiss, countkatu, countgeki, 
    fc, mods, time, \`rank\`, passed, pp, mode, calculated, added)
    VALUES ${"(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),".repeat(values.length / 21).slice(0, -1)}`, values)
}