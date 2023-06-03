export default async function (scores) {
    let artists = {}
    let beatmapsets = {}

    for(let i = 0; i < scores.length; i++){
        const set = scores[i]
        if(!set.creator) continue;
        if(!artists[set.creator]) artists[set.creator] = 0;
        artists[set.creator]++
        if(!beatmapsets[`${set.artist} - ${set.title}`]) beatmapsets[`${set.artist} - ${set.title}`] = 0;
        beatmapsets[`${set.artist} - ${set.title}`]++
    }

    let arts = Object.entries(artists)
    let bsets = Object.entries(beatmapsets)

    arts = arts.sort((a, b) => a[1] > b[1] ? -1 : 1)
    bsets = bsets.sort((a, b) => a[1] > b[1] ? -1 : 1)
    
    return { arts, bsets }
}