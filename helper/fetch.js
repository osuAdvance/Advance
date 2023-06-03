import database from "./database.js";
import osu from "./auth.js"
import { getTime, getSafename } from "./system.js";
import getInfo from "./fetch/info.js"
import getScores from "./fetch/scores.js"
import getStats from "./fetch/stats.js"

export function getUser(id, first = false){ //2-5 Requests -> 100-250 (50)
    return new Promise(async (resolve) => {
        if(typeof(id) != "object") return resolve({ error: "ID need to be in an array." })

        id.sort((a, b) => a - b)

        let users;

        try {
            const request = await osu.GET(`https://osu.ppy.sh/api/v2/users?ids[]=${id.join("&ids[]=")}`)
            users = request.users
        } catch (e) {
            return resolve({ error: e })
        }

        if(users.length < 1 && id.length == 1) return resolve({ error: "User not found" })
        
        let pos = 0;

        for(let i = 0; i < id.length; i++){
            const user = users[pos]
            if(user?.id != id[i]){
                database.awaitQuery(`UPDATE users SET available = 0 WHERE userid = ${id[i]}`)
                continue;
            }

            pos++

            getInfo(user, user.id)
            
            let modes = await getStats(user.id, user.statistics_rulesets)
            modes = first ? ["osu", "taiko", "fruits", "mania"] : modes

            for(let j = 0; j < modes.length; j++){
                await getScores(user.id, modes[j])
            }
        }
        return resolve()
    })
}
export function getUsername(username){
    return new Promise(async (resolve) => {
        const user = await osu.GET(`https://osu.ppy.sh/api/v2/users/${username}/osu?key=username`)
        const safename = getSafename(user.username)
        if(user.error === null) return resolve({ error: "User not found" }) //? Idk about this one || resolve null

        const check = (await database.awaitQuery(`SELECT * FROM users WHERE username_safe = ?`, [
            safename
        ]))[0]

        if(check) return resolve({ error: "User is already in database"})

        await database.awaitQuery(`INSERT INTO users
            (userid, username, username_safe, country, added)
            VALUES (?, ?, ?, ?, ?)`, [
                user.id, user.username, safename,
                user.country_code, getTime()
        ])
        await getUser([user.id], true)
        return resolve({
            message: "User got added into the system, scores are now tracked every hour",
            user : {
                id: user.id,
                username: user.username,
                safename: safename,
                country: user.country_code,
                time: getTime()
            }
        });
    })
}