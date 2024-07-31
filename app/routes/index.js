const express = require("express");
const router = express.Router();

const homeRouter = require("app/routes/home");
const apiRouter = require("app/routes/api");


router.use("/", homeRouter);
router.use("/api", apiRouter);

module.exports = router;
