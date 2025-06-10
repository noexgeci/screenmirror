"use client"

import { useState, useRef, useEffect } from "react"
import { Square, Maximize, Minimize, Smartphone, Wifi, WifiOff, ExternalLink, Camera, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Component() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [streamType, setStreamType] = useState<"screen" | "camera" | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Check if we're in an embedded environment
    const embedded = window.self !== window.top
    setIsEmbedded(embedded)

    // Check if Screen Capture API is supported
    if (!navigator.mediaDevices) {
      setIsSupported(false)
      setError("Media devices are not supported in this browser")
    }
  }, [])

  const openInNewTab = () => {
    const url = window.location.href
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const startScreenShare = async () => {
    try {
      setError(null)

      // Check if we're in a secure context
      if (!window.isSecureContext) {
        throw new Error("Screen sharing requires a secure context (HTTPS)")
      }

      // If embedded, show instructions instead of attempting
      if (isEmbedded) {
        setError(
          "Screen sharing is blocked in embedded mode. Please open this page in a new tab to use screen mirroring.",
        )
        return
      }

      // Check if getDisplayMedia is available
      if (!navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen capture is not supported in this browser")
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
        setStreamType("screen")
      }

      // Handle stream ending (user stops sharing)
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopScreenShare()
      })
    } catch (err: any) {
      console.error("Error starting screen share:", err)
      handleScreenShareError(err)
    }
  }

  const startCameraShare = async () => {
    try {
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
        setStreamType("camera")
      }
    } catch (err: any) {
      console.error("Error starting camera share:", err)
      let errorMessage = "Failed to access camera. "

      if (err.name === "NotAllowedError") {
        errorMessage += "Camera permission was denied. Please allow camera access when prompted."
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera was found on this device."
      } else {
        errorMessage += err.message || "Please check your camera permissions."
      }

      setError(errorMessage)
    }
  }

  const handleScreenShareError = (err: any) => {
    let errorMessage = "Failed to start screen sharing. "

    if (err.name === "NotAllowedError") {
      errorMessage += "Permission was denied. Please allow screen sharing when prompted."
    } else if (err.name === "NotSupportedError") {
      errorMessage += "Screen sharing is not supported in this browser or context."
    } else if (err.name === "NotFoundError") {
      errorMessage += "No screen sharing source was found or selected."
    } else if (err.name === "AbortError") {
      errorMessage += "Screen sharing was cancelled by the user."
    } else if (err.message.includes("permissions policy") || err.message.includes("disallowed")) {
      errorMessage =
        "Screen sharing is blocked by browser security policy. This usually happens when the page is embedded. Please open this page in a new tab to use screen mirroring."
    } else if (err.message.includes("secure context")) {
      errorMessage += err.message
    } else {
      errorMessage += err.message || "Please try opening this page in a new tab."
    }

    setError(errorMessage)
  }

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setStreamType(null)
    if (isFullscreen) {
      exitFullscreen()
    }
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (videoRef.current?.requestFullscreen) {
        videoRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      exitFullscreen()
    }
  }

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
    setIsFullscreen(false)
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <WifiOff className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Not Supported</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Media devices are not supported in this browser. Please use a modern browser like Chrome, Firefox, or
              Safari.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Screen Mirror</h1>
              <p className="text-sm text-gray-500">
                {streamType === "screen"
                  ? "Screen Mirroring"
                  : streamType === "camera"
                    ? "Camera View"
                    : "iOS Screen Mirroring"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isStreaming ? "default" : "secondary"} className="flex items-center gap-1">
              {isStreaming ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isStreaming ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Embedded Warning */}
        {isEmbedded && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <ExternalLink className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="flex items-center justify-between">
                <span>Screen mirroring works best in a new tab. Open this page directly for full functionality.</span>
                <Button
                  onClick={openInNewTab}
                  size="sm"
                  variant="outline"
                  className="ml-3 text-amber-700 border-amber-300"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open in New Tab
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <WifiOff className="w-3 h-3 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-red-600 text-sm font-medium mb-2">Connection Error</p>
                <p className="text-red-600 text-sm mb-3">{error}</p>

                {(error.includes("permissions policy") || error.includes("blocked") || error.includes("embedded")) && (
                  <Button onClick={openInNewTab} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open in New Tab
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Video Display */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${isStreaming ? "block" : "hidden"}`}
              />

              {!isStreaming && (
                <div className="text-center text-gray-400">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-12 h-12" />
                  </div>
                  <p className="text-lg font-medium mb-2">No Screen Connected</p>
                  <p className="text-sm">Start screen mirroring or camera view</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              {!isStreaming ? (
                <>
                  <Button onClick={startScreenShare} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    <Monitor className="w-4 h-4" />
                    Screen Mirror
                  </Button>
                  <Button onClick={startCameraShare} variant="outline" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Camera View
                  </Button>
                </>
              ) : (
                <Button onClick={stopScreenShare} variant="destructive" className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Stop {streamType === "screen" ? "Mirroring" : "Camera"}
                </Button>
              )}

              {isStreaming && (
                <Button onClick={toggleFullscreen} variant="outline" className="flex items-center gap-2">
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </Button>
              )}
            </div>

            {isEmbedded && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm font-medium mb-2">⚠️ Limited Functionality Detected</p>
                <p className="text-amber-700 text-sm">
                  Screen mirroring may be restricted in this environment. For best results, click "Open in New Tab"
                  above.
                </p>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-1">Screen Mirror:</h4>
                  <ol className="space-y-1 text-xs">
                    <li>1. Click "Screen Mirror" button</li>
                    <li>2. Select screen/window to share</li>
                    <li>3. View your screen in real-time</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Camera View:</h4>
                  <ol className="space-y-1 text-xs">
                    <li>1. Click "Camera View" button</li>
                    <li>2. Allow camera access</li>
                    <li>3. View camera feed</li>
                  </ol>
                </div>
              </div>

              <div className="border-t border-blue-200 pt-3 mt-3">
                <h4 className="font-medium text-blue-900 mb-2 text-xs">Troubleshooting:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>
                    • <strong>Screen sharing blocked?</strong> Open this page in a new tab
                  </li>
                  <li>
                    • <strong>No permissions?</strong> Allow access when browser prompts
                  </li>
                  <li>
                    • <strong>Not working?</strong> Try Camera View as alternative
                  </li>
                  <li>
                    • <strong>Best browsers:</strong> Chrome, Firefox, Safari, Edge
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
