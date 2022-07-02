import axios from 'axios';
import fs from 'fs';
import crypto from 'crypto';
const headers = {
    "Host": "clients6.google.com",
    "Connection": "keep-alive",
    "X-Goog-Encode-Response-If-Executable": "base64",
    "X-Origin": "https://voice.google.com",
    "X-ClientDetails": "appVersion=5.0%20(Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F103.0.0.0%20Safari%2F537.36&platform=MacIntel&userAgent=Mozilla%2F5.0%20(Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F103.0.0.0%20Safari%2F537.36",
    "sec-ch-ua-mobile": "?0",
    "Content-Type": "application/json+protobuf",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    "X-JavaScript-User-Agent": "google-api-javascript-client/1.1.0",
    "X-Goog-AuthUser": "0",
    "X-Referer": "https://voice.google.com",
    "Accept": "*/*",
    "Origin": "https://clients6.google.com",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7"
}
export default class GoogleVoice {
    headers: any;
    cookies: string;
    key: string;
    constructor(set_cookies?: Array<Object>) {
        let cookies
        if (!set_cookies) {
            cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8').toString());
        }
        let sid_hash = this.generateSidAuth(cookies.filter(function (item) {
            return item.name === 'SAPISID';
        })[0].value);
        this.cookies = cookies.map(function (item) {
            return `${item.name}=${item.value}`;
        }).join('; ');
        this.headers = headers;
        this.headers["Authorization"] = sid_hash;
        this.key = `AIzaSyDTYc1N4xiODyrQYK0Kl6g_y279LjYkrBg` //Google API key
    }
    #post(url: string, data: Array<any> = []): Promise<Object> {
        return new Promise(async (resolve, reject) => {
            const config = {
                method: 'post',
                url: `${url}?alt=json&key=${this.key}`,
                headers: {
                    ...this.headers,
                    'Cookie': this.cookies
                },
                data: data
            };

            let res = await axios(config).catch(function (error) {
                return reject({
                    error: error.toString(),
                    message: error.response.data
                });
            })
            return resolve(res!.data);
        })
    }
    async blockPhoneNumber(phone_number: string, block: boolean = true) {
        let data = [[
            `t.${phone_number}`, block, null, null, []], [null, true], 1
        ]
        return await this.#post('https://clients6.google.com/voice/v1/voiceclient/thread/updateattributes', data)
    }
    async deleteSMS(threadItemId: string) {
        let data = [threadItemId]
        return await this.#post('https://clients6.google.com/voice/v1/voiceclient/threaditem/delete', data)
    }
    async sendSMS(phone_number: string, message: string) {
        let data = [
            null, null, null, null, message, `t.${phone_number}`, [], null,
            [
                parseInt(Math.random().toString().substring(2)) //Unique Message ID
            ]
        ]
        return await this.#post('https://clients6.google.com/voice/v1/voiceclient/api2thread/sendsms', data)
    }
    //根据手机号获取消息
    async getMessageByPhoneNumber(phone_number: string, limit: number = 100): Promise<Object> {
        let data = [
            `t.${phone_number}`,
            limit,
            null,
            [
                null,
                true,
                true
            ]
        ]
        return await this.#post('https://clients6.google.com/voice/v1/voiceclient/api2thread/get', data)
    }
    //获取所有收到的事件
    async getThreadList(limit: number = 500, pagination_token: number = 500): Promise<Object> {
        let data = [
            1,
            limit,
            pagination_token,
            null,
            null,
            [
                null,
                true,
                true
            ]
        ];
        return await this.#post('https://clients6.google.com/voice/v1/voiceclient/api2thread/list', data)
    }
    //获取语音
    getVoice(file_id: string): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            const config = {
                method: 'get',
                url: `https://voice.google.com/u/0/a/v/${file_id}`,
                responseType: 'arraybuffer',
                headers: {
                    'authority': 'voice.google.com',
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
                    'Cookie': this.cookies,
                }
            };
            let res = await axios(config).catch(function (error) {
                return reject({
                    error: error.toString(),
                    message: error.response.data
                });
            })
            return resolve(res!.data);
        })
    }
    generateSidAuth(sid) {
        const domain_path = 'https://voice.google.com';
        const timestamp = Math.floor(new Date().getTime() / 1000);
        const input = [timestamp, sid, domain_path].join(' ');

        let hash = crypto.createHash('sha1');
        let data = hash.update(input, 'utf-8');
        let gen_hash = data.digest('hex');

        return ['SAPISIDHASH', [timestamp, gen_hash].join('_')].join(' ');
    }
}