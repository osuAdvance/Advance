import database from "../helper/database.js"
import { getSafename } from "../helper/system.js"
import fetch from "node-fetch"
export default async function (req, reply) {
    const username = req.params?.username
    if(!username) return reply.send({ error: "Invalid username" })
    let user = (await database.awaitQuery(`SELECT * FROM users WHERE username_safe = "${getSafename(username)}"`))[0]
    if(!user) return reply.send({ error: "User not in the system" })
    const scores = await database.awaitQuery(`SELECT * FROM scores WHERE user = ${user.userid}`)
    let ids = [];

    const recent = scores.sort((a, b) => a.time > b.time ? -1 : 1)
    const best = scores.sort((a, b) => a.pp > b.pp ? -1 : 1)

    for(let i = 0; i < recent.length; i++){
        const score = recent[i]
        if(ids.indexOf(score.beatmap) == -1) ids.push(score.beatmap)
    }

    let request = await fetch(`https://catboy.best/api/v2/beatmaps?ids=${ids.join("&ids=")}`)
    const beatmaps = await request.json()

    ids = []

    for(let i = 0; i < beatmaps.length; i++){
        const beatmap = beatmaps[i]
        if(ids.indexOf(beatmap.beatmapset_id) == -1) ids.push(beatmap.beatmapset_id)
    }

    let artists = {}
    let beatmapsets = {}

    request = await fetch(`https://catboy.best/api/v2/beatmapsets?ids=${ids.join("&ids=")}`)
    const sets = await request.json()

    for(let i = 0; i < sets.length; i++){
        const set = sets[i]
        if(!artists[set.creator]) artists[set.creator] = 0;
        artists[set.creator]++
        if(!beatmapsets[`${set.artist} - ${set.title}`]) beatmapsets[`${set.artist} - ${set.title}`] = 0;
        beatmapsets[`${set.artist} - ${set.title}`]++
    }

    let arts = Object.entries(artists)
    let bsets = Object.entries(beatmapsets)

    arts = arts.sort((a, b) => a[1] > b[1] ? -1 : 1)
    bsets = bsets.sort((a, b) => a[1] > b[1] ? -1 : 1)

    let mods = [0, 0, 0, 0, 0, 0, 0];
    let names = ["NoMod", "Easy", "Hidden", "HardRock", "DoubleTime", "HardRock & Hidden", "Hidden & DoubleTime"]
    let favMods = []

    for(let i = 0; i < scores.length; i++) {
        const s = scores[i]
        if(s.mods == 0){
            mods[0]++
            continue;
        }

        if(s.mods & 2) mods[1]++;
        if(s.mods & 8) mods[2]++;
        if(s.mods & 16) mods[3]++;
        if(s.mods & 64) mods[4]++;
        //? Special Combos

        if(s.mods & 72){ //Hidden, DoubleTime
            mods[2]--
            mods[4]--
            mods[6]++
        } else if(s.mods & 24){ //Hidden, HardRock
            mods[2]--
            mods[3]--
            mods[5]++
        }

    }

    const indexesOf = (arr, item) => arr.reduce((acc, v, i) => (v === item && acc.push(i), acc), []);
    const most = Math.max(...mods);

    const mostMods = indexesOf(mods, most)
    for(let i = 0; i < mostMods.length; i++) {
        favMods.push(names[mostMods[i]])
    }

    const fav = favMods.join("\n")

    user.favourite = {
        mod: fav,
        artists: arts,
        songs: bsets
    }

    user.scores = {
        best,
        recent
    }

    return user
}