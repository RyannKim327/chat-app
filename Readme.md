### Sample Chat App with ExpressJS, NodeJS
#### MPOP Reverse II (Ryann Kim Sesgundo)
---
> This is just a simple web based so-called application that update everytime. I also added some user credentials here like using of cookies, to avoid multiple accounts, and also the admin clear chat command, ban a user, and unban user. To avoid spams, I use the if last two chat, no input method, so that the spam may be prevented.
---
### What's added:
1. Make it simple design with responsive UI
2. Fixed minor issues such as the spam alers
3. Added no bad words ban account
4. Used cookies to store credentials
5. Lessen the data to be gathered to avoid some unwanted alerts
6. Fixed html tags insertations
7. Added auto bots
8. Added accounts promotions and rankings (Announced by auto bots)
9. Added clear command for admin rank
10. Maximized the chat thread limit from 50 to 25 lists of chats
11. Auto synchronized conversation
12. 2 chats per user (or else the input will be gone unless someone chats) to avoid some spams
13. Added messaage reply
14. Added some secrets tags such as newline and tabs
15. Atleast 2 characters long chat, to avoid spam
16. Atleast 5 characters long for username and 8 characters long for password
17. Auto sign in/sign up on login panel (sign up if not existed)
18. Fixed auto sync from 500 ms to 750 ms, now to 1 second and 10 seconds interval after 10 seconds
19. Added date for chats
20. Make a style like messenger
21. Admin can promote a user to moderator if he wants
22. Music command using !play<space>sing_title, with music bot
23. Loading screen (beta test) for no messages

---
### Credits
1. ChatGPT - for telling me kung saan ako nagkulang
2. John Paul Caigas - for suggesting about the url
3. Mark Kevin Manalo - for recruitments for alpha test
4. Earl Shine Sawir - for testing and some design ideas

---
### Issue Fixed before the first release
1. Undefined req.body in ExpressJS

---
### Package used

**ExpressJS**
```Bash
npm install express --no-bin-links
```

**Body Parser**
```Bash
npm install body-parser
```

**FS**
```Bash
npm install fs
```

**Youtubei.js**
```Bash
npm install youtubei.js
```

---
### Solutions:
1. use the ("body-parser").json as middleware in app.use
```NodeJS
const express = require("express")
const app = express()
const body = require("body-parser")

const parser = body.urlencoded({ extended: true })

app.use(body.json())

app.post("/", parser, (req, res) => {
	let data = req.body
})
```
2. Setup external files to be include, by also using of middleware and app.use

**NodeJS**
```NodeJS
const express = require("express")
const app = express()

app.use('/source', express.static(path.join(__dirname + "/styles")))

app.get("/", (req, res) => {
	res.sendFile(`${__dirname}/src/index.html`)
})
```
**HTML**
```HTML
<link rel="stylesheet" href="/source/styles.css">
```
> You may also use the script here. Same method as this example. The logic behindi this program is to use the API method to get the data from the server of the website, and call it thru the fetch method. In this case, the backend and the frontend connects to each other. I use JSON as database of the program, to easily manage thru nosq; method.

---
> Wanna be one of us, kindly join with us by clicking the link, attached to this repository.
---
### Disclaimer
> This program is developed to enhance my knowledge, regarding in web development, also to enhance and to expand my knowledge in programming. This program also helps me not just to look for what I know, but to seek more. The development is still in progress, if ever you wanted to join with us, [kindly go to this link](https://chatapp.mpoprevii.repl.co).