export const mods = {
    "NM" : 0,
    "NF" : 1,
    "EZ" : 2, 
    "TD" : 4, 
    "HD" : 8, 
    "HR" : 16, 
    "SD" : 32, 
    "DT" : 64, 
    "RX" : 128, 
    "HT" : 256, 
    "NC" : 512,
    "FL" : 1024, 
    "Autoplay" : 2048,
    "SO" : 4096, 
    "AP" : 8192,
    "PF" : 16384,
    "4K" : 32768, 
    "5K" : 65536,
    "6K" : 131072, 
    "7K" : 262144, 
    "8K" : 524288, 
    "FI" : 1048576, 
    "RD" : 2097152, 
    "LastMod" : 4194304,
    "9K" : 16777216, 
    "10K" : 33554432, 
    "1K" : 67108864, 
    "3K" : 134217728, 
    "2K" : 268435456, 
    "ScoreV2" : 536870912, 
    "Mirror" : 1073741824
}

export async function convertToNumber(m){
    let num = 0;

    for(var i = 0; i < m.length; i++){
        num += mods[m[i]]
    }

    return num
}

export async function convertToString(mods){
    var modsString = ["NF", "EZ", "NV", "HD", "HR", "SD", "DT", "RX", "HT", "NC", "FL", "AU", "SO", "AP", "PF", "K4", "K5", "K6", "K7", "K8", "K9", "RN", "LM", "K9", "K0", "K1", "K3", "K2"];
        
    async function getScoreMods(e, t) {
        var n = [];
        return 512 == (512 & e) && (e &= -65), 16384 == (16384 & e) && (e &= -33), modsString.forEach(function(t, i) {
            var o = 1 << i;
        (e & o) > 0 && n.push(t)
        }), n.length > 0 ? (t ? " " : " +") + n.join("") : t ? "None" : ""
    }

    return await getScoreMods(mods)
}