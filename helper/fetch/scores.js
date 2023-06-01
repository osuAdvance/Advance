import { includeFailed } from "../../config.js";
import { convertToNumber } from "../mods.js";
import database from "../database.js"
import osu from "../auth.js"
import { getTime } from "../system.js";
export default function (id, mode){
    return new Promise(async (resolve) => {
        const scoreCache = []
        const [ bestScores, recentScores ] = await Promise.all([
            osu.GET(`https://osu.ppy.sh/api/v2/users/${id}/scores/best?mode=${mode}&include_fails=${+includeFailed}&limit=100`),
            osu.GET(`https://osu.ppy.sh/api/v2/users/${id}/scores/recent?mode=${mode}&include_fails=${+includeFailed}&limit=100`)
        ])
        let allScores = []
        try {
            allScores = [...bestScores, ...recentScores]
        } catch (e) {
            console.log(bestScores)
            console.log(recentScores)
            process.exit(1)
        }

        for(let i = 0; i < allScores.length; i++) {
            const score = allScores[i]
            if(scoreCache.indexOf(score.id) != -1) continue;
            scoreCache.push(score.id)
    
            const scoreTime = getTime(score.created_at)
    
            const check = (await database.awaitQuery(
                `SELECT pp FROM scores WHERE user = ${id} AND scoreid = ${score.id} AND time = ${scoreTime}`
            ))[0]

            if(check){
                if(check.pp == score.pp || score.pp == null) continue;
                database.awaitQuery(`UPDATE scores SET pp = ${score.pp} WHERE user = ${id} AND scoreid = ${score.id} AND time = ${scoreTime}`)
                continue;
            }

            database.awaitQuery(`INSERT INTO scores 
            (user, beatmap, scoreid, score, accuracy, maxcombo, count50, count100, count300, countmiss, countkatu, countgeki, 
            fc, mods, time, \`rank\`, pp, mode, calculated, added)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                score.user_id, score.beatmap.id, score.id, score.score, score.accuracy * 100, score.max_combo,
                score.statistics.count_50, score.statistics.count_100, score.statistics.count_300,
                score.statistics.count_miss, score.statistics.count_katu, score.statistics.count_geki,
                +score.perfect, convertToNumber(score.mods) || 0, scoreTime,
                score.rank, score.pp || 0, score.mode_int, 0, getTime()
            ])
        }
        resolve()
    })
}