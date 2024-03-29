import database from "../../helper/database.js"
import { getSafename } from "../../helper/system.js"
import favMod from "../../worker/favmod.js"
import favStats from "../../worker/favstats.js"
import genTags from "../../worker/tags.js"
import userCache from "../../constants/cache.js"

export default async function (req, reply) {
    const username = req.params?.username
    const mode = req.query?.mode || 0
    if(!username) return reply.send({ error: "Invalid username" })
    let user = (await database.awaitQuery(`SELECT * FROM users WHERE username_safe = "${getSafename(username)}" or discord = "${username}"`))[0]
    if(!user) return reply.send({ error: "User not in the system" })
    if(userCache[user.userid]?.[mode]) return userCache[user.userid][mode]
    let scores = userCache[user.userid]?.[mode]?.scores || await database.awaitQuery(`SELECT * FROM scores s JOIN beatmaps b ON s.beatmap = b.beatmapid WHERE s.user = ${user.userid} AND s.time >= 1672527600 AND mode = ${mode}`)
    let stats = userCache[user.userid]?.[mode]?.stats || await database.awaitQuery(`SELECT * FROM stats WHERE user = ${user.userid} AND time >= 1672527600 AND mode = ${mode} ORDER BY time DESC`)

    if(!userCache[user.userid]) userCache[user.userid] = {}
    if(!userCache[user.userid][mode]) userCache[user.userid][mode] = {}
    userCache[user.userid][mode].scores = scores
    userCache[user.userid][mode].stats = stats

    const peaks = new Array(...stats).sort((a, b) => a.global < b.global ? -1 : 1)

    user.rank = {
        start: stats[stats.length - 1]?.global || 0,
        current: stats[0]?.global || 0,
        peak: peaks[0]?.global || 0
    }
    user.level = stats[0]?.level || 0
    user.progress = stats[0]?.progress || 0

    delete user.discord

    if(scores.length < 1) return reply.send(user)

    const recent = new Array(...scores).sort((a, b) => a.time > b.time ? -1 : 1)
    const best = new Array(...scores).sort((a, b) => a.pp > b.pp ? -1 : 1)
    const passed = recent.filter(s => s.passed == 1)

    const [ { arts, bsets }, fav ] = await Promise.all([
        favStats(passed),
        favMod(passed)
    ])

    user.playtime = (stats[0]?.playtime || 0) - (stats[stats.length - 1]?.playtime || 0)
    user.score = (stats[0]?.score || 0) - (stats[stats.length - 1]?.score || 0)
    user.hits = (stats[0]?.hits || 0) - (stats[stats.length - 1]?.hits || 0)

    const tags = await genTags({ scores, passed, arts, rank: user.rank, bsets, best, playtime: user.playtime, stats })

    user.pp = {
        ranked: (stats[0]?.pp || 0) - (stats[stats.length - 1]?.pp || 0),
        total: tags.pp
    }
    user.accuracy = tags.accuracy
    user.grades = tags.grades
    user.ranks = tags.ranks
    user.tags = tags.tags

    user.favourite = {
        mod: fav,
        mapper: arts,
        songs: bsets
    }

    recent.length = 3
    best.length = 3

    user.scores = {
        total: scores.length,
        passed: passed.length,
        recent,
        best
    }

    userCache[user.userid][mode] = user

    return user
}