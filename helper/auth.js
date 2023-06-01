import fetch from "node-fetch"
import { username, password } from "../config.js"
import { sleep } from "./system.js";

let token = "";
let count = 0;
export let limited = false;

function login(){
    return new Promise(async (resolve) => {
        if(token.length == 0) return resolve(await generate())
        if(count >= 1000) return setTimeout(async () => resolve(await login()), 60 * 1000) //TODO: Maybe keep reset? || Limit in config?
        resolve(token);
        return count++
    })
}

setInterval(async () => {
    count = 0;
}, 60000)

function generate(){
    return new Promise(async (resolve) => {
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
    
        let t;

        try {
            const response = await fetch("https://osu.ppy.sh/oauth/token", {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            })

            if(response.status == 429){
                await sleep(1000 * 60 * 60)
                return resolve(await generate())
            }
        
            t = await response.json()
        } catch (e){
            return resolve(await generate())
        }
    
        count++
        token = t.access_token
        resolve(token)

        return setTimeout(async () => {
            token = ""
        }, t.expires_in)
    })
}

async function GET(url){
    const key = await login()
    try {
        const request = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + key,
                "scope": "*",
                "user-agent": "osu-lazer"
            },
        })

        if(request.url.includes(".osz")) return request

        const data = await request.json()
        return data
    } catch(e){
        return await GET(url)
    }
}

async function POST(url){
    const key = await login()
    try {
        const request = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + key,
            },
        })

        const data = await request.json()
        return data
    } catch(e){
        return await POST(url)
    }
}

async function ratelimit(){
    limited = true;
    setTimeout(() => {
        limited = false;
    }, 1000 * 60 * 60)
}

export default {
    GET, POST,
    ratelimit, limited
}