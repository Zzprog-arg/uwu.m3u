// Parser M3U simple para canales de TV (sin export, vanilla JS)
class M3UParser {
  constructor() {
    this.categories = new Map()
  }

  detectContentType(movie) {
    const url = movie.url.toLowerCase()
    const title = movie.title.toLowerCase()

    const seriesPatterns = [
      /s\d{1,2}e\d{1,2}/i,
      /s\d{1,2}\s+e\d{1,2}/i,
      /season\s*\d+/i,
      /temporada\s*\d+/i,
      /capitulo\s*\d+/i,
      /episodio\s*\d+/i,
    ]

    if (seriesPatterns.some((p) => p.test(title) || p.test(url))) return "series"

    const movieExt = [".mp4", ".ts", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm"]
    if (movieExt.some((ext) => url.endsWith(ext))) return "movies"

    return "tv"
  }

  parseExtinf(line) {
    const movie = {
      title: "",
      category: "Sin Categoría",
      group: "",
      logo: "",
      url: "",
      contentType: "tv",
    }

    const tMatch = line.match(/,(.+)$/)
    if (tMatch) movie.title = tMatch[1].trim()

    const gMatch = line.match(/group-title="([^"]+)"/i)
    if (gMatch) {
      movie.category = gMatch[1].trim()
      movie.group = movie.category
    }

    const lMatch = line.match(/tvg-logo="([^"]+)"/i)
    if (lMatch) movie.logo = lMatch[1].trim()

    return movie
  }

  addMovieToCategory(movie) {
    if (!this.categories.has(movie.category)) {
      this.categories.set(movie.category, [])
    }
    this.categories.get(movie.category).push(movie)
  }

  parse(text) {
    const lines = text.split("\n").map((s) => s.trim())
    let current = null

    for (const line of lines) {
      if (line.startsWith("#EXTINF:")) {
        current = this.parseExtinf(line)
      } else if (current && line && !line.startsWith("#")) {
        current.url = line
        current.contentType = this.detectContentType(current)
        this.addMovieToCategory(current)
        current = null
      }
    }

    // Retornar todos los canales (principalmente TV)
    const channels = []
    this.categories.forEach((arr, cat) => {
      arr.forEach((m) => {
        channels.push({ nombre: m.title || cat, url: m.url, logo: m.logo })
      })
    })

    return channels
  }
}

window.M3UParser = M3UParser
