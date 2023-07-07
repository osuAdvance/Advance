export default async function (scores) {
    let artists = {}
    let sets = {}

    for(let i = 0; i < scores.length; i++){
        const set = scores[i]
        if(!set.creator) continue;
        if(!artists[set.creatorid]) artists[set.creatorid] = {
            id: set.creatorid,
            name: set.creator,
            count: 0
        }
        artists[set.creatorid].count++

        if(!sets[set.beatmapsetid]) sets[set.beatmapsetid] = {
            id: set.beatmapsetid,
            name: `${set.artist} - ${set.title}`,
            count: 0
        }

        sets[set.beatmapsetid].count++
    }

    let arts = Object.values(artists)
    let bsets = Object.values(sets)

    arts = arts.sort((a, b) => a.count > b.count ? -1 : 1)
    bsets = bsets.sort((a, b) => a.count > b.count ? -1 : 1)
    
    return { arts, bsets }
}