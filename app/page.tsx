"use client"

import { useEffect, useState } from "react"
import ScreenMirrorReceiver from "../screen-mirror-receiver"
import IPhoneConnector from "../iphone-connector"

export default function Page() {
  const [isIPhone, setIsIPhone] = useState(false)

  useEffect(() => {
    // Detect if user is on iPhone
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    setIsIPhone(isIOS)
  }, [])

  // Show iPhone connector for iOS devices, PC receiver for others
  return isIPhone ? <IPhoneConnector /> : <ScreenMirrorReceiver />
}
