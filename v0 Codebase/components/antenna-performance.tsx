"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AntennaData {
  type: string
  frequency: number
  elements: number
  elementLength: number
  elementSpacing: number
  feedPoint: string
  material: string
}

export default function AntennaPerformance({ antennaData }: { antennaData: AntennaData }) {
  const [activeTab, setActiveTab] = useState("radiation")

  // Calculate wavelength in meters
  const wavelength = 299.792458 / antennaData.frequency // c/f in m

  // Calculate simulated performance metrics based on antenna parameters
  const calculateGain = () => {
    let baseGain = 0
    
    switch (antennaData.type) {
      case "dipole":
        baseGain = 2.15 // Dipole gain in dBi
        break
      case "yagi":
        // Yagi gain increases with number of elements
        baseGain = 3 + 3 * Math.log2(antennaData.elements)
        break
      case "patch":
        baseGain = 6 + antennaData.elementLength * 2
        break
      case "logperiodic":
        baseGain = 7 + antennaData.elements / 2
        break
      case "helical":
        // Helical gain depends on circumference and number of turns
        const circumference = 2 * Math.PI * (antennaData.elementLength / 4)
        baseGain = 10 * Math.log10(15 * (circumference / wavelength) ** 2 * antennaData.elements)
        break
      default:
        baseGain = 2.15
    }
    
    // Material efficiency factor
    const materialEfficiency = {
      copper: 0.95,
      aluminum: 0.9,
      steel: 0.8,
      gold: 0.93,
      silver: 0.97,
    }
    
    const efficiency = materialEfficiency[antennaData.material as keyof typeof materialEfficiency] || 0.9
    
    return baseGain * efficiency
  }

  const gain = calculateGain()
  
  // Calculate SWR based on antenna parameters
  const calculateSWR = () => {
    // Optimal length for resonance is 0.5λ for dipole
    let optimalLength = 0
    
    switch (antennaData.type) {
      case "dipole":
        optimalLength = 0.5
        break
      case "yagi":
        optimalLength = 0.5
        break
      case "patch":
        optimalLength = 0.49
        break
      case "logperiodic":
        optimalLength = 0.45
        break
      case "helical":
        optimalLength = 0.25
        break
      default:
        optimalLength = 0.5
    }
    
    // Calculate how far we are from optimal length
    const lengthRatio = antennaData.elementLength / optimalLength
    const deviation = Math.abs(1 - lengthRatio)
    
    // SWR calculation (simplified model)
    // Perfect match would be 1:1
    let swr = 1 + deviation * 5
    
    // Feed point affects matching
    if (antennaData.feedPoint === "center" && (antennaData.type === "dipole" || antennaData.type === "yagi")) {
      swr *= 0.9 // Better match for center-fed dipoles
    }
    
    return Math.min(10, Math.max(1, swr)) // Clamp between 1 and 10
  }

  const swr = calculateSWR()
  
  // Calculate bandwidth based on antenna type and parameters
  const calculateBandwidth = () => {
    let relativeBandwidth = 0
    
    switch (antennaData.type) {
      case "dipole":
        relativeBandwidth = 0.1 // About 10% of center frequency
        break
      case "yagi":
        relativeBandwidth = 0.05 + 0.01 * antennaData.elements // Narrower bandwidth
        break
      case "patch":
        relativeBandwidth = 0.03 + 0.01 * antennaData.elementLength // Very narrow
        break
      case "logperiodic":
        relativeBandwidth = 0.5 + 0.1 * antennaData.elements // Very wide bandwidth
        break
      case "helical":
        relativeBandwidth = 0.2 + 0.05 * antennaData.elements // Medium bandwidth
        break
      default:
        relativeBandwidth = 0.1
    }
    
    return relativeBandwidth * antennaData.frequency // Return in MHz
  }

  const bandwidth = calculateBandwidth()
  
  // Generate radiation pattern data based on antenna type
  const generateRadiationPattern = () => {
    const points = 16
    const data = []
    
    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points
      let value = 0
      
      switch (antennaData.type) {
        case "dipole":
          // Figure-8 pattern for dipole
          value = Math.abs(Math.sin((angle * Math.PI) / 180)) * gain
          break
        case "yagi":
          // Directional pattern for Yagi
          if (angle > 270 || angle < 90) {
            value = Math.cos((angle * Math.PI) / 180) ** 2 * gain
            if (value < 0) value = 0
          } else {
            value = gain * 0.2 // Back lobe
          }
          break
        case "patch":
          // Hemispherical pattern for patch
          if (angle > 180 && angle < 360) {
            value = Math.cos(((angle - 270) * Math.PI) / 180) ** 2 * gain
            if (value < 0) value = 0
          } else {
            value = gain * 0.1 // Almost no radiation behind ground plane
          }
          break
        case "logperiodic":
          // Directional pattern similar to Yagi but wider
          if (angle > 270 || angle < 90) {
            value = Math.cos((angle * Math.PI) / 180) ** 1.5 * gain
            if (value < 0) value = 0
          } else {
            value = gain * 0.3 // Larger back lobe than Yagi
          }
          break
        case "helical":
          // Highly directional pattern for helical
          if (angle > 315 || angle < 45) {
            value = Math.cos((angle * Math.PI) / 90) ** 3 * gain
            if (value < 0) value = 0
          } else {
            value = gain * 0.1 // Very small side/back lobes
          }
          break
        default:
          value = Math.abs(Math.sin((angle * Math.PI) / 180)) * gain
      }
      
      data.push({
        angle: angle.toString(),
        gain: Math.max(0, value),
      })
    }
    
    return data
  }

  // Generate SWR vs frequency data
  const generateSWRData = () => {
    const points = 21
    const centerFreq = antennaData.frequency
    const freqSpan = bandwidth * 2
    const data = []
    
    for (let i = 0; i < points; i++) {
      const freq = centerFreq - freqSpan / 2 + (i * freqSpan) / (points - 1)
      
      // Calculate frequency deviation from center
      const deviation = Math.abs(freq - centerFreq) / centerFreq
      
      // SWR increases as we move away from center frequency
      let swrValue = swr + deviation * 20
      
      // Add some randomness for realism
      swrValue += (Math.random() - 0.5) * 0.5
      
      data.push({
        frequency: freq.toFixed(1),
        swr: Math.max(1, Math.min(10, swrValue)),
      })
    }
    
    return data
  }

  // Generate impedance vs frequency data
  const generateImpedanceData = () => {
    const points = 21
    const centerFreq = antennaData.frequency
    const freqSpan = bandwidth * 2
    const data = []
    
    // Base impedance depends on antenna type and feed point
    let baseResistance = 73 // Dipole in free space
    
    switch (antennaData.type) {
      case "dipole":
        baseResistance = 73
        break
      case "yagi":
        baseResistance = 50 + 10 * Math.log10(antennaData.elements)
        break
      case "patch":
        baseResistance = 50 + 20 * antennaData.elementLength
        break
      case "logperiodic":
        baseResistance = 60 + 5 * antennaData.elements
        break
      case "helical":
        baseResistance = 140
        break
      default:
        baseResistance = 73
    }
    
    // Feed point adjustment
    if (antennaData.feedPoint === "offset") {
      baseResistance *= 0.8
    } else if (antennaData.feedPoint === "end") {
      baseResistance *= 2.5
    }
    
    for (let i = 0; i < points; i++) {
      const freq = centerFreq - freqSpan / 2 + (i * freqSpan) / (points - 1)
      
      // Calculate frequency deviation from center
      const deviation = (freq - centerFreq) / centerFreq
      
      // Resistance varies less than reactance with frequency
      const resistance = baseResistance * (1 + deviation * 0.5)
      
      // Reactance varies more with frequency and crosses zero at resonance
      const reactance = deviation * baseResistance * 2
      
      data.push({
        frequency: freq.toFixed(1),
        resistance: resistance.toFixed(1),
        reactance: reactance.toFixed(1),
      })
    }
    
    return data
  }

  const radiationData = generateRadiationPattern()
  const swrData = generateSWRData()
  const impedanceData = generateImpedanceData()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="text-sm font-medium mb-1">Gain</div>
          <div className="text-2xl font-bold">{gain.toFixed(2)} dBi</div>
          <div className="text-xs text-muted-foreground">Maximum directional gain</div>
        </div>
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="text-sm font-medium mb-1">SWR</div>
          <div className="text-2xl font-bold">{swr.toFixed(2)}:1</div>
          <div className="text-xs text-muted-foreground">Standing Wave Ratio at {antennaData.frequency} MHz</div>
        </div>
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="text-sm font-medium mb-1">Bandwidth</div>
          <div className="text-2xl font-bold">{bandwidth.toFixed(1)} MHz</div>
          <div className="text-xs text-muted-foreground">Usable frequency range</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="radiation">Radiation Pattern</TabsTrigger>
          <TabsTrigger value="swr">SWR</TabsTrigger>
          <TabsTrigger value="impedance">Impedance</TabsTrigger>
        </TabsList>
        <TabsContent value="radiation" className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="mb-2">
              <h3 className="text-lg font-medium">Radiation Pattern</h3>
              <p className="text-sm text-muted-foreground">Antenna gain (dBi) vs. angle (degrees)</p>
            </div>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  gain: {
                    label: "Gain (dBi)",
                    color: "hsl(var(--chart-1))",
                  },
                }}
              >
                <RadarChart data={radiationData} outerRadius={120}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="angle" />
                  <PolarRadiusAxis angle={90} domain={[0, Math.ceil(gain * 1.2)]} />
                  <Radar name="Gain" dataKey="gain" stroke="var(--color-gain)" fill="var(--color-gain)" fillOpacity={0.6} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadarChart>
              </ChartContainer>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="swr" className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="mb-2">
              <h3 className="text-lg font-medium">SWR vs Frequency</h3>
              <p className="text-sm text-muted-foreground">Standing Wave Ratio across frequency range</p>
            </div>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  swr: {
                    label: "SWR",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={swrData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="frequency" 
                      label={{ value: 'Frequency (MHz)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      domain={[1, 10]} 
                      label={{ value: 'SWR', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="swr" 
                      stroke="var(--color-swr)" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="impedance" className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="mb-2">
              <h3 className="text-lg font-medium">Impedance vs Frequency</h3>
              <p className="text-sm text-muted-foreground">Resistance and reactance across frequency range</p>
            </div>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  resistance: {
                    label: "Resistance (Ω)",
                    color: "hsl(var(--chart-1))",
                  },
                  reactance: {
                    label: "Reactance (Ω)",
                    color: "hsl(var(--chart-3))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={impedanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="frequency" 
                      label={{ value: 'Frequency (MHz)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Impedance (Ω)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="resistance" 
                      name="Resistance" 
                      stroke="var(--color-resistance)" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reactance" 
                      name="Reactance" 
                      stroke="var(--color-reactance)" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-medium mb-2">Performance Summary</h3>
        <div className="space-y-3 text-sm">
          <p>
            This {antennaData.type} antenna design operating at {antennaData.frequency} MHz has a maximum gain of{" "}
            <strong>{gain.toFixed(2)} dBi</strong> and a bandwidth of approximately{" "}
            <strong>{bandwidth.toFixed(1)} MHz</strong>.
          </p>
          
          <p>
            The standing wave ratio (SWR) at the design frequency is <strong>{swr.toFixed(2)}:1</strong>,{" "}
            {swr < 1.5 
              ? "indicating excellent impedance matching to a standard 50Ω transmission line." 
              : swr < 2.5 
                ? "indicating good impedance matching to a standard 50Ω transmission line." 
                : "suggesting that an impedance matching network may be required for optimal performance."}
          </p>
          
          <p>
            {antennaData.type === "dipole" && "The dipole design provides an omnidirectional radiation pattern in the azimuth plane with nulls at the ends of the wire."}
            {antennaData.type === "yagi" && `The Yagi-Uda design with ${antennaData.elements} elements provides a directional radiation pattern with high forward gain and reduced back radiation.`}
            {antennaData.type === "patch" && "The patch antenna provides a hemispherical radiation pattern with minimal back radiation due to the ground plane."}
            {antennaData.type === "logperiodic" && "The log-periodic design provides consistent performance across a wide frequency range with moderate directional gain."}
            {antennaData.type === "helical" && "The helical antenna provides circular polarization and high directional gain, making it suitable for satellite communications."}
          </p>
        </div>
      </div>
    </div>
  )
}
