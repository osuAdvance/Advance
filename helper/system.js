export function getTime(time){
    if(time) return Math.floor(new Date(time).getTime() / 1000)
    else return Math.floor(new Date().getTime() / 1000)
}

export function sleep(t = 1000){
    return new Promise((r) => setTimeout(r, t))
}

export function getSafename(username){
    return username?.toLowerCase().replaceAll(" ", "_")
}