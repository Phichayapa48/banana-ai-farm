import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Detection() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetect = async () => {
    if (!imagePreview) {
      toast({
        title: "กรุณาอัปโหลดรูปภาพ",
        variant: "destructive",
      });
      return;
    }

    setDetecting(true);

    try {
      // Convert base64 → Blob เพื่อส่งไป backend
      const blob = await fetch(imagePreview).then(res => res.blob());
      const formData = new FormData();
      formData.append("file", blob, "banana.jpg");

      // เรียก API บน Railway
      const res = await fetch("https://banana-ai-farm-production.up.railway.app/detect", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("API Error");
      }

      const data = await res.json();

      setResult({
        variety: data.class_name,
        confidence: `${(data.confidence * 100).toFixed(1)}%`,
        description: data.description || "—",
        tips: data.tips || "—",
        benefits: data.benefits || "—",
      });

      toast({
        title: "ตรวจสอบเสร็จสิ้น",
        description: `พบพันธุ์: ${data.class_name}`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับระบบตรวจจับได้",
        variant: "destructive",
      });
    }

    setDetecting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">ตรวจสอบพันธุ์กล้วย</h1>
            <p className="text-muted-foreground text-lg">
              อัปโหลดรูปภาพกล้วยเพื่อให้ AI ตรวจสอบพันธุ์
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>อัปโหลดรูปภาพ</CardTitle>
                <CardDescription>
                  รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 10MB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 rounded-lg"
                      />
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-muted-foreground" />
                        <div>
                          <p className="font-medium">คลิกเพื่ออัปโหลดรูปภาพ</p>
                          <p className="text-sm text-muted-foreground">
                            หรือลากไฟล์มาวางที่นี่
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                <Button
                  onClick={handleDetect}
                  disabled={!imagePreview || detecting}
                  className="w-full"
                >
                  {detecting ? "กำลังตรวจสอบ..." : "ตรวจสอบพันธุ์"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ผลการตรวจสอบ</CardTitle>
                <CardDescription>
                  ข้อมูลเกี่ยวกับพันธุ์กล้วยที่ตรวจพบ
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-xl text-primary mb-2">
                        {result.variety}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ความแม่นยำ: {result.confidence}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">คำอธิบาย</h4>
                      <p className="text-muted-foreground">{result.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">วิธีการปลูก</h4>
                      <p className="text-muted-foreground">{result.tips}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">ประโยชน์</h4>
                      <p className="text-muted-foreground">{result.benefits}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>อัปโหลดรูปภาพเพื่อเริ่มตรวจสอบ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 bg-muted/30">
            <CardHeader>
              <CardTitle>หมายเหตุสำหรับการใช้งาน</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ระบบนี้เชื่อมต่อกับ FastAPI บน Railway โดยตรง  
                สามารถอัปโหลดรูปภาพจริงและตรวจสอบพันธุ์กล้วยได้ทันที
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
