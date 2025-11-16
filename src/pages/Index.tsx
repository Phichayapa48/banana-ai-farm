import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Search, Calendar, BookOpen, TrendingUp } from "lucide-react";
import heroBanana from "@/assets/hero-banana.png";
import bananaBunch from "@/assets/banana-bunch.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                  Banana Expert
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                ระบบตรวจสอบพันธุ์กล้วยด้วย AI และจองกล้วยจากไร่เกษตรกรไทย
              </p>
              <div className="flex gap-4">
                <Link to="/detection">
                  <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    ตรวจสอบพันธุ์กล้วย
                  </Button>
                </Link>
                <Link to="/reservation">
                  <Button size="lg" variant="outline">
                    จองกล้วย
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroBanana}
                alt="Banana Expert"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">คุณสมบัติหลัก</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <Search className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-bold text-xl mb-2">ตรวจสอบพันธุ์</h3>
                <p className="text-muted-foreground">
                  ใช้ AI ตรวจสอบพันธุ์กล้วยได้อย่างแม่นยำ
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <Calendar className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-bold text-xl mb-2">จองล่วงหน้า</h3>
                <p className="text-muted-foreground">
                  จองกล้วยจากไร่เกษตรกรโดยตรง
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <BookOpen className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-bold text-xl mb-2">คลังความรู้</h3>
                <p className="text-muted-foreground">
                  เรียนรู้เกี่ยวกับพันธุ์กล้วยต่างๆ
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <TrendingUp className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-bold text-xl mb-2">ติดตามสถานะ</h3>
                <p className="text-muted-foreground">
                  ติดตามการส่งและให้รีวิวได้
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <img
              src={bananaBunch}
              alt="Fresh Bananas"
              className="w-full h-auto rounded-xl shadow-lg"
            />
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">
                เกี่ยวกับ Banana Expert
              </h2>
              <p className="text-muted-foreground text-lg">
                Banana Expert เป็นแพลตฟอร์มที่เชื่อมโยงเกษตรกรและผู้บริโภค
                ด้วยเทคโนโลยี AI ที่ช่วยตรวจสอบพันธุ์กล้วยและระบบจองที่ง่ายดาย
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ ตรวจสอบพันธุ์กล้วยด้วย AI ที่แม่นยำ</li>
                <li>✓ จองกล้วยจากไร่เกษตรกรโดยตรง</li>
                <li>✓ ระบบติดตามและรีวิวที่โปร่งใส</li>
                <li>✓ คลังความรู้เกี่ยวกับกล้วยไทย</li>
              </ul>
              <Link to="/knowledge">
                <Button variant="outline" size="lg">
                  เรียนรู้เพิ่มเติม
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="text-lg mb-8 opacity-90">
            สมัครสมาชิกวันนี้และเริ่มใช้งาน Banana Expert
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" variant="secondary">
              สมัครสมาชิกฟรี
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
