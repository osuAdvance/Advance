export default async function (scores) {
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

    return fav
}