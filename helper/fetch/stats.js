import database from "../database.js"
import { getTime } from "../system.js"
export default function (id, stats) {
    return new Promise(async (resolve) => {
        const currentTime = getTime()
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