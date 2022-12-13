import fetch from "node-fetch"
import { username, password } from "../config.js"
import global from "./global.js"
import { sleep, getTime } from "./system.js"

function login(limit = 1000, wait = false){ //* Promise based v2 Login with 200 Requests default threshhold
    return new Promise(async (resolve, reject) => {
        let time = await getTime()
        global.attemps++

        let c = global.cache[0] //Creates a copy of global.cache

        if(!c) return resolve(await generate())

        if(c.expires_in < time){
            global.attemps = 0
            return resolve(await generate())
        }

        if(c.reset > time){
            if(c.count >= limit){
                if(!wait) return reject(`Time left: ${c.reset + 1 - time} Seconds`)

                let limited = global.limited //Copy of global.limited
                if(global.limited == false) global.limited = true;

                await sleep((c.reset + 1 - time) * 1000) //Wait until a slot is free

                resolve(limited ? global.cache[0].access_token : await generate()) //If wasn't limited already, generate new token.

                global.limited = false;
                return;
            }

            c.count++
        } else {
            c.reset = time + 60
            c.count = 0
        }

        global.cache[0] = c
        return resolve(c.access_token)
    })
}

function generate(){
    return new Promise(async (resolve, reject) => {
        const time = await getTime()
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
    
        const body = {
            "username": username,
            "password": password,
            "client_id": 5,
            "client_secret": "FGc9GAtyHzeQDshWP5Ah7dega8hJACAJpQtw6OXk",
            "grant_type": "password",
            "scope": "*"
        }
        
        let token;

        try {
            const response = await fetch("https://osu.ppy.sh/oauth/token", {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            })
        
            token = await response.json()
    
            if(token.error) return reject(token.hint)
    
        } catch (e){
            return reject("Couldn't connect to osu! (Authentication)")
        }


        token.count = 1
        token.reset = time + 60
        token.expires_in = time + token.expires_in
    
        global.cache[0] = token
        return resolve(token.access_token)
    })
}

export default function get(url) {
    return new Promise(async (resolve, reject) => {
        const key = await login(400).catch(e => reject(e))
        try {
            const request = await fetch(url, {
                headers: {
                    "authorization": "Bearer " + key,
                    "scope": "*",
                    "user-agent": "osu-lazer"
                },
            })
    
            const data = await request.json()

            if(data.authentication == "basic") return reject("Invalid Authentication (Ratelimit)")
    
            return resolve(data)
        } catch(e){
            return reject("Couldn't connect to osu!")
        }
    })
}