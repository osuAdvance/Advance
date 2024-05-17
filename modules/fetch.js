import database from "../helper/database.js"
import auth from "../helper/auth.js"
import { getSafename, getTime, sleep } from "../helper/system.js";
import { includeFailed, trackerWebhook } from "../config.js";
import { convertToNumber } from "../helper/mods.js";
import { WebhookClient, EmbedBuilder } from 'discord.js'
const webhookClient = new WebhookClient({ url: trackerWebhook })
import Logger from "cutesy.js"
const log = new Logger().addTimestamp("hh:mm:ss").changeTag("Fetch").purple()

export async function getUser(profiles, discord){
    const modes = ["osu", "taiko", "fruits", "mania"]
    const result = []
    const ids = profiles.map((u) => u.id)
    const users = await auth.request(`/users?ids[]=${ids.join("&ids[]=")}`)
    for(let i = 0; i < profiles.length; i++){
        const currentTime = getTime()
        const year = new Date().getFullYear()
        const { id, username } = profiles[i]
        log.purple().send(`${(i + 1)}/${profiles.length} Updating ${username}`)
        const user = users.users.find((u) => u.id == id)
        const check = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ?`, [ id ]))[0]
        const DiscordIDMessage = discord ? `<@${discord}>` : ""
        if(!user){
            const usersTracked = (await database.awaitQuery(`SELECT COUNT(*) count FROM users WHERE available = 1`))[0].count - 1
            await database.awaitQuery(`UPDATE users SET available = 0 WHERE userid = ${id}`)
            const embed = new EmbedBuilder().setTitle(`${check.username} (${id}) got restricted!`).setColor(0xD2042D).setThumbnail(`https://a.ppy.sh/${id}`).setTimestamp(Date.now()).setFooter({ text: `Users tracked: ${usersTracked}` })
            webhookClient.send({
                content: DiscordIDMessage,
                embeds: [embed],
            })
            log.red().send(`${check.username} (${id}) - No longer tracked - Users tracked: ${usersTracked} - Discord: ${discord}`)
            continue;
        }
        if(!check){
            await database.awaitQuery(`
            INSERT INTO users (userid, username, username_safe, country, added, restricted, discord)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                user.id, user.username, getSafename(user.username), user.country_code, currentTime, 0, discord
            ])
        } else {
            if(check.username != user.username || check.country != user.country_code){
                database.awaitQuery(`UPDATE users SET username = ?, username_safe = ?, country = ?, restricted = ? WHERE userid = ?`, [
                    user.username,
                    user.username.toLowerCase().replaceAll(" ", "_"),
                    user.country_code,
                    0,
                    id
                ])
            }
        }
        if(!user.statistics_rulesets) continue;
        for(const m in modes){
            const mode = modes[m]
            const stat = user.statistics_rulesets[mode]
            if(!stat) continue;
            const rank = (await database.awaitQuery(`SELECT * FROM stats_${year}
            WHERE user = ${id} AND mode = ${m} AND time > ${currentTime - (60 * 60 * 24)} `))[0]

            if(!rank){
                database.awaitQuery(`INSERT INTO stats_${year}
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

            process.send({ id, type: "profile" })
            process.send({ id, type: "stats" })
            process.send({ id, type: "card" })

            await database.awaitQuery(`UPDATE stats_${year}
            SET global = ?, country = ?, pp = ?, accuracy = ?, playcount = ?, playtime = ?, score = ?, hits = ?, level = ?, progress = ?
            WHERE user = ${id} AND mode = ${m} AND time = ${rank.time}`, [
                stat.global_rank, stat.country_rank, Math.floor(stat.pp),
                stat.hit_accuracy, stat.play_count, stat.play_time, stat.ranked_score,
                stat.total_hits, stat.level.current, stat.level.progress
            ])
            result.push(mode)
        }
        for(let j = 0; j < result.length; j++) {
            await getScores(id, result[j], year)
        }
    }
}

async function getScores(id, mode, year){
    const currentTime = getTime()
    const scoreCache = []
    const bestScores = await auth.request(`/users/${id}/scores/best?mode=${mode}&include_fails=${+includeFailed}&limit=100`)
    const recentScores = await auth.request(`/users/${id}/scores/recent?mode=${mode}&include_fails=${+includeFailed}&limit=100`)

    if(bestScores.error == "Too Many Attempts." || recentScores.error == "Too Many Attempts."){
        await sleep(60000)
        return await getScores(...arguments)
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
    const databaseCache = await database.awaitQuery(`SELECT scoreid, pp, time FROM scores_${year} WHERE user = ${id} AND mode = ${allScores[0].mode_int}`)
    const values = []
    
    for(let i = 0; i < allScores.length; i++) {
        const score = allScores[i]
        const scoreTime = getTime(score.created_at)
        if(scoreCache.indexOf(scoreTime) != -1) continue;
        scoreCache.push(scoreTime)
    
        const check = databaseCache.filter(s => s.time == scoreTime)?.[0]

        if(check){
            if((check.pp == score.pp) || (score.pp == null)) continue;
            await database.awaitQuery(`UPDATE scores_${year} SET pp = ${score.pp} WHERE user = ${id} AND scoreid = ${score.id} AND time = ${scoreTime}`)
            continue;
        }

        values.push(
            score.user_id, score.beatmap.id, score.id || null, score.score, score.accuracy * 100, score.max_combo,
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
        
    await database.awaitQuery(`INSERT INTO scores_${year}
    (user, beatmap, scoreid, score, accuracy, maxcombo, count50, count100, count300, countmiss, countkatu, countgeki, 
    fc, mods, time, \`rank\`, passed, pp, mode, calculated, added)
    VALUES ${"(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),".repeat(values.length / 21).slice(0, -1)}`, values)

    process.send({ id, type: "scores" })
}