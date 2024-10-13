const axios = require("axios");
const fs = require("fs");
const { Innertube, UniversalCache } = require("youtubei.js");

module.exports = async (msg_id, user, date, title, oldM) => {
  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: false,
    });
    const result = yt.music.search(title, {
      type: "video",
    });
    const info = await result.content;
    let i = 0;
    let data = info[i];
    while (data.type !== "MusicShelf") {
      i++;
      data = info[i];
    }

    const details = data.contents[0];
  } catch (e) {}
};
