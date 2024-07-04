import database from "../../helper/database.js"
import { getSafename } from "../../helper/system.js"
import favMod from "../../worker/favmod.js"
import favStats from "../../worker/favstats.js"
import genTags from "../../worker/tags.js"
import cache from "../../constants/cache.js"

export default async function (req, reply) {
    const username = req.params?.username
    const mode = req.query?.mode || 0
    let year = (req.query?.year >> 0) || new Date().getFullYear()
    if (year < 2023 || year > 2024) year = 2024
    if(!username) return reply.code(400).send({ error: "Invalid username" })
    let user = (await database.awaitQuery(`SELECT * FROM users WHERE userid = ${username} username_safe = "${getSafename(username)}" or discord = "${username}"`))[0]
    if(!user) return reply.code(404).send({ error: "User not in the system" })
    if(cache[user.userid]?.[year]?.[mode]?.profile) return reply.send(cache[user.userid][year][mode].profile)
    if(!cache[user.userid]) cache[user.userid] = {}
    if(!cache[user.userid][year]) cache[user.userid][year] = {}
    if(!cache[user.userid][year][mode]) cache[user.userid][year][mode] = {}
    const scores = cache[user.userid][year][mode].scores || await database.awaitQuery(`SELECT * FROM scores_${year} s JOIN beatmaps b ON s.beatmap = b.beatmapid WHERE s.time > ${Math.floor(new Date(year, 0, 1, 0, 0, 0, 0).getTime() / 1000)} AND s.user = ${user.userid} AND mode = ${mode}`)
    const stats = cache[user.userid][year][mode].stats || await database.awaitQuery(`SELECT * FROM stats_${year} WHERE user = ${user.userid} AND mode = ${mode} ORDER BY time DESC`)
    cache[user.userid][year][mode].stats = stats;
    const peaks = new Array(...stats).sort((a, b) => a.global < b.global ? -1 : 1)

    user.rank = {
        start: stats[stats.length - 1]?.global || 0,
        current: stats[0]?.global || 0,
        peak: peaks[0]?.global || 0
    }
    user.level = stats[0]?.level || 0
    user.progress = stats[0]?.progress || 0

    delete user.discord

    if(scores.length < 1){
        cache[user.userid][year][mode].profile = user;
        return reply.send(user)
    }

    cache[user.userid][year][mode].scores = scores;

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

    recent.length = 5
    best.length = 5

    user.scores = {
        total: scores.length,
        passed: passed.length,
        recent,
        best
    }
    cache[user.userid][year][mode].profile = user;
    return reply.send(user)
}