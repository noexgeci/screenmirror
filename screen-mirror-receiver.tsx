"use client"

import { useState, useRef, useEffect } from "react"
import { Smartphone, Wifi, WifiOff, QrCode, Copy, Check, RefreshCw, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

export default function Component() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionCode, setConnectionCode] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>("Waiting for connection...")

  // Generate connection code and QR code
  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setConnectionCode(code)

    // Create connection URL
    const currentUrl = window.location.origin + window.location.pathname
    const connectionUrl = `${currentUrl}?connect=${code}`

    // Generate QR code URL (using a free QR code API)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(connectionUrl)}`
    setQrCodeUrl(qrUrl)
  }, [])

  // Initialize WebRTC
  useEffect(() => {
    initializeWebRTC()
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close()
      }
    }
  }, [])

  const initializeWebRTC = async () => {
    try {
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      peerConnection.current.oniceconnectionstatechange = () => {
        const state = peerConnection.current?.iceConnectionState
        setConnectionStatus(`Connection state: ${state}`)

        if (state === "connected" || state === "completed") {
          setIsConnected(true)
          setConnectionStatus("iPhone connected successfully!")
        } else if (state === "disconnected" || state === "failed") {
          setIsConnected(false)
          setConnectionStatus("Connection lost. Please reconnect.")
        }
      }

      peerConnection.current.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0]
          setIsConnected(true)
          setConnectionStatus("Receiving iPhone screen...")
        }
      }

      setIsListening(true)
    } catch (error) {
      console.error("Failed to initialize WebRTC:", error)
      setConnectionStatus("Failed to initialize connection")
    }
  }

  const copyConnectionCode = async () => {
    try {
      const connectionUrl = `${window.location.origin}${window.location.pathname}?connect=${connectionCode}`
      await navigator.clipboard.writeText(connectionUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const refreshConnection = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">iPhone Screen Mirror</h1>
              <p className="text-sm text-gray-500">Mirror your iPhone to this PC</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? "iPhone Connected" : "Waiting for iPhone"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Connection Instructions */}
        {!isConnected && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Connect Your iPhone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code Method */}
                <div className="text-center">
                  <h3 className="font-semibold mb-3">Method 1: Scan QR Code</h3>
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl || "/placeholder.svg"} alt="Connection QR Code" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Open Camera app on iPhone and scan this QR code</p>
                </div>

                {/* Manual Connection */}
                <div>
                  <h3 className="font-semibold mb-3">Method 2: Manual Connection</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Connection Code:</label>
                      <div className="flex gap-2 mt-1">
                        <Input value={connectionCode} readOnly className="font-mono text-lg text-center" />
                        <Button onClick={copyConnectionCode} variant="outline" size="icon">
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-2">
                      <p>
                        <strong>Step 1:</strong> Open Safari on your iPhone
                      </p>
                      <p>
                        <strong>Step 2:</strong> Go to this website:{" "}
                        <code className="bg-gray-100 px-1 rounded">{window.location.host}</code>
                      </p>
                      <p>
                        <strong>Step 3:</strong> Enter the connection code above
                      </p>
                      <p>
                        <strong>Step 4:</strong> Follow the screen sharing prompts
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Important:</strong> Both devices must be on the same WiFi network for optimal performance.
                  Make sure to allow camera/screen permissions when prompted on your iPhone.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Video Display */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-contain ${isConnected ? "block" : "hidden"}`}
              />

              {!isConnected && (
                <div className="text-center text-gray-400">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-12 h-12" />
                  </div>
                  <p className="text-lg font-medium mb-2">Waiting for iPhone Connection</p>
                  <p className="text-sm">{connectionStatus}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status and Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connection Status</span>
              <Button onClick={refreshConnection} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-sm">{connectionStatus}</span>
            </div>

            {/* Troubleshooting */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Troubleshooting Tips:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ensure both devices are on the same WiFi network</li>
                <li>• Allow camera/microphone permissions on iPhone when prompted</li>
                <li>• Try refreshing the page if connection fails</li>
                <li>• Use Safari browser on iPhone for best compatibility</li>
                <li>• Check that your network allows peer-to-peer connections</li>
              </ul>
            </div>

            {/* Alternative Methods */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Alternative Screen Mirroring Options:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • <strong>AirPlay:</strong> Use built-in AirPlay to Apple TV or AirPlay-compatible devices
                </li>
                <li>
                  • <strong>Lightning to HDMI:</strong> Use Apple's Lightning Digital AV Adapter
                </li>
                <li>
                  • <strong>Third-party apps:</strong> Try apps like Reflector, AirServer, or LonelyScreen
                </li>
                <li>
                  • <strong>QuickTime:</strong> Connect iPhone via USB and use QuickTime Player on Mac
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
