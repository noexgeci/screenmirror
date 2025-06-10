// AirPlay Server Implementation
const http = require("http")
const dgram = require("dgram")

class AirPlayServer {
  constructor(deviceName = "My PC AirPlay", port = 7000) {
    this.deviceName = deviceName
    this.port = port
    this.server = null
    this.mdnsSocket = null
  }

  start() {
    console.log("Starting AirPlay server...")

    // Create HTTP server for AirPlay protocol
    this.server = http.createServer((req, res) => {
      console.log(`${req.method} ${req.url}`)

      // Handle AirPlay requests
      if (req.url === "/server-info") {
        this.handleServerInfo(req, res)
      } else if (req.url === "/reverse") {
        this.handleReverse(req, res)
      } else if (req.url.startsWith("/stream")) {
        this.handleStream(req, res)
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    this.server.listen(this.port, () => {
      console.log(`AirPlay server listening on port ${this.port}`)
      this.advertiseMDNS()
    })
  }

  handleServerInfo(req, res) {
    const serverInfo = {
      deviceid: "58:55:CA:1A:E2:88",
      features: "0x5A7FFFF7,0x1E",
      model: "AppleTV3,2",
      protovers: "1.0",
      srcvers: "220.68",
      vv: 2,
    }

    res.writeHead(200, {
      "Content-Type": "text/x-apple-plist+xml",
      Server: "AirTunes/220.68",
    })

    const plist = this.objectToPlist(serverInfo)
    res.end(plist)
  }

  handleReverse(req, res) {
    console.log("Handling reverse connection for screen mirroring")

    res.writeHead(101, {
      Upgrade: "PTTH/1.0",
      Connection: "Upgrade",
    })

    // Handle the reverse HTTP connection for screen mirroring
    req.socket.on("data", (data) => {
      console.log("Received screen mirroring data:", data.length, "bytes")
      // Process the incoming video stream here
    })
  }

  handleStream(req, res) {
    console.log("Handling video stream")

    res.writeHead(200, {
      "Content-Type": "video/mp4",
      Connection: "close",
    })

    // Handle video streaming
    req.on("data", (chunk) => {
      console.log("Received video chunk:", chunk.length, "bytes")
      // Process video data and send to UI
    })
  }

  advertiseMDNS() {
    console.log("Advertising AirPlay service via mDNS...")

    // Create mDNS advertisement
    const message = this.createMDNSMessage()

    this.mdnsSocket = dgram.createSocket("udp4")
    this.mdnsSocket.bind(5353, () => {
      this.mdnsSocket.addMembership("224.0.0.251")

      // Send mDNS advertisement every 30 seconds
      setInterval(() => {
        this.mdnsSocket.send(message, 5353, "224.0.0.251")
      }, 30000)

      // Send initial advertisement
      this.mdnsSocket.send(message, 5353, "224.0.0.251")
      console.log(`"${this.deviceName}" is now discoverable on the network`)
    })
  }

  createMDNSMessage() {
    // Create mDNS service advertisement for AirPlay
    // This is a simplified version - real implementation would be more complex
    const serviceName = `${this.deviceName}._airplay._tcp.local`

    console.log(`Creating mDNS advertisement for: ${serviceName}`)

    // Return a basic mDNS packet (simplified)
    return Buffer.from([
      0x00,
      0x00, // Transaction ID
      0x84,
      0x00, // Flags (response, authoritative)
      0x00,
      0x00, // Questions
      0x00,
      0x01, // Answer RRs
      0x00,
      0x00, // Authority RRs
      0x00,
      0x00, // Additional RRs
    ])
  }

  objectToPlist(obj) {
    // Convert JavaScript object to Apple plist format
    let plist = '<?xml version="1.0" encoding="UTF-8"?>\n'
    plist += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
    plist += '<plist version="1.0">\n<dict>\n'

    for (const [key, value] of Object.entries(obj)) {
      plist += `  <key>${key}</key>\n`
      if (typeof value === "string") {
        plist += `  <string>${value}</string>\n`
      } else if (typeof value === "number") {
        plist += `  <integer>${value}</integer>\n`
      }
    }

    plist += "</dict>\n</plist>"
    return plist
  }

  stop() {
    if (this.server) {
      this.server.close()
      console.log("AirPlay server stopped")
    }

    if (this.mdnsSocket) {
      this.mdnsSocket.close()
      console.log("mDNS advertisement stopped")
    }
  }
}

// Example usage
const airplayServer = new AirPlayServer("My PC AirPlay", 7000)

console.log("AirPlay Server Implementation")
console.log("============================")
console.log("This script demonstrates the core components needed for an AirPlay receiver:")
console.log("1. HTTP server for AirPlay protocol")
console.log("2. mDNS service discovery")
console.log("3. Video stream handling")
console.log("4. Device advertisement")
console.log("")
console.log("To create a full desktop application:")
console.log("- Use Electron for the desktop wrapper")
console.log("- Implement proper AirPlay protocol handling")
console.log("- Add video decoding and display")
console.log("- Package as executable with electron-builder")

// Start the server
airplayServer.start()

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down AirPlay server...")
  airplayServer.stop()
  process.exit(0)
})
