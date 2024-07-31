const { json } = require("body-parser");
const fs = require("fs");
const path = require('path');
const moment = require("jalali-moment")
const passwordHash = require("password-hash")
const jwt = require("jsonwebtoken")
const writeFileAtomic = require('write-file-atomic').sync;
//GET VERSION DATA
const data = fs.readFileSync("app/models/version.json");
const jsonData = JSON.parse(data);
//GET GROUP DATA
const version = fs.readFileSync("app/models/group.json");
const groupData = JSON.parse(version);
const ffmpeg = require('fluent-ffmpeg');
const hlsServer = require('hls-server');

//CONTROLL ROUTES
class apiController {
    version(req, res) {
        const data = fs.readFileSync("app/models/version.json");
        const jsonData = JSON.parse(data);
        res.json(jsonData)
    }
    videos(req, res) {

        res.json(jsonData.VideoList)
    }
    video(req, res) {
        const data = fs.readFileSync("app/models/version.json");
        const jsonData = JSON.parse(data);
        const version = fs.readFileSync("app/models/group.json");
        const groupData = JSON.parse(version);
        
        const video = `${req.params.id}`;
        const videoPath = path.join(__dirname, `../../videos/${video}`);
        const check = jsonData.VideoList.includes(`${req.params.id}`)
        if (check)
            res.sendFile(videoPath)
        else
            res.json("video not found")
    }
    add(req, res) {
        const data = fs.readFileSync("app/models/version.json");
        const jsonData = JSON.parse(data );
        const version = fs.readFileSync("app/models/group.json");
        const groupData = JSON.parse(version);
        if (!req.file) {
            res.redirect("/")
        }
        const videoName = req.file.originalname
        if (!jsonData.VideoList.includes(videoName))
            jsonData.VideoList.push(videoName)
        if (!groupData.videos.includes(videoName)) {
            groupData.videos.push(videoName)
            let datae = {
                name: videoName,
                title: req.body.title,
                total: 0,
                day: 0,
                week: 0,
                month:0
            }
            groupData.videosDescriptions.push(datae)
        }
        jsonData.version += 1
        groupData.version += 1
        fs.writeFileSync("app/models/group.json", JSON.stringify(groupData))
        fs.writeFileSync("app/models/version.json", JSON.stringify(jsonData))
        res.redirect('/video')
    }
    delete(req, res) {
        console.log("send req")
        const check = jsonData.VideoList.includes(`${req.params.id}`)
        if (check) {
            const videoName = `${req.params.id}`;
            jsonData.VideoList = jsonData.VideoList.filter(item => item !== videoName)
            jsonData.version += 1
            fs.writeFileSync("app/models/version.json", JSON.stringify(jsonData))
            fs.unlinkSync(`app/videos/${videoName}`)
            res.json("ok")
        }
        else
            res.json("video not found")
    }
    versions(req, res) {
        const version = fs.readFileSync("app/models/group.json");
        const groupData = JSON.parse(version);
        res.json(groupData)
    }
    update(req, res) {
        const videoName = jsonData.VideoList.filter(item => !req.body.jsonFile.VideoList.includes(item));
        fs.unlinkSync(`public/videos/${videoName}`)
        fs.writeFileSync("app/models/version.json", JSON.stringify(req.body.jsonFile))
        res.json("1")
    }
    versionUpdate(req, res) {
        fs.writeFileSync("app/models/version.json", JSON.stringify(req.body.data))
        res.redirect("/settings")
    }
    picture(req, res) {
        const picName = req.params.id;
        const picPath = path.join(__dirname, `../../../public/pic/${picName}`)
        res.sendFile(picPath)
    }
    async tvUpdate(req, res) {
        const tvName = req.params.id;
        const tv = await groupData.player.find(data => data.name == tvName)
        const currentDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" });
        const current = moment().locale('fa').format('YYYY/MM/DD');
        const timeRegex = /(\d{1,2}:\d{2})/;

        const match = currentDate.match(timeRegex);
        if (tv.state == false) {
            tv.state = true;
            const time = match[0];
            tv.updateDate = current + " " + time;
            fs.writeFileSync("app/models/group.json", JSON.stringify(groupData));
            res.json("آنلاین");
        }
        res.json()
    }
    async deleteCat(req, res) {
        const catName = req.body.categoryName || 0;

        if (catName != 0) {
            const players = groupData.player
            players.forEach(player => {
                if (player.group == catName) {
                    player.group = "";
                }
            });
            let hello = await jsonData.category.filter(c => c != catName)
            let bay = await groupData.groups.filter(g => g.name != catName)
            jsonData.category = hello
            groupData.groups = bay

            groupData.player.forEach(g => {
                if (g.group === catName) {
                    g.playlist = []
                }
            })
            fs.writeFileSync("app/models/group.json", JSON.stringify(groupData))
            fs.writeFileSync("app/models/version.json", JSON.stringify(jsonData))
            res.json("1")
        } else {
            res.json("category not founded")
        }
    }
    addCat(req, res) {
        jsonData.category.push(req.body.categoryName)
        const group = {
            name: req.body.categoryName,
            videos: [],
            players: []
        }
        fs.writeFileSync("app/models/group.json", JSON.stringify(groupData))
        fs.writeFileSync("app/models/version.json", JSON.stringify(jsonData))
        res.json("1")
    }
    editCat(req, res) {
        try {
            const oldCat = req.body.oldCategoryName;
            const newCat = req.body.categoryName

            const temp = jsonData.category
            const sum = groupData.groups
            for (const item in temp) {
                if (temp[item] === oldCat) {
                    temp[item] = newCat
                }
            }
            for (const item in sum) {
                if (sum[item].name === oldCat) {
                    sum[item].name = newCat
                }
            }


            fs.writeFileSync("app/models/group.json", JSON.stringify(groupData))
            fs.writeFileSync("app/models/version.json", JSON.stringify(jsonData))
            res.json("1")
        } catch (error) {
            res.json(error)
        }

    }
    async addVideoCat(req, res) {
        const catName = await req.body.cat
        const videoName = await req.body.video

        if (catName && videoName) {


            if (jsonData.VideoList.includes(videoName)) {

                groupData.groups.forEach(cat => {
                    if (cat.name === catName) {
                        cat.videos.push(videoName)
                    }
                })


                groupData.player.forEach(cat => {
                    if (cat.group === catName) {
                        cat.playlist.push(videoName)
                    }
                })


                fs.writeFileSync("app/models/group.json", JSON.stringify(groupData))
                res.json("1")
            }
        } else {
            res.json("video not founded")
        }

    }
    deleteVideoCat(req, res) {
        const catName = req.body.cat
        const videoName = req.body.video

        if (catName && videoName) {

            groupData.groups.forEach(cat => {
                if (cat.name === catName) {
                    let hello = cat.videos.filter(v => v !== videoName)
                    cat.videos = hello;
                }
            })

            groupData.player.forEach(cat => {
                if (cat.group === catName) {
                    let hello = cat.playlist.filter(v => v !== videoName)
                    cat.playlist = hello;
                }
            })

            const check = true;



            fs.writeFileSync("app/models/group.json", JSON.stringify(groupData))
            res.json("1")
        }
        else {
            res.json("video not founded")
        }
    }
    tvVideoAdd(req, res) {
        const tvName = req.body.tvName
        const videoName = req.body.video

        if (jsonData.VideoList.includes(videoName)) {
            groupData.player.forEach(tv => {
                if (tv.name === tvName) {
                    tv.customVideo.push(videoName)
                }
            })
            fs.writeFileSync("app/models/group.json", JSON.stringify(groupData))
            res.json("1")
        } else {
            res.json("video not founded")
        }
    }
    tvVideoDelete(req, res) {
        const tvName = req.body.tvName
        const videoName = req.body.video

        if (jsonData.VideoList.includes(videoName)) {
            groupData.player.forEach(tv => {
                if (tv.name === tvName) {
                    if (tv.customVideo.includes(videoName)) {
                        let index = tv.customVideo.indexOf(videoName)
                        tv.customVideo.splice(index, 1)
                    }
                }
            })
            fs.writeFileSync("app/models/group.json", JSON.stringify(groupData))
            res.json("1")
        } else {
            res.json("video not founded")
        }
    }
    users(req, res) {
        if (req.body.username == process.env.USER && req.body.password == process.env.password) {
            const token = jwt.sign({ foo: req.body.password }, 'shhhhh');
            req.session.token = token
            res.redirect("/tv")
        } else {
            req.session.token = "token"
            res.redirect("/login")
        }
    }
    logout(req, res) {
        req.session.token = null;
        res.redirect("/")
    }

}

module.exports = new apiController();