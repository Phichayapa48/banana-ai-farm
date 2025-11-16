import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Star } from "lucide-react";
import farmLandscape from "@/assets/farm-landscape.png";
import { useNavigate } from "react-router-dom";

interface Farm {
  id: string;
  name: string;
  description: string;
  location: string;
  image_url: string | null;
  owner_id: string;
}

export default function Reservation() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFarms();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user);
  };

  const fetchFarms = async () => {
    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFarms(data);
    }
  };

  const handleReservation = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบก่อนทำการจอง",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!selectedFarm) {
      toast({
        title: "กรุณาเลือกไร่",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("reservations")
      .insert({
        farmer_id: user.id,
        farm_id: selectedFarm.id,
        quantity,
        notes,
        status: "pending",
      });

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "จองสำเร็จ",
        description: "เจ้าของไร่จะติดต่อกลับภายใน 2 วัน",
      });
      setSelectedFarm(null);
      setQuantity(1);
      setNotes("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">จองกล้วยจากไร่</h1>
          <p className="text-muted-foreground text-lg">
            เลือกไร่ที่คุณต้องการและทำการจองกล้วยได้ทันที
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {farms.map((farm) => (
            <Card
              key={farm.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedFarm?.id === farm.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedFarm(farm)}
            >
              <CardHeader>
                <img
                  src={farm.image_url || farmLandscape}
                  alt={farm.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <CardTitle>{farm.name}</CardTitle>
                <CardDescription>{farm.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{farm.location}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {farms.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">ยังไม่มีไร่ในระบบ</p>
            </CardContent>
          </Card>
        )}

        {selectedFarm && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>ทำการจอง: {selectedFarm.name}</CardTitle>
              <CardDescription>กรอกรายละเอียดการจอง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quantity">จำนวน (หวี)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="notes">หมายเหตุ (ถ้ามี)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ต้องการกล้วยสุกงอม..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleReservation}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "กำลังจอง..." : "ยืนยันการจอง"}
                </Button>
                <Button
                  onClick={() => setSelectedFarm(null)}
                  variant="outline"
                >
                  ยกเลิก
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                หมายเหตุ: เจ้าของไร่ต้องยืนยันการจองภายใน 2 วัน มิฉะนั้นระบบจะยกเลิกอัตโนมัติ
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
