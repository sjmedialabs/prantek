"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export default function BrandSettingsPage() {
  const [brandName, setBrandName] = useState("Admin Panel")
  const [brandLogo, setBrandLogo] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const savedName = localStorage.getItem("brandName")
    const savedLogo = localStorage.getItem("brandLogo")
    
    if (savedName) setBrandName(savedName)
    if (savedLogo) setBrandLogo(savedLogo)
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setBrandLogo(reader.result as string)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    localStorage.setItem("brandName", brandName)
    if (brandLogo) {
      localStorage.setItem("brandLogo", brandLogo)
    } else {
      localStorage.removeItem("brandLogo")
    }

    toast({
      title: "Settings saved",
      description: "Brand settings updated successfully",
    })

    window.dispatchEvent(new Event("storage"))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Brand Settings</h1>
        <p className="text-gray-600">Customize your admin panel branding</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Identity</CardTitle>
          <CardDescription>Configure your brand name and logo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter brand name"
            />
          </div>

          <div className="space-y-2">
            <Label>Brand Logo</Label>
            {brandLogo ? (
              <div className="flex items-center space-x-4">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100 border">
                  <Image src={brandLogo} alt="Brand Logo" fill className="object-contain" />
                </div>
                <Button variant="outline" size="sm" onClick={() => setBrandLogo(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logoUpload"
                />
                <Label htmlFor="logoUpload" className="cursor-pointer">
                  <span className="text-purple-600 font-medium">Click to upload</span> or drag and drop
                </Label>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
