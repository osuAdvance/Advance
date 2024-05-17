export default new class Auth extends EventEmitter {
    request(url: string, token?: string): Promise<any>
    authenticate(code: string): Promise<{
        error: string
    } | {
        access_token: string
        refresh_token: string
        expires_in: number
    }>
}