const axios = require("axios")
const fs = require("fs")
const YoutubeMusicApi = require('youtube-music-api')
const yt = new YoutubeMusicApi()
const ytdl = require('ytdl-core');
const ffmpeg = require('@ffmpeg-installer/ffmpeg')
const ffmpegs = require('fluent-ffmpeg')
ffmpegs.setFfmpegPath(ffmpeg.path)

module.exports = async (msg_id, user, date, title, oldM) => {
	const time = new Date()
	const json = JSON.parse(fs.readFileSync("data.json"))
	try{

	}catch(e){
		return json.chats.append({
			"user": "Music Bot",
            "txt": e.message,
            "time": time,
            "reply": msg_id
		})
	}
}