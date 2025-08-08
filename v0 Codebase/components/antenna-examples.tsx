"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight } from 'lucide-react'

interface ExampleAntenna {
  title: string
  description: string
  type: string
  frequency: number
  elements: number
  elementLength: number
  elementSpacing: number
  feedPoint: string
  material: string
  category: string
}

export default function AntennaExamples({ 
  onSelectExample 
}: { 
  onSelectExample: (example: Omit<ExampleAntenna, "title" | "description" | "category">) => void 
}) {
  const [activeCategory, setActiveCategory] = useState("hf")

  const examples: ExampleAntenna[] = [
    // HF Amateur Radio
    {
      title: "20m Dipole",
      description: "Half-wave dipole for 20 meter amateur radio band (14 MHz)",
      type: "dipole",
      frequency: 14.2,
      elements: 1,
      elementLength: 0.5,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "copper",
      category: "hf",
    },
    {
      title: "40m Inverted V",
      description: "Inverted V dipole for 40 meter band, space-efficient design",
      type: "dipole",
      frequency: 7.1,
      elements: 1,
      elementLength: 0.5,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "copper",
      category: "hf",
    },
    {
      title: "10m 3-Element Yagi",
      description: "Compact 3-element Yagi for 10 meter DX work",
      type: "yagi",
      frequency: 28.4,
      elements: 3,
      elementLength: 0.5,
      elementSpacing: 0.2,
      feedPoint: "center",
      material: "aluminum",
      category: "hf",
    },
    {
      title: "80m End-Fed Wire",
      description: "End-fed wire antenna for 80 meter band",
      type: "dipole",
      frequency: 3.75,
      elements: 1,
      elementLength: 0.25,
      elementSpacing: 0.25,
      feedPoint: "end",
      material: "copper",
      category: "hf",
    },
    
    // VHF/UHF Amateur Radio
    {
      title: "2m J-Pole",
      description: "J-pole antenna for 2 meter amateur radio band (144-148 MHz)",
      type: "dipole",
      frequency: 146,
      elements: 1,
      elementLength: 0.75,
      elementSpacing: 0.25,
      feedPoint: "offset",
      material: "copper",
      category: "vhf",
    },
    {
      title: "2m 5-Element Yagi",
      description: "High-gain Yagi for 2 meter weak signal work and EME",
      type: "yagi",
      frequency: 144.1,
      elements: 5,
      elementLength: 0.5,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "aluminum",
      category: "vhf",
    },
    {
      title: "70cm Dipole",
      description: "Simple dipole for 70cm amateur radio band (420-450 MHz)",
      type: "dipole",
      frequency: 435,
      elements: 1,
      elementLength: 0.5,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "copper",
      category: "vhf",
    },
    {
      title: "1.25m Patch",
      description: "Patch antenna for 1.25 meter band (222-225 MHz)",
      type: "patch",
      frequency: 223.5,
      elements: 1,
      elementLength: 0.49,
      elementSpacing: 0.25,
      feedPoint: "offset",
      material: "copper",
      category: "vhf",
    },
    
    // Digital/Data Modes
    {
      title: "Meshtastic 915 MHz",
      description: "Compact antenna for Meshtastic mesh networking (915 MHz ISM)",
      type: "dipole",
      frequency: 915,
      elements: 1,
      elementLength: 0.5,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "copper",
      category: "digital",
    },
    {
      title: "LoRa 433 MHz",
      description: "Quarter-wave monopole for LoRa applications on 70cm band",
      type: "dipole",
      frequency: 433,
      elements: 1,
      elementLength: 0.25,
      elementSpacing: 0.25,
      feedPoint: "end",
      material: "copper",
      category: "digital",
    },
    {
      title: "APRS 144.39 MHz",
      description: "Optimized dipole for APRS packet radio frequency",
      type: "dipole",
      frequency: 144.39,
      elements: 1,
      elementLength: 0.5,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "copper",
      category: "digital",
    },
    {
      title: "FT8 Multi-band",
      description: "Log-periodic for multi-band FT8 digital mode operation",
      type: "logperiodic",
      frequency: 14.074,
      elements: 6,
      elementLength: 0.45,
      elementSpacing: 0.3,
      feedPoint: "end",
      material: "aluminum",
      category: "digital",
    },
    
    // Microwave Amateur Radio
    {
      title: "10 GHz Horn",
      description: "Horn antenna for 10 GHz amateur microwave band",
      type: "patch",
      frequency: 10368,
      elements: 1,
      elementLength: 0.6,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "copper",
      category: "microwave",
    },
    {
      title: "3.4 GHz Patch Array",
      description: "Patch array for 3.4 GHz amateur microwave operations",
      type: "patch",
      frequency: 3400,
      elements: 4,
      elementLength: 0.49,
      elementSpacing: 0.5,
      feedPoint: "center",
      material: "copper",
      category: "microwave",
    },
    {
      title: "5.7 GHz Helical",
      description: "Helical antenna for 5.7 GHz amateur microwave band",
      type: "helical",
      frequency: 5760,
      elements: 8,
      elementLength: 0.25,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "copper",
      category: "microwave",
    },
    {
      title: "24 GHz Dish Feed",
      description: "Patch feed for parabolic dish on 24 GHz amateur band",
      type: "patch",
      frequency: 24048,
      elements: 1,
      elementLength: 0.5,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "gold",
      category: "microwave",
    },
  ]

  return (
    <div className="space-y-4">
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hf">HF Bands</TabsTrigger>
          <TabsTrigger value="vhf">VHF/UHF</TabsTrigger>
          <TabsTrigger value="digital">Digital/Data</TabsTrigger>
          <TabsTrigger value="microwave">Microwave</TabsTrigger>
        </TabsList>
        
        {["hf", "vhf", "digital", "microwave"].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examples
                .filter((example) => example.category === category)
                .map((example, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border">
                    <div className="mb-2">
                      <h3 className="text-lg font-medium">{example.title}</h3>
                      <p className="text-sm text-muted-foreground">{example.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div>
                        <span className="font-medium">Type:</span> {example.type}
                      </div>
                      <div>
                        <span className="font-medium">Frequency:</span> {example.frequency} MHz
                      </div>
                      <div>
                        <span className="font-medium">Elements:</span> {example.elements}
                      </div>
                      <div>
                        <span className="font-medium">Material:</span> {example.material}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => onSelectExample({
                        type: example.type,
                        frequency: example.frequency,
                        elements: example.elements,
                        elementLength: example.elementLength,
                        elementSpacing: example.elementSpacing,
                        feedPoint: example.feedPoint,
                        material: example.material,
                      })}
                    >
                      Load Design
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
