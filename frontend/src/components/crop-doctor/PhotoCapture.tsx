import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

export default function PhotoCapture({
  photos,
  onChange,
}: {
  photos: string[]
  onChange: (photos: string[]) => void
}) {
  const { t } = useLanguage()
  const [cameraActive, setCameraActive] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setCameraActive(true)
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 100)
    } catch {
      setError(t('cropDoctor.photo.cameraError'))
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    onChange([...photos, dataUrl].slice(0, 3))
    stopCamera()
  }, [photos, onChange, stopCamera])

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      for (const file of files) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string
          onChange([...photos, dataUrl].slice(0, 3))
        }
        reader.readAsDataURL(file)
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [photos, onChange]
  )

  const removePhoto = (index: number) => {
    const next = photos.filter((_, i) => i !== index)
    onChange(next)
    if (currentIndex >= next.length) setCurrentIndex(Math.max(0, next.length - 1))
  }

  return (
    <div className="space-y-3">
      <label className="label">{t('cropDoctor.photo.diseasePhotos')}</label>

      {cameraActive ? (
        <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
            <button type="button" onClick={capturePhoto} className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm" style={{ background: 'white', color: '#111' }}>
              <Camera size={16} /> {t('cropDoctor.photo.capture')}
            </button>
            <button type="button" onClick={stopCamera} className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm" style={{ background: 'rgba(239,68,68,0.9)', color: 'white' }}>
              <X size={16} /> {t('cropDoctor.photo.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          {photos.length > 0 && (
            <div className="relative rounded-xl overflow-hidden flex-1" style={{ aspectRatio: '4/3', background: 'var(--color-surface-2)' }}>
              <img src={photos[currentIndex]} alt="Disease" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3">
                {photos.length > 1 && (
                  <>
                    <button type="button" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
                      className="p-1.5 rounded-full bg-black/50 text-white disabled:opacity-30">
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-white font-medium bg-black/50 px-2 py-0.5 rounded-full">
                      {currentIndex + 1}/{photos.length}
                    </span>
                    <button type="button" onClick={() => setCurrentIndex(Math.min(photos.length - 1, currentIndex + 1))} disabled={currentIndex === photos.length - 1}
                      className="p-1.5 rounded-full bg-black/50 text-white disabled:opacity-30">
                      <ChevronRight size={14} />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => removePhoto(currentIndex)}
                  className="p-1.5 rounded-full bg-red-500/70 text-white">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {photos.length < 3 && (
            <div className="flex flex-col gap-2 justify-center">
              <button type="button" onClick={startCamera}
                className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all"
                style={{ background: 'var(--color-surface-2)', border: '1.5px dashed var(--color-border)', minWidth: 80, minHeight: 80 }}>
                <Camera size={22} style={{ color: 'var(--color-primary)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('cropDoctor.photo.cameraTab')}</span>
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all"
                style={{ background: 'var(--color-surface-2)', border: '1.5px dashed var(--color-border)', minWidth: 80, minHeight: 80 }}>
                <Upload size={22} style={{ color: 'var(--color-primary)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('cropDoctor.photo.uploadTab')}</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {photos.length === 0 ? t('cropDoctor.photo.photoHint') : t('cropDoctor.photo.photoCounter', { n: photos.length })}
      </p>
    </div>
  )
}
