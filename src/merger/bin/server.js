const http = require('http');
const fs = require('fs');
const path = require('path');
const loger = require('./Logger').default
const port = 8010;
const cors = require('cors');

let GLOBAL= loger.initialLogTemplate()
loger.initialize();

function updateGroup() {
    // let logs = loger.count([])

    const groupData = fs.readFileSync("./../../../../app/models/group.json")
    const group = JSON.parse(groupData);
    group["videosDescriptions"].forEach(vid => {
        for (let i in GLOBAL) {
            if (GLOBAL[i].movieName.trim() == vid.name) {
                vid.day = GLOBAL[i].count.day
                vid.week = GLOBAL[i].count.week
                vid.month = GLOBAL[i].count.month
                vid.total = GLOBAL[i].count.total
            }
        }
    });
    console.log("update")
    fs.writeFileSync(`./../../../../app/models/group.json`, JSON.stringify(group))
}

// setInterval(updateGroup, 1000 * 60 * 60)

const server = http.createServer((req, res) => {
    const filePath = path.join("./../../../../app/", req.url);
    const fileePath = path.join(__dirname, req.url);

    if (req.url == '/update') {
        console.log(req.url)
        updateGroup()
        return;
    }
    //console.log(req.url)
    if (req.url.endsWith("m3u8")) {
        let regexPattern = /\/output\/(.*)/;
        let extractedPart = req.url.match(regexPattern)[1];
        GLOBAL=loger.count([{ url: extractedPart, counts: 1 }] , {checkInitialization:false , checkTime:true , saveDb:false , localDb:GLOBAL})
    }


    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
            });
            res.write(data);
            res.end();
        }
    });
});



server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

