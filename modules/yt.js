const axios = require("axios")
const fs = require("fs")
const YoutubeMusicApi = require('youtube-music-api')
const yt = new YoutubeMusicApi()
const ytdl = require('ytdl-core');
const ffmpeg = require('@ffmpeg-installer/ffmpeg')
const ffmpegs = require('fluent-ffmpeg')
ffmpegs.setFfmpegPath(ffmpeg.path)

module.exports = async (msg_id, user, date, title, oldM) => {
	const json = JSON.parse(fs.readFileSync("data.json"))
	try{

	}catch(e){
		return json.chats.append({
			"id": msg_id,
			"user": "Music",
			"rank": "bot",
            "txt": e.message,
            "time": date,
            "reply": -1
		})
	}
}