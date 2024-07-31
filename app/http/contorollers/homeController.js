const jwt = require("jsonwebtoken");

class homeController {
    index(req, res) {
        res.render("home", {})
    }

    setting(req, res) {
        jwt.verify(req.session.token, 'shhhhh', (err, decoded) => {
            if (!err) {
                if (decoded = process.env.PASSWORD) {
                    res.render("settings", {})
                }
            } else {
                res.render("login", { err: "" })
            }
        })
    }

    tv(req, res) {
        jwt.verify(req.session.token, 'shhhhh', (err, decoded) => {
            if (!err) {
                if (decoded = process.env.PASSWORD) {
                    res.render("tv", {})
                }
            }else{
                res.render("login", { err: "" })
            }
        })

    }

    tvEdit(req, res) {
        jwt.verify(req.session.token, 'shhhhh', (err, decoded) => {
            if (!err) {
                if (decoded = process.env.PASSWORD) {
                    res.render("edit", { tv: req.params.name })
                }
            }else{
                res.render("login", { err: "" })
            }
        })
    }

    login(req, res) {
        const token = req.session.token
        req.session.token = ""
        if (token) {   
            jwt.verify(token, 'shhhhh', (err, decoded) => {
                if (!err) {
                }
                res.render("login", { err: "اطلاعات وارد شده صحیح نمی باشد" })
            })
        }else{
            res.render("login", { err: "" })
        }
    }

    category(req, res) {
        jwt.verify(req.session.token, 'shhhhh', (err, decoded) => {
            if (!err) {
                if (decoded = process.env.PASSWORD) {
                    res.render("category", {})
                }
            }else{
                res.render("login", { err: "" })
            }
        })
    }

    video(req, res) {
        jwt.verify(req.session.token, 'shhhhh', (err, decoded) => {
            if (!err) {
                if (decoded = process.env.PASSWORD) {
                    res.render("video", {})
                }
            }else{
                res.render("login", { err: "" })
            }
        })
    }
    
    view(req, res) {
        jwt.verify(req.session.token, 'shhhhh', (err, decoded) => {
            if (!err) {
                if (decoded = process.env.PASSWORD) {
                    res.render("view", {})
                }
            }else{
                res.render("login", { err: "" })
            }
        })
    }
}


module.exports = new homeController();