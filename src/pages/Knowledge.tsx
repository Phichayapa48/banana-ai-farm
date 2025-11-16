import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Leaf } from "lucide-react";
import bananaBunch from "@/assets/banana-bunch.png";

interface BananaVariety {
  id: string;
  name_th: string;
  name_en: string;
  description: string | null;
  cultivation_tips: string | null;
  benefits: string | null;
  image_url: string | null;
}

export default function Knowledge() {
  const [varieties, setVarieties] = useState<BananaVariety[]>([]);

  useEffect(() => {
    fetchVarieties();
  }, []);

  const fetchVarieties = async () => {
    const { data, error } = await supabase
      .from("banana_varieties")
      .select("*")
      .order("name_th");

    if (!error && data) {
      setVarieties(data);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">คลังความรู้กล้วยไทย</h1>
          <p className="text-muted-foreground text-lg">
            เรียนรู้เกี่ยวกับพันธุ์กล้วยต่างๆ และวิธีการปลูก
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {varieties.map((variety) => (
            <Card key={variety.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-full h-48 bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {variety.image_url ? (
                    <img
                      src={variety.image_url}
                      alt={variety.name_th}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={bananaBunch}
                      alt={variety.name_th}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <CardTitle className="text-xl">
                  {variety.name_th}
                </CardTitle>
                <CardDescription className="text-sm">
                  {variety.name_en}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {variety.description && (
                  <div>
                    <h4 className="font-semibold mb-1 flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-primary" />
                      คำอธิบาย
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {variety.description}
                    </p>
                  </div>
                )}

                {variety.cultivation_tips && (
                  <div>
                    <h4 className="font-semibold mb-1">วิธีการปลูก</h4>
                    <p className="text-sm text-muted-foreground">
                      {variety.cultivation_tips}
                    </p>
                  </div>
                )}

                {variety.benefits && (
                  <div>
                    <h4 className="font-semibold mb-1">ประโยชน์</h4>
                    <p className="text-sm text-muted-foreground">
                      {variety.benefits}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {varieties.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
