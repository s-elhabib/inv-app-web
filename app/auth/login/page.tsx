"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const fillDemoCredentials = () => {
    setEmail("admin@example.com");
    setPassword("password123");
  };

  const fillSupplierCredentials = () => {
    setEmail("supplier@admin.com");
    setPassword("psw2551");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Successfully logged in");

      // Redirect based on user role
      router.push("/"); // This will trigger the redirection logic in the home page
    } catch (error) {
      toast.error("Failed to login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
        <div className="text-center space-y-2">
          <div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-sm text-primary hover:underline"
            >
              Use admin credentials
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={fillSupplierCredentials}
              className="text-sm text-primary hover:underline"
            >
              Use supplier credentials
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
