const express = require("express");
const router = express.Router();
const multer = require('multer');

//MIDELWARE
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/videos");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})
const videoUpload = multer({ storage: videoStorage });

const videosStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "app/videos");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})
const videosUpload = multer({ storage: videosStorage });


//CONTROLLER
const apiController = require("app/http/contorollers/apiController");

//ROUTES

//SHOW VERSION.JSON
router.get('/', apiController.version.bind(apiController))
//GET A CLIENT JSON AND REPLACE IN VERSION.JSON
router.post('/version/update', apiController.versionUpdate.bind(apiController))
//
router.post('/update', apiController.update.bind(apiController))
//SHOW GROUP.JSON
router.get('/version', apiController.versions.bind(apiController))
//SHOW ALL VIDEO
router.get('/videos', apiController.videos.bind(apiController))
//SHOW SELECTED VIDEO BY NAME
router.get('/video/:id', apiController.video.bind(apiController))
//ADD VIDEO
router.post('/video/add', videosUpload.single('video'), apiController.add.bind(apiController))
//DELETE VIDEO
router.get('/video/delete/:id', apiController.delete.bind(apiController))
//SHOW PICTURE
router.get('/tv/pic/:id', apiController.picture.bind(apiController))
//UPDATE A TV
router.post('/tv/update/:id', apiController.tvUpdate.bind(apiController))
//ADD COUSTOM VIDEO FOR COUSTOM TV
router.post('/tv/video/add', apiController.tvVideoAdd.bind(apiController))
//DELETE COUSTOM VIDEO FOR COUSTOM TV
router.post('/tv/video/delete', apiController.tvVideoDelete.bind(apiController))
//ADD CATEGORY
router.post('/category/add', apiController.addCat.bind(apiController))
//DELETE CATEGORY
router.post('/category/delete', apiController.deleteCat.bind(apiController))
//EDIT CATEGORY NAME
router.post('/category/edit', apiController.editCat.bind(apiController))
//ADD VIDEO IN CATEGORY
router.post('/category/video/add', apiController.addVideoCat.bind(apiController))
//DELETE VIDEO IN CATEGORY
router.post('/category/video/delete', apiController.deleteVideoCat.bind(apiController))
//LOGIN
router.post('/users', apiController.users.bind(apiController))
//LOGOUT
router.get('/logout', apiController.logout.bind(apiController))

module.exports = router;
