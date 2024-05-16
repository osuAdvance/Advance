import fetch from "node-fetch"
import { clientID, clientSecret, redirect } from "../config.js"
import { EventEmitter } from "events"
import fs from "fs/promises"
import Logger from "cutesy.js"
import fetch from "node-fetch"
const authLog = new Logger().addTimestamp("hh:mm:ss").changeTag("Auth")

export default new class Auth extends EventEmitter {
    constructor(){
        super();
        this.token = undefined;
        this.refresh = undefined;
        this.limited = false;
    }

    login(){
        return new Promise(async (resolve) => {
            try {
                const file = JSON.parse(await fs.readFile("./.data/token", "utf8"))
                this.token = file.token
                this.refresh = file.refresh
                const expire = file.expires_in - Date.now()
                if(expire < 1) return await this.update()
                setTimeout(async () => await this.update(), expire)
            } catch {
                await this.auth({
                    username: process.env.user,
                    password: process.env.password,
                    grant_type: "password",
                    scope: "*"
                })
            } finally {
                return resolve(this);
            }
        })
    }

    async update(){
        return await this.auth({
            refresh_token: this.refresh,
            grant_type: "refresh_token",
        })
    }

    async auth(body){
        const request = await fetch("https://osu.ppy.sh/oauth/token", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: 5,
                client_secret: "FGc9GAtyHzeQDshWP5Ah7dega8hJACAJpQtw6OXk",
                ...body
            })
        })

        if(!request.ok){
            if (request.status == 401) return await this.login();
            await this.limiter(request)
            return await this.auth(body)
        }

        const t = await request.json()
        this.token = t.access_token
        this.refresh = t.refresh_token
        fs.writeFile("./.data/token", JSON.stringify({
            token: t.access_token,
            refresh: t.refresh_token,
            expires_in: Date.now() + (t.expires_in * 1000)
        }))
        setTimeout(async () => await this.update(), t.expires_in * 1000)
        return this
    }

    request(url, token){
        return new Promise(async (resolve) => {
            if(!this.token && !token) await this.login();
            if(this.limited){
                return this.once("ready", async () => resolve(await this.request(...arguments)))
            }
            const request = await fetch(`https://osu.ppy.sh/api/v2${url}`, {
                headers: {
                    "Authorization": "Bearer " + token || this.token,
                    "scope": "*", //? Not sure if i need this
                    "user-agent": "osu-lazer"
                }
            })
    
            if(!request.ok){
                if(request.status == 401){
                    await this.login()
                    return resolve(await this.request(...arguments))
                }
                resolve(undefined);
                return await this.limiter(request);
            }

            if(request.url.includes(".osz")) return resolve(request);
    
            try {
                return resolve(await request.json())
            } catch {
                console.error(request)
                return resolve(undefined)
            }
        })
    }

    async authenticate(code){
        const request = await fetch("https://osu.ppy.sh/oauth/token", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: clientID,
                client_secret: clientSecret,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: redirect
            })
        })
    
        return await request.json()
    }

    async limiter({ status, statusText, url }){
        if(status == 404) return;
        this.limited = true;
        authLog.red(`Encountered error: ${status} - ${statusText} (${url})`).send()
        console.error(`Code: ${status} - ${statusText} (${url})`)
        const time = (() => {
            switch(status){
                case 429:
                    return 1000 * 60 * 60
                default:
                    return 1000 * 60
            }
        })();
        await new Promise((r) => setTimeout(r, time))
        this.limited = false;
        return this.emit("ready")
    }
}