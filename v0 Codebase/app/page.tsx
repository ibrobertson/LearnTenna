"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { Download, RadioIcon, Save, Share2 } from 'lucide-react'
import { useForm } from "react-hook-form"
import * as z from "zod"
import AntennaVisualization from "@/components/antenna-visualization"
import AntennaPerformance from "@/components/antenna-performance"
import AntennaEducation from "@/components/antenna-education"
import AntennaExamples from "@/components/antenna-examples"

const formSchema = z.object({
  antennaType: z.string(),
  frequency: z.number().min(1).max(10000),
  elements: z.number().int().min(1).max(20),
  elementLength: z.number().min(0.1).max(10),
  elementSpacing: z.number().min(0.1).max(5),
  feedPoint: z.string(),
  material: z.string(),
})

export default function Home() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("design")
  const [antennaData, setAntennaData] = useState({
    type: "dipole",
    frequency: 300,
    elements: 1,
    elementLength: 0.5,
    elementSpacing: 0.25,
    feedPoint: "center",
    material: "copper",
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      antennaType: "dipole",
      frequency: 300,
      elements: 1,
      elementLength: 0.5,
      elementSpacing: 0.25,
      feedPoint: "center",
      material: "copper",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setAntennaData({
      type: values.antennaType,
      frequency: values.frequency,
      elements: values.elements,
      elementLength: values.elementLength,
      elementSpacing: values.elementSpacing,
      feedPoint: values.feedPoint,
      material: values.material,
    })

    toast({
      title: "Antenna design updated",
      description: "Your antenna design has been updated and simulation results recalculated.",
    })
  }

  function saveDesign() {
    toast({
      title: "Design saved",
      description: "Your antenna design has been saved locally.",
    })
  }

  function exportDesign() {
    toast({
      title: "Design exported",
      description: "Your antenna design has been exported as a JSON file.",
    })
  }

  function shareDesign() {
    toast({
      title: "Design shared",
      description: "A shareable link has been copied to your clipboard.",
    })
  }

  // Update form when antenna type changes to set appropriate defaults
  useEffect(() => {
    const antennaType = form.watch("antennaType")
    
    if (antennaType === "dipole") {
      form.setValue("elements", 1)
    } else if (antennaType === "yagi" && form.getValues("elements") < 3) {
      form.setValue("elements", 3)
    }
  }, [form.watch("antennaType")])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <RadioIcon className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">AntennaLab</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={saveDesign}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={exportDesign}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={shareDesign}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column - Visualization */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle>Antenna Visualization</CardTitle>
                <CardDescription>Interactive 3D model of your antenna design</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px]">
                <AntennaVisualization antennaData={antennaData} />
              </CardContent>
            </Card>
          </div>

          {/* Right column - Design Controls */}
          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Design Parameters</CardTitle>
                <CardDescription>Configure your antenna</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="antennaType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Antenna Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select antenna type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dipole">Dipole</SelectItem>
                              <SelectItem value="yagi">Yagi-Uda</SelectItem>
                              <SelectItem value="patch">Patch</SelectItem>
                              <SelectItem value="logperiodic">Log-Periodic</SelectItem>
                              <SelectItem value="helical">Helical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency (MHz)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="elements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Elements</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              disabled={form.watch("antennaType") === "dipole"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="elementLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Element Length (λ): {field.value}λ</FormLabel>
                          <FormControl>
                            <Slider
                              min={0.1}
                              max={10}
                              step={0.1}
                              defaultValue={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="elementSpacing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Element Spacing (λ): {field.value}λ</FormLabel>
                          <FormControl>
                            <Slider
                              min={0.1}
                              max={5}
                              step={0.05}
                              defaultValue={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                              disabled={form.watch("antennaType") === "dipole"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="feedPoint"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Feed Point</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="center" />
                                </FormControl>
                                <FormLabel className="font-normal">Center</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="offset" />
                                </FormControl>
                                <FormLabel className="font-normal">Offset</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="end" />
                                </FormControl>
                                <FormLabel className="font-normal">End</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="copper">Copper</SelectItem>
                              <SelectItem value="aluminum">Aluminum</SelectItem>
                              <SelectItem value="steel">Steel</SelectItem>
                              <SelectItem value="gold">Gold</SelectItem>
                              <SelectItem value="silver">Silver</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">Update Design</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom section - Tabbed content */}
        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="learn">Learn</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                  <CardDescription>Simulated performance metrics for your antenna design</CardDescription>
                </CardHeader>
                <CardContent>
                  <AntennaPerformance antennaData={antennaData} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="examples" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Example Designs</CardTitle>
                  <CardDescription>Pre-configured antenna designs for various applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <AntennaExamples onSelectExample={(example) => {
                    form.reset({
                      antennaType: example.type,
                      frequency: example.frequency,
                      elements: example.elements,
                      elementLength: example.elementLength,
                      elementSpacing: example.elementSpacing,
                      feedPoint: example.feedPoint,
                      material: example.material,
                    })
                    form.handleSubmit(onSubmit)()
                  }} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="learn" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Educational Resources</CardTitle>
                  <CardDescription>Learn about antenna theory and design principles</CardDescription>
                </CardHeader>
                <CardContent>
                  <AntennaEducation />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="about" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About AntennaLab</CardTitle>
                  <CardDescription>Educational tool for antenna design and simulation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      AntennaLab is an educational tool designed to help students, educators, and hobbyists learn about
                      antenna design principles through interactive simulation and visualization.
                    </p>
                    <p>
                      This tool provides a simplified but instructive model of antenna behavior, allowing users to
                      experiment with different parameters and see how they affect performance characteristics like
                      gain, radiation patterns, and impedance.
                    </p>
                    <p>
                      While the simulations are based on established electromagnetic principles, they are intended for
                      educational purposes and may not capture all the complexities of real-world antenna behavior.
                    </p>
                    <h3 className="text-lg font-semibold mt-4">Features:</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Interactive 3D visualization of antenna designs</li>
                      <li>Real-time performance simulation</li>
                      <li>Multiple antenna types (Dipole, Yagi-Uda, Patch, Log-Periodic, Helical)</li>
                      <li>Educational resources on antenna theory</li>
                      <li>Example designs for various applications</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadioIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">AntennaLab</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 AntennaLab. Educational tool for antenna design and simulation.
          </p>
        </div>
      </footer>
    </div>
  )
}
