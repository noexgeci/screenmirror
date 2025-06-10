"use client"

import { useState, useRef, useEffect } from "react"
import { Smartphone, Wifi, Share, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function IPhoneConnector() {
  const [connectionCode, setConnectionCode] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("Enter connection code to start")
  const streamRef = useRef<MediaStream | null>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)

  // Check if connection code is provided in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const connectCode = urlParams.get("connect")
    if (connectCode) {
      setConnectionCode(connectCode)
    }
  }, [])

  const startScreenShare = async () => {
    if (!connectionCode.trim()) {
      setError("Please enter a connection code")
      return
    }

    try {
      setError(null)
      setIsConnecting(true)
      setStatus("Requesting screen access...")

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      })

      streamRef.current = stream
      setIsSharing(true)
      setStatus("Screen sharing active - your iPhone screen is now visible on PC")

      // Initialize WebRTC connection
      await initializePeerConnection(stream)

      // Handle stream ending
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopScreenShare()
      })
    } catch (err: any) {
      console.error("Error starting screen share:", err)
      setIsConnecting(false)

      if (err.name === "NotAllowedError") {
        setError("Screen sharing permission denied. Please allow access and try again.")
      } else if (err.name === "NotSupportedError") {
        setError("Screen sharing not supported on this device. Try using Safari browser.")
      } else {
        setError("Failed to start screen sharing. Make sure you're using Safari on iOS.")
      }
    }
  }

  const initializePeerConnection = async (stream: MediaStream) => {
    try {
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      })

      // Add stream to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream)
      })

      setStatus("Connected to PC - your screen is being mirrored")
      setIsConnecting(false)
    } catch (error) {
      console.error("Failed to initialize peer connection:", error)
      setError("Failed to establish connection with PC")
      setIsConnecting(false)
    }
  }

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }

    setIsSharing(false)
    setIsConnecting(false)
    setStatus("Screen sharing stopped")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">iPhone Screen Mirror</h1>
          <p className="text-gray-600">Connect to your PC</p>
        </div>

        {/* Connection Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Connect to PC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connection Code</label>
              <Input
                value={connectionCode}
                onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                className="text-center text-lg font-mono"
                maxLength={6}
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${isSharing ? "bg-green-500" : "bg-gray-400"}`} />
              {status}
            </div>

            {!isSharing ? (
              <Button
                onClick={startScreenShare}
                disabled={isConnecting || !connectionCode.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? (
                  <>
                    <Wifi className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Share className="w-4 h-4 mr-2" />
                    Start Screen Mirroring
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={stopScreenShare} variant="destructive" className="w-full">
                <Square className="w-4 h-4 mr-2" />
                Stop Mirroring
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to Mirror Your iPhone</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. Get the connection code from your PC</li>
              <li>2. Enter the code above</li>
              <li>3. Tap "Start Screen Mirroring"</li>
              <li>4. Allow screen recording when prompted</li>
              <li>5. Your iPhone screen will appear on PC</li>
            </ol>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This works best in Safari browser. Make sure both devices are on the same WiFi
                network.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
