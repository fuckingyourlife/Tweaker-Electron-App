import { ipcMain, BrowserWindow, shell } from 'electron'
import axios from 'axios'
import http from 'http'
import url from 'url'

// These should be configured by the user
const CLIENT_ID = '1458295260798255175'
const CLIENT_SECRET = 'I0j1bn5QUsnNrt68oWwbuaut2zi7qYr-'
const REDIRECT_URI = 'http://localhost:53134/callback'
const SERVER_ID = '1359567789433684028'
const PREMIUM_ROLE_ID = '1359582539685040474'
const ADMIN_ROLE_ID = '1458848428451823871'

let authWindow = null
let server = null

export function setupAuth() {
    console.log('Setting up Discord Auth handlers...');
    ipcMain.handle('discord-login', async () => {
        console.log('Login request received from renderer');
        return new Promise((resolve, reject) => {
            // Create a small server to listen for the redirect
            if (server) server.close()

            server = http.createServer(async (req, res) => {
                const query = url.parse(req.url, true).query
                if (query.code) {
                    res.end('Authentication successful! You can close this window.')
                    server.close()
                    server = null

                    try {
                        const tokenResponse = await exchangeCode(query.code)
                        const userData = await getUserData(tokenResponse.access_token)
                        const memberData = await getMemberData(tokenResponse.access_token)

                        const roles = memberData.roles || []
                        const isPremium = roles.includes(PREMIUM_ROLE_ID)
                        const isAdmin = roles.includes(ADMIN_ROLE_ID) || userData.id === 'YOUR_ID' // Fallback for owner

                        resolve({
                            success: true,
                            user: userData,
                            roles: { isPremium, isAdmin }
                        })

                        if (authWindow) authWindow.close()
                    } catch (error) {
                        console.error('Auth Error:', error)
                        resolve({ success: false, error: error.message })
                    }
                }
            }).listen(53134)

            // Open Discord OAuth URL
            const scopes = encodeURIComponent('identify guilds.members.read')
            const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scopes}`
            authWindow = new BrowserWindow({
                width: 600,
                height: 800,
                show: true,
                autoHideMenuBar: true
            })

            authWindow.loadURL(authUrl)

            authWindow.on('closed', () => {
                authWindow = null
                if (server) {
                    server.close()
                    server = null
                    resolve({ success: false, error: 'User closed the window' })
                }
            })
        })
    })
}

async function exchangeCode(code) {
    const params = new URLSearchParams()
    params.append('client_id', CLIENT_ID)
    params.append('client_secret', CLIENT_SECRET)
    params.append('grant_type', 'authorization_code')
    params.append('code', code)
    params.append('redirect_uri', REDIRECT_URI)

    const response = await axios.post('https://discord.com/api/oauth2/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return response.data
}

async function getUserData(accessToken) {
    const response = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    return response.data
}

async function getMemberData(accessToken) {
    try {
        const response = await axios.get(`https://discord.com/api/users/@me/guilds/${SERVER_ID}/member`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return response.data
    } catch (e) {
        return { roles: [] } // User might not be in the server
    }
}
