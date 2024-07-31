const express = require('express');
const socketIo = require('socket.io')
const app = express();
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser")
const passport = require('passport');
const session = require('express-session');
const fs = require('fs');
const moment = require("jalali-moment")
const cors = require('cors');
const PersianDate = require("persian-date");
const jwt = require("jsonwebtoken")
const jalaliMoment = require('jalali-moment')
require('dotenv').config();
const sharp = require('sharp');
const { exec } = require('child_process');
const { customSetInterval } = require('../inerval')


const server = http.createServer(app);
const io = socketIo(server);

function setupExpress() {
    server.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`))
}

function setConfig() {
    app.use(cors())
    app.use(express.static("public"));
    app.set("views", path.resolve("./app/templates"));
    app.set("view engine", "ejs");
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser())
    app.use(session({
        secret: '09203fdfsj;)#&(@!', resave: false, saveUninitialized: true, cookie: { maxAge: 1800000 }
    }));
    app.use(passport.initialize());
    app.use(passport.session());
}

function serRouters() {
    app.use(require("app/routes"));
}

function socekts() {
    const currentDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" });
    const current = moment().locale('fa').format('YYYY/MM/DD');
    const timeRegex = /(\d{1,2}:\d{2})/;
    const match = currentDate.match(timeRegex);
    const time = match[0];
    const now = current + " " + time;
    const io = socketIo(server, {
        cors: {
            methods: ["GET", "POST"],
            transports: ['websocket', 'polling'],
            credentials: true
        },
        allowEIO3: true,
        maxHttpBufferSize: 6e6
    });
    const connectedUsers = {};
    let users = []
    let indexes = 0;
    const deviceStates = {};
    let myInterval = null;
    let helloe = 0;

    function hello(text) {
        io.emit('runP', { name: "all", text: text })
    }

    async function onOff() {
        let message;
        const date = new Date()
        const option = {
            weekday: "long",
            year: 'numeric',
            month: "long",
            day: "numeric"
        }
        const now = new Date();
        const options = { timeZone: 'Asia/Tehran', hour12: false };
        const time = now.toLocaleTimeString('en-US', options);
        const tarikh = date.toLocaleDateString("fa-IR", option);
        const minLive = time.split(":")[1];
        const hourLive = time.split(":")[0];
        let dayLive = tarikh.split(",")[1];
        const today = new Date();
        const persianDate = new PersianDate(today);
        const persianDay = persianDate.date();
        const persianMonths = [
            "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
        ];
        const gregorianMonth = today.getMonth();
        const persianMonthIndex = ((gregorianMonth + 1) % 12) - 3;
        const persianMonth = persianMonths[persianMonthIndex];
        let nOminRooz = 0;
        if (persianMonth == "فروردین")
            nOminRooz = 0
        if (persianMonth == "اردیبهشت")
            nOminRooz = 31
        if (persianMonth == "خرداد")
            nOminRooz = (31 + 31)
        if (persianMonth == "تیر")
            nOminRooz = (31 + 31 + 31)
        if (persianMonth == "مرداد")
            nOminRooz = (31 + 31 + 31 + 31)
        if (persianMonth == "شهریور")
            nOminRooz = (31 + 31 + 31 + 31 + 31)
        if (persianMonth == "مهر")
            nOminRooz = (31 + 31 + 31 + 31 + 31 + 30)
        if (persianMonth == "آبان")
            nOminRooz = (31 + 31 + 31 + 31 + 31 + 30 + 30)
        if (persianMonth == "آذر")
            nOminRooz = (31 + 31 + 31 + 31 + 31 + 30 + 30 + 30)
        if (persianMonth == "دی")
            nOminRooz = (31 + 31 + 31 + 31 + 31 + 30 + 30 + 30 + 30)
        if (persianMonth == "بهمن")
            nOminRooz = (31 + 31 + 31 + 31 + 31 + 30 + 30 + 30 + 30 + 30)
        if (persianMonth == "اسفند")
            nOminRooz = (31 + 31 + 31 + 31 + 31 + 30 + 30 + 30 + 30 + 30 + 30)

        nOminRooz += 31
        let checked = true
        // console.log(dayLive)
        nOminRooz = (persianDay + nOminRooz)
        if (dayLive == " شنبه")
            dayLive = "sat"
        if (dayLive == " یکشنبه")
            dayLive = "sun"
        if (dayLive == " دوشنبه")
            dayLive = "mon"
        if (dayLive == " سه‌شنبه")
            dayLive = "tue"
        if (dayLive == " چهارشنبه")
            dayLive = "wed"
        if (dayLive == " پنجشنبه")
            dayLive = "thu"
        if (dayLive == " جمعه")
            dayLive = "fri"
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const versonData = fs.readFileSync('app/models/version.json');
        const version = JSON.parse(versonData);
        const Holyday = version["Holyday"]
        nOminRooz -= 31
        for (let i = 1; i < Holyday.length; i++) {
            if (i == nOminRooz) {
                if (Holyday[i - 1] == 0) {
                    message = "امروز تعطیل است"
                    checked = false
                }
            }
        }
        const weekedays = version["onOffTimeSchedule"]
        // console.log(hourLive)
        weekedays.forEach(d => {
            if (d.day == dayLive) {
                if (d.onTime2 && hourLive >= 12) {
                    if (hourLive < d.onTime2.hour) {
                        message = "تایم ظهر شروع نشده است"
                        checked = false
                    }
                    if (hourLive > d.offTime2.hour) {
                        message = "تایم ظهر تمام شده است "
                        checked = false
                    }
                    if (hourLive == d.offTime2.hour)
                        if (minLive > d.offTime2.minute) {
                            message = "از تایم ظهر چند دقیقه گذشته است"
                            checked = false
                        }
                    if (hourLive == d.onTime2.hour)
                        if (minLive < d.onTime2.minute) {
                            message = "به تایم ظهر چند دقیقه مانده اس"
                            checked = false
                        }
                }
                if (d.onTime1 && hourLive < 12) {
                    if (hourLive < d.onTime1.hour) {
                        message = "تایم صبح شروع نشده است"
                        checked = false
                    }
                    if (hourLive > d.offTime1.hour) {
                        message = "تایم صبح تمام شده است"
                        checked = false
                    }
                    if (hourLive == d.offTime1.hour)
                        if (minLive > d.offTime1.minute) {
                            message = "از تایم صبح چند دقیقه گذشته است"
                            checked = false
                        }
                    if (hourLive == d.onTime1.hour)
                        if (minLive < d.onTime1.minute) {
                            message = "به تایم صبح چند دقیقه مانده است"
                            checked = false
                        }
                }




            }
        })
        if (message == undefined) {
            message = ""
        }
        let data = {
            checked,
            message
        }
        return data
    }

    customSetInterval(async () => {
        let sum = await onOff()
        const groupData = fs.readFileSync('app/models/group.json');
        const groupe = JSON.parse(groupData);
        // console.log(onOff())
        if (sum.checked == true) {
            if (indexes == 2 || indexes == 0) {
                hello('start')
                groupe["state"] = true;
                groupe["player"].forEach(tv => {
                    tv.state = true
                })
                groupe["version"] += 1;
                groupe["Text"] = ""
                fs.writeFileSync(`app/models/group.json`, JSON.stringify(groupe))
                io.emit('reloade', sum.message)
                console.log(sum.message)
                indexes = 1
            }
        } else {
            if (indexes == 1 || indexes == 0) {
                hello("stop")
                groupe["state"] = false;
                groupe["player"].forEach(tv => {
                    tv.state = false
                })
                groupe["Text"] = sum.message
                groupe["version"] += 1;
                fs.writeFileSync(`app/models/group.json`, JSON.stringify(groupe))
                io.emit('reloade', sum.message)
                console.log(sum.message)
                indexes = 2
            }
        }
        // console.log("Interval is play")
    }, 5000)

    io.on("connection", (socket) => {

        socket.on("userStatus", data => {

        })

        socket.on("onClient", data => {
            console.log(data)
            if (data == "all") {
                io.emit("runP", { name: data, text: "start" })
                // console.log("turn on all clients")
            } else {
                // console.log(connectedUsers)
                for (let user in connectedUsers) {
                    if (connectedUsers[user].username == data) {
                        io.to(user).emit("runP", { name: data, text: "start" })
                        // console.log(`user ${data} oning`)
                    }
                }
            }


        })

        socket.on('reload', data => {
            if (data == 'all') {
                io.emit('reload', { name: "all", text: 'reload' })
                // console.log("reload")
            } else {
                for (let user in connectedUsers) {
                    if (connectedUsers[user].username == data) {
                        io.to(user).emit("reload", { name: data, text: "reload" })
                    }
                }
            }
            indexes = 0;
        })

        socket.on("offClient", data => {
            console.log(data)
            if (data == "all") {
                io.emit("runP", { name: data, text: "stop" })
                // console.log("turn off all clients")
            } else {
                // console.log(connectedUsers)
                for (let user in connectedUsers) {
                    if (connectedUsers[user].username == data) {
                        io.to(user).emit("runP", { name: data, text: "stop" })
                        // console.log(`user ${data} dc `)
                    }
                }

            }

        })

        socket.on('playCounts', data => {
            console.log(data)
        })

        socket.on("sendIP", async data => {
            const ip = data.ip
            const tvName = data.mac

            const groupData = fs.readFileSync('app/models/group.json');
            const group = await JSON.parse(groupData);
            group["player"].forEach(tv => {
                if (tv.name == tvName) {
                    tv.ip = `${ip}`
                }
            });
            fs.writeFileSync(`app/models/group.json`, JSON.stringify(group))
        })

        socket.on("setMac", async mac => {
            connectedUsers[socket.id] = { username: mac, socket: socket };
            const groupData = fs.readFileSync('app/models/group.json');
            const group = await JSON.parse(groupData);
            group.player.forEach(tv => {
                if (tv.name == mac) {
                    tv.connection = true;
                }
            })
            fs.writeFileSync(`app/models/group.json`, JSON.stringify(group))
            io.emit("tvDc", { name: connectedUsers[socket.id].username, text: "برقرار" })
            if (group.state == true) {
                for (let user in connectedUsers) {
                    if (connectedUsers[user].username == mac) {
                        io.to(user).emit("runP", { name: mac, text: "start" })
                    }
                }
            } else {
                for (let user in connectedUsers) {
                    if (connectedUsers[user].username == mac) {
                        io.to(user).emit("runP", { name: mac, text: "stop" })
                    }
                }
            }
            console.log(`${mac} joined`)
        })

        socket.emit("message", "you connetcted")

        socket.on("message", data => {
            console.log(data)
        })

        socket.on("getVersion", async () => {
            const versonData = fs.readFileSync('app/models/version.json');
            const version = await JSON.parse(versonData);
            socket.emit("jsonFilee", version)
        })

        socket.on("getScreenshots", pic => {
            const videoStorage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, "public/videos");
                },
                filename: function (req, file, cb) {
                    cb(null, file.originalname);
                }
            })
            const videoUpload = multer({ storage: videoStorage });

        })

        socket.on("getGroup", async () => {
            const groupData = fs.readFileSync('app/models/group.json');
            const group = await JSON.parse(groupData);
            socket.emit("jsonFile", group)
        })

        socket.on("changeVersion", data => {
            //console.log("objectfsdafdsfdsfsafsdadfssadf")
            data["version"] += 1
            fs.writeFileSync(`app/models/version.json`, JSON.stringify(data))
            socket.emit("check")
            console.log("sfasdfasdf")
            // io.emit("runP", { name: "all", text: "stop" })
            // io.emit("runP", { name: "all", text: "start" })
        })

        socket.on("changeGroup", data => {
            data["version"] += 1
            fs.writeFileSync(`app/models/group.json`, JSON.stringify(data))
            socket.emit("check")
        })

        socket.on("createTvVideoStream", async data => {

            const groupData = fs.readFileSync('app/models/group.json');
            const group = await JSON.parse(groupData);
            // console.log(group.groups)
            let videos = [];
            let videosS = ''
            let comment = "mp4box "
            // console.log(data)
            group.player.forEach(g => {
                if (g.name == data) {
                    videos = g.playlist
                }
            })
            videos.forEach(vid => {
                videosS += `${vid} \n`
                comment += `-cat app/videos/${vid} `
            })
            data = data.replace(/:/g, "-")
            fs.writeFileSync(`./app/video/${data}.txt`, videosS)
            // console.log(videos)
            fs.readdir("app/output", (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    return;
                }
                
                files.forEach(file => {
                    if (file.includes(data)) {
                        fs.unlink(path.join("app/output", file), err => {
                            if (err) {
                                console.error('Error deleting file:', err);
                            } else {
                                // console.log(`Deleted file: ${file}`);
                            }
                        });
                    }
                });
            });
            
            comment += `-new app/videos/"${data}".mp4`

            if (videos.length >= 1) {
                exec(comment, (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.log(stdout)
                    if (stderr) {
                        function hlsCrete() {
                            //ffmpeg -i ./videos/b.mp4 -vf scale=1280:720 -c:v libx264 -profile:v main -level 3.1 -preset veryfast -g 48 -keyint_min 48 -sc_threshold 0 -b:v 2500k -maxrate 2500k -bufsize 5000k -hls_time 4 -hls_playlist_type vod -hls_segment_filename ./output/'b_%03d.ts' ./output/b.m3u8
                            let command = `ffmpeg -i app/videos/"${data}".mp4 -vf scale=1280:720 -c:v libx264 -profile:v main -level 3.1 -preset veryfast -g 48 -keyint_min 48 -sc_threshold 0 -b:v 2500k -maxrate 2500k -bufsize 5000k -hls_time 4 -hls_playlist_type vod -hls_segment_filename app/output/'"${data}"_%03d.ts' app/output/"${data}".m3u8`
                            exec(command, (err, stdout, stderr) => {
                                if (err) {
                                    console.error('Error executing ffmpeg:', err);
                                    return;
                                }

                                console.log(stdout)
                                // console.log(stderr)
                                if (stderr) {
                                    console.log("stream link create")
                                    socket.emit('hello')
                                    // socket.emit("getVideo", { name: mac, videos: `http://localhost:8010/output/${mac}.m3u8` })
                                }
                            });
                        }

                        console.log("hellowrld")
                        hlsCrete()
                        // fs.writeFile(`app/${mac}.txt`, hello, data => {
                        //     setTimeout(() => {
                        //     }, 2000)
                        // })
                    }
                })
            } else {
                fs.readdir("app/output", (err, files) => {
                    if (err) {
                        console.error('Error reading directory:', err);
                        return;
                    }

                    files.forEach(file => {
                        if (file.includes(data)) {
                            fs.unlink(path.join("app/output", file), err => {
                                if (err) {
                                    // console.error('Error deleting file:', err);
                                } else {
                                    // console.log(`Deleted file: ${file}`);
                                }
                            });
                        }
                    });
                });
                return socket.emit('hello')
            }


        })

        socket.on("createGroupVideoStream", async data => {
            const groupData = fs.readFileSync('app/models/group.json');
            const group = await JSON.parse(groupData);
            // console.log(group.groups)
            let videos = [];
            let videosS = ''
            let comment = "mp4box "
            // console.log(data)
            group.groups.forEach(g => {
                if (g.name == data) {
                    videos = g.videos
                }
            })
            videos.forEach(vid => {
                videosS += `${vid} \n`
                comment += `-cat app/videos/${vid} `
            })
            console.log(videos)
            fs.writeFileSync(`./app/video/${data}.txt`, videosS)
            fs.readdir("app/output", (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    return;
                }

                files.forEach(file => {
                    if (file.includes(data)) {
                        fs.unlink(path.join("app/output", file), err => {
                            if (err) {
                                console.error('Error deleting file:', err);
                            } else {
                                // console.log(`Deleted file: ${file}`);
                            }
                        });
                    }
                });
            });

            comment += `-new app/videos/"${data}".mp4`
            if (videos.length >= 1) {
                exec(comment, (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.log(stdout)
                    if (stderr) {
                        function hlsCrete() {
                            //ffmpeg -i ./videos/b.mp4 -vf scale=1280:720 -c:v libx264 -profile:v main -level 3.1 -preset veryfast -g 48 -keyint_min 48 -sc_threshold 0 -b:v 2500k -maxrate 2500k -bufsize 5000k -hls_time 4 -hls_playlist_type vod -hls_segment_filename ./output/'b_%03d.ts' ./output/b.m3u8
                            let command = `ffmpeg -i app/videos/${data}.mp4 -vf scale=1280:720 -c:v libx264 -profile:v main -level 3.1 -preset veryfast -g 48 -keyint_min 48 -sc_threshold 0 -b:v 2500k -maxrate 2500k -bufsize 5000k -hls_time 4 -hls_playlist_type vod -hls_segment_filename app/output/'${data}_%03d.ts' app/output/${data}.m3u8`
                            exec(command, (err, stdout, stderr) => {
                                if (err) {
                                    console.error('Error executing ffmpeg:', err);
                                    return;
                                }

                                console.log(stdout)
                                // console.log(stderr)
                                if (stderr) {
                                    console.log("stream link create")
                                    socket.emit('hello')
                                    // socket.emit("getVideo", { name: mac, videos: `http://localhost:8010/output/${mac}.m3u8` })
                                }
                            });
                        }

                        console.log("hellowrld")
                        hlsCrete()
                        // fs.writeFile(`app/${mac}.txt`, hello, data => {
                        //     setTimeout(() => {
                        //     }, 2000)
                        // })
                    }
                })
            } else {
                fs.readdir("app/output", (err, files) => {
                    if (err) {
                        console.error('Error reading directory:', err);
                        return;
                    }

                    files.forEach(file => {
                        if (file.includes(data)) {
                            fs.unlink(path.join("app/output", file), err => {
                                if (err) {
                                    // console.error('Error deleting file:', err);
                                } else {
                                    // console.log(`Deleted file: ${file}`);
                                }
                            });
                        }
                    });
                });
                return socket.emit('hello')
            }


        })

        socket.on("createMainVideoStream", async data => {
            const groupData = fs.readFileSync('app/models/group.json');
            const group = await JSON.parse(groupData);
            const videos = group["mainVideo"]
            let comment = "mp4box "
            let videosS = ''

            videos.forEach(vid => {
                videosS += `${vid} \n`
                comment += `-cat app/videos/${vid} `
            })
            fs.writeFileSync(`./app/video/${data}.txt`, videosS)
            fs.readdir("app/output", (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    return;
                }

                files.forEach(file => {
                    if (file.includes("MainVideo")) {
                        fs.unlink(path.join("app/output", file), err => {
                            if (err) {
                                console.error('Error deleting file:', err);
                            } else {
                                // console.log(`Deleted file: ${file}`);
                            }
                        });
                    }
                });
            });
            comment += `-new app/videos/MainVideo.mp4`
            if (videos.length >= 1) {
                exec(comment, (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    // console.log(stdout)
                    if (stderr) {
                        function hlsCrete() {
                            //ffmpeg -i ./videos/b.mp4 -vf scale=1280:720 -c:v libx264 -profile:v main -level 3.1 -preset veryfast -g 48 -keyint_min 48 -sc_threshold 0 -b:v 2500k -maxrate 2500k -bufsize 5000k -hls_time 4 -hls_playlist_type vod -hls_segment_filename ./output/'b_%03d.ts' ./output/b.m3u8
                            let command = `ffmpeg -i app/videos/MainVideo.mp4 -vf scale=1280:720 -c:v libx264 -profile:v main -level 3.1 -preset veryfast -g 48 -keyint_min 48 -sc_threshold 0 -b:v 2500k -maxrate 2500k -bufsize 5000k -hls_time 4 -hls_playlist_type vod -hls_segment_filename app/output/'MainVideo_%03d.ts' app/output/MainVideo.m3u8`
                            exec(command, (err, stdout, stderr) => {
                                if (err) {
                                    console.error('Error executing ffmpeg:', err);
                                    return;
                                }

                                console.log(stdout)
                                // console.log(stderr)
                                if (stderr) {
                                    console.log("stream link create")
                                    socket.emit('hello')
                                    // socket.emit("getVideo", { name: mac, videos: `http://localhost:8010/output/${mac}.m3u8` })
                                }
                            });
                        }

                        console.log("hellowrld")
                        hlsCrete()
                        // fs.writeFile(`app/${mac}.txt`, hello, data => {
                        //     setTimeout(() => {
                        //     }, 2000)
                        // })
                    }

                })
            } else {
                fs.readdir("app/output", (err, files) => {
                    if (err) {
                        console.error('Error reading directory:', err);
                        return;
                    }

                    files.forEach(file => {
                        if (file.includes("MainVideo")) {
                            fs.unlink(path.join("app/output", file), err => {
                                if (err) {
                                    // console.error('Error deleting file:', err);
                                } else {
                                    // console.log(`Deleted file: ${file}`);
                                }
                            });
                        }
                    });
                });
                return socket.emit('hello')
            }

        })

        socket.on("getVideo", async (mac) => {
            console.log(`${mac} get video`)
            const groupData = fs.readFileSync('app/models/group.json');
            const group = JSON.parse(groupData);
            const players = group["player"]
            let hello = await onOff()
            let linkes = []
            players.forEach(player => {
                // console.log(hello.checked)
                if (player.name == mac) {
                    if (hello.checked) {
                        mac = mac.replace(/:/g, "-")
                        if (player.playlist.length > 0) {
                            linkes.push(`http://localhost:8010/output/${mac}.m3u8`)
                        }
                        player.groupPlaylist.forEach(g => {
                            group.groups.forEach(gr => {
                                if (gr.name == g) {
                                    if (gr.videos.length > 0) {
                                        linkes.push(`http://localhost:8010/output/${g}.m3u8`)
                                    }  
                                }
                            })
                        })
                        if (group["mainVideo"].length > 0) {
                            linkes.push(`http://localhost:8010/output/MainVideo.m3u8`)
                        }
                        // console.log(linkes)
                        socket.emit("getVideo", { name: mac, videos: linkes })
                    } else {
                        socket.emit("getVideo", { name: mac, videos: [] })
                    }
                }
            })
        })

        socket.on("screen", data => {
            // console.log("hello", data)
            //socket.emit('screen', `http://localhost:8010/screen/${data}.jpg`)
            for (let user in connectedUsers) {
                if (connectedUsers[user].username == data) {
                    io.to(user).emit("takeScreen", data)
                }
            }
        })

        socket.on("hlsLog", async data => {
            console.log(data)
            let hlsLink = data.link
            let countPlay = data.count
            let videos = fs.readFileSync(`app/video/${hlsLink}.txt`, 'utf8')
            videos = videos.split('\n');
            videos.pop()
            const groupData = fs.readFileSync('app/models/group.json');
            const group = await JSON.parse(groupData);
            videos.forEach(videoo => {
                group["videosDescriptions"].forEach(vid => {
                    if (videoo.trim() == vid.name) {
                        vid.count += countPlay
                    }
                })
            })
            fs.writeFileSync(`app/models/group.json`, JSON.stringify(group))
        })

        socket.on("takeScreen", data => {
            helloe++
            if (data != null) {
                let requestingUser = null;
                Object.keys(connectedUsers).forEach(userId => {
                    if (connectedUsers[userId].socket === socket) {
                        requestingUser = connectedUsers[userId].username;
                    }
                });
                requestingUser = requestingUser.replace(/:/g, "-")
                sharp(data.screenshot)
                    .toFormat('jpg')
                    .toFile(`public/screen/${helloe}.jpg`, (err, info) => {
                        if (err) {
                            console.error('Error converting and saving the image:', err);
                        }
                        io.emit('screenShoot', `http://localhost:8010/screen/${helloe}.jpg`)
                    })
            }
            if (helloe == 2) {
                fs.readdir("app/screen", (err, files) => {
                    if (err) {
                        console.error('Error reading directory:', err);
                        return;
                    }

                    files.forEach(file => {
                        if (file.includes("1.jpg")) {
                            fs.unlink(path.join("app/screen", file), err => {
                                if (err) {
                                    console.error('Error deleting file:', err);
                                } else {
                                    // console.log(`Deleted file: ${file}`);
                                }
                            });
                        }
                    });
                });
                helloe = 0
            }
        })

        socket.on('disconnect', async data => {
            // console.log(connectedUsers)
            if (connectedUsers[socket.id]) {
                if (connectedUsers[socket.id].username !== "admin") {
                    const groupData = fs.readFileSync('app/models/group.json');
                    const group = await JSON.parse(groupData);
                    group.player.forEach(tv => {
                        if (tv.name == connectedUsers[socket.id].username) {
                            tv.connection = false;
                        }
                    })
                    fs.writeFileSync(`app/models/group.json`, JSON.stringify(group))
                    io.emit("tvDc", { name: connectedUsers[socket.id].username, text: "آفلاین" })
                }
            }
            delete connectedUsers[socket.id];
        })

    })
}

module.exports = class Application {
    constructor() {
        try {
            let mbn = fs.readFileSync('app/http/middleware/mbnet/mbn.txt')
            mbn = mbn.toString()
            const jalaliDate = jalaliMoment().locale('fa');
            const currentDay = jalaliDate.format('D');
            const currentMonth = jalaliDate.format('jM');
            const currentYear = jalaliDate.format('jYYYY');
            jwt.verify(mbn, "amili", (err, decode) => {
                if (!err) {
                    if (decode.year < currentYear) {
                        console.log("license is finish")
                        return
                    }
                    if (decode.year == currentYear && decode.month < currentMonth) {
                        console.log("license is finishe")
                        return
                    }
                    if (decode.year == currentYear && decode.month == currentMonth && decode.day < currentDay) {
                        console.log("license is finished")
                        return
                    }
                    socekts()
                    setupExpress()
                    setConfig()
                    serRouters()

                    //setHttpServer()
                }
            })
        } catch (error) {
            console.log(error)
        }
    }
}