'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var fs_1 = require('fs')
var path_1 = require('path')
// video folder should be set before usage if it is incorrect
var PATH = {
  videoFolder: path_1.join(__dirname, '..', 'app', 'video'),
  logFolder: path_1.join(__dirname, 'logs'),
  lastCheckedFile: path_1.join(__dirname, 'logs', 'last_checked_times.txt'),
  movieCountFile: path_1.join(__dirname, 'logs', 'movie_count.txt'),
  logsFile: path_1.join(__dirname, 'logs', 'logs.txt'),
}
var Logger = /** @class */ (function () {
  function Logger() {
    this.logEnabled = false
  }
  Object.defineProperty(Logger.prototype, 'log', {
    set: function (value) {
      if (this.logEnabled && fs_1.existsSync(PATH.logsFile)) {
        var currentTime = new Date()
        var logs = fs_1.readFileSync(PATH.logsFile, 'utf8')
        logs += ''.concat(currentTime, ': ') + value + '\n'
        fs_1.writeFileSync(PATH.logsFile, logs)
      }
    },
    enumerable: false,
    configurable: true,
  })
  /** Create logs folder and last_checked_times.txt and movie_count.txt if not exists and set files' variables value to default. */
  Logger.prototype.initialize = function (options) {
    try {
      this.logEnabled = (
        options === null || options === void 0 ? void 0 : options.logEnable
      )
        ? true
        : false
      if (!fs_1.existsSync(PATH.logFolder)) {
        fs_1.mkdirSync(PATH.logFolder)
      }
      if (!fs_1.existsSync(PATH.logsFile)) {
        fs_1.writeFileSync(
          PATH.logsFile,
          ''.concat(new Date(), ': Log file created\n')
        )
      }
      if (!fs_1.existsSync(PATH.lastCheckedFile)) {
        this.lastCheckedReset()
      }
      if (!fs_1.existsSync(PATH.movieCountFile)) {
        this.movieCountReset()
      }
    } catch (error) {
      console.error(error)
    }
  }
  Logger.prototype.lastCheckedReset = function () {
    try {
      var currentDate = new Date().getTime()
      var initialDates = {
        initial: currentDate,
        day: currentDate,
        week: currentDate,
        month: currentDate,
      }
      fs_1.writeFileSync(PATH.lastCheckedFile, JSON.stringify(initialDates))
      this.log = 'last_checked_times.txt has been reset'
    } catch (error) {
      console.error(error)
      this.log =
        "There's something wrong in lastCheckedReset function: ".concat(error)
    }
  }
  Logger.prototype.movieCountReset = function () {
    try {
      fs_1.writeFileSync(PATH.movieCountFile, '')
      this.log = 'movie_count.txt has been reset'
    } catch (error) {
      console.error(error)
      this.log = "There's something wrong in movieCountReset function: ".concat(
        error
      )
    }
  }
  Logger.prototype.timeCheck = function (data) {
    var currentDate = new Date().getTime()
    var oneDayMillisec = 24 * 60 * 60 * 1000
    if (currentDate >= data.lastCheckedTimes.month + oneDayMillisec * 30) {
      this.log = ''
        .concat(data.name, ' Day: ')
        .concat(data.objToReset.day, ' --> ')
        .concat(data.resetAmount)
      this.log = ''
        .concat(data.name, ' Week: ')
        .concat(data.objToReset.week, ' --> ')
        .concat(data.resetAmount)
      this.log = ''
        .concat(data.name, ' Month: ')
        .concat(data.objToReset.month, ' --> ')
        .concat(data.resetAmount)
      data.objToReset.day = data.resetAmount
      data.objToReset.week = data.resetAmount
      data.objToReset.month = data.resetAmount
    } else if (currentDate >= data.lastCheckedTimes.week + oneDayMillisec * 7) {
      this.log = ''
        .concat(data.name, ' Day: ')
        .concat(data.objToReset.day, ' --> ')
        .concat(data.resetAmount)
      this.log = ''
        .concat(data.name, ' Week: ')
        .concat(data.objToReset.week, ' --> ')
        .concat(data.resetAmount)
      data.objToReset.day = data.resetAmount
      data.objToReset.week = data.resetAmount
    } else if (currentDate >= data.lastCheckedTimes.day + oneDayMillisec) {
      this.log = ''
        .concat(data.name, ' Day: ')
        .concat(data.objToReset.day, ' --> ')
        .concat(data.resetAmount)
      data.objToReset.day = data.resetAmount
    }
    this.log = 'Time has been checked for '.concat(data.name)
  }
  Object.defineProperty(Logger.prototype, 'isInitialized', {
    get: function () {
      if (
        fs_1.existsSync(PATH.logFolder) &&
        fs_1.existsSync(PATH.lastCheckedFile) &&
        fs_1.existsSync(PATH.movieCountFile) &&
        fs_1.existsSync(PATH.logsFile)
      ) {
        this.log = 'All files has been created successfully'
        return true
      } else {
        this.log = "Some files don't exist and hasn't been created"
        return false
      }
    },
    enumerable: false,
    configurable: true,
  })
  Logger.prototype.initialLogTemplate = function () {
    return [
      {
        movieName: '',
        count: {
          day: 0,
          week: 0,
          month: 0,
          total: 0,
        },
      },
    ]
  }
  /** Counts the dairy views provided by count and url variables. ( Search for video names based on the url provided in ./app/video ) */
  Logger.prototype.count = function (data, options) {
    var _this = this
    if (options === void 0) {
      options = {
        checkInitialization: true,
        localDb: undefined,
        checkTime: true,
        saveDb: true,
      }
    }
    try {
      if (
        (options === null || options === void 0
          ? void 0
          : options.checkInitialization) &&
        !this.isInitialized
      ) {
        console.error('Please first call "initialize" function')
        this.log = 'count function return 1 because of initialization error'
        return undefined
      }
      var lastCheckedTimes_1 = undefined
      this.log = 'count function called'
      if (options === null || options === void 0 ? void 0 : options.checkTime) {
        lastCheckedTimes_1 = JSON.parse(
          fs_1.readFileSync(PATH.lastCheckedFile, 'utf8')
        )
      }
      var movieLogs_1
      var dbLogs = void 0
      if (
        !(options === null || options === void 0 ? void 0 : options.localDb)
      ) {
        dbLogs = fs_1.readFileSync(PATH.movieCountFile, 'utf8')
      }
      if (options === null || options === void 0 ? void 0 : options.localDb) {
        movieLogs_1 = options.localDb
        this.log = 'Saved data are read from localDb'
      } else if (dbLogs) {
        movieLogs_1 = JSON.parse(dbLogs)
        this.log = 'Saved data are read from movie_count.txt'
      } else {
        movieLogs_1 = []
        this.log = 'There is no saved data'
      }
      var checkedMovieNames_1 = []
      data === null || data === void 0
        ? void 0
        : data.forEach(function (item) {
            var filename = item.url.replace('m3u8', 'txt')
            var movieNames = fs_1
              .readFileSync(path_1.join(PATH.videoFolder, filename), 'utf8')
              .split('\n')
            movieNames.forEach(function (movieName) {
              var _a
              var existingMovieIndex = movieLogs_1.findIndex(function (log) {
                return log.movieName === movieName
              })
              var movieIndex
              // set log variables count or push new
              if (existingMovieIndex >= 0) {
                movieLogs_1[existingMovieIndex].count.day += item.counts
                movieLogs_1[existingMovieIndex].count.week += item.counts
                movieLogs_1[existingMovieIndex].count.month += item.counts
                movieLogs_1[existingMovieIndex].count.total += item.counts
                _this.log = 'Movie '.concat(
                  movieName,
                  ' information has been updated'
                )
                movieIndex = existingMovieIndex
              } else {
                movieLogs_1.push({
                  movieName: movieName,
                  count: {
                    day: item.counts,
                    week: item.counts,
                    month: item.counts,
                    total: item.counts,
                  },
                })
                _this.log = 'A new movie called '.concat(
                  movieName,
                  ' has been created'
                )
                movieIndex = movieLogs_1.length - 1
              }
              // check the time that is passed the limit or not for movies
              if (
                lastCheckedTimes_1 &&
                !((_a = checkedMovieNames_1.find(function (checkedMovieName) {
                  return checkedMovieName === movieName
                })) === null || _a === void 0
                  ? void 0
                  : _a.length)
              ) {
                _this.timeCheck({
                  objToReset: movieLogs_1[movieIndex].count,
                  resetAmount: item.counts,
                  lastCheckedTimes: lastCheckedTimes_1,
                  name: movieName,
                })
              }
              if (
                !checkedMovieNames_1.find(function (checkedMovieName) {
                  return checkedMovieName === movieName
                })
              ) {
                checkedMovieNames_1.push(movieName)
                _this.log = 'Movie '.concat(
                  movieName,
                  ' has been inserted to checked movies list'
                )
              }
            })
          })
      // check the time that is passed the limit or not for last checked times
      if (lastCheckedTimes_1) {
        this.timeCheck({
          objToReset: lastCheckedTimes_1,
          resetAmount: new Date().getTime(),
          lastCheckedTimes: lastCheckedTimes_1,
          name: 'last_checked_times.txt',
        })
      }
      // save
      if (options === null || options === void 0 ? void 0 : options.checkTime) {
        fs_1.writeFileSync(
          PATH.lastCheckedFile,
          JSON.stringify(lastCheckedTimes_1)
        )
        this.log = 'last_checked_times.txt has been updated'
      }
      if (options === null || options === void 0 ? void 0 : options.saveDb) {
        fs_1.writeFileSync(PATH.movieCountFile, JSON.stringify(movieLogs_1))
        this.log = 'movie_count.txt has been updated'
      }
      this.log = 'count function finished successfully'
      return movieLogs_1.filter(function (movie) {
        return movie.movieName.trim() !== ''
      })
    } catch (err) {
      console.error(err)
      this.log = "There's something wrong in count function: ".concat(err)
    }
  }
  /** Reset the data file based on filename provided. ( For reseting all files just write 'all' or keep parameters field empty ) */
  Logger.prototype.reset = function (filename) {
    if (filename === void 0) {
      filename = 'all'
    }
    try {
      if (!this.isInitialized) {
        console.error('Please first call "initialize" function')
        this.log = 'reset function return 1 because of initialization error'
        return
      }
      var actualFilename = filename.replace('.txt', '')
      this.log = 'reset function called'
      switch (actualFilename) {
        case 'all':
          this.lastCheckedReset()
          this.movieCountReset()
          break
        case 'last_checked_times':
          this.lastCheckedReset()
          break
        case 'movie_count':
          this.movieCountReset()
          break
        default:
          console.error('Invalid filename')
          this.log = 'reset function return 1 because of invalid filename'
          return
      }
      this.log = 'reset function finished successfully'
    } catch (err) {
      console.error(err)
      this.log = "There's something wrong in reset function: ".concat(err)
    }
  }
  return Logger
})()
exports.default = new Logger()
