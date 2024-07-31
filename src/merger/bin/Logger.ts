import fs from 'fs'
import path from 'path'

// video folder should be set before usage if it is incorrect
const PATH = {
  videoFolder: path.join(__dirname, '..', 'app', 'video'),
  logFolder: path.join(__dirname, 'logs'),
  lastCheckedFile: path.join(__dirname, 'logs', 'last_checked_times.txt'),
  movieCountFile: path.join(__dirname, 'logs', 'movie_count.txt'),
  logsFile: path.join(__dirname, 'logs', 'logs.txt'),
}

interface DateCount {
  day: number
  week: number
  month: number
  total: number
}

interface OutputLog {
  movieName: string
  count: DateCount
}

interface LastTimeCheckLog {
  initial: number
  day: number
  week: number
  month: number
}

class Logger {
  private logEnabled: boolean = false

  private set log(value: string) {
    if (this.logEnabled && fs.existsSync(PATH.logsFile)) {
      const currentTime = new Date()
      let logs = fs.readFileSync(PATH.logsFile, 'utf8')
      logs += `${currentTime}: ` + value + '\n'
      fs.writeFileSync(PATH.logsFile, logs)
    }
  }

  /** Create logs folder and last_checked_times.txt and movie_count.txt if not exists and set files' variables value to default. */
  public initialize(options?: { logEnable?: boolean }) {
    try {
      this.logEnabled = options?.logEnable ? true : false

      if (!fs.existsSync(PATH.logFolder)) {
        fs.mkdirSync(PATH.logFolder)
      }

      if (!fs.existsSync(PATH.logsFile)) {
        fs.writeFileSync(PATH.logsFile, `${new Date()}: Log file created\n`)
      }

      if (!fs.existsSync(PATH.lastCheckedFile)) {
        this.lastCheckedReset()
      }

      if (!fs.existsSync(PATH.movieCountFile)) {
        this.movieCountReset()
      }
    } catch (error) {
      console.error(error)
    }
  }

  private lastCheckedReset() {
    try {
      const currentDate = new Date().getTime()

      const initialDates: LastTimeCheckLog = {
        initial: currentDate,
        day: currentDate,
        week: currentDate,
        month: currentDate,
      }

      fs.writeFileSync(PATH.lastCheckedFile, JSON.stringify(initialDates))

      this.log = 'last_checked_times.txt has been reset'
    } catch (error) {
      console.error(error)
      this.log = `There's something wrong in lastCheckedReset function: ${error}`
    }
  }

  private movieCountReset() {
    try {
      fs.writeFileSync(PATH.movieCountFile, '')

      this.log = 'movie_count.txt has been reset'
    } catch (error) {
      console.error(error)
      this.log = `There's something wrong in movieCountReset function: ${error}`
    }
  }

  private timeCheck(data: {
    objToReset: { day: number; week: number; month: number }
    resetAmount: number
    lastCheckedTimes: LastTimeCheckLog
    name: string
  }) {
    const currentDate = new Date().getTime()
    const oneDayMillisec = 24 * 60 * 60 * 1000

    if (currentDate >= data.lastCheckedTimes.month + oneDayMillisec * 30) {
      this.log = `${data.name} Day: ${data.objToReset.day} --> ${data.resetAmount}`
      this.log = `${data.name} Week: ${data.objToReset.week} --> ${data.resetAmount}`
      this.log = `${data.name} Month: ${data.objToReset.month} --> ${data.resetAmount}`

      data.objToReset.day = data.resetAmount
      data.objToReset.week = data.resetAmount
      data.objToReset.month = data.resetAmount
    } else if (currentDate >= data.lastCheckedTimes.week + oneDayMillisec * 7) {
      this.log = `${data.name} Day: ${data.objToReset.day} --> ${data.resetAmount}`
      this.log = `${data.name} Week: ${data.objToReset.week} --> ${data.resetAmount}`

      data.objToReset.day = data.resetAmount
      data.objToReset.week = data.resetAmount
    } else if (currentDate >= data.lastCheckedTimes.day + oneDayMillisec) {
      this.log = `${data.name} Day: ${data.objToReset.day} --> ${data.resetAmount}`

      data.objToReset.day = data.resetAmount
    }

    this.log = `Time has been checked for ${data.name}`
  }

  private get isInitialized() {
    if (
      fs.existsSync(PATH.logFolder) &&
      fs.existsSync(PATH.lastCheckedFile) &&
      fs.existsSync(PATH.movieCountFile) &&
      fs.existsSync(PATH.logsFile)
    ) {
      this.log = 'All files has been created successfully'
      return true
    } else {
      this.log = `Some files don't exist and hasn't been created`
      return false
    }
  }

  public initialLogTemplate() {
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
    ] as OutputLog[]
  }

  /** Counts the dairy views provided by count and url variables. ( Search for video names based on the url provided in ./app/video ) */
  public count(
    data: { url: string; counts: number }[] | null,
    options: {
      checkInitialization?: boolean
      localDb?: OutputLog[]
      checkTime?: boolean
      saveDb?: boolean
    } = {
      checkInitialization: true,
      localDb: undefined,
      checkTime: true,
      saveDb: true,
    }
  ) {
    try {
      if (options?.checkInitialization && !this.isInitialized) {
        console.error('Please first call "initialize" function')
        this.log = 'count function return 1 because of initialization error'
        return undefined
      }

      let lastCheckedTimes: LastTimeCheckLog | undefined = undefined
      this.log = 'count function called'

      if (options?.checkTime) {
        lastCheckedTimes = JSON.parse(
          fs.readFileSync(PATH.lastCheckedFile, 'utf8')
        )
      }

      let movieLogs: OutputLog[]
      let dbLogs: string | undefined

      if (!options?.localDb) {
        dbLogs = fs.readFileSync(PATH.movieCountFile, 'utf8')
      }

      if (options?.localDb) {
        movieLogs = options.localDb
        this.log = 'Saved data are read from localDb'
      } else if (dbLogs) {
        movieLogs = JSON.parse(dbLogs)
        this.log = 'Saved data are read from movie_count.txt'
      } else {
        movieLogs = []
        this.log = 'There is no saved data'
      }

      const checkedMovieNames: string[] = []

      data?.forEach((item) => {
        const filename = item.url.replace('m3u8', 'txt')

        const movieNames = fs
          .readFileSync(path.join(PATH.videoFolder, filename), 'utf8')
          .split('\n')

        movieNames.forEach((movieName) => {
          const existingMovieIndex = movieLogs.findIndex(
            (log) => log.movieName === movieName
          )

          let movieIndex: number

          // set log variables count or push new
          if (existingMovieIndex >= 0) {
            movieLogs[existingMovieIndex].count.day += item.counts
            movieLogs[existingMovieIndex].count.week += item.counts
            movieLogs[existingMovieIndex].count.month += item.counts
            movieLogs[existingMovieIndex].count.total += item.counts

            this.log = `Movie ${movieName} information has been updated`
            movieIndex = existingMovieIndex
          } else {
            movieLogs.push({
              movieName: movieName,
              count: {
                day: item.counts,
                week: item.counts,
                month: item.counts,
                total: item.counts,
              },
            })

            this.log = `A new movie called ${movieName} has been created`
            movieIndex = movieLogs.length - 1
          }

          // check the time that is passed the limit or not for movies
          if (
            lastCheckedTimes &&
            !checkedMovieNames.find(
              (checkedMovieName) => checkedMovieName === movieName
            )?.length
          ) {
            this.timeCheck({
              objToReset: movieLogs[movieIndex].count,
              resetAmount: item.counts,
              lastCheckedTimes,
              name: movieName,
            })
          }

          if (
            !checkedMovieNames.find(
              (checkedMovieName) => checkedMovieName === movieName
            )
          ) {
            checkedMovieNames.push(movieName)
            this.log = `Movie ${movieName} has been inserted to checked movies list`
          }
        })
      })

      // check the time that is passed the limit or not for last checked times
      if (lastCheckedTimes) {
        this.timeCheck({
          objToReset: lastCheckedTimes,
          resetAmount: new Date().getTime(),
          lastCheckedTimes,
          name: 'last_checked_times.txt',
        })
      }

      // save
      if (options?.checkTime) {
        fs.writeFileSync(PATH.lastCheckedFile, JSON.stringify(lastCheckedTimes))
        this.log = 'last_checked_times.txt has been updated'
      }

      if (options?.saveDb) {
        fs.writeFileSync(PATH.movieCountFile, JSON.stringify(movieLogs))
        this.log = 'movie_count.txt has been updated'
      }

      this.log = 'count function finished successfully'
      return movieLogs.filter((movie) => movie.movieName.trim() !== '')
    } catch (err) {
      console.error(err)
      this.log = `There's something wrong in count function: ${err}`
    }
  }

  /** Reset the data file based on filename provided. ( For reseting all files just write 'all' or keep parameters field empty ) */
  public reset(
    filename: 'all' | 'last_checked_times.txt' | 'movie_count.txt' = 'all'
  ) {
    try {
      if (!this.isInitialized) {
        console.error('Please first call "initialize" function')
        this.log = 'reset function return 1 because of initialization error'
        return
      }

      const actualFilename = filename.replace('.txt', '')
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
      this.log = `There's something wrong in reset function: ${err}`
    }
  }
}

export default new Logger()
