// const { Socket } = require("socket.io")

const userBar = document.getElementById("userBar")
console.log(userBar)
// var socket = io();
// console.log("Hleo")



socket.emit("getUser")
    console.log("object")
    socket.on("userJson", async data => {
        console.log(data)
    })
