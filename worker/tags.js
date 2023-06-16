export default async function({ scores, passed, arts, bsets }){
    const tags = []

    if(scores.length <= 100){
        tags.push("Newbie")
    }

    if(passed.length / scores.length <= 0.4) tags.push("Retry & Quit")
    if(passed.length / scores.length >= 0.7) tags.push("Play & Pray")

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
        if(accuracy == 100) return tags.push("God Accuarcy")
        if(accuracy >= 99) return tags.push("Good Accuracy")
        if(accuracy <= 90) return tags.push("Accuracy issue")
    })();


    for(let i = 0; i < passed.length; i++){
        ranks[passed[i].ranked == 1 || passed[i].ranked == 2 ? "ranked" : "unranked"]++
        grades[passed[i].rank]++
    }

    const Grades = Object.entries(grades)
    const bestGrades = Grades.sort((a, b) => a[1] > b[1] ? -1 : 1);

    (() => {
        if(bestGrades[0][1] / passed.length >= 0.7) return tags.push(`Nothing but ${bestGrades[0][0]}`)
        if(bestGrades[0][1] / passed.length >= 0.3) return tags.push(`${bestGrades[0][0]} Expert`)
    })();

    (() => {
        for(let i = 0; i < arts.length; i++){
            if(arts[i][1] / scores.length >= 0.07) return tags.push(`${arts[0][0]} One-Trick`)
            if(arts[i][1] / scores.length >= 0.03) return tags.push(`${arts[0][0]} Enjoyer`)
        }
    })()

    return {
        tags,
        accuracy,
        grades,
        ranks,
        pp
    }
}