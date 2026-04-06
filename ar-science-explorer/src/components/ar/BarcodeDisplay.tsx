import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeDisplayProps {
  value: number // Barcode ID (0-1023)
}

/**
 * Generates and displays a barcode marker image using CODE128
 * The barcode can be scanned by AR.js barcode detection
 */
export function BarcodeDisplay({ value }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    try {
      // Generate a CODE128 barcode from the barcode value
      // Format: "AR" + ID padded to 4 digits (e.g., "AR0001" for ID 1)
      const barcodeString = `AR${String(value).padStart(4, '0')}`

      JsBarcode(svgRef.current, barcodeString, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      })
    } catch (error) {
      console.error('Barcode generation error:', error)
    }
  }, [value])

  return (
    <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-lg">
      <svg ref={svgRef} />
      <p className="text-[11px] text-muted-foreground text-center">
        Screenshot this barcode and show it to your laptop camera
      </p>
    </div>
  )
}
