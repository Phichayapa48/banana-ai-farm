import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Leaf, LogOut } from "lucide-react";

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Leaf className="w-6 h-6 text-primary" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Banana Expert
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            หน้าหลัก
          </Link>
          <Link to="/detection" className="text-foreground hover:text-primary transition-colors">
            ตรวจสอบพันธุ์
          </Link>
          <Link to="/reservation" className="text-foreground hover:text-primary transition-colors">
            จองกล้วย
          </Link>
          <Link to="/knowledge" className="text-foreground hover:text-primary transition-colors">
            ความรู้
          </Link>
          
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="outline">แดชบอร์ด</Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" size="icon">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline">เข้าสู่ระบบ</Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button>สมัครสมาชิก</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
