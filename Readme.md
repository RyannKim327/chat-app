### Sample Chat App with ExpressJS, NodeJS
#### MPOP Reverse II (Ryann Kim Sesgundo)
---
> This is just a simple web based so-called application that update everytime. I also added some user credentials here like using of cookies, to avoid multiple accounts, and also the admin clear chat command, ban a user, and unban user. To avoid spams, I use the if last two chat, no input method, so that the spam may be prevented.
---
### Credits
1. ChatGPT - for telling me kung saan ako nagkulang
2. John Paul Caigas - for suggesting about the url
3. Mark Kevin Manalo - for recruitments for alpha test

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
> This program is developed to enhance my knowledge, regarding in web development, also to enhance and to expand my knowledge in programming. This program also helps me not just to look for what I know, but to seek more.