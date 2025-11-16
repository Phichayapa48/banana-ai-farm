import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle, XCircle, Clock } from "lucide-react";

interface Reservation {
  id: string;
  quantity: number;
  status: string;
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  farm: {
    name: string;
    location: string;
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    fetchReservations(session.user.id);
  };

  const fetchReservations = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        farm:farms(name, location)
      `)
      .eq("farmer_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReservations(data as any);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "รอยืนยัน", variant: "secondary", icon: Clock },
      confirmed: { label: "ยืนยันแล้ว", variant: "default", icon: CheckCircle },
      shipped: { label: "กำลังจัดส่ง", variant: "default", icon: Package },
      delivered: { label: "ส่งแล้ว", variant: "default", icon: CheckCircle },
      cancelled: { label: "ยกเลิก", variant: "destructive", icon: XCircle },
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    const Icon = statusInfo.icon;

    return (
      <Badge variant={statusInfo.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">แดชบอร์ด</h1>
          <p className="text-muted-foreground">
            ยินดีต้อนรับ {user?.email}
          </p>
        </div>

        <Tabs defaultValue="reservations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reservations">การจองของฉัน</TabsTrigger>
            <TabsTrigger value="profile">โปรไฟล์</TabsTrigger>
          </TabsList>

          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle>รายการจอง</CardTitle>
                <CardDescription>
                  ติดตามสถานะการจองกล้วยของคุณ
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground">กำลังโหลด...</p>
                ) : reservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      คุณยังไม่มีการจอง
                    </p>
                    <Button onClick={() => navigate("/reservation")}>
                      จองกล้วย
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <Card key={reservation.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {reservation.farm.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {reservation.farm.location}
                              </p>
                            </div>
                            {getStatusBadge(reservation.status)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">จำนวน:</span>
                              <span className="ml-2 font-medium">
                                {reservation.quantity} หวี
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">วันที่จอง:</span>
                              <span className="ml-2 font-medium">
                                {new Date(reservation.created_at).toLocaleDateString("th-TH")}
                              </span>
                            </div>
                          </div>

                          {reservation.notes && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                หมายเหตุ: {reservation.notes}
                              </p>
                            </div>
                          )}

                          {reservation.status === "delivered" && (
                            <Button className="w-full mt-4" variant="outline">
                              เขียนรีวิว
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลโปรไฟล์</CardTitle>
                <CardDescription>
                  จัดการข้อมูลส่วนตัวของคุณ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">อีเมล</label>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">สถานะบัญชี</label>
                    <p className="text-muted-foreground">ใช้งานปกติ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
