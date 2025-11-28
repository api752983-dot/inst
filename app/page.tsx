"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react" // Import useRef
import { Button } from "@/components/ui/button"
import {
  Camera,
  Flame,
  Facebook,
  CheckCircle,
  MessageCircle,
  Heart,
  Upload,
  ScanEye,
  User,
  Calendar,
  Beaker as Gender,
  Home,
  Compass,
  MessageSquare,
  X,
  Star,
  MapPin,
  Lock,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { fetchInstagramProfile, fetchInstagramPosts } from "@/lib/instagram-tracker"

const sanitizeUsername = (username: string): string => {
  let u = (username || "").trim()
  if (u.startsWith("@")) u = u.slice(1)
  u = u.toLowerCase()
  return u.replace(/[^a-z0-9._]/g, "")
}

const setAvatarLocalCache = (user: string, url: string) => {
  if (!user || !url) return
  try {
    const key = "igAvatarCacheV1"
    const cache = JSON.JSON.parse(localStorage.getItem(key) || "{}") || {}
    cache[user] = { url, ts: Date.now() }
    localStorage.setItem(key, JSON.stringify(cache))
    console.log("[v0] Cached Instagram avatar for:", user)
  } catch (e) {
    console.error("[v0] Error caching avatar:", e)
  }
}

const getAvatarFromCache = (user: string): string | null => {
  try {
    const key = "igAvatarCacheV1"
    const cache = JSON.parse(localStorage.getItem(key) || "{}") || {}
    if (cache[user] && cache[user].url) {
      console.log("[v0] Found cached avatar for:", user)
      return cache[user].url
    }
  } catch (e) {
    console.error("[v0] Error reading cache:", e)
  }
  return null
}

const setProfileLocalCache = (user: string, profile: any) => {
  if (!user || !profile) return
  try {
    const key = "igProfileCacheV1"
    const cache = JSON.parse(localStorage.getItem(key) || "{}") || {}
    cache[user] = { profile, ts: Date.now() }
    localStorage.setItem(key, JSON.stringify(cache))
    console.log("[v0] Cached Instagram profile for:", user)
  } catch (e) {
    console.error("[v0] Error caching profile:", e)
  }
}

const getProfileFromCache = (user: string): any | null => {
  try {
    const key = "igProfileCacheV1"
    const cache = JSON.parse(localStorage.getItem(key) || "{}") || {}
    if (cache[user] && cache[user].profile) {
      console.log("[v0] Found cached profile for:", user)
      return cache[user].profile
    }
  } catch (e) {
    console.error("[v0] Error reading cache:", e)
  }
  return null
}

export default function SpySystem() {
  // All state and functionality remains the same
  const [currentStage, setCurrentStage] = useState(0)
  const [showContent, setShowContent] = useState(true)
  const [fileName, setFileName] = useState<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [investigatedHandle, setInvestigatedHandle] = useState<string>("")
  const [investigatedAge, setInvestigatedAge] = useState<string>("")
  const [investigatedGender, setInvestigatedGender] = useState<string>("")
  const [investigatedLocation, setInvestigatedLocation] = useState<string>("")
  const [investigatedPhone, setInvestigatedPhone] = useState<string>("")
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisMessage, setAnalysisMessage] = useState("Initializing scan...")
  const [animationFrame, setAnimationFrame] = useState(0) // New state for animation frame
  const [timeLeft, setTimeLeft] = useState(10 * 60) // 10 minutes in seconds for the countdown
  const [showMissedMatch, setShowMissedMatch] = useState(false)
  const [randomNotifications, setRandomNotifications] = useState<
    { id: number; user: string; action: string; time: string }[]
  >([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [whatsappPhoto, setWhatsappPhoto] = useState<string | null>(null)
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false)
  const [userCity, setUserCity] = useState<string>("")
  const [userCountry, setUserCountry] = useState<string>("")
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // State for Instagram profile
  const [instagramProfile, setInstagramProfile] = useState<any>(null)
  const [isLoadingInstagram, setIsLoadingInstagram] = useState(false)
  const [instagramImageError, setInstagramImageError] = useState(false)
  const [instagramImageLoading, setInstagramImageLoading] = useState(false)

  const [instagramPosts, setInstagramPosts] = useState<any[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Data for random notifications
  const randomUsers = [
    "Ana Silva",
    "João Pereira",
    "Maria Oliveira",
    "Pedro Santos",
    "Camila Souza",
    "Lucas Costa",
    "Mariana Almeida",
    "Rafael Martins",
    "Rafael Martins",
    "Beatriz Lima",
    "Gustavo Rocha",
    "Isabela Fernandes",
    "Felipe Gomes",
    "Lara Ribeiro",
    "Daniel Carvalho",
    "Sofia Mendes",
  ]
  const notificationActions = [
    "accessed the final result.",
    "downloaded the full report.",
    "viewed private data.",
    "initiated a new scan.",
    "shared the findings.",
    "verified the intelligence.",
  ]

  // Add these arrays for placeholder images
  const femalePlaceholders = [
    "/images/female-placeholder-1.jpeg",
    "/images/female-placeholder-2.jpeg",
    "/images/female-placeholder-3.jpeg",
    "/images/female-placeholder-4.jpeg",
    "/images/female-placeholder-5.jpeg",
    "/images/female-placeholder-6.avif", // New female image
    "/images/female-placeholder-7.jpeg", // New female image
    "/images/female-placeholder-8.jpeg", // New female image
  ]

  const malePlaceholders = [
    "/images/male-placeholder-1.jpeg",
    "/images/male-placeholder-2.jpeg",
    "/images/male-placeholder-3.jpeg",
    "/images/male-placeholder-4.jpeg",
    "/images/male-placeholder-5.jpeg",
    "/images/male-placeholder-6.jpeg", // Nova imagem masculina
    "/images/male-placeholder-7.png", // Nova imagem masculina
  ]

  // Cleanup for image preview URL
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (currentStage === 6 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      clearInterval(timer)
    }
    return () => clearInterval(timer)
  }, [currentStage, timeLeft])

  // Random notifications effect
  useEffect(() => {
    let notificationInterval: NodeJS.Timeout | undefined
    if (currentStage === 6) {
      notificationInterval = setInterval(() => {
        const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)]
        const randomAction = notificationActions[Math.floor(Math.random() * notificationActions.length)]
        const newNotification = {
          id: Date.now(),
          user: randomUser,
          action: randomAction,
          time: "Just now",
        }
        setRandomNotifications((prevNotifications) => {
          const updated = [newNotification, ...prevNotifications]
          return updated.slice(0, 5) // Keep only the last 5 notifications
        })
      }, 3000) // Add a new notification every 3 seconds
    }
    return () => clearInterval(notificationInterval)
  }, [currentStage])

  useEffect(() => {
    if (currentStage === 4) {
      // Show notification after 4 seconds
      const showTimer = setTimeout(() => {
        setShowMissedMatch(true)
      }, 4000)

      // Hide notification after 7 seconds (4 + 3)
      const hideTimer = setTimeout(() => {
        setShowMissedMatch(false)
      }, 7000)

      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [currentStage])

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const usernameFromUrl = urlParams.get("username")

      if (usernameFromUrl) {
        console.log("[v0] Instagram username found in URL:", usernameFromUrl)
        // Set the username with @ prefix if not already present
        const formattedUsername = usernameFromUrl.startsWith("@") ? usernameFromUrl : `@${usernameFromUrl}`
        setInvestigatedHandle(formattedUsername)

        // Trigger Instagram profile fetch
        if (usernameFromUrl.length >= 3) {
          setIsLoadingInstagram(true)
          fetchInstagramProfile(formattedUsername).then((result) => {
            // Use formattedUsername here
            if (result.success) {
              setInstagramProfile(result.profile)
              console.log("[v0] Instagram profile validated from URL:", result.profile)
              // Start loading the image immediately if profile is found
              if (result.profile && result.profile.profile_pic_url) {
                setInstagramImageLoading(true)
                setInstagramImageError(false)
              }
            } else {
              setInstagramProfile(null)
              setInstagramImageLoading(false)
              setInstagramImageError(true)
            }
            setIsLoadingInstagram(false)
          })
        }
      }
    }
  }, []) // Run once on component mount

  useEffect(() => {
    if (instagramProfile && instagramProfile.username) {
      setIsLoadingPosts(true)
      fetchInstagramPosts(instagramProfile.username).then((result) => {
        if (result.success) {
          setInstagramPosts(result.posts || [])
          console.log("[v0] Instagram posts fetched:", result.posts)
        } else {
          setInstagramPosts([])
          if (result.error?.includes("private")) {
            console.log("[v0] Profile is private, no posts available")
          }
        }
        setIsLoadingPosts(false)
      })
    }
  }, [instagramProfile])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const nextStage = useCallback(() => {
    setShowContent(false) // Start fade-out
    setTimeout(() => {
      setCurrentStage((prev) => prev + 1)
      setShowContent(true) // Start fade-in for next stage
      // Reset analysis states only when starting a new analysis, not just moving stages
      if (currentStage === 0) {
        // If coming from initial screen, reset all
        setFileName(null)
        setImagePreviewUrl(null)
        setInvestigatedHandle("")
        setInvestigatedAge("")
        setInvestigatedGender("")
        setInvestigatedLocation("")
        setInvestigatedPhone("")
        setAnalysisProgress(0)
        setIsAnalyzing(false)
        setInstagramProfile(null) // Reset Instagram profile state
        setInstagramImageLoading(false) // Reset image loading state
        setInstagramImageError(false) // Reset image error state
        setInstagramPosts([]) // Clear posts when resetting
      }
      // Reset timer when entering stage 6
      if (currentStage + 1 === 6) {
        setTimeLeft(10 * 60) // Reset to 10 minutes
        setRandomNotifications([]) // Clear previous notifications
      }
    }, 500) // Duration of fade-out
  }, [currentStage, imagePreviewUrl]) // Added currentStage to dependencies

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      setFileName(file.name)
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl) // Revoke previous URL if exists
      }
      setImagePreviewUrl(URL.createObjectURL(file))
    } else {
      setFileName(null)
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
      setImagePreviewUrl(null)
    }
  }

  const handleInstagramHandleChange = async (value: string) => {
    // Sanitize the input
    const sanitized = sanitizeUsername(value)
    const formatted = sanitized ? `@${sanitized}` : ""
    setInvestigatedHandle(formatted)

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Only fetch if username is at least 3 characters (excluding @)
    if (sanitized.length >= 3) {
      const cachedProfile = getProfileFromCache(sanitized)
      if (cachedProfile) {
        console.log("[v0] Using cached profile")
        setInstagramProfile(cachedProfile)
        setInstagramImageLoading(false)
        setInstagramImageError(false)
        setIsLoadingInstagram(false)
        return // Don't fetch if we have cached data
      }

      const timer = setTimeout(async () => {
        setIsLoadingInstagram(true)
        setInstagramImageLoading(true)
        setInstagramImageError(false)
        const result = await fetchInstagramProfile(formatted)
        if (result.success && result.profile) {
          setInstagramProfile(result.profile)
          console.log("[v0] Instagram profile validated:", result.profile)
          setProfileLocalCache(sanitized, result.profile)
          setIsLoadingInstagram(false)
          if (!result.profile.profile_pic_url) {
            setInstagramImageLoading(false)
          }
        } else {
          setInstagramProfile(null)
          setInstagramImageError(true)
          setInstagramImageLoading(false)
          setIsLoadingInstagram(false)
        }
      }, 5000) // Changed from 800ms to 5000ms (5 seconds)
      debounceTimer.current = timer
    } else {
      setInstagramProfile(null)
      setInstagramImageLoading(false)
      setInstagramImageError(false)
    }
  }

  const startAnalysis = useCallback(() => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisMessage("Initializing facial recognition protocols...")
    setAnimationFrame(0) // Reset animation frame

    let progress = 0
    let frame = 0 // Local frame counter
    const intervalDuration = 150
    const totalDuration = 15000
    const increment = 100 / (totalDuration / intervalDuration)

    const messages = [
      "Analyzing facial biometrics and unique identifiers...",
      "Cross-referencing encrypted public and private databases...",
      "Establishing secure connection to social network APIs...",
      "Decrypting hidden profiles and shadow accounts...",
      "Extracting private message logs and media attachments...",
      "Phone number found! Cross-referencing with social profiles...",
      "Identifying anomalous interaction patterns and suspicious likes...",
      "Compiling comprehensive intelligence report...",
      "Finalizing data integrity verification and extraction...",
      "Analysis complete. Results ready for decryption.",
    ]
    let messageIndex = 0

    const interval = setInterval(() => {
      progress += increment
      frame++ // Increment frame for cycling images

      if (progress <= 100) {
        setAnalysisProgress(Math.min(100, Math.round(progress)))

        const newIndex = Math.floor((progress / 100) * messages.length)
        if (newIndex > messageIndex && newIndex < messages.length) {
          messageIndex = newIndex
          setAnalysisMessage(messages[newIndex])
        }

        // Update animation frame for image cycling
        setAnimationFrame(frame)
      }
      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          nextStage()
        }, 500)
      }
    }, intervalDuration)
  }, [nextStage, investigatedPhone])

  const fetchWhatsAppPhoto = async (phoneNumber: string, countryCode: string) => {
    console.log("[v0] fetchWhatsAppPhoto called with:", { phoneNumber, countryCode })

    if (!phoneNumber || phoneNumber.length < 8) {
      console.log("[v0] Phone number too short, aborting")
      return
    }

    setIsLoadingPhoto(true)
    console.log("[v0] Starting WhatsApp photo fetch...")

    try {
      const response = await fetch("/api/whatsapp-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneNumber,
          countryCode: countryCode,
        }),
      })

      console.log("[v0] WhatsApp API response status:", response.status)
      const data = await response.json()
      console.log("[v0] WhatsApp API response data:", data)

      if (data.success && data.result) {
        console.log("[v0] Setting WhatsApp photo:", data.result)
        setWhatsappPhoto(data.result)
        fetchUserLocation()
      } else {
        console.log("[v0] WhatsApp API returned no photo")
      }
    } catch (error) {
      console.error("[v0] Error fetching WhatsApp photo:", error)
    } finally {
      setIsLoadingPhoto(false)
      console.log("[v0] WhatsApp photo fetch completed")
    }
  }

  const fetchUserLocation = async () => {
    setIsLoadingLocation(true)
    try {
      const response = await fetch("https://wtfismyip.com/json")
      const data = await response.json()
      const detectedCity = data.YourFuckingCity || "Fortaleza"
      const detectedCountry = data.YourFuckingCountry || "Brasil"

      setUserCity(detectedCity)
      setUserCountry(detectedCountry)
    } catch (error) {
      console.error("Erro ao obter localização:", error)
      setUserCity("Fortaleza")
      setUserCountry("Brasil")
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const renderStage = () => {
    // Determine the match image based on gender
    const matchImageSrc =
      investigatedGender === "Feminino"
        ? "/images/tinder-match-female.jpeg"
        : investigatedGender === "Masculino"
          ? "/images/tinder-match-male.png" // Nova imagem para o match masculino
          : "/placeholder.svg?height=300&width=200" // Placeholder para 'Outro' ou não selecionado

    switch (currentStage) {
      case 0:
        return (
          <div className="text-center space-y-8">
            <p className="text-4xl md:text-5xl font-bold text-white tracking-wider animate-pulse">INSTA CHECK 3</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wider animate-pulse">
              💔 FEELING BETRAYED?
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              “You deserve to know the truth. Even the conversations he tried to hide…”
            </p>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Discover hidden profiles, private messages, and suspicious likes on:
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-3xl">
              <div className="flex flex-col items-center gap-2">
                <Camera className="text-purple-500" size={56} />
                <span className="text-white text-base">Instagram</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Facebook className="text-blue-600" size={56} />
                <span className="text-white text-base">Facebook</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Flame className="text-red-500" size={56} />
                <span className="text-white text-base">Tinder</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MessageCircle className="text-green-500" size={56} />
                <span className="text-white text-base">WhatsApp</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MapPin className="text-orange-500" size={56} />
                <span className="text-white text-base">Location</span>
              </div>
            </div>
            <Button
              onClick={nextStage}
              className="mt-10 px-10 py-5 text-xl font-bold uppercase bg-gradient-to-r from-pink-500 to-red-600 text-white shadow-lg hover:from-pink-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 animate-pulse-slow"
            >
              ➡️ START SCANNING
            </Button>
          </div>
        )
      case 1: // Age, Gender, Location, and Phone
        return (
          <div className="text-center space-y-6 px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-white animate-fade-in">
              📊 <span className="text-pink-400">TARGET</span> PROFILE
            </h2>
            <p className="text-lg md:text-xl text-gray-300 animate-fade-in-delay-1">
              Complete the investigation profile for enhanced analysis
            </p>
            <div className="w-full max-w-sm mx-auto space-y-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  placeholder="Age of the investigated person"
                  value={investigatedAge}
                  onChange={(e) => setInvestigatedAge(e.target.value)}
                  className="w-full p-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                  min="1"
                  max="120"
                />
              </div>
              <div className="relative">
                <Gender className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={investigatedGender}
                  onChange={(e) => {
                    const selectedGender = e.target.value
                    setInvestigatedGender(selectedGender)

                    try {
                      const tipo =
                        selectedGender === "Masculino"
                          ? "parceiro"
                          : selectedGender === "Feminino"
                            ? "parceira"
                            : "outro"
                      localStorage.setItem("alvoMonitoramento", `instagram-${tipo}`)
                      console.log("[v0] Saved to localStorage:", `instagram-${tipo}`)
                    } catch (e) {
                      console.error("[v0] Error saving to localStorage:", e)
                    }
                  }}
                  className="w-full p-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-base appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="Masculino">Male</option>
                  <option value="Feminino">Female</option>
                  <option value="Outro">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Location (e.g., New York, USA)"
                  value={investigatedLocation}
                  onChange={(e) => setInvestigatedLocation(e.target.value)}
                  className="w-full p-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <div className="flex">
                  <select
                    value={investigatedPhone.split(" ")[0] || "+1"}
                    onChange={(e) => {
                      const countryCode = e.target.value
                      const phoneNumber = investigatedPhone.split(" ")[1] || ""
                      const fullPhone = `${countryCode} ${phoneNumber}`
                      setInvestigatedPhone(fullPhone)

                      if (debounceTimer.current) {
                        clearTimeout(debounceTimer.current)
                      }

                      if (phoneNumber && phoneNumber.length >= 8) {
                        const timer = setTimeout(() => {
                          fetchWhatsAppPhoto(phoneNumber, countryCode.replace("+", ""))
                        }, 1000) // Wait 1 second after user stops typing
                        debounceTimer.current = timer
                      }
                    }}
                    className="w-24 p-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-l-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+7">🇷🇺 +7</option>
                    <option value="+20">🇪🇬 +20</option>
                    <option value="+27">🇿🇦 +27</option>
                    <option value="+30">🇬🇷 +30</option>
                    <option value="+31">🇳🇱 +31</option>
                    <option value="+32">🇧🇪 +32</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+36">🇭🇺 +36</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+40">🇷🇴 +40</option>
                    <option value="+41">🇨🇭 +41</option>
                    <option value="+43">🇦🇹 +43</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+45">🇩🇰 +45</option>
                    <option value="+46">🇸🇪 +46</option>
                    <option value="+47">🇳🇴 +47</option>
                    <option value="+48">🇵🇱 +48</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+53">🇨🇺 +53</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+56">🇨🇱 +56</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+58">🇻🇪 +58</option>
                    <option value="+60">🇲🇾 +60</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+62">🇮🇩 +62</option>
                    <option value="+63">🇵🇭 +63</option>
                    <option value="+64">🇳🇿 +64</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+66">🇹🇭 +66</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+82">🇰🇷 +82</option>
                    <option value="+84">🇻🇳 +84</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+90">🇹🇷 +90</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+92">🇵🇰 +92</option>
                    <option value="+93">🇦🇫 +93</option>
                    <option value="+94">🇱🇰 +94</option>
                    <option value="+95">🇲🇲 +95</option>
                    <option value="+98">🇮🇷 +98</option>
                    <option value="+212">🇲🇦 +212</option>
                    <option value="+213">🇩🇿 +213</option>
                    <option value="+216">🇹🇳 +216</option>
                    <option value="+218">🇱🇾 +218</option>
                    <option value="+220">🇬🇲 +220</option>
                    <option value="+221">🇸🇳 +221</option>
                    <option value="+222">🇲🇷 +222</option>
                    <option value="+223">🇲🇱 +223</option>
                    <option value="+224">🇬🇳 +224</option>
                    <option value="+225">🇨🇮 +225</option>
                    <option value="+226">🇧🇫 +226</option>
                    <option value="+227">🇳🇪 +227</option>
                    <option value="+228">توج +228</option>
                    <option value="+229">🇧🇯 +229</option>
                    <option value="+230">🇲🇺 +230</option>
                    <option value="+231">🇱🇷 +231</option>
                    <option value="+232">🇸🇱 +232</option>
                    <option value="+233">🇬🇭 +233</option>
                    <option value="+234">🇳🇬 +234</option>
                    <option value="+235">🇹🇩 +235</option>
                    <option value="+236">🇨🇫 +236</option>
                    <option value="+237">🇨🇲 +237</option>
                    <option value="+238">🇨🇻 +238</option>
                    <option value="+239">🇸🇹 +239</option>
                    <option value="+240">🇬🇶 +240</option>
                    <option value="+241">🇬🇦 +241</option>
                    <option value="+242">🇨🇬 +242</option>
                    <option value="+243">🇨🇩 +243</option>
                    <option value="+244">🇦🇴 +244</option>
                    <option value="+245">🇬🇼 +245</option>
                    <option value="+246">🇮🇴 +246</option>
                    <option value="+248">🇸🇨 +248</option>
                    <option value="+249">🇸🇩 +249</option>
                    <option value="+250">🇷🇼 +250</option>
                    <option value="+251">🇪🇹 +251</option>
                    <option value="+252">🇸🇴 +252</option>
                    <option value="+253">🇩🇯 +253</option>
                    <option value="+254">🇰🇪 +254</option>
                    <option value="+255">🇹🇿 +255</option>
                    <option value="+256">🇺🇬 +256</option>
                    <option value="+257">🇧🇮 +257</option>
                    <option value="+258">🇲🇿 +258</option>
                    <option value="+260">🇿🇲 +260</option>
                    <option value="+261">🇲🇬 +261</option>
                    <option value="+262">🇷🇪 +262</option>
                    <option value="+263">🇿🇼 +263</option>
                    <option value="+264">🇳🇦 +264</option>
                    <option value="+265">🇲🇼 +265</option>
                    <option value="+266">🇱🇸 +266</option>
                    <option value="+267">🇧🇼 +267</option>
                    <option value="+268">🇸🇿 +268</option>
                    <option value="+269">🇰🇲 +269</option>
                    <option value="+290">🇸🇭 +290</option>
                    <option value="+291">🇪🇷 +291</option>
                    <option value="+297">🇦🇼 +297</option>
                    <option value="+298">🇫🇴 +298</option>
                    <option value="+299">🇬🇱 +299</option>
                    <option value="+350">🇬🇮 +350</option>
                    <option value="+351">🇵🇹 +351</option>
                    <option value="+352">🇱🇺 +352</option>
                    <option value="+353">🇮🇪 +353</option>
                    <option value="+354">🇮🇸 +354</option>
                    <option value="+355">🇦🇱 +355</option>
                    <option value="+356">🇲🇹 +356</option>
                    <option value="+357">🇨🇾 +357</option>
                    <option value="+358">🇫🇮 +358</option>
                    <option value="+359">🇧🇬 +359</option>
                    <option value="+370">🇱🇹 +370</option>
                    <option value="+371">🇱🇻 +371</option>
                    <option value="+372">🇪🇪 +372</option>
                    <option value="+373">🇲🇩 +373</option>
                    <option value="+374">🇦🇲 +374</option>
                    <option value="+375">🇧🇾 +375</option>
                    <option value="+376">🇦🇩 +376</option>
                    <option value="+377">🇲🇨 +377</option>
                    <option value="+378">🇸🇲 +378</option>
                    <option value="+380">🇺🇦 +380</option>
                    <option value="+381">🇷🇸 +381</option>
                    <option value="+382">🇲🇪 +382</option>
                    <option value="+383">🇽🇰 +383</option>
                    <option value="+385">🇭🇷 +385</option>
                    <option value="+386">🇸🇮 +386</option>
                    <option value="+387">🇧🇦 +387</option>
                    <option value="+389">🇲🇰 +389</option>
                    <option value="+420">🇨🇿 +420</option>
                    <option value="+421">🇸🇰 +421</option>
                    <option value="+423">🇱🇮 +423</option>
                    <option value="+500">🇫🇰 +500</option>
                    <option value="+501">🇧🇿 +501</option>
                    <option value="+502">🇬🇹 +502</option>
                    <option value="+503">🇸🇻 +503</option>
                    <option value="+504">🇭🇳 +504</option>
                    <option value="+505">🇳🇮 +505</option>
                    <option value="+506">🇨🇷 +506</option>
                    <option value="+507">🇵🇦 +507</option>
                    <option value="+508">🇵🇲 +508</option>
                    <option value="+509">🇭🇹 +509</option>
                    <option value="+590">🇬🇵 +590</option>
                    <option value="+591">🇧🇴 +591</option>
                    <option value="+592">🇬🇾 +592</option>
                    <option value="+593">🇪🇨 +593</option>
                    <option value="+594">🇬🇫 +594</option>
                    <option value="+595">🇵🇾 +595</option>
                    <option value="+596">🇲🇶 +596</option>
                    <option value="+597">🇸🇷 +597</option>
                    <option value="+598">🇺🇾 +598</option>
                    <option value="+599">🇨🇼 +599</option>
                    <option value="+670">🇹🇱 +670</option>
                    <option value="+672">🇦🇶 +672</option>
                    <option value="+673">🇧🇳 +673</option>
                    <option value="+674">🇳🇷 +674</option>
                    <option value="+675">🇵🇬 +675</option>
                    <option value="+676">توج +676</option>
                    <option value="+677">🇸🇧 +677</option>
                    <option value="+678">🇻🇺 +678</option>
                    <option value="+679">🇫🇯 +679</option>
                    <option value="+680">🇵🇼 +680</option>
                    <option value="+681">🇼🇫 +681</option>
                    <option value="+682">🇨🇰 +682</option>
                    <option value="+683">🇳🇺 +683</option>
                    <option value="+684">🇦🇸 +684</option>
                    <option value="+685">🇼🇸 +685</option>
                    <option value="+686">🇰🇮 +686</option>
                    <option value="+687">🇳🇨 +687</option>
                    <option value="+688">توج +688</option>
                    <option value="+689">🇵🇫 +689</option>
                    <option value="+690">🇹🇰 +690</option>
                    <option value="+691">🇫🇲 +691</option>
                    <option value="+692">🇲🇭 +692</option>
                    <option value="+850">🇰🇵 +850</option>
                    <option value="+852">🇭🇰 +852</option>
                    <option value="+853">🇲🇴 +853</option>
                    <option value="+855">🇰🇭 +855</option>
                    <option value="+856">🇱🇦 +856</option>
                    <option value="+880">🇧🇩 +880</option>
                    <option value="+886">🇹🇼 +886</option>
                    <option value="+960">🇲🇻 +960</option>
                    <option value="+961">🇱🇧 +961</option>
                    <option value="+962">🇯🇴 +962</option>
                    <option value="+963">🇸🇾 +963</option>
                    <option value="+964">🇮🇶 +964</option>
                    <option value="+965">🇰🇼 +965</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+967">🇾🇪 +967</option>
                    <option value="+968">🇴🇲 +968</option>
                    <option value="+970">🇵🇸 +970</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+972">🇮🇱 +972</option>
                    <option value="+973">🇧🇭 +973</option>
                    <option value="+974">🇶🇦 +974</option>
                    <option value="+975">🇧🇹 +975</option>
                    <option value="+976">🇲🇳 +976</option>
                    <option value="+977">🇳🇵 +977</option>
                    <option value="+992">🇹🇯 +992</option>
                    <option value="+993">🇹🇲 +993</option>
                    <option value="+994">🇦🇿 +994</option>
                    <option value="+995">🇬🇪 +995</option>
                    <option value="+996">🇰🇬 +996</option>
                    <option value="+998">🇺🇿 +998</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={investigatedPhone.split(" ")[1] || ""}
                    onChange={(e) => {
                      const countryCode = investigatedPhone.split(" ")[0] || "+1"
                      const fullPhone = `${countryCode} ${e.target.value}`
                      setInvestigatedPhone(fullPhone)

                      if (debounceTimer.current) {
                        clearTimeout(debounceTimer.current)
                      }

                      if (e.target.value.length >= 8) {
                        const timer = setTimeout(() => {
                          fetchWhatsAppPhoto(e.target.value, countryCode.replace("+", ""))
                        }, 1000) // Wait 1 second after user stops typing
                        debounceTimer.current = timer
                      }
                    }}
                    className="flex-1 p-3 bg-gray-800/50 border border-gray-700 border-l-0 rounded-r-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {(whatsappPhoto || isLoadingPhoto || userCity || isLoadingLocation) && (
                <div className="mt-4 p-4 bg-gray-800/30 border border-gray-700 rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                      {isLoadingPhoto ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                      ) : whatsappPhoto ? (
                        <img
                          src={whatsappPhoto || "/placeholder.svg"}
                          alt="WhatsApp Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/whatsapp-checkmark.jpeg"
                          }}
                        />
                      ) : (
                        <img
                          src="/whatsapp-checkmark.jpeg"
                          alt="WhatsApp Checkmark"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-400 font-medium">
                        {isLoadingPhoto ? "Searching WhatsApp..." : "WhatsApp Profile Found"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isLoadingPhoto ? "Analyzing phone number..." : "Profile detected"}
                      </p>
                    </div>
                  </div>

                  {(userCity || isLoadingLocation) && (
                    <div className="flex items-center space-x-3 pt-3 border-t border-gray-700">
                      <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center">
                        {isLoadingLocation ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                        ) : (
                          <MapPin className="text-green-400" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-green-400 font-medium">
                          {isLoadingLocation ? "Detecting location..." : "Suspicious Location Found"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {isLoadingLocation ? "Analyzing IP address..." : `${userCity}, ${userCountry}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={nextStage}
              disabled={!investigatedAge || !investigatedGender || !investigatedLocation || !investigatedPhone}
              className="mt-8 px-8 py-4 text-lg font-bold uppercase bg-gradient-to-r from-pink-500 to-red-600 text-white shadow-lg hover:from-pink-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 animate-pulse-slow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➡️ CONTINUE
            </Button>
          </div>
        )
      case 2: // OLD STAGE 1: Upload and Handle
        return (
          <div className="text-center space-y-8">
            <p className="text-3xl md:text-4xl font-bold text-white animate-pulse">
              📸 Select a photo for facial analysis...
            </p>
            <div className="relative w-full max-w-md mx-auto border-2 border-dashed border-gray-600 p-6 rounded-lg text-gray-400 flex flex-col items-center justify-center gap-3 bg-gray-800/30 hover:border-gray-500 transition-colors duration-200 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="max-h-40 max-w-full object-contain rounded-md"
                />
              ) : (
                <Upload size={40} className="text-gray-500" />
              )}
              <p className="text-base">
                {fileName ? `File selected: ${fileName}` : "Drag and drop or click to select"}
              </p>
              {fileName && !isAnalyzing && (
                <div className="mt-3 text-green-400 flex items-center gap-2 animate-fade-in">
                  <ScanEye size={20} />
                  <span className="text-lg">Ready to scan!</span>
                </div>
              )}
            </div>

            <p className="text-2xl md:text-3xl font-bold text-white animate-pulse mt-8">
              🎯 TARGET IDENTIFICATION: Enter the target Instagram
            </p>
            <div className="relative w-full max-w-md mx-auto">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="@target_user"
                value={investigatedHandle}
                onChange={(e) => handleInstagramHandleChange(e.target.value)}
                className="w-full p-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isAnalyzing}
              />
              {isLoadingInstagram && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
                </div>
              )}
            </div>

            {instagramProfile && !isLoadingInstagram && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg max-w-md mx-auto animate-fade-in">
                <div className="flex items-start space-x-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative flex-shrink-0">
                    {instagramImageLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : instagramProfile.profile_pic_url && !instagramImageError ? (
                      <>
                        <img
                          src={
                            instagramImageError
                              ? instagramProfile.profile_pic_url
                              : `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                          }
                          alt={instagramProfile.username}
                          className="w-full h-full object-cover"
                          loading="eager"
                          crossOrigin="anonymous"
                          onLoad={() => {
                            console.log("[v0] Profile picture loaded successfully")
                            setInstagramImageLoading(false)
                            setInstagramImageError(false)
                          }}
                          onError={(e) => {
                            console.log("[v0] Trying fallback image source")
                            if (!instagramImageError) {
                              // Tenta carregar direto da URL
                              setInstagramImageError(true)
                              const img = e.target as HTMLImageElement
                              img.src = instagramProfile.profile_pic_url
                            } else {
                              setInstagramImageLoading(false)
                            }
                          }}
                        />
                      </>
                    ) : (
                      <Camera className="text-white" size={24} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base text-white font-semibold">@{instagramProfile.username}</p>
                    <p className="text-sm text-gray-300 mt-1">
                      {instagramProfile.media_count} posts •{" "}
                      {typeof instagramProfile.follower_count === "number"
                        ? instagramProfile.follower_count.toLocaleString()
                        : instagramProfile.follower_count || "0"}{" "}
                      followers
                    </p>
                    {instagramProfile.biography && (
                      <p className="text-sm text-gray-300 mt-2">{instagramProfile.biography}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="w-full max-w-md mx-auto mt-8 space-y-3 animate-fade-in relative p-4 bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
                {/* Background grid for scanning effect */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(90deg, transparent 1px, #10b981 1px),
                      linear-gradient(180deg, #10b981 1px, transparent 1px)
                    `,
                    backgroundSize: "20px 20px",
                    animation: "grid-scan 2s linear infinite",
                  }}
                />
                <div className="relative z-10">
                  <p className="text-xl font-bold text-white font-mono">
                    <span className="text-green-400">[SCANNING]</span> {analysisMessage} ({analysisProgress}%)
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-red-600 h-3 rounded-full transition-all duration-200 ease-linear"
                      style={{ width: `${analysisProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-lg font-bold text-gray-300 animate-pulse mt-3 font-mono">
                    <span className="text-yellow-400">[STATUS]</span> Searching for connected accounts...
                  </p>
                  {analysisProgress >= 60 && (
                    <div className="flex items-center gap-3 mt-3 p-2 bg-green-900/30 rounded-lg border border-green-700 animate-fade-in">
                      <img
                        src={whatsappPhoto || "/placeholder.svg"}
                        alt="Target"
                        className="w-8 h-8 rounded-full object-cover border-2 border-green-400"
                      />
                      <p className="text-lg font-bold text-green-400 font-medium">
                        <span className="text-green-300">[PHONE FOUND]</span> {investigatedPhone}
                      </p>
                      <CheckCircle size={20} className="text-green-400" />
                    </div>
                  )}

                  {/* New section for uploaded photo appearing multiple times */}
                  {imagePreviewUrl && (
                    <div className="mt-6 grid grid-cols-3 gap-2">
                      {[...Array(9)].map((_, i) => {
                        let src = "/placeholder.svg" // Default placeholder
                        const currentPlaceholders =
                          investigatedGender === "Feminino" ? femalePlaceholders : malePlaceholders

                        // Determine the source based on analysis progress and square index
                        if (isAnalyzing && analysisProgress < 90) {
                          // During active analysis, all squares cycle through placeholders
                          src = currentPlaceholders[(animationFrame + i) % currentPlaceholders.length]
                        } else if (isAnalyzing && analysisProgress >= 90) {
                          // When analysis is almost done, the 9th square shows the uploaded image with checkmark
                          if (i === 8) {
                            src = imagePreviewUrl || "/placeholder.svg" // Ensure it's the uploaded image
                          } else {
                            // Other squares freeze on a specific placeholder from their list
                            src = currentPlaceholders[i % currentPlaceholders.length]
                          }
                        } else {
                          // Before analysis starts or if not analyzing, default placeholders
                          src = currentPlaceholders[i % currentPlaceholders.length]
                        }

                        return (
                          <div key={i} className="relative w-full h-24 rounded-md overflow-hidden">
                            <img
                              src={src || "/placeholder.svg"}
                              alt={`Scanned image ${i}`}
                              className={`w-full h-full object-cover ${
                                isAnalyzing && analysisProgress < 90 ? "animate-scan-image-pulse" : ""
                              }`}
                              style={{ animationDelay: `${i * 0.1}s` }} // Staggered animation
                            />
                            {i === 8 &&
                              isAnalyzing &&
                              analysisProgress >= 90 && ( // Show checkmark on the 9th image when analysis is almost done
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <CheckCircle size={40} className="text-green-500 animate-fade-in" />
                                </div>
                              )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={startAnalysis}
              disabled={!fileName || !investigatedHandle || isAnalyzing} // Disable until file AND handle are present
              className="mt-10 px-10 py-5 text-xl font-bold uppercase bg-gradient-to-r from-pink-500 to-red-600 text-white shadow-lg hover:from-pink-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 animate-pulse-slow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? "ANALYZING..." : "➡️ CONTINUE"}
            </Button>
          </div>
        )
      case 3: // OLD STAGE 2: Detection and Notifications
        return (
          <div className="text-center space-y-8">
            <div className="grid gap-3 text-left max-w-xl mx-auto">
              <p className="text-lg md:text-xl text-green-400 flex items-center gap-2 animate-fade-in">
                <CheckCircle className="text-green-400" size={28} /> Instagram account found. Last access: 3h ago.
              </p>
              <p className="text-lg md:text-xl text-red-400 flex items-center gap-2 animate-fade-in-delay-1">
                <Flame className="text-red-400" size={28} /> Hidden Tinder profile detected.
              </p>
              <p className="text-lg md:text-xl text-blue-400 flex items-center gap-2 animate-fade-in-delay-2">
                {imagePreviewUrl ? (
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-blue-400 flex items-center justify-center">
                    <img
                      src={imagePreviewUrl || "/placeholder.svg"}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                    <MessageCircle
                      size={18}
                      className="absolute text-white bg-blue-500 rounded-full p-0.5 -bottom-1 -right-1"
                    />
                  </div>
                ) : (
                  <MessageCircle className="text-blue-400" size={28} />
                )}
                Private messages found.
              </p>
              <p className="text-lg md:text-xl text-pink-400 flex items-center gap-2 animate-fade-in-delay-3">
                <Heart className="text-pink-400" size={28} /> Suspicious likes identified on old posts.
              </p>
              {investigatedLocation && (
                <p className="text-lg md:text-xl text-purple-400 flex items-center gap-2 animate-fade-in-delay-4">
                  <MapPin className="text-purple-400" size={28} /> Location detected: {investigatedLocation}.
                </p>
              )}
              {analysisProgress >= 60 && (
                <div className="flex items-center gap-3 p-3 bg-green-900/30 rounded-lg border border-green-700 animate-fade-in-delay-3">
                  {whatsappPhoto && (
                    <img
                      src={whatsappPhoto || "/placeholder.svg"}
                      alt="WhatsApp Profile"
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-400"
                    />
                  )}
                  <div>
                    <p className="text-lg md:text-xl text-green-400 flex items-center gap-2">
                      <Phone className="text-green-400" size={28} /> PHONE FOUND
                    </p>
                    <p className="text-sm text-gray-300">{investigatedPhone}</p>
                  </div>
                </div>
              )}
              <div className="relative mt-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700 animate-fade-in-delay-4">
                <p className="text-base text-white font-mono">
                  <span className="text-green-400">[SYSTEM_LOG]</span> New activity detected:
                </p>
                <p className="text-base text-white font-mono ml-3">
                  <span className="text-blue-400">[INSTAGRAM]</span> New message from @
                  {investigatedGender === "Feminino" ? "alex22" : "alexia_30"}.
                </p>
                <p className="text-base text-white font-mono ml-3">
                  <span className="text-blue-400">[INSTAGRAM]</span> @
                  {investigatedGender === "Feminino" ? "rodrigo.b" : "izes"} liked your photo.
                </p>
              </div>

              {/* Instagram-style notifications */}
              <div className="mt-6 space-y-3 text-left">
                {/* Notification 1: Liked Photo */}
                <div className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-5">
                  <img
                    src={
                      investigatedGender === "Feminino"
                        ? "/images/male-placeholder-1.jpg"
                        : "/images/female-placeholder-1.jpeg"
                    }
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-pink-500"
                  />
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-semibold">
                        @{investigatedGender === "Feminino" ? "alex22" : "alexia_30"}
                      </span>{" "}
                      liked your photo
                    </p>
                    <p className="text-gray-400 text-xs">2 minutes ago</p>
                  </div>
                  <Heart className="text-pink-500" size={16} />
                </div>

                {/* Notification 2: New Message */}
                <div className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-6">
                  <img
                    src={
                      investigatedGender === "Feminino"
                        ? "/images/male-placeholder-2.jpg"
                        : "/images/female-placeholder-2.jpeg"
                    }
                    alt="Message Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-semibold">@{investigatedGender === "Feminino" ? "rodrigo.b" : "izes"}</span>{" "}
                      sent you a message
                    </p>
                    <p className="text-gray-400 text-xs">5 minutes ago</p>
                  </div>
                  <MessageCircle className="text-blue-500" size={16} />
                </div>

                {/* Notification 3: Is typing... */}
                <div className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-7">
                  <img
                    src={
                      instagramProfile?.profile_pic_url
                        ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                        : imagePreviewUrl || "/placeholder.svg"
                    }
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-500"
                    crossOrigin="anonymous"
                  />
                  <div>
                    <p className="text-sm text-white font-bold">
                      {investigatedHandle || "@alvo"}
                      <span className="text-gray-400 font-normal ml-1">is typing...</span>
                    </p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto"></span>
                </div>

                {/* Notification 4: Message received after typing (simulating "digita de novo") */}
                <div className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-8">
                  <img
                    src={
                      instagramProfile?.profile_pic_url
                        ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                        : imagePreviewUrl || "/placeholder.svg"
                    }
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                    crossOrigin="anonymous"
                  />
                  <div>
                    <p className="text-sm text-white font-bold">
                      {investigatedHandle || "@alvo"}
                      <span className="text-gray-400 font-normal ml-1">sent a new message.</span>
                    </p>
                    <p className="text-xs text-gray-500">1 minute ago</p>
                  </div>
                  <MessageCircle size={20} className="text-blue-500 ml-auto" />
                </div>
              </div>
            </div>

            {/* Original section for blurred images and comments - adjusted delay */}
            <div className="mt-6 space-y-5 text-left">
              <p className="text-xl md:text-2xl text-white font-bold animate-fade-in-delay-9">
                <span className="text-red-400">INTERCEPTED:</span> Suspicious Likes from {investigatedHandle || "@alvo"}
              </p>

              {investigatedGender === "Feminino" ? (
                <>
                  {/* Male Photos for Female Investigation */}
                  {/* Liked Photo 1 - Man at beach */}
                  <div className="flex flex-col gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-10">
                    <div className="relative w-full h-64 rounded-md overflow-hidden">
                      <img
                        src="/images/male-photo-beach.png"
                        alt="Liked Photo 1"
                        className="w-full h-full object-cover filter blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock size={48} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Heart size={16} className="text-pink-400" />
                      <span className="text-sm text-gray-300">2.1K likes</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={
                          instagramProfile?.profile_pic_url
                            ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                            : imagePreviewUrl || "/placeholder.svg"
                        }
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-500"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <p className="text-sm text-gray-300 font-bold">{investigatedHandle || "@alvo"}</p>
                        <p className="text-sm text-white">"very beautiful, I still want to meet you in person"</p>
                      </div>
                    </div>
                  </div>

                  {/* Liked Photo 2 - Man in gym */}
                  <div className="flex flex-col gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-11">
                    <div className="relative w-full h-64 rounded-md overflow-hidden">
                      <img
                        src="/images/male-photo-gym.png"
                        alt="Liked Photo 2"
                        className="w-full h-full object-cover filter blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock size={48} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Heart size={16} className="text-pink-400" />
                      <span className="text-sm text-gray-300">3.2K likes</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={
                          instagramProfile?.profile_pic_url
                            ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                            : imagePreviewUrl || "/placeholder.svg"
                        }
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-500"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <p className="text-sm text-gray-300 font-bold">{investigatedHandle || "@alvo"}</p>
                        <p className="text-white text-sm">"What a handsome man!"</p>
                      </div>
                    </div>
                  </div>

                  {/* Liked Photo 3 - Man bathroom selfie */}
                  <div className="flex flex-col gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-12">
                    <div className="relative w-full h-64 rounded-md overflow-hidden">
                      <img
                        src="/images/male-photo-bathroom.png"
                        alt="Liked Photo 3"
                        className="w-full h-full object-cover filter blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock size={48} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Heart size={16} className="text-pink-400" />
                      <span className="text-sm text-gray-300">4.5K likes</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={
                          instagramProfile?.profile_pic_url
                            ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                            : imagePreviewUrl || "/placeholder.svg"
                        }
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-500"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <p className="text-sm text-gray-300 font-bold">{investigatedHandle || "@alvo"}</p>
                        <p className="text-white text-sm">
                          "My friend, you're getting more handsome every day, I miss you."
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Liked Photo 4 - Man bathroom selfie 2 */}
                  <div className="flex flex-col gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-13">
                    <div className="relative w-full h-64 rounded-md overflow-hidden">
                      <img
                        src="/images/male-photo-blue-eyes.png"
                        alt="Liked Photo 4"
                        className="w-full h-full object-cover filter blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock size={48} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Heart size={16} className="text-pink-400" />
                      <span className="text-sm text-gray-300">1.8K likes</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={
                          instagramProfile?.profile_pic_url
                            ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                            : imagePreviewUrl || "/placeholder.svg"
                        }
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-500"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <p className="text-sm text-gray-300 font-bold">{investigatedHandle || "@alvo"}</p>
                        <p className="text-white text-sm">"Hi handsome, what city are you from?"</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Female Photos for Male/Other Investigation */}
                  {/* Liked Photo 1 */}
                  <div className="flex flex-col gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-10">
                    <div className="relative w-full h-64 rounded-md overflow-hidden">
                      <img
                        src="/images/liked-photo-princess.png"
                        alt="Liked Photo 1"
                        className="w-full h-full object-cover filter blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock size={48} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Heart size={16} className="text-pink-400" />
                      <span className="text-sm text-gray-300">1.2K likes</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={
                          instagramProfile?.profile_pic_url
                            ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                            : imagePreviewUrl || "/placeholder.svg"
                        }
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-500"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <p className="text-sm text-gray-300 font-bold">{investigatedHandle || "@alvo"}</p>
                        <p className="text-white text-sm">"What a wonderful princess."</p>
                      </div>
                    </div>
                  </div>

                  {/* Liked Photo 2 */}
                  <div className="flex flex-col gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-11">
                    <div className="relative w-full h-64 rounded-md overflow-hidden">
                      <img
                        src="/images/liked-photo-2.jpeg"
                        alt="Liked Photo 2"
                        className="w-full h-full object-cover filter blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock size={48} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Heart size={16} className="text-pink-400" />
                      <span className="text-sm text-gray-300">2.4K likes</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={
                          instagramProfile?.profile_pic_url
                            ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                            : imagePreviewUrl || "/placeholder.svg"
                        }
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-500"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <p className="text-sm text-gray-300 font-bold">{investigatedHandle || "@alvo"}</p>
                        <p className="text-sm text-white"> "Those sunsets are unbeatable 🌅"</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-12">
                    <div className="relative w-full h-64 rounded-md overflow-hidden">
                      <img
                        src="/images/7b352510dd-8016-4bce-97de-8e8a5e4a141a-7d.png"
                        alt="Liked Photo 3"
                        className="w-full h-full object-cover filter blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock size={48} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Heart size={16} className="text-pink-400" />
                      <span className="text-sm text-gray-300">3.8K likes</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={
                          instagramProfile?.profile_pic_url
                            ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                            : imagePreviewUrl || "/placeholder.svg"
                        }
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-500"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <p className="text-sm text-gray-300 font-bold">{investigatedHandle || "@alvo"}</p>
                        <p className="text-white text-sm"> "The most perfect woman I've ever seen ❤️"</p>
                      </div>
                    </div>
                  </div>

                  {/* Liked Photo 4 */}
                  <div className="flex flex-col gap-2 p-3 bg-gray-800/40 rounded-lg border border-gray-700 animate-fade-in-delay-13">
                    <div className="relative w-full h-64 rounded-md overflow-hidden">
                      <img
                        src="/images/garotas-lindas-melhores-amigas-alegres-irmas-curtindo-a-festa.avif"
                        alt="Liked Photo 4 - Group of friends enjoying a party"
                        className="w-full h-full object-cover filter blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock size={48} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Heart size={16} className="text-pink-400" />
                      <span className="text-sm text-gray-300">1.5K likes</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={
                          instagramProfile?.profile_pic_url
                            ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                            : imagePreviewUrl || "/placeholder.svg"
                        }
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-gray-500"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <p className="text-sm text-gray-300 font-bold">{investigatedHandle || "@alvo"}</p>
                        <p className="text-white text-sm"> "Great energy! Wish I was there with you all."</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <Button
              onClick={nextStage}
              className="mt-10 px-10 py-5 text-xl font-bold uppercase bg-gradient-to-r from-pink-500 to-red-600 text-white shadow-lg hover:from-pink-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 animate-pulse-slow"
            >
              ➡️ SEE MORE
            </Button>
          </div>
        )
      case 4: // NEW STAGE: Tinder Likes Screen
        return (
          <div className="flex flex-col w-full max-w-md mx-auto bg-black text-white rounded-lg shadow-lg h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Top Bar */}
            <div className="relative flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
              {/* Left: User Profile */}
              <div className="flex items-center gap-2 z-10">
                <img
                  src={
                    instagramProfile?.profile_pic_url
                      ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                      : imagePreviewUrl || "/user-profile-illustration.png"
                  }
                  alt="User Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-red-500"
                  crossOrigin="anonymous"
                />
                <span className="text-white font-bold text-lg truncate max-w-[120px]">
                  {investigatedHandle || "@your_profile"}
                </span>
              </div>

              {/* Right: Secondary Navigation */}
              <div className="flex space-x-3 text-gray-400 text-xs z-10">
                <span className="font-bold text-white border-b-2 border-red-500 pb-1">5 likes</span>
                <span className="hidden sm:block">Likes sent</span>
                <span className="hidden sm:block">
                  Highlights <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-0.5"></span>
                </span>
              </div>
            </div>

            <div className="text-center py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
              <span className="text-red-500 font-bold text-xl">tinder</span>
            </div>

            {/* Main Content - "Veja quem já curtiu você." */}
            <div className="p-3 text-center bg-gray-900 flex-shrink-0">
              <p className="text-base text-gray-300">see who already liked you.</p>
            </div>

            <div className="flex items-center justify-center gap-3 p-4 bg-blue-600/80 text-white font-bold text-lg rounded-lg mx-auto mt-4 w-[90%] animate-fade-in flex-shrink-0">
              <img
                src={
                  instagramProfile?.profile_pic_url
                    ? `/api/instagram-image-proxy?url=${encodeURIComponent(instagramProfile.profile_pic_url)}`
                    : imagePreviewUrl || "/super-like-sender.jpg"
                }
                alt="Super Like Sender"
                className="w-10 h-10 rounded-full object-cover border-2 border-yellow-300"
                crossOrigin="anonymous"
              />
              <span>You received a Super Like!</span>
              <Star size={24} className="text-yellow-300 fill-yellow-300" />
            </div>

            {showMissedMatch && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
                <div className="flex items-center gap-2">
                  <X size={20} />
                  <span className="font-bold">You missed a match!</span>
                </div>
              </div>
            )}

            {/* Main Profile Card (with lock overlay and carousel) */}
            <div className="relative w-full h-96 bg-gray-800 rounded-lg overflow-hidden mx-auto mt-4 flex-shrink-0">
              {/* Photo carousel container */}
              <div className="relative w-full h-full">
                {/* Current photo */}
                <img
                  src={
                    investigatedGender === "Feminino"
                      ? currentPhotoIndex === 0
                        ? "/images/tinder-male-rafael.png"
                        : currentPhotoIndex === 1
                          ? "/images/tinder-male-2.jpg"
                          : "/images/tinder-male-3.jpg"
                      : currentPhotoIndex === 0
                        ? "/images/tinder-main-profile.jpeg"
                        : currentPhotoIndex === 1
                          ? "/images/tinder-female-2.jpg"
                          : "/images/tinder-female-3.jpg"
                  }
                  alt={`Profile Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover blur-sm"
                />

                {/* Lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="bg-gray-900/80 p-3 rounded-full">
                    <Lock size={32} className="text-gray-300" />
                  </div>
                </div>

                {/* Photo indicators */}
                <div className="absolute top-2 left-2 right-2 flex gap-1">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={`flex-1 h-1 rounded-full ${index === currentPhotoIndex ? "bg-white" : "bg-white/30"}`}
                    />
                  ))}
                </div>

                {/* Navigation arrows */}
                <button
                  onClick={() => setCurrentPhotoIndex(currentPhotoIndex > 0 ? currentPhotoIndex - 1 : 2)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex(currentPhotoIndex < 2 ? currentPhotoIndex + 1 : 0)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Touch/swipe area for mobile */}
                <div
                  className="absolute inset-0 cursor-pointer"
                  onTouchStart={(e) => {
                    const touch = e.touches[0]
                    setTouchStart(touch.clientX)
                  }}
                  onTouchEnd={(e) => {
                    if (!touchStart) return
                    const touch = e.changedTouches[0]
                    const diff = touchStart - touch.clientX

                    if (Math.abs(diff) > 50) {
                      // Minimum swipe distance
                      if (diff > 0) {
                        // Swipe left - next photo
                        setCurrentPhotoIndex(currentPhotoIndex < 2 ? currentPhotoIndex + 1 : 0)
                      } else {
                        // Swipe right - previous photo
                        setCurrentPhotoIndex(currentPhotoIndex > 0 ? currentPhotoIndex - 1 : 2)
                      }
                    }
                    setTouchStart(null)
                  }}
                />

                {/* Profile info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  {currentPhotoIndex === 0 && (
                    <>
                      <p className="text-xl font-bold">
                        {investigatedGender === "Feminino" ? "Rafael, 30" : "Izabelle, 30"}
                      </p>
                      <p className="flex items-center gap-1 text-sm text-gray-300">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Online recently...
                      </p>
                    </>
                  )}
                  {currentPhotoIndex === 1 && (
                    <>
                      <p className="text-xl font-bold">Likes sent</p>
                      <p className="text-sm text-gray-300">View activity</p>
                    </>
                  )}
                  {currentPhotoIndex === 2 && (
                    <>
                      <p className="text-xl font-bold">4 Super Likes</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Like/Nope Buttons below the main profile card */}
            <div className="flex justify-center gap-6 py-4 bg-gray-900 flex-shrink-0">
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-gray-700/70 hover:bg-gray-600/70 border-2 border-gray-600"
              >
                <X size={32} className="text-gray-300" />
              </Button>
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 border-2 border-pink-500"
              >
                <Heart size={32} className="text-white" />
              </Button>
            </div>

            {/* Grid of other profiles (blurred, one with Match overlay) */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-gray-950 flex-grow">
              {investigatedGender === "Feminino" ? (
                <>
                  {/* Male Profile 1 with Lock */}
                  <div className="relative w-full h-60 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/images/tinder-male-1.jpg"
                      alt="Profile 1"
                      className="w-full h-full object-cover filter blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-900/80 p-3 rounded-full">
                        <Lock size={32} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      <p className="font-semibold text-base">bruninho</p>
                      <span className="bg-gray-700/70 px-2 py-1 rounded-full">29</span>
                      <p className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Online recently...
                      </p>
                    </div>
                  </div>

                  {/* Male Profile 2 with Lock */}
                  <div className="relative w-full h-60 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/images/tinder-male-2.jpg"
                      alt="Profile 2"
                      className="w-full h-full object-cover filter blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-900/80 p-3 rounded-full">
                        <Lock size={32} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      <p className="font-semibold text-base">ricardo</p>
                      <span className="bg-gray-700/70 px-2 py-1 rounded-full">31</span>
                      <p className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Online recently...
                      </p>
                    </div>
                  </div>

                  {/* Male Profile 3 with Lock */}
                  <div className="relative w-full h-60 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/images/tinder-male-3.jpg"
                      alt="Profile 3"
                      className="w-full h-full object-cover filter blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-900/80 p-3 rounded-full">
                        <Lock size={32} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      <p className="font-semibold text-base">alex</p>
                      <span className="bg-gray-700/70 px-2 py-1 rounded-full">27</span>
                      <p className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Online recently...
                      </p>
                    </div>
                  </div>

                  {/* Male Profile 4 with Lock */}
                  <div className="relative w-full h-60 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/images/tinder-male-4.jpg"
                      alt="Profile 4"
                      className="w-full h-full object-cover filter blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-900/80 p-3 rounded-full">
                        <Lock size={32} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      <p className="font-semibold text-base">marcus</p>
                      <span className="bg-gray-700/70 px-2 py-1 rounded-full">30</span>
                      <p className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Online recently...
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Card 1: Female Image 1 with Lock */}
                  <div className="relative w-full h-60 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/images/tinder-female-1.jpg"
                      alt="Profile 1"
                      className="w-full h-full object-cover filter blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-900/80 p-3 rounded-full">
                        <Lock size={32} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      <p className="font-semibold text-base">gabyzinha</p>
                      <span className="bg-gray-700/70 px-2 py-1 rounded-full">26</span>
                      <p className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Online recently...
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Female Image 2 with Lock */}
                  <div className="relative w-full h-60 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/images/tinder-female-2.jpg"
                      alt="Profile 2"
                      className="w-full h-full object-cover filter blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-900/80 p-3 rounded-full">
                        <Lock size={32} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      <p className="font-semibold text-base">renatinha</p>
                      <span className="bg-gray-700/70 px-2 py-1 rounded-full">28</span>
                      <p className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Online recently...
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Female Image 3 with Lock */}
                  <div className="relative w-full h-60 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/images/tinder-female-3.jpg"
                      alt="Profile 3"
                      className="w-full h-full object-cover filter blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-900/80 p-3 rounded-full">
                        <Lock size={32} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      <p className="font-semibold text-base">bruna</p>
                      <span className="bg-gray-700/70 px-2 py-1 rounded-full">25</span>
                      <p className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Online recently...
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Female Image 4 with Lock */}
                  <div className="relative w-full h-60 bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/images/tinder-female-4.jpg"
                      alt="Profile 4"
                      className="w-full h-full object-cover filter blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-900/80 p-3 rounded-full">
                        <Lock size={32} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      <p className="font-semibold text-base">bruna</p>
                      <span className="bg-gray-700/70 px-2 py-1 rounded-full">24</span>
                      <p className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> Online recently...
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-around items-center p-2 bg-gray-900 border-t border-gray-800 flex-shrink-0">
              <div className="flex flex-col items-center text-gray-400">
                <Home size={20} />
                <span className="text-xs">Home</span>
              </div>
              <div className="flex flex-col items-center text-gray-400">
                <Compass size={20} />
                <span className="text-xs">Explore</span>
              </div>
              <div className="relative flex flex-col items-center text-red-500">
                <Heart size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  5
                </span>
                <span className="text-xs">Likes</span>
              </div>
              <div className="flex flex-col items-center text-gray-400">
                <MessageSquare size={20} />
                <span className="text-xs">Chats</span>
              </div>
              <div className="flex flex-col items-center text-gray-400">
                <User size={20} />
                <span className="text-xs">Profile</span>
              </div>
            </div>

            <Button
              onClick={nextStage}
              className="mt-3 px-10 py-5 text-xl font-bold uppercase bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg hover:from-red-700 hover:to-gray-900 transition-all duration-300 transform hover:scale-105 animate-pulse-slow flex-shrink-0"
            >
              ➡️ UNLOCK DETAILS
            </Button>
          </div>
        )
      case 5: // OLD STAGE 3: Revelation
        return (
          <div className="text-center space-y-8">
            <div className="grid gap-3 text-left max-w-xl mx-auto">
              <p className="text-lg md:text-xl text-white animate-fade-in">
                <span className="text-red-400 font-bold">ALERT:</span> Private messages with suggestive content.
              </p>
              <p className="text-lg md:text-xl text-white animate-fade-in-delay-1">
                <span className="text-red-400 font-bold">ALERT:</span> Likes on unknown profiles' photos.
              </p>
              <p className="text-lg md:text-xl text-white animate-fade-in-delay-2">
                <span className="text-red-400 font-bold">ALERT:</span> Old interactions recovered.
              </p>
            </div>
            <Button
              onClick={nextStage}
              className="mt-10 px-10 py-5 text-xl font-bold uppercase bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg hover:from-red-700 hover:to-gray-900 transition-all duration-300 transform hover:scale-105 animate-pulse-slow"
            >
              ➡️ UNLOCK DETAILS
            </Button>
          </div>
        )
      case 6: // OLD STAGE 4: Final CTA
        return (
          <div className="text-center space-y-8">
            <p className="text-3xl md:text-4xl font-bold text-white max-w-2xl mx-auto leading-relaxed animate-fade-in">
              "Want full access to secret profiles, deleted conversations, and like history?"
            </p>
            {timeLeft > 0 ? (
              <p className="text-2xl md:text-3xl font-bold text-yellow-400 animate-pulse">
                Offer ends in: {formatTime(timeLeft)}
              </p>
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-red-500">Offer expired!</p>
            )}
            <Button
              onClick={() =>
                (window.location.href = "https://pay.mycheckoutt.com/01997889-d90f-7176-b1ad-330b2aadd114?ref=")
              }
              disabled={timeLeft === 0}
              className="mt-10 px-10 py-5 text-xl font-bold uppercase bg-gradient-to-r from-red-700 to-black text-white shadow-lg hover:from-red-800 hover:to-gray-900 transition-all duration-300 transform hover:scale-105 animate-pulse-slow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💣 SEE FINAL RESULT
            </Button>

            {/* Random Access Notifications */}
            <div className="mt-8 w-full max-w-md mx-auto text-left space-y-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-lg font-bold text-white mb-3">
                <span className="text-green-400">[LIVE FEED]</span> Recent Accesses:
              </p>
              {randomNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center gap-2 text-sm text-gray-300 animate-fade-in">
                  <ScanEye size={16} className="text-blue-400" />
                  <span className="font-mono">
                    <span className="text-purple-300">{notification.user}</span> {notification.action}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">{notification.time}</span>
                </div>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-black via-gray-900 to-red-900 font-inter">
      {/* Changed font-roboto to font-inter */}
      {/* Background grid pattern */}
      <div
        className={`absolute inset-0 opacity-10 animate-pulse-grid`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fillOpacity='0.2' fillRule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      {/* Content container with transition */}
      <div
        className={`relative z-10 transition-opacity duration-500 ${
          showContent ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {renderStage()}
      </div>
    </div>
  )
}
