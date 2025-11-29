// IPTV Player - Descarga M3U y reproduce canales con flechas arriba/abajo
const PLAYLIST_URL = "https://raw.githubusercontent.com/Zzprog-arg/uwu.m3u/604d43ff9a62febcb1d3679acd4d23b2ba19dc82/lista.m3u"

// M3UParser and Hls are loaded via script tags in index.html

class IPTVPlayer {
  constructor() {
    this.channels = []
    this.currentIndex = 0
    this.hls = null
    this.infoTimeout = null

    // Elementos del DOM
    this.video = document.getElementById("player")
    this.numEl = document.getElementById("num")
    this.nameEl = document.getElementById("name")
    this.loadingEl = document.getElementById("loading")
    this.toastEl = document.getElementById("toast")
    this.infoEl = document.getElementById("info")

    this.init()
  }

  async init() {
    this.showLoading(true)
    await this.loadPlaylist()
    this.setupKeyboardControls()
    this.setupVideoEvents()
  }

  showLoading(show) {
    if (show) {
      this.loadingEl.classList.remove("hidden")
    } else {
      this.loadingEl.classList.add("hidden")
    }
  }

  showToast(message, duration = 2000) {
    this.toastEl.textContent = message
    this.toastEl.classList.add("visible")
    setTimeout(() => {
      this.toastEl.classList.remove("visible")
    }, duration)
  }

  showInfo() {
    this.infoEl.classList.remove("hidden")
    // Ocultar info después de 4 segundos
    clearTimeout(this.infoTimeout)
    this.infoTimeout = setTimeout(() => {
      this.infoEl.classList.add("hidden")
    }, 4000)
  }

  async loadPlaylist() {
    try {
      this.loadingEl.textContent = "Descargando lista de canales..."

      const response = await fetch(PLAYLIST_URL)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const text = await response.text()

      const parser = new window.M3UParser()
      this.channels = parser.parse(text)

      if (this.channels.length === 0) {
        throw new Error("No se encontraron canales en la lista")
      }

      console.log(`[IPTV] Cargados ${this.channels.length} canales`)
      this.showLoading(false)
      this.playChannel(0)
    } catch (error) {
      console.error("[IPTV] Error cargando playlist:", error)
      this.loadingEl.textContent = `Error: ${error.message}`
    }
  }

  playChannel(index) {
    if (this.channels.length === 0) return

    // Asegurar que el índice esté en rango
    if (index < 0) index = this.channels.length - 1
    if (index >= this.channels.length) index = 0

    this.currentIndex = index
    const channel = this.channels[index]

    this.numEl.textContent = index + 1
    this.nameEl.textContent = channel.nombre
    this.showInfo()

    // Reproducir el stream
    this.playStream(channel.url)
  }

  playStream(url) {
    // Destruir instancia HLS anterior si existe
    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }

    // Verificar si es HLS (.m3u8)
    const isHLS = url.includes(".m3u8") || url.includes("m3u8")

    if (isHLS && window.Hls.isSupported()) {
      // Access Hls via window
      this.hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })

      this.hls.loadSource(url)
      this.hls.attachMedia(this.video)

      this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        this.video.play().catch((e) => console.log("[IPTV] Autoplay bloqueado:", e))
      })

      this.hls.on(window.Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("[IPTV] Error HLS fatal:", data)
          this.showToast("Error al cargar el canal")
        }
      })
    } else if (this.video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari nativo HLS
      this.video.src = url
      this.video.play().catch((e) => console.log("[IPTV] Autoplay bloqueado:", e))
    } else {
      // Stream directo (MP4, etc)
      this.video.src = url
      this.video.play().catch((e) => console.log("[IPTV] Autoplay bloqueado:", e))
    }
  }

  setupKeyboardControls() {
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          this.prevChannel()
          break

        case "ArrowDown":
          e.preventDefault()
          this.nextChannel()
          break

        case "ArrowLeft":
          e.preventDefault()
          // Retroceder 10 segundos
          this.video.currentTime = Math.max(0, this.video.currentTime - 10)
          this.showToast("-10s")
          break

        case "ArrowRight":
          e.preventDefault()
          // Adelantar 10 segundos
          this.video.currentTime += 10
          this.showToast("+10s")
          break

        case " ": // Espacio
          e.preventDefault()
          this.togglePlayPause()
          break

        case "m":
        case "M":
          e.preventDefault()
          this.toggleMute()
          break

        case "i":
        case "I":
          e.preventDefault()
          this.showInfo()
          break
      }
    })

    // También permitir clic en el video para mostrar info
    this.video.addEventListener("click", () => {
      this.showInfo()
    })
  }

  setupVideoEvents() {
    this.video.addEventListener("waiting", () => {
      this.loadingEl.textContent = "Cargando..."
      this.showLoading(true)
    })

    this.video.addEventListener("playing", () => {
      this.showLoading(false)
    })

    this.video.addEventListener("error", (e) => {
      console.error("[IPTV] Error de video:", e)
      this.showToast("Error al reproducir")
    })
  }

  nextChannel() {
    this.playChannel(this.currentIndex + 1)
  }

  prevChannel() {
    this.playChannel(this.currentIndex - 1)
  }

  togglePlayPause() {
    if (this.video.paused) {
      this.video.play()
      this.showToast("▶ Play")
    } else {
      this.video.pause()
      this.showToast("⏸ Pausa")
    }
  }

  toggleMute() {
    this.video.muted = !this.video.muted
    this.showToast(this.video.muted ? "🔇 Mute" : "🔊 Sonido")
  }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new IPTVPlayer()
})
