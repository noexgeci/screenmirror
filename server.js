// Simplified AirPlay Server for demonstration
const http = require("http")
const dgram = require("dgram")

class SimpleAirPlayServer {
  constructor(deviceName = "My MacBook Pro", port = 7000) {
    this.deviceName = deviceName
    this.port = port
    this.server = null
    this.mdnsSocket = null
  }

  start() {
    console.log(`🚀 Starting AirPlay server "${this.deviceName}" on port ${this.port}`)

    // Create HTTP server
    this.server = http.createServer((req, res) => {
      console.log(`📱 ${req.method} ${req.url}`)

      if (req.url === "/server-info") {
        res.writeHead(200, { "Content-Type": "text/plain" })
        res.end("AirPlay Server Info")
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    this.server.listen(this.port, () => {
      console.log(`✅ AirPlay server listening on port ${this.port}`)
      this.advertiseMDNS()
    })
  }

  advertiseMDNS() {
    console.log(`📡 Advertising "${this.deviceName}" via mDNS`)

    // Create mDNS socket
    this.mdnsSocket = dgram.createSocket("udp4")

    this.mdnsSocket.bind(5353, () => {
      this.mdnsSocket.addMembership("224.0.0.251")
      console.log(`✨ "${this.deviceName}" is now discoverable on your network`)
      console.log("📱 Your iPhone should see this device in Screen Mirroring options")
    })
  }

  stop() {
    if (this.server) {
      this.server.close()
      console.log("🛑 AirPlay server stopped")
    }

    if (this.mdnsSocket) {
      this.mdnsSocket.close()
      console.log("📡 mDNS advertisement stopped")
    }
  }
}

// Export for use in main application
module.exports = SimpleAirPlayServer

// Run standalone if called directly
if (require.main === module) {
  const server = new SimpleAirPlayServer()
  server.start()

  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...")
    server.stop()
    process.exit(0)
  })
}
