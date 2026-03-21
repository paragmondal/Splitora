import QRCode from 'qrcode'

export async function generateQRDataUrl(text) {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#7c3aed',
        light: '#ffffff'
      }
    })
    return dataUrl
  } catch {
    return null
  }
}

export async function downloadQR(text, filename) {
  const dataUrl = await generateQRDataUrl(text)
  if (!dataUrl) return
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
