"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useAuth();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log("Tentando login com e-mail e senha...");
      const { error } = await signIn(email, password);

      if (error) {
        throw new Error(error.message || "E-mail ou senha incorretos");
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Você será redirecionado para o simulador.",
      });

      router.push("/simulator");
    } catch (error: any) {
      console.error("Erro no login com e-mail:", error);
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: error.message || "Não foi possível fazer login. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      console.log("Tentando login com Google...");
      const { error } = await signInWithGoogle();

      if (error) {
        throw new Error(error.message || "Não foi possível fazer login com Google");
      }
    } catch (error: any) {
      console.error("Erro no login Google:", error);
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: error.message || "Não foi possível fazer login com Google. Tente novamente.",
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">Bem-vindo</h1>
        <p className="text-muted-foreground mt-2">
          Entre com sua conta para acessar o simulador.
        </p>
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Login</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Formulário de E-mail e Senha */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar com E-mail
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>

          {/* Login com Google */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar com Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Ainda não tem uma conta?
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/signup">Criar Conta</Link>
            </Button>
          </div>
          <div className="w-full text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Esqueceu a senha?
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/forgot-password">Redefinir Senha</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}