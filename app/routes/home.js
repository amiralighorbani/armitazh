const express = require("express");
const router = express.Router();

const homeController = require("app/http/contorollers/homeController");



router.get("/", homeController.index.bind(homeController));
router.get("/settings", homeController.setting.bind(homeController));
router.get("/tv", homeController.tv.bind(homeController));
router.get("/login", homeController.login.bind(homeController));
router.get("/tv/:name", homeController.tvEdit.bind(homeController));
router.get("/category", homeController.category.bind(homeController));
router.get("/video", homeController.video.bind(homeController));
router.get("/view", homeController.view.bind(homeController));

module.exports = router;