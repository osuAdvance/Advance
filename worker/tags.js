export default async function({ scores, passed, arts, rank, bsets, best, playtime, stats }){
    const tags = [];

    (() => {
        if(rank.peak == 1) return tags.push({ name: "Champion", type: 1 })
        if(rank.peak <= 100) return tags.push({ name: "Challenger", type: 1 })
        if(rank.peak <= 1000) return tags.push({ name: "Contester", type: 1 })
        if(rank.current <= 100000) return tags.push({ name: "Casual", type: 2 })
        if(rank.current >= 1000000) return tags.push({ name: "Bad", type: 3 })
    })();

    if(passed.length / scores.length <= 0.4) tags.push({ name: "Retry & Quit", type: 3 })
    if(passed.length / scores.length >= 0.7) tags.push({ name: "Play & Pray", type: 1 })

    let grades = {
        XH: 0,
        X: 0,
        SH: 0,
        S: 0,
        A: 0,
        B: 0,
        C: 0,
        D: 0
    }

    let ranks = {
        "ranked": 0,
        "unranked": 0
    }

    const ppValues = passed.map(s => s.pp)
    const accValues = passed.map(s => s.accuracy)
    const accSum = accValues.reduce((a, b) => a + b, 0)
    const pp = ppValues.reduce((a, b) => a + b, 0)
    const accuracy = accSum / passed.length;

    (() => {
        if(accuracy == 100) return tags.push({ name: "God Accuarcy", type: 1 })
        if(accuracy >= 99) return tags.push({ name: "Good Accuracy", type: 1 })
        if(accuracy <= 90) return tags.push({ name: "Accuracy issue", type: 3 })
    })();

    if(rank.current > (rank.peak + rank.peak * 0.4)) tags.push({ name: "Washed", type: 3 })
    if(rank.current < (rank.peak * 0.5)) tags.push({ name: "Uprising", type: 1 })
    if(playtime > 500 * 60 * 60) tags.push({ name: "No Life", type: 3 })
    if(playtime / (60 * 60) / stats.length > 3) tags.push({ name: "No bitches", type: 3 })

    let avgTime = 0;

    for(let i = 0; i < passed.length; i++){
        ranks[passed[i].ranked == 1 || passed[i].ranked == 2 ? "ranked" : "unranked"]++
        grades[passed[i].rank]++
        if(i < 10){
            avgTime += best[i].length
        }
    }

    if(avgTime / 10 < 120) tags.push({ name: "Dirty Farmer", type : 3 })

    const Grades = Object.entries(grades)
    const bestGrades = Grades.sort((a, b) => a[1] > b[1] ? -1 : 1);

    (() => {
        if(bestGrades[0][1] / passed.length >= 0.7) return tags.push({ name: `Nothing but ${bestGrades[0][0]}`, type: 1 })
        if(bestGrades[0][1] / passed.length >= 0.3) return tags.push({ name: `${bestGrades[0][0]} Expert`, type: 1 })
    })();

    (() => {
        for(let i = 0; i < arts.length; i++){
            if(arts[i].count / passed.length >= 0.25) return tags.push({ name: `${arts[i].name} Onetrick`, type: 2 })
            if(arts[i].count / passed.length >= 0.05) return tags.push({ name: `${arts[i].name} Enjoyer`, type: 2 })
        }
    })()

    tags.sort((a, b) => a.type - b.type)

    return {
        tags,
        accuracy,
        grades,
        ranks,
        pp
    }
}